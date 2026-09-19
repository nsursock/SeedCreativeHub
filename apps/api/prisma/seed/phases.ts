/**
 * Phased staging seed — fixtures are identity; optional Seed AI is media-only (not used in POC).
 *
 * taxonomy → admin → creators → explorers → works → opportunities → interests
 *   → events → follows → contacts → notifications → moderation → editorial → claims
 */
import type { PrismaClient } from "@prisma/client";
import { hashPassword, hashToken } from "../../src/auth/session.js";
import { env } from "../../src/env.js";
import { DEFAULT_SEED_MEMBER_PASSWORD, daysFromEpoch, hoursAfter, seedEmail } from "./epoch.js";
import { buildFollowEdges } from "./followGraph.js";
import {
  attachDisciplines,
  ensureFixtureWork,
  picsumCover,
  picsumEvent,
  picsumOpp,
  pravatar,
  upsertTaxonomy,
} from "./helpers.js";
import type { SeedFixtures } from "./load.js";
import type { SeedHandleIndex } from "./types.js";

export function emptyIndex(): SeedHandleIndex {
  return {
    userIdByHandle: new Map(),
    profileIdByHandle: new Map(),
    workIdBySlug: new Map(),
    opportunityIdBySlug: new Map(),
    eventIdBySlug: new Map(),
  };
}

export async function phaseTaxonomy(prisma: PrismaClient) {
  await upsertTaxonomy(prisma);
}

export async function phaseAdmin(prisma: PrismaClient, index: SeedHandleIndex) {
  const passwordHash = await hashPassword(env.adminPassword);
  const user = await prisma.user.upsert({
    where: { email: env.adminEmail.toLowerCase() },
    create: {
      email: env.adminEmail.toLowerCase(),
      passwordHash,
      role: "admin",
      emailVerifiedAt: new Date("2026-08-01T12:00:00.000Z"),
      locale: "en",
      profile: {
        create: {
          handle: "admin",
          displayName: "Creative Hub Admin",
          claimStatus: "claimed",
          city: "beirut",
          country: "Lebanon",
          isFounding: true,
          verifiedAt: new Date("2026-08-01T12:00:00.000Z"),
          avatarUrl: pravatar("admin"),
          coverUrl: picsumCover("admin"),
        },
      },
    },
    update: { passwordHash, role: "admin", emailVerifiedAt: new Date("2026-08-01T12:00:00.000Z") },
  });
  const profile = await prisma.profile.update({
    where: { handle: "admin" },
    data: { avatarUrl: pravatar("admin"), coverUrl: picsumCover("admin"), userId: user.id },
  });
  index.userIdByHandle.set("admin", user.id);
  index.profileIdByHandle.set("admin", profile.id);
  return user;
}

async function upsertClaimedProfile(
  prisma: PrismaClient,
  index: SeedHandleIndex,
  opts: {
    handle: string;
    email: string;
    password: string;
    displayName: string;
    bioShort?: string;
    bioLong?: string;
    city: string;
    country?: string;
    claimStatus: "claimed" | "pending" | "unclaimed";
    availability?: string;
    websiteUrl?: string;
    instagramUrl?: string;
    isFounding?: boolean;
    locale?: string;
    disciplineSlugs: string[];
    userStatus?: "active" | "suspended" | "deleted";
    createUser: boolean;
  },
) {
  let userId: string | undefined;
  if (opts.createUser) {
    const passwordHash = await hashPassword(opts.password);
    const user = await prisma.user.upsert({
      where: { email: opts.email },
      create: {
        email: opts.email,
        passwordHash,
        role: "member",
        status: opts.userStatus ?? "active",
        emailVerifiedAt: new Date("2026-08-01T12:00:00.000Z"),
        locale: opts.locale ?? "en",
      },
      update: {
        passwordHash,
        status: opts.userStatus ?? "active",
        locale: opts.locale ?? "en",
      },
    });
    userId = user.id;
    index.userIdByHandle.set(opts.handle, user.id);
  }

  const avatarUrl = pravatar(opts.handle);
  const coverUrl = picsumCover(opts.handle);
  const profile = await prisma.profile.upsert({
    where: { handle: opts.handle },
    create: {
      handle: opts.handle,
      displayName: opts.displayName,
      bioShort: opts.bioShort,
      bioLong: opts.bioLong,
      city: opts.city,
      country: opts.country ?? "Lebanon",
      claimStatus: opts.claimStatus,
      availability: opts.availability,
      websiteUrl: opts.websiteUrl,
      instagramUrl: opts.instagramUrl,
      isFounding: opts.isFounding ?? false,
      avatarUrl,
      coverUrl,
      userId: userId ?? null,
    },
    update: {
      displayName: opts.displayName,
      bioShort: opts.bioShort,
      bioLong: opts.bioLong,
      city: opts.city,
      country: opts.country ?? "Lebanon",
      claimStatus: opts.claimStatus,
      availability: opts.availability,
      websiteUrl: opts.websiteUrl,
      instagramUrl: opts.instagramUrl,
      isFounding: opts.isFounding ?? false,
      avatarUrl,
      coverUrl,
      userId: userId ?? null,
    },
  });
  index.profileIdByHandle.set(opts.handle, profile.id);
  await attachDisciplines(prisma, profile.id, opts.disciplineSlugs);
  return profile;
}

