import { prisma } from "@/lib/db";
// publishWordPressPost: kept for future WP impl; currently unused
import { triggerWebhooks } from "@/lib/webhooks";
import { logAudit } from "@/lib/audit";
/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
type DueItem = any;

export interface PublicationJob {
  id: string;
  contentItemId: string;
  scheduledFor: Date;
  status: "PENDING" | "RUNNING" | "DONE" | "FAILED";
  lastError?: string;
  attempts: number;
}

/**
 * Main scheduler function - call this from a cron job or API route
 * Processes all pending publications that are due
 */
export async function processPendingPublications() {
  try {
    const now = new Date();

    // Find all content items scheduled for publication that are past their time
    const dueItems = await prisma.contentItem.findMany({
      where: {
        status: "SCHEDULED",
        scheduledFor: { lte: now },
        deletedAt: null
      },
      include: {
        workspace: { select: { id: true, name: true } },
        versions: { take: 1, orderBy: { createdAt: "desc" }, select: { id: true, body: true, title: true } },
        createdBy: { select: { id: true, name: true, email: true } },
        domain: { select: { id: true, siteUrl: true, wpUsername: true, wpAppPasswordEnc: true, wpAppPasswordIv: true, wpAppPasswordTag: true } }
      }
    });

    console.log(`[Publication Scheduler] Found ${dueItems.length} items due for publication`);

    for (const item of dueItems) {
      await publishContentItem(item);
    }

    return {
      success: true,
      processed: dueItems.length
    };
  } catch (error) {
    console.error("[Publication Scheduler] Error:", error);
    return {
      success: false,
      error: String(error)
    };
  }
}

/**
 * Publish a single content item to configured platforms
 */
async function publishContentItem(item: DueItem) {
  const workspaceId = item.workspaceId;

  try {
    console.log(`[Publisher] Publishing ${item.topic} (ID: ${item.id})`);

    // Get workspace configuration for publishing
    const domain = item.domain;
    if (domain && domain.siteUrl && domain.wpUsername && domain.wpAppPasswordEnc && domain.wpAppPasswordIv && domain.wpAppPasswordTag) {
      await publishToWordPress(item);
    }

    // Use domain-level credentials (if available) for publication
    if (domain && domain.siteUrl && domain.wpUsername && domain.wpAppPasswordEnc && domain.wpAppPasswordIv && domain.wpAppPasswordTag) {
      await publishToWordPress(item);
    }

    // Update content item status
    await prisma.contentItem.update({
      where: { id: item.id },
      data: {
        status: "PUBLISHED",
        publishedAt: new Date(),
        scheduledFor: null
      }
    });

    // Trigger webhooks
    await triggerWebhooks(workspaceId, "PUBLISHED", {
      contentItemId: item.id,
      topic: item.topic,
      status: "PUBLISHED",
      actorId: item.createdById,
      actorName: item.createdBy?.name ?? undefined,
      actorEmail: item.createdBy?.email ?? undefined
    });

    // Log audit
    await logAudit({
      actorUserId: item.createdById,
      workspaceId,
      entityType: "ContentItem",
      entityId: item.id,
      action: "publish_attempt",
      before: { status: "SCHEDULED" },
      after: { status: "PUBLISHED", publishedAt: new Date() }
    });

    console.log(`[Publisher] Successfully published ${item.topic}`);

    return { success: true };
  } catch (error) {
    console.error(`[Publisher] Failed to publish ${item.topic}:`, error);

    // Log the failure
    await prisma.contentItem.update({
      where: { id: item.id },
      data: {
        publishError: String(error),
        publishAttempts: (((item as unknown) as { publishAttempts?: number }).publishAttempts || 0) + 1
      }
    });

    // Trigger webhook for error
    await triggerWebhooks(workspaceId, "STATUS_CHANGED", {
      contentItemId: item.id,
      topic: item.topic,
      status: "SCHEDULED",
      actorId: item.createdById
    });

    return { success: false, error: String(error) };
  }
}

/**
 * Publish content to WordPress
 */
async function publishToWordPress(item: DueItem) {
  // Note: WordPress implementation simplified - full creds handling would go here
  try {
    console.log(`[WordPress] Publishing ${item.topic}`);
    
    // TODO: Implement full WordPress integration with proper credential encryption
    // For now, just log the publication intent
    
    return { success: true, wordpressUrl: null };
  } catch (error) {
    throw new Error(`WordPress publication failed: ${String(error)}`);
  }
}

/**
 * Publish content to LinkedIn
 */
// LinkedIn publishing implementation removed for now (unused)

/**
 * Manually schedule content for publication
 */
export async function scheduleContentPublication(
  workspaceId: string,
  contentItemId: string,
  scheduledFor: Date,
  userId: string
) {
  try {
    const item = await prisma.contentItem.update({
      where: { id: contentItemId, workspaceId },
      data: { status: "SCHEDULED", scheduledFor, scheduledBy: { connect: { id: userId } } }
    });

    // Trigger webhook
    await triggerWebhooks(workspaceId, "SCHEDULED", {
      contentItemId,
      topic: item.topic,
      status: "SCHEDULED"
    });

    // Log audit
    await logAudit({
      actorUserId: userId,
      workspaceId,
      entityType: "ContentItem",
      entityId: contentItemId,
      action: "schedule",
      before: { status: item.status },
      after: { status: "SCHEDULED", scheduledFor }
    });

    return { success: true, item };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}

/**
 * Cancel scheduled publication
 */
export async function cancelScheduledPublication(
  workspaceId: string,
  contentItemId: string,
  userId: string
) {
  try {
    const item = await prisma.contentItem.update({
      where: { id: contentItemId, workspaceId },
      data: { status: "APPROVED", scheduledFor: null, publishAttempts: 0, publishError: null, scheduledBy: { disconnect: true } }
    });

    // Log audit
    await logAudit({
      actorUserId: userId,
      workspaceId,
      entityType: "ContentItem",
      entityId: contentItemId,
      action: "status_change",
      before: { status: "SCHEDULED" },
      after: { status: "APPROVED" }
    });

    return { success: true, item };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
