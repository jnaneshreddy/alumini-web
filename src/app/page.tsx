import { PublicHome } from "@/components/public-home";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const data = await Promise.all([
    prisma.carouselSlide.findMany({ where: { status: "PUBLISHED" }, orderBy: { position: "asc" }, take: 6 }),
    prisma.announcement.findMany({ where: { status: "PUBLISHED" }, orderBy: [{ priority: "desc" }, { publishedAt: "desc" }], take: 6 }),
    prisma.event.findMany({ where: { publication: "PUBLISHED", status: { not: "CANCELLED" } }, orderBy: { eventDate: "desc" }, take: 12 }),
    prisma.galleryImage.findMany({ where: { isPublished: true, isFeatured: true }, orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }], take: 6 }),
  ]).then(([slides, notices, events, gallery]) => ({ slides, notices, events, gallery, unavailable: false }))
    .catch(() => ({ slides: [], notices: [], events: [], gallery: [], unavailable: true }));

  return <PublicHome
    unavailable={data.unavailable}
    slides={data.slides}
    notices={data.notices.map((notice) => ({ id: notice.id, title: notice.title, titleKn: notice.titleKn, body: notice.body, bodyKn: notice.bodyKn, priority: notice.priority, publishedAt: notice.publishedAt?.toISOString() ?? null }))}
    events={data.events.map((event) => ({ id: event.id, title: event.title, titleKn: event.titleKn, description: event.description, descriptionKn: event.descriptionKn, eventDate: event.eventDate.toISOString(), venue: event.venue, venueKn: event.venueKn, imagePath: event.imagePath }))}
    gallery={data.gallery.map((image) => ({ id: image.id, titleEn: image.titleEn, titleKn: image.titleKn, descriptionEn: image.descriptionEn, descriptionKn: image.descriptionKn, altText: image.altText, imageUrl: image.imageUrl, thumbnailUrl: image.thumbnailUrl, category: image.category, galleryType: image.galleryType, date: image.date?.toISOString() ?? null }))}
  />;
}
