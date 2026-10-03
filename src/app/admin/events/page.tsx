import { EventStudio } from "@/components/event-studio";
import { prisma } from "@/lib/prisma";
import { contentRoles, requireRole } from "@/lib/permissions";

export default async function EventsPage() {
  await requireRole(...contentRoles);
  const records = await prisma.event.findMany({ orderBy: { eventDate: "asc" }, select: { id: true, title: true, titleKn: true, description: true, descriptionKn: true, eventDate: true, startTime: true, endTime: true, venue: true, venueKn: true, imagePath: true, status: true, publication: true } });
  const events = records.map((event) => ({ ...event, eventDate: event.eventDate.toISOString() }));
  return <section className="adminRoutePage"><EventStudio events={events}/></section>;
}
