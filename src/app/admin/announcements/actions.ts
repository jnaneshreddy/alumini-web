"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { contentRoles, requireRole } from "@/lib/permissions";

const text = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();
export type AnnouncementActionResult = { ok: boolean; message: string };

export async function saveAnnouncement(formData: FormData): Promise<AnnouncementActionResult> {
  await requireRole(...contentRoles);

  const id = text(formData, "id");
  const title = text(formData, "title");
  const titleKn = text(formData, "titleKn");
  const body = text(formData, "body");
  const bodyKn = text(formData, "bodyKn");
  const priority = text(formData, "priority") || "GENERAL";
  const status = text(formData, "status") || "DRAFT";
  const publishedAtValue = text(formData, "publishedAt");

  if (!title || !body) {
    return { ok: false, message: "Title and announcement text are required." };
  }

  const publishedAt = publishedAtValue ? new Date(publishedAtValue) : status === "PUBLISHED" ? new Date() : null;

  const payload = {
    title,
    titleKn: titleKn || null,
    body,
    bodyKn: bodyKn || null,
    priority,
    status: status as "DRAFT" | "PUBLISHED" | "ARCHIVED",
    publishedAt,
  };

  if (id) {
    await prisma.announcement.update({
      where: { id },
      data: payload,
    });
  } else {
    await prisma.announcement.create({
      data: payload,
    });
  }

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/announcements");
  return { ok: true, message: id ? "Announcement updated successfully. You can now create a new announcement." : "Announcement created successfully." };
}

export async function submitAnnouncement(formData: FormData): Promise<void> {
  await saveAnnouncement(formData);
}

export async function deleteAnnouncement(formData: FormData) {
  await requireRole(...contentRoles);

  const id = text(formData, "id");

  if (!id) {
    return;
  }

  await prisma.announcement.delete({ where: { id } });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/announcements");
}
