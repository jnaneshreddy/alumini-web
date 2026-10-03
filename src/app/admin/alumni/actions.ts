"use server";

import { revalidatePath } from "next/cache";
import type { AlumniRegistrantType, AlumniVerificationStatus } from "@prisma/client";
import { notifyAdmins } from "@/lib/admin-notifications";
import { prisma } from "@/lib/prisma";
import { adminRoles, requireRole } from "@/lib/permissions";

export type AlumniActionResult = { ok: boolean; message: string; id?: string };
const statuses: AlumniVerificationStatus[] = ["PENDING", "VERIFIED", "REJECTED"];
const registrantTypes: AlumniRegistrantType[] = ["ALUMNI", "STUDENT", "TEACHER"];
const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();

function refreshAlumni() {
  revalidatePath("/admin");
  revalidatePath("/admin/alumni");
  revalidatePath("/admin/activity");
}

export async function saveAlumniProfile(formData: FormData): Promise<AlumniActionResult> {
  const actor = await requireRole(...adminRoles);
  const id = text(formData, "id");
  const fullName = text(formData, "fullName");
  const registrantType = (text(formData, "registrantType") || "ALUMNI") as AlumniRegistrantType;
  const email = text(formData, "email").toLowerCase();
  const phone = text(formData, "phone");
  const batch = text(formData, "batch");
  const yearText = text(formData, "graduationYear");
  const graduationYear = yearText ? Number.parseInt(yearText, 10) : null;
  const existing = id ? await prisma.alumniProfile.findUnique({ where: { id } }) : null;
  const verificationStatus = (text(formData, "verificationStatus") || existing?.verificationStatus || "PENDING") as AlumniVerificationStatus;
  const consentToPublish = formData.has("consentToPublish") ? formData.get("consentToPublish") === "on" : (existing?.consentToPublish ?? false);
  const requestedPublished = formData.has("isPublished") ? formData.get("isPublished") === "on" : (existing?.isPublished ?? false);

  if (fullName.length < 2 || !batch || !email || !phone || graduationYear === null) return { ok: false, message: "Name, email, phone, batch and graduation year are required." };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return { ok: false, message: "Enter a valid email address." };
  if (graduationYear < 1900 || graduationYear > new Date().getFullYear() + 1) return { ok: false, message: "Enter a valid graduation year." };
  if (!statuses.includes(verificationStatus)) return { ok: false, message: "Choose a valid verification status." };
  if (!registrantTypes.includes(registrantType)) return { ok: false, message: "Choose a valid registrant type." };
  if (requestedPublished && (!consentToPublish || verificationStatus !== "VERIFIED")) return { ok: false, message: "Only verified alumni with recorded publishing consent can be published." };

  if (id && !existing) return { ok: false, message: "Alumni record not found." };
  const payload = {
    fullName,
    registrantType,
    email: email || null,
    phone,
    batch,
    graduationYear,
    city: text(formData, "city") || null,
    profession: text(formData, "profession") || null,
    bio: text(formData, "bio") || null,
    avatarUrl: text(formData, "avatarUrl") || null,
    consentToPublish,
    consentRecordedAt: consentToPublish ? existing?.consentRecordedAt ?? new Date() : null,
    verificationStatus,
    verifiedById: verificationStatus === "VERIFIED" ? actor.id : null,
    isPublished: requestedPublished,
  };

  const record = existing
    ? await prisma.alumniProfile.update({ where: { id: existing.id }, data: payload })
    : await prisma.alumniProfile.create({ data: { ...payload, createdById: actor.id } });

  await prisma.auditLog.create({
    data: {
      userId: actor.id,
      action: existing ? "ALUMNI_PROFILE_UPDATED" : "ALUMNI_PROFILE_CREATED",
      entityType: "AlumniProfile",
      entityId: record.id,
      oldData: existing ? { verificationStatus: existing.verificationStatus, isPublished: existing.isPublished, consentToPublish: existing.consentToPublish } : undefined,
      newData: { verificationStatus, isPublished: requestedPublished, consentToPublish },
    },
  });
  await notifyAdmins({
    title: existing ? "Alumni record updated" : "Alumni record added",
    message: `${actor.fullName} ${existing ? "updated" : "added"} ${record.fullName}.`,
    topic: "ALUMNI",
    href: "/admin/alumni",
    excludeUserId: actor.id,
  });
  refreshAlumni();
  return { ok: true, message: existing ? "Alumni profile updated." : "Alumni profile added.", id: record.id };
}

