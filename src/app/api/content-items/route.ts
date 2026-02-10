import { NextResponse, type NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import type { ContentType, ContentStatus } from "@prisma/client";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const workspaceId = (session.user as { workspaceId?: string }).workspaceId;
    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId missing on session" }, { status: 401 });
    }
    const items = await prisma.contentItem.findMany({
      where: { workspaceId },
      include: {
        versions: { take: 1, orderBy: { createdAt: "desc" } },
        createdBy: { select: { id: true, email: true, name: true } },
        approvedBy: { select: { id: true, email: true, name: true } },
        domain: { select: { id: true, name: true, siteUrl: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });

    return NextResponse.json(items);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const workspaceId = (session.user as { workspaceId?: string }).workspaceId;
    if (!workspaceId) {
      return NextResponse.json({ error: "workspaceId missing on session" }, { status: 401 });
    }


    const body = await req.json();
    const { domainId, type, topic, mainKeyword, createdById, status } = body as { domainId?: string; type: string; topic: string; mainKeyword: string; createdById?: string; status?: string };
    const resolvedCreatedById = createdById ?? (session.user as { id?: string }).id;
    if (!type || !topic || !mainKeyword || !resolvedCreatedById) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const item = await prisma.contentItem.create({
      data: {
        workspaceId,
        domainId: domainId ?? null,
        type: type as ContentType,
        status: (status ?? "DRAFT") as ContentStatus,
        topic,
        mainKeyword,
        createdById: resolvedCreatedById,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, workspaceId, status, approvedById, scheduledFor } = body;
    if (!id || !workspaceId || !status) {
      return NextResponse.json({ error: "Missing required fields (id, workspaceId, status)" }, { status: 400 });
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
