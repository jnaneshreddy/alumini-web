import { NextResponse } from "next/server";
import { getApiAdmin } from "@/lib/api-admin";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const unavailable = () => NextResponse.json({ notifications: [], unreadCount: 0, error: "Notifications are temporarily unavailable." }, { status: 503 });

export async function GET() {
  try {
    const profile = await getApiAdmin();
    if (!profile) return NextResponse.json({ notifications: [], unreadCount: 0, error: "Unauthorized" }, { status: 401 });

    const [notifications, unreadCount, settings] = await Promise.all([
      prisma.adminNotification.findMany({
        where: { recipientId: profile.id, clearedAt: null },
        orderBy: { createdAt: "desc" },
        take: 30,
        select: { id: true, title: true, message: true, category: true, href: true, readAt: true, createdAt: true },
      }),
      prisma.adminNotification.count({ where: { recipientId: profile.id, clearedAt: null, readAt: null } }),
      prisma.siteSettings.findUnique({ where: { id: "primary" }, select: { portalName: true } }),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
      portalName: settings?.portalName ?? "MDRS Alumni",
      profile: { fullName: profile.fullName, role: profile.role },
    });
  } catch (error) {
    console.error("Admin notification GET failed", error instanceof Error ? error.message : "Unknown error");
    return unavailable();
  }
}

export async function PATCH(request: Request) {
  try {
    const profile = await getApiAdmin();
    if (!profile) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => null) as { action?: string; id?: string } | null;
    const now = new Date();

    if (body?.action === "markAllRead") {
      await prisma.adminNotification.updateMany({ where: { recipientId: profile.id, clearedAt: null, readAt: null }, data: { readAt: now } });
    } else if (body?.action === "clearAll") {
      await prisma.adminNotification.updateMany({ where: { recipientId: profile.id, clearedAt: null }, data: { clearedAt: now, readAt: now } });
    } else if (body?.action === "markRead" && body.id) {
      await prisma.adminNotification.updateMany({ where: { id: body.id, recipientId: profile.id, clearedAt: null }, data: { readAt: now } });
    } else if (body?.action === "clear" && body.id) {
      await prisma.adminNotification.updateMany({ where: { id: body.id, recipientId: profile.id, clearedAt: null }, data: { clearedAt: now, readAt: now } });
    } else {
      return NextResponse.json({ error: "Invalid notification action" }, { status: 400 });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Admin notification PATCH failed", error instanceof Error ? error.message : "Unknown error");
    return NextResponse.json({ error: "Notifications are temporarily unavailable." }, { status: 503 });
  }
}
