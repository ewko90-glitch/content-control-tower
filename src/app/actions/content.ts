"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole, requireWorkspace } from "@/lib/guards";
import { contentDraftSchema, scheduleSchema } from "@/lib/validators";
import { generateMockContent } from "@/lib/mock-generator";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { publishWordPressPost } from "@/lib/wp";

export type ContentState = { success: boolean; message?: string };

export async function createDraft(_: ContentState, formData: FormData): Promise<ContentState> {
  const { user, workspaceId } = await requireRole("EDITOR");
  const parsed = contentDraftSchema.safeParse({
    topic: formData.get("topic"),
    mainKeyword: formData.get("mainKeyword"),
    domainId: formData.get("domainId") || undefined,
    type: formData.get("type")
  });
  if (!parsed.success) {
    return { success: false, message: "Nieprawidłowe dane contentu." };
  }
  const item = await prisma.contentItem.create({
    data: {
      workspaceId,
      domainId: parsed.data.domainId ?? null,
      type: parsed.data.type,
      status: "DRAFT",
      topic: parsed.data.topic,
      mainKeyword: parsed.data.mainKeyword,
      createdById: user.id
    }
  });
  await logAudit({
    actorUserId: user.id,
    workspaceId,
    entityType: "ContentItem",
    entityId: item.id,
    action: "create",
    after: { status: item.status }
  });
  revalidatePath("/content");
  return { success: true };
}

export async function generateContent(contentId: string): Promise<ContentState> {
  const { user, workspaceId } = await requireRole("EDITOR");
  const item = await prisma.contentItem.findFirst({
    where: { id: contentId, workspaceId },
    include: { domain: true }
  });
  if (!item) {
    return { success: false, message: "Nie znaleziono contentu." };
  }
  const internalLinks = await prisma.internalLink.findMany({
    where: { workspaceId, domainId: item.domainId ?? undefined },
    take: 3
  });
  const externalLinks = await prisma.externalLink.findMany({
    where: { workspaceId },
    take: 3
  });
  const mock = generateMockContent({
    topic: item.topic,
    mainKeyword: item.mainKeyword,
    internalLinks,
    externalLinks
  });
  const versionCount = await prisma.contentVersion.count({ where: { contentItemId: item.id } });
  await prisma.contentVersion.create({
    data: {
      contentItemId: item.id,
      version: versionCount + 1,
      title: mock.title,
      outline: mock.outline,
      body: mock.body,
      metaTitle: mock.metaTitle,
      metaDescription: mock.metaDescription,
      suggestedInternalLinks: mock.suggestedInternalLinks,
      suggestedExternalLinks: mock.suggestedExternalLinks
    }
  });
  const updated = await prisma.contentItem.update({
    where: { id: item.id },
    data: { status: "GENERATED" }
  });
  await logAudit({
    actorUserId: user.id,
    workspaceId,
    entityType: "ContentItem",
    entityId: item.id,
    action: "status_change",
    before: { status: item.status },
    after: { status: updated.status }
  });
  revalidatePath("/content");
  return { success: true };
}

export async function sendForApproval(contentId: string): Promise<ContentState> {
  const { user, workspaceId } = await requireRole("EDITOR");
  const item = await prisma.contentItem.findFirst({ where: { id: contentId, workspaceId } });
  if (!item) {
    return { success: false, message: "Nie znaleziono contentu." };
  }
  const updated = await prisma.contentItem.update({
    where: { id: item.id },
    data: { status: "AWAITING_APPROVAL" }
  });
  await logAudit({
    actorUserId: user.id,
    workspaceId,
    entityType: "ContentItem",
    entityId: item.id,
    action: "status_change",
    before: { status: item.status },
    after: { status: updated.status }
  });
  revalidatePath("/content");
  return { success: true };
}

export async function approveContent(contentId: string): Promise<ContentState> {
  const { user, workspaceId } = await requireRole("APPROVER");
  const item = await prisma.contentItem.findFirst({ where: { id: contentId, workspaceId } });
  if (!item) {
    return { success: false, message: "Nie znaleziono contentu." };
  }
  const updated = await prisma.contentItem.update({
    where: { id: item.id },
    data: { status: "APPROVED", approvedById: user.id }
  });
  await logAudit({
    actorUserId: user.id,
    workspaceId,
    entityType: "ContentItem",
    entityId: item.id,
    action: "approve",
    before: { status: item.status },
    after: { status: updated.status }
  });
  await notify({
    workspaceId,
    userId: item.createdById,
    message: `Content ${item.topic} został zatwierdzony.`
  });
  revalidatePath("/content");
  return { success: true };
}

