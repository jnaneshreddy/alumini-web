import { PublicHome } from "@/components/public-home";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const data = await Promise.all([
    prisma.carouselSlide.findMany({ where: { status: "PUBLISHED" }, orderBy: { position: "asc" }, take: 6 }),
    prisma.announcement.findMany({ where: { status: "PUBLISHED" }, orderBy: [{ priority: "desc" }, { publishedAt: "desc" }], take: 6 }),
    prisma.event.findMany({ where: { publication: "PUBLISHED", status: { not: "CANCELLED" } }, orderBy: { eventDate: "desc" }, take: 12 }),
  ]).then(([slides, notices, events]) => ({ slides, notices, events, unavailable: false }))
    .catch(() => ({ slides: [], notices: [], events: [], unavailable: true }));

  return <PublicHome
    unavailable={data.unavailable}
    slides={data.slides}
    notices={data.notices.map((notice) => ({ id: notice.id, title: notice.title, titleKn: notice.titleKn, body: notice.body, bodyKn: notice.bodyKn, priority: notice.priority, publishedAt: notice.publishedAt?.toISOString() ?? null }))}
    events={data.events.map((event) => ({ id: event.id, title: event.title, titleKn: event.titleKn, description: event.description, descriptionKn: event.descriptionKn, eventDate: event.eventDate.toISOString(), venue: event.venue, venueKn: event.venueKn, imagePath: event.imagePath }))}
  />;
}
