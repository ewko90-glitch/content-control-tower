import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { Role } from "@prisma/client";

const ROLE_ORDER: Record<Role, number> = {
  OWNER: 3,
  APPROVER: 2,
  EDITOR: 1
};

export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user;
}

export function getActiveWorkspaceId(): string | null {
  return cookies().get("workspaceId")?.value ?? null;
}

export async function requireWorkspace() {
  const user = await requireAuth();
  const workspaceId = getActiveWorkspaceId();
  if (!workspaceId) {
    redirect("/workspaces");
  }
  const membership = await prisma.membership.findUnique({
    where: {
      userId_workspaceId: {
        userId: user.id,
        workspaceId
      }
    }
  });
  if (!membership) {
    redirect("/workspaces");
  }
  return { user, membership, workspaceId };
}

export async function requireRole(required: Role) {
  const { user, membership, workspaceId } = await requireWorkspace();
  if (ROLE_ORDER[membership.role] < ROLE_ORDER[required]) {
    redirect("/workspaces");
  }
  return { user, membership, workspaceId };
}
