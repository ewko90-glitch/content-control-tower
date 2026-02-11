"use client";

import { useState, useTransition } from "react";
import { updateContentStatus } from "@/app/actions/content";
import { ContentKanbanDraggable } from "@/components/content-kanban-draggable";
import { BulkSchedulingBar } from "@/components/bulk-scheduling-bar";
import type { ContentItemForKanban } from "@/components/content-kanban-draggable";

interface ContentKanbanWithBulkProps {
  items: ContentItemForKanban[];
  currentUserId: string;
  userRole: "OWNER" | "APPROVER" | "EDITOR";
}

export function ContentKanbanWithBulk({
  items,
  currentUserId,
  userRole
}: ContentKanbanWithBulkProps) {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isPending, startTransition] = useTransition();

  const handleToggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const handleBulkSchedule = async (scheduledFor: string) => {
    const approvedItems = items.filter(
      (item) => item.status === "APPROVED" && selectedIds.has(item.id)
    );

    if (approvedItems.length === 0) {
      alert("Tylko zatwierdzone treści mogą być zaplanowane");
      return;
    }

    let errorCount = 0;

    for (const item of approvedItems) {
      const result = await updateContentStatus(
        item.id,
        "SCHEDULED" as const,
        { scheduledFor }
      );
      if (!result.success) {
        errorCount++;
      }
    }

    if (errorCount === 0) {
      setSelectedIds(new Set());
      alert(`✓ Zaplanowano ${approvedItems.length} treści`);
    } else {
      alert(
        `Zaplanowano ${approvedItems.length - errorCount}/${approvedItems.length} treści. ${errorCount} błędów.`
      );
    }
  };

  return (
    <div className="space-y-4 flex flex-col">
      <ContentKanbanDraggable
        items={items}
        currentUserId={currentUserId}
        userRole={userRole}
        selectedIds={selectedIds}
        onToggleSelect={handleToggleSelect}
      />

      <BulkSchedulingBar
        selectedCount={selectedIds.size}
        onSchedule={handleBulkSchedule}
        onClear={() => setSelectedIds(new Set())}
      />
    </div>
  );
}
