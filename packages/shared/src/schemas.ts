import { z } from "zod";
import {
  DISCIPLINES,
  ALL_CITIES,
  LOCALES,
  WORK_TYPES,
  WORK_STATUSES,
  OPPORTUNITY_STATUSES,
  EVENT_STATUSES,
} from "./enums.js";

export const localeSchema = z.enum(LOCALES);
export const disciplineSchema = z.enum(DISCIPLINES);
export const citySchema = z.enum(ALL_CITIES);

export const joinWaitlistSchema = z.object({
  email: z.string().email(),
  disciplines: z.array(disciplineSchema).min(1),
  locale: localeSchema.default("en"),
  referralCode: z.string().max(64).optional(),
  displayName: z.string().min(1).max(120).optional(),
});

export const handleSchema = z
  .string()
  .min(3)
  .max(30)
  .regex(/^[a-z0-9_]+$/);

export const signUpSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
  displayName: z.string().min(1).max(120),
  handle: handleSchema,
  locale: localeSchema.default("en"),
  acceptTerms: z.literal(true),
});

export const signInSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export const magicLinkSchema = z.object({
  email: z.string().email(),
});

export const claimProfileSchema = z.object({
  token: z.string().min(16),
  email: z.string().email(),
  password: z.string().min(8).max(128),
  acceptTerms: z.literal(true),
});

export const updateProfileSchema = z.object({
  displayName: z.string().min(1).max(120).optional(),
  bioShort: z.string().max(280).optional(),
  bioLong: z.string().max(5000).optional(),
  city: citySchema.optional(),
  country: z.string().max(80).optional(),
  websiteUrl: z.string().url().optional().or(z.literal("")),
  instagramUrl: z.string().url().optional().or(z.literal("")),
  availability: z.string().max(200).optional(),
  disciplineSlugs: z.array(disciplineSchema).optional(),
});

export const createWorkSchema = z.object({
  title: z.string().min(1).max(200),
  type: z.enum(WORK_TYPES),
  description: z.string().max(5000).optional(),
  primaryDiscipline: disciplineSchema.optional(),
  externalUrl: z.string().url().optional(),
  embedUrl: z.string().url().optional(),
  status: z.enum(WORK_STATUSES).default("draft"),
});

export const createOpportunitySchema = z.object({
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(5000),
  roles: z.string().max(500).optional(),
  discipline: disciplineSchema.optional(),
  location: z.string().max(120).optional(),
  remoteMode: z.enum(["onsite", "remote", "hybrid"]).optional(),
  compensationStatus: z.enum(["paid", "unpaid", "negotiable", "tbd"]).optional(),
  deadline: z.string().datetime().optional(),
  imageUrl: z.string().url().optional(),
  status: z.enum(OPPORTUNITY_STATUSES).default("open"),
});

export const createEventSchema = z.object({
  name: z.string().min(1).max(200),
  description: z.string().max(5000).optional(),
  startsAt: z.string().datetime(),
  endsAt: z.string().datetime().optional(),
  venue: z.string().max(200).optional(),
  city: citySchema.optional(),
  category: z.string().max(80).optional(),
  externalUrl: z.string().url().optional(),
  imageUrl: z.string().url().optional(),
  capacity: z.number().int().positive().optional(),
  status: z.enum(EVENT_STATUSES).default("published"),
  isHubNight: z.boolean().optional(),
});

export const contactSchema = z.object({
  toProfileId: z.string().uuid(),
  subject: z.string().min(1).max(200),
  message: z.string().min(1).max(2000),
});

export const reportSchema = z.object({
  entityType: z.enum(["profile", "work", "opportunity", "event", "user"]),
  entityId: z.string().uuid(),
  reason: z.string().min(1).max(500),
  details: z.string().max(2000).optional(),
});

export type JoinWaitlistInput = z.infer<typeof joinWaitlistSchema>;
export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ClaimProfileInput = z.infer<typeof claimProfileSchema>;
