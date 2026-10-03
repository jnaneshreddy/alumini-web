"use server";

import { revalidatePath } from "next/cache";
import { notifyAdmins } from "@/lib/admin-notifications";
import { prisma } from "@/lib/prisma";
import { adminRoles, requireRole } from "@/lib/permissions";

export type SettingsActionResult = { ok: boolean; message: string };
const text = (formData: FormData, key: string) => String(formData.get(key) ?? "").trim();
const timezones = ["Asia/Kolkata", "UTC", "Asia/Dubai", "Europe/London", "America/New_York"];

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
