import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireWorkspace } from "@/lib/guards";
import { logAudit } from "@/lib/audit";

interface RouteParams {
  id: string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: RouteParams }
) {
  try {
    const { user, workspaceId, membership } = await requireWorkspace();
    const { assignedToId } = await request.json();

    // Only OWNER and APPROVER can assign
    if (!["OWNER", "APPROVER"].includes(membership.role || "")) {
      return NextResponse.json(
        { error: "Brak uprawnień" },
        { status: 403 }
      );
    }

    // Verify content exists and is in workspace
    const item = await prisma.contentItem.findFirst({
      where: { id: params.id, workspaceId }
    });

    if (!item) {
      return NextResponse.json(
        { error: "Nie znaleziono treści" },
        { status: 404 }
      );
    }

    // Update assignment using type assertion to bypass Prisma typing issues
    const oldAssignedToId = (item as any).assignedToId;
    const updated = await (prisma as any).contentItem.update({
      where: { id: params.id },
      data: { assignedToId }
    });

    // Log assignment change
    await logAudit({
      actorUserId: user.id,
      workspaceId,
      entityType: "ContentItem",
      entityId: item.id,
      action: "assignment",
      before: { assignedToId: oldAssignedToId },
      after: { assignedToId: updated.assignedToId }
    });

    return NextResponse.json({ success: true, item: updated });
  } catch (error) {
    console.error("Assignment error:", error);
    return NextResponse.json(
      { error: "Błąd na serwerze" },
      { status: 500 }
    );
  }
}
