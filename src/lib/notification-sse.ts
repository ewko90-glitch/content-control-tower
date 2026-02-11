// Map to store active SSE connections
const activeConnections = new Map<string, ReadableStreamDefaultController>();

export function storeSSEConnection(
  connectionId: string,
  controller: ReadableStreamDefaultController
) {
  activeConnections.set(connectionId, controller);
}

export function removeSSEConnection(connectionId: string) {
  activeConnections.delete(connectionId);
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
      } catch {
        activeConnections.delete(key);
      }
    }
  }
}
