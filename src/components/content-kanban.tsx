"use client";

import Link from "next/link";
import { useTransition } from "react";
import { updateContentStatus } from "@/app/actions/content";
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

interface KanbanProps {
  items: ContentItemForKanban[];
  currentUserId: string;
  userRole: "OWNER" | "APPROVER" | "EDITOR";
}

export function ContentKanban({ items, currentUserId, userRole }: KanbanProps) {
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

  const handleStatusChange = (contentId: string, nextStatus: ContentStatus) => {
    if (nextStatus === "GENERATED") {
      alert("Użyj opcji generowania w szczegółach treści");
      return;
    }
    
    startTransition(async () => {
      const result = await updateContentStatus(
        contentId,
        nextStatus as "DRAFT" | "AWAITING_APPROVAL" | "APPROVED" | "SCHEDULED" | "PUBLISHED" | "REJECTED"
      );
      if (!result.success) {
        alert(result.message || "Błąd przy zmianie statusu");
      }
    });
  };

  const handleApprove = (contentId: string) => {
    if (!canApprove) return;
    handleStatusChange(contentId, "APPROVED");
  };

  const handleReject = (contentId: string) => {
    if (!canApprove) return;
    const comment = prompt("Podaj powód odrzucenia:");
    if (comment) {
      startTransition(async () => {
        const result = await updateContentStatus(contentId, "REJECTED", { comment });
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
          const result = await updateContentStatus(contentId, "SCHEDULED", {
            scheduledFor
          });
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
    <div className="space-y-4">
      <div className="overflow-x-auto">
        <div className="flex gap-4 min-w-min">
          {columns.map(({ key, label, color }) => {
            const columnItems = getItemsByStatus(
              STATUS_GROUPS[key] as unknown as ContentStatus[]
            );

            return (
              <div key={key} className="flex-shrink-0 w-80">
                <div className={`rounded-lg p-4 ${color} space-y-3`}>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-900">{label}</h3>
                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-700">
                      {columnItems.length}
                    </span>
                  </div>

                  {columnItems.length === 0 ? (
                    <div className="rounded-md border border-dashed border-gray-300 bg-white p-4 text-center text-sm text-gray-500">
                      {key === "awaiting"
                        ? "Brak treści do zatwierdzenia — dobry znak."
                        : `Brak treści w ${label.toLowerCase()}.`}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {columnItems.map((item) => (
                        <ContentCard
                          key={item.id}
                          item={item}
                          currentUserId={currentUserId}
                          userRole={userRole}
                          onApprove={() => handleApprove(item.id)}
                          onReject={() => handleReject(item.id)}
                          onSchedule={() => handleSchedule(item.id)}
                          isPending={isPending}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

interface ContentCardProps {
  item: ContentItemForKanban;
  currentUserId: string;
  userRole: "OWNER" | "APPROVER" | "EDITOR";
  onApprove: () => void;
  onReject: () => void;
  onSchedule: () => void;
  isPending: boolean;
}

function ContentCard({
  item,
  currentUserId,
  userRole,
  onApprove,
  onReject,
  onSchedule,
  isPending
}: ContentCardProps) {
  const isAuthor = item.createdById === currentUserId;
  const canApprove = userRole === "APPROVER" || userRole === "OWNER";
  const showPublicationRisk =
    item.status === "SCHEDULED" && item.integrationsConfigured === 0;

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-3 shadow-sm space-y-2">
      <Link href={`/content/${item.id}`} className="block hover:underline">
        <p className="text-sm font-semibold text-gray-900 line-clamp-2">
          {item.topic}
        </p>
      </Link>

      <div className="flex flex-wrap gap-1">
        <span className="inline-flex rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
          {item.type}
        </span>
        <span className={`inline-flex rounded-full px-2 py-0.5 text-xs ${getStatusColor(item.status)}`}>
          {getStatusLabel(item.status)}
        </span>
      </div>

      <p className="text-xs text-gray-600 line-clamp-1">
        {item.mainKeyword}
      </p>

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
            onClick={onApprove}
            disabled={isPending}
            className="flex-1 rounded-md bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-xs py-1 transition"
          >
            Zatwierdź
          </button>
          <button
            onClick={onReject}
            disabled={isPending}
            className="flex-1 rounded-md bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white text-xs py-1 transition"
          >
            Odrzuć
          </button>
        </div>
      )}

      {item.status === "APPROVED" && (userRole === "OWNER" || userRole === "APPROVER") && (
        <button
          onClick={onSchedule}
          disabled={isPending}
          className="w-full rounded-md bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white text-xs py-1 transition"
        >
          Zaplanuj publikację
        </button>
      )}

      {item.status === "REJECTED" && (isAuthor || userRole === "OWNER") && (
        <Link href={`/content/${item.id}`}>
          <button className="w-full rounded-md bg-gray-600 hover:bg-gray-700 text-white text-xs py-1 transition">
            Napraw i wyślij
          </button>
        </Link>
      )}

      <p className="text-xs text-gray-500 pt-1">
        {item.creator ? `${item.creator.name}` : "Nieznany autor"}
        {isAuthor && " (Ty)"}
      </p>
    </div>
  );
}
