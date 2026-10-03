import { AnnouncementStudio } from "@/components/announcement-studio";
import { prisma } from "@/lib/prisma";
import { contentRoles, requireRole } from "@/lib/permissions";

export default async function AnnouncementsPage() {
  await requireRole(...contentRoles);
  const records = await prisma.announcement.findMany({ orderBy: { createdAt: "desc" }, select: { id: true, title: true, titleKn: true, body: true, bodyKn: true, priority: true, status: true, publishedAt: true, createdAt: true } });
  const announcements = records.map((entry) => ({ ...entry, publishedAt: entry.publishedAt?.toISOString() ?? null, createdAt: entry.createdAt.toISOString() }));
  return <section className="adminRoutePage"><AnnouncementStudio announcements={announcements}/></section>;
}
