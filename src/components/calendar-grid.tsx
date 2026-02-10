"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Card } from "./ui/card";

interface CalendarEvent {
  id: string;
  title: string;
  date: Date;
  type: string;
  author: string;
  keyword: string;
}

interface CalendarGridProps {
  events: CalendarEvent[];
}

export function CalendarGrid({ events }: CalendarGridProps) {
  const [currentDate, setCurrentDate] = useState(new Date());

  const monthStart = useMemo(() => {
    const d = new Date(currentDate);
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [currentDate]);

  const monthEnd = useMemo(() => {
    const d = new Date(monthStart);
    d.setMonth(d.getMonth() + 1);
    d.setDate(0);
    return d;
  }, [monthStart]);

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map: Record<string, CalendarEvent[]> = {};
    events.forEach((event) => {
      const dateKey = new Date(event.date).toISOString().split("T")[0];
      if (!map[dateKey]) {
        map[dateKey] = [];
      }
      map[dateKey].push(event);
    });
    return map;
  }, [events]);

  // Get days in month
  const daysInMonth = useMemo(() => {
    const days = [];
    const firstDay = monthStart.getDay();

    // Fill empty cells for days before month starts
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // Fill days of month
    for (let i = 1; i <= monthEnd.getDate(); i++) {
      days.push(new Date(monthStart.getFullYear(), monthStart.getMonth(), i));
    }

    return days;
  }, [monthStart, monthEnd]);

  const weekDays = ["Nd", "Pn", "Wt", "Śr", "Czw", "Pt", "Sb"];
  const monthName = monthStart.toLocaleDateString("pl-PL", { month: "long", year: "numeric" });

  const handlePrevMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentDate(newDate);
  };

  const handleNextMonth = () => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentDate(newDate);
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  return (
    <Card className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-semibold text-gray-900 capitalize">{monthName}</h2>
        <div className="flex gap-2">
          <button
            onClick={handlePrevMonth}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            ← Poprzedni
          </button>
          <button
            onClick={handleToday}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Dziś
          </button>
          <button
            onClick={handleNextMonth}
            className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
          >
            Następny →
          </button>
        </div>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-px mb-2">
        {weekDays.map((day) => (
          <div key={day} className="text-center text-xs font-semibold text-gray-600 py-3 bg-gray-50">
            {day}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-lg overflow-hidden">
        {daysInMonth.map((day, idx) => {
          const dateKey = day ? day.toISOString().split("T")[0] : "";
          const dayEvents = dateKey ? eventsByDate[dateKey] || [] : [];
          const isToday =
            day &&
            day.toDateString() === new Date().toDateString();
          const isCurrentMonth = day && day.getMonth() === monthStart.getMonth();

          return (
            <div
              key={idx}
              className={`min-h-24 p-2 ${
                isCurrentMonth
                  ? "bg-white"
                  : "bg-gray-50"
              } ${isToday ? "ring-inset ring-2 ring-blue-500" : ""}`}
            >
              {day && (
                <>
                  <p
                    className={`text-sm font-semibold mb-1 ${
                      isToday
                        ? "text-blue-600 bg-blue-50 w-6 h-6 flex items-center justify-center rounded-full"
                        : isCurrentMonth
                          ? "text-gray-900"
                          : "text-gray-400"
                    }`}
                  >
                    {day.getDate()}
                  </p>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 2).map((event) => (
                      <Link
                        key={event.id}
                        href={`/content/${event.id}`}
                        className="block"
                      >
                        <div className="text-xs font-medium text-white bg-gradient-to-r from-blue-500 to-blue-600 px-1.5 py-0.5 rounded truncate hover:shadow-md transition">
                          {event.type === "BLOG" && "📝"}
                          {event.type === "VIDEO" && "🎥"}
                          {event.type === "SOCIAL" && "📱"}
                          <span className="ml-0.5">{event.title.slice(0, 10)}</span>
                        </div>
                      </Link>
                    ))}
                    {dayEvents.length > 2 && (
                      <p className="text-xs text-gray-500 px-1.5 py-0.5">
                        +{dayEvents.length - 2} więcej
                      </p>
                    )}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div className="mt-6 flex flex-wrap gap-6 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-2xl">📝</span>
          <span className="text-gray-600">Blog</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎥</span>
          <span className="text-gray-600">Video</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-2xl">📱</span>
          <span className="text-gray-600">Social</span>
        </div>
      </div>
    </Card>
  );
}
