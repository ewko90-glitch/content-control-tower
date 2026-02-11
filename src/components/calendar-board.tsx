"use client";

import React, { useState, useCallback, useEffect } from "react";
import type { ContentItem } from "@prisma/client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { reschedule, unschedule, setSchedule } from "@/app/actions/calendar";

interface UserPreview {
  id?: string;
  name: string | null;
  email: string;
}

interface CalendarBoardProps {
  scheduledItems: (ContentItem & {
    createdBy?: UserPreview | null;
    scheduledBy?: UserPreview | null;
  })[];
  approvedItems: (ContentItem & {
    createdBy?: UserPreview | null;
  })[];
  userRole: "OWNER" | "APPROVER" | "EDITOR";
  onScheduleChange?: () => void;
}

interface ContentItemWithUser extends ContentItem {
  createdBy?: UserPreview | null;
  scheduledBy?: UserPreview | null;
}

// Helper: Get events grouped by date and detect conflicts
function getEventsGroupedByDate(items: ContentItemWithUser[]) {
  const grouped: Record<string, ContentItemWithUser[]> = {};

  items.forEach((item) => {
    if (!item.scheduledFor) return;
    const dateKey = item.scheduledFor.toISOString().split("T")[0];
    if (!grouped[dateKey]) grouped[dateKey] = [];
    grouped[dateKey].push(item);
  });

  return grouped;
}

// Helper: Detect overload (>3 items) or cannibalization (2+ same type)
function getConflictBadge(items: ContentItemWithUser[]): string | null {
  if (items.length > 3) return "Dużo publikacji";
  const typeCount: Record<string, number> = {};
  items.forEach((item) => {
    typeCount[item.type] = (typeCount[item.type] || 0) + 1;
  });
  if (Object.values(typeCount).some((count) => count >= 2)) {
    return "Ryzyko kanibalizacji";
  }
  return null;
}

type ViewType = "week" | "month";

