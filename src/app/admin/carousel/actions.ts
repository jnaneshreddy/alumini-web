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

async function saveUploadedImage(file: File | null, existingPath?: string) {
  if (!file || file.size === 0) {
    return existingPath || "";
  }

  const extension = file.name.includes(".") ? file.name.slice(file.name.lastIndexOf(".")) : ".png";
  const objectKey = `carousel/${crypto.randomUUID()}${extension}`;
  const supabase = getStorageClient();

  const { error } = await supabase.storage.from(SUPABASE_BUCKET).upload(objectKey, file, {
    upsert: true,
    contentType: file.type || "application/octet-stream",
  });

  if (error) {
    throw new Error(`Image upload failed: ${error.message}`);
  }

  const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(objectKey);

  if (!data?.publicUrl) {
    throw new Error("Image upload succeeded but the public URL could not be generated.");
  }

  if (existingPath) {
    const existingKey = getStorageObjectKey(existingPath);
    if (existingKey) {
      await supabase.storage.from(SUPABASE_BUCKET).remove([existingKey]).catch(() => undefined);
    }
  }

  return data.publicUrl;
}

export type CarouselActionResult = { ok: boolean; message: string };

export async function saveCarouselSlide(formData: FormData): Promise<CarouselActionResult> {
  const actor = await requireRole(...contentRoles);

  const id = text(formData, "id");
  const title = text(formData, "title");
  const altText = text(formData, "altText");
  const caption = text(formData, "caption");
  const positionText = text(formData, "position");
  const status = text(formData, "status") || "PUBLISHED";
  const providedUrl = text(formData, "imagePath");
  const uploadedFile = formData.get("imageFile");
  const file = uploadedFile instanceof File && uploadedFile.size > 0 ? uploadedFile : null;

  if (!title || !altText) {
    return { ok: false, message: "Title and accessible description are required." };
  }

  if (!file && !providedUrl) {
    return { ok: false, message: "Upload a photo or paste an image URL." };
  }

  const existingSlide = id ? await prisma.carouselSlide.findUnique({ where: { id } }) : null;
  const finalImagePath = file ? await saveUploadedImage(file, existingSlide?.imagePath) : providedUrl;

  const normalizedPosition = Number.parseInt(positionText || "0", 10);

  const payload = {
    title,
    imagePath: finalImagePath,
    altText,
    caption: caption || null,
    status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED",
    position: Number.isFinite(normalizedPosition) ? normalizedPosition : 0,
  };

  const slide = id
    ? await prisma.carouselSlide.update({ where: { id }, data: payload })
    : await prisma.carouselSlide.create({ data: payload });
  await prisma.auditLog.create({
    data: {
      userId: actor.id,
      action: existingSlide ? "CAROUSEL_SLIDE_UPDATED" : "CAROUSEL_SLIDE_CREATED",
      entityType: "CarouselSlide",
      entityId: slide.id,
      oldData: existingSlide ? { title: existingSlide.title, altText: existingSlide.altText, caption: existingSlide.caption, imagePath: existingSlide.imagePath, status: existingSlide.status, position: existingSlide.position } : undefined,
      newData: { title: slide.title, altText: slide.altText, caption: slide.caption, imagePath: slide.imagePath, status: slide.status, position: slide.position },
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/carousel");
  revalidatePath("/admin/activity");
  return { ok: true, message: id ? "Carousel slide updated successfully. You can now add a new slide." : "Carousel slide created successfully." };
}

export async function submitCarouselSlide(formData: FormData): Promise<void> {
  await saveCarouselSlide(formData);
}

export async function deleteCarouselSlide(formData: FormData) {
  const actor = await requireRole(...contentRoles);

  const id = text(formData, "id");

  if (!id) {
    return;
  }

  const slide = await prisma.carouselSlide.findUnique({ where: { id } });

  if (slide?.imagePath) {
    const imageKey = getStorageObjectKey(slide.imagePath);
    if (imageKey) {
      const supabase = getStorageClient();
      await supabase.storage.from(SUPABASE_BUCKET).remove([imageKey]).catch(() => undefined);
    }
  }

  if (!slide) return;
  await prisma.$transaction([
    prisma.auditLog.create({ data: { userId: actor.id, action: "CAROUSEL_SLIDE_DELETED", entityType: "CarouselSlide", entityId: id, oldData: { title: slide.title, status: slide.status, position: slide.position } } }),
    prisma.carouselSlide.delete({ where: { id } }),
  ]);

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/carousel");
  revalidatePath("/admin/activity");
}
