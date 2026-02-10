import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/guards";

export async function getTemplates() {
  const { workspaceId } = await requireWorkspace();

  return prisma.contentTemplate.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" }
  });
}

export async function getTemplate(id: string) {
  const { workspaceId } = await requireWorkspace();

  return prisma.contentTemplate.findFirst({
    where: { id, workspaceId }
  });
}

export async function createTemplate(data: {
  name: string;
  description?: string;
  topic: string;
  mainKeyword: string;
  type: "WP_POST" | "LINKEDIN_POST";
  outline?: string;
  body?: string;
  metaTitle?: string;
  metaDescription?: string;
}) {
  const { workspaceId } = await requireWorkspace();

  return (prisma as any).contentTemplate.create({
    data: {
      workspaceId,
      ...data
    }
  });
}

export async function updateTemplate(
  id: string,
  data: {
    name?: string;
    description?: string;
    topic?: string;
    mainKeyword?: string;
    type?: "WP_POST" | "LINKEDIN_POST";
    outline?: string;
    body?: string;
    metaTitle?: string;
    metaDescription?: string;
  }
) {
  const { workspaceId } = await requireWorkspace();

  const template = await prisma.contentTemplate.findFirst({
    where: { id, workspaceId }
  });

  if (!template) {
    throw new Error("Template not found");
  }

  return (prisma as any).contentTemplate.update({
    where: { id },
    data
  });
}

export async function deleteTemplate(id: string) {
  const { workspaceId } = await requireWorkspace();

  const template = await prisma.contentTemplate.findFirst({
    where: { id, workspaceId }
  });

  if (!template) {
    throw new Error("Template not found");
  }

  return (prisma as any).contentTemplate.delete({
    where: { id }
  });
}
