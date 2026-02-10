import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/guards";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ProjectStatus = "healthy" | "warning" | "blocked";

type ActionCard = {
  title: string;
  description: string;
  cta: string;
  href: string;
};

type TimelineItem = {
  topic: string;
  runAt: Date | null;
  status: string;
};

type TimelineGroup = {
  label: string;
  items: TimelineItem[];
};

function getProjectStatus(params: {
  failedJobsCount: number;
  awaitingApprovalCount: number;
  scheduledNext7Days: number;
  hasUnconfiguredSites: boolean;
  hasScheduledContent: boolean;
}): ProjectStatus {
  const { failedJobsCount, awaitingApprovalCount, scheduledNext7Days, hasUnconfiguredSites, hasScheduledContent } = params;

  if (failedJobsCount > 0 || (hasScheduledContent && hasUnconfiguredSites)) {
    return "blocked";
  }

  if (awaitingApprovalCount > 0 || scheduledNext7Days === 0) {
    return "warning";
  }

  return "healthy";
}

function getProjectStatusLabel(status: ProjectStatus) {
  if (status === "blocked") return "Zablokowany";
  if (status === "warning") return "Wymaga uwagi";
  return "Zdrowy";
}

function getPriorityCard(params: {
  failedJobsCount: number;
  awaitingApprovalCount: number;
  scheduledNext7Days: number;
}) {
  const { failedJobsCount, awaitingApprovalCount, scheduledNext7Days } = params;

  if (failedJobsCount > 0) {
    return {
      title: `Masz ${failedJobsCount} błędów publikacji`,
      description: "Nieudane publikacje wymagają sprawdzenia i ponownej próby.",
      cta: "Sprawdź błędy",
      href: "/overview#jobs"
    };
  }

  if (awaitingApprovalCount > 0) {
    return {
      title: `Masz ${awaitingApprovalCount} treści czekających na zatwierdzenie`,
      description: "Bez zatwierdzenia publikacje nie ruszą dalej.",
      cta: "Zatwierdź treści",
      href: "/content"
    };
  }

  if (scheduledNext7Days === 0) {
    return {
      title: "Nie masz zaplanowanych publikacji na ten tydzień",
      description: "Zaplanuj publikacje, aby zachować rytm i przewidywalność.",
      cta: "Zaplanuj publikację",
      href: "/content"
    };
  }

  return {
    title: "Projekt działa zgodnie z planem",
    description: "Na teraz nie ma blokujących decyzji. Możesz pracować spokojnie.",
    cta: "Zobacz harmonogram",
    href: "/overview#timeline"
  };
}

function getActionCards(params: {
  awaitingApprovalCount: number;
  failedJobsCount: number;
  scheduledNext7Days: number;
  needsConfigCount: number;
}): ActionCard[] {
  const { awaitingApprovalCount, failedJobsCount, scheduledNext7Days, needsConfigCount } = params;
  const cards: ActionCard[] = [];

  if (awaitingApprovalCount > 0) {
    cards.push({
      title: "Czeka na zatwierdzenie",
      description: `${awaitingApprovalCount} treści do zatwierdzenia.`,
      cta: "Przejdź do treści",
      href: "/content"
    });
  }

  if (failedJobsCount > 0) {
    cards.push({
      title: "Problemy z publikacją",
      description: `${failedJobsCount} publikacji zakończonych błędem w ostatnich 7 dniach.`,
      cta: "Sprawdź błędy",
      href: "/overview#jobs"
    });
  }

  if (scheduledNext7Days === 0) {
    cards.push({
      title: "Brak planu na tydzień",
      description: "Nie ma zaplanowanych publikacji na kolejne 7 dni.",
      cta: "Zaplanuj publikację",
      href: "/content"
    });
  }

  if (needsConfigCount > 0) {
    cards.push({
      title: "Strony wymagają konfiguracji",
      description: `${needsConfigCount} miejsc publikacji bez danych integracji.`,
      cta: "Uzupełnij integracje",
      href: "/settings/project/sites"
    });
  }

  return cards.slice(0, 4);
}

