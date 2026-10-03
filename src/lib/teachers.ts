import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type PublicTeacher = {
  id: string;
  nameEn: string;
  nameKn: string | null;
  designationEn: string;
  designationKn: string | null;
  descriptionEn: string | null;
  descriptionKn: string | null;
  imageUrl: string;
  startYear: number;
  endYear: number | null;
  isCurrent: boolean;
};

export const teacherOrder: Prisma.TeacherOrderByWithRelationInput[] = [
  { isCurrent: "desc" },
  { endYear: "desc" },
  { startYear: "desc" },
  { sortOrder: "asc" },
  { nameEn: "asc" },
];

export async function getPublishedTeachers(take?: number): Promise<PublicTeacher[]> {
  return prisma.teacher.findMany({
    where: { isPublished: true },
    orderBy: teacherOrder,
    take,
    select: {
      id: true,
      nameEn: true,
      nameKn: true,
      designationEn: true,
      designationKn: true,
      descriptionEn: true,
      descriptionKn: true,
      imageUrl: true,
      startYear: true,
      endYear: true,
      isCurrent: true,
    },
  });
}
