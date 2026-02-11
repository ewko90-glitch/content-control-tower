"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import type { ContentItem } from "@prisma/client";

interface CalendarExportButtonProps {
  scheduledItems: ContentItem[];
  weekStart: Date;
  weekEnd?: Date;
}

export function CalendarExportButton({
  scheduledItems,
  weekStart,
  
}: CalendarExportButtonProps) {
  const [showMenu, setShowMenu] = useState(false);
  const [exporting, setExporting] = useState(false);

  const exportAsICS = () => {
    setExporting(true);
    try {
      const icsContent = [
        "BEGIN:VCALENDAR",
        "VERSION:2.0",
        "PRODID:-//Content Control Tower//Calendar//EN",
        "CALSCALE:GREGORIAN",
        "METHOD:PUBLISH"
      ];

      scheduledItems.forEach((item) => {
        if (!item.scheduledFor) return;
        
        const start = new Date(item.scheduledFor);
        const end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour duration

        const formatICSDate = (date: Date) => {
          return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
        };

        icsContent.push(
          "BEGIN:VEVENT",
          `DTSTART:${formatICSDate(start)}`,
          `DTEND:${formatICSDate(end)}`,
          `SUMMARY:📝 ${item.topic}`,
          `DESCRIPTION:Type: ${item.type}\\nKeyword: ${item.mainKeyword}`,
          `UID:${item.id}@content-control-tower`,
          `STATUS:CONFIRMED`,
          "END:VEVENT"
        );
      });

      icsContent.push("END:VCALENDAR");

      const blob = new Blob([icsContent.join("\r\n")], {
        type: "text/calendar;charset=utf-8"
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `calendar-${weekStart.toISOString().split("T")[0]}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert("Błąd podczas eksportu kalendarza");
    } finally {
      setExporting(false);
      setShowMenu(false);
    }
  };

  const exportAsCSV = () => {
    setExporting(true);
    try {
      const csvRows = [
        ["Data", "Godzina", "Temat", "Typ", "Słowo kluczowe", "Status"].join(",")
      ];

      scheduledItems.forEach((item) => {
        if (!item.scheduledFor) return;
        
        const date = new Date(item.scheduledFor);
        csvRows.push([
          date.toLocaleDateString("pl-PL"),
          date.toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" }),
          `"${item.topic.replace(/"/g, '""')}"`,
          item.type,
          `"${item.mainKeyword.replace(/"/g, '""')}"`,
          item.status
        ].join(","));
      });

      const blob = new Blob([csvRows.join("\n")], {
        type: "text/csv;charset=utf-8"
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `calendar-${weekStart.toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Export error:", error);
      alert("Błąd podczas eksportu kalendarza");
    } finally {
      setExporting(false);
      setShowMenu(false);
    }
  };

  const printCalendar = () => {
    window.print();
    setShowMenu(false);
  };

  return (
    <div className="relative">
      <Button
        onClick={() => setShowMenu(!showMenu)}
        className="bg-gray-100 text-gray-700 hover:bg-gray-200 text-sm"
      >
        📤 Eksportuj
      </Button>

      {showMenu && (
        <>
          <div
            className="fixed inset-0 z-10"
            onClick={() => setShowMenu(false)}
          />
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-xl border border-gray-200 z-20">
            <div className="py-1">
              <button
                onClick={exportAsICS}
                disabled={exporting}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                📅 iCal (.ics)
                <span className="text-xs text-gray-500 ml-auto">Google Calendar</span>
              </button>
              <button
                onClick={exportAsCSV}
                disabled={exporting}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                📊 CSV (.csv)
                <span className="text-xs text-gray-500 ml-auto">Excel</span>
              </button>
              <button
                onClick={printCalendar}
                className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
              >
                🖨️ Drukuj / PDF
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
