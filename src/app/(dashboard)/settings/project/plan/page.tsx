import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/guards";
import { getLimitsPlaceholder, getPlanPlaceholder } from "@/lib/plan-placeholder";
import { PlanAndLimits } from "@/components/plan-and-limits";

export default async function ProjectPlanPage() {
  const { workspaceId } = await requireWorkspace();

  const [membersCount, sitesCount, domainsCount, contentCount] = await Promise.all([
    prisma.membership.count({ where: { workspaceId } }),
    prisma.site.count({ where: { workspaceId } }),
    prisma.domain.count({ where: { workspaceId } }),
    prisma.contentItem.count({ where: { workspaceId } })
  ]);

  const { planKey, billingCycle } = getPlanPlaceholder();
  const limits = getLimitsPlaceholder(planKey);

  return (
    <PlanAndLimits
      planKey={planKey}
      defaultCycle={billingCycle}
      limits={limits}
      membersCount={membersCount}
      sitesCount={sitesCount}
      domainsCount={domainsCount}
      contentCount={contentCount}
    />
  );
}
