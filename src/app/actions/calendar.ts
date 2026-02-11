"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
// Prisma types not needed in this file
import { requireRole } from "@/lib/guards";
import { logAudit } from "@/lib/audit";

export type ScheduleState = { success: boolean; message?: string };

/**
 * Schedule a content item (APPROVED -> SCHEDULED)
 * Only APPROVER and OWNER can schedule
 */
export async function setSchedule(
  contentId: string,
  scheduledFor: Date
): Promise<ScheduleState> {
  const { user, workspaceId } = await requireRole("APPROVER");

  // Verify content exists and belongs to workspace
  const content = await prisma.contentItem.findFirst({
    where: { id: contentId, workspaceId }
  });

  if (!content) {
    return { success: false, message: "Nie znaleziono contentu." };
  }

  if (content.status !== "APPROVED") {
    return {
      success: false,
      message: "Można zaplanować tylko zatwierdzone treści."
    };
  }

  // Update content status and scheduledFor
  const updated = await prisma.contentItem.update({
    where: { id: contentId },
    data: {
      status: "SCHEDULED",
      scheduledFor: new Date(scheduledFor),
      scheduledBy: { connect: { id: user.id } }
    }
  });

  // Log to audit trail
  await logAudit({
    actorUserId: user.id,
    workspaceId,
    entityType: "ContentItem",
    entityId: contentId,
    action: "schedule",
    after: {
      status: updated.status,
      scheduledFor: updated.scheduledFor,
      scheduledById: user.id
    }
  });

  revalidatePath("/calendar");
  revalidatePath("/content");

  return { success: true, message: "Treść zaplanowana pomyślnie." };
}

/**
 * Reschedule a content item (move to different date)
 * Only APPROVER and OWNER can reschedule
 */
export async function reschedule(
  contentId: string,
  newScheduledFor: Date
): Promise<ScheduleState> {
  const { user, workspaceId } = await requireRole("APPROVER");

  // Verify content exists and belongs to workspace
  const content = await prisma.contentItem.findFirst({
    where: { id: contentId, workspaceId }
  });

  if (!content) {
    return { success: false, message: "Nie znaleziono contentu." };
  }

  if (content.status !== "SCHEDULED") {
    return {
      success: false,
      message: "Można przesunąć tylko zaplanowane treści."
    };
  }

  // Update scheduledFor
  const updated = await prisma.contentItem.update({
    where: { id: contentId },
    data: {
      scheduledFor: new Date(newScheduledFor)
    }
  });

  // Log to audit trail
  await logAudit({
    actorUserId: user.id,
    workspaceId,
    entityType: "ContentItem",
    entityId: contentId,
    action: "schedule",
    before: { scheduledFor: content.scheduledFor },
    after: { scheduledFor: updated.scheduledFor }
  });

  revalidatePath("/calendar");
  revalidatePath("/content");

  return { success: true, message: "Data publikacji zmieniona pomyślnie." };
}

/**
 * Unschedule a content item (SCHEDULED -> APPROVED, clear scheduledFor)
 * Only APPROVER and OWNER can unschedule
 */
export async function unschedule(contentId: string): Promise<ScheduleState> {
  const { user, workspaceId } = await requireRole("APPROVER");

  // Verify content exists and belongs to workspace
  const content = await prisma.contentItem.findFirst({
    where: { id: contentId, workspaceId }
  });

  if (!content) {
    return { success: false, message: "Nie znaleziono contentu." };
  }

  if (content.status !== "SCHEDULED") {
    return {
      success: false,
      message: "Można usunąć z kalendarza tylko zaplanowane treści."
    };
  }

  // Update status and clear scheduledFor
  const updated = await prisma.contentItem.update({
    where: { id: contentId },
    data: {
      status: "APPROVED",
      scheduledFor: null,
      scheduledBy: { disconnect: true }
    }
  });

  // Log to audit trail
  await logAudit({
    actorUserId: user.id,
    workspaceId,
    entityType: "ContentItem",
    entityId: contentId,
    action: "schedule",
    before: {
      status: content.status,
      scheduledFor: content.scheduledFor,
      scheduledById: content.scheduledById
    },
    after: {
      status: updated.status,
      scheduledFor: null,
      scheduledById: null
    }
  });

  revalidatePath("/calendar");
  revalidatePath("/content");

  return { success: true, message: "Treść wycofana z kalendarza." };
}
