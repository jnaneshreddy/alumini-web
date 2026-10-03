import type { Metadata } from "next";
import { TeachersArchive } from "@/components/teacher-archive";
import { getPublishedTeachers } from "@/lib/teachers";

export const metadata: Metadata = {
  title: "Teachers & Mentors",
  description: "A tribute to the teachers and mentors who shaped generations at Morarji Desai Residential School.",
};

export default async function TeachersPage() {
  const teachers = await getPublishedTeachers().catch(() => []);
  return <TeachersArchive teachers={teachers}/>;
}
