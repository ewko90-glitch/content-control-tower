import { prisma } from "@/lib/db";

export type InboxItem = {
  id: string;
  kind: "approval" | "publication_error" | "site_config" | "no_schedule";
  title: string;
  description: string;
  ctaLabel: string;
  ctaUrl: string;
  priority: "Pilne" | "Wymaga decyzji" | "Wymaga uwagi";
  detectedAt: Date;
  related?: { type: string; id?: string };
};

export async function getInboxItems(workspaceId: string): Promise<InboxItem[]> {
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const inSevenDays = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  const [approvals, failedJobs, sites, scheduledCount] = await Promise.all([
    prisma.contentItem.findMany({
      where: { workspaceId, status: "AWAITING_APPROVAL" },
      select: { id: true, topic: true, createdAt: true }
    }),
    prisma.publicationJob.findMany({
      where: { workspaceId, status: "FAILED", createdAt: { gte: sevenDaysAgo } },
      include: { contentItem: { select: { id: true, topic: true } } }
    }),
    prisma.domain.findMany({
      where: {
        workspaceId,
        OR: [
          { wpAppPasswordEnc: "" },
          { wpAppPasswordEnc: null }
        ]
      },
      select: { id: true, name: true, workspaceId: true }
    }),
    prisma.contentItem.count({
      where: { workspaceId, scheduledFor: { gte: now, lt: inSevenDays } }
    })
  ]);

  const items: InboxItem[] = [];

  // Content awaiting approval
  for (const a of approvals) {
    items.push({
      id: `approval_${a.id}`,
      kind: "approval",
      title: "Treść czeka na zatwierdzenie",
      description: `„${a.topic}” wymaga Twojej decyzji.`,
      ctaLabel: "Zatwierdź",
      ctaUrl: `/content/${a.id}`,
      priority: "Wymaga decyzji",
      detectedAt: a.createdAt,
      related: { type: "ContentItem", id: a.id }
    });
  }

  // Publication errors
  for (const j of failedJobs) {
    const topic = j.contentItem?.topic ?? "(brak tytułu)";
    const contentId = j.contentItem?.id;
    items.push({
      id: `puberr_${j.id}`,
      kind: "publication_error",
      title: "Publikacja nie powiodła się",
      description: `Nie udało się opublikować treści „${topic}”.`,
      ctaLabel: "Sprawdź",
      ctaUrl: contentId ? `/content/${contentId}` : `/overview#jobs`,
      priority: "Pilne",
      detectedAt: j.createdAt,
      related: { type: "PublicationJob", id: j.id }
    });
  }

  // Sites requiring configuration
  // Priority is Pilne if there are scheduled contents
  const hasScheduled = (await prisma.contentItem.count({ where: { workspaceId, status: "SCHEDULED" } })) > 0;
  for (const s of sites) {
    items.push({
      id: `sitecfg_${s.id}`,
      kind: "site_config",
      title: "Strona wymaga konfiguracji",
      description: `„${s.name}” nie ma danych integracji.`,
      ctaLabel: "Skonfiguruj",
      ctaUrl: `/settings/project/sites`,
      priority: hasScheduled ? "Pilne" : "Wymaga uwagi",
      detectedAt: new Date(),
      related: { type: "Domain", id: s.id }
    });
  }

  // Heuristic: no scheduled publications in next 7 days
  if (scheduledCount === 0) {
    items.push({
      id: `noschedule_${workspaceId}`,
      kind: "no_schedule",
      title: "Brak zaplanowanych publikacji",
      description: "Nie masz publikacji zaplanowanych na najbliższy tydzień.",
      ctaLabel: "Zaplanuj",
      ctaUrl: `/calendar`,
      priority: "Wymaga uwagi",
      detectedAt: new Date(),
      related: { type: "Heuristic" }
    });
  }

  // Sort by priority: Pilne, Wymaga decyzji, Wymaga uwagi
  const priorityOrder = { Pilne: 0, "Wymaga decyzji": 1, "Wymaga uwagi": 2 } as Record<string, number>;
  items.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return items;
}
