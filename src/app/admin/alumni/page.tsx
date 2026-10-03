import { AlumniWorkspace } from "@/components/alumni-workspace";
import { prisma } from "@/lib/prisma";
import { adminRoles, requireRole } from "@/lib/permissions";

export default async function AlumniPage() {
  await requireRole(...adminRoles);
  const records = await prisma.alumniProfile.findMany({ orderBy: { updatedAt: "desc" } });
  return <section className="adminRoutePage"><AlumniWorkspace records={records.map((record) => ({ ...record, consentRecordedAt: record.consentRecordedAt?.toISOString() ?? null, createdAt: record.createdAt.toISOString(), updatedAt: record.updatedAt.toISOString() }))}/></section>;
}
