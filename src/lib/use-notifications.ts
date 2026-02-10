"use client";

import { useEffect, useState } from "react";

interface Notification {
  id: string;
  type: string;
  message: string;
  data?: unknown;
}

interface UseNotificationsProps {
  workspaceId: string;
  userId: string;
}

export function useNotifications({ workspaceId, userId }: UseNotificationsProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let eventSource: EventSource | null = null;
    let reconnectTimer: NodeJS.Timeout;

    const connect = () => {
      try {
        eventSource = new EventSource(
          `/api/notifications/subscribe/${workspaceId}/${userId}`
        );

        eventSource.onopen = () => {
          setIsConnected(true);
          console.log("✓ Connected to notifications");
        };

        eventSource.onmessage = (event) => {
          try {
            const notification = JSON.parse(event.data);
            
            // Skip connection messages
            if (notification.type === "connected") {
              return;
            }

            setNotifications((prev) => [notification, ...prev]);

            // Auto-dismiss after 5 seconds for non-persistent notifications
            if (notification.type !== "persistent") {
              setTimeout(() => {
                setNotifications((prev) =>
                  prev.filter((n) => n.id !== notification.id)
                );
              }, 5000);
            }
          } catch (error) {
            console.error("Failed to parse notification:", error);
          }
        };

        eventSource.onerror = () => {
          console.log("Notification connection error, reconnecting in 3s...");
          setIsConnected(false);
          eventSource?.close();

          // Reconnect after 3 seconds
          reconnectTimer = setTimeout(connect, 3000);
        };
      } catch (error) {
        console.error("Failed to create EventSource:", error);
        setIsConnected(false);
      }
    };

    connect();

    return () => {
      if (eventSource) {
        eventSource.close();
      }
      if (reconnectTimer) {
        clearTimeout(reconnectTimer);
      }
    };
  }, [workspaceId, userId]);

  return { notifications, isConnected };
}
