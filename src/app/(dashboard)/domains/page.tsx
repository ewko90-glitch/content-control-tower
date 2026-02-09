import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/guards";
import { createDomain, fetchDomainSitemap, addManualLinks, testDomainConnection } from "@/app/actions/domains";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert } from "@/components/ui/alert";

export default async function DomainsPage() {
  const { workspaceId } = await requireWorkspace();
  const domains = await prisma.domain.findMany({
    where: { workspaceId },
    include: { internalLinks: true }
  });

  return (
    <AppShell>
      <div className="grid gap-6">
        <Card>
          <h2 className="text-lg font-semibold">Dodaj domenę WordPress</h2>
          <form action={createDomain} className="mt-4 grid gap-2 md:grid-cols-2">
            <Input name="name" placeholder="Nazwa" required />
            <Input name="siteUrl" placeholder="https://twojadomena.pl" required />
            <Input name="wpUsername" placeholder="WP username" required />
            <Input name="wpAppPassword" placeholder="WP app password" required type="password" />
            <div className="md:col-span-2">
              <Button type="submit">Zapisz</Button>
            </div>
          </form>
        </Card>

        <div className="grid gap-4">
          {domains.length === 0 && <Alert>Brak domen. Dodaj pierwszą.</Alert>}
          {domains.map((domain) => (
            <Card key={domain.id}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold">{domain.name}</h3>
                  <p className="text-sm text-gray-500">{domain.siteUrl}</p>
                  <p className="text-xs text-gray-400">Internal links: {domain.internalLinks.length}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={testDomainConnection.bind(null, domain.id)}>
                    <Button type="submit" variant="secondary">
                      Testuj połączenie
                    </Button>
                  </form>
                  <form action={fetchDomainSitemap.bind(null, domain.id)}>
                    <Button type="submit" variant="secondary">
                      Pobierz sitemap
                    </Button>
                  </form>
                </div>
              </div>
              <div className="mt-4">
                <p className="text-sm font-medium">Dodaj URL ręcznie (fallback)</p>
                <form
                  action={addManualLinks.bind(null, domain.id, { success: false })}
                  className="mt-2 grid gap-2"
                >
                  <textarea
                    name="urls"
                    rows={3}
                    className="w-full rounded-md border border-gray-300 p-2 text-sm"
                    placeholder="https://example.com/strona-1\nhttps://example.com/strona-2"
                  />
                  <Button type="submit" variant="secondary">
                    Zapisz linki
                  </Button>
                </form>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
