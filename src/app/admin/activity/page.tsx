import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";
import { ActivityLog } from "@/components/activity-log";

export default async function ActivityPage() {
  await requireAdmin();
  const logs = await prisma.auditLog.findMany({
    include: { user: { select: { fullName: true, email: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <section className="adminRoutePage">
      <div className="usersWorkspace">
        <section className="usersHeader">
          <div>
            <p className="adminKicker">AUDIT TRAIL</p>
            <h1>Activity log</h1>
            <span>Open an entry to see a one-line summary of exactly what changed.</span>
          </div>
        </section>
        <section className="usersPanel">
          <ActivityLog
            items={logs.map((log) => ({
              id: log.id,
              action: log.action,
              entityType: log.entityType,
              oldData: log.oldData,
              newData: log.newData,
              createdAt: log.createdAt.toISOString(),
              user: log.user ? { name: log.user.fullName, email: log.user.email } : null,
            }))}
          />
        </section>
      </div>
    </section>
  );
}