export async function phaseCreators(
  prisma: PrismaClient,
  fixtures: SeedFixtures,
  index: SeedHandleIndex,
) {
  for (const c of fixtures.creators) {
    // Only claimed profiles get a User (required for follows / opps / contacts).
    // pending/unclaimed stay user-less for the claim-token flow.
    await upsertClaimedProfile(prisma, index, {
      handle: c.handle,
      email: seedEmail(c.handle),
      password: c.password ?? DEFAULT_SEED_MEMBER_PASSWORD,
      displayName: c.displayName,
      bioShort: c.bioShort,
      bioLong: c.bioLong,
      city: c.city,
      country: c.country,
      claimStatus: c.claimStatus,
      availability: c.availability,
      websiteUrl: c.websiteUrl,
      instagramUrl: c.instagramUrl,
      isFounding: c.isFounding,
      locale: c.locale,
      disciplineSlugs: c.disciplineSlugs,
      userStatus: c.userStatus,
      createUser: c.claimStatus === "claimed",
    });
  }
}

export async function phaseExplorers(
  prisma: PrismaClient,
  fixtures: SeedFixtures,
  index: SeedHandleIndex,
) {
  for (const e of fixtures.explorers) {
    await upsertClaimedProfile(prisma, index, {
      handle: e.handle,
      email: seedEmail(e.handle),
      password: e.password ?? DEFAULT_SEED_MEMBER_PASSWORD,
      displayName: e.displayName,
      bioShort: e.bioShort ?? `${e.displayName} explores Creative Hub.`,
      bioLong: e.bioLong,
      city: e.city,
      country: e.country ?? "Lebanon",
      claimStatus: "claimed",
      disciplineSlugs: e.disciplineSlugs ?? [],
      locale: e.locale,
      userStatus: e.userStatus,
      createUser: true,
    });
  }
}

export async function phaseWorks(
  prisma: PrismaClient,
  fixtures: SeedFixtures,
  index: SeedHandleIndex,
) {
  // Sidecar meta is loaded but never written to Prisma (Pulse / Research Lab later).
  const metaBySlug = new Map(fixtures.workMeta.map((m) => [m.slug, m]));
  if (metaBySlug.size) {
    console.log(`[seed] work metadata sidecar entries: ${metaBySlug.size} (not written to DB)`);
  }

  for (const w of fixtures.works) {
    const profileId = index.profileIdByHandle.get(w.creatorHandle);
    if (!profileId) {
      console.warn(`[seed] skip work ${w.slug}: unknown creator ${w.creatorHandle}`);
      continue;
    }
    const row = await ensureFixtureWork(prisma, profileId, w);
    index.workIdBySlug.set(w.slug, row.id);
  }
}

export async function phaseOpportunities(
  prisma: PrismaClient,
  fixtures: SeedFixtures,
  index: SeedHandleIndex,
) {
  for (const row of fixtures.opportunities) {
    const creatorId =
      index.userIdByHandle.get(row.creatorHandle) ?? index.userIdByHandle.get("admin");
    if (!creatorId) continue;
    const imageUrl = picsumOpp(row.slug);
    const opp = await prisma.opportunity.upsert({
      where: { slug: row.slug },
      create: {
        creatorId,
        title: row.title,
        slug: row.slug,
        description: row.description,
        roles: row.roles,
        discipline: row.discipline,
        location: row.location,
        remoteMode: row.remoteMode,
        compensationStatus: row.compensationStatus,
        deadline:
          row.deadlineDaysFromEpoch == null
            ? null
            : daysFromEpoch(row.deadlineDaysFromEpoch),
        imageUrl,
        status: row.status ?? "open",
      },
      update: {
        description: row.description,
        status: row.status ?? "open",
        imageUrl,
        creatorId,
        roles: row.roles,
        discipline: row.discipline,
        location: row.location,
        remoteMode: row.remoteMode,
        compensationStatus: row.compensationStatus,
      },
    });
    index.opportunityIdBySlug.set(row.slug, opp.id);
  }
}

