import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { env } from "@/lib/env";
import { z } from "zod";

const credentialsSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const authOptions: NextAuthOptions = {
  secret: env.nextAuthSecret,
  session: {
    strategy: "jwt"
  },
  pages: {
    signIn: "/login"
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // DEV-ONLY: allow logging in as owner@demo.local without password when not in production
        // TODO: remove this bypass or secure it for non-dev environments
        if (process.env.NODE_ENV !== "production" && credentials?.email === "owner@demo.local") {
          const devUser = await prisma.user.findUnique({ where: { email: "owner@demo.local" } });
          if (devUser) {
            return { id: devUser.id, email: devUser.email, name: devUser.name ?? undefined };
          }
        }

        const parsed = credentialsSchema.safeParse(credentials);
        if (!parsed.success) {
          return null;
        }
        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email }
        });
        if (!user) {
          return null;
        }
        const isValid = await verifyPassword(parsed.data.password, user.passwordHash);
        if (!isValid) {
          return null;
        }
        return { id: user.id, email: user.email, name: user.name ?? undefined };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      // On sign-in, enrich token with user info from DB (role, workspaceId)
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        try {
          const membership = await prisma.membership.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" }
          });
          if (membership) {
            token.role = membership.role;
            token.workspaceId = membership.workspaceId;
          }
        } catch (e) {
          // swallow DB errors in JWT callback
          console.error("jwt callback membership lookup failed", e);
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub) {
        session.user.id = token.sub as string;
      }
      if (token.email) {
        session.user.email = token.email as string;
      }
      // attach role and workspaceId for convenience in server code
      const role = typeof token.role === 'string' ? token.role : undefined;
      const workspaceId = typeof token.workspaceId === 'string' ? token.workspaceId : undefined;
      (session.user as { role?: string; workspaceId?: string }).role = role ?? (session.user as { role?: string; workspaceId?: string }).role;
      (session.user as { role?: string; workspaceId?: string }).workspaceId = workspaceId ?? (session.user as { role?: string; workspaceId?: string }).workspaceId;
      return session;
    }
  }
};
