"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole, requireWorkspace } from "@/lib/guards";
import { contentDraftSchema, scheduleSchema } from "@/lib/validators";
import { generateMockContent } from "@/lib/mock-generator";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications";
import { publishWordPressPost } from "@/lib/wp";
import { triggerWebhooks } from "@/lib/webhooks";

export type ContentState = { success: boolean; message?: string };

export async function createDraft(_: ContentState, formData: FormData): Promise<ContentState> {
  const { user, workspaceId } = await requireRole("EDITOR");
  
  const templateId = formData.get("templateId") as string | null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let templateData: any = null;

  // If template selected, fetch and pre-fill
  if (templateId) {
    templateData = await prisma.contentTemplate.findFirst({
      where: { id: templateId, workspaceId }
    });
    if (!templateData) {
      return { success: false, message: "Szablon nie znaleziony." };
    }
  }

  const parsed = contentDraftSchema.safeParse({
    topic: formData.get("topic") || templateData?.topic,
    mainKeyword: formData.get("mainKeyword") || templateData?.mainKeyword,
    domainId: formData.get("domainId") || undefined,
    type: formData.get("type") || templateData?.type
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
      createdById: user.id,
      templateId: templateId || null
    }
  });

  // If template selected, create initial version from template
  if (templateData) {
    await prisma.contentVersion.create({
      data: {
        contentItemId: item.id,
        version: 1,
        title: templateData.topic,
        outline: templateData.outline || "",
        body: templateData.body || "",
        metaTitle: templateData.metaTitle || "",
        metaDescription: templateData.metaDescription || ""
      }
    });
  }

  await logAudit({
    actorUserId: user.id,
    workspaceId,
    entityType: "ContentItem",
    entityId: item.id,
    action: "create",
    after: { status: item.status, templateId }
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
  await triggerWebhooks(workspaceId, "APPROVAL_REQUESTED", {
    contentItemId: item.id,
    topic: item.topic,
    status: "AWAITING_APPROVAL",
    actorId: user.id
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
  await triggerWebhooks(workspaceId, "APPROVED", {
    contentItemId: item.id,
    topic: item.topic,
    status: "APPROVED",
    actorId: user.id
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
  await triggerWebhooks(workspaceId, "REJECTED", {
    contentItemId: item.id,
    topic: item.topic,
    status: "REJECTED",
    actorId: user.id
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
  if (!item.domain.siteUrl || !item.domain.wpUsername || !item.domain.wpAppPasswordEnc || !item.domain.wpAppPasswordIv || !item.domain.wpAppPasswordTag) {
    return { success: false, message: "Domena nie ma skonfigurowanych danych WordPress." };
  }
  const latest = item.versions[0];
  if (!latest) {
    return { success: false, message: "Brak wygenerowanej wersji." };
  }
  try {
    const response = await publishWordPressPost({
      creds: {
        siteUrl: item.domain.siteUrl as string,
        username: item.domain.wpUsername as string,
        appPassword: {
          ciphertext: item.domain.wpAppPasswordEnc as string,
          iv: item.domain.wpAppPasswordIv as string,
          tag: item.domain.wpAppPasswordTag as string
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
    if (mode === "draft") {
      await triggerWebhooks(workspaceId, "PUBLISHED", {
        contentItemId: item.id,
        topic: item.topic,
        status: "PUBLISHED",
        actorId: user.id
      });
    }
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

/**
 * Generic status update with workflow validation
 */
export async function updateContentStatus(
  contentId: string,
  nextStatus: "DRAFT" | "AWAITING_APPROVAL" | "APPROVED" | "SCHEDULED" | "PUBLISHED" | "REJECTED",
  payload?: { comment?: string; scheduledFor?: string }
): Promise<ContentState> {
  const { user, workspaceId, membership } = await requireWorkspace();
  const userRole = membership.role;

  const item = await prisma.contentItem.findFirst({
    where: { id: contentId, workspaceId }
  });

  if (!item) {
    return { success: false, message: "Nie znaleziono treści." };
  }

  // Import workflow validation
  const { canTransition } = await import("@/lib/workflow");
  const { allowed, reason } = canTransition(
    item.status as any,
    nextStatus,
    userRole,
    item.createdById === user.id
  );

  if (!allowed) {
    return { success: false, message: reason || "Akcja niedozwolona." };
  }

  // Validate required data
  if (nextStatus === "REJECTED" && !payload?.comment) {
    return { success: false, message: "Wymagany komentarz przy odrzuceniu." };
  }

  if (nextStatus === "SCHEDULED" && !payload?.scheduledFor) {
    return { success: false, message: "Wymagana data przy planowaniu." };
  }

  try {
    const updateData: any = { status: nextStatus };

    if (nextStatus === "APPROVED") {
      updateData.approvedById = user.id;
    }

    if (nextStatus === "SCHEDULED" && payload?.scheduledFor) {
      updateData.scheduledFor = new Date(payload.scheduledFor);
    }

    const updated = await prisma.contentItem.update({
      where: { id: item.id },
      data: updateData
    });

    await logAudit({
      actorUserId: user.id,
      workspaceId,
      entityType: "ContentItem",
      entityId: item.id,
      action: "status_change",
      before: { status: item.status },
      after: {
        status: updated.status,
        ...(payload?.comment && { comment: payload.comment }),
        ...(updated.scheduledFor && { scheduledFor: updated.scheduledFor })
      }
    });

    revalidatePath("/content");
    return { success: true, message: `Status zmieniony na: ${nextStatus}` };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}

/**
 * Reset rejected content back to draft
 */
export async function resetToDraft(contentId: string): Promise<ContentState> {
  const { user, workspaceId, membership } = await requireWorkspace();

  const item = await prisma.contentItem.findFirst({
    where: { id: contentId, workspaceId }
  });

  if (!item) {
    return { success: false, message: "Nie znaleziono treści." };
  }

  if (item.status !== "REJECTED") {
    return { success: false, message: "Tylko odrzucone treści można przywrócić." };
  }

  // Only OWNER or AUTHOR can reset to draft
  if (membership.role !== "OWNER" && item.createdById !== user.id) {
    return { success: false, message: "Brak uprawnień." };
  }

  const updated = await prisma.contentItem.update({
    where: { id: item.id },
    data: { status: "DRAFT" }
  });

  await logAudit({
    actorUserId: user.id,
    workspaceId,
    entityType: "ContentItem",
    entityId: item.id,
    action: "status_change",
    before: { status: item.status },
    after: { status: updated.status, reason: "Przywrócono do szkicu" }
  });

  revalidatePath("/content");
  return { success: true, message: "Treść przywrócona do szkicu." };
}

/**
 * Schedule content for publication
 */
export async function schedulePublication(contentId: string, scheduledFor: Date): Promise<ContentState> {
  const { user, workspaceId } = await requireRole("APPROVER");

  const item = await prisma.contentItem.findFirst({
    where: { id: contentId, workspaceId }
  });

  if (!item) {
    return { success: false, message: "Nie znaleziono treści." };
  }

  if (item.status !== "APPROVED") {
    return { success: false, message: "Tylko zatwierdzone treści można zaplanować." };
  }

  if (scheduledFor <= new Date()) {
    return { success: false, message: "Data publikacji musi być w przyszłości." };
  }

  await prisma.contentItem.update({
    where: { id: item.id },
    data: {
      status: "SCHEDULED",
      scheduledFor,
      scheduledById: user.id
    }
  });

  await logAudit({
    actorUserId: user.id,
    workspaceId,
    entityType: "ContentItem",
    entityId: item.id,
    action: "schedule",
    before: { status: item.status },
    after: { status: "SCHEDULED", scheduledFor }
  });

  await notify({
    workspaceId,
    userId: item.createdById,
    message: `Twoja treść "${item.topic}" zaplanowana do publikacji ${scheduledFor.toLocaleString("pl-PL")}`
  });

  revalidatePath(`/content/${contentId}`);
  return { success: true, message: "Treść zaplanowana do publikacji." };
}

/**
 * Cancel scheduled publication
 */
export async function cancelSchedule(contentId: string): Promise<ContentState> {
  const { user, workspaceId, membership } = await requireWorkspace();

  const item = await prisma.contentItem.findFirst({
    where: { id: contentId, workspaceId }
  });

  if (!item) {
    return { success: false, message: "Nie znaleziono treści." };
  }

  if (item.status !== "SCHEDULED") {
    return { success: false, message: "Ta treść nie jest zaplanowana." };
  }

  // Only OWNER or APPROVER or AUTHOR can cancel
  if (membership.role === "EDITOR" && item.createdById !== user.id) {
    return { success: false, message: "Brak uprawnień." };
  }

  await prisma.contentItem.update({
    where: { id: item.id },
    data: {
      status: "APPROVED",
      scheduledFor: null,
      scheduledById: null
    }
  });

  await logAudit({
    actorUserId: user.id,
    workspaceId,
    entityType: "ContentItem",
    entityId: item.id,
    action: "status_change",
    before: { status: item.status, scheduledFor: item.scheduledFor },
    after: { status: "APPROVED" }
  });

  await notify({
    workspaceId,
    userId: item.createdById,
    message: `Plan publikacji treści "${item.topic}" został anulowany`
  });

  revalidatePath(`/content/${contentId}`);
  return { success: true, message: "Plan publikacji anulowany." };
}