function getHealthScore(params: {
  configuredSitesCount: number;
  totalSitesCount: number;
  failedJobsCount: number;
  membersCount: number;
  contentCount: number;
  scheduledNext7Days: number;
}) {
  const { configuredSitesCount, totalSitesCount, failedJobsCount, membersCount, contentCount, scheduledNext7Days } = params;
  const checks = [
    {
      label: "Strony skonfigurowane",
      ok: totalSitesCount > 0 && configuredSitesCount === totalSitesCount,
      href: "/settings/project/sites"
    },
    {
      label: "Brak błędów publikacji",
      ok: failedJobsCount === 0,
      href: "/overview#jobs"
    },
    {
      label: "Zespół większy niż 1 osoba",
      ok: membersCount > 1,
      href: "/settings/project/team"
    },
    {
      label: "Treści w projekcie",
      ok: contentCount > 0,
      href: "/content"
    },
    {
      label: "Publikacje zaplanowane",
      ok: scheduledNext7Days > 0,
      href: "/content"
    }
  ];

  const score = Math.round((checks.filter((item) => item.ok).length / checks.length) * 100);

  return { score, checks };
}

function getInsight(params: {
  scheduledNext7Days: number;
  contentCount: number;
  totalSitesCount: number;
}) {
  const { scheduledNext7Days, contentCount, totalSitesCount } = params;

  if (contentCount > 0 && scheduledNext7Days === 0) {
    return "Masz treści, ale niewiele z nich jest zaplanowanych na najbliższy tydzień.";
  }

  if (totalSitesCount > 1 && scheduledNext7Days > 0) {
    return "Warto rozłożyć publikacje równomiernie między stronami, aby zwiększyć zasięg.";
  }

  return "W tym tygodniu najważniejsze będzie utrzymanie rytmu publikacji i jakości treści.";
}

function isSameDay(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

function getTimelineGroups(items: TimelineItem[], now: Date) {
  const todayItems: TimelineItem[] = [];
  const tomorrowItems: TimelineItem[] = [];
  const weekItems: TimelineItem[] = [];
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);

  items.forEach((item) => {
    if (!item.runAt) return;
    if (isSameDay(item.runAt, now)) {
      todayItems.push(item);
      return;
    }
    if (isSameDay(item.runAt, tomorrow)) {
      tomorrowItems.push(item);
      return;
    }
    weekItems.push(item);
  });

  return [
    { label: "Dzisiaj", items: todayItems },
    { label: "Jutro", items: tomorrowItems },
    { label: "Ten tydzień", items: weekItems }
  ] satisfies TimelineGroup[];
}

