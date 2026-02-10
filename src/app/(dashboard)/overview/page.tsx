import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/guards";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function OverviewPage() {
  const { workspaceId } = await requireWorkspace();

  // Fetch workspace data and counts
  const [domains, contentItems, sites] = await Promise.all([
    prisma.domain.findMany({
      where: { workspaceId },
      orderBy: { createdAt: "desc" },
      take: 5
    }),
    prisma.contentItem.findMany({
      where: { workspaceId, status: "AWAITING_APPROVAL" },
      take: 5
    }),
    prisma.site.findMany({
      where: { workspaceId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 3
    })
  ]);

  const domainsCount = await prisma.domain.count({ where: { workspaceId } });
  const sitesCount = await prisma.site.count({ where: { workspaceId, status: "ACTIVE" } });

  return (
    <AppShell>
      <div className="space-y-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Przegląd</h1>
          <p className="mt-2 text-base text-gray-600">
            Widzisz najważniejsze rzeczy w tym projekcie — status, decyzje i najbliższe publikacje.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid gap-3 sm:grid-cols-3">
          <Link href="/content">
            <Button className="w-full bg-blue-600 hover:bg-blue-500">
              + Dodaj treść
            </Button>
          </Link>
          <Link href="/domains">
            <Button variant="secondary" className="w-full">
              + Dodaj domenę
            </Button>
          </Link>
          <Link href="/calendar">
            <Button variant="secondary" className="w-full">
              📅 Zobacz kalendarz
            </Button>
          </Link>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 sm:grid-cols-4">
          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Domeny</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{domainsCount}</p>
              </div>
              <div className="text-2xl">📁</div>
            </div>
            <Link href="/domains" className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-700">
              Przejdź do domen →
            </Link>
          </Card>

          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Treści do sprawdzenia</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{contentItems.length}</p>
              </div>
              <div className="text-2xl">✓</div>
            </div>
            <Link href="/inbox" className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-700">
              Przejdź do sprawdzenia →
            </Link>
          </Card>

          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Publikacje w tym tygodniu</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">0</p>
              </div>
              <div className="text-2xl">📅</div>
            </div>
            <Link href="/calendar" className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-700">
              Przejdź do kalendarza →
            </Link>
          </Card>

          <Card>
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Strony</p>
                <p className="mt-2 text-3xl font-bold text-gray-900">{sitesCount}</p>
              </div>
              <div className="text-2xl">🌐</div>
            </div>
            <Link href="/sites" className="mt-4 inline-block text-sm text-blue-600 hover:text-blue-700">
              Przejdź do stron →
            </Link>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {/* Co wymaga uwagi (Inbox Preview) */}
          <div>
            <Card>
              <h2 className="text-lg font-semibold text-gray-900">Co wymaga uwagi</h2>
              <div className="mt-6 py-8 text-center">
                <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                  <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="mt-4 text-base font-semibold text-gray-900">Na razie wszystko ogarnięte</h3>
                <p className="mt-2 text-sm text-gray-600">
                  Gdy pojawią się treści do sprawdzenia lub decyzje, zobaczysz je tutaj.
                </p>
                <Link href="/inbox" className="mt-6 inline-block">
                  <Button variant="secondary">Przejdź do &quot;Do sprawdzenia&quot;</Button>
                </Link>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            {/* Struktura projektu (Domains Snapshot) */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900">Struktura projektu</h2>
              {domains.length === 0 ? (
                <div className="mt-6 py-8 text-center">
                  <p className="text-sm text-gray-600">Dodaj domeny, aby uporządkować treści</p>
                  <Link href="/domains">
                    <Button variant="secondary" className="mt-4 w-full">
                      Dodaj pierwszą domenę
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {domains.map((domain) => (
                    <Link
                      key={domain.id}
                      href="/domains"
                      className="block rounded-md px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
                    >
                      📁 {domain.name}
                      {domain.description && (
                        <p className="text-xs text-gray-500">{domain.description}</p>
                      )}
                    </Link>
                  ))}
                  <Link href="/domains" className="block pt-2 text-xs text-blue-600 hover:text-blue-700">
                    Wszystkie domeny ({domainsCount}) →
                  </Link>
                </div>
              )}
            </Card>

            {/* Miejsca publikacji (Sites Snapshot) */}
            <Card>
              <h2 className="text-lg font-semibold text-gray-900">Miejsca publikacji</h2>
              {sites.length === 0 ? (
                <div className="mt-6 py-8 text-center">
                  <p className="text-sm text-gray-600">Dodaj strony do publikacji treści</p>
                  <Link href="/sites">
                    <Button variant="secondary" className="mt-4 w-full">
                      Dodaj pierwszą stronę
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="mt-4 space-y-2">
                  {sites.map((site) => {
                    const typeLabels: Record<string, string> = {
                      WORDPRESS: "WordPress",
                      SHOPIFY: "Shopify",
                      OTHER: "Inna"
                    };
                    return (
                      <Link
                        key={site.id}
                        href="/sites"
                        className="block rounded-md px-3 py-2 text-sm text-gray-700 transition hover:bg-gray-100"
                      >
                        🌐 {site.name}
                        <p className="text-xs text-gray-500">{typeLabels[site.type] || site.type}</p>
                      </Link>
                    );
                  })}
                  <Link href="/sites" className="block pt-2 text-xs text-blue-600 hover:text-blue-700">
                    Wszystkie strony ({sitesCount}) →
                  </Link>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
