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

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding Creative Hub (fixture-first staging)…");
  console.log(`SEED_EPOCH=${SEED_EPOCH.toISOString()}`);

  const fixtures = loadSeedFixtures();
  const index = emptyIndex();

  await phaseTaxonomy(prisma);
  await phaseAdmin(prisma, index);
  await phaseCreators(prisma, fixtures, index);
  await phaseExplorers(prisma, fixtures, index);
  await phaseWorks(prisma, fixtures, index);
  await phaseOpportunities(prisma, fixtures, index);
  await phaseInterests(prisma, fixtures, index);
  await phaseEvents(prisma, fixtures, index);
  await phaseFollows(prisma, fixtures, index);
  await phaseContacts(prisma, fixtures, index);
  await phaseNotifications(prisma, fixtures, index);
  await phaseModeration(prisma, fixtures, index);
  await phaseEditorial(prisma, fixtures, index);
  await phaseClaims(prisma, fixtures, index);
  await phaseReconcile(prisma, fixtures);

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