export default async function OverviewPage() {
  const { workspaceId } = await requireWorkspace();
  const now = new Date();
  const sevenDaysAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    awaitingApprovalCount,
    draftCount,
    scheduledNext7Days,
    scheduledAll,
    publishedLast30Days,
    contentCount,
    membersCount,
    sites,
    domainsCount,
    failedJobsCount,
    timelineItems
  ] = await Promise.all([
    prisma.contentItem.count({ where: { workspaceId, status: "AWAITING_APPROVAL" } }),
    prisma.contentItem.count({ where: { workspaceId, status: "DRAFT" } }),
    prisma.contentItem.count({
      where: {
        workspaceId,
        status: "SCHEDULED",
        scheduledFor: { gte: now, lte: sevenDaysAhead }
      }
    }),
    prisma.contentItem.count({
      where: {
        workspaceId,
        status: "SCHEDULED",
        scheduledFor: { gte: now }
      }
    }),
    prisma.contentItem.count({
      where: {
        workspaceId,
        status: "PUBLISHED",
        publishedAt: { gte: thirtyDaysAgo }
      }
    }),
    prisma.contentItem.count({ where: { workspaceId } }),
    prisma.membership.count({ where: { workspaceId } }),
    prisma.site.findMany({
      where: { workspaceId },
      select: {
        id: true,
        status: true,
        type: true,
        wpUsername: true,
        wpAppPasswordEnc: true,
        shopifyShopDomain: true,
        shopifyAccessTokenEnc: true
      }
    }),
    prisma.domain.count({ where: { workspaceId } }),
    prisma.publicationJob.count({
      where: {
        workspaceId,
        status: "FAILED",
        createdAt: { gte: sevenDaysAgo }
      }
    }),
    prisma.publicationJob.findMany({
      where: { workspaceId, runAt: { gte: now } },
      orderBy: { runAt: "asc" },
      take: 5,
      select: {
        runAt: true,
        status: true,
        contentItem: { select: { topic: true } }
      }
    })
  ]);

  const configuredSitesCount = sites.filter((site) => {
    if (site.type === "OTHER") return true;
    if (site.type === "WORDPRESS") {
      return Boolean(site.wpUsername && site.wpAppPasswordEnc);
    }
    if (site.type === "SHOPIFY") {
      return Boolean(site.shopifyShopDomain && site.shopifyAccessTokenEnc);
    }
    return false;
  }).length;

  const needsConfigCount = sites.length - configuredSitesCount;
  const inactiveSitesCount = sites.filter((site) => site.status === "INACTIVE").length;
  const projectStatus = getProjectStatus({
    failedJobsCount,
    awaitingApprovalCount,
    scheduledNext7Days,
    hasUnconfiguredSites: needsConfigCount > 0,
    hasScheduledContent: scheduledAll > 0
  });

  const priorityCard = getPriorityCard({
    failedJobsCount,
    awaitingApprovalCount,
    scheduledNext7Days
  });

  const actionCards = getActionCards({
    awaitingApprovalCount,
    failedJobsCount,
    scheduledNext7Days,
    needsConfigCount
  });

  const health = getHealthScore({
    configuredSitesCount,
    totalSitesCount: sites.length,
    failedJobsCount,
    membersCount,
    contentCount,
    scheduledNext7Days
  });

  const insight = getInsight({
    scheduledNext7Days,
    contentCount,
    totalSitesCount: sites.length
  });

  const timeline: TimelineItem[] = timelineItems.map((item) => ({
    topic: item.contentItem.topic,
    runAt: item.runAt,
    status: item.status
  }));
  const timelineGroups = getTimelineGroups(timeline, now);

  return (
    <AppShell>
      <div className="space-y-8">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Content Control Tower</h1>
            <p className="mt-2 text-base text-gray-600">
              Centralny panel decyzji i statusu publikacji w projekcie.
            </p>
          </div>
          <div className="flex flex-col items-end gap-2 text-right">
            <span
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                projectStatus === "blocked"
                  ? "bg-red-100 text-red-700"
                  : projectStatus === "warning"
                    ? "bg-amber-100 text-amber-700"
                    : "bg-green-100 text-green-700"
              }`}
            >
              {getProjectStatusLabel(projectStatus)}
            </span>
            <p className="text-xs text-gray-500">Status projektu na podstawie publikacji i konfiguracji.</p>
          </div>
        </div>

        <Card className="space-y-4">
          <div>
            <p className="text-xs font-semibold uppercase text-gray-500">Priorytet dnia</p>
            <h2 className="text-xl font-semibold text-gray-900">{priorityCard.title}</h2>
            <p className="text-sm text-gray-600">{priorityCard.description}</p>
          </div>
          <div>
            <Link href={priorityCard.href}>
              <Button>{priorityCard.cta}</Button>
            </Link>
          </div>
        </Card>

        <Card className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Do Twojej decyzji</h2>
            <p className="text-sm text-gray-600">Najważniejsze sprawy wymagające działania.</p>
          </div>
          {actionCards.length === 0 ? (
            <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
              Wszystko idzie zgodnie z planem.
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {actionCards.map((card) => (
                <div key={card.title} className="rounded-lg border border-gray-200 bg-white p-4">
                  <p className="text-sm font-semibold text-gray-900">{card.title}</p>
                  <p className="mt-1 text-sm text-gray-600">{card.description}</p>
                  <Link href={card.href} className="mt-3 inline-block text-sm text-blue-600 hover:text-blue-700">
                    {card.cta} →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </Card>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <p className="text-sm font-medium text-gray-600">Szkice</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{draftCount}</p>
            <p className="mt-2 text-xs text-gray-500">Treści w trakcie pracy.</p>
            <Link href="/content" className="mt-3 inline-block text-xs text-blue-600 hover:text-blue-700">
              Przejdź do treści →
            </Link>
          </Card>
          <Card>
            <p className="text-sm font-medium text-gray-600">Do zatwierdzenia</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{awaitingApprovalCount}</p>
            <p className="mt-2 text-xs text-gray-500">Treści czekające na decyzję.</p>
            <Link href="/content" className="mt-3 inline-block text-xs text-blue-600 hover:text-blue-700">
              Przejdź do treści →
            </Link>
          </Card>
          <Card>
            <p className="text-sm font-medium text-gray-600">Zaplanowane</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{scheduledAll}</p>
            <p className="mt-2 text-xs text-gray-500">Publikacje z datą w przyszłości.</p>
            <Link href="/content" className="mt-3 inline-block text-xs text-blue-600 hover:text-blue-700">
              Przejdź do treści →
            </Link>
          </Card>
          <Card>
            <p className="text-sm font-medium text-gray-600">Opublikowane</p>
            <p className="mt-2 text-3xl font-semibold text-gray-900">{publishedLast30Days}</p>
            <p className="mt-2 text-xs text-gray-500">Ostatnie 30 dni.</p>
            <Link href="/content" className="mt-3 inline-block text-xs text-blue-600 hover:text-blue-700">
              Przejdź do treści →
            </Link>
          </Card>
        </div>

        <div id="timeline">
          <Card className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Harmonogram</h2>
              <p className="text-sm text-gray-600">Najbliższe publikacje w projekcie.</p>
            </div>
            {timeline.length === 0 ? (
              <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
                Brak zaplanowanych publikacji.
                <Link href="/content" className="mt-2 block text-sm text-blue-600 hover:text-blue-700">
                  Zaplanuj pierwszą publikację →
                </Link>
              </div>
            ) : (
              <div className="space-y-5">
                {timelineGroups.map((group) => (
                  <div key={group.label} className="space-y-2">
                    <p className="text-xs font-semibold uppercase text-gray-500">{group.label}</p>
                    {group.items.length === 0 ? (
                      <p className="text-xs text-gray-400">Brak publikacji.</p>
                    ) : (
                      <div className="space-y-2">
                        {group.items.map((item) => (
                          <div
                            key={`${group.label}-${item.topic}-${item.runAt?.toISOString() ?? "na"}`}
                            className="rounded-md border border-gray-200 px-3 py-2"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <div>
                                <p className="text-sm font-medium text-gray-900">{item.topic}</p>
                                <p className="text-xs text-gray-500">
                                  {item.runAt ? new Date(item.runAt).toLocaleString("pl-PL") : "Termin wkrótce"}
                                </p>
                              </div>
                              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">
                                {item.status}
                              </span>
                            </div>
                            <p className="mt-2 text-xs text-gray-500">Strona: wkrótce</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
          <Card className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Zdrowie projektu</h2>
              <p className="text-sm text-gray-600">
                Health Score to wskaźnik gotowości projektu do stabilnej publikacji.
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="rounded-full bg-gray-100 px-4 py-3 text-center">
                <p className="text-xs text-gray-500">Health Score</p>
                <p className="text-2xl font-semibold text-gray-900">{health.score}</p>
              </div>
              <div className="text-xs text-gray-500">
                Oceniane są konfiguracja stron, plan publikacji i gotowość zespołu.
              </div>
            </div>
            <div className="space-y-2">
              {health.checks.map((check) => (
                <div key={check.label} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        check.ok ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                      }`}
                    >
                      {check.ok ? "OK" : "Uwaga"}
                    </span>
                    <span className="text-gray-700">{check.label}</span>
                  </div>
                  <Link href={check.href} className="text-xs text-blue-600 hover:text-blue-700">
                    Napraw →
                  </Link>
                </div>
              ))}
            </div>
          </Card>

          <Card className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Insight tygodnia</h2>
              <p className="text-sm text-gray-600">Kontekst do decyzji i planowania.</p>
            </div>
            <div className="rounded-md border border-dashed border-gray-200 bg-gray-50 p-4 text-sm text-gray-600">
              {insight}
            </div>
            <span className="inline-flex rounded-full bg-gray-200 px-2 py-0.5 text-xs text-gray-600">
              AI (wkrótce)
            </span>
          </Card>
        </div>

        <div id="jobs">
          <Card className="space-y-2">
            <h2 className="text-lg font-semibold text-gray-900">Status projektu</h2>
            <div className="grid gap-3 md:grid-cols-3">
              <div className="rounded-md border border-gray-200 p-3">
                <p className="text-xs text-gray-500">Błędy publikacji (7 dni)</p>
                <p className="text-xl font-semibold text-gray-900">{failedJobsCount}</p>
              </div>
              <div className="rounded-md border border-gray-200 p-3">
                <p className="text-xs text-gray-500">Strony wymagające konfiguracji</p>
                <p className="text-xl font-semibold text-gray-900">{needsConfigCount}</p>
              </div>
              <div className="rounded-md border border-gray-200 p-3">
                <p className="text-xs text-gray-500">Strony nieaktywne</p>
                <p className="text-xl font-semibold text-gray-900">{inactiveSitesCount}</p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}
