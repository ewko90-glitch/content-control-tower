import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/guards";
import { AppShell } from "@/components/app-shell";
import { TemplateDetailClient } from "./client";

interface Props {
  params: { id: string };
}

export default async function TemplateDetailPage({ params }: Props) {
  const { workspaceId } = await requireWorkspace();

  const template = await prisma.contentTemplate.findFirst({
    where: { id: params.id, workspaceId }
  });

  if (!template) {
    notFound();
  }

  return (
    <AppShell>
      <div className="space-y-6 max-w-3xl">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{template.name}</h1>
          <p className="mt-2 text-base text-gray-600">
            Edytuj szablon treści
          </p>
        </div>

        <TemplateDetailClient template={template} />
      </div>
    </AppShell>
  );
}
