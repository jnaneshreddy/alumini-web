"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { contentRoles, requireRole } from "@/lib/permissions";

const text = (formData: FormData, name: string) => String(formData.get(name) ?? "").trim();
export type AnnouncementActionResult = { ok: boolean; message: string };

export async function saveAnnouncement(formData: FormData): Promise<AnnouncementActionResult> {
  const actor = await requireRole(...contentRoles);

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

  const existing = id ? await prisma.announcement.findUnique({ where: { id } }) : null;
  const announcement = id
    ? await prisma.announcement.update({ where: { id }, data: payload })
    : await prisma.announcement.create({ data: payload });
  await prisma.auditLog.create({
    data: {
      userId: actor.id,
      action: existing ? "ANNOUNCEMENT_UPDATED" : "ANNOUNCEMENT_CREATED",
      entityType: "Announcement",
      entityId: announcement.id,
      oldData: existing ? { title: existing.title, titleKn: existing.titleKn, body: existing.body, bodyKn: existing.bodyKn, priority: existing.priority, status: existing.status, publishedAt: existing.publishedAt?.toISOString() ?? null } : undefined,
      newData: { title: announcement.title, titleKn: announcement.titleKn, body: announcement.body, bodyKn: announcement.bodyKn, priority: announcement.priority, status: announcement.status, publishedAt: announcement.publishedAt?.toISOString() ?? null },
    },
  });

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/announcements");
  revalidatePath("/admin/activity");
  return { ok: true, message: id ? "Announcement updated successfully. You can now create a new announcement." : "Announcement created successfully." };
}

export async function submitAnnouncement(formData: FormData): Promise<void> {
  await saveAnnouncement(formData);
}

export async function deleteAnnouncement(formData: FormData) {
  const actor = await requireRole(...contentRoles);

  const id = text(formData, "id");

  if (!id) {
    return;
  }

  const announcement = await prisma.announcement.findUnique({ where: { id } });
  if (!announcement) return;
  await prisma.$transaction([
    prisma.auditLog.create({ data: { userId: actor.id, action: "ANNOUNCEMENT_DELETED", entityType: "Announcement", entityId: id, oldData: { title: announcement.title, status: announcement.status } } }),
    prisma.announcement.delete({ where: { id } }),
  ]);

  revalidatePath("/");
  revalidatePath("/admin");
  revalidatePath("/admin/announcements");
  revalidatePath("/admin/activity");
}
