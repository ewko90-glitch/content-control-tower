"use client";

import Link from "next/link";
import { useTransition } from "react";
import {
  DndContext,
  DragEndEvent,
  closestCorners
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy
} from "@dnd-kit/sortable";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { updateContentStatus } from "@/app/actions/content";
import { Card } from "@/components/ui/card";
import {
  getStatusColor,
  getStatusLabel,
  STATUS_GROUPS,
  type ContentStatus
} from "@/lib/workflow";

interface ContentItemForKanban {
  id: string;
  topic: string;
  status: ContentStatus;
  type: string;
  createdById: string;
  approvedById?: string | null;
  scheduledFor?: Date | null;
  mainKeyword: string;
  creator?: { name: string; email: string };
  integrationsConfigured: number;
  totalIntegrations: number;
}

export type { ContentItemForKanban };

interface KanbanProps {
  items: ContentItemForKanban[];
  currentUserId: string;
  userRole: "OWNER" | "APPROVER" | "EDITOR";
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

const statusFlow: Record<ContentStatus, ContentStatus[]> = {
  DRAFT: ["AWAITING_APPROVAL"],
  GENERATED: ["AWAITING_APPROVAL"],
  AWAITING_APPROVAL: ["APPROVED", "REJECTED"],
  APPROVED: ["SCHEDULED", "REJECTED"],
  SCHEDULED: ["PUBLISHED", "DRAFT"],
  PUBLISHED: [],
  REJECTED: ["DRAFT", "AWAITING_APPROVAL"]
};

export function ContentKanbanDraggable({
  items,
  currentUserId,
  userRole,
  selectedIds = new Set(),
  onToggleSelect
}: KanbanProps) {
  const [isPending, startTransition] = useTransition();

  const columns: Array<{
    key: keyof typeof STATUS_GROUPS;
    label: string;
    color: string;
  }> = [
    { key: "drafts", label: "Szkice", color: "bg-gray-50" },
    { key: "awaiting", label: "Do zatwierdzenia", color: "bg-amber-50" },
    { key: "approved", label: "Zatwierdzone", color: "bg-green-50" },
    { key: "scheduled", label: "Zaplanowane", color: "bg-purple-50" },
    { key: "published", label: "Opublikowane", color: "bg-emerald-50" },
    { key: "rejected", label: "Odrzucone", color: "bg-red-50" }
  ];

  const getItemsByStatus = (statuses: ContentStatus[]) => {
    return items.filter((item) => statuses.includes(item.status));
  };

  const canApprove = userRole === "APPROVER" || userRole === "OWNER";

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeItemId = active.id as string;
    const activeItem = items.find((i) => i.id === activeItemId);

    if (!activeItem) return;

    // Extract target status from overId (format: "column-STATUS")
    const overIdStr = String(over.id);
    const targetStatus = overIdStr.includes("-")
      ? (overIdStr.split("-")[1] as ContentStatus)
      : activeItem.status;

    if (targetStatus === activeItem.status) return;

    // Check if status transition is allowed
    const allowedTransitions = statusFlow[activeItem.status] || [];
    if (!allowedTransitions.includes(targetStatus)) {
      return;
    }

    // Permission checks
    const isAuthor = activeItem.createdById === currentUserId;
    if (
      targetStatus === "AWAITING_APPROVAL" &&
      !isAuthor &&
      userRole === "EDITOR"
    ) {
      alert("Tylko autor może wysłać treść do zatwierdzenia");
      return;
    }

    if (
      (targetStatus === "APPROVED" || targetStatus === "REJECTED") &&
      !canApprove
    ) {
      alert("Tylko zatwierdzający mogą zmienić ten status");
      return;
    }

    startTransition(async () => {
      const result = await updateContentStatus(
        activeItemId,
        targetStatus as
          | "DRAFT"
          | "AWAITING_APPROVAL"
          | "APPROVED"
          | "SCHEDULED"
          | "PUBLISHED"
          | "REJECTED"
      );
      if (!result.success) {
        alert(result.message || "Błąd przy zmianie statusu");
      }
    });
  };

