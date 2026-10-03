import { TeacherStudio } from "@/components/teacher-studio";
import { adminRoles, requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { teacherOrder } from "@/lib/teachers";

export default async function TeachersAdminPage() {
  await requireRole(...adminRoles);
  const teachers = await prisma.teacher.findMany({ orderBy: teacherOrder, select: { id: true, nameEn: true, nameKn: true, designationEn: true, designationKn: true, descriptionEn: true, descriptionKn: true, imageUrl: true, startYear: true, endYear: true, isCurrent: true, isPublished: true, sortOrder: true } });
  return <section className="adminRoutePage"><TeacherStudio teachers={teachers}/></section>;
}