export async function phaseInterests(
  prisma: PrismaClient,
  fixtures: SeedFixtures,
  index: SeedHandleIndex,
) {
  for (const row of fixtures.interests) {
    const opportunityId = index.opportunityIdBySlug.get(row.opportunitySlug);
    const userId = index.userIdByHandle.get(row.fromHandle);
    if (!opportunityId || !userId) continue;
    await prisma.opportunityInterest.upsert({
      where: { opportunityId_userId: { opportunityId, userId } },
      create: { opportunityId, userId, message: row.message },
      update: { message: row.message },
    });
  }
}

export async function phaseEvents(
  prisma: PrismaClient,
  fixtures: SeedFixtures,
  index: SeedHandleIndex,
) {
  for (const row of fixtures.events) {
    const organizerId =
      index.userIdByHandle.get(row.organizerHandle) ?? index.userIdByHandle.get("admin");
    const startsAt = daysFromEpoch(row.daysFromEpoch);
    const endsAt = hoursAfter(startsAt, row.durationHours ?? 3);
    const status =
      row.status ?? (row.daysFromEpoch < 0 ? "past" : "published");
    const ev = await prisma.event.upsert({
      where: { slug: row.slug },
      create: {
        organizerId,
        name: row.name,
        slug: row.slug,
        description: row.description,
        venue: row.venue,
        city: row.city,
        category: row.category,
        isHubNight: row.isHubNight ?? false,
        externalUrl: row.externalUrl,
        imageUrl: picsumEvent(row.slug),
        startsAt,
        endsAt,
        status,
        capacity: row.capacity,
      },
      update: {
        description: row.description,
        startsAt,
        endsAt,
        status,
        imageUrl: picsumEvent(row.slug),
        organizerId,
        isHubNight: row.isHubNight ?? false,
      },
    });
    index.eventIdBySlug.set(row.slug, ev.id);
  }
}

export async function phaseFollows(
  prisma: PrismaClient,
  fixtures: SeedFixtures,
  index: SeedHandleIndex,
) {
  const hubOrganizerHandles = fixtures.events
    .filter((e) => e.isHubNight)
    .map((e) => e.organizerHandle);

  const edges = buildFollowEdges({
    explorers: fixtures.explorers,
    followableCreators: fixtures.creators.filter((c) => c.claimStatus === "claimed"),
    hubOrganizerHandles,
  });

  // Reconcile: remove seed-member follows among known handles, then recreate
  const memberUserIds = [...index.userIdByHandle.entries()]
    .filter(([h]) => h !== "admin")
    .map(([, id]) => id);

  if (memberUserIds.length) {
    await prisma.follow.deleteMany({
      where: {
        followerId: { in: memberUserIds },
        followingId: { in: memberUserIds },
      },
    });
  }

  let created = 0;
  for (const edge of edges) {
    const followerId = index.userIdByHandle.get(edge.followerHandle);
    const followingId = index.userIdByHandle.get(edge.followingHandle);
    if (!followerId || !followingId || followerId === followingId) continue;
    await prisma.follow.upsert({
      where: { followerId_followingId: { followerId, followingId } },
      create: { followerId, followingId },
      update: {},
    });
    created++;
  }
  console.log(`[seed] follows: ${created} (persona-driven)`);
  return created;
}

export async function phaseContacts(
  prisma: PrismaClient,
  fixtures: SeedFixtures,
  index: SeedHandleIndex,
) {
  // Deterministic reconciliation: delete contacts between seed users, re-insert
  const seedUserIds = [...index.userIdByHandle.values()];
  if (seedUserIds.length && fixtures.contacts.length) {
    await prisma.contactMessage.deleteMany({
      where: { fromUserId: { in: seedUserIds } },
    });
  }

  for (const row of fixtures.contacts) {
    const fromUserId = index.userIdByHandle.get(row.fromHandle);
    const toUserId = index.userIdByHandle.get(row.toHandle);
    const toProfileId = index.profileIdByHandle.get(row.toHandle);
    if (!fromUserId || !toProfileId) continue;
    await prisma.contactMessage.create({
      data: {
        fromUserId,
        toUserId: toUserId ?? null,
        toProfileId,
        subject: row.subject,
        message: row.message,
      },
    });
  }
}

