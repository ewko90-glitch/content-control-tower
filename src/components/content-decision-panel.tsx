"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { approveContent, rejectContent, updateContentStatus, resetToDraft } from "@/app/actions/content";
import { Card } from "@/components/ui/card";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Button } from "@/components/ui/button";

interface ContentItem {
  id: string;
  status: string;
  topic: string;
  createdById: string;
  approvedById?: string | null;
  scheduledFor?: Date | null;
}

interface ContentDecisionPanelProps {
  item: ContentItem;
  currentUserId: string;
  isAuthor: boolean;
  userRole: "OWNER" | "APPROVER" | "EDITOR";
  canApprove: boolean;
  canSchedule: boolean;
}

export function ContentDecisionPanel({
  item,
  currentUserId,
  isAuthor,
  userRole,
  canApprove,
  canSchedule
}: ContentDecisionPanelProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleApprove = async () => {
    startTransition(async () => {
      const result = await approveContent(item.id);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.message);
      }
    });
  };

  const handleReject = async () => {
    const comment = prompt("Podaj powód odrzucenia treści:");
    if (!comment) return;

    startTransition(async () => {
      const result = await rejectContent(item.id, comment);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.message);
      }
    });
  };

  const handleSchedule = async () => {
    const scheduledFor = prompt("Wprowadź datę i czas (YYYY-MM-DD HH:mm):");
    if (!scheduledFor) return;

    startTransition(async () => {
      const result = await updateContentStatus(item.id, "SCHEDULED", {
        scheduledFor
      });
      if (result.success) {
        router.refresh();
      } else {
        alert(result.message);
      }
    });
  };

  const handleSendForApproval = async () => {
    startTransition(async () => {
      const result = await updateContentStatus(item.id, "AWAITING_APPROVAL");
      if (result.success) {
        router.refresh();
      } else {
        alert(result.message);
      }
    });
  };

  const handleResetToDraft = async () => {
    if (!confirm("Przywrócić treść do szkicu?")) return;

    startTransition(async () => {
      const result = await resetToDraft(item.id);
      if (result.success) {
        router.refresh();
      } else {
        alert(result.message);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* Awaiting Approval - Decision Required */}
      {item.status === "AWAITING_APPROVAL" && canApprove && (
        <Card className="space-y-3 border-l-4 border-l-amber-500 bg-amber-50">
          <h3 className="font-semibold text-gray-900">Decyzja potrzebna</h3>
          <p className="text-sm text-gray-700">Treść czeka na Twoją decyzję.</p>
          <div className="flex flex-col gap-2">
            <button
              onClick={handleApprove}
              disabled={isPending}
              className="w-full px-3 py-2 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50 transition"
            >
              Zatwierdź treść
            </button>
            <button
              onClick={handleReject}
              disabled={isPending}
              className="w-full px-3 py-2 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition"
            >
              Odrzuć z komentarzem
            </button>
          </div>
        </Card>
      )}

      {/* Approved - Can Schedule */}
      {item.status === "APPROVED" && canSchedule && (
        <Card className="space-y-3 border-l-4 border-l-green-500 bg-green-50">
          <h3 className="font-semibold text-gray-900">Treść zatwierdzona</h3>
          <p className="text-sm text-gray-700">Możesz teraz zaplanować publikację.</p>
          <button
            onClick={handleSchedule}
            disabled={isPending}
            className="w-full px-3 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            Zaplanuj publikację
          </button>
        </Card>
      )}

      {/* Draft/Generated - Can Send for Approval */}
      {(item.status === "DRAFT" || item.status === "GENERATED") && (isAuthor || userRole === "OWNER") && (
        <Card className="space-y-3">
          <h3 className="font-semibold text-gray-900">Akcje</h3>
          <button
            onClick={handleSendForApproval}
            disabled={isPending}
            className="w-full px-3 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            Wyślij do zatwierdzenia
          </button>
        </Card>
      )}

      {/* Rejected - Can Reset */}
      {item.status === "REJECTED" && (isAuthor || userRole === "OWNER") && (
        <Card className="space-y-3 border-l-4 border-l-red-500 bg-red-50">
          <h3 className="font-semibold text-gray-900">Treść odrzucona</h3>
          <p className="text-sm text-gray-700">
            Przejrzyj komentarze w historii i wprowadź poprawki.
          </p>
          <button
            onClick={handleResetToDraft}
            disabled={isPending}
            className="w-full px-3 py-2 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition"
          >
            Przywróć do szkicu
          </button>
        </Card>
      )}

      {/* Info Box */}
      <Card className="space-y-2 text-sm text-gray-600">
        <p className="font-semibold text-gray-900">Status procesu publikacji:</p>
        <ul className="space-y-1 list-disc list-inside">
          <li>Szkic → Wysyłka do zatwierdzenia</li>
          <li>Zatwierdzenie/Odrzucenie</li>
          <li>Zaplanowanie daty publikacji</li>
          <li>Publikacja na wskazanych stronach</li>
        </ul>
      </Card>
    </div>
  );
}
