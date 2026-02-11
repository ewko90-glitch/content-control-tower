import { AuditLog } from "@prisma/client";

interface AuditLogWithActor extends AuditLog {
  actor?: { name: string | null; email: string } | null;
}

interface ContentAuditHistoryProps {
  logs: AuditLogWithActor[];
}

export function ContentAuditHistory({ logs }: ContentAuditHistoryProps) {
  if (logs.length === 0) {
    return (
      <div className="text-sm text-gray-500 text-center py-4">
        Brak wpisów w historii.
      </div>
    );
  }

  const getActionLabel = (action: string): string => {
    const labels: Record<string, string> = {
      create: "Utworzono treść",
      status_change: "Zmieniono status",
      approve: "Zatwierdzona",
      reject: "Odrzucona",
      schedule: "Zaplanowana",
      publish_attempt: "Próba publikacji",
      generate: "Wygenerowana"
    };
    return labels[action] || action;
  };

  return (
    <div className="space-y-3">
      {logs.map((log, idx) => (
        <div key={log.id} className="text-sm">
          {idx > 0 && <div className="border-t border-gray-200 my-3" />}
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <span className="text-xs text-gray-600 font-medium">{idx + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900">
                {getActionLabel(log.action)}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {log.actor?.name || log.actor?.email || "System"}
              </p>
              {log.after && typeof log.after === "object" && (() => {
                const after = log.after as Record<string, unknown> | null;
                const comment = after && typeof after.comment === "string" ? after.comment : null;
                return comment ? (
                  <p className="text-xs text-gray-700 mt-1 bg-gray-50 p-2 rounded border-l-2 border-l-gray-300">
                    {comment}
                  </p>
                ) : null;
              })()}
              <p className="text-xs text-gray-400 mt-1">
                {new Date(log.createdAt).toLocaleString("pl-PL")}
              </p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