  const handleApprove = (contentId: string) => {
    if (!canApprove) return;
    startTransition(async () => {
      const result = await updateContentStatus(
        contentId,
        "APPROVED" as const
      );
      if (!result.success) {
        alert(result.message || "Błąd przy zatwierdzeniu");
      }
    });
  };

  const handleReject = (contentId: string) => {
    if (!canApprove) return;
    const comment = prompt("Podaj powód odrzucenia:");
    if (comment) {
      startTransition(async () => {
        const result = await updateContentStatus(contentId, "REJECTED" as const, {
          comment
        });
        if (!result.success) {
          alert(result.message || "Błąd przy odrzuceniu");
        }
      });
    }
  };

  const handleSchedule = (contentId: string) => {
    if (userRole !== "OWNER" && userRole !== "APPROVER") return;
    const scheduledFor = prompt("Wprowadź datę i czas (YYYY-MM-DD HH:mm):");
    if (scheduledFor) {
      try {
        new Date(scheduledFor);
        startTransition(async () => {
          const result = await updateContentStatus(
            contentId,
            "SCHEDULED" as const,
            { scheduledFor }
          );
          if (!result.success) {
            alert(result.message || "Błąd przy planowaniu");
          }
        });
      } catch {
        alert("Nieprawidłowy format daty");
      }
    }
  };

  return (
    <DndContext
      collisionDetection={closestCorners}
      onDragEnd={handleDragEnd}
    >
      <div className="space-y-4">
        <div className="overflow-x-auto">
          <div className="flex gap-4 min-w-min">
            {columns.map(({ key, label, color }) => {
              const columnStatuses = STATUS_GROUPS[key] as unknown as ContentStatus[];
              const columnItems = getItemsByStatus(columnStatuses);
              const itemIds = columnItems.map((item) => item.id);

              return (
                <KanbanColumn
                  key={key}
                  columnId={key}
                  label={label}
                  color={color}
                  items={columnItems}
                  itemIds={itemIds}
                  currentUserId={currentUserId}
                  userRole={userRole}
                  onApprove={handleApprove}
                  onReject={handleReject}
                  onSchedule={handleSchedule}
                  isPending={isPending}
                  selectedIds={selectedIds}
                  onToggleSelect={onToggleSelect}
                />
              );
            })}
          </div>
        </div>
      </div>
    </DndContext>
  );
}

interface KanbanColumnProps {
  columnId: string;
  label: string;
  color: string;
  items: ContentItemForKanban[];
  itemIds: string[];
  currentUserId: string;
  userRole: string;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onSchedule: (id: string) => void;
  isPending: boolean;
  selectedIds?: Set<string>;
  onToggleSelect?: (id: string) => void;
}

function KanbanColumn({
  columnId,
  label,
  color,
  items,
  itemIds,
  currentUserId,
  userRole,
  onApprove,
  onReject,
  onSchedule,
  isPending,
  selectedIds = new Set(),
  onToggleSelect
}: KanbanColumnProps) {
  const { setNodeRef } = useSortable({
    id: `column-${columnId}`,
    data: { type: "Column", columnId },
    strategy: verticalListSortingStrategy
  });

  return (
    <div ref={setNodeRef} className="flex-shrink-0 w-80">
      <div className={`rounded-lg p-4 ${color} space-y-3`}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">{label}</h3>
          <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">
            {items.length}
          </span>
        </div>

        {items.length === 0 ? (
          <div className="rounded-md border border-dashed border-gray-300 bg-white p-4 text-center text-sm text-gray-500">
            {columnId === "awaiting"
              ? "Brak treści do zatwierdzenia — dobry znak."
              : `Brak treści w ${label.toLowerCase()}.`}
          </div>
        ) : (
          <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {items.map((item) => (
                <DraggableContentCard
                  key={item.id}
                  item={item}
                  currentUserId={currentUserId}
                  userRole={userRole as any}
                  onApprove={() => onApprove(item.id)}
                  onReject={() => onReject(item.id)}
                  onSchedule={() => onSchedule(item.id)}
                  isPending={isPending}
                  isSelected={selectedIds?.has(item.id) || false}
                  onToggleSelect={() => onToggleSelect?.(item.id)}
                />
              ))}
            </div>
          </SortableContext>
        )}
      </div>
    </div>
  );
}