export async function approveAlumniProfile(id: string): Promise<AlumniActionResult> {
  const actor = await requireRole(...adminRoles);
  if (!id) return { ok: false, message: "Alumni record not found." };
  const existing = await prisma.alumniProfile.findUnique({ where: { id } });
  if (!existing) return { ok: false, message: "Alumni record not found." };
  if (existing.verificationStatus === "VERIFIED") return { ok: true, message: `${existing.fullName} is already approved.`, id };

  const record = await prisma.alumniProfile.update({
    where: { id },
    data: { verificationStatus: "VERIFIED", verifiedById: actor.id },
  });
  await prisma.auditLog.create({
    data: {
      userId: actor.id,
      action: "ALUMNI_PROFILE_APPROVED",
      entityType: "AlumniProfile",
      entityId: record.id,
      oldData: { verificationStatus: existing.verificationStatus },
      newData: { verificationStatus: record.verificationStatus },
    },
  });
  await notifyAdmins({
    title: "Alumni profile approved",
    message: `${actor.fullName} approved ${record.fullName}'s profile.`,
    topic: "ALUMNI",
    href: "/admin/alumni",
    excludeUserId: actor.id,
  });
  refreshAlumni();
  return { ok: true, message: `${record.fullName} is now approved.`, id: record.id };
}

export async function denyAlumniProfile(id: string): Promise<AlumniActionResult> {
  const actor = await requireRole(...adminRoles);
  if (!id) return { ok: false, message: "Alumni record not found." };
  const existing = await prisma.alumniProfile.findUnique({ where: { id } });
  if (!existing) return { ok: false, message: "Alumni record not found." };
  if (existing.verificationStatus === "REJECTED") return { ok: true, message: `${existing.fullName} is already denied.`, id };

  const record = await prisma.alumniProfile.update({
    where: { id },
    data: { verificationStatus: "REJECTED", verifiedById: null, isPublished: false },
  });
  await prisma.auditLog.create({
    data: {
      userId: actor.id,
      action: "ALUMNI_PROFILE_DENIED",
      entityType: "AlumniProfile",
      entityId: record.id,
      oldData: { verificationStatus: existing.verificationStatus },
      newData: { verificationStatus: record.verificationStatus },
    },
  });
  await notifyAdmins({
    title: "Alumni profile denied",
    message: `${actor.fullName} denied ${record.fullName}'s profile.`,
    topic: "ALUMNI",
    href: "/admin/alumni",
    excludeUserId: actor.id,
  });
  refreshAlumni();
  return { ok: true, message: `${record.fullName}'s registration was denied.`, id: record.id };
}

export async function deleteAlumniProfile(id: string): Promise<AlumniActionResult> {
  const actor = await requireRole(...adminRoles);
  if (!id) return { ok: false, message: "Alumni record not found." };
  const existing = await prisma.alumniProfile.findUnique({ where: { id } });
  if (!existing) return { ok: false, message: "Alumni record not found." };

  await prisma.alumniProfile.delete({ where: { id } });
  await prisma.auditLog.create({
    data: {
      userId: actor.id,
      action: "ALUMNI_PROFILE_DELETED",
      entityType: "AlumniProfile",
      entityId: existing.id,
      oldData: { fullName: existing.fullName, email: existing.email, verificationStatus: existing.verificationStatus },
    },
  });
  await notifyAdmins({
    title: "Alumni profile deleted",
    message: `${actor.fullName} deleted ${existing.fullName}'s profile.`,
    topic: "ALUMNI",
    href: "/admin/alumni",
    excludeUserId: actor.id,
  });
  refreshAlumni();
  return { ok: true, message: `${existing.fullName}'s profile was deleted.`, id: existing.id };
}
