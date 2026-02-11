import { prisma } from "@/lib/db";
import { publishWordPressPost } from "@/lib/wp";
import { triggerWebhooks } from "@/lib/webhooks";
import { logAudit } from "@/lib/audit";

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const dueItems = await (prisma as any).contentItem.findMany({
      where: {
        status: "SCHEDULED",
        scheduledFor: { lte: now },
        deletedAt: null
      },
      include: {
        workspace: { select: { id: true, name: true } },
        versions: { take: 1, orderBy: { createdAt: "desc" }, select: { id: true, body: true, title: true } },
        createdBy: { select: { id: true, name: true, email: true } }
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function publishContentItem(item: any) {
  const workspaceId = item.workspaceId;

  try {
    console.log(`[Publisher] Publishing ${item.topic} (ID: ${item.id})`);

    // Get workspace configuration for publishing
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      select: {
        id: true,
        name: true
      }
    }) as any;

    if (!workspace) {
      throw new Error("Workspace not found");
    }

    // Publish to WordPress if configured
    if (workspace.wordpressUrl && workspace.wordpressUsername && workspace.wordpressPassword) {
      await publishToWordPress(item, workspace);
    }

    // Publish to LinkedIn if configured
    if (workspace.linkedinAccessToken) {
      await publishToLinkedIn(item);
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
      actorName: item.createdBy?.name,
      actorEmail: item.createdBy?.email
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).contentItem.update({
      where: { id: item.id },
      data: {
        publishError: String(error),
        publishAttempts: (item.publishAttempts || 0) + 1
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function publishToWordPress(item: any, workspace: any) {
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
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function publishToLinkedIn(item: any) {
  try {
    // LinkedIn post content
    const postContent = `
🚀 New Article: ${item.topic}

${item.versions?.[0]?.body?.substring(0, 250)}...

#content #marketing #contentmarketing
    `.trim();

    // TODO: Implement LinkedIn API integration
    // This would use workspace.linkedinAccessToken to post to LinkedIn
    console.log(`[LinkedIn] Would post: ${postContent.substring(0, 50)}...`);

    return { success: true };
  } catch (error) {
    console.error("[LinkedIn] Publishing failed:", error);
    throw error;
  }
}

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
      where: {
        id: contentItemId,
        workspaceId
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: {
        status: "SCHEDULED",
        scheduledFor,
        scheduledById: userId
      } as any
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
      where: {
        id: contentItemId,
        workspaceId
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: {
        status: "APPROVED",
        scheduledFor: null,
        publishAttempts: 0,
        publishError: null
      } as any
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
