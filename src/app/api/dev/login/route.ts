import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { env } from "@/lib/env";
import { encode } from "next-auth/jwt";

export async function GET() {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const user = await prisma.user.findUnique({ where: { email: "owner@demo.local" } });
  if (!user) {
    return NextResponse.json({ error: "Dev user not found" }, { status: 404 });
  }

  const membership = await prisma.membership.findFirst({ where: { userId: user.id }, orderBy: { createdAt: "desc" } });

  const token = {
    sub: user.id,
    email: user.email,
    name: user.name ?? undefined,
    role: membership?.role,
    workspaceId: membership?.workspaceId,
    iat: Math.floor(Date.now() / 1000)
  } as Record<string, unknown>;

  const encoded = await encode({ token, secret: env.nextAuthSecret, maxAge: 60 * 60 * 24 * 30 });

  const cookie = `next-auth.session-token=${encoded}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${60 * 60 * 24 * 30}`;

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Set-Cookie": cookie,
      "Content-Type": "application/json"
    }
  });
}
