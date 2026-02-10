import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { z } from "zod";

const bodySchema = z.object({
  workspaceId: z.string().min(1, "workspaceId is required")
});

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const parsed = bodySchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { workspaceId } = parsed.data;
    const userId = session.user.id;

    // Verify user has membership in this workspace
    const membership = await prisma.membership.findUnique({
      where: {
        userId_workspaceId: {
          userId,
          workspaceId
        }
      }
    });

    if (!membership) {
      return NextResponse.json({ error: "Access denied to this workspace" }, { status: 403 });
    }

    // Set the httpOnly cookie
    const response = NextResponse.json({ success: true, workspaceId });
    response.cookies.set("workspaceId", workspaceId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/"
    });

    return response;
  } catch (error) {
    console.error("POST /api/workspaces/active error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
