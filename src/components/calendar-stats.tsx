"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import type { ContentItem } from "@prisma/client";

interface CalendarStatsProps {
  scheduledItems: ContentItem[];
  thisWeekCount: number;
  approvedItems?: ContentItem[];
}

export function CalendarStats({ scheduledItems, thisWeekCount: _thisWeekCount = 0, approvedItems: _approvedItems = [] }: CalendarStatsProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Reference unused props to satisfy linter
  void _thisWeekCount;
  void _approvedItems;

  // Today's count
  const todayCount = scheduledItems.filter(item => {
    const itemDate = new Date(item.scheduledFor!);
    return itemDate.toDateString() === today.toDateString();
  }).length;

  // Tomorrow's count
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowCount = scheduledItems.filter(item => {
    const itemDate = new Date(item.scheduledFor!);
    return itemDate.toDateString() === tomorrow.toDateString();
  }).length;

  // Next 7 days count
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);
  const nextWeekCount = scheduledItems.filter(item => {
    const itemDate = new Date(item.scheduledFor!);
    return itemDate >= today && itemDate < nextWeek;
  }).length;

  // Type breakdown
  const wpCount = scheduledItems.filter(item => item.type === "WP_POST").length;
  const linkedInCount = scheduledItems.filter(item => item.type === "LINKEDIN_POST").length;

  // Status breakdown
  const publishedCount = scheduledItems.filter(item => item.status === "PUBLISHED").length;
  const failedCount = scheduledItems.filter(item => item.publishError).length;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {/* Today */}
      <Card className={`p-3 ${todayCount > 0 ? "bg-gradient-to-br from-blue-50 to-blue-100 border-blue-300" : "bg-white"}`}>
        <div className="text-xs text-gray-600 font-medium mb-1">Dziś</div>
        <div className="text-2xl font-bold text-blue-600">{todayCount}</div>
      </Card>

      {/* Tomorrow */}
      <Card className={`p-3 ${tomorrowCount > 0 ? "bg-gradient-to-br from-purple-50 to-purple-100 border-purple-300" : "bg-white"}`}>
        <div className="text-xs text-gray-600 font-medium mb-1">Jutro</div>
        <div className="text-2xl font-bold text-purple-600">{tomorrowCount}</div>
      </Card>

      {/* This Week */}
      <Card className="p-3 bg-gradient-to-br from-green-50 to-green-100 border-green-300">
        <div className="text-xs text-gray-600 font-medium mb-1">Ten tydzień</div>
        <div className="text-2xl font-bold text-green-600">{nextWeekCount}</div>
      </Card>

      {/* WordPress */}
      <Card className="p-3 bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-300">
        <div className="text-xs text-gray-600 font-medium mb-1">📝 WordPress</div>
        <div className="text-2xl font-bold text-emerald-600">{wpCount}</div>
      </Card>

      {/* LinkedIn */}
      <Card className="p-3 bg-gradient-to-br from-sky-50 to-sky-100 border-sky-300">
        <div className="text-xs text-gray-600 font-medium mb-1">💼 LinkedIn</div>
        <div className="text-2xl font-bold text-sky-600">{linkedInCount}</div>
      </Card>

      {/* Published/Failed */}
      <Card className={`p-3 ${failedCount > 0 ? "bg-gradient-to-br from-red-50 to-red-100 border-red-300" : "bg-gradient-to-br from-gray-50 to-gray-100 border-gray-300"}`}>
        <div className="text-xs text-gray-600 font-medium mb-1">
          {failedCount > 0 ? "❌ Błędy" : "✓ Status"}
        </div>
        <div className={`text-2xl font-bold ${failedCount > 0 ? "text-red-600" : "text-green-600"}`}>
          {failedCount > 0 ? failedCount : publishedCount}
        </div>
      </Card>
    </div>
  );
}
