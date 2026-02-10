"use client";

import { useState, useTransition } from "react";
import { Card } from "@/components/ui/card";

interface TeamMember {
  id: string;
  name: string;
  email: string;
}

interface AssignmentWidgetProps {
  contentId: string;
  currentAssignment: { id: string; name: string; email: string } | null;
  teamMembers: TeamMember[];
  userRole: "OWNER" | "APPROVER" | "EDITOR";
}

export function AssignmentWidget({
  contentId,
  currentAssignment,
  teamMembers,
  userRole
}: AssignmentWidgetProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  const canAssign = userRole === "OWNER" || userRole === "APPROVER";

  const handleAssign = async (userId: string | null) => {
    if (!canAssign) return;

    startTransition(async () => {
      try {
        const response = await fetch(`/api/content/${contentId}/assign`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ assignedToId: userId })
        });

        if (!response.ok) {
          throw new Error("Błąd przy przydzielaniu");
        }

        setIsOpen(false);
        // Refresh page to show updated assignment
        window.location.reload();
      } catch (error) {
        alert((error as Error).message || "Błąd");
      }
    });
  };

  return (
    <Card className="space-y-3">
      <div>
        <h3 className="font-semibold text-gray-900 text-sm">Przydzielone do</h3>
        {currentAssignment ? (
          <p className="text-sm text-gray-700 mt-1">
            {currentAssignment.name}
          </p>
        ) : (
          <p className="text-sm text-gray-500 mt-1">Nie przydzielone</p>
        )}
      </div>

      {canAssign && (
        <div className="relative">
          <button
            onClick={() => setIsOpen(!isOpen)}
            disabled={isPending}
            className="w-full px-3 py-2 rounded-md bg-gray-200 text-gray-900 text-sm font-medium hover:bg-gray-300 disabled:opacity-50 transition"
          >
            {isPending ? "Przydzielam..." : "Zmień przydzielenie"}
          </button>

          {isOpen && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-md shadow-lg z-10">
              <button
                onClick={() => handleAssign(null)}
                disabled={isPending}
                className="w-full text-left px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 disabled:opacity-50"
              >
                Brak przydzielenia
              </button>
              {teamMembers.map((member) => (
                <button
                  key={member.id}
                  onClick={() => handleAssign(member.id)}
                  disabled={isPending}
                  className={`w-full text-left px-3 py-2 text-sm disabled:opacity-50 ${
                    currentAssignment?.id === member.id
                      ? "bg-blue-50 text-blue-700"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {member.name}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
