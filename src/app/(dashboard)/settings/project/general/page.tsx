import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/guards";
import { CopyIdButton } from "@/components/copy-id-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const SITE_TYPE_LABELS: Record<string, string> = {
  WORDPRESS: "WordPress",
  SHOPIFY: "Shopify",
  OTHER: "Inna"
};

export default async function ProjectGeneralPage() {
  const { workspaceId } = await requireWorkspace();

  const [workspace, members, membersCount, sites, sitesCount, domainsCount, contentCount] =
    await Promise.all([
      prisma.workspace.findUnique({
        where: { id: workspaceId },
        select: { id: true, name: true }
      }),
      prisma.membership.findMany({
        where: { workspaceId },
        include: { user: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "desc" },
        take: 3
      }),
      prisma.membership.count({ where: { workspaceId } }),
      prisma.site.findMany({
        where: { workspaceId },
        select: { id: true, name: true, type: true, status: true },
        orderBy: { createdAt: "desc" },
        take: 3
      }),
      prisma.site.count({ where: { workspaceId } }),
      prisma.domain.count({ where: { workspaceId } }),
      prisma.contentItem.count({ where: { workspaceId } })
    ]);

  const hasSites = sitesCount > 0;
  const hasDomains = domainsCount > 0;
  const hasTeam = membersCount > 1;
  const hasContent = contentCount > 0;

  const readinessItems = [
    {
      label: "Dodano stronę",
      ok: hasSites,
      hint: "Dodaj miejsce publikacji, aby planować publikacje."
    },
    {
      label: "Dodano domenę",
      ok: hasDomains,
      hint: "Domena porządkuje treści i raporty."
    },
    {
      label: "Dodano członków zespołu",
      ok: hasTeam,
      hint: "Zaproś współpracowników do współdzielenia pracy."
    },
    {
      label: "Utworzono treści",
      ok: hasContent,
      hint: "Pierwsza treść pozwala uruchomić workflow publikacji."
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Ogólne</h2>
          <p className="mt-1 text-sm text-gray-600">
            Podstawowe informacje o projekcie, zespole i miejscach publikacji.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-800">
            Aktywny
          </span>
          <Link href="/settings/project/team">
            <Button variant="secondary" className="text-xs">
              Przejdź do Zespół
            </Button>
          </Link>
          <Link href="/settings/project/sites">
            <Button variant="secondary" className="text-xs">
              Przejdź do Strony
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Informacje o projekcie</h3>
              <p className="text-sm text-gray-600">Najważniejsze dane identyfikujące workspace.</p>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Nazwa projektu</p>
                <p className="text-lg font-semibold text-gray-900">
                  {workspace?.name ?? "Nieznany projekt"}
                </p>
              </div>

              <div>
                <p className="text-sm text-gray-500">ID projektu</p>
                <div className="mt-1 flex flex-wrap items-center gap-3">
                  <span className="rounded-md bg-gray-50 px-2 py-1 font-mono text-xs text-gray-700">
                    {workspace?.id ?? "Brak"}
                  </span>
                  {workspace?.id && <CopyIdButton value={workspace.id} />}
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Opis projektu</p>
                <p className="text-sm text-gray-600">Opis (wkrótce)</p>
              </div>
            </div>

            <div className="flex items-center gap-2 border-t pt-4">
              <Button variant="secondary" disabled className="text-sm">
                Edytuj
              </Button>
              <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-700">
                W planie
              </span>
            </div>
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Właściciel i zespół</h3>
              <p className="text-sm text-gray-600">Osoby, które mają dostęp do projektu.</p>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Liczba członków</p>
                <p className="text-3xl font-semibold text-gray-900">{membersCount}</p>
              </div>

              {membersCount <= 1 ? (
                <p className="text-sm text-gray-600">
                  To projekt jednoosobowy. Zaproś zespół, aby delegować zadania.
                </p>
              ) : (
                <div className="space-y-2">
                  {members.map((member) => {
                    const displayName = member.user.name ?? member.user.email;
                    return (
                      <div key={member.user.id} className="flex flex-col text-sm text-gray-700">
                        <span className="font-medium">{displayName}</span>
                        {member.user.name && (
                          <span className="text-xs text-gray-500">{member.user.email}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

              <p className="text-xs text-gray-500">Uprawnienia zależą od roli.</p>
            </div>

            <div className="border-t pt-4">
              <Link href="/settings/project/team">
                <Button variant="secondary" className="text-sm">
                  Zarządzaj zespołem
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Miejsca publikacji</h3>
              <p className="text-sm text-gray-600">Lista stron i statusy połączeń.</p>
            </div>

            <div className="space-y-3">
              <div>
                <p className="text-sm text-gray-500">Liczba stron</p>
                <p className="text-3xl font-semibold text-gray-900">{sitesCount}</p>
              </div>

              {sitesCount === 0 ? (
                <p className="text-sm text-gray-600">
                  Nie masz jeszcze żadnej strony. Dodaj pierwszą, żeby planować publikacje.
                </p>
              ) : (
                <div className="space-y-2">
                  {sites.map((site) => (
                    <div key={site.id} className="flex flex-wrap items-center gap-2 text-sm">
                      <span className="font-medium text-gray-800">{site.name}</span>
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                        {SITE_TYPE_LABELS[site.type] ?? site.type}
                      </span>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                          site.status === "ACTIVE"
                            ? "bg-green-100 text-green-800"
                            : "bg-gray-200 text-gray-700"
                        }`}
                      >
                        {site.status === "ACTIVE" ? "Aktywna" : "Nieaktywna"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <Link href="/settings/project/sites">
                <Button variant="secondary" className="text-sm">
                  Zarządzaj stronami
                </Button>
              </Link>
            </div>
          </div>
        </Card>

        <Card>
          <div className="space-y-4">
            <div>
              <h3 className="text-base font-semibold text-gray-900">Stan projektu</h3>
              <p className="text-sm text-gray-600">Szybki podgląd gotowości kluczowych elementów.</p>
            </div>

            <div className="space-y-3">
              {readinessItems.map((item) => (
                <div key={item.label} className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{item.label}</p>
                    <p className="text-xs text-gray-500">{item.hint}</p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      item.ok ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {item.ok ? "OK" : "Do zrobienia"}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 border-t pt-4">
              {!hasSites && (
                <Link href="/sites">
                  <Button className="text-sm">Dodaj stronę</Button>
                </Link>
              )}
              {!hasDomains && (
                <Link href="/domains">
                  <Button variant="secondary" className="text-sm">
                    Dodaj domenę
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
