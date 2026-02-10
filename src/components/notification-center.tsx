"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";

interface NotificationCenterProps {
  notifications: Array<{
    id: string;
    type: string;
    message: string;
    data?: unknown;
  }>;
  onDismiss: (id: string) => void;
}

export function NotificationCenter({
  notifications,
  onDismiss
}: NotificationCenterProps) {
  if (notifications.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 space-y-2 z-50 max-w-md">
      {notifications.map((notification) => (
        <Card
          key={notification.id}
          className={`p-4 shadow-lg animate-in slide-in-from-right-4 fade-in ${
            notification.type === "error"
              ? "bg-red-50 border-red-200"
              : notification.type === "success"
                ? "bg-green-50 border-green-200"
                : notification.type === "warning"
                  ? "bg-amber-50 border-amber-200"
                  : "bg-blue-50 border-blue-200"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1">
              <p
                className={`text-sm font-medium ${
                  notification.type === "error"
                    ? "text-red-900"
                    : notification.type === "success"
                      ? "text-green-900"
                      : notification.type === "warning"
                        ? "text-amber-900"
                        : "text-blue-900"
                }`}
              >
                {notification.message}
              </p>
            </div>
            <button
              onClick={() => onDismiss(notification.id)}
              className="text-gray-500 hover:text-gray-700 flex-shrink-0"
            >
              ✕
            </button>
          </div>
        </Card>
      ))}
    </div>
  );
}
