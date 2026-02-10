import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(8)
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const workspaceSchema = z.object({
  name: z.string().min(2)
});

export const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["OWNER", "EDITOR", "APPROVER"])
});

// Simple domain schema for basic CRUD (name, slug, description)
export const createDomainSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9_-]+$/, "Identyfikator może zawierać tylko małe litery, cyfry, myślniki i podkreślenia"),
  description: z.string().max(500).optional()
});

export const updateDomainSchema = createDomainSchema;

// Legacy WordPress domain schema (kept for backward compatibility with existing WP features)
export const domainSchema = z.object({
  name: z.string().min(2),
  siteUrl: z.string().url(),
  wpUsername: z.string().min(2),
  wpAppPassword: z.string().min(8)
});

export const contentDraftSchema = z.object({
  topic: z.string().min(3),
  mainKeyword: z.string().min(2),
  domainId: z.string().optional(),
  type: z.enum(["WP_POST", "LINKEDIN_POST"])
});

export const manualLinksSchema = z.object({
  urls: z.string().min(1)
});

export const scheduleSchema = z.object({
  scheduledFor: z.string().min(1)
});
