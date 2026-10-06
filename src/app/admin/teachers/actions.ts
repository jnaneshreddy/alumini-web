"use server";

import { revalidatePath } from "next/cache";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { adminRoles, requireRole } from "@/lib/permissions";
import { createAdminClient } from "@/lib/supabase/admin";
import { MAX_TEACHER_IMAGE_SIZE_MB, validateTeacherImage } from "@/lib/teacher-images";
import { validateTeacherTenure } from "@/lib/teacher-tenure";

export type TeacherActionResult = { ok: boolean; message: string; id?: string };

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "alumini";
const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

function refreshTeachers() {
  revalidatePath("/");
  revalidatePath("/teachers");
  revalidatePath("/admin");
  revalidatePath("/admin/teachers");
  revalidatePath("/admin/activity");
}

type TeacherInput = {
  nameEn: string; nameKn: string | null; designationEn: string; designationKn: string | null;
  descriptionEn: string | null; descriptionKn: string | null; startYear: number; endYear: number | null;
  isCurrent: boolean; isPublished: boolean; sortOrder: number;
};

function readTeacher(formData: FormData): { ok: true; data: TeacherInput } | { ok: false; error: string } {
  const nameEn = text(formData, "nameEn");
  const designationEn = text(formData, "designationEn");
  const isCurrent = formData.get("isCurrent") === "on";
  if (!nameEn || !designationEn) return { ok: false, error: "English name and designation are required." };
  const tenure = validateTeacherTenure(text(formData, "startYear"), text(formData, "endYear"), isCurrent);
  if (!tenure.ok) return { ok: false, error: tenure.message };
  return { ok: true, data: {
    nameEn,
    nameKn: text(formData, "nameKn") || null,
    designationEn,
    designationKn: text(formData, "designationKn") || null,
    descriptionEn: text(formData, "descriptionEn") || null,
    descriptionKn: text(formData, "descriptionKn") || null,
    startYear: tenure.startYear,
    endYear: tenure.endYear,
    isCurrent,
    isPublished: formData.get("isPublished") === "on",
    sortOrder: Number.parseInt(text(formData, "sortOrder") || "0", 10) || 0,
  } };
}

function validateImage(candidate: FormDataEntryValue | null, required: boolean): candidate is File {
  const file = candidate instanceof File ? candidate : null;
  const validationError = validateTeacherImage(file, required);
  if (validationError) throw new Error(validationError);
  if (!file || file.size === 0) return false;
  return true;
}

async function uploadImage(file: File) {
  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const storagePath = `teachers/${crypto.randomUUID()}.${extension}`;
  const supabase = createAdminClient();
  const { error } = await supabase.storage.from(BUCKET).upload(storagePath, file, { contentType: file.type, cacheControl: "31536000", upsert: false });
  if (error) throw new Error(`Unable to upload this photograph: ${error.message}`);
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(storagePath);
  return { storagePath, imageUrl: data.publicUrl };
}

export async function createTeacher(formData: FormData): Promise<TeacherActionResult> {
  const actor = await requireRole(...adminRoles);
  const parsed = readTeacher(formData);
  if (!parsed.ok) return { ok: false, message: parsed.error };
  const candidate = formData.get("image");
  try { validateImage(candidate, true); } catch (error) { return { ok: false, message: error instanceof Error ? error.message : "Invalid photograph." }; }
  let upload: Awaited<ReturnType<typeof uploadImage>> | null = null;
  try {
    upload = await uploadImage(candidate as File);
    const teacher = await prisma.teacher.create({ data: { ...parsed.data, ...upload, createdById: actor.id, updatedById: actor.id } });
    await prisma.auditLog.create({ data: { userId: actor.id, action: "TEACHER_CREATED", entityType: "Teacher", entityId: teacher.id, newData: { nameEn: teacher.nameEn, designationEn: teacher.designationEn, startYear: teacher.startYear, endYear: teacher.endYear, isCurrent: teacher.isCurrent, isPublished: teacher.isPublished } } });
    refreshTeachers();
    return { ok: true, message: "Teacher profile created.", id: teacher.id };
  } catch (error) {
    if (upload) await createAdminClient().storage.from(BUCKET).remove([upload.storagePath]);
    return { ok: false, message: error instanceof Error ? error.message : `Unable to save the teacher. Images must be smaller than ${MAX_TEACHER_IMAGE_SIZE_MB} MB.` };
  }
}

