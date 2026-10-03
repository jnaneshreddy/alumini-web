import { CarouselStudio } from "@/components/carousel-studio";
import { prisma } from "@/lib/prisma";
import { contentRoles, requireRole } from "@/lib/permissions";

export default async function CarouselPage() {
  await requireRole(...contentRoles);
  const slides = await prisma.carouselSlide.findMany({ orderBy: [{ position: "asc" }, { createdAt: "desc" }], select: { id: true, title: true, caption: true, imagePath: true, altText: true, position: true, status: true } });
  return <section className="adminRoutePage"><CarouselStudio slides={slides} /></section>;
}
