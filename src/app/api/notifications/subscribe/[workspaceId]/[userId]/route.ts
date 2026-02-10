import { NextRequest, NextResponse } from "next/server";
import { requireWorkspace } from "@/lib/guards";
import { prisma } from "@/lib/db";

interface RouteParams {
  workspaceId: string;
  userId: string;
}

// Map to store active SSE connections
const activeConnections = new Map<string, ReadableStreamDefaultController>();

export async function GET(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const { user, workspaceId } = await requireWorkspace();

    if (user.id !== params.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Create SSE response
    const stream = new ReadableStream({
      start(controller) {
        const connectionId = `${workspaceId}-${user.id}-${Date.now()}`;
        activeConnections.set(connectionId, controller);

        // Send initial connection message
        controller.enqueue(
          `data: ${JSON.stringify({ type: "connected", message: "Connected to notifications" })}\n\n`
        );

        // Clean up on close
        request.signal.addEventListener("abort", () => {
          activeConnections.delete(connectionId);
          controller.close();
        });
      }
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
        "X-Accel-Buffering": "no"
      }
    });
  } catch (error) {
    console.error("Notification SSE error:", error);
    return NextResponse.json(
      { error: "Failed to establish connection" },
      { status: 500 }
    );
  }
}

// Helper function to broadcast notifications
export function broadcastNotification(
  workspaceId: string,
  userId: string,
  notification: {
    id: string;
    type: string;
    message: string;
    data?: unknown;
  }
) {
  const connectionId = `${workspaceId}-${userId}`;
  
  for (const [key, controller] of activeConnections) {
    if (key.startsWith(connectionId)) {
      try {
        controller.enqueue(
          `data: ${JSON.stringify(notification)}\n\n`
        );
      } catch (error) {
        activeConnections.delete(key);
      }
    }
  }
}