interface DraggableContentCardProps {
  item: ContentItemForKanban;
  currentUserId: string;
  userRole: "OWNER" | "APPROVER" | "EDITOR";
  onApprove: () => void;
  onReject: () => void;
  onSchedule: () => void;
  isPending: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
}

function DraggableContentCard({
  item,
  currentUserId,
  userRole,
  onApprove,
  onReject,
  onSchedule,
  isPending,
  isSelected = false,
  onToggleSelect
}: DraggableContentCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging
  } = useSortable({ id: item.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1
  };

  const isAuthor = item.createdById === currentUserId;
  const canApprove = userRole === "APPROVER" || userRole === "OWNER";
  const showPublicationRisk =
    item.status === "SCHEDULED" && item.integrationsConfigured === 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`rounded-lg border-2 p-3 shadow-sm space-y-2 cursor-grab active:cursor-grabbing relative ${
        isDragging ? "shadow-lg ring-2 ring-blue-500 bg-blue-50" : ""
      } ${
        isSelected
          ? "border-blue-500 bg-blue-50"
          : "border-gray-200 bg-white"
      }`}
      {...attributes}
      {...listeners}
    >
      {/* Checkbox for bulk selection */}
      <div className="absolute top-2 right-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleSelect?.();
          }}
          className={`w-5 h-5 rounded border-2 flex items-center justify-center transition ${
            isSelected
              ? "bg-blue-600 border-blue-600"
              : "border-gray-300 bg-white hover:border-gray-400"
          }`}
        >
          {isSelected && (
            <span className="text-white text-xs font-bold">✓</span>
          )}
        </button>
      </div>
      <Link href={`/content/${item.id}`} className="block hover:underline">
        <p className="text-sm font-semibold text-gray-900 line-clamp-2 pointer-events-none">
          {item.topic}
        </p>
      </Link>

      <div className="flex flex-wrap gap-1">
        <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
          {item.type}
        </span>
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs ${getStatusColor(item.status)}`}
        >
          {getStatusLabel(item.status)}
        </span>
      </div>

      <p className="text-xs text-gray-600 line-clamp-1">{item.mainKeyword}</p>

      {item.scheduledFor && (
        <p className="text-xs text-gray-500">
          📅 {new Date(item.scheduledFor).toLocaleString("pl-PL")}
        </p>
      )}

      {showPublicationRisk && (
        <div className="rounded-md bg-red-50 border border-red-200 p-2 text-xs text-red-700">
          Ryzyko publikacji — brak skonfigurowanych stron
        </div>
      )}

      {item.status === "AWAITING_APPROVAL" && canApprove && (
        <div className="flex gap-2 pt-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onApprove();
            }}
            disabled={isPending}
            className="flex-1 rounded-md bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs py-1 transition"
          >
            Zatwierdź
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onReject();
            }}
            disabled={isPending}
            className="flex-1 rounded-md bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs py-1 transition"
          >
            Odrzuć
          </button>
        </div>
      )}

      {item.status === "APPROVED" &&
        (userRole === "OWNER" || userRole === "APPROVER") && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onSchedule();
            }}
            disabled={isPending}
            className="w-full rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs py-1 transition"
          >
            Zaplanuj publikację
          </button>
        )}

      {item.status === "REJECTED" && (isAuthor || userRole === "OWNER") && (
        <Link href={`/content/${item.id}`}>
          <button
            onClick={(e) => e.stopPropagation()}
            className="w-full rounded-md bg-gray-600 hover:bg-gray-700 text-white text-xs py-1 transition"
          >
            Napraw i wyślij
          </button>
        </Link>
      )}

      <p className="text-xs text-gray-500 pt-1 pointer-events-none">
        {item.creator ? `${item.creator.name}` : "Nieznany autor"}
        {isAuthor && " (Ty)"}
      </p>
    </div>
  );
}
