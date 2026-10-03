import { GalleryStudio } from "@/components/gallery-studio";
import { adminRoles, requireRole } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";

export default async function MemoriesAdminPage() {
  await requireRole(...adminRoles);
  const [images, events] = await Promise.all([prisma.galleryImage.findMany({ where: { galleryType: "MEMORY" }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }], select: { id: true, titleEn: true, titleKn: true, descriptionEn: true, descriptionKn: true, altText: true, imageUrl: true, category: true, galleryType: true, eventId: true, date: true, isFeatured: true, isPublished: true, sortOrder: true } }), prisma.event.findMany({ orderBy: { eventDate: "desc" }, select: { id: true, title: true } })]);
  return <section className="adminRoutePage"><GalleryStudio defaultType="MEMORY" events={events} images={images.map((image) => ({ ...image, date: image.date?.toISOString() || null }))}/></section>;
}