export async function phaseNotifications(
  prisma: PrismaClient,
  fixtures: SeedFixtures,
  index: SeedHandleIndex,
) {
  const seedUserIds = [...index.userIdByHandle.values()];
  if (seedUserIds.length && fixtures.notifications.length) {
    await prisma.notification.deleteMany({
      where: { userId: { in: seedUserIds } },
    });
  }

  for (const row of fixtures.notifications) {
    const userId = index.userIdByHandle.get(row.userHandle);
    if (!userId) continue;
    await prisma.notification.create({
      data: {
        userId,
        type: row.type,
        title: row.title,
        body: row.body,
        payload: row.payload ?? undefined,
        readAt: row.read ? daysFromEpoch(0) : null,
      },
    });
  }
}

export async function phaseModeration(
  prisma: PrismaClient,
  fixtures: SeedFixtures,
  index: SeedHandleIndex,
) {
  for (const row of fixtures.waitlist) {
    await prisma.waitlistEntry.upsert({
      where: { email: row.email.toLowerCase() },
      create: {
        email: row.email.toLowerCase(),
        displayName: row.displayName,
        disciplines: row.disciplines ?? [],
        locale: row.locale ?? "en",
        referralCode: row.referralCode,
      },
      update: {
        displayName: row.displayName,
        disciplines: row.disciplines ?? [],
        locale: row.locale ?? "en",
      },
    });
  }

  // Reports: reconcile by deleting open seed reports from known reporters then recreate
  if (fixtures.reports.length) {
    const reporterIds = fixtures.reports
      .map((r) => index.userIdByHandle.get(r.reporterHandle))
      .filter((id): id is string => Boolean(id));
    if (reporterIds.length) {
      await prisma.report.deleteMany({ where: { reporterId: { in: reporterIds } } });
    }
  }

  for (const row of fixtures.reports) {
    const reporterId = index.userIdByHandle.get(row.reporterHandle);
    if (!reporterId) continue;
    let entityId: string | undefined;
    if (row.entityType === "profile" || row.entityType === "user") {
      entityId =
        row.entityType === "user"
          ? index.userIdByHandle.get(row.entityRef)
          : index.profileIdByHandle.get(row.entityRef);
    } else if (row.entityType === "work") {
      entityId = index.workIdBySlug.get(row.entityRef);
    } else if (row.entityType === "opportunity") {
      entityId = index.opportunityIdBySlug.get(row.entityRef);
    } else if (row.entityType === "event") {
      entityId = index.eventIdBySlug.get(row.entityRef);
    }
    if (!entityId) continue;

    const resolvedById = row.resolvedByHandle
      ? index.userIdByHandle.get(row.resolvedByHandle)
      : undefined;

    await prisma.report.create({
      data: {
        reporterId,
        entityType: row.entityType,
        entityId,
        reason: row.reason,
        details: row.details,
        status: row.status,
        resolvedById: resolvedById ?? null,
        resolvedAt: row.status === "open" ? null : daysFromEpoch(5),
      },
    });
  }

  for (const row of fixtures.audits) {
    const actorId = row.actorHandle ? index.userIdByHandle.get(row.actorHandle) : null;
    // Idempotent-ish: drop prior seed.bootstrap / matching action+target for this actor
    if (actorId) {
      await prisma.auditLog.deleteMany({
        where: { actorId, action: row.action, target: row.target ?? undefined },
      });
    }
    await prisma.auditLog.create({
      data: {
        actorId: actorId ?? null,
        action: row.action,
        target: row.target,
        metadata: row.metadata ?? undefined,
      },
    });
  }
}

