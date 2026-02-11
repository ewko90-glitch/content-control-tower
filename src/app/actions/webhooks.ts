/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { requireWorkspace } from "@/lib/guards";
import { z } from "zod";
import { prisma } from "@/lib/db";

const createWebhookSchema = z.object({
  name: z.string().min(1, "Webhook name is required"),
  type: z.enum(["slack", "email"]),
  url: z.string().url().optional(),
  email: z.string().email().optional(),
  events: z.array(z.string()).min(1, "Select at least one event")
});

const updateWebhookSchema = createWebhookSchema.partial().merge(
  z.object({ id: z.string() })
);

export async function createWebhook(formData: FormData) {
  try {
    const workspace = await requireWorkspace();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed = createWebhookSchema.parse({
      name: formData.get("name"),
      type: formData.get("type"),
      url: formData.get("url"),
      email: formData.get("email"),
      events: formData.getAll("events")
    }) as any;

    if (parsed.type === "slack" && !parsed.url) {
      return { error: "Slack URL required for Slack webhooks" };
    }
    if (parsed.type === "email" && !parsed.email) {
      return { error: "Email required for email webhooks" };
    }

    const webhookResult = await (prisma as any).webhook.create({
      data: {
        workspaceId: workspace.workspaceId,
        name: parsed.name,
        type: parsed.type,
        url: parsed.url || null,
        email: parsed.email || null,
        events: parsed.events,
        isActive: true
      }
    });

    return { success: true, webhook: webhookResult };
  } catch (error) {
    const message = error instanceof z.ZodError
      ? error.errors[0].message
      : String(error);
    return { error: message };
  }
}

export async function updateWebhook(id: string, formData: FormData) {
  try {
    const workspace = await requireWorkspace();

    // Verify webhook belongs to workspace
    const existing = await (prisma as any).webhook.findFirst({
      where: { id, workspaceId: workspace.workspaceId }
    });

    if (!existing) {
      return { error: "Webhook not found" };
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const parsed = updateWebhookSchema.parse({
      id,
      name: formData.get("name"),
      type: formData.get("type"),
      url: formData.get("url"),
      email: formData.get("email"),
      events: formData.getAll("events")
    }) as any;

    const webhookUpdated = await (prisma as any).webhook.update({
      where: { id },
      data: {
        ...(parsed.name && { name: parsed.name }),
        ...(parsed.type && { type: parsed.type }),
        ...(formData.has("url") && { url: parsed.url || null }),
        ...(formData.has("email") && { email: parsed.email || null }),
        ...(parsed.events?.length && { events: parsed.events })
      }
    });

    return { success: true, webhook: webhookUpdated };
  } catch (error) {
    const message = error instanceof z.ZodError
      ? error.errors[0].message
      : String(error);
    return { error: message };
  }
}

export async function deleteWebhook(id: string) {
  try {
    const workspace = await requireWorkspace();

    const webhookRow = await (prisma as any).webhook.deleteMany({
      where: { id, workspaceId: workspace.workspaceId }
    });

    if (webhookRow.count === 0) {
      return { error: "Webhook not found" };
    }

    return { success: true };
  } catch (error) {
    return { error: String(error) };
  }
}

export async function toggleWebhook(id: string, isActive: boolean) {
  try {
    const workspace = await requireWorkspace();

    const webhookRow = await (prisma as any).webhook.updateMany({
      where: { id, workspaceId: workspace.workspaceId },
      data: { isActive }
    });

    if (webhookRow.count === 0) {
      return { error: "Webhook not found" };
    }

    return { success: true };
  } catch (error) {
    return { error: String(error) };
  }
}

export async function listWebhooks() {
  try {
    const workspace = await requireWorkspace();

    const webhooks = await (prisma as any).webhook.findMany({
      where: { workspaceId: workspace.workspaceId },
      select: {
        id: true,
        name: true,
        type: true,
        email: true,
        isActive: true,
        events: true,
        createdAt: true
      },
      orderBy: { createdAt: "desc" }
    });

    return { success: true, webhooks };
  } catch (error) {
    return { error: String(error) };
  }
}

export async function getWebhookLogs(webhookId: string, limit = 20) {
  try {
    const workspace = await requireWorkspace();

    const logs = await (prisma as any).webhookLog.findMany({
      where: { webhookId, workspaceId: workspace.workspaceId },
      select: {
        id: true,
        eventType: true,
        statusCode: true,
        createdAt: true,
        response: true
      },
      orderBy: { createdAt: "desc" },
      take: limit
    });

    return { success: true, logs };
  } catch (error) {
    return { error: String(error) };
  }
}
