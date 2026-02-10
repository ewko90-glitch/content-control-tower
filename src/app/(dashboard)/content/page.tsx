import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/guards";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContentKanbanDraggable } from "@/components/content-kanban-draggable";
import { ContentList } from "@/components/content-list";
import { ContentPowerBar } from "@/components/content-power-bar";

type SearchParams = { [key: string]: string | string[] | undefined };

export default async function ContentPage({
  searchParams
}: {
  searchParams: SearchParams;
}) {
  const { user, workspaceId, membership } = await requireWorkspace();

  // Parse query parameters
  const view = (searchParams.view as string) || "kanban";
  const statusFilter = (searchParams.status as string) || "all";
  const typeFilter = (searchParams.type as string) || "all";
  const searchQuery = (searchParams.search as string) || "";

  // Fetch content items with all necessary data
  const items = await prisma.contentItem.findMany({
    where: {
      workspaceId,
      ...(statusFilter !== "all" && { status: statusFilter as any }),
      ...(typeFilter !== "all" && { type: typeFilter as any }),
      ...(searchQuery && {
        OR: [
          { topic: { contains: searchQuery, mode: "insensitive" } },
          { mainKeyword: { contains: searchQuery, mode: "insensitive" } }
        ]
      })
    },
    include: {
      createdBy: { select: { id: true, name: true, email: true } },
      approvedBy: { select: { id: true, name: true, email: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  // Fetch sites for integration status
  const sites = await prisma.site.findMany({
    where: { workspaceId }
  });

  const getIntegrationsConfigured = () => {
    let count = 0;
    for (const site of sites) {
      if (site.type === "WORDPRESS") {
        if (site.wpUsername && site.wpAppPasswordEnc) count++;
      } else if (site.type === "SHOPIFY") {
        if (site.shopifyShopDomain && site.shopifyAccessTokenEnc) count++;
      } else if (site.type === "OTHER") {
        count++;
      }
    }
    return count;
  };

  const integrationsConfigured = getIntegrationsConfigured();
  const totalIntegrations = sites.length;

  // Transform items for components
  const transformedItems = items.map((item) => ({
    id: item.id,
    topic: item.topic,
    status: item.status as any,
    type: item.type,
    createdById: item.createdById,
    approvedById: item.approvedById,
    scheduledFor: item.scheduledFor,
    mainKeyword: item.mainKeyword,
    updatedAt: item.updatedAt,
    creator: item.createdBy
      ? { name: item.createdBy.name || "", email: item.createdBy.email }
      : undefined,
    integrationsConfigured,
    totalIntegrations
  }));

  // Calculate stats
  const totalCount = await prisma.contentItem.count({ where: { workspaceId } });
  const draftCount = items.filter((i) => i.status === "DRAFT").length;
  const awaitingCount = items.filter((i) => i.status === "AWAITING_APPROVAL").length;
  const scheduledCount = items.filter((i) => i.status === "SCHEDULED").length;

  const showBlockersPanel =
    awaitingCount > 0 || integrationsConfigured < totalIntegrations || false;

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Treści</h1>
          <p className="mt-2 text-base text-gray-600">
            Zarządzaj procesem tworzenia, akceptacji i publikacji.
          </p>
        </div>

        {/* Blockers Panel */}
        {showBlockersPanel && (
          <Card className="space-y-3 border-l-4 border-l-red-500">
            <h3 className="font-semibold text-gray-900">Co blokuje publikację</h3>
            <div className="space-y-2">
              {awaitingCount > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">
                    Treści czekające na decyzję: <strong>{awaitingCount}</strong>
                  </span>
                  <Link href="/content?status=AWAITING_APPROVAL">
                    <button className="text-xs text-blue-600 hover:underline">
                      Przejdź →
                    </button>
                  </Link>
                </div>
              )}
              {integrationsConfigured === 0 && totalIntegrations > 0 && (
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">
                    Strony wymagające konfiguracji: <strong>{totalIntegrations}</strong>
                  </span>
                  <Link href="/settings/project/sites">
                    <button className="text-xs text-blue-600 hover:underline">
                      Skonfiguruj →
                    </button>
                  </Link>
                </div>
              )}
            </div>
          </Card>
        )}

        {/* Power Bar */}
        <ContentPowerBar
          view={view}
          statusFilter={statusFilter}
          typeFilter={typeFilter}
          searchQuery={searchQuery}
          totalCount={totalCount}
        />

        {/* Empty State */}
        {items.length === 0 && searchQuery === "" && statusFilter === "all" && typeFilter === "all" ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-12 text-center space-y-4">
            <div>
              <p className="text-lg font-semibold text-gray-900">
                Nie masz jeszcze treści w projekcie.
              </p>
              <p className="text-sm text-gray-600 mt-2">
                Zacznij od utworzenia pierwszej treści i przeprowadź ją przez workflow
                zatwierdzenia do publikacji.
              </p>
            </div>
            <div className="flex flex-col gap-2 pt-4">
              <div className="text-sm text-gray-700 space-y-1">
                <p>
                  <strong>Krok 1:</strong> Dodaj treść
                </p>
                <p>
                  <strong>Krok 2:</strong> Wyślij do zatwierdzenia
                </p>
                <p>
                  <strong>Krok 3:</strong> Zaplanuj publikację
                </p>
              </div>
              <Link href="/content/new">
                <Button className="mt-4">Dodaj pierwszą treść</Button>
              </Link>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
            <p className="text-gray-600">
              Brak treści spełniających kryteria wyszukiwania.
            </p>
          </div>
        ) : view === "list" ? (
          <ContentList
            items={transformedItems}
            currentUserId={user.id}
            userRole={membership.role}
          />
        ) : (
          <ContentKanbanDraggable
            items={transformedItems}
            currentUserId={user.id}
            userRole={membership.role}
          />
        )}
      </div>
    </AppShell>
  );
}
