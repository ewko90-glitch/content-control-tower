import { prisma } from "@/lib/db";

export async function notify(params: {
  workspaceId: string;
  userId: string;
  message: string;
}) {
  return prisma.notification.create({
    data: {
      workspaceId: params.workspaceId,
      userId: params.userId,
      message: params.message
    }
  });
}
