import { PublicHome } from "@/components/public-home";
import { prisma } from "@/lib/prisma";
import { teacherOrder } from "@/lib/teachers";
import { mclSeasonInclude, serializeMclSeason } from "@/lib/mcl";

export default async function Home() {
  const data = await Promise.all([
    prisma.carouselSlide.findMany({ where: { status: "PUBLISHED" }, orderBy: { position: "asc" }, take: 6 }),
    prisma.announcement.findMany({ where: { status: "PUBLISHED" }, orderBy: [{ priority: "desc" }, { publishedAt: "desc" }], take: 6 }),
    prisma.event.findMany({ where: { publication: "PUBLISHED", status: { not: "CANCELLED" } }, orderBy: { eventDate: "desc" }, take: 12 }),
    prisma.galleryImage.findMany({ where: { isPublished: true, isFeatured: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }], take: 6 }),
    prisma.teacher.findMany({ where: { isPublished: true }, orderBy: teacherOrder, take: 6, select: { id: true, nameEn: true, nameKn: true, designationEn: true, designationKn: true, descriptionEn: true, descriptionKn: true, imageUrl: true, startYear: true, endYear: true, isCurrent: true } }),
    prisma.mclSeason.findFirst({ where: { isPublished: true }, orderBy: { year: "desc" }, include: mclSeasonInclude }),
  ]).then(([slides, notices, events, gallery, teachers, mcl]) => ({ slides, notices, events, gallery, teachers, mcl, unavailable: false }))
    .catch(() => ({ slides: [], notices: [], events: [], gallery: [], teachers: [], mcl: null, unavailable: true }));

  return <PublicHome
    unavailable={data.unavailable}
    slides={data.slides}
    notices={data.notices.map((notice) => ({ id: notice.id, title: notice.title, titleKn: notice.titleKn, body: notice.body, bodyKn: notice.bodyKn, priority: notice.priority, publishedAt: notice.publishedAt?.toISOString() ?? null }))}
    events={data.events.map((event) => ({ id: event.id, title: event.title, titleKn: event.titleKn, description: event.description, descriptionKn: event.descriptionKn, eventDate: event.eventDate.toISOString(), venue: event.venue, venueKn: event.venueKn, imagePath: event.imagePath }))}
    gallery={data.gallery.map((image) => ({ id: image.id, titleEn: image.titleEn, titleKn: image.titleKn, descriptionEn: image.descriptionEn, descriptionKn: image.descriptionKn, altText: image.altText, imageUrl: image.imageUrl, thumbnailUrl: image.thumbnailUrl, category: image.category, galleryType: image.galleryType, date: image.date?.toISOString() ?? null }))}
    teachers={data.teachers}
    mcl={data.mcl ? serializeMclSeason(data.mcl) : null}
  />;
}
