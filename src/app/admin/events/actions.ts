"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { prisma } from "@/lib/prisma";
import { contentRoles, requireRole } from "@/lib/permissions";

const text = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();

const SUPABASE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "alumini";

function getStorageClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Supabase URL or service role key is missing.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

function getStorageObjectKey(imagePath?: string | null) {
  if (!imagePath) {
    return null;
  }

  try {
    const parsed = new URL(imagePath);
    const match = decodeURIComponent(parsed.pathname).match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
    return match ? match[1] : null;
  } catch {
    return imagePath.replace(/^\/+/, "").replace(/^public\//, "");
  }
}

async function saveUploadedImage(file: File | null, existingPath?: string | null) {
  if (!file || file.size === 0) {
    return existingPath || "";
  }

  const extension = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : ".png";
  const objectKey = `events/${crypto.randomUUID()}${extension}`;
  const supabase = getStorageClient();

  const { error } = await supabase.storage.from(SUPABASE_BUCKET).upload(objectKey, file, {
    upsert: true,
    contentType: file.type || "application/octet-stream",
  });

  if (error) {
    throw new Error(`Event image upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(objectKey);

  if (!data?.publicUrl) {
    throw new Error("Event image upload succeeded but the public URL could not be generated.");
  }

  if (existingPath) {
    const existingKey = getStorageObjectKey(existingPath);
    if (existingKey) {
      await supabase.storage.from(SUPABASE_BUCKET).remove([existingKey]).catch(() => undefined);
    }
  }

  return data.publicUrl;
}

export type EventActionResult = { ok: boolean; message: string };

export async function saveEvent(formData: FormData): Promise<EventActionResult> {
  try {
    const actor = await requireRole(...contentRoles);

    const id = text(formData, "id");
    const title = text(formData, "title");
    const titleKn = text(formData, "titleKn");
    const description = text(formData, "description");
    const descriptionKn = text(formData, "descriptionKn");
    const eventDate = text(formData, "eventDate");
    const startTime = text(formData, "startTime");
    const endTime = text(formData, "endTime");
    const venue = text(formData, "venue");
    const venueKn = text(formData, "venueKn");
    const status = text(formData, "status") || "UPCOMING";
    const publication = text(formData, "publication") || "DRAFT";
    const providedImagePath = text(formData, "imagePath");
    const uploadedFile = formData.get("imageFile");
    const file = uploadedFile instanceof File && uploadedFile.size > 0 ? uploadedFile : null;

    if (!title || !eventDate) {
      return { ok: false, message: "Event title and date are required." };
    }

    const parsedDate = new Date(eventDate);
    if (Number.isNaN(parsedDate.getTime())) {
      return { ok: false, message: "Enter a valid event date." };
    }

    const existingEvent = id ? await prisma.event.findUnique({ where: { id } }) : null;

    const finalImagePath = file
      ? await saveUploadedImage(file, existingEvent?.imagePath)
      : providedImagePath || existingEvent?.imagePath || null;

    const payload = {
      title,
      titleKn: titleKn || null,
      description: description || null,
      descriptionKn: descriptionKn || null,
      eventDate: parsedDate,
      startTime: startTime || null,
      endTime: endTime || null,
      venue: venue || null,
      venueKn: venueKn || null,
      imagePath: finalImagePath || null,
      status: status as "UPCOMING" | "COMPLETED" | "CANCELLED",
      publication: publication as "DRAFT" | "PUBLISHED" | "ARCHIVED",
    };

    const event = id
      ? await prisma.event.update({ where: { id }, data: payload })
      : await prisma.event.create({ data: payload });
    await prisma.auditLog.create({
      data: {
        userId: actor.id,
        action: existingEvent ? "EVENT_UPDATED" : "EVENT_CREATED",
        entityType: "Event",
        entityId: event.id,
        oldData: existingEvent ? { title: existingEvent.title, titleKn: existingEvent.titleKn, description: existingEvent.description, descriptionKn: existingEvent.descriptionKn, eventDate: existingEvent.eventDate.toISOString(), startTime: existingEvent.startTime, endTime: existingEvent.endTime, venue: existingEvent.venue, venueKn: existingEvent.venueKn, imagePath: existingEvent.imagePath, status: existingEvent.status, publication: existingEvent.publication } : undefined,
        newData: { title: event.title, titleKn: event.titleKn, description: event.description, descriptionKn: event.descriptionKn, eventDate: event.eventDate.toISOString(), startTime: event.startTime, endTime: event.endTime, venue: event.venue, venueKn: event.venueKn, imagePath: event.imagePath, status: event.status, publication: event.publication },
      },
    });

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/events");
    revalidatePath("/admin/activity");
    return { ok: true, message: id ? "Event updated successfully. You can now create a new event." : "Event created successfully." };
  } catch (error) {
    console.error("saveEvent failed", error);
    return { ok: false, message: error instanceof Error ? error.message : "Unable to save the event. Please try again." };
  }
}

export async function deleteEvent(formData: FormData) {
  try {
    const actor = await requireRole(...contentRoles);

    const id = text(formData, "id");

    if (!id) {
      return;
    }

    const event = await prisma.event.findUnique({ where: { id } });

    if (event?.imagePath) {
      const imageKey = getStorageObjectKey(event.imagePath);
      if (imageKey) {
        const supabase = getStorageClient();
        await supabase.storage.from(SUPABASE_BUCKET).remove([imageKey]).catch(() => undefined);
      }
    }

    if (!event) return;
    await prisma.$transaction([
      prisma.auditLog.create({ data: { userId: actor.id, action: "EVENT_DELETED", entityType: "Event", entityId: id, oldData: { title: event.title, eventDate: event.eventDate.toISOString(), status: event.status, publication: event.publication } } }),
      prisma.event.delete({ where: { id } }),
    ]);

    revalidatePath("/");
    revalidatePath("/admin");
    revalidatePath("/admin/events");
    revalidatePath("/admin/activity");
  } catch (error) {
    console.error("deleteEvent failed", error);
    return;
  }
}
