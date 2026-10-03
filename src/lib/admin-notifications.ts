import "server-only";

import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

export type AdminNotificationTopic = "FEEDBACK" | "ALUMNI" | "ACCESS" | "SYSTEM";

type NotifyAdminsInput = {
  title: string;
  message: string;
  topic: AdminNotificationTopic;
  href?: string;
  excludeUserId?: string;
};

export async function notifyAdmins(input: NotifyAdminsInput) {
  try {
    const settings = await prisma.siteSettings.findUnique({ where: { id: "primary" } });
    if (input.topic === "FEEDBACK" && settings?.notifyFeedback === false) return;
    if (input.topic === "ALUMNI" && settings?.notifyAlumni === false) return;
    if (input.topic === "ACCESS" && settings?.notifyAccess === false) return;

    const recipients = await prisma.userProfile.findMany({
      where: {
        active: true,
        role: { in: ["ADMIN", "SUPER_ADMIN"] },
        ...(input.excludeUserId ? { id: { not: input.excludeUserId } } : {}),
      },
      select: { id: true },
    });

    if (!recipients.length) return;
    const rows: Prisma.AdminNotificationCreateManyInput[] = recipients.map(({ id }) => ({
      recipientId: id,
      title: input.title,
      message: input.message,
      category: input.topic,
      href: input.href,
    }));
    await prisma.adminNotification.createMany({ data: rows });
  } catch (error) {
    console.error("Unable to create admin notifications", error);
  }
}
