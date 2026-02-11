"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
/* eslint-disable @typescript-eslint/no-unused-vars */

interface BulkSchedulingBarProps {
  selectedCount: number;
  onSchedule: (scheduledFor: string) => Promise<void>;
  onClear: () => void;
}

export function BulkSchedulingBar({
  selectedCount,
  onSchedule,
  onClear
}: BulkSchedulingBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [scheduledFor, setScheduledFor] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!scheduledFor) {
      alert("Wybierz datę i czas");
      return;
    }

    startTransition(async () => {
      await onSchedule(scheduledFor);
      setScheduledFor("");
      setIsOpen(false);
    });
  };

  if (selectedCount === 0) {
    return null;
  }

  return (
    <>
      {/* Sticky bar */}
      <div className="sticky bottom-0 left-0 right-0 bg-blue-50 border-t border-blue-200 p-4 shadow-lg z-40">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm font-medium text-gray-900">
            Zaznaczono <span className="font-bold text-blue-600">{selectedCount}</span> treści
          </div>
          <div className="flex items-center gap-2">
            <Button
              onClick={() => setIsOpen(!isOpen)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              📅 Zaplanuj zaznaczone
            </Button>
            <Button
              onClick={onClear}
              variant="ghost"
              className="text-gray-600 hover:text-gray-900"
            >
              Wyczyść zaznaczenie
            </Button>
          </div>
        </div>

        {/* Scheduling form */}
        {isOpen && (
          <Card className="mt-4 p-4 bg-white">
            <form onSubmit={handleSubmit} className="flex gap-3 items-end">
              <div className="flex-1">
                <label htmlFor="scheduledFor" className="block text-sm font-medium text-gray-700 mb-1">
                  Data i godzina publikacji
                </label>
                <input
                  id="scheduledFor"
                  type="datetime-local"
                  value={scheduledFor}
                  onChange={(e) => setScheduledFor(e.target.value)}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <Button
                type="submit"
                disabled={isPending || !scheduledFor}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                {isPending ? "Planowanie..." : "Zaplanuj"}
              </Button>
              <Button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                  setScheduledFor("");
                }}
                variant="ghost"
                className="text-gray-600"
              >
                Anuluj
              </Button>
            </form>
          </Card>
        )}
      </div>
    </>
  );
}
