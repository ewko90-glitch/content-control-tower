import { prisma } from "@/lib/db";

// Note: webhook & webhookLog models exist in schema. Editor may show false type errors
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const webhook = (prisma as any).webhook;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const webhookLog = (prisma as any).webhookLog;

export interface WebhookPayload {
  event: string;
  timestamp: string;
  workspace: { id: string; name: string };
  contentItem?: {
    id: string;
    topic: string;
    status: string;
  };
  actor?: { id: string; name: string; email: string };
}

export async function triggerWebhooks(
  workspaceId: string,
  eventType: string,
  data: {
    contentItemId?: string;
    topic?: string;
    status?: string;
    actorId?: string;
    actorName?: string;
    actorEmail?: string;
  }
) {
  try {
    // Fetch workspace
    const workspace = await prisma.workspace.findUnique({
      where: { id: workspaceId }
    });

    if (!workspace) return;

    // Fetch actor details if provided
    let actor = null;
    if (data.actorId) {
      actor = await prisma.user.findUnique({
        where: { id: data.actorId },
        select: { id: true, name: true, email: true }
      });
    }

    // Fetch webhooks for this event
    const webhooks = await (prisma as any).webhook.findMany({
      where: {
        workspaceId,
        isActive: true,
        events: { has: eventType }
      }
    });

    // Prepare payload
    const payload: WebhookPayload = {
      event: eventType,
      timestamp: new Date().toISOString(),
      workspace: { id: workspace.id, name: workspace.name },
      actor: actor
        ? {
            id: actor.id,
            name: actor.name || "",
            email: actor.email
          }
        : undefined
    };

    if (data.contentItemId || data.topic || data.status) {
      payload.contentItem = {
        id: data.contentItemId || "",
        topic: data.topic || "",
        status: data.status || ""
      };
    }

    // Send to each webhook
    for (const webhook of webhooks) {
      sendWebhook(webhook.id, workspaceId, webhook.type, webhook.url, webhook.email, payload);
    }
  } catch (error) {
    console.error("Webhook trigger error:", error);
  }
}

async function sendWebhook(
  webhookId: string,
  workspaceId: string,
  type: string,
  url: string | null,
  email: string | null,
  payload: WebhookPayload
) {
  try {
    if (type === "slack" && url) {
      await sendSlackWebhook(webhookId, workspaceId, url, payload);
    } else if (type === "email" && email) {
      await sendEmailWebhook(webhookId, workspaceId, email, payload);
    }
  } catch (error) {
    console.error(`Failed to send ${type} webhook:`, error);
    // Log error
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (prisma as any).webhookLog.create({
      data: {
        workspaceId,
        webhookId,
        eventType: payload.event,
        payload: payload as any,
        statusCode: 0,
        response: String(error)
      }
    });
  }
}

async function sendSlackWebhook(
  webhookId: string,
  workspaceId: string,
  url: string,
  payload: WebhookPayload
) {
  const messageBlocks = buildSlackMessage(payload);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ blocks: messageBlocks })
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any).webhookLog.create({
    data: {
      workspaceId,
      webhookId,
      eventType: payload.event,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      payload: payload as any,
      statusCode: response.status,
      response: await response.text()
    }
  });
}

async function sendEmailWebhook(
  webhookId: string,
  workspaceId: string,
  email: string,
  payload: WebhookPayload
) {
  const subject = buildEmailSubject(payload);
  const body = buildEmailBody(payload);

  // TODO: Integrate with email service (SendGrid, AWS SES, etc.)
  // For now, placeholder
  console.log(`[Email] To: ${email}`);
  console.log(`[Email] Subject: ${subject}`);
  console.log(`[Email] Body: ${body}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (prisma as any).webhookLog.create({
    data: {
      workspaceId,
      webhookId,
      eventType: payload.event,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      payload: payload as any,
      statusCode: 202,
      response: "Email queued for sending"
    }
  });
}

function buildSlackMessage(payload: WebhookPayload) {
  const emoji = getEventEmoji(payload.event);
  const title = getEventTitle(payload.event);

  return [
    {
      type: "header",
      text: {
        type: "plain_text",
        text: `${emoji} ${title}`
      }
    },
    {
      type: "section",
      fields: [
        {
          type: "mrkdwn",
          text: `*Event:*\n${payload.event}`
        },
        {
          type: "mrkdwn",
          text: `*Time:*\n${new Date(payload.timestamp).toLocaleString("pl-PL")}`
        }
      ]
    },
    ...(payload.contentItem
      ? [
          {
            type: "section",
            text: {
              type: "mrkdwn",
              text: `*Content:* ${payload.contentItem.topic}\n*Status:* ${payload.contentItem.status}`
            }
          }
        ]
      : []),
    ...(payload.actor
      ? [
          {
            type: "context",
            elements: [
              {
                type: "mrkdwn",
                text: `By ${payload.actor.name} (${payload.actor.email})`
              }
            ]
          }
        ]
      : [])
  ];
}

function buildEmailSubject(payload: WebhookPayload): string {
  const title = getEventTitle(payload.event);
  return `[${payload.workspace.name}] ${title}`;
}

function buildEmailBody(payload: WebhookPayload): string {
  const lines = [
    `Event: ${payload.event}`,
    `Time: ${new Date(payload.timestamp).toLocaleString("pl-PL")}`,
    ""
  ];

  if (payload.contentItem) {
    lines.push(`Content: ${payload.contentItem.topic}`);
    lines.push(`Status: ${payload.contentItem.status}`);
    lines.push("");
  }

  if (payload.actor) {
    lines.push(`Author: ${payload.actor.name} (${payload.actor.email})`);
  }

  return lines.join("\n");
}

function getEventEmoji(event: string): string {
  const emojis: Record<string, string> = {
    STATUS_CHANGED: "📊",
    APPROVAL_REQUESTED: "👀",
    APPROVED: "✅",
    REJECTED: "❌",
    SCHEDULED: "📅",
    PUBLISHED: "🚀"
  };
  return emojis[event] || "📌";
}

function getEventTitle(event: string): string {
  const titles: Record<string, string> = {
    STATUS_CHANGED: "Content Status Changed",
    APPROVAL_REQUESTED: "Approval Requested",
    APPROVED: "Content Approved",
    REJECTED: "Content Rejected",
    SCHEDULED: "Content Scheduled",
    PUBLISHED: "Content Published"
  };
  return titles[event] || event;
}
