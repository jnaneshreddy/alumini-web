"use server";

import { revalidatePath } from "next/cache";
import { notifyAdmins } from "@/lib/admin-notifications";
import { prisma } from "@/lib/prisma";
import { adminRoles, requireRole } from "@/lib/permissions";
import { createClient } from "@/lib/supabase/server";

export type SettingsActionResult = { ok: boolean; message: string };
const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const timezones = ["Asia/Kolkata", "UTC", "Asia/Dubai", "Europe/London", "America/New_York"];

function passwordError(password: string) {
  if (password.length < 8) return "The new password must contain at least 8 characters.";
  if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) return "The new password must contain at least one letter and one number.";
  return null;
}

export async function changeOwnPassword(formData: FormData): Promise<SettingsActionResult> {
  const actor = await requireRole(...adminRoles);
  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmation = String(formData.get("confirmPassword") ?? "");
  if (!currentPassword) return { ok: false, message: "Enter your current password." };
  const validationError = passwordError(newPassword);
  if (validationError) return { ok: false, message: validationError };
  if (newPassword !== confirmation) return { ok: false, message: "The new password confirmation does not match." };
  if (newPassword === currentPassword) return { ok: false, message: "Choose a new password that is different from your current password." };

  const supabase = await createClient();
  const verification = await supabase.auth.signInWithPassword({ email: actor.email, password: currentPassword });
  if (verification.error || verification.data.user?.id !== actor.authUserId) return { ok: false, message: "The current password is incorrect." };
  const update = await supabase.auth.updateUser({ password: newPassword });
  if (update.error) return { ok: false, message: update.error.message || "Unable to update your password." };

  try {
    await prisma.auditLog.create({ data: { userId: actor.id, action: "PASSWORD_CHANGED", entityType: "UserProfile", entityId: actor.id, newData: { changedBy: "self" } } });
  } catch (error) {
    console.error("Password changed but audit logging failed", error);
  }
  return { ok: true, message: "Your password was updated successfully." };
}

export async function saveSiteSettings(formData: FormData): Promise<SettingsActionResult> {
  const actor = await requireRole(...adminRoles);
  const organizationName = text(formData, "organizationName");
  const portalName = text(formData, "portalName");
  const supportEmail = text(formData, "supportEmail").toLowerCase();
  const timezone = text(formData, "timezone");
  if (organizationName.length < 3 || portalName.length < 2) return { ok: false, message: "Organization and portal names are required." };
  if (supportEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail)) return { ok: false, message: "Enter a valid support email address." };
  if (!timezones.includes(timezone)) return { ok: false, message: "Choose a supported timezone." };

  const previous = await prisma.siteSettings.findUnique({ where: { id: "primary" } });
  const data = {
    organizationName,
    portalName,
    supportEmail: supportEmail || null,
    supportPhone: text(formData, "supportPhone") || null,
    timezone,
    notifyFeedback: formData.get("notifyFeedback") === "on",
    notifyAlumni: formData.get("notifyAlumni") === "on",
    notifyAccess: formData.get("notifyAccess") === "on",
    updatedById: actor.id,
  };
  await prisma.siteSettings.upsert({ where: { id: "primary" }, update: data, create: { id: "primary", ...data } });
  await prisma.auditLog.create({ data: { userId: actor.id, action: "SITE_SETTINGS_UPDATED", entityType: "SiteSettings", entityId: "primary", oldData: previous ? { portalName: previous.portalName, notifyFeedback: previous.notifyFeedback, notifyAlumni: previous.notifyAlumni, notifyAccess: previous.notifyAccess } : undefined, newData: { portalName, notifyFeedback: data.notifyFeedback, notifyAlumni: data.notifyAlumni, notifyAccess: data.notifyAccess } } });
  await notifyAdmins({ title: "Settings updated", message: `${actor.fullName} updated the administration settings.`, topic: "SYSTEM", href: "/admin/settings", excludeUserId: actor.id });
  revalidatePath("/admin");
  revalidatePath("/admin/settings");
  return { ok: true, message: "Settings saved." };
}
