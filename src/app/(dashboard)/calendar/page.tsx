import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/guards";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { CalendarGrid } from "@/components/calendar-grid";

export default async function CalendarPage() {
  const { workspaceId } = await requireWorkspace();

  // Fetch all scheduled content for next 90 days
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const ninetyDaysAhead = new Date(today);
  ninetyDaysAhead.setDate(ninetyDaysAhead.getDate() + 90);

  const scheduledItems = await prisma.contentItem.findMany({
    where: {
      workspaceId,
      status: "SCHEDULED",
      scheduledFor: {
        gte: today,
        lte: ninetyDaysAhead
      }
    },
    include: {
      createdBy: { select: { name: true, email: true } }
    },
    orderBy: { scheduledFor: "asc" }
  });

  // Group by date
  const eventsByDate: Record<string, typeof scheduledItems> = {};
  scheduledItems.forEach((item) => {
    const dateKey = item.scheduledFor?.toISOString().split("T")[0] || "";
    if (!eventsByDate[dateKey]) {
      eventsByDate[dateKey] = [];
    }
    eventsByDate[dateKey].push(item);
  });

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Kalendarz publikacji</h1>
          <p className="mt-2 text-base text-gray-600">
            Przegląd zaplanowanych publikacji na najbliższe 90 dni.
          </p>
        </div>

        {/* Calendar Grid */}
        <CalendarGrid
          events={scheduledItems.map((item) => ({
            id: item.id,
            title: item.topic,
            date: item.scheduledFor!,
            type: item.type,
            author: item.createdBy?.name || "Nieznany",
            keyword: item.mainKeyword
          }))}
        />

        {/* Upcoming Events List */}
        <div className="space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">Zbliżające się publikacje</h2>

          {scheduledItems.length === 0 ? (
            <Card className="p-8 text-center text-gray-500">
              Brak zaplanowanych publikacji w najbliższych 90 dniach.
            </Card>
          ) : (
            <div className="space-y-2">
              {scheduledItems.slice(0, 10).map((item) => (
                <Card
                  key={item.id}
                  className="p-4 flex items-start justify-between hover:shadow-md transition"
                >
                  <div className="min-w-0 flex-1">
                    <a
                      href={`/content/${item.id}`}
                      className="text-sm font-semibold text-blue-600 hover:underline line-clamp-1"
                    >
                      {item.topic}
                    </a>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                        {item.type}
                      </span>
                      <span className="text-xs text-gray-600">
                        {item.createdBy?.name}
                      </span>
                    </div>
                  </div>
                  <div className="ml-4 text-right flex-shrink-0">
                    <p className="text-sm font-semibold text-gray-900">
                      {item.scheduledFor?.toLocaleDateString("pl-PL", {
                        month: "short",
                        day: "numeric"
                      })}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.scheduledFor?.toLocaleTimeString("pl-PL", {
                        hour: "2-digit",
                        minute: "2-digit"
                      })}
                    </p>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="p-4">
            <p className="text-xs text-gray-600 uppercase font-semibold">Razem zaplanowanych</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {scheduledItems.length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-600 uppercase font-semibold">Ta niedziela</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {
                scheduledItems.filter((item) => {
                  const itemDate = new Date(item.scheduledFor!);
                  const nextSunday = new Date(today);
                  nextSunday.setDate(
                    nextSunday.getDate() + ((0 - nextSunday.getDay() + 7) % 7 || 7)
                  );
                  const nextMonday = new Date(nextSunday);
                  nextMonday.setDate(nextMonday.getDate() + 1);

                  return itemDate >= nextSunday && itemDate < nextMonday;
                }).length
              }
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-xs text-gray-600 uppercase font-semibold">Ten tydzień</p>
            <p className="mt-2 text-2xl font-bold text-gray-900">
              {
                scheduledItems.filter((item) => {
                  const itemDate = new Date(item.scheduledFor!);
                  const weekEnd = new Date(today);
                  weekEnd.setDate(weekEnd.getDate() + 7);
                  return itemDate >= today && itemDate < weekEnd;
                }).length
              }
            </p>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