export function CalendarBoard({
  scheduledItems,
  approvedItems,
  userRole,
  onScheduleChange
}: CalendarBoardProps) {
  const [view, setView] = useState<ViewType>("week");
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [draggedItem, setDraggedItem] = useState<ContentItemWithUser | null>(null);
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Time picker state
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [timePickerDate, setTimePickerDate] = useState<Date | null>(null);
  const [pendingScheduleItem, setPendingScheduleItem] = useState<ContentItemWithUser | null>(null);
  
  // Bulk scheduling state
  const [selectedBacklogIds, setSelectedBacklogIds] = useState<Set<string>>(new Set());
  const [bulkScheduling, setBulkScheduling] = useState(false);
  
  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterAuthor, setFilterAuthor] = useState<string>("all");
  const [filterType, setFilterType] = useState<string>("all");

  const canSchedule = userRole !== "EDITOR";

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      
      switch(e.key.toLowerCase()) {
        case 't':
          setSelectedDate(new Date());
          break;
        case 'arrowleft':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setSelectedDate(d => {
              const prev = new Date(d);
              prev.setDate(prev.getDate() - (view === "week" ? 7 : 30));
              return prev;
            });
          }
          break;
        case 'arrowright':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setSelectedDate(d => {
              const next = new Date(d);
              next.setDate(next.getDate() + (view === "week" ? 7 : 30));
              return next;
            });
          }
          break;
        case 'w':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setView("week");
          }
          break;
        case 'm':
          if (e.ctrlKey || e.metaKey) {
            e.preventDefault();
            setView("month");
          }
          break;
      }
    };
    
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [view]);

  // Filter backlog items
  const filteredBacklog = approvedItems.filter(item => {
    const matchesSearch = !searchQuery || 
      item.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.mainKeyword.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesAuthor = filterAuthor === "all" || 
      item.createdBy?.id === filterAuthor;
    
    const matchesType = filterType === "all" || 
      item.type === filterType;
    
    return matchesSearch && matchesAuthor && matchesType;
  });

  // Get unique authors for filter
  const authors = Array.from(new Set(
    approvedItems
      .map(item => item.createdBy)
      .filter(Boolean)
      .map(author => JSON.stringify({ id: author!.id, name: author!.name || author!.email }))
  )).map(str => JSON.parse(str));

  // Bulk scheduling logic
  const handleBulkSchedule = useCallback(async () => {
    if (selectedBacklogIds.size === 0 || !canSchedule) return;
    
    setBulkScheduling(true);
    const itemsToSchedule = approvedItems.filter(item => selectedBacklogIds.has(item.id));
    
    // Distribute items evenly across the week
    const startDate = new Date();
    startDate.setHours(10, 0, 0, 0);
    
    const promises = itemsToSchedule.map((item, index) => {
      const scheduleDate = new Date(startDate);
      scheduleDate.setDate(scheduleDate.getDate() + Math.floor(index * 7 / itemsToSchedule.length));
      return setSchedule(item.id, scheduleDate);
    });
    
    try {
      await Promise.all(promises);
      setSelectedBacklogIds(new Set());
      onScheduleChange?.();
    } catch (error) {
      console.error("Bulk scheduling error:", error);
    } finally {
      setBulkScheduling(false);
    }
  }, [selectedBacklogIds, approvedItems, canSchedule, onScheduleChange]);

  const toggleBacklogSelection = useCallback((id: string) => {
    setSelectedBacklogIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAllBacklog = useCallback(() => {
    if (selectedBacklogIds.size === filteredBacklog.length) {
      setSelectedBacklogIds(new Set());
    } else {
      setSelectedBacklogIds(new Set(filteredBacklog.map(item => item.id)));
    }
  }, [selectedBacklogIds.size, filteredBacklog]);

  // Get week boundaries
  const getWeekBoundaries = (date: Date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d.setDate(diff));
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    return { monday, sunday };
  };

  const { monday: weekStart } = getWeekBoundaries(selectedDate);

  // Calendar day cells for week view
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });

  // Group scheduled items by date
  const eventsByDate = getEventsGroupedByDate(scheduledItems);

  const handleDragStart = (item: ContentItemWithUser) => {
    if (!canSchedule) return;
    setDraggedItem(item);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDropOnDate = useCallback(
    async (date: Date) => {
      if (!draggedItem || !canSchedule) return;

      // Show time picker instead of directly scheduling
      setTimePickerDate(date);
      setPendingScheduleItem(draggedItem);
      setShowTimePicker(true);
      setDraggedItem(null);
    },
    [draggedItem, canSchedule]
  );

  const handleTimePickerConfirm = useCallback(
    async (hour: number) => {
      if (!pendingScheduleItem || !timePickerDate) return;

      const scheduleDateTime = new Date(timePickerDate);
      scheduleDateTime.setHours(hour, 0, 0, 0);

      setActionLoading(true);
      try {
        let result;
        if (pendingScheduleItem.status === "APPROVED") {
          result = await setSchedule(pendingScheduleItem.id, scheduleDateTime);
        } else if (pendingScheduleItem.status === "SCHEDULED") {
          result = await reschedule(pendingScheduleItem.id, scheduleDateTime);
        }
        
        if (result?.success) {
          onScheduleChange?.();
        }
      } catch (error) {
        console.error("Failed to schedule:", error);
      } finally {
        setActionLoading(false);
        setShowTimePicker(false);
        setPendingScheduleItem(null);
        setTimePickerDate(null);
      }
    },
    [pendingScheduleItem, timePickerDate, onScheduleChange]
  );

  const handleUnschedule = useCallback(
    async (contentId: string) => {
      if (!canSchedule) return;

      setActionLoading(true);
      try {
        const result = await unschedule(contentId);
        if (result.success) {
          setSelectedContentId(null);
          onScheduleChange?.();
        }
      } catch (error) {
        console.error("Failed to unschedule:", error);
      } finally {
        setActionLoading(false);
      }
    },
    [canSchedule, onScheduleChange]
  );

  return (
    <div className="flex gap-6 h-full">
      {/* Left: Calendar Grid */}
      <div className="flex-1 min-w-0">
        <div className="mb-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => {
                const prev = new Date(selectedDate);
                prev.setDate(prev.getDate() - (view === "week" ? 7 : 30));
                setSelectedDate(prev);
              }}
              className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
            >
              ←
            </button>

            <button
              onClick={() => setSelectedDate(new Date())}
              className="px-3 py-1 text-sm font-medium bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Dziś
            </button>

            <button
              onClick={() => {
                const next = new Date(selectedDate);
                next.setDate(next.getDate() + (view === "week" ? 7 : 30));
                setSelectedDate(next);
              }}
              className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
            >
              →
            </button>

            <span className="text-sm font-medium text-gray-700">
              {view === "week"
                ? `${weekStart.toLocaleDateString("pl-PL")} – ${weekDays[6].toLocaleDateString("pl-PL")}`
                : selectedDate.toLocaleDateString("pl-PL", {
                    month: "long",
                    year: "numeric"
                  })}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setView("week")}
              className={`px-3 py-1 text-sm rounded ${
                view === "week"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Tydzień
            </button>
            <button
              onClick={() => setView("month")}
              className={`px-3 py-1 text-sm rounded ${
                view === "month"
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              Miesiąc
            </button>
          </div>
        </div>

        {view === "week" ? (
            <WeekView
            weekDays={weekDays}
            eventsByDate={eventsByDate}
            draggedItem={draggedItem}
            onDragOver={handleDragOver}
            onDrop={handleDropOnDate}
            onSelectItem={setSelectedContentId}
            selectedContentId={selectedContentId}
            canSchedule={canSchedule}
          />
        ) : (
          <MonthView
            selectedDate={selectedDate}
            eventsByDate={eventsByDate}
            onSelectItem={setSelectedContentId}
            selectedContentId={selectedContentId}
          />
        )}
      </div>

      {/* Right: Backlog Panel */}
      <div className="w-96 border-l border-gray-200 pl-6 overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            Do zaplanowania
          </h2>
          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
            {filteredBacklog.length} treści
          </span>
        </div>

        {/* Search and Filters */}
        <div className="space-y-2 mb-4">
          <input
            type="text"
            placeholder="🔍 Szukaj..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          
          <div className="flex gap-2">
            <select
              value={filterAuthor}
              onChange={(e) => setFilterAuthor(e.target.value)}
              className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded bg-white"
            >
              <option value="all">Wszyscy autorzy</option>
              {authors.map((author) => (
                <option key={author.id} value={author.id}>
                  {author.name}
                </option>
              ))}
            </select>
            
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="flex-1 px-2 py-1.5 text-xs border border-gray-300 rounded bg-white"
            >
              <option value="all">Wszystkie typy</option>
              <option value="WP_POST">WordPress</option>
              <option value="LINKEDIN_POST">LinkedIn</option>
            </select>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {canSchedule && filteredBacklog.length > 0 && (
          <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedBacklogIds.size === filteredBacklog.length && filteredBacklog.length > 0}
                  onChange={selectAllBacklog}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="font-medium text-gray-700">
                  Zaznacz wszystkie
                </span>
              </label>
              {selectedBacklogIds.size > 0 && (
                <span className="text-xs text-blue-700 font-medium">
                  {selectedBacklogIds.size} zaznaczonych
                </span>
              )}
            </div>
            
            {selectedBacklogIds.size > 0 && (
              <div className="flex gap-2">
                <button
                  onClick={handleBulkSchedule}
                  disabled={bulkScheduling}
                  className="flex-1 px-3 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {bulkScheduling ? "Planowanie..." : `✨ Zaplanuj ${selectedBacklogIds.size} treści`}
                </button>
                <button
                  onClick={() => setSelectedBacklogIds(new Set())}
                  className="px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded"
                >
                  Wyczyść
                </button>
              </div>
            )}
          </div>
        )}

        {/* Keyboard Shortcuts Hint */}
        <div className="mb-3 p-2 bg-gray-50 border border-gray-200 rounded text-xs text-gray-600">
          <div className="font-medium mb-1">⌨️ Skróty klawiszowe:</div>
          <div className="space-y-0.5">
            <div><kbd className="px-1 bg-white border rounded">T</kbd> = Dziś</div>
            <div><kbd className="px-1 bg-white border rounded">Ctrl+←/→</kbd> = Poprzedni/Następny</div>
            <div><kbd className="px-1 bg-white border rounded">Ctrl+W/M</kbd> = Tydzień/Miesiąc</div>
          </div>
        </div>

        {filteredBacklog.length === 0 ? (
          <Card className="p-6 text-center text-gray-500">
            <p>
              {searchQuery || filterAuthor !== "all" || filterType !== "all"
                ? "Brak wyników wyszukiwania."
                : "Nie masz zatwierdzonych treści do zaplanowania."}
            </p>
          </Card>
        ) : (
          <div className="space-y-2">
            {filteredBacklog.map((item) => (
              <BacklogItem
                key={item.id}
                item={item}
                isDragging={draggedItem?.id === item.id}
                onDragStart={() => handleDragStart(item)}
                canSchedule={canSchedule}
                isSelected={selectedBacklogIds.has(item.id)}
                onToggleSelect={() => toggleBacklogSelection(item.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Time Picker Modal */}
      {showTimePicker && timePickerDate && (
        <TimePickerModal
          date={timePickerDate}
          onConfirm={handleTimePickerConfirm}
          onCancel={() => {
            setShowTimePicker(false);
            setPendingScheduleItem(null);
            setTimePickerDate(null);
          }}
        />
      )}

      {/* Quick Actions Modal */}
      {selectedContentId && (
        <QuickActionsModal
          contentId={selectedContentId}
          items={scheduledItems}
          onClose={() => setSelectedContentId(null)}
          onUnschedule={handleUnschedule}
          canSchedule={canSchedule}
          isLoading={actionLoading}
        />
      )}
    </div>
  );
}

// Week view component
function WeekView({
  weekDays,
  eventsByDate,
  draggedItem,
  onDragOver,
  onDrop,
  onSelectItem,
  selectedContentId,
  canSchedule
}: {
  weekDays: Date[];
  eventsByDate: Record<string, (ContentItem & { createdBy?: UserPreview | null })[]>;
  draggedItem: ContentItemWithUser | null;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: (date: Date) => void;
  onSelectItem: (id: string | null) => void;
  selectedContentId: string | null;
  canSchedule: boolean;
}) {
  return (
    <div className="grid grid-cols-7 gap-2 bg-gray-50 p-4 rounded-lg">
      {weekDays.map((day) => {
        const dateKey = day.toISOString().split("T")[0];
        const dayEvents = eventsByDate[dateKey] || [];
        const conflictBadge = getConflictBadge(dayEvents);
        const isToday = day.toDateString() === new Date().toDateString();
        const isWeekend = day.getDay() === 0 || day.getDay() === 6;
        const isPast = day < new Date() && !isToday;

        // Count by type
        const wpCount = dayEvents.filter(e => e.type === "WP_POST").length;
        const linkedInCount = dayEvents.filter(e => e.type === "LINKEDIN_POST").length;

        return (
          <div
            key={dateKey}
            onDragOver={onDragOver}
            onDrop={() => onDrop(day)}
            title={`${day.toLocaleDateString("pl-PL", { weekday: "long", day: "numeric", month: "long" })}\n${dayEvents.length} publikacji`}
            className={`flex flex-col border-2 rounded-xl p-3 min-h-72 transition-all ${
              isToday
                ? "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-400 shadow-lg"
                : isWeekend
                ? "bg-gray-50 border-gray-200"
                : "bg-white border-gray-300 hover:border-blue-300 hover:shadow-md"
            } ${
              draggedItem ? "ring-2 ring-blue-300 ring-offset-2" : ""
            } ${
              isPast ? "opacity-60" : ""
            }`}
          >
            {/* Day Header */}
            <div className="flex items-center justify-between mb-2">
              <div className={`text-sm font-bold ${
                isToday ? "text-blue-700" : isWeekend ? "text-gray-500" : "text-gray-900"
              }`}>
                {day.toLocaleDateString("pl-PL", {
                  weekday: "short",
                  day: "numeric"
                })}
              </div>
              {isToday && (
                <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">
                  Dziś
                </span>
              )}
            </div>

            {/* Conflict Badge */}
            {conflictBadge && (
              <div className="mb-2 px-2 py-1 bg-gradient-to-r from-red-100 to-orange-100 border border-red-300 text-red-800 text-xs rounded-lg font-medium flex items-center gap-1 shadow-sm">
                <span className="text-sm">⚠️</span>
                <span>{conflictBadge}</span>
              </div>
            )}

            {/* Type Summary */}
            {(wpCount > 0 || linkedInCount > 0) && (
              <div className="mb-2 flex gap-1 text-xs">
                {wpCount > 0 && (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded font-medium">
                    📝 {wpCount}
                  </span>
                )}
                {linkedInCount > 0 && (
                  <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded font-medium">
                    💼 {linkedInCount}
                  </span>
                )}
              </div>
            )}

            {/* Events List */}
            <div className="mt-1 space-y-1.5 flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300">
              {dayEvents.length === 0 && canSchedule && !isPast && (
                <div className="h-full flex items-center justify-center text-xs text-gray-400 italic">
                  Przeciągnij tutaj
                </div>
              )}
              {dayEvents.map((item) => (
                <DayEventCard
                  key={item.id}
                  item={item}
                  isSelected={item.id === selectedContentId}
                  onSelect={onSelectItem}
                />
              ))}
            </div>

            {/* Footer */}
            {dayEvents.length > 0 && (
              <div className="mt-2 pt-2 border-t border-gray-200 text-xs text-gray-500 text-center font-medium">
                {dayEvents.length} {dayEvents.length === 1 ? "publikacja" : "publikacji"}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// Month view component
function MonthView({
  selectedDate,
  eventsByDate,
  onSelectItem,
  selectedContentId
}: {
  selectedDate: Date;
  eventsByDate: Record<string, (ContentItem & { createdBy?: UserPreview | null })[]>;
  onSelectItem: (id: string | null) => void;
  selectedContentId: string | null;
}) {
  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const daysInMonth = lastDay.getDate();
  const startingDayOfWeek = firstDay.getDay();

  const days = Array.from({ length: daysInMonth }, (_, i) => {
    const d = new Date(year, month, i + 1);
    return d;
  });

  const emptyDays = Array.from({ length: startingDayOfWeek || 7 }, () => null);

  const today = new Date();

  return (
    <div className="bg-gray-50 p-4 rounded-lg">
      <div className="grid grid-cols-7 gap-1">
        {["Pn", "Wt", "Śr", "Cz", "Pt", "So", "Nd"].map((day) => (
          <div
            key={day}
            className="text-center font-medium text-gray-600 text-sm py-2"
          >
            {day}
          </div>
        ))}

        {emptyDays.map((_, i) => (
          <div key={`empty-${i}`} className="bg-white rounded border-transparent" />
        ))}

        {days.map((day) => {
          const dateKey = day.toISOString().split("T")[0];
          const dayEvents = eventsByDate[dateKey] || [];
          const isToday = day.toDateString() === today.toDateString();

          return (
            <div
              key={dateKey}
              className={`border rounded p-2 min-h-24 flex flex-col ${
                isToday
                  ? "bg-blue-50 border-blue-300"
                  : "bg-white border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-xs font-medium text-gray-900">
                {day.getDate()}
              </div>
              <div className="mt-1 space-y-1 flex-1 overflow-y-auto text-xs">
                {dayEvents.slice(0, 2).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => onSelectItem(item.id)}
                    className={`px-1.5 py-0.5 rounded truncate cursor-pointer ${
                      item.id === selectedContentId
                        ? "bg-blue-600 text-white"
                        : item.type === "WP_POST"
                        ? "bg-green-100 text-green-800"
                        : "bg-blue-100 text-blue-800"
                    }`}
                  >
                    {item.topic}
                  </div>
                ))}
                {dayEvents.length > 2 && (
                  <div className="text-gray-500 px-1.5 py-0.5">
                    +{dayEvents.length - 2} więcej
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Day event card component
function DayEventCard({
  item,
  isSelected,
  onSelect
}: {
  item: ContentItem & { createdBy?: UserPreview | null };
  isSelected: boolean;
  onSelect: (id: string) => void;
}) {
  // Determine publication status
  let statusIcon = null;
  let statusColor = "";
  let statusLabel = "";
  
  if (item.status === "PUBLISHED") {
    statusIcon = "✓";
    statusColor = "text-green-600";
    statusLabel = "Opublikowano";
  } else if (item.publishAttempts > 0 && item.publishError) {
    statusIcon = "❌";
    statusColor = "text-red-600";
    statusLabel = `Błąd: ${item.publishError}`;
  } else if (item.status === "SCHEDULED" && item.scheduledFor && new Date(item.scheduledFor) < new Date()) {
    statusIcon = "⏳";
    statusColor = "text-yellow-600";
    statusLabel = "W kolejce";
  } else {
    statusIcon = "📅";
    statusColor = "text-blue-600";
    statusLabel = "Zaplanowano";
  }

  const typeColor = item.type === "WP_POST" 
    ? "from-green-50 to-green-100 border-green-300 text-green-900 hover:from-green-100 hover:to-green-200" 
    : "from-blue-50 to-blue-100 border-blue-300 text-blue-900 hover:from-blue-100 hover:to-blue-200";

  return (
    <button
      onClick={() => onSelect(item.id)}
      title={`${item.topic}\n${item.type === "WP_POST" ? "WordPress" : "LinkedIn"}\n${statusLabel}\n${item.scheduledFor ? new Date(item.scheduledFor).toLocaleTimeString("pl-PL", { hour: "2-digit", minute: "2-digit" }) : ""}`}
      className={`group w-full text-left px-3 py-2 rounded-lg text-xs transition-all ${
        isSelected
          ? "ring-2 ring-blue-500 bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg scale-105"
          : `bg-gradient-to-br border ${typeColor} shadow-sm`
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <span className={`font-medium line-clamp-2 flex-1 ${
          isSelected ? "text-white" : ""
        }`}>
          {item.topic}
        </span>
        <span className={`flex-shrink-0 text-sm ${
          isSelected ? "text-white" : statusColor
        }`}>
          {statusIcon}
        </span>
      </div>
      {item.scheduledFor && (
        <div className={`mt-1 text-xs ${
          isSelected ? "text-blue-100" : "text-gray-600"
        } font-medium`}>
          ⏰ {new Date(item.scheduledFor).toLocaleTimeString("pl-PL", { 
            hour: "2-digit", 
            minute: "2-digit" 
          })}
        </div>
      )}
    </button>
  );
}

// Backlog item component
function BacklogItem({
  item,
  isDragging,
  onDragStart,
  canSchedule,
  isSelected,
  onToggleSelect
}: {
  item: ContentItem & { createdBy?: UserPreview | null };
  isDragging: boolean;
  onDragStart: () => void;
  canSchedule: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}) {
  return (
    <div
      draggable={canSchedule && !isSelected}
      onDragStart={onDragStart}
      className={`border rounded-lg p-3 transition relative ${
        isSelected 
          ? "border-blue-400 bg-blue-50 ring-2 ring-blue-400" 
          : "border-gray-200 hover:shadow-md"
      } ${
        isDragging ? "opacity-50" : ""
      } ${canSchedule && !isSelected ? "cursor-grab" : ""}`}
    >
      <div className="flex items-start gap-2">
        {canSchedule && onToggleSelect && (
          <input
            type="checkbox"
            checked={isSelected}
            onChange={onToggleSelect}
            onClick={(e) => e.stopPropagation()}
            className="mt-0.5 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="text-xs font-semibold text-gray-900 truncate">
            {item.topic}
          </div>
          <div className="mt-1 flex items-center justify-between text-xs text-gray-600">
            <span className={`inline-block px-1.5 py-0.5 rounded font-medium ${
              item.type === "WP_POST" 
                ? "bg-green-100 text-green-700" 
                : "bg-blue-100 text-blue-700"
            }`}>
              {item.type === "WP_POST" ? "📝 WordPress" : "💼 LinkedIn"}
            </span>
          </div>
          {item.createdBy && (
            <div className="mt-1 text-xs text-gray-500">
              👤 {item.createdBy.name || item.createdBy.email}
            </div>
          )}
          {item.mainKeyword && (
            <div className="mt-1 text-xs text-gray-400 truncate">
              🔑 {item.mainKeyword}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Quick actions modal
function QuickActionsModal({
  contentId,
  items,
  onClose,
  onUnschedule,
  canSchedule,
  isLoading
}: {
  contentId: string;
  items: ContentItemWithUser[];
  onClose: () => void;
  onUnschedule: (id: string) => void;
  canSchedule: boolean;
  isLoading: boolean;
}) {
  const item = items.find((i) => i.id === contentId);
  if (!item) return null;

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
          {item.topic}
        </h3>

        <div className="space-y-3 mb-6">
          <div>
            <p className="text-sm text-gray-600">Typ</p>
            <p className="text-sm font-medium text-gray-900">
              {item.type === "WP_POST" ? "WordPress" : "LinkedIn"}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Zaplanowana na</p>
            <p className="text-sm font-medium text-gray-900">
              {item.scheduledFor?.toLocaleDateString("pl-PL")} (
              {item.scheduledFor?.toLocaleTimeString("pl-PL", {
                hour: "2-digit",
                minute: "2-digit"
              })}
              )
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Autor</p>
            <p className="text-sm font-medium text-gray-900">
              {item.createdBy?.name || item.createdBy?.email || "Nieznany"}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Link href={`/content/${item.id}`}>
            <Button className="w-full bg-blue-600 text-white hover:bg-blue-700">
              Otwórz treść
            </Button>
          </Link>

          {canSchedule && (
            <Button
              onClick={() => {
                onUnschedule(item.id);
                onClose();
              }}
              disabled={isLoading}
              className="w-full bg-red-100 text-red-700 hover:bg-red-200"
            >
              {isLoading ? "..." : "Usuń z kalendarza"}
            </Button>
          )}

          <Button
            onClick={onClose}
            className="w-full bg-gray-200 text-gray-700 hover:bg-gray-300"
          >
            Zamknij
          </Button>
        </div>
      </div>
    </div>
  );
}

// Time Picker Modal
function TimePickerModal({
  date,
  onConfirm,
  onCancel
}: {
  date: Date;
  onConfirm: (hour: number) => void;
  onCancel: () => void;
}) {
  const commonHours = [8, 10, 12, 14, 16, 18];
  const [customHour, setCustomHour] = useState<string>("");
  const [showCustom, setShowCustom] = useState(false);

  const handleCustomSubmit = () => {
    const hour = parseInt(customHour);
    if (!isNaN(hour) && hour >= 0 && hour < 24) {
      onConfirm(hour);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={onCancel}
    >
      <div
        className="w-96 p-6 shadow-xl bg-white rounded-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          ⏰ Wybierz godzinę publikacji
        </h3>
        <p className="text-sm text-gray-600 mb-4">
          {date.toLocaleDateString("pl-PL", { 
            weekday: "long", 
            year: "numeric", 
            month: "long", 
            day: "numeric" 
          })}
        </p>

        {!showCustom ? (
          <>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {commonHours.map((hour) => (
                <button
                  key={hour}
                  onClick={() => onConfirm(hour)}
                  className="px-4 py-3 text-center border-2 border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition font-medium"
                >
                  {hour}:00
                </button>
              ))}
            </div>
            
            <button
              onClick={() => setShowCustom(true)}
              className="w-full px-4 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition"
            >
              ✏️ Inna godzina...
            </button>
          </>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Godzina (0-23)
              </label>
              <input
                type="number"
                min="0"
                max="23"
                value={customHour}
                onChange={(e) => setCustomHour(e.target.value)}
                placeholder="np. 15"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleCustomSubmit();
                }}
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCustomSubmit}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
              >
                Potwierdź
              </button>
              <button
                onClick={() => setShowCustom(false)}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition"
              >
                Wróć
              </button>
            </div>
          </div>
        )}

        <button
          onClick={onCancel}
          className="w-full mt-3 px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition"
        >
          Anuluj
        </button>
      </div>
    </div>
  );
}
