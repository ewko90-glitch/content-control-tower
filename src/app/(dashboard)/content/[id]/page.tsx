import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/guards";
import { AppShell } from "@/components/app-shell";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ContentDecisionPanel } from "@/components/content-decision-panel";
import { ContentAuditHistory } from "@/components/content-audit-history";
import { getStatusColor, getStatusLabel } from "@/lib/workflow";

interface Props {
  params: { id: string };
}

export default async function ContentDetailPage({ params }: Props) {
  const { user, workspaceId, membership } = await requireWorkspace();

  const item = await prisma.contentItem.findFirst({
    where: { id: params.id, workspaceId },
    include: {
      createdBy: true,
      approvedBy: true,
      versions: { orderBy: { version: "desc" } }
    }
  });

  if (!item) {
    notFound();
  }

  const auditLogs = await prisma.auditLog.findMany({
    where: {
      workspaceId,
      entityType: "ContentItem",
      entityId: item.id
    },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { actor: true }
  });

  const isAuthor = item.createdById === user.id;
  const canApprove = membership.role === "APPROVER" || membership.role === "OWNER";
  const canSchedule = membership.role === "OWNER" || membership.role === "APPROVER";

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header with back link */}
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <Link href="/content" className="text-xs text-blue-600 hover:underline">
              ← Wróć do treści
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 mt-2 line-clamp-2">
              {item.topic}
            </h1>
          </div>
          <span
            className={`inline-flex rounded-full px-3 py-1 text-sm font-medium flex-shrink-0 ${getStatusColor(item.status as any)}`}
          >
            {getStatusLabel(item.status as any)}
          </span>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
          {/* Main Content */}
          <div className="space-y-6">
            {/* Meta Information */}
            <Card className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Informacje</h2>
              <div className="grid gap-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Typ:</span>
                  <span className="font-medium text-gray-900">{item.type}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Główne słowo kluczowe:</span>
                  <span className="font-medium text-gray-900">{item.mainKeyword}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Autor:</span>
                  <span className="font-medium text-gray-900">
                    {item.createdBy?.name || "—"} {isAuthor && "(Ty)"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium text-gray-900">
                    {getStatusLabel(item.status as any)}
                  </span>
                </div>
                {item.approvedById && item.approvedBy && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Zatwierdzył:</span>
                    <span className="font-medium text-gray-900">{item.approvedBy.name}</span>
                  </div>
                )}
                {item.scheduledFor && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Zaplanowana data:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(item.scheduledFor).toLocaleString("pl-PL")}
                    </span>
                  </div>
                )}
                {item.publishedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Opublikowana:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(item.publishedAt).toLocaleString("pl-PL")}
                    </span>
                  </div>
                )}
              </div>
            </Card>

            {/* Latest Version */}
            {item.versions && item.versions.length > 0 && (
              <Card className="space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Ostatnia wersja (v{item.versions[0].version})
                </h2>
                <div className="space-y-4">
                  {item.versions[0].title && (
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-semibold">Tytuł</p>
                      <p className="mt-1 text-base font-medium text-gray-900">
                        {item.versions[0].title}
                      </p>
                    </div>
                  )}
                  {item.versions[0].metaTitle && (
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-semibold">Meta Title (SEO)</p>
                      <p className="mt-1 text-sm text-gray-700">{item.versions[0].metaTitle}</p>
                    </div>
                  )}
                  {item.versions[0].metaDescription && (
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-semibold">Meta Description (SEO)</p>
                      <p className="mt-1 text-sm text-gray-700">
                        {item.versions[0].metaDescription}
                      </p>
                    </div>
                  )}
                  {item.versions[0].outline && (
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-semibold">Outline</p>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm whitespace-pre-wrap text-gray-700">
                        {item.versions[0].outline}
                      </div>
                    </div>
                  )}
                  {item.versions[0].body && (
                    <div>
                      <p className="text-xs text-gray-600 uppercase font-semibold">Zawartość</p>
                      <div className="mt-1 p-3 bg-gray-50 rounded-md text-sm max-h-80 overflow-y-auto whitespace-pre-wrap text-gray-700">
                        {item.versions[0].body}
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            )}

            {/* Audit History */}
            <Card className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Historia zmian</h2>
              <ContentAuditHistory logs={auditLogs} />
            </Card>
          </div>

          {/* Sidebar - Decision Panel */}
          <div className="space-y-6">
            <ContentDecisionPanel
              item={item}
              currentUserId={user.id}
              isAuthor={isAuthor}
              userRole={membership.role}
              canApprove={canApprove}
              canSchedule={canSchedule}
            />
          </div>
        </div>
      </div>
    </AppShell>
  );
}
