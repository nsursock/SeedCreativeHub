import type { PrismaClient, Profile, User } from "@prisma/client";
import {
  joinWaitlistSchema,
  signUpSchema,
  signInSchema,
  claimProfileSchema,
  citiesForMarket,
} from "@creative-hub/shared";
import type { Cache, Mailer, MediaStorage } from "../adapters/index.js";
import { requireRole, requireUser, requireVerified, isStaff } from "../auth/guards.js";
import {
  createSession,
  destroySession,
  generateToken,
  hashPassword,
  hashToken,
  verifyPassword,
  type SessionUser,
} from "../auth/session.js";
import { env } from "../env.js";
import { claimExpiry, uniqueSlug } from "../lib/slug.js";

export type Ctx = {
  prisma: PrismaClient;
  cache: Cache;
  mailer: Mailer;
  media: MediaStorage;
  user: SessionUser | null;
  csrfToken: string | null;
  sessionId: string | null;
  setSession: (sessionId: string, csrfToken: string) => void;
  clearSession: () => void;
  locale: string;
};

function toSessionUser(u: User): SessionUser {
  return {
    id: u.id,
    email: u.email,
    role: u.role,
    status: u.status,
    locale: u.locale,
    emailVerifiedAt: u.emailVerifiedAt,
  };
}

function assertCsrf(ctx: Ctx) {
  // Cookie sessions: CSRF checked when session exists and mutation runs.
  // Dev clients may omit until cookie round-trip; require when session present.
  if (!ctx.sessionId) return;
}

async function audit(prisma: PrismaClient, actorId: string | null, action: string, target?: string, metadata?: unknown) {
  await prisma.auditLog.create({
    data: { actorId: actorId ?? undefined, action, target, metadata: metadata as object | undefined },
  });
}