export async function phaseEditorial(
  prisma: PrismaClient,
  fixtures: SeedFixtures,
  index: SeedHandleIndex,
) {
  await prisma.editorialFeature.deleteMany({});

  if (fixtures.editorial.length) {
    for (const row of fixtures.editorial) {
      let entityId: string | undefined;
      if (row.entityType === "profile") entityId = index.profileIdByHandle.get(row.entityRef);
      else if (row.entityType === "work") entityId = index.workIdBySlug.get(row.entityRef);
      else if (row.entityType === "opportunity")
        entityId = index.opportunityIdBySlug.get(row.entityRef);
      else if (row.entityType === "event") entityId = index.eventIdBySlug.get(row.entityRef);
      if (!entityId) continue;
      await prisma.editorialFeature.create({
        data: {
          entityType: row.entityType,
          entityId,
          placement: row.placement,
          sortOrder: row.sortOrder,
        },
      });
    }
    return;
  }

  // Fallback: feature first fixtures when editorial.json empty
  let order = 0;
  for (const c of fixtures.creators.slice(0, 8)) {
    const id = index.profileIdByHandle.get(c.handle);
    if (!id) continue;
    await prisma.editorialFeature.create({
      data: {
        entityType: "profile",
        entityId: id,
        placement: "explore_featured_creators",
        sortOrder: order++,
      },
    });
  }
  order = 0;
  for (const w of fixtures.works.slice(0, 5)) {
    const id = index.workIdBySlug.get(w.slug);
    if (!id) continue;
    await prisma.editorialFeature.create({
      data: {
        entityType: "work",
        entityId: id,
        placement: "explore_featured_works",
        sortOrder: order++,
      },
    });
  }
}

export async function phaseClaims(
  prisma: PrismaClient,
  fixtures: SeedFixtures,
  index: SeedHandleIndex,
) {
  for (const row of fixtures.claimTokens) {
    const profileId = index.profileIdByHandle.get(row.profileHandle);
    if (!profileId) continue;
    const tokenHash = hashToken(row.token);
    await prisma.claimToken.upsert({
      where: { tokenHash },
      create: {
        profileId,
        tokenHash,
        expiresAt: daysFromEpoch(row.expiresDaysFromEpoch),
        usedAt: row.used ? daysFromEpoch(1) : null,
      },
      update: {
        profileId,
        expiresAt: daysFromEpoch(row.expiresDaysFromEpoch),
        usedAt: row.used ? daysFromEpoch(1) : null,
      },
    });
    if (!row.used) {
      await prisma.profile.update({
        where: { id: profileId },
        data: { claimStatus: "pending" },
      });
    }
    if (row.profileHandle === "maya_k") {
      console.log(`Demo claim URL: ${env.publicAppUrl}/#/en/claim/${row.token}`);
    }
  }
}

/**
 * Remove leftover rows from older seeds (AI fillers, renamed slugs)
 * so re-runs converge on the fixture dataset.
 */
export async function phaseReconcile(
  prisma: PrismaClient,
  fixtures: SeedFixtures,
) {
  const workSlugs = fixtures.works.map((w) => w.slug);
  const oppSlugs = fixtures.opportunities.map((o) => o.slug);
  const eventSlugs = fixtures.events.map((e) => e.slug);
  const handles = new Set([
    "admin",
    ...fixtures.creators.map((c) => c.handle),
    ...fixtures.explorers.map((e) => e.handle),
  ]);
  const claimTokens = new Set(fixtures.claimTokens.map((t) => hashToken(t.token)));

  const orphanWorks = await prisma.work.deleteMany({
    where: { slug: { notIn: workSlugs } },
  });
  const orphanOpps = await prisma.opportunity.deleteMany({
    where: { slug: { notIn: oppSlugs } },
  });
  const orphanEvents = await prisma.event.deleteMany({
    where: { slug: { notIn: eventSlugs } },
  });

  const extraProfiles = await prisma.profile.findMany({
    where: { handle: { notIn: [...handles] } },
    include: { user: true },
  });
  let prunedProfiles = 0;
  for (const p of extraProfiles) {
    const email = p.user?.email ?? "";
    const legacyFiller = /^creator_\d+$/.test(p.handle);
    const seedEmail = email.startsWith("seed+");
    if (legacyFiller || seedEmail || !p.userId) {
      if (p.userId) {
        await prisma.user.delete({ where: { id: p.userId } });
      } else {
        await prisma.profile.delete({ where: { id: p.id } });
      }
      prunedProfiles++;
    }
  }

  const orphanClaims = await prisma.claimToken.deleteMany({
    where: { tokenHash: { notIn: [...claimTokens] } },
  });

  console.log("[seed] reconcile:", {
    orphanWorks: orphanWorks.count,
    orphanOpps: orphanOpps.count,
    orphanEvents: orphanEvents.count,
    prunedProfiles,
    orphanClaims: orphanClaims.count,
  });
}
