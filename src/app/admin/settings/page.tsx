import { SettingsWorkspace } from "@/components/settings-workspace";
import { prisma } from "@/lib/prisma";
import { adminRoles, requireRole } from "@/lib/permissions";

export default async function SettingsPage() {
  await requireRole(...adminRoles);
  const settings = await prisma.siteSettings.findUnique({ where: { id: "primary" } });
  return <section className="adminRoutePage"><SettingsWorkspace settings={settings ? { organizationName: settings.organizationName, portalName: settings.portalName, supportEmail: settings.supportEmail, supportPhone: settings.supportPhone, timezone: settings.timezone, notifyFeedback: settings.notifyFeedback, notifyAlumni: settings.notifyAlumni, notifyAccess: settings.notifyAccess, updatedAt: settings.updatedAt.toISOString() } : null}/></section>;
}
