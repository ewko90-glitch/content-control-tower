import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/guards";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Select } from "@/components/ui/select";

function getWeekStart(date: Date) {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(date);
  monday.setDate(diff);
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}

export default async function CalendarPage() {
  const { workspaceId } = await requireWorkspace();
  const items = await prisma.contentItem.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" }
  });
  const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
    const key = getWeekStart(item.scheduledFor ?? item.createdAt);
    acc[key] = acc[key] ?? [];
    acc[key].push(item);
    return acc;
  }, {});

  return (
    <AppShell>
      <Card>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h2 className="text-lg font-semibold">Content Calendar (weekly)</h2>
          <div className="flex gap-2">
            <Select defaultValue="all">
              <option value="all">Workspace: all</option>
            </Select>
            <Select defaultValue="all">
              <option value="all">Domain: all</option>
            </Select>
            <Select defaultValue="all">
              <option value="all">Status: all</option>
            </Select>
          </div>
        </div>
        <div className="mt-6 grid gap-4">
          {Object.entries(grouped).map(([week, weekItems]) => (
            <div key={week} className="rounded-md border border-gray-200 p-4">
              <p className="text-sm font-semibold">Tydzień od {week}</p>
              <ul className="mt-2 space-y-2">
                {weekItems.map((item) => (
                  <li key={item.id} className="text-sm text-gray-700">
                    {item.topic} • {item.type} • {item.status}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>
    </AppShell>
  );
}
