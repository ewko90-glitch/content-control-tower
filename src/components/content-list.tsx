"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { updateContentStatus } from "@/app/actions/content";
import { getStatusColor, getStatusLabel, type ContentStatus } from "@/lib/workflow";

interface ContentItemForList {
  id: string;
  topic: string;
  status: ContentStatus;
  type: string;
  createdById: string;
  scheduledFor?: Date | null;
  updatedAt: Date;
  creator?: { name: string; email: string };
}

interface ListProps {
  items: ContentItemForList[];
  currentUserId: string;
  userRole: "OWNER" | "APPROVER" | "EDITOR";
}

export function ContentList({ items, currentUserId, userRole }: ListProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [isPending, startTransition] = useTransition();

  const isAllSelected = selected.size === items.length && items.length > 0;
  const canApprove = userRole === "APPROVER" || userRole === "OWNER";

  const toggleSelect = (id: string) => {
    const newSet = new Set(selected);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelected(newSet);
  };

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(items.map((item) => item.id)));
    }
  };

  const handleBulkAction = (action: string) => {
    if (selected.size === 0) return;

    const selectedItems = items.filter((item) => selected.has(item.id));

    startTransition(async () => {
      for (const item of selectedItems) {
        if (action === "approve" && canApprove) {
          await updateContentStatus(item.id, "APPROVED");
        } else if (action === "draft") {
          await updateContentStatus(item.id, "DRAFT");
        } else if (action === "awaiting") {
          await updateContentStatus(item.id, "AWAITING_APPROVAL");
        }
      }
      setSelected(new Set());
    });
  };

  return (
    <div className="space-y-4">
      {selected.size > 0 && (
        <div className="sticky bottom-0 left-0 right-0 bg-blue-50 border-t border-blue-200 p-4 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">
            Zaznaczono: {selected.size}
          </span>
          <div className="flex gap-2">
            {canApprove && (
              <button
                onClick={() => handleBulkAction("approve")}
                disabled={isPending}
                className="px-3 py-1 text-sm rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition"
              >
                Zatwierdź zaznaczone
              </button>
            )}
            <button
              onClick={() => handleBulkAction("draft")}
              disabled={isPending}
              className="px-3 py-1 text-sm rounded-md bg-gray-600 text-white hover:bg-gray-700 disabled:opacity-50 transition"
            >
              Przenieś do szkiców
            </button>
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-gray-200 bg-gray-50">
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 w-8">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={toggleSelectAll}
                  className="rounded"
                />
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                Temat
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                Typ
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                Autor
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                Termin
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600">
                Ostatnia zmiana
              </th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-gray-500">
                  Brak treści do wyświetlenia
                </td>
              </tr>
            ) : (
              items.map((item) => (
                <tr key={item.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(item.id)}
                      onChange={() => toggleSelect(item.id)}
                      className="rounded"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <Link
                      href={`/content/${item.id}`}
                      className="text-blue-600 hover:underline font-medium line-clamp-1"
                    >
                      {item.topic}
                    </Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{item.type}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(item.status)}`}>
                      {getStatusLabel(item.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {item.creator?.name || "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">
                    {item.scheduledFor
                      ? new Date(item.scheduledFor).toLocaleDateString("pl-PL")
                      : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(item.updatedAt).toLocaleDateString("pl-PL")}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {items.length === 0 && (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <p className="text-gray-600 mb-4">Brak treści w projekcie.</p>
          <Link href="/content/new">
            <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition">
              Dodaj pierwszą treść
            </button>
          </Link>
        </div>
      )}
    </div>
  );
}