export async function rejectContent(contentId: string, comment: string): Promise<ContentState> {
  const { user, workspaceId } = await requireRole("APPROVER");
  const item = await prisma.contentItem.findFirst({ where: { id: contentId, workspaceId } });
  if (!item) {
    return { success: false, message: "Nie znaleziono contentu." };
  }
  const updated = await prisma.contentItem.update({
    where: { id: item.id },
    data: { status: "REJECTED" }
  });
  await logAudit({
    actorUserId: user.id,
    workspaceId,
    entityType: "ContentItem",
    entityId: item.id,
    action: "reject",
    before: { status: item.status },
    after: { status: updated.status, comment }
  });
  await notify({
    workspaceId,
    userId: item.createdById,
    message: `Content ${item.topic} odrzucony. Komentarz: ${comment}`
  });
  revalidatePath("/content");
  return { success: true };
}

export async function scheduleContent(contentId: string, formData: FormData): Promise<ContentState> {
  const { user, workspaceId } = await requireRole("APPROVER");
  const parsed = scheduleSchema.safeParse({ scheduledFor: formData.get("scheduledFor") });
  if (!parsed.success) {
    return { success: false, message: "Podaj datę publikacji." };
  }
  const item = await prisma.contentItem.findFirst({ where: { id: contentId, workspaceId } });
  if (!item || item.status !== "APPROVED") {
    return { success: false, message: "Content musi być APPROVED." };
  }
  const scheduledFor = new Date(parsed.data.scheduledFor);
  const updated = await prisma.contentItem.update({
    where: { id: item.id },
    data: { status: "SCHEDULED", scheduledFor }
  });
  await logAudit({
    actorUserId: user.id,
    workspaceId,
    entityType: "ContentItem",
    entityId: item.id,
    action: "schedule",
    before: { status: item.status },
    after: { status: updated.status, scheduledFor }
  });
  revalidatePath("/content");
  return { success: true };
}

export async function publishContent(contentId: string, mode: "draft" | "future"): Promise<ContentState> {
  const { user, workspaceId } = await requireRole("APPROVER");
  const item = await prisma.contentItem.findFirst({
    where: { id: contentId, workspaceId },
    include: { domain: true, versions: { orderBy: { version: "desc" }, take: 1 } }
  });
  if (!item || item.status !== "APPROVED") {
    return { success: false, message: "Content musi być APPROVED." };
  }
  if (!item.domain) {
    return { success: false, message: "Content nie ma przypisanej domeny." };
  }
  const latest = item.versions[0];
  if (!latest) {
    return { success: false, message: "Brak wygenerowanej wersji." };
  }
  try {
    const response = await publishWordPressPost({
      creds: {
        siteUrl: item.domain.siteUrl,
        username: item.domain.wpUsername,
        appPassword: {
          ciphertext: item.domain.wpAppPasswordEnc,
          iv: item.domain.wpAppPasswordIv,
          tag: item.domain.wpAppPasswordTag
        }
      },
      title: latest.title,
      content: latest.body,
      status: mode,
      dateGmt: mode === "future" ? item.scheduledFor?.toISOString() : undefined
    });
    const updated = await prisma.contentItem.update({
      where: { id: item.id },
      data: {
        status: mode === "future" ? "SCHEDULED" : "PUBLISHED",
        wpPostId: response.id,
        wpUrl: response.link ?? null,
        publishedAt: mode === "draft" ? new Date() : null
      }
    });
    await logAudit({
      actorUserId: user.id,
      workspaceId,
      entityType: "ContentItem",
      entityId: item.id,
      action: "publish_attempt",
      before: { status: item.status },
      after: { status: updated.status, wpPostId: updated.wpPostId }
    });
    revalidatePath("/content");
    return { success: true };
  } catch (error) {
    await logAudit({
      actorUserId: user.id,
      workspaceId,
      entityType: "ContentItem",
      entityId: item.id,
      action: "publish_attempt",
      after: { error: (error as Error).message }
    });
    return { success: false, message: (error as Error).message };
  }
}

export async function getContentCalendar() {
  const { workspaceId } = await requireWorkspace();
  const items = await prisma.contentItem.findMany({
    where: { workspaceId },
    orderBy: { createdAt: "asc" }
  });
  return items;
}
