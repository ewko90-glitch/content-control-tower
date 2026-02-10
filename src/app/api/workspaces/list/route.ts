import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const memberships = await prisma.membership.findMany({
      where: { userId: session.user.id },
      include: { workspace: true },
      orderBy: { createdAt: "desc" }
    });

    return NextResponse.json({ memberships });
  } catch (error) {
    console.error("GET /api/workspaces/list error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
