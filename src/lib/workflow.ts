/**
 * Content workflow state machine
 * Defines allowed transitions between content statuses based on user roles
 */

export type ContentStatus = "DRAFT" | "GENERATED" | "AWAITING_APPROVAL" | "APPROVED" | "SCHEDULED" | "PUBLISHED" | "REJECTED";
type UserRole = "OWNER" | "APPROVER" | "EDITOR";

export interface WorkflowTransition {
  from: ContentStatus;
  to: ContentStatus;
  roles: UserRole[];
  requiresData?: string[]; // required fields in payload
  description: string;
}

export const WORKFLOW_TRANSITIONS: WorkflowTransition[] = [
  {
    from: "DRAFT",
    to: "AWAITING_APPROVAL",
    roles: ["EDITOR", "OWNER", "APPROVER"],
    description: "Wyślij do zatwierdzenia"
  },
  {
    from: "GENERATED",
    to: "AWAITING_APPROVAL",
    roles: ["EDITOR", "OWNER", "APPROVER"],
    description: "Wyślij do zatwierdzenia"
  },
  {
    from: "AWAITING_APPROVAL",
    to: "APPROVED",
    roles: ["APPROVER", "OWNER"],
    description: "Zatwierdź"
  },
  {
    from: "AWAITING_APPROVAL",
    to: "REJECTED",
    roles: ["APPROVER", "OWNER"],
    requiresData: ["comment"],
    description: "Odrzuć"
  },
  {
    from: "APPROVED",
    to: "SCHEDULED",
    roles: ["APPROVER", "OWNER"],
    requiresData: ["scheduledFor"],
    description: "Zaplanuj"
  },
  {
    from: "SCHEDULED",
    to: "PUBLISHED",
    roles: ["OWNER"],
    description: "Opublikuj"
  },
  {
    from: "REJECTED",
    to: "DRAFT",
    roles: ["OWNER", "EDITOR"],
    description: "Cofnij do szkicu"
  },
  {
    from: "REJECTED",
    to: "AWAITING_APPROVAL",
    roles: ["EDITOR", "OWNER"],
    description: "Wyślij do zatwierdzenia (po poprawce)"
  }
];

export function canTransition(
  currentStatus: ContentStatus,
  nextStatus: ContentStatus,
  userRole: UserRole,
  isAuthor: boolean = false
): { allowed: boolean; reason?: string } {
  // OWNER can do anything
  if (userRole === "OWNER") {
    return { allowed: true };
  }

  // Check if transition exists
  const transition = WORKFLOW_TRANSITIONS.find(
    (t) => t.from === currentStatus && t.to === nextStatus
  );

  if (!transition) {
    return {
      allowed: false,
      reason: "Ten etap wymaga zatwierdzenia i planowania."
    };
  }

  // Check if user role is allowed
  if (!transition.roles.includes(userRole)) {
    return {
      allowed: false,
      reason: `Musisz być ${transition.roles.join(" lub ")} do wykonania tej akcji.`
    };
  }

  return { allowed: true };
}

export function getAvailableTransitions(
  currentStatus: ContentStatus,
  userRole: UserRole,
  isAuthor: boolean = false
): WorkflowTransition[] {
  return WORKFLOW_TRANSITIONS.filter((t) => {
    const { allowed } = canTransition(currentStatus, t.to, userRole, isAuthor);
    return allowed;
  });
}

export function getStatusLabel(status: ContentStatus): string {
  const labels: Record<ContentStatus, string> = {
    DRAFT: "Szkic",
    GENERATED: "Wygenerowany",
    AWAITING_APPROVAL: "Do zatwierdzenia",
    APPROVED: "Zatwierdzony",
    SCHEDULED: "Zaplanowany",
    PUBLISHED: "Opublikowany",
    REJECTED: "Odrzucony"
  };
  return labels[status] ?? status;
}

export function getStatusColor(status: ContentStatus): string {
  const colors: Record<ContentStatus, string> = {
    DRAFT: "bg-gray-100 text-gray-700",
    GENERATED: "bg-blue-100 text-blue-700",
    AWAITING_APPROVAL: "bg-amber-100 text-amber-700",
    APPROVED: "bg-green-100 text-green-700",
    SCHEDULED: "bg-purple-100 text-purple-700",
    PUBLISHED: "bg-emerald-100 text-emerald-700",
    REJECTED: "bg-red-100 text-red-700"
  };
  return colors[status] ?? "bg-gray-100 text-gray-700";
}

export function getStatusIcon(status: ContentStatus): string {
  const icons: Record<ContentStatus, string> = {
    DRAFT: "✏️",
    GENERATED: "✨",
    AWAITING_APPROVAL: "🔍",
    APPROVED: "✅",
    SCHEDULED: "📅",
    PUBLISHED: "🚀",
    REJECTED: "❌"
  };
  return icons[status] ?? "•";
}

export const STATUS_GROUPS = {
  drafts: ["DRAFT", "GENERATED"],
  awaiting: ["AWAITING_APPROVAL"],
  approved: ["APPROVED"],
  scheduled: ["SCHEDULED"],
  published: ["PUBLISHED"],
  rejected: ["REJECTED"]
} as const;

export function getKanbanColumn(
  status: ContentStatus
): keyof typeof STATUS_GROUPS {
  for (const [key, statuses] of Object.entries(STATUS_GROUPS)) {
    if ((statuses as unknown as ContentStatus[]).includes(status)) {
      return key as keyof typeof STATUS_GROUPS;
    }
  }
  return "drafts";
}
