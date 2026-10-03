import { requireAdmin } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { contentRoles, requireRole } from "@/lib/permissions";
import { AdminNavigateButton } from "@/components/admin-navigate-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { saveCarouselSlide, deleteCarouselSlide } from "../carousel/actions";
import { saveAnnouncement, deleteAnnouncement } from "../announcements/actions";

const sections: Record<string, { title: string; description: string; items: string[] }> = {
  carousel: {
    title: "Carousel photos",
    description: "Manage the images displayed on the homepage hero carousel.",
    items: [
      "Add a new photo with title and caption",
      "Set the image URL or local asset path",
      "Publish or keep slides in draft mode",
    ],
  },
  announcements: {
    title: "Announcements",
    description: "A publishing workspace for notices and important school updates is on the way.",
    items: [
      "Create priority announcements",
      "Schedule publish dates and archives",
      "Display published notices on the public website",
    ],
  },
  events: {
    title: "Events",
    description: "Event planning and event-level finance tracking will be managed from this workspace.",
    items: [
      "Create and publish events",
      "Add venue, date and cover image",
      "Connect income and expense entries to each event",
    ],
  },
  users: {
    title: "Users & access",
    description: "A role-management workspace for authorized administrators is being prepared.",
    items: [
      "Review administrator accounts",
      "Assign Super Admin, Treasurer and Editor roles",
      "Deactivate access while retaining audit history",
    ],
  },
};

