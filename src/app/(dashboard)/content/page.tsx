import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/guards";
import {
  approveContent,
  createDraft,
  generateContent,
  publishContent,
  rejectContent,
  scheduleContent,
  sendForApproval
} from "@/app/actions/content";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";

export default async function ContentPage() {
  const { workspaceId } = await requireWorkspace();
  const domains = await prisma.domain.findMany({ where: { workspaceId } });
  const items = await prisma.contentItem.findMany({
    where: { workspaceId },
    include: {
      versions: { orderBy: { version: "desc" }, take: 1 },
      domain: true
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <AppShell>
      <div className="grid gap-6">
        <Card>
          <h2 className="text-lg font-semibold">Nowy draft</h2>
          <form action={createDraft} className="mt-4 grid gap-2 md:grid-cols-2">
            <Input name="topic" placeholder="Temat" required />
            <Input name="mainKeyword" placeholder="Main keyword" required />
            <Select name="type">
              <option value="WP_POST">WP_POST</option>
              <option value="LINKEDIN_POST">LINKEDIN_POST (placeholder)</option>
            </Select>
            <Select name="domainId">
              <option value="">Bez domeny</option>
              {domains.map((domain) => (
                <option key={domain.id} value={domain.id}>
                  {domain.name}
                </option>
              ))}
            </Select>
            <div className="md:col-span-2">
              <Button type="submit">Utwórz draft</Button>
            </div>
          </form>
        </Card>

        <div className="grid gap-4">
          {items.map((item) => (
            <Card key={item.id}>
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-semibold">{item.topic}</h3>
                  <p className="text-sm text-gray-500">
                    {item.type} • {item.status}
                  </p>
                  <p className="text-xs text-gray-400">Domena: {item.domain?.name ?? "brak"}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <form action={generateContent.bind(null, item.id)}>
                    <Button type="submit" variant="secondary">
                      Generate
                    </Button>
                  </form>
                  <form action={sendForApproval.bind(null, item.id)}>
                    <Button type="submit" variant="secondary">
                      Send for approval
                    </Button>
                  </form>
                  <form action={approveContent.bind(null, item.id)}>
                    <Button type="submit" variant="secondary">
                      Approve
                    </Button>
                  </form>
                  <form
                    action={async (formData) => {
                      "use server";
                      const comment = String(formData.get("comment") || "Brak");
                      await rejectContent(item.id, comment);
                    }}
                  >
                    <input name="comment" type="hidden" value="Brak akceptacji" />
                    <Button type="submit" variant="secondary">
                      Reject
                    </Button>
                  </form>
                </div>
              </div>
              <div className="mt-4 grid gap-2 md:grid-cols-2">
                <form
                  action={async (formData) => {
                    "use server";
                    await scheduleContent(item.id, formData);
                  }}
                  className="flex gap-2"
                >
                  <Input name="scheduledFor" type="datetime-local" />
                  <Button type="submit" variant="secondary">
                    Schedule
                  </Button>
                </form>
                <div className="flex gap-2">
                  <form action={publishContent.bind(null, item.id, "draft")}>
                    <Button type="submit" variant="secondary">
                      Publish Draft
                    </Button>
                  </form>
                  <form action={publishContent.bind(null, item.id, "future")}>
                    <Button type="submit" variant="secondary">
                      Publish Scheduled
                    </Button>
                  </form>
                </div>
              </div>
              {item.versions[0] && (
                <div className="mt-4 text-sm text-gray-700">
                  <p className="font-medium">{item.versions[0].title}</p>
                  <p className="text-xs text-gray-500">{item.versions[0].metaDescription}</p>
                </div>
              )}
            </Card>
          ))}
        </div>
      </div>
    </AppShell>
  );
}
