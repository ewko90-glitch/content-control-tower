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
