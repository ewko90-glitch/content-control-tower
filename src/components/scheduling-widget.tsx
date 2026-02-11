"use client";

import { useState } from "react";
import { schedulePublication, cancelSchedule } from "@/app/actions/content";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface SchedulingWidgetProps {
  contentId: string;
  status: string;
  scheduledFor?: Date | null;
  onStatusChange?: () => void;
}

export function SchedulingWidget({
  contentId,
  status,
  scheduledFor,
  onStatusChange
}: SchedulingWidgetProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduledDate, setScheduledDate] = useState(
    scheduledFor ? new Date(scheduledFor).toISOString().slice(0, 16) : ""
  );

  async function handleSchedule() {
    if (!scheduledDate) {
      setError("Wybierz datę i godzinę publikacji");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const result = await schedulePublication(contentId, new Date(scheduledDate));

      if (result.success) {
        setIsEditing(false);
        onStatusChange?.();
      } else {
        setError(result.message || "Błąd planowania");
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  async function handleCancel() {
    if (!window.confirm("Anulować plan publikacji?")) return;

    try {
      setLoading(true);
      setError(null);

      const result = await cancelSchedule(contentId);

      if (result.success) {
        setIsEditing(false);
        onStatusChange?.();
      } else {
        setError(result.message || "Błąd anulowania");
      }
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
    }
  }

  // Only show for APPROVED or SCHEDULED content
  if (!["APPROVED", "SCHEDULED"].includes(status)) {
    return null;
  }

  const isScheduled = status === "SCHEDULED" && scheduledFor;
  const scheduledDateTime = scheduledFor
    ? new Date(scheduledFor).toLocaleString("pl-PL")
    : null;

  return (
    <Card className="p-4">
      <h3 className="font-semibold text-sm mb-3">📅 Publikacja</h3>

      {error && (
        <div className="p-2 mb-3 bg-red-50 text-red-600 text-xs rounded">
          {error}
        </div>
      )}

      {isScheduled && !isEditing ? (
        <div className="space-y-3">
          <div className="p-2 bg-green-50 rounded">
            <p className="text-xs text-green-600">Zaplanowana na:</p>
            <p className="text-sm font-semibold text-green-700">{scheduledDateTime}</p>
          </div>
          <div className="flex gap-2">
            <Button

              variant="secondary"
              onClick={() => setIsEditing(true)}
              disabled={loading}
            >
              Zmień datę
            </Button>
            <Button
              variant="secondary"
              onClick={handleCancel}
              disabled={loading}
              className="text-red-600 hover:bg-red-50"
            >
              Anuluj
            </Button>
          </div>
        </div>
      ) : isEditing ? (
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium mb-1">
              Data i godzina publikacji
            </label>
            <input
              type="datetime-local"
              value={scheduledDate}
              onChange={e => setScheduledDate(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
            />
          </div>
          <div className="flex gap-2">
            <Button
              onClick={handleSchedule}
              disabled={loading || !scheduledDate}
            >
              {loading ? "..." : "Zaplanuj"}
            </Button>
            <Button
              variant="secondary"
              onClick={() => setIsEditing(false)}
              disabled={loading}
            >
              Anuluj
            </Button>
          </div>
        </div>
      ) : (
        <Button
          onClick={() => setIsEditing(true)}
          disabled={loading}
          className="w-full"
        >
          Zaplanuj publikację
        </Button>
      )}
    </Card>
  );
}
