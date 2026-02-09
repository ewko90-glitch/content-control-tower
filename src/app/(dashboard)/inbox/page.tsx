import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/guards";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Alert } from "@/components/ui/alert";

export default async function InboxPage() {
  const { workspaceId } = await requireWorkspace();
  const notifications = await prisma.notification.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" }
  });

  return (
    <AppShell>
      <Card>
        <h2 className="text-lg font-semibold">Inbox</h2>
        <div className="mt-4 grid gap-2">
          {notifications.length === 0 && <Alert>Brak powiadomień.</Alert>}
          {notifications.map((notification) => (
            <div key={notification.id} className="rounded-md border border-gray-200 p-3 text-sm">
              <p>{notification.message}</p>
              <p className="text-xs text-gray-400">
                {notification.createdAt.toISOString().slice(0, 16).replace("T", " ")}
              </p>
            </div>
          ))}
        </div>
      </Card>
    </AppShell>
  );
}
