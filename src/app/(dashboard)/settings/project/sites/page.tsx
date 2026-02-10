import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/guards";
import { getLimitsPlaceholder, getPlanPlaceholder } from "@/lib/plan-placeholder";
import { SettingsSitesOverview, type SiteSummary } from "@/components/settings-sites-overview";

function getIntegrationStatus(site: {
  type: "WORDPRESS" | "SHOPIFY" | "OTHER";
  wpUsername: string | null;
  wpAppPasswordEnc: string | null;
  shopifyShopDomain: string | null;
  shopifyAccessTokenEnc: string | null;
}) {
  if (site.type === "OTHER") {
    return "na" as const;
  }

  if (site.type === "WORDPRESS") {
    return site.wpUsername && site.wpAppPasswordEnc ? "configured" : "needs_config";
  }

  if (site.type === "SHOPIFY") {
    return site.shopifyShopDomain && site.shopifyAccessTokenEnc ? "configured" : "needs_config";
  }

  return "needs_config" as const;
}

export default async function ProjectSitesPage() {
  const { workspaceId } = await requireWorkspace();

  const sites = await prisma.site.findMany({
    where: { workspaceId },
    select: {
      id: true,
      name: true,
      baseUrl: true,
      type: true,
      status: true,
      wpUsername: true,
      wpAppPasswordEnc: true,
      shopifyShopDomain: true,
      shopifyAccessTokenEnc: true
    },
    orderBy: { createdAt: "desc" }
  });

  const summary: SiteSummary[] = sites.map((site) => ({
    id: site.id,
    name: site.name,
    baseUrl: site.baseUrl,
    type: site.type,
    status: site.status,
    integrationStatus: getIntegrationStatus(site)
  }));

  const totals = summary.reduce(
    (acc, site) => {
      if (site.integrationStatus === "configured") acc.configured += 1;
      if (site.integrationStatus === "needs_config") acc.needsConfig += 1;
      if (site.status === "INACTIVE") acc.inactive += 1;
      return acc;
    },
    { configured: 0, needsConfig: 0, inactive: 0 }
  );

  const { planKey } = getPlanPlaceholder();
  const limits = getLimitsPlaceholder(planKey);

  return (
    <SettingsSitesOverview
      sites={summary}
      total={summary.length}
      configured={totals.configured}
      needsConfig={totals.needsConfig}
      inactive={totals.inactive}
      limit={limits.sites}
    />
  );
}
