/**
 * Deterministic staging-seed fixture types.
 * Fixtures under apps/api/data/seed/ are the identity source of truth.
 * Do not invent Prisma fields here — map only to existing models.
 */
import type {
  CitySlug,
  DisciplineSlug,
  EventStatus,
  NotificationType,
  OpportunityStatus,
  WorkType,
} from "@creative-hub/shared";

export type SeedClaimStatus = "unclaimed" | "pending" | "claimed";
export type SeedWorkStatus = "draft" | "published" | "archived" | "hidden";
export type SeedRemoteMode = "onsite" | "remote" | "hybrid";
export type SeedCompensation = "paid" | "unpaid" | "negotiable" | "tbd";
export type SeedReportEntity = "profile" | "work" | "opportunity" | "event" | "user";
export type SeedReportStatus = "open" | "resolved" | "dismissed";
export type SeedUserStatus = "active" | "suspended" | "deleted";
export type SeedEditorialEntity = "profile" | "work" | "opportunity" | "event" | "collection";
export type SeedMediaMode = "sample" | "picsum" | "url";

export type BehavioralPersonaId =
  | "photo_explorer"
  | "music_explorer"
  | "cross_discipline_collaborator"
  | "hub_night_regular"
  | "lurker";

/** Creator / founding-artist profile (+ optional User when claimed/pending). */
export interface SeedCreatorFixture {
  handle: string;
  displayName: string;
  bioShort: string;
  bioLong?: string;
  /** Must be a WORLD_CITIES slug. */
  city: CitySlug;
  country?: string;
  disciplineSlugs: DisciplineSlug[];
  claimStatus: SeedClaimStatus;
  availability?: string;
  websiteUrl?: string;
  instagramUrl?: string;
  isFounding?: boolean;
  locale?: string;
  /** Higher = more followers in the persona-driven follow graph. */
  sceneWeight?: number;
  /** Stable work slugs owned by this creator (see works.json). */
  workSlugs: string[];
  /** Demo member password override; default SEED_MEMBER_PASSWORD / env. */
  password?: string;
  userStatus?: SeedUserStatus;
}

/** Lightweight claimed audience member — ordinary User+Profile, not a new model. */
export interface SeedExplorerFixture {
  handle: string;
  displayName: string;
  bioShort?: string;
  bioLong?: string;
  city: CitySlug;
  country?: string;
  persona: BehavioralPersonaId;
  locale?: string;
  /** Optional 0–1 work slugs. */
  workSlugs?: string[];
  disciplineSlugs?: DisciplineSlug[];
  password?: string;
  userStatus?: SeedUserStatus;
}

export interface SeedWorkFixture {
  slug: string;
  creatorHandle: string;
  title: string;
  type: WorkType;
  description?: string;
  /** Writing body stored in Work.description when type=text. */
  body?: string;
  primaryDiscipline: DisciplineSlug;
  status?: SeedWorkStatus;
  viewCount?: number;
  externalUrl?: string;
  mediaMode?: SeedMediaMode;
  mediaUrl?: string;
  mediaMime?: string;
  aiGenerated?: boolean;
}

/** Sidecar only — never written to Prisma Work rows. */
export interface SeedWorkMeta {
  slug: string;
  discipline: DisciplineSlug;
  genre: string[];
  mood: string[];
  themes: string[];
  style: string;
  language: string;
  city: CitySlug;
}

export interface SeedOpportunityFixture {
  slug: string;
  /** Claimed creator handle that owns the opportunity. */
  creatorHandle: string;
  title: string;
  description: string;
  roles?: string;
  discipline?: DisciplineSlug | string;
  location?: string;
  remoteMode?: SeedRemoteMode;
  compensationStatus?: SeedCompensation;
  status?: OpportunityStatus;
  /** Days from SEED_EPOCH; null = no deadline. */
  deadlineDaysFromEpoch?: number | null;
}

export interface SeedInterestFixture {
  /** Stable key for idempotent reconciliation. */
  key: string;
  opportunitySlug: string;
  /** Explorer or creator handle of the interested user. */
  fromHandle: string;
  message?: string;
}

export interface SeedEventFixture {
  slug: string;
  name: string;
  description?: string;
  venue?: string;
  city?: CitySlug | string;
  category?: string;
  isHubNight?: boolean;
  externalUrl?: string;
  /** Organizer must be a claimed user handle (or "admin"). */
  organizerHandle: string;
  /** Days relative to SEED_EPOCH (negative = past). */
  daysFromEpoch: number;
  durationHours?: number;
  status?: EventStatus;
  capacity?: number;
}

export interface SeedContactFixture {
  key: string;
  fromHandle: string;
  toHandle: string;
  subject: string;
  message: string;
}

export interface SeedReportFixture {
  key: string;
  reporterHandle: string;
  entityType: SeedReportEntity;
  /** Handle, work slug, opportunity slug, event slug, or user handle depending on type. */
  entityRef: string;
  reason: string;
  details?: string;
  status: SeedReportStatus;
  /** Resolver handle when resolved/dismissed (usually admin). */
  resolvedByHandle?: string;
}

export interface SeedWaitlistFixture {
  email: string;
  displayName?: string;
  disciplines?: string[];
  locale?: string;
  referralCode?: string;
}

export interface SeedClaimTokenFixture {
  /** Raw token string (hashed before storage). */
  token: string;
  profileHandle: string;
  /** Days from SEED_EPOCH until expiry (not Date.now). */
  expiresDaysFromEpoch: number;
  used?: boolean;
}

export interface SeedEditorialFixture {
  entityType: SeedEditorialEntity;
  /** Handle or work/opportunity/event slug. */
  entityRef: string;
  placement: string;
  sortOrder: number;
}

export interface SeedNotificationFixture {
  key: string;
  userHandle: string;
  type: NotificationType;
  title: string;
  body?: string;
  payload?: Record<string, unknown>;
  /** If true, mark read at SEED_EPOCH. */
  read?: boolean;
}

export interface SeedAuditFixture {
  key: string;
  actorHandle?: string;
  action: string;
  target?: string;
  metadata?: Record<string, unknown>;
}

/** Discipline preference weights for follow targeting (should sum ~1). */
export interface DisciplineWeight {
  discipline: DisciplineSlug | "*";
  weight: number;
}

export interface BehavioralPersona {
  id: BehavioralPersonaId;
  description: string;
  followTargets: DisciplineWeight[];
  /** Soft city boosts (e.g. hub_night_regular → beirut). */
  cityAffinity?: { city: CitySlug; boost: number }[];
  preferHubNightOrganizers?: boolean;
  followCount: { min: number; max: number };
  opportunityInterestProbability: number;
  contactProbability: number;
  /** Multiplier applied when assigning work view bumps from this persona. */
  viewMultiplier: number;
}

export interface FollowGraphConfig {
  /** Staging target; POC may produce fewer edges. */
  targetFollowCount: number;
  /** Fixed RNG seed — variation only within persona rules. */
  rngSeed: number;
  /** Handles that should land in the heavy follower tail. */
  sceneAnchorHandles: string[];
}

export interface FollowEdge {
  followerHandle: string;
  followingHandle: string;
}

/** In-memory handle → resolved DB ids after profile phase. */
export interface SeedHandleIndex {
  userIdByHandle: Map<string, string>;
  profileIdByHandle: Map<string, string>;
  workIdBySlug: Map<string, string>;
  opportunityIdBySlug: Map<string, string>;
  eventIdBySlug: Map<string, string>;
}
