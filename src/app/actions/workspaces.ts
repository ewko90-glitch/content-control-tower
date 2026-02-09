"use server";

import { cookies } from "next/headers";
import { prisma } from "@/lib/db";
import { requireAuth, requireRole } from "@/lib/guards";
import { workspaceSchema, inviteSchema } from "@/lib/validators";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

export type WorkspaceState = { success: boolean; message?: string };

export async function createWorkspace(_: WorkspaceState, formData: FormData): Promise<WorkspaceState> {
  const user = await requireAuth();
  const parsed = workspaceSchema.safeParse({
    name: formData.get("name")
  });
  if (!parsed.success) {
    return { success: false, message: "Nieprawidłowa nazwa workspace." };
  }
  const workspace = await prisma.workspace.create({
    data: {
      name: parsed.data.name,
      memberships: {
        create: {
          userId: user.id,
          role: "OWNER"
        }
      }
    }
  });
  cookies().set("workspaceId", workspace.id, { httpOnly: true, sameSite: "lax" });
  await logAudit({
    actorUserId: user.id,
    workspaceId: workspace.id,
    entityType: "Workspace",
    entityId: workspace.id,
    action: "create",
    after: { name: workspace.name }
  });
  await notify({
    workspaceId: workspace.id,
    userId: user.id,
    message: `Workspace ${workspace.name} utworzony.`
  });
  return { success: true };
}

export async function switchWorkspace(workspaceId: string) {
  const user = await requireAuth();
  const membership = await prisma.membership.findUnique({
    where: {
      userId_workspaceId: {
        userId: user.id,
        workspaceId
      }
    }
  });
  if (!membership) {
    throw new Error("Brak dostępu do workspace.");
  }
  cookies().set("workspaceId", workspaceId, { httpOnly: true, sameSite: "lax" });
}

export async function inviteUser(_: WorkspaceState, formData: FormData): Promise<WorkspaceState> {
  const { user, workspaceId } = await requireRole("OWNER");
  const parsed = inviteSchema.safeParse({
    email: formData.get("email"),
    role: formData.get("role")
  });
  if (!parsed.success) {
    return { success: false, message: "Nieprawidłowe dane zaproszenia." };
  }
  const invited = await prisma.user.findUnique({ where: { email: parsed.data.email } });
  if (!invited) {
    return { success: false, message: "Użytkownik nie istnieje. Zaproszenia email wkrótce." };
  }
  await prisma.membership.upsert({
    where: {
      userId_workspaceId: {
        userId: invited.id,
        workspaceId
      }
    },
    update: { role: parsed.data.role },
    create: { userId: invited.id, workspaceId, role: parsed.data.role }
  });
  await logAudit({
    actorUserId: user.id,
    workspaceId,
    entityType: "Membership",
    entityId: invited.id,
    action: "create",
    after: { role: parsed.data.role }
  });
  await notify({
    workspaceId,
    userId: invited.id,
    message: `Dodano Cię do workspace jako ${parsed.data.role}.`
  });
  return { success: true };
}
