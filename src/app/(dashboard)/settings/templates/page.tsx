import Link from "next/link";
import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/guards";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default async function TemplatesPage() {
  const { workspaceId } = await requireWorkspace();

  // Note: contentTemplate model exists in schema. Editor may show false type errors
  interface ContentTemplateLocal {
    id: string;
    name: string;
    description?: string | null;
    topic?: string | null;
    mainKeyword?: string | null;
    type?: string | null;
    createdAt: Date;
  }

  const templates = await (prisma as any).contentTemplate.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" }
  }) as ContentTemplateLocal[];

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Szablony treści</h1>
            <p className="mt-2 text-base text-gray-600">
              Zarządzaj szablonami do szybszego tworzenia treści.
            </p>
          </div>
          <Link href="/settings/templates/new">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white">
              + Nowy szablon
            </Button>
          </Link>
        </div>

        {/* Templates List */}
        {templates.length === 0 ? (
          <Card className="p-12 text-center">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
              <svg
                className="h-6 w-6 text-purple-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900">
              Brak szablonów
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Utwórz swój pierwszy szablon, aby przyspieszyć tworzenie treści.
            </p>
            <div className="mt-6">
              <Link href="/settings/templates/new">
                <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                  Utwórz szablon
                </Button>
              </Link>
            </div>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
              <Card
                key={template.id}
                className="p-4 hover:shadow-lg transition cursor-pointer group"
              >
                <Link href={`/settings/templates/${template.id}`}>
                  <div className="space-y-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 truncate">
                        {template.name}
                      </h3>
                      <p className="text-xs text-gray-600 mt-1">
                        {template.description || "Brak opisu"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <span className="inline-flex rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-700">
                        {template.type === "WP_POST" ? "📝 Blog" : "📱 LinkedIn"}
                      </span>
                      <span className="inline-flex rounded-full bg-purple-100 px-2 py-1 text-xs text-purple-700">
                        {template.mainKeyword}
                      </span>
                    </div>

                    <div className="text-xs text-gray-500">
                      Utworzony:{" "}
                      {new Date(template.createdAt).toLocaleDateString(
                        "pl-PL"
                      )}
                    </div>
                  </div>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
}
