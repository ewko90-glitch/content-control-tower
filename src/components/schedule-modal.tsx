"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { setSchedule } from "@/app/actions/calendar";

interface ScheduleModalProps {
  contentId: string;
  contentTopic: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function ScheduleModal({
  contentId,
  contentTopic,
  isOpen,
  onClose,
  onSuccess
}: ScheduleModalProps) {
  const [scheduledDate, setScheduledDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  const [scheduledTime, setScheduledTime] = useState<string>("10:00");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSchedule = async () => {
    if (!scheduledDate || !scheduledTime) {
      setError("Proszę wybrać datę i czas.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const dateTime = new Date(`${scheduledDate}T${scheduledTime}:00`);
      const result = await setSchedule(contentId, dateTime);

      if (result.success) {
        onSuccess?.();
        onClose();
      } else {
        setError(result.message || "Nie udało się zaplanować treści.");
      }
    } catch (err) {
      setError("Błąd przy planowaniu treści.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="w-96 p-6 shadow-xl bg-white rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Zaplanuj publikację
        </h3>

        <div className="space-y-4 mb-6">
          <div>
            <p className="text-sm font-medium text-gray-700 mb-1">Treść</p>
            <p className="text-sm text-gray-600">{contentTopic}</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data publikacji
            </label>
            <input
              type="date"
              value={scheduledDate}
              onChange={(e) => setScheduledDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Czas publikacji
            </label>
            <input
              type="time"
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {error && (
            <div className="px-3 py-2 bg-red-100 border border-red-300 text-red-800 text-sm rounded">
              {error}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-2">
          <Button
            onClick={handleSchedule}
            disabled={loading}
            className="w-full bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-400"
          >
            {loading ? "Planowanie..." : "Zaplanuj"}
          </Button>
          <Button
            onClick={onClose}
            className="w-full bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            Anuluj
          </Button>
        </div>
      </div>
    </div>
  );
}