export default async function SectionPage({ params }: PageProps<"/admin/[section]">) {
  const { section } = await params;
  const data = sections[section];

  if (!data) {
    await requireAdmin();
    return (
      <section className="adminRoutePage financeAdmin">
        <AdminNavigateButton href="/admin">Back to overview</AdminNavigateButton>
        <div className="comingSoon">
          <Badge variant="secondary">NOT FOUND</Badge>
          <h1>Management area not found</h1>
          <p>Please return to the dashboard and choose an available workspace.</p>
        </div>
      </section>
    );
  }

  if (section === "carousel") {
    await requireRole(...contentRoles);
    const slides = await prisma.carouselSlide.findMany({
      orderBy: { position: "asc" },
    });

    return (
      <section className="adminRoutePage financeAdmin">
        <AdminNavigateButton href="/admin">â† Back to overview</AdminNavigateButton>

        <div className="comingSoon">
          <Badge variant="secondary">CONTENT</Badge>
          <p className="eyebrow">ADMIN MANAGEMENT</p>
          <h1>{data.title}</h1>
          <p>{data.description}</p>

          <div style={{ marginTop: 24, display: "grid", gap: 20 }}>
            <form action={saveCarouselSlide} style={{ display: "grid", gap: 12, maxWidth: 720 }}>
              <h3 style={{ margin: 0 }}>Add or update a slide</h3>
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))" }}>
                <input name="title" placeholder="Slide title" required style={{ padding: 10, borderRadius: 8, border: "1px solid #dbe3ef" }} />
                <input name="position" type="number" min={0} placeholder="Position" defaultValue={slides.length} style={{ padding: 10, borderRadius: 8, border: "1px solid #dbe3ef" }} />
              </div>
              <textarea name="caption" rows={3} placeholder="Caption" style={{ padding: 10, borderRadius: 8, border: "1px solid #dbe3ef" }} />
              <label style={{ display: "grid", gap: 8 }}>
                <span>Upload image file</span>
                <input type="file" name="imageFile" accept="image/*" style={{ padding: 10, borderRadius: 8, border: "1px solid #dbe3ef", background: "#fff" }} />
              </label>
              <input name="imagePath" placeholder="Or paste image URL" style={{ padding: 10, borderRadius: 8, border: "1px solid #dbe3ef" }} />
              <input name="altText" placeholder="Alt text" required style={{ padding: 10, borderRadius: 8, border: "1px solid #dbe3ef" }} />
              <select name="status" defaultValue="PUBLISHED" style={{ padding: 10, borderRadius: 8, border: "1px solid #dbe3ef" }}>
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
              </select>
              <Button type="submit">Save slide</Button>
            </form>

            <div style={{ display: "grid", gap: 12 }}>
              <h3 style={{ margin: 0 }}>Current slides</h3>
              {slides.length === 0 ? (
                <p>No carousel slides yet.</p>
              ) : (
                slides.map((slide) => (
                  <form
                    key={slide.id}
                    action={saveCarouselSlide}
                    style={{
                      display: "grid",
                      gap: 12,
                      padding: 16,
                      border: "1px solid #dbe3ef",
                      borderRadius: 12,
                      background: "white",
                    }}
                  >
                    <input type="hidden" name="id" value={slide.id} />
                    <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                      <input name="title" defaultValue={slide.title} required style={{ padding: 10, borderRadius: 8, border: "1px solid #dbe3ef" }} />
                      <input name="position" type="number" min={0} defaultValue={slide.position} style={{ padding: 10, borderRadius: 8, border: "1px solid #dbe3ef" }} />
                    </div>
                    <textarea name="caption" rows={3} defaultValue={slide.caption ?? ""} style={{ padding: 10, borderRadius: 8, border: "1px solid #dbe3ef" }} />
                    <label style={{ display: "grid", gap: 8 }}>
                      <span>Replace upload image</span>
                      <input type="file" name="imageFile" accept="image/*" style={{ padding: 10, borderRadius: 8, border: "1px solid #dbe3ef", background: "#fff" }} />
                    </label>
                    <input name="imagePath" defaultValue={slide.imagePath} placeholder="Or paste image URL" style={{ padding: 10, borderRadius: 8, border: "1px solid #dbe3ef" }} />
                    <input name="altText" defaultValue={slide.altText} required style={{ padding: 10, borderRadius: 8, border: "1px solid #dbe3ef" }} />
                    <select name="status" defaultValue={slide.status} style={{ padding: 10, borderRadius: 8, border: "1px solid #dbe3ef" }}>
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Published</option>
                      <option value="ARCHIVED">Archived</option>
                    </select>

                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <Button type="submit" variant="default">Update</Button>
                      <Button type="submit" variant="outline" formAction={deleteCarouselSlide}>Delete</Button>
                    </div>
                  </form>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (section === "announcements") {
    await requireRole(...contentRoles);
    const announcements = await prisma.announcement.findMany({
      orderBy: { createdAt: "desc" },
    });

    return (
      <section className="adminRoutePage financeAdmin">
        <AdminNavigateButton href="/admin">â† Back to overview</AdminNavigateButton>

        <div className="comingSoon">
          <Badge variant="secondary">CONTENT</Badge>
          <p className="eyebrow">ADMIN MANAGEMENT</p>
          <h1>{data.title}</h1>
          <p>{data.description}</p>

          <div style={{ marginTop: 24, display: "grid", gap: 20 }}>
            <form action={saveAnnouncement} style={{ display: "grid", gap: 12, maxWidth: 720 }}>
              <h3 style={{ margin: 0 }}>Create announcement</h3>
              <input name="title" placeholder="Announcement title" required style={{ padding: 10, borderRadius: 8, border: "1px solid #dbe3ef" }} />
              <textarea name="body" rows={5} placeholder="Details or message" required style={{ padding: 10, borderRadius: 8, border: "1px solid #dbe3ef" }} />
              <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                <select name="priority" defaultValue="GENERAL" style={{ padding: 10, borderRadius: 8, border: "1px solid #dbe3ef" }}>
                  <option value="GENERAL">General</option>
                  <option value="IMPORTANT">Important</option>
                  <option value="URGENT">Urgent</option>
                </select>
                <select name="status" defaultValue="PUBLISHED" style={{ padding: 10, borderRadius: 8, border: "1px solid #dbe3ef" }}>
                  <option value="DRAFT">Draft</option>
                  <option value="PUBLISHED">Published</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
              <input type="datetime-local" name="publishedAt" style={{ padding: 10, borderRadius: 8, border: "1px solid #dbe3ef" }} />
              <Button type="submit">Save announcement</Button>
            </form>

            <div style={{ display: "grid", gap: 12 }}>
              <h3 style={{ margin: 0 }}>Current announcements</h3>
              {announcements.length === 0 ? (
                <p>No announcements yet.</p>
              ) : (
                announcements.map((announcement) => (
                  <form
                    key={announcement.id}
                    action={saveAnnouncement}
                    style={{
                      display: "grid",
                      gap: 12,
                      padding: 16,
                      border: "1px solid #dbe3ef",
                      borderRadius: 12,
                      background: "white",
                    }}
                  >
                    <input type="hidden" name="id" value={announcement.id} />
                    <input name="title" defaultValue={announcement.title} required style={{ padding: 10, borderRadius: 8, border: "1px solid #dbe3ef" }} />
                    <textarea name="body" rows={4} defaultValue={announcement.body} required style={{ padding: 10, borderRadius: 8, border: "1px solid #dbe3ef" }} />
                    <div style={{ display: "grid", gap: 12, gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))" }}>
                      <select name="priority" defaultValue={announcement.priority} style={{ padding: 10, borderRadius: 8, border: "1px solid #dbe3ef" }}>
                        <option value="GENERAL">General</option>
                        <option value="IMPORTANT">Important</option>
                        <option value="URGENT">Urgent</option>
                      </select>
                      <select name="status" defaultValue={announcement.status} style={{ padding: 10, borderRadius: 8, border: "1px solid #dbe3ef" }}>
                        <option value="DRAFT">Draft</option>
                        <option value="PUBLISHED">Published</option>
                        <option value="ARCHIVED">Archived</option>
                      </select>
                    </div>
                    <input
                      type="datetime-local"
                      name="publishedAt"
                      defaultValue={announcement.publishedAt ? new Date(announcement.publishedAt).toISOString().slice(0, 16) : ""}
                      style={{ padding: 10, borderRadius: 8, border: "1px solid #dbe3ef" }}
                    />
                    <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
                      <Button type="submit" variant="default">Update</Button>
                      <Button type="submit" variant="outline" formAction={deleteAnnouncement}>Delete</Button>
                    </div>
                  </form>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
    );
  }

  await requireAdmin();
  return (
    <section className="adminRoutePage financeAdmin">
      <AdminNavigateButton href="/admin">â† Back to overview</AdminNavigateButton>
      <div className="comingSoon">
        <Badge variant="secondary">COMING SOON</Badge>
        <p className="eyebrow">ADMIN MANAGEMENT</p>
        <h1>{data.title}</h1>
        <p>{data.description}</p>
        <ul>
          {data.items.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <div>
          <AdminNavigateButton href="/admin" variant="default">
            Return to overview
          </AdminNavigateButton>
          <AdminNavigateButton href="/admin/finance">Open finance workspace</AdminNavigateButton>
        </div>
      </div>
    </section>
  );
}
