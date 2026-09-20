/**
 * Creative Hub staging seed (fixture-first).
 *
 * Identity source: apps/api/data/seed/*.json
 * Work semantic metadata: works.meta.json (sidecar — not written to Prisma)
 * AI media: optional later; must never decide which creators/works exist.
 *
 * Phases:
 *   taxonomy → admin → creators → explorers → works → opportunities → interests
 *   → events → follows → contacts → notifications → moderation → editorial → claims
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { loadSeedFixtures } from "./seed/load.js";
import {
  emptyIndex,
  phaseAdmin,
  phaseClaims,
  phaseContacts,
  phaseCreators,
  phaseEditorial,
  phaseEvents,
  phaseExplorers,
  phaseFollows,
  phaseInterests,
  phaseModeration,
  phaseNotifications,
  phaseOpportunities,
  phaseReconcile,
  phaseTaxonomy,
  phaseWorks,
} from "./seed/phases.js";
import { SEED_EPOCH } from "./seed/epoch.js";
import { timedPhase } from "./seed/pool.js";

function seedDatabaseUrl(): string {
  const base = process.env.DATABASE_URL ?? "";
  if (!base) return base;
  const u = new URL(base);
  // Prefer transaction pooler for concurrent upserts — session mode (5432) is
  // shared with Railway and capped at ~15 clients.
  if (u.hostname.includes("pooler.supabase.com") && u.port === "5432") {
    u.port = "6543";
  }
  u.searchParams.set("pgbouncer", "true");
  if (!u.searchParams.has("connection_limit")) u.searchParams.set("connection_limit", "5");
  if (!u.searchParams.has("pool_timeout")) u.searchParams.set("pool_timeout", "30");
  return u.toString();
}

const prisma = new PrismaClient({
  datasources: { db: { url: seedDatabaseUrl() } },
});

async function main() {
  console.log("Seeding Creative Hub (fixture-first staging)…");
  console.log(`SEED_EPOCH=${SEED_EPOCH.toISOString()}`);
  console.log(`SEED_CONCURRENCY=${process.env.SEED_CONCURRENCY ?? "8 (default)"}`);
  {
    const u = new URL(seedDatabaseUrl());
    console.log(`SEED_DB=${u.hostname}:${u.port} (pgbouncer=${u.searchParams.get("pgbouncer")})`);
  }

  const fixtures = loadSeedFixtures();
  const index = emptyIndex();

  await timedPhase("taxonomy", () => phaseTaxonomy(prisma));
  await timedPhase("admin", () => phaseAdmin(prisma, index));
  await timedPhase("creators", () => phaseCreators(prisma, fixtures, index));
  await timedPhase("explorers", () => phaseExplorers(prisma, fixtures, index));
  await timedPhase("works", () => phaseWorks(prisma, fixtures, index));
  await timedPhase("opportunities", () => phaseOpportunities(prisma, fixtures, index));
  await timedPhase("interests", () => phaseInterests(prisma, fixtures, index));
  await timedPhase("events", () => phaseEvents(prisma, fixtures, index));
  await timedPhase("follows", () => phaseFollows(prisma, fixtures, index));
  await timedPhase("contacts", () => phaseContacts(prisma, fixtures, index));
  await timedPhase("notifications", () => phaseNotifications(prisma, fixtures, index));
  await timedPhase("moderation", () => phaseModeration(prisma, fixtures, index));
  await timedPhase("editorial", () => phaseEditorial(prisma, fixtures, index));
  await timedPhase("claims", () => phaseClaims(prisma, fixtures, index));
  await timedPhase("reconcile", () => phaseReconcile(prisma, fixtures));

  const claimed = fixtures.creators.filter((c) => c.claimStatus === "claimed").length;
  const pending = fixtures.creators.filter((c) => c.claimStatus === "pending").length;
  const unclaimed = fixtures.creators.filter((c) => c.claimStatus === "unclaimed").length;
  const worksByDisc = {
    music: fixtures.works.filter((w) => w.primaryDiscipline === "music").length,
    photography: fixtures.works.filter((w) => w.primaryDiscipline === "photography").length,
    film: fixtures.works.filter((w) => w.primaryDiscipline === "film").length,
    writing: fixtures.works.filter((w) => w.primaryDiscipline === "writing").length,
  };

  const counts = {
    profiles: await prisma.profile.count(),
    users: await prisma.user.count(),
    works: await prisma.work.count(),
    follows: await prisma.follow.count(),
    opportunities: await prisma.opportunity.count(),
    interests: await prisma.opportunityInterest.count(),
    events: await prisma.event.count(),
    contacts: await prisma.contactMessage.count(),
    notifications: await prisma.notification.count(),
    reports: await prisma.report.count(),
    waitlist: await prisma.waitlistEntry.count(),
    features: await prisma.editorialFeature.count(),
    claimTokens: await prisma.claimToken.count(),
    workMetaSidecar: fixtures.workMeta.length,
    fixtureCreators: { claimed, pending, unclaimed, explorers: fixtures.explorers.length },
    worksByDisc,
  };

  console.log("Seed complete (staging):", counts);
  console.log(`Admin login: ${process.env.ADMIN_EMAIL ?? "admin@creativehub.local"} / (ADMIN_PASSWORD)`);
  console.log("Member demo password (claimed fixtures): SeedMember123!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