export async function updateTeacher(formData: FormData): Promise<TeacherActionResult> {
  const actor = await requireRole(...adminRoles);
  const id = text(formData, "id");
  const existing = id ? await prisma.teacher.findUnique({ where: { id } }) : null;
  if (!existing) return { ok: false, message: "Teacher profile not found." };
  const parsed = readTeacher(formData);
  if (!parsed.ok) return { ok: false, message: parsed.error };
  const candidate = formData.get("image");
  const removeImage = formData.get("removeImage") === "on";
  try { validateImage(candidate, false); } catch (error) { return { ok: false, message: error instanceof Error ? error.message : "Invalid photograph." }; }
  let upload: Awaited<ReturnType<typeof uploadImage>> | null = null;
  try {
    if (candidate instanceof File && candidate.size > 0) upload = await uploadImage(candidate);
    const imageUrl = upload?.imageUrl ?? (removeImage ? "" : existing.imageUrl);
    const storagePath = upload?.storagePath ?? (removeImage ? null : existing.storagePath);
    const nextPublished = imageUrl ? parsed.data.isPublished : false;
    const teacher = await prisma.teacher.update({ where: { id }, data: { ...parsed.data, isPublished: nextPublished, imageUrl, storagePath, updatedById: actor.id } });
    const actionLogs: Prisma.AuditLogCreateManyInput[] = [{ userId: actor.id, action: "TEACHER_UPDATED", entityType: "Teacher", entityId: id, oldData: { nameEn: existing.nameEn, nameKn: existing.nameKn, designationEn: existing.designationEn, designationKn: existing.designationKn, descriptionEn: existing.descriptionEn, descriptionKn: existing.descriptionKn, startYear: existing.startYear, endYear: existing.endYear, isCurrent: existing.isCurrent, isPublished: existing.isPublished, sortOrder: existing.sortOrder, imageUrl: existing.imageUrl }, newData: { nameEn: teacher.nameEn, nameKn: teacher.nameKn, designationEn: teacher.designationEn, designationKn: teacher.designationKn, descriptionEn: teacher.descriptionEn, descriptionKn: teacher.descriptionKn, startYear: teacher.startYear, endYear: teacher.endYear, isCurrent: teacher.isCurrent, isPublished: teacher.isPublished, sortOrder: teacher.sortOrder, imageUrl: teacher.imageUrl } }];
    if (existing.isPublished !== teacher.isPublished) actionLogs.push({ userId: actor.id, action: teacher.isPublished ? "TEACHER_PUBLISHED" : "TEACHER_UNPUBLISHED", entityType: "Teacher", entityId: id, oldData: { isPublished: existing.isPublished }, newData: { isPublished: teacher.isPublished } });
    if (existing.isCurrent !== teacher.isCurrent) actionLogs.push({ userId: actor.id, action: teacher.isCurrent ? "TEACHER_MARKED_CURRENT" : "TEACHER_MARKED_FORMER", entityType: "Teacher", entityId: id, oldData: { isCurrent: existing.isCurrent }, newData: { isCurrent: teacher.isCurrent } });
    if (upload || removeImage) actionLogs.push({ userId: actor.id, action: "TEACHER_IMAGE_UPDATED", entityType: "Teacher", entityId: id, oldData: { storagePath: existing.storagePath }, newData: { storagePath } });
    await prisma.auditLog.createMany({ data: actionLogs });
    if ((upload || removeImage) && existing.storagePath) await createAdminClient().storage.from(BUCKET).remove([existing.storagePath]);
    refreshTeachers();
    return { ok: true, message: imageUrl ? "Teacher profile updated." : "Photograph removed. The profile was saved as a draft." };
  } catch (error) {
    if (upload) await createAdminClient().storage.from(BUCKET).remove([upload.storagePath]);
    return { ok: false, message: error instanceof Error ? error.message : "Unable to update this teacher profile." };
  }
}

export async function deleteTeacher(formData: FormData): Promise<TeacherActionResult> {
  const actor = await requireRole(...adminRoles);
  const id = text(formData, "id");
  const teacher = id ? await prisma.teacher.findUnique({ where: { id } }) : null;
  if (!teacher) return { ok: false, message: "Teacher profile not found." };
  await prisma.$transaction([
    prisma.auditLog.create({ data: { userId: actor.id, action: "TEACHER_DELETED", entityType: "Teacher", entityId: id, oldData: { nameEn: teacher.nameEn, designationEn: teacher.designationEn, storagePath: teacher.storagePath } } }),
    prisma.teacher.delete({ where: { id } }),
  ]);
  if (teacher.storagePath) await createAdminClient().storage.from(BUCKET).remove([teacher.storagePath]);
  refreshTeachers();
  return { ok: true, message: "Teacher profile deleted." };
}
