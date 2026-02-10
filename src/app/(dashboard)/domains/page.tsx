import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/guards";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { DomainsPageClient } from "./domains-page-client";

export default async function DomainsPage() {
  const { workspaceId } = await requireWorkspace();
  const domains = await prisma.domain.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" }
  });

  return (
    <AppShell>
      <div className="grid gap-6">
        <div className="mb-2">
          <h1 className="text-2xl font-bold text-gray-900">Domeny</h1>
          <p className="mt-1 text-sm text-gray-600">
            Domeny pomagają uporządkować treści według marek, projektów, kampanii lub klientów.
          </p>
        </div>

        <Card>
          <DomainsPageClient initialDomains={domains} />
        </Card>
      </div>
    </AppShell>
  );
}
