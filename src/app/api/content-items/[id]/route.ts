import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const workspaceId = (session.user as any).workspaceId;
    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId missing on session" }, { status: 401 });
    }

    const id = params.id;
    if (!id) {
      return NextResponse.json({ error: "Missing id param" }, { status: 400 });
    }

    const body = await req.json();
    const { status, approvedById, scheduledFor } = body;
    if (!status) {
      return NextResponse.json({ error: "Missing status in body" }, { status: 400 });
    }

    const updated = await prisma.contentItem.updateMany({
      where: { id, workspaceId },
      data: {
        status,
        approvedById: approvedById ?? undefined,
        scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      },
    });

    if (updated.count === 0) {
      return NextResponse.json({ error: "ContentItem not found" }, { status: 404 });
    }

    const item = await prisma.contentItem.findUnique({ where: { id } });
    return NextResponse.json(item);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
