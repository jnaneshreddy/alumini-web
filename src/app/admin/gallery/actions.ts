"use server";

import { revalidatePath } from "next/cache";
import { galleryCategories, galleryTypes } from "@/lib/gallery";
import { prisma } from "@/lib/prisma";
import { adminRoles, requireRole } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";

export type GalleryActionResult = { ok: boolean; message: string; id?: string };

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "alumini";
const MAX_IMAGE_BYTES = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);
const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

function enumValue<T extends string>(value: string, values: readonly T[], fallback: T): T {
  return values.includes(value as T) ? value as T : fallback;
}

function refreshGallery() {
  revalidatePath("/");
  revalidatePath("/gallery");
  revalidatePath("/memories");
  revalidatePath("/admin");
  revalidatePath("/admin/gallery");
  revalidatePath("/admin/memories");
  revalidatePath("/admin/activity");
}

export async function uploadGalleryImage(formData: FormData): Promise<GalleryActionResult> {
  const actor = await requireRole(...adminRoles);
  const candidate = formData.get("image");
  if (!(candidate instanceof File) || candidate.size === 0) return { ok: false, message: "Choose an image to upload." };
  if (!ALLOWED_TYPES.has(candidate.type)) return { ok: false, message: "Only JPG, PNG and WEBP images are supported." };
  if (candidate.size > MAX_IMAGE_BYTES) return { ok: false, message: "Image must be smaller than 10 MB." };

  const galleryType = enumValue(text(formData, "galleryType"), galleryTypes, "PHOTO_GALLERY");
  const category = enumValue(text(formData, "category"), galleryCategories, "SCHOOL_MEMORIES");
  const extension = candidate.type === "image/png" ? "png" : candidate.type === "image/webp" ? "webp" : "jpg";
  const storagePath = `gallery/${galleryType.toLowerCase()}/${crypto.randomUUID()}.${extension}`;
  const supabase = createAdminClient();
  const { error: uploadError } = await supabase.storage.from(BUCKET).upload(storagePath, candidate, {
    contentType: candidate.type,
    cacheControl: "31536000",
    upsert: false,
  });
  if (uploadError) return { ok: false, message: `Unable to upload this image: ${uploadError.message}` };

  try {
    const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
    const dateText = text(formData, "date");
    const parsedDate = dateText ? new Date(`${dateText}T00:00:00`) : null;
    const record = await prisma.galleryImage.create({
      data: {
        titleEn: text(formData, "titleEn") || candidate.name.replace(/\.[^.]+$/, ""),
        titleKn: text(formData, "titleKn") || null,
        descriptionEn: text(formData, "descriptionEn") || null,
        descriptionKn: text(formData, "descriptionKn") || null,
        altText: text(formData, "altText") || text(formData, "titleEn") || candidate.name.replace(/\.[^.]+$/, ""),
        imageUrl: data.publicUrl,
        storagePath,
        category,
        galleryType,
        eventId: text(formData, "eventId") || null,
        date: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null,
        isFeatured: formData.get("isFeatured") === "on",
        isPublished: formData.get("isPublished") === "on",
        sortOrder: Number.parseInt(text(formData, "sortOrder") || "0", 10) || 0,
        uploadedById: actor.id,
      },
    });
    await prisma.auditLog.create({ data: { userId: actor.id, action: "GALLERY_IMAGE_UPLOADED", entityType: "GalleryImage", entityId: record.id, newData: { galleryType, category, fileName: candidate.name } } });
    refreshGallery();
    return { ok: true, message: "Upload complete.", id: record.id };
  } catch (error) {
    await supabase.storage.from(BUCKET).remove([storagePath]);
    return { ok: false, message: error instanceof Error ? error.message : "Unable to upload this image. Please try again." };
  }
}

export async function updateGalleryImage(formData: FormData): Promise<GalleryActionResult> {
  const actor = await requireRole(...adminRoles);
  const id = text(formData, "id");
  const existing = id ? await prisma.galleryImage.findUnique({ where: { id } }) : null;
  if (!existing) return { ok: false, message: "Photo not found." };
  const galleryType = enumValue(text(formData, "galleryType"), galleryTypes, existing.galleryType);
  const category = enumValue(text(formData, "category"), galleryCategories, existing.category);
  const dateText = text(formData, "date");
  const parsedDate = dateText ? new Date(`${dateText}T00:00:00`) : null;
  const updated = await prisma.galleryImage.update({
    where: { id },
    data: {
      titleEn: text(formData, "titleEn") || null,
      titleKn: text(formData, "titleKn") || null,
      descriptionEn: text(formData, "descriptionEn") || null,
      descriptionKn: text(formData, "descriptionKn") || null,
      altText: text(formData, "altText") || existing.altText,
      category,
      galleryType,
      eventId: text(formData, "eventId") || null,
      date: parsedDate && !Number.isNaN(parsedDate.getTime()) ? parsedDate : null,
      isFeatured: formData.get("isFeatured") === "on",
      isPublished: formData.get("isPublished") === "on",
      sortOrder: Number.parseInt(text(formData, "sortOrder") || "0", 10) || 0,
    },
  });
  await prisma.auditLog.create({ data: { userId: actor.id, action: "GALLERY_IMAGE_UPDATED", entityType: "GalleryImage", entityId: id, oldData: { titleEn: existing.titleEn, titleKn: existing.titleKn, descriptionEn: existing.descriptionEn, descriptionKn: existing.descriptionKn, altText: existing.altText, galleryType: existing.galleryType, category: existing.category, eventId: existing.eventId, date: existing.date?.toISOString() ?? null, isFeatured: existing.isFeatured, isPublished: existing.isPublished, sortOrder: existing.sortOrder }, newData: { titleEn: updated.titleEn, titleKn: updated.titleKn, descriptionEn: updated.descriptionEn, descriptionKn: updated.descriptionKn, altText: updated.altText, galleryType: updated.galleryType, category: updated.category, eventId: updated.eventId, date: updated.date?.toISOString() ?? null, isFeatured: updated.isFeatured, isPublished: updated.isPublished, sortOrder: updated.sortOrder } } });
  refreshGallery();
  return { ok: true, message: "Photo details saved." };
}

export async function deleteGalleryImage(formData: FormData): Promise<GalleryActionResult> {
  const actor = await requireRole(...adminRoles);
  const id = text(formData, "id");
  const image = id ? await prisma.galleryImage.findUnique({ where: { id } }) : null;
  if (!image) return { ok: false, message: "Photo not found." };
  await prisma.$transaction([
    prisma.auditLog.create({ data: { userId: actor.id, action: "GALLERY_IMAGE_DELETED", entityType: "GalleryImage", entityId: id, oldData: { titleEn: image.titleEn, storagePath: image.storagePath, galleryType: image.galleryType } } }),
    prisma.galleryImage.delete({ where: { id } }),
  ]);
  if (image.storagePath) await createAdminClient().storage.from(BUCKET).remove([image.storagePath]);
  refreshGallery();
  return { ok: true, message: "Photo deleted." };
}
