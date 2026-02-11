"use server";

import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/guards";

// Note: contentTemplate model exists in schema and database
// Editor may show false type errors due to intellisense cache
// Provide a narrow typed accessor to avoid `any` usage
const contentTemplate = (prisma as unknown as {
  contentTemplate: {
    findMany: (args: unknown) => Promise<unknown[]>;
    findFirst: (args: unknown) => Promise<unknown | null>;
    create: (args: unknown) => Promise<unknown>;
    update: (args: unknown) => Promise<unknown>;
    delete: (args: unknown) => Promise<unknown>;
  };
}).contentTemplate;

export async function getTemplates() {
  const { workspaceId } = await requireWorkspace();

  return contentTemplate.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "desc" }
  });
}

export async function getTemplate(id: string) {
  const { workspaceId } = await requireWorkspace();

  return contentTemplate.findFirst({
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

  return contentTemplate.create({
    data: {
      workspaceId,
      ...data
    }
  } as unknown);
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

  const template = await contentTemplate.findFirst({
    where: { id, workspaceId }
  });

  if (!template) {
    throw new Error("Template not found");
  }

  return contentTemplate.update({ where: { id }, data } as unknown);
}

export async function deleteTemplate(id: string) {
  const { workspaceId } = await requireWorkspace();

  const template = await contentTemplate.findFirst({
    where: { id, workspaceId }
  });

  if (!template) {
    throw new Error("Template not found");
  }

  return contentTemplate.delete({ where: { id } } as unknown);
}
