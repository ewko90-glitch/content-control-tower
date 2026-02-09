"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole, requireWorkspace } from "@/lib/guards";
import { domainSchema, manualLinksSchema } from "@/lib/validators";
import { encryptSecret } from "@/lib/encryption";
import { fetchSitemapUrls, testWordPressConnection } from "@/lib/wp";
import { logAudit } from "@/lib/audit";

export type DomainState = { success: boolean; message?: string };

export async function createDomain(_: DomainState, formData: FormData): Promise<DomainState> {
  const { user, workspaceId } = await requireRole("EDITOR");
  const parsed = domainSchema.safeParse({
    name: formData.get("name"),
    siteUrl: formData.get("siteUrl"),
    wpUsername: formData.get("wpUsername"),
    wpAppPassword: formData.get("wpAppPassword")
  });
  if (!parsed.success) {
    return { success: false, message: "Nieprawidłowe dane domeny." };
  }
  const encrypted = encryptSecret(parsed.data.wpAppPassword);
  const domain = await prisma.domain.create({
    data: {
      workspaceId,
      name: parsed.data.name,
      siteUrl: parsed.data.siteUrl,
      wpUsername: parsed.data.wpUsername,
      wpAppPasswordEnc: encrypted.ciphertext,
      wpAppPasswordIv: encrypted.iv,
      wpAppPasswordTag: encrypted.tag
    }
  });
  await logAudit({
    actorUserId: user.id,
    workspaceId,
    entityType: "Domain",
    entityId: domain.id,
    action: "create",
    after: { name: domain.name, siteUrl: domain.siteUrl }
  });
  revalidatePath("/domains");
  return { success: true };
}

export async function testDomainConnection(domainId: string) {
  const { workspaceId } = await requireWorkspace();
  const domain = await prisma.domain.findFirst({ where: { id: domainId, workspaceId } });
  if (!domain) {
    throw new Error("Domain not found");
  }
  await testWordPressConnection({
    siteUrl: domain.siteUrl,
    username: domain.wpUsername,
    appPassword: {
      ciphertext: domain.wpAppPasswordEnc,
      iv: domain.wpAppPasswordIv,
      tag: domain.wpAppPasswordTag
    }
  });
}

export async function fetchDomainSitemap(domainId: string): Promise<DomainState> {
  const { user, workspaceId } = await requireRole("EDITOR");
  const domain = await prisma.domain.findFirst({ where: { id: domainId, workspaceId } });
  if (!domain) {
    return { success: false, message: "Nie znaleziono domeny." };
  }
  try {
    const urls = await fetchSitemapUrls(domain.siteUrl);
    await prisma.internalLink.createMany({
      data: urls.map((url) => ({ workspaceId, domainId, url })),
      skipDuplicates: true
    });
    await prisma.domain.update({
      where: { id: domain.id },
      data: { lastSitemapFetchAt: new Date() }
    });
    await logAudit({
      actorUserId: user.id,
      workspaceId,
      entityType: "Domain",
      entityId: domain.id,
      action: "update",
      after: { sitemapCount: urls.length }
    });
    revalidatePath("/domains");
    return { success: true };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}

export async function addManualLinks(domainId: string, _: DomainState, formData: FormData): Promise<DomainState> {
  const { user, workspaceId } = await requireRole("EDITOR");
  const parsed = manualLinksSchema.safeParse({ urls: formData.get("urls") });
  if (!parsed.success) {
    return { success: false, message: "Podaj listę URL." };
  }
  const urls = parsed.data.urls
    .split("\n")
    .map((url) => url.trim())
    .filter(Boolean);
  await prisma.internalLink.createMany({
    data: urls.map((url) => ({ workspaceId, domainId, url })),
    skipDuplicates: true
  });
  await logAudit({
    actorUserId: user.id,
    workspaceId,
    entityType: "InternalLink",
    entityId: domainId,
    action: "create",
    after: { count: urls.length }
  });
  revalidatePath("/domains");
  return { success: true };
}
