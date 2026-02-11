import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/guards";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CalendarBoard } from "@/components/calendar-board";
import { CalendarExportButton } from "@/components/calendar-export-button";
import { CalendarStats } from "@/components/calendar-stats";

export default async function CalendarPage() {
  const { user: _user, workspaceId, membership } = await requireWorkspace();

  // Fetch scheduled content
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
      createdBy: { select: { id: true, name: true, email: true } },
      scheduledBy: { select: { id: true, name: true, email: true } }
    },
    orderBy: { scheduledFor: "asc" }
  });

  // Fetch approved items (backlog to schedule)
  const approvedItems = await prisma.contentItem.findMany({
    where: {
      workspaceId,
      status: "APPROVED"
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  // Check if workspace has unconfigured sites (for warning)
  const unconfiguredSites = await prisma.site.findMany({
    where: {
      workspaceId,
      wpAppPasswordEnc: null
    }
  });

  // Count publications this week
  const weekStart = new Date(today);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const thisWeekCount = scheduledItems.filter((item) => {
    const itemDate = new Date(item.scheduledFor!);
    return itemDate >= weekStart && itemDate < weekEnd;
  }).length;

  return (
    <AppShell>
      <div className="space-y-6 h-screen flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Kalendarz publikacji
            </h1>
            <p className="mt-2 text-base text-gray-600">
              Planuj publikacje i kontroluj obciążenie tygodnia.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {unconfiguredSites.length > 0 && (
              <Card className="px-4 py-2 bg-yellow-50 border-yellow-200">
                <p className="text-sm text-yellow-800">
                  ⚠️ Niektóre strony nie są skonfigurowane
                </p>
                <Link href="/settings/project/sites">
                  <Button className="mt-1 h-6 text-xs bg-yellow-600 hover:bg-yellow-700 text-white">
                    Skonfiguruj
                  </Button>
                </Link>
              </Card>
            )}
            <Link href="/content/new">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Zaplanuj treść
              </Button>
            </Link>
            <Link href="/content">
              <Button className="bg-gray-200 hover:bg-gray-300 text-gray-700">
                Przejdź do Treści
              </Button>
            </Link>
          </div>
        </div>

        {/* Calendar Statistics Dashboard */}
        <CalendarStats 
          scheduledItems={scheduledItems}
          thisWeekCount={thisWeekCount}
          approvedItems={approvedItems}
        />

        {/* Export and Smart Scheduling Hint */}
        <div className="flex items-center justify-between">
          {approvedItems.length > 5 && scheduledItems.length < 10 && (
            <Card className="px-3 py-1 bg-purple-50 border-purple-200">
              <span className="text-purple-800">
                💡 Wskazówka: {approvedItems.length} treści czeka na planowanie
              </span>
            </Card>
          )}
          
          <div className="ml-auto">
            <CalendarExportButton 
              scheduledItems={scheduledItems}
              weekStart={weekStart}
              weekEnd={weekEnd}
            />
          </div>
        </div>

        {/* Main Content - Calendar Board */}
        {scheduledItems.length === 0 && approvedItems.length === 0 ? (
          <Card className="p-12 text-center">
            <p className="text-lg text-gray-600 mb-4">
              Kalendarz jest pusty.
            </p>
            <p className="text-sm text-gray-500 mb-6">
              Zaakceptuj treści lub zaplanuj publikacje, aby zobaczyć je tutaj.
            </p>
            <Link href="/content">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                Dodaj treść
              </Button>
            </Link>
          </Card>
        ) : (
          <div className="flex-1 min-h-0 overflow-hidden">
            <CalendarBoard
              scheduledItems={scheduledItems}
              approvedItems={approvedItems}
              userRole={membership.role}
            />
          </div>
        )}
      </div>
    </AppShell>
  );
}