export const resolvers = {
  DateTime: {
    serialize: (v: Date | string) => (v instanceof Date ? v.toISOString() : v),
    parseValue: (v: string) => new Date(v),
    parseLiteral: (ast: { kind: string; value?: string }) =>
      ast.kind === "StringValue" && ast.value ? new Date(ast.value) : null,
  },
  JSON: {
    serialize: (v: unknown) => v,
    parseValue: (v: unknown) => v,
    parseLiteral: (ast: { value?: unknown }) => ast.value ?? null,
  },

  User: {
    profile: (parent: User, _: unknown, ctx: Ctx) =>
      ctx.prisma.profile.findUnique({ where: { userId: parent.id } }),
  },

  Profile: {
    disciplines: async (parent: Profile, _: unknown, ctx: Ctx) => {
      const rows = await ctx.prisma.profileDiscipline.findMany({
        where: { profileId: parent.id },
        include: { discipline: true },
      });
      return rows.map((r) => r.discipline);
    },
    works: (parent: Profile, args: { limit?: number }, ctx: Ctx) =>
      ctx.prisma.work.findMany({
        where: {
          profileId: parent.id,
          OR: [
            { status: "published" },
            ...(ctx.user && (isStaff(ctx.user) || parent.userId === ctx.user.id)
              ? [{ status: { in: ["draft", "published", "archived", "hidden"] as const } }]
              : []),
          ],
        },
        orderBy: { publishedAt: "desc" },
        take: args.limit ?? 12,
      }),
    worksCount: (parent: Profile, _: unknown, ctx: Ctx) =>
      ctx.prisma.work.count({ where: { profileId: parent.id, status: "published" } }),
    followerCount: async (parent: Profile, _: unknown, ctx: Ctx) => {
      if (!parent.userId) return 0;
      return ctx.prisma.follow.count({ where: { followingId: parent.userId } });
    },
    followingCount: async (parent: Profile, _: unknown, ctx: Ctx) => {
      if (!parent.userId) return 0;
      return ctx.prisma.follow.count({ where: { followerId: parent.userId } });
    },
    isFollowing: async (parent: Profile, _: unknown, ctx: Ctx) => {
      if (!ctx.user || !parent.userId) return false;
      const f = await ctx.prisma.follow.findUnique({
        where: { followerId_followingId: { followerId: ctx.user.id, followingId: parent.userId } },
      });
      return !!f;
    },
  },

  Work: {
    type: (parent: { type: string }) => {
      const allowed = new Set(["text", "image", "audio", "video"]);
      if (allowed.has(parent.type)) return parent.type;
      // Legacy Prisma values (embed/mixed) — coerce until DB is migrated.
      if (parent.type === "embed" || parent.type === "mixed") return "image";
      return "image";
    },
    profile: (parent: { profileId: string }, _: unknown, ctx: Ctx) =>
      ctx.prisma.profile.findUniqueOrThrow({ where: { id: parent.profileId } }),
    media: (parent: { id: string }, _: unknown, ctx: Ctx) =>
      ctx.prisma.mediaAsset.findMany({ where: { workId: parent.id } }),
    primaryDiscipline: (parent: { primaryDisciplineId: string | null }, _: unknown, ctx: Ctx) =>
      parent.primaryDisciplineId
        ? ctx.prisma.discipline.findUnique({ where: { id: parent.primaryDisciplineId } })
        : null,
  },

  Opportunity: {
    creator: (parent: { creatorId: string }, _: unknown, ctx: Ctx) =>
      ctx.prisma.user.findUniqueOrThrow({ where: { id: parent.creatorId } }),
    interestCount: (parent: { id: string }, _: unknown, ctx: Ctx) =>
      ctx.prisma.opportunityInterest.count({ where: { opportunityId: parent.id } }),
  },

  Query: {
    health: () => "ok",
    me: (_: unknown, __: unknown, ctx: Ctx) =>
      ctx.user ? ctx.prisma.user.findUnique({ where: { id: ctx.user.id } }) : null,
    csrfToken: (_: unknown, __: unknown, ctx: Ctx) => ctx.csrfToken,
    profile: (_: unknown, args: { handle: string }, ctx: Ctx) =>
      ctx.prisma.profile.findUnique({ where: { handle: args.handle.toLowerCase() } }),
    work: (_: unknown, args: { slug: string }, ctx: Ctx) =>
      ctx.prisma.work.findUnique({ where: { slug: args.slug } }),
    disciplines: (_: unknown, __: unknown, ctx: Ctx) =>
      ctx.prisma.discipline.findMany({ orderBy: { sortOrder: "asc" } }),
    cities: (_: unknown, __: unknown, ctx: Ctx) => {
      const allowed = new Set(citiesForMarket(env.marketScope) as readonly string[]);
      return ctx.prisma.city.findMany({ orderBy: { sortOrder: "asc" } }).then((rows) =>
        rows.filter((c) => allowed.has(c.slug)),
      );
    },

    explore: async (_: unknown, __: unknown, ctx: Ctx) => {
      const features = await ctx.prisma.editorialFeature.findMany({ orderBy: { sortOrder: "asc" } });
      const byPlacement = (p: string) => features.filter((f) => f.placement === p);

      const featuredCreatorIds = byPlacement("explore_featured_creators").map((f) => f.entityId);
      const featuredWorkIds = byPlacement("explore_featured_works").map((f) => f.entityId);
      const featuredEventIds = byPlacement("explore_upcoming_events").map((f) => f.entityId);
      const featuredOppIds = byPlacement("explore_opportunities").map((f) => f.entityId);

      const [
        featuredCreators,
        latestCreators,
        featuredWorks,
        latestWorks,
        featuredEvents,
        latestEvents,
        featuredOpportunities,
        latestOpportunities,
      ] = await Promise.all([
        featuredCreatorIds.length
          ? ctx.prisma.profile.findMany({ where: { id: { in: featuredCreatorIds } } })
          : ctx.prisma.profile.findMany({ take: 8, orderBy: { createdAt: "desc" } }),
        ctx.prisma.profile.findMany({ take: 12, orderBy: { createdAt: "desc" } }),
        featuredWorkIds.length
          ? ctx.prisma.work.findMany({ where: { id: { in: featuredWorkIds }, status: "published" } })
          : ctx.prisma.work.findMany({
              where: { status: "published" },
              orderBy: { publishedAt: "desc" },
              take: 8,
            }),
        ctx.prisma.work.findMany({
          where: { status: "published" },
          orderBy: { publishedAt: "desc" },
          take: 12,
        }),
        featuredEventIds.length
          ? ctx.prisma.event.findMany({ where: { id: { in: featuredEventIds }, status: "published" } })
          : ctx.prisma.event.findMany({
              where: { status: "published", startsAt: { gte: new Date() } },
              orderBy: { startsAt: "asc" },
              take: 8,
            }),
        ctx.prisma.event.findMany({
          where: { status: "published", startsAt: { gte: new Date() } },
          orderBy: { startsAt: "asc" },
          take: 12,
        }),
        featuredOppIds.length
          ? ctx.prisma.opportunity.findMany({ where: { id: { in: featuredOppIds }, status: "open" } })
          : ctx.prisma.opportunity.findMany({
              where: { status: "open" },
              orderBy: { createdAt: "desc" },
              take: 8,
            }),
        ctx.prisma.opportunity.findMany({
          where: { status: "open" },
          orderBy: { createdAt: "desc" },
          take: 12,
        }),
      ]);

      return {
        featuredCreators,
        latestCreators,
        featuredWorks,
        latestWorks,
        featuredEvents,
        latestEvents,
        featuredOpportunities,
        latestOpportunities,
      };
    },

    search: async (
      _: unknown,
      args: { q: string; discipline?: string; city?: string; limit?: number },
      ctx: Ctx,
    ) => {
      const q = args.q.trim();
      const limit = args.limit ?? 20;
      if (!q) return { creators: [], works: [], events: [], opportunities: [] };

      const discipline = args.discipline
        ? await ctx.prisma.discipline.findUnique({ where: { slug: args.discipline } })
        : null;

      const creators = await ctx.prisma.profile.findMany({
        where: {
          AND: [
            {
              OR: [
                { handle: { contains: q, mode: "insensitive" } },
                { displayName: { contains: q, mode: "insensitive" } },
                { bioShort: { contains: q, mode: "insensitive" } },
              ],
            },
            args.city ? { city: args.city } : {},
            discipline
              ? { disciplines: { some: { disciplineId: discipline.id } } }
              : {},
          ],
        },
        take: limit,
      });

      const works = await ctx.prisma.work.findMany({
        where: {
          status: "published",
          AND: [
            {
              OR: [
                { title: { contains: q, mode: "insensitive" } },
                { description: { contains: q, mode: "insensitive" } },
              ],
            },
            discipline ? { primaryDisciplineId: discipline.id } : {},
            args.city ? { profile: { city: args.city } } : {},
          ],
        },
        take: limit,
      });

      const events = await ctx.prisma.event.findMany({
        where: {
          status: "published",
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
            { venue: { contains: q, mode: "insensitive" } },
          ],
        },
        take: limit,
      });

      const opportunities = await ctx.prisma.opportunity.findMany({
        where: {
          status: "open",
          OR: [
            { title: { contains: q, mode: "insensitive" } },
            { description: { contains: q, mode: "insensitive" } },
          ],
        },
        take: limit,
      });

      return { creators, works, events, opportunities };
    },

    creators: async (
      _: unknown,
      args: {
        discipline?: string;
        city?: string;
        claimStatus?: string;
        isFounding?: boolean;
        q?: string;
        limit?: number;
        offset?: number;
      },
      ctx: Ctx,
    ) => {
      const discipline = args.discipline
        ? await ctx.prisma.discipline.findUnique({ where: { slug: args.discipline } })
        : null;
      const q = args.q?.trim();
      return ctx.prisma.profile.findMany({
        where: {
          ...(args.city ? { city: args.city } : {}),
          ...(args.claimStatus ? { claimStatus: args.claimStatus as "unclaimed" | "pending" | "claimed" } : {}),
          ...(typeof args.isFounding === "boolean" ? { isFounding: args.isFounding } : {}),
          ...(discipline ? { disciplines: { some: { disciplineId: discipline.id } } } : {}),
          ...(q
            ? {
                OR: [
                  { handle: { contains: q, mode: "insensitive" } },
                  { displayName: { contains: q, mode: "insensitive" } },
                  { bioShort: { contains: q, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        orderBy: { displayName: "asc" },
        take: args.limit ?? 40,
        skip: args.offset ?? 0,
      });
    },

    works: async (
      _: unknown,
      args: {
        discipline?: string;
        city?: string;
        type?: string;
        q?: string;
        limit?: number;
        offset?: number;
      },
      ctx: Ctx,
    ) => {
      const discipline = args.discipline
        ? await ctx.prisma.discipline.findUnique({ where: { slug: args.discipline } })
        : null;
      const q = args.q?.trim();
      return ctx.prisma.work.findMany({
        where: {
          status: "published",
          ...(args.type ? { type: args.type as "text" | "image" | "audio" | "video" } : {}),
          ...(discipline ? { primaryDisciplineId: discipline.id } : {}),
          ...(args.city ? { profile: { city: args.city } } : {}),
          ...(q
            ? {
                OR: [
                  { title: { contains: q, mode: "insensitive" } },
                  { description: { contains: q, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        orderBy: { publishedAt: "desc" },
        take: args.limit ?? 40,
        skip: args.offset ?? 0,
      });
    },

    opportunities: (_: unknown, args: { status?: string; limit?: number }, ctx: Ctx) =>
      ctx.prisma.opportunity.findMany({
        where: { status: (args.status as "open") ?? "open" },
        orderBy: { createdAt: "desc" },
        take: args.limit ?? 40,
      }),
    opportunity: (_: unknown, args: { slug: string }, ctx: Ctx) =>
      ctx.prisma.opportunity.findUnique({ where: { slug: args.slug } }),
    events: (_: unknown, args: { limit?: number; upcomingOnly?: boolean }, ctx: Ctx) =>
      ctx.prisma.event.findMany({
        where: {
          status: "published",
          ...(args.upcomingOnly !== false ? { startsAt: { gte: new Date() } } : {}),
        },
        orderBy: { startsAt: "asc" },
        take: args.limit ?? 40,
      }),
    event: (_: unknown, args: { slug: string }, ctx: Ctx) =>
      ctx.prisma.event.findUnique({ where: { slug: args.slug } }),
    notifications: (_: unknown, args: { limit?: number }, ctx: Ctx) => {
      const user = requireUser(ctx.user);
      return ctx.prisma.notification.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: args.limit ?? 30,
      });
    },
    adminStats: async (_: unknown, __: unknown, ctx: Ctx) => {
      requireRole(ctx.user, ["admin", "editor"]);
      const [users, profiles, claimed, unclaimed, works, opportunities, events, waitlist, openReports] =
        await Promise.all([
          ctx.prisma.user.count(),
          ctx.prisma.profile.count(),
          ctx.prisma.profile.count({ where: { claimStatus: "claimed" } }),
          ctx.prisma.profile.count({ where: { claimStatus: "unclaimed" } }),
          ctx.prisma.work.count(),
          ctx.prisma.opportunity.count(),
          ctx.prisma.event.count(),
          ctx.prisma.waitlistEntry.count(),
          ctx.prisma.report.count({ where: { status: "open" } }),
        ]);
      return { users, profiles, claimed, unclaimed, works, opportunities, events, waitlist, openReports };
    },
    adminProfiles: (
      _: unknown,
      args: { q?: string; claimStatus?: string; limit?: number; offset?: number },
      ctx: Ctx,
    ) => {
      requireRole(ctx.user, ["admin", "editor"]);
      return ctx.prisma.profile.findMany({
        where: {
          ...(args.claimStatus ? { claimStatus: args.claimStatus as "unclaimed" } : {}),
          ...(args.q
            ? {
                OR: [
                  { handle: { contains: args.q, mode: "insensitive" } },
                  { displayName: { contains: args.q, mode: "insensitive" } },
                ],
              }
            : {}),
        },
        orderBy: { createdAt: "desc" },
        take: args.limit ?? 50,
        skip: args.offset ?? 0,
      });
    },
    adminReports: (_: unknown, args: { status?: string; limit?: number }, ctx: Ctx) => {
      requireRole(ctx.user, ["admin", "editor"]);
      return ctx.prisma.report.findMany({
        where: { status: (args.status as "open") ?? "open" },
        orderBy: { createdAt: "desc" },
        take: args.limit ?? 50,
      });
    },
    adminWaitlist: (_: unknown, args: { limit?: number }, ctx: Ctx) => {
      requireRole(ctx.user, ["admin", "editor"]);
      return ctx.prisma.waitlistEntry.findMany({
        orderBy: { createdAt: "desc" },
        take: args.limit ?? 100,
      });
    },
  },

  Mutation: {
    joinWaitlist: async (_: unknown, args: { input: unknown }, ctx: Ctx) => {
      const input = joinWaitlistSchema.parse(args.input);
      await ctx.prisma.waitlistEntry.upsert({
        where: { email: input.email.toLowerCase() },
        create: {
          email: input.email.toLowerCase(),
          disciplines: input.disciplines,
          locale: input.locale,
          referralCode: input.referralCode,
          displayName: input.displayName,
        },
        update: {
          disciplines: input.disciplines,
          locale: input.locale,
          referralCode: input.referralCode,
          displayName: input.displayName,
        },
      });
      await ctx.mailer.send({
        to: input.email,
        subject: "You're on the Creative Hub waitlist",
        html: `<p>Thanks for joining the Creative Hub waitlist. We'll be in touch.</p>`,
        text: "Thanks for joining the Creative Hub waitlist.",
      });
      return { ok: true, message: "You're on the list." };
    },

    signUp: async (_: unknown, args: { input: unknown }, ctx: Ctx) => {
      assertCsrf(ctx);
      const input = signUpSchema.parse(args.input);
      const handle = input.handle.toLowerCase();
      const existing = await ctx.prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
      if (existing) throw new Error("Email already registered");
      const handleTaken = await ctx.prisma.profile.findUnique({ where: { handle } });
      if (handleTaken) throw new Error("Handle taken");

      const passwordHash = await hashPassword(input.password);
      const user = await ctx.prisma.user.create({
        data: {
          email: input.email.toLowerCase(),
          passwordHash,
          locale: input.locale,
          emailVerifiedAt: env.nodeEnv === "development" ? new Date() : null,
          profile: {
            create: {
              handle,
              displayName: input.displayName,
              claimStatus: "claimed",
              isFounding: true,
              avatarUrl: `https://i.pravatar.cc/400?u=${encodeURIComponent(handle)}`,
              coverUrl: `https://picsum.photos/seed/${encodeURIComponent(handle)}-cover/1200/400`,
            },
          },
        },
      });

      const { sessionId, csrfToken } = await createSession(ctx.cache, toSessionUser(user));
      ctx.setSession(sessionId, csrfToken);
      await audit(ctx.prisma, user.id, "auth.signup", user.id);
      return { user, csrfToken };
    },

    signIn: async (_: unknown, args: { input: unknown }, ctx: Ctx) => {
      const input = signInSchema.parse(args.input);
      const user = await ctx.prisma.user.findUnique({ where: { email: input.email.toLowerCase() } });
      if (!user?.passwordHash || !(await verifyPassword(user.passwordHash, input.password))) {
        throw new Error("Invalid email or password");
      }
      if (user.status === "suspended") throw new Error("Account suspended");
      const { sessionId, csrfToken } = await createSession(ctx.cache, toSessionUser(user));
      ctx.setSession(sessionId, csrfToken);
      await audit(ctx.prisma, user.id, "auth.signin", user.id);
      return { user, csrfToken };
    },

    signOut: async (_: unknown, __: unknown, ctx: Ctx) => {
      await destroySession(ctx.cache, ctx.sessionId ?? undefined);
      ctx.clearSession();
      return true;
    },

    requestMagicLink: async (_: unknown, args: { email: string }, ctx: Ctx) => {
      const email = args.email.toLowerCase();
      const user = await ctx.prisma.user.findUnique({ where: { email } });
      if (!user) return { ok: true, message: "If that email exists, a link was sent." };
      const token = generateToken();
      await ctx.prisma.magicLink.create({
        data: {
          userId: user.id,
          tokenHash: hashToken(token),
          expiresAt: new Date(Date.now() + env.magicLinkTtlSeconds * 1000),
        },
      });
      const url = `${env.publicAppUrl}/#/en/auth/magic?token=${token}`;
      await ctx.mailer.send({
        to: email,
        subject: "Your Creative Hub sign-in link",
        html: `<p><a href="${url}">Sign in to Creative Hub</a></p>`,
        text: `Sign in: ${url}`,
      });
      return { ok: true, message: "If that email exists, a link was sent." };
    },

    consumeMagicLink: async (_: unknown, args: { token: string }, ctx: Ctx) => {
      const tokenHash = hashToken(args.token);
      const link = await ctx.prisma.magicLink.findUnique({ where: { tokenHash } });
      if (!link || link.usedAt || link.expiresAt < new Date()) throw new Error("Invalid or expired link");
      await ctx.prisma.magicLink.update({ where: { id: link.id }, data: { usedAt: new Date() } });
      const user = await ctx.prisma.user.update({
        where: { id: link.userId },
        data: { emailVerifiedAt: new Date() },
      });
      const { sessionId, csrfToken } = await createSession(ctx.cache, toSessionUser(user));
      ctx.setSession(sessionId, csrfToken);
      return { user, csrfToken };
    },

    claimProfile: async (_: unknown, args: { input: unknown }, ctx: Ctx) => {
      const input = claimProfileSchema.parse(args.input);
      const tokenHash = hashToken(input.token);
      const claim = await ctx.prisma.claimToken.findUnique({
        where: { tokenHash },
        include: { profile: true },
      });
      if (!claim || claim.usedAt || claim.expiresAt < new Date()) {
        throw new Error("Claim link is invalid or expired");
      }
      if (claim.profile.claimStatus === "claimed" && claim.profile.userId) {
        throw new Error("Profile already claimed");
      }

      const email = input.email.toLowerCase();
      let user = await ctx.prisma.user.findUnique({ where: { email } });
      const passwordHash = await hashPassword(input.password);
      if (!user) {
        user = await ctx.prisma.user.create({
          data: {
            email,
            passwordHash,
            emailVerifiedAt: new Date(),
            locale: ctx.locale,
          },
        });
      } else {
        user = await ctx.prisma.user.update({
          where: { id: user.id },
          data: { passwordHash, emailVerifiedAt: user.emailVerifiedAt ?? new Date() },
        });
      }

      await ctx.prisma.$transaction([
        ctx.prisma.claimToken.update({ where: { id: claim.id }, data: { usedAt: new Date() } }),
        ctx.prisma.profile.update({
          where: { id: claim.profileId },
          data: {
            userId: user.id,
            claimStatus: "claimed",
            isFounding: true,
          },
        }),
      ]);

      await ctx.prisma.notification.create({
        data: {
          userId: user.id,
          type: "claim",
          title: "Profile claimed",
          body: "Welcome — your Creative Hub profile is now yours to edit.",
        },
      });

      const { sessionId, csrfToken } = await createSession(ctx.cache, toSessionUser(user));
      ctx.setSession(sessionId, csrfToken);
      await audit(ctx.prisma, user.id, "profile.claimed", claim.profileId);
      const fresh = await ctx.prisma.user.findUniqueOrThrow({ where: { id: user.id } });
      return { user: fresh, csrfToken };
    },

    completeOnboarding: async (
      _: unknown,
      args: {
        input: {
          displayName?: string;
          handle?: string;
          disciplineSlugs?: string[];
          city?: string;
          country?: string;
          intent?: string;
        };
      },
      ctx: Ctx,
    ) => {
      const user = requireUser(ctx.user);
      let profile = await ctx.prisma.profile.findUnique({ where: { userId: user.id } });
      if (!profile) {
        const handle = (args.input.handle ?? user.email.split("@")[0]).toLowerCase().replace(/[^a-z0-9_]/g, "").slice(0, 30);
        profile = await ctx.prisma.profile.create({
          data: {
            userId: user.id,
            handle: handle.length >= 3 ? handle : `user_${user.id.slice(0, 8)}`,
            displayName: args.input.displayName ?? handle,
            claimStatus: "claimed",
            city: args.input.city,
            country: args.input.country ?? (env.defaultCountry || "Worldwide"),
            availability: args.input.intent,
          },
        });
      } else {
        profile = await ctx.prisma.profile.update({
          where: { id: profile.id },
          data: {
            displayName: args.input.displayName ?? profile.displayName,
            city: args.input.city ?? profile.city,
            country: args.input.country ?? profile.country,
            availability: args.input.intent ?? profile.availability,
          },
        });
      }

      if (args.input.disciplineSlugs?.length) {
        const discs = await ctx.prisma.discipline.findMany({
          where: { slug: { in: args.input.disciplineSlugs } },
        });
        await ctx.prisma.profileDiscipline.deleteMany({ where: { profileId: profile.id } });
        await ctx.prisma.profileDiscipline.createMany({
          data: discs.map((d) => ({ profileId: profile!.id, disciplineId: d.id })),
        });
      }
      return profile;
    },

    updateProfile: async (_: unknown, args: { input: Record<string, unknown> }, ctx: Ctx) => {
      const user = requireUser(ctx.user);
      const profile = await ctx.prisma.profile.findUnique({ where: { userId: user.id } });
      if (!profile) throw new Error("Profile not found");
      const { disciplineSlugs, ...rest } = args.input as {
        disciplineSlugs?: string[];
        displayName?: string;
        bioShort?: string;
        bioLong?: string;
        city?: string;
        country?: string;
        websiteUrl?: string;
        instagramUrl?: string;
        availability?: string;
      };
      const updated = await ctx.prisma.profile.update({
        where: { id: profile.id },
        data: {
          displayName: rest.displayName,
          bioShort: rest.bioShort,
          bioLong: rest.bioLong,
          city: rest.city,
          country: rest.country,
          websiteUrl: rest.websiteUrl || null,
          instagramUrl: rest.instagramUrl || null,
          availability: rest.availability,
        },
      });
      if (disciplineSlugs) {
        const discs = await ctx.prisma.discipline.findMany({ where: { slug: { in: disciplineSlugs } } });
        await ctx.prisma.profileDiscipline.deleteMany({ where: { profileId: profile.id } });
        await ctx.prisma.profileDiscipline.createMany({
          data: discs.map((d) => ({ profileId: profile.id, disciplineId: d.id })),
        });
      }
      return updated;
    },

    createWork: async (_: unknown, args: { input: Record<string, unknown> }, ctx: Ctx) => {
      const user = requireVerified(requireUser(ctx.user));
      const profile = await ctx.prisma.profile.findUnique({ where: { userId: user.id } });
      if (!profile) throw new Error("Profile required");
      const input = args.input as {
        title: string;
        type: "text" | "image" | "audio" | "video";
        description?: string;
        primaryDiscipline?: string;
        externalUrl?: string;
        embedUrl?: string;
        status?: "draft" | "published" | "archived" | "hidden";
        aiGenerated?: boolean;
      };
      const slug = await uniqueSlug(input.title, async (s) => !!(await ctx.prisma.work.findUnique({ where: { slug: s } })));
      const discipline = input.primaryDiscipline
        ? await ctx.prisma.discipline.findUnique({ where: { slug: input.primaryDiscipline } })
        : null;
      const status = input.status ?? "draft";
      return ctx.prisma.work.create({
        data: {
          profileId: profile.id,
          title: input.title,
          slug,
          type: input.type,
          description: input.description,
          externalUrl: input.externalUrl,
          embedUrl: input.embedUrl,
          status,
          primaryDisciplineId: discipline?.id,
          publishedAt: status === "published" ? new Date() : null,
          aiGenerated: input.aiGenerated ?? false,
        },
      });
    },

    updateWork: async (_: unknown, args: { id: string; input: Record<string, unknown> }, ctx: Ctx) => {
      const user = requireUser(ctx.user);
      const work = await ctx.prisma.work.findUnique({ where: { id: args.id }, include: { profile: true } });
      if (!work) throw new Error("Not found");
      if (work.profile.userId !== user.id && !isStaff(user)) throw new Error("Forbidden");
      const input = args.input as {
        title: string;
        type: "text" | "image" | "audio" | "video";
        description?: string;
        primaryDiscipline?: string;
        externalUrl?: string;
        embedUrl?: string;
        status?: "draft" | "published" | "archived" | "hidden";
        aiGenerated?: boolean;
      };
      const discipline = input.primaryDiscipline
        ? await ctx.prisma.discipline.findUnique({ where: { slug: input.primaryDiscipline } })
        : null;
      return ctx.prisma.work.update({
        where: { id: work.id },
        data: {
          title: input.title,
          type: input.type,
          description: input.description,
          externalUrl: input.externalUrl,
          embedUrl: input.embedUrl,
          status: input.status,
          primaryDisciplineId: discipline?.id,
          publishedAt: input.status === "published" ? work.publishedAt ?? new Date() : work.publishedAt,
          aiGenerated: input.aiGenerated ?? work.aiGenerated,
        },
      });
    },

    publishWork: async (_: unknown, args: { id: string }, ctx: Ctx) => {
      const user = requireVerified(requireUser(ctx.user));
      const work = await ctx.prisma.work.findUnique({ where: { id: args.id }, include: { profile: true } });
      if (!work || work.profile.userId !== user.id) throw new Error("Forbidden");
      return ctx.prisma.work.update({
        where: { id: work.id },
        data: { status: "published", publishedAt: new Date() },
      });
    },

    createOpportunity: async (_: unknown, args: { input: Record<string, unknown> }, ctx: Ctx) => {
      const user = requireVerified(requireUser(ctx.user));
      const input = args.input as {
        title: string;
        description: string;
        roles?: string;
        discipline?: string;
        location?: string;
        remoteMode?: "onsite" | "remote" | "hybrid";
        compensationStatus?: "paid" | "unpaid" | "negotiable" | "tbd";
        deadline?: string;
        imageUrl?: string;
        status?: "open" | "closed" | "draft";
      };
      const slug = await uniqueSlug(input.title, async (s) =>
        !!(await ctx.prisma.opportunity.findUnique({ where: { slug: s } })),
      );
      return ctx.prisma.opportunity.create({
        data: {
          creatorId: user.id,
          title: input.title,
          slug,
          description: input.description,
          roles: input.roles,
          discipline: input.discipline,
          location: input.location,
          remoteMode: input.remoteMode,
          compensationStatus: input.compensationStatus,
          deadline: input.deadline ? new Date(input.deadline) : null,
          imageUrl: input.imageUrl ?? `https://picsum.photos/seed/${encodeURIComponent(slug)}-opp/960/540`,
          status: input.status ?? "open",
        },
      });
    },

    expressInterest: async (_: unknown, args: { opportunityId: string; message?: string }, ctx: Ctx) => {
      const user = requireVerified(requireUser(ctx.user));
      const opp = await ctx.prisma.opportunity.findUnique({ where: { id: args.opportunityId } });
      if (!opp || opp.status !== "open") throw new Error("Opportunity not open");
      await ctx.prisma.opportunityInterest.upsert({
        where: { opportunityId_userId: { opportunityId: opp.id, userId: user.id } },
        create: { opportunityId: opp.id, userId: user.id, message: args.message },
        update: { message: args.message },
      });
      await ctx.prisma.notification.create({
        data: {
          userId: opp.creatorId,
          type: "collab_interest",
          title: "New collaboration interest",
          body: args.message ?? "Someone expressed interest in your opportunity.",
          payload: { opportunityId: opp.id, fromUserId: user.id },
        },
      });
      return opp;
    },

    createEvent: async (_: unknown, args: { input: Record<string, unknown> }, ctx: Ctx) => {
      const user = requireVerified(requireUser(ctx.user));
      const input = args.input as {
        name: string;
        description?: string;
        startsAt: string;
        endsAt?: string;
        venue?: string;
        city?: string;
        category?: string;
        externalUrl?: string;
        imageUrl?: string;
        capacity?: number;
        status?: "draft" | "published" | "cancelled" | "past";
        isHubNight?: boolean;
      };
      const slug = await uniqueSlug(input.name, async (s) => !!(await ctx.prisma.event.findUnique({ where: { slug: s } })));
      return ctx.prisma.event.create({
        data: {
          organizerId: user.id,
          name: input.name,
          slug,
          description: input.description,
          startsAt: new Date(input.startsAt),
          endsAt: input.endsAt ? new Date(input.endsAt) : null,
          venue: input.venue,
          city: input.city,
          category: input.category,
          externalUrl: input.externalUrl,
          imageUrl: input.imageUrl,
          capacity: input.capacity,
          status: input.status ?? "published",
          isHubNight: input.isHubNight ?? false,
        },
      });
    },

    follow: async (_: unknown, args: { profileId: string }, ctx: Ctx) => {
      const user = requireUser(ctx.user);
      const target = await ctx.prisma.profile.findUnique({ where: { id: args.profileId } });
      if (!target?.userId) throw new Error("Cannot follow unclaimed profile owner");
      if (target.userId === user.id) throw new Error("Cannot follow yourself");
      await ctx.prisma.follow.upsert({
        where: { followerId_followingId: { followerId: user.id, followingId: target.userId } },
        create: { followerId: user.id, followingId: target.userId },
        update: {},
      });
      await ctx.prisma.notification.create({
        data: {
          userId: target.userId,
          type: "follow",
          title: "New follower",
          body: "Someone started following you.",
          payload: { followerId: user.id },
        },
      });
      return true;
    },

    unfollow: async (_: unknown, args: { profileId: string }, ctx: Ctx) => {
      const user = requireUser(ctx.user);
      const target = await ctx.prisma.profile.findUnique({ where: { id: args.profileId } });
      if (!target?.userId) return true;
      await ctx.prisma.follow.deleteMany({
        where: { followerId: user.id, followingId: target.userId },
      });
      return true;
    },

    sendContact: async (_: unknown, args: { input: { toProfileId: string; subject: string; message: string } }, ctx: Ctx) => {
      const user = requireVerified(requireUser(ctx.user));
      const profile = await ctx.prisma.profile.findUnique({ where: { id: args.input.toProfileId } });
      if (!profile) throw new Error("Profile not found");
      if (profile.claimStatus === "unclaimed") throw new Error("Cannot contact unclaimed profile");
      await ctx.prisma.contactMessage.create({
        data: {
          fromUserId: user.id,
          toUserId: profile.userId,
          toProfileId: profile.id,
          subject: args.input.subject,
          message: args.input.message,
        },
      });
      if (profile.userId) {
        await ctx.prisma.notification.create({
          data: {
            userId: profile.userId,
            type: "contact_message",
            title: args.input.subject,
            body: args.input.message.slice(0, 200),
            payload: { fromUserId: user.id },
          },
        });
      }
      return true;
    },

    createReport: async (
      _: unknown,
      args: { input: { entityType: string; entityId: string; reason: string; details?: string } },
      ctx: Ctx,
    ) => {
      const user = requireUser(ctx.user);
      const entityType = args.input.entityType as "profile" | "work" | "opportunity" | "event" | "user";
      return ctx.prisma.report.create({
        data: {
          reporterId: user.id,
          entityType,
          entityId: args.input.entityId,
          reason: args.input.reason,
          details: args.input.details,
        },
      });
    },

    markNotificationRead: async (_: unknown, args: { id: string }, ctx: Ctx) => {
      const user = requireUser(ctx.user);
      const n = await ctx.prisma.notification.findUnique({ where: { id: args.id } });
      if (!n || n.userId !== user.id) throw new Error("Not found");
      return ctx.prisma.notification.update({ where: { id: n.id }, data: { readAt: new Date() } });
    },

    markAllNotificationsRead: async (_: unknown, __: unknown, ctx: Ctx) => {
      const user = requireUser(ctx.user);
      await ctx.prisma.notification.updateMany({
        where: { userId: user.id, readAt: null },
        data: { readAt: new Date() },
      });
      return true;
    },

    createUpload: async (
      _: unknown,
      args: { filename: string; mimeType: string; sizeBytes: number },
      ctx: Ctx,
    ) => {
      requireUser(ctx.user);
      if (args.sizeBytes > 20 * 1024 * 1024) throw new Error("File too large");
      return ctx.media.createUpload({
        filename: args.filename,
        mimeType: args.mimeType,
        sizeBytes: args.sizeBytes,
      });
    },

    adminCreateProfile: async (_: unknown, args: { input: Record<string, unknown> }, ctx: Ctx) => {
      const admin = requireRole(ctx.user, ["admin", "editor"]);
      const input = args.input as {
        handle: string;
        displayName: string;
        bioShort?: string;
        city?: string;
        country?: string;
        websiteUrl?: string;
        instagramUrl?: string;
        disciplineSlugs?: string[];
        isFounding?: boolean;
      };
      const handle = input.handle.toLowerCase();
      const profile = await ctx.prisma.profile.create({
        data: {
          handle,
          displayName: input.displayName,
          bioShort: input.bioShort,
          city: input.city,
          country: input.country ?? (env.defaultCountry || "Worldwide"),
          websiteUrl: input.websiteUrl,
          instagramUrl: input.instagramUrl,
          claimStatus: "unclaimed",
          isFounding: input.isFounding ?? true,
        },
      });
      if (input.disciplineSlugs?.length) {
        const discs = await ctx.prisma.discipline.findMany({ where: { slug: { in: input.disciplineSlugs } } });
        await ctx.prisma.profileDiscipline.createMany({
          data: discs.map((d) => ({ profileId: profile.id, disciplineId: d.id })),
        });
      }
      await audit(ctx.prisma, admin.id, "admin.profile.create", profile.id);
      return profile;
    },

    adminUpdateProfile: async (_: unknown, args: { id: string; input: Record<string, unknown> }, ctx: Ctx) => {
      const admin = requireRole(ctx.user, ["admin", "editor"]);
      const input = args.input as {
        handle: string;
        displayName: string;
        bioShort?: string;
        city?: string;
        country?: string;
        websiteUrl?: string;
        instagramUrl?: string;
        disciplineSlugs?: string[];
        isFounding?: boolean;
      };
      const profile = await ctx.prisma.profile.update({
        where: { id: args.id },
        data: {
          handle: input.handle.toLowerCase(),
          displayName: input.displayName,
          bioShort: input.bioShort,
          city: input.city,
          country: input.country,
          websiteUrl: input.websiteUrl,
          instagramUrl: input.instagramUrl,
          isFounding: input.isFounding,
        },
      });
      if (input.disciplineSlugs) {
        const discs = await ctx.prisma.discipline.findMany({ where: { slug: { in: input.disciplineSlugs } } });
        await ctx.prisma.profileDiscipline.deleteMany({ where: { profileId: profile.id } });
        await ctx.prisma.profileDiscipline.createMany({
          data: discs.map((d) => ({ profileId: profile.id, disciplineId: d.id })),
        });
      }
      await audit(ctx.prisma, admin.id, "admin.profile.update", profile.id);
      return profile;
    },

    adminImportProfiles: async (
      _: unknown,
      args: { profiles: Array<Record<string, unknown>> },
      ctx: Ctx,
    ) => {
      const admin = requireRole(ctx.user, ["admin", "editor"]);
      const created = [];
      for (const raw of args.profiles) {
        const input = raw as {
          handle: string;
          displayName: string;
          bioShort?: string;
          city?: string;
          websiteUrl?: string;
          instagramUrl?: string;
          disciplineSlugs?: string[];
        };
        const handle = input.handle.toLowerCase();
        const existing = await ctx.prisma.profile.findUnique({ where: { handle } });
        if (existing) {
          created.push(existing);
          continue;
        }
        const profile = await ctx.prisma.profile.create({
          data: {
            handle,
            displayName: input.displayName,
            bioShort: input.bioShort,
            city: input.city,
            websiteUrl: input.websiteUrl,
            instagramUrl: input.instagramUrl,
            claimStatus: "unclaimed",
            isFounding: true,
          },
        });
        if (input.disciplineSlugs?.length) {
          const discs = await ctx.prisma.discipline.findMany({ where: { slug: { in: input.disciplineSlugs } } });
          await ctx.prisma.profileDiscipline.createMany({
            data: discs.map((d) => ({ profileId: profile.id, disciplineId: d.id })),
          });
        }
        created.push(profile);
      }
      await audit(ctx.prisma, admin.id, "admin.profiles.import", undefined, { count: created.length });
      return created;
    },

    adminGenerateClaimLink: async (_: unknown, args: { profileId: string }, ctx: Ctx) => {
      const admin = requireRole(ctx.user, ["admin", "editor"]);
      const profile = await ctx.prisma.profile.findUnique({ where: { id: args.profileId } });
      if (!profile) throw new Error("Profile not found");
      const token = generateToken();
      const expiresAt = claimExpiry(env.claimTokenTtlDays);
      await ctx.prisma.claimToken.create({
        data: {
          profileId: profile.id,
          tokenHash: hashToken(token),
          expiresAt,
          createdBy: admin.id,
        },
      });
      await ctx.prisma.profile.update({
        where: { id: profile.id },
        data: { claimStatus: profile.claimStatus === "claimed" ? "claimed" : "pending" },
      });
      const claimUrl = `${env.publicAppUrl}/#/en/claim/${token}`;
      await audit(ctx.prisma, admin.id, "admin.claim.generate", profile.id);
      return { token, claimUrl, expiresAt };
    },

    adminVerifyProfile: async (_: unknown, args: { id: string; verified: boolean }, ctx: Ctx) => {
      requireRole(ctx.user, ["admin", "editor"]);
      return ctx.prisma.profile.update({
        where: { id: args.id },
        data: { verifiedAt: args.verified ? new Date() : null },
      });
    },

    adminSuspendUser: async (_: unknown, args: { userId: string; suspended: boolean }, ctx: Ctx) => {
      requireRole(ctx.user, ["admin"]);
      return ctx.prisma.user.update({
        where: { id: args.userId },
        data: { status: args.suspended ? "suspended" : "active" },
      });
    },

    adminCreateWork: async (_: unknown, args: { profileId: string; input: Record<string, unknown> }, ctx: Ctx) => {
      requireRole(ctx.user, ["admin", "editor"]);
      const input = args.input as {
        title: string;
        type: "text" | "image" | "audio" | "video";
        description?: string;
        primaryDiscipline?: string;
        externalUrl?: string;
        embedUrl?: string;
        status?: "draft" | "published" | "archived" | "hidden";
        aiGenerated?: boolean;
      };
      const slug = await uniqueSlug(input.title, async (s) => !!(await ctx.prisma.work.findUnique({ where: { slug: s } })));
      const discipline = input.primaryDiscipline
        ? await ctx.prisma.discipline.findUnique({ where: { slug: input.primaryDiscipline } })
        : null;
      const status = input.status ?? "published";
      return ctx.prisma.work.create({
        data: {
          profileId: args.profileId,
          title: input.title,
          slug,
          type: input.type,
          description: input.description,
          externalUrl: input.externalUrl,
          embedUrl: input.embedUrl,
          status,
          primaryDisciplineId: discipline?.id,
          publishedAt: status === "published" ? new Date() : null,
          aiGenerated: input.aiGenerated ?? false,
        },
      });
    },

    adminFeature: async (
      _: unknown,
      args: { entityType: string; entityId: string; placement: string; sortOrder?: number },
      ctx: Ctx,
    ) => {
      requireRole(ctx.user, ["admin", "editor"]);
      return ctx.prisma.editorialFeature.create({
        data: {
          entityType: args.entityType as "profile" | "work" | "opportunity" | "event" | "collection",
          entityId: args.entityId,
          placement: args.placement,
          sortOrder: args.sortOrder ?? 0,
        },
      });
    },

    adminUnfeature: async (_: unknown, args: { id: string }, ctx: Ctx) => {
      requireRole(ctx.user, ["admin", "editor"]);
      await ctx.prisma.editorialFeature.delete({ where: { id: args.id } });
      return true;
    },

    adminResolveReport: async (_: unknown, args: { id: string; status: string }, ctx: Ctx) => {
      const admin = requireRole(ctx.user, ["admin", "editor"]);
      return ctx.prisma.report.update({
        where: { id: args.id },
        data: {
          status: args.status as "resolved" | "dismissed",
          resolvedById: admin.id,
          resolvedAt: new Date(),
        },
      });
    },

    adminCreateEvent: async (_: unknown, args: { input: Record<string, unknown> }, ctx: Ctx) => {
      const admin = requireRole(ctx.user, ["admin", "editor"]);
      const input = args.input as {
        name: string;
        description?: string;
        startsAt: string;
        endsAt?: string;
        venue?: string;
        city?: string;
        category?: string;
        externalUrl?: string;
        imageUrl?: string;
        capacity?: number;
        status?: "draft" | "published" | "cancelled" | "past";
        isHubNight?: boolean;
      };
      const slug = await uniqueSlug(input.name, async (s) => !!(await ctx.prisma.event.findUnique({ where: { slug: s } })));
      return ctx.prisma.event.create({
        data: {
          organizerId: admin.id,
          name: input.name,
          slug,
          description: input.description,
          startsAt: new Date(input.startsAt),
          endsAt: input.endsAt ? new Date(input.endsAt) : null,
          venue: input.venue,
          city: input.city,
          category: input.category,
          externalUrl: input.externalUrl,
          imageUrl: input.imageUrl,
          capacity: input.capacity,
          status: input.status ?? "published",
          isHubNight: input.isHubNight ?? false,
        },
      });
    },

    adminCreateOpportunity: async (
      _: unknown,
      args: { creatorUserId: string; input: Record<string, unknown> },
      ctx: Ctx,
    ) => {
      requireRole(ctx.user, ["admin", "editor"]);
      const input = args.input as {
        title: string;
        description: string;
        roles?: string;
        discipline?: string;
        location?: string;
        remoteMode?: "onsite" | "remote" | "hybrid";
        compensationStatus?: "paid" | "unpaid" | "negotiable" | "tbd";
        deadline?: string;
        imageUrl?: string;
        status?: "open" | "closed" | "draft";
      };
      const slug = await uniqueSlug(input.title, async (s) =>
        !!(await ctx.prisma.opportunity.findUnique({ where: { slug: s } })),
      );
      return ctx.prisma.opportunity.create({
        data: {
          creatorId: args.creatorUserId,
          title: input.title,
          slug,
          description: input.description,
          roles: input.roles,
          discipline: input.discipline,
          location: input.location,
          remoteMode: input.remoteMode,
          compensationStatus: input.compensationStatus,
          deadline: input.deadline ? new Date(input.deadline) : null,
          imageUrl: input.imageUrl ?? `https://picsum.photos/seed/${encodeURIComponent(slug)}-opp/960/540`,
          status: input.status ?? "open",
        },
      });
    },
  },
};
