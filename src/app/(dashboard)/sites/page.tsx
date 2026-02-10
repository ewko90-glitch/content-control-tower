import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/guards";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { SitesPageClient } from "./page-client";

export default async function SitesPage() {
  const { workspaceId } = await requireWorkspace();

  const sites = await prisma.site.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" }
  });

  return (
    <AppShell>
      <div className="grid gap-6">
        <div className="mb-4">
          <h1 className="text-3xl font-bold text-gray-900">Strony</h1>
          <p className="mt-2 text-gray-600">
            Dodaj miejsca publikacji (WordPress, Shopify lub inne) dla tego projektu.
          </p>
        </div>

        <Card>
          <SitesPageClient sites={sites} />
        </Card>
      </div>
    </AppShell>
  );
}
