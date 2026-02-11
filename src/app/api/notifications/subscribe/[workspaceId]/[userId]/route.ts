import { NextRequest, NextResponse } from "next/server";
import { requireWorkspace } from "@/lib/guards";
import { storeSSEConnection, removeSSEConnection } from "@/lib/notification-sse";

interface RouteParams {
  workspaceId: string;
  userId: string;
}

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
        storeSSEConnection(connectionId, controller);

        // Send initial connection message
        controller.enqueue(
          `data: ${JSON.stringify({ type: "connected", message: "Connected to notifications" })}\n\n`
        );

        // Clean up on close
        request.signal.addEventListener("abort", () => {
          removeSSEConnection(connectionId);
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
