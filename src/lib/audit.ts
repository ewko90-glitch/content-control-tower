import { prisma } from "@/lib/db";

export type AuditAction =
  | "create"
  | "update"
  | "delete"
  | "status_change"
  | "approve"
  | "reject"
  | "schedule"
  | "publish_attempt"
  | "assignment";

export async function logAudit(params: {
  actorUserId: string;
  workspaceId: string;
  entityType: string;
  entityId: string;
  action: AuditAction;
  before?: unknown;
  after?: unknown;
}) {
  return prisma.auditLog.create({
    data: {
      actorUserId: params.actorUserId,
      workspaceId: params.workspaceId,
      entityType: params.entityType,
      entityId: params.entityId,
      action: params.action,
      before: params.before ?? undefined,
      after: params.after ?? undefined
    }
  });
}
