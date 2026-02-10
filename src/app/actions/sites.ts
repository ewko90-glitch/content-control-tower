"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { requireRole } from "@/lib/guards";
import { logAudit } from "@/lib/audit";
import { notify } from "@/lib/notifications";

export type SiteState = { success: boolean; message?: string };

// Validators
function isValidUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function parseSiteFormData(formData: FormData): {
  name: string;
  type: "WORDPRESS" | "SHOPIFY" | "OTHER";
  baseUrl: string;
  status: "ACTIVE" | "INACTIVE";
  notes: string | null;
  wpAdminUrl: string | null;
  wpUsername: string | null;
  shopifyShopDomain: string | null;
} {
  return {
    name: String(formData.get("name") || "").trim(),
    type: (formData.get("type") || "OTHER") as "WORDPRESS" | "SHOPIFY" | "OTHER",
    baseUrl: String(formData.get("baseUrl") || "").trim(),
    status: (formData.get("status") || "ACTIVE") as "ACTIVE" | "INACTIVE",
    notes: formData.get("notes") ? String(formData.get("notes")).trim() : null,
    wpAdminUrl: formData.get("wpAdminUrl") ? String(formData.get("wpAdminUrl")).trim() : null,
    wpUsername: formData.get("wpUsername") ? String(formData.get("wpUsername")).trim() : null,
    shopifyShopDomain: formData.get("shopifyShopDomain") ? String(formData.get("shopifyShopDomain")).trim() : null
  };
}

export async function addSite(_: SiteState, formData: FormData): Promise<SiteState> {
  const { user, workspaceId } = await requireRole("OWNER");

  const parsed = parseSiteFormData(formData);

  // Validation
  if (!parsed.name || parsed.name.length < 1) {
    return { success: false, message: "Nazwa strony jest wymagana." };
  }

  if (!parsed.baseUrl || !isValidUrl(parsed.baseUrl)) {
    return { success: false, message: "Adres strony musi być poprawnym URL." };
  }

  // Check duplicate name
  const existing = await prisma.site.findFirst({
    where: { workspaceId, name: parsed.name }
  });
  if (existing) {
    return { success: false, message: "Strona o tej nazwie już istnieje w tym workspace." };
  }

  // Create site
  const site = await prisma.site.create({
    data: {
      workspaceId,
      name: parsed.name,
      type: parsed.type,
      baseUrl: parsed.baseUrl,
      status: parsed.status,
      notes: parsed.notes,
      wpAdminUrl: parsed.wpAdminUrl,
      wpUsername: parsed.wpUsername,
      shopifyShopDomain: parsed.shopifyShopDomain
    }
  });

  // Log audit
  await logAudit({
    actorUserId: user.id,
    workspaceId,
    entityType: "Site",
    entityId: site.id,
    action: "create",
    after: {
      name: site.name,
      type: site.type,
      baseUrl: site.baseUrl,
      status: site.status
    }
  });

  // Send notification
  await notify({
    workspaceId,
    userId: user.id,
    message: `Strona "${site.name}" została dodana.`
  });

  // Revalidate pages
  revalidatePath("/sites", "layout");
  revalidatePath("/overview", "layout");

  return { success: true, message: "Strona została dodana." };
}

export async function editSite(siteId: string, _: SiteState, formData: FormData): Promise<SiteState> {
  const { user, workspaceId } = await requireRole("OWNER");

  // Verify site exists and belongs to workspace
  const site = await prisma.site.findFirst({
    where: { id: siteId, workspaceId }
  });
  if (!site) {
    return { success: false, message: "Strona nie znaleziona." };
  }

  const parsed = parseSiteFormData(formData);

  // Validation
  if (!parsed.name || parsed.name.length < 1) {
    return { success: false, message: "Nazwa strony jest wymagana." };
  }

  if (!parsed.baseUrl || !isValidUrl(parsed.baseUrl)) {
    return { success: false, message: "Adres strony musi być poprawnym URL." };
  }

  // Check duplicate name (excluding current site)
  if (parsed.name !== site.name) {
    const existingName = await prisma.site.findFirst({
      where: { workspaceId, name: parsed.name }
    });
    if (existingName) {
      return { success: false, message: "Strona o tej nazwie już istnieje w tym workspace." };
    }
  }

  // Update site
  const updated = await prisma.site.update({
    where: { id: siteId },
    data: {
      name: parsed.name,
      type: parsed.type,
      baseUrl: parsed.baseUrl,
      status: parsed.status,
      notes: parsed.notes,
      wpAdminUrl: parsed.wpAdminUrl,
      wpUsername: parsed.wpUsername,
      shopifyShopDomain: parsed.shopifyShopDomain
    }
  });

  // Log audit
  await logAudit({
    actorUserId: user.id,
    workspaceId,
    entityType: "Site",
    entityId: site.id,
    action: "update",
    before: {
      name: site.name,
      type: site.type,
      baseUrl: site.baseUrl,
      status: site.status
    },
    after: {
      name: updated.name,
      type: updated.type,
      baseUrl: updated.baseUrl,
      status: updated.status
    }
  });

  // Send notification
  await notify({
    workspaceId,
    userId: user.id,
    message: `Strona "${updated.name}" została zaktualizowana.`
  });

  // Revalidate pages
  revalidatePath("/sites", "layout");
  revalidatePath("/overview", "layout");

  return { success: true, message: "Strona została zaktualizowana." };
}

export async function removeSite(siteId: string): Promise<SiteState> {
  const { user, workspaceId } = await requireRole("OWNER");

  // Verify site exists and belongs to workspace
  const site = await prisma.site.findFirst({
    where: { id: siteId, workspaceId }
  });
  if (!site) {
    return { success: false, message: "Strona nie znaleziona." };
  }

  // Delete site
  await prisma.site.delete({
    where: { id: siteId }
  });

  // Log audit
  await logAudit({
    actorUserId: user.id,
    workspaceId,
    entityType: "Site",
    entityId: siteId,
    action: "delete",
    before: {
      name: site.name,
      type: site.type,
      baseUrl: site.baseUrl,
      status: site.status
    }
  });

  // Send notification
  await notify({
    workspaceId,
    userId: user.id,
    message: `Strona "${site.name}" została usunięta.`
  });

  // Revalidate pages
  revalidatePath("/sites", "layout");
  revalidatePath("/overview", "layout");

  return { success: true, message: "Strona została usunięta." };
}

// Wrapper functions for direct form actions
export async function addSiteAction(formData: FormData): Promise<void> {
  await addSite({ success: false }, formData);
}

export async function editSiteAction(siteId: string, formData: FormData): Promise<void> {
  await editSite(siteId, { success: false }, formData);
}
