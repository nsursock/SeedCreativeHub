import "dotenv/config";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import {
  DISCIPLINES,
  DISCIPLINE_WORK_TYPE,
  LEBANESE_CITIES,
  type DisciplineSlug,
  type WorkType,
} from "@creative-hub/shared";
import { PrismaClient } from "@prisma/client";
import { hashPassword, hashToken } from "../src/auth/session.js";
import { env } from "../src/env.js";
import { claimExpiry, slugify } from "../src/lib/slug.js";
import {
  COST_MODE_BLURBS,
  SAMPLE_MEDIA,
  TEXT_MODELS,
  createSeedMediaGateway,
  generateSeedCreators,
  generateSeedMedia,
  hostMediaLocally,
  resolveLiveMode,
  type GeneratedSeedCreator,
} from "../src/seed-ai/index.js";

const prisma = new PrismaClient();
const __dirname = dirname(fileURLToPath(import.meta.url));
const seedDir = join(__dirname, "../data/seed");
const seedCacheDir = join(__dirname, "../data/seed-cache");
const DISCIPLINE_LABELS: Record<
  DisciplineSlug,
  { en: string; fr: string; ar: string; he: string }
> = {
  music: { en: "Music", fr: "Musique", ar: "موسيقى", he: "מוזיקה" },
  photography: { en: "Photography", fr: "Photographie", ar: "تصوير", he: "צילום" },
  film: { en: "Film", fr: "Cinéma", ar: "سينما", he: "קולנוע" },
  writing: { en: "Writing", fr: "Écriture", ar: "كتابة", he: "כתיבה" },
};

const CITY_LABELS: Record<string, { en: string; fr: string; ar: string; he: string }> = {
  beirut: { en: "Beirut", fr: "Beyrouth", ar: "بيروت", he: "ביירות" },
  tripoli: { en: "Tripoli", fr: "Tripoli", ar: "طرابلس", he: "טריפולי" },
  saida: { en: "Saida", fr: "Saïda", ar: "صيدا", he: "צידון" },
  tyre: { en: "Tyre", fr: "Tyr", ar: "صور", he: "צור" },
  byblos: { en: "Byblos", fr: "Byblos", ar: "جبيل", he: "ביבלוס" },
  zahle: { en: "Zahle", fr: "Zahlé", ar: "زحلة", he: "זחלה" },
  jounieh: { en: "Jounieh", fr: "Jounieh", ar: "جونيه", he: "ג'וניה" },
  baalbek: { en: "Baalbek", fr: "Baalbek", ar: "بعلبك", he: "בעלבק" },
  nabatieh: { en: "Nabatieh", fr: "Nabatiyeh", ar: "النبطية", he: "נבטיה" },
  batroun: { en: "Batroun", fr: "Batroun", ar: "البترون", he: "בטרון" },
  diaspora: { en: "Diaspora", fr: "Diaspora", ar: "الشتات", he: "תפוצות" },
  other: { en: "Other", fr: "Autre", ar: "أخرى", he: "אחר" },
};

function pravatar(seed: string, size = 400) {
  return `https://i.pravatar.cc/${size}?u=${encodeURIComponent(seed)}`;
}
function picsumCover(seed: string) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}-cover/1200/400`;
}
function picsumWork(seed: string) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/800/600`;
}
function picsumEvent(seed: string) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}-event/960/540`;
}
function picsumOpp(seed: string) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}-opp/960/540`;
}

function loadJson<T>(name: string): T {
  return JSON.parse(readFileSync(join(seedDir, name), "utf8")) as T;
}

async function seedTaxonomy() {
  let i = 0;
  for (const slug of DISCIPLINES) {
    const labels = DISCIPLINE_LABELS[slug];
    await prisma.discipline.upsert({
      where: { slug },
      create: {
        slug,
        nameEn: labels.en,
        nameFr: labels.fr,
        nameAr: labels.ar,
        nameHe: labels.he,
        sortOrder: i++,
      },
      update: {
        nameEn: labels.en,
        nameFr: labels.fr,
        nameAr: labels.ar,
        nameHe: labels.he,
        sortOrder: i - 1,
      },
    });
  }

  // Drop disciplines outside phase-1 media scope
  const stale = await prisma.discipline.findMany({
    where: { slug: { notIn: [...DISCIPLINES] } },
  });
  if (stale.length) {
    const ids = stale.map((d) => d.id);
    await prisma.profileDiscipline.deleteMany({ where: { disciplineId: { in: ids } } });
    await prisma.work.updateMany({
      where: { primaryDisciplineId: { in: ids } },
      data: { primaryDisciplineId: null },
    });
    await prisma.discipline.deleteMany({ where: { id: { in: ids } } });
    console.log(`Removed ${stale.length} out-of-scope disciplines`);
  }

  i = 0;
  for (const slug of LEBANESE_CITIES) {
    const labels = CITY_LABELS[slug];
    await prisma.city.upsert({
      where: { slug },
      create: {
        slug,
        nameEn: labels.en,
        nameFr: labels.fr,
        nameAr: labels.ar,
        nameHe: labels.he,
        sortOrder: i++,
      },
      update: {
        nameEn: labels.en,
        nameFr: labels.fr,
        nameAr: labels.ar,
        nameHe: labels.he,
      },
    });
  }
}

async function seedAdmin() {
  const passwordHash = await hashPassword(env.adminPassword);
  const user = await prisma.user.upsert({
    where: { email: env.adminEmail.toLowerCase() },
    create: {
      email: env.adminEmail.toLowerCase(),
      passwordHash,
      role: "admin",
      emailVerifiedAt: new Date(),
      locale: "en",
      profile: {
        create: {
          handle: "admin",
          displayName: "Creative Hub Admin",
          claimStatus: "claimed",
          city: "beirut",
          isFounding: true,
          verifiedAt: new Date(),
          avatarUrl: pravatar("admin"),
          coverUrl: picsumCover("admin"),
        },
      },
    },
    update: { passwordHash, role: "admin", emailVerifiedAt: new Date() },
  });
  await prisma.profile.update({
    where: { handle: "admin" },
    data: { avatarUrl: pravatar("admin"), coverUrl: picsumCover("admin") },
  });
  return user;
}

async function attachDisciplines(profileId: string, slugs: string[] = []) {
  const discs = await prisma.discipline.findMany({ where: { slug: { in: slugs } } });
  await prisma.profileDiscipline.deleteMany({ where: { profileId } });
  if (discs.length) {
    await prisma.profileDiscipline.createMany({
      data: discs.map((d) => ({ profileId, disciplineId: d.id })),
    });
  }
}

async function ensureWork(
  profileId: string,
  work: {
    title: string;
    type: WorkType;
    description?: string;
    body?: string;
    externalUrl?: string;
    primaryDiscipline?: string;
    mediaUrl?: string;
    mediaMime?: string;
    mediaProvider?: string;
  },
  index: number,
) {
  const base = slugify(work.title);
  const slug = `${base}-${profileId.slice(0, 6)}-${index}`;
  let row = await prisma.work.findUnique({ where: { slug } });
  const description =
    work.type === "text" && work.body
      ? work.body
      : (work.description ?? "Seeded work for Creative Hub.");

  if (!row) {
    const discipline = work.primaryDiscipline
      ? await prisma.discipline.findUnique({ where: { slug: work.primaryDiscipline } })
      : null;
    row = await prisma.work.create({
      data: {
        profileId,
        title: work.title,
        slug,
        type: work.type,
        externalUrl: work.externalUrl,
        status: "published",
        publishedAt: new Date(),
        primaryDisciplineId: discipline?.id,
        description,
      },
    });
  } else {
    await prisma.work.update({
      where: { id: row.id },
      data: { description, type: work.type, status: "published" },
    });
  }

  const kind =
    work.type === "audio" ? "audio" : work.type === "video" ? "video" : work.type === "image" ? "image" : "file";
  const url =
    work.mediaUrl ??
    (work.type === "audio"
      ? SAMPLE_MEDIA.audio
      : work.type === "video"
        ? SAMPLE_MEDIA.video
        : work.type === "image"
          ? picsumWork(slug)
          : null);
  const mime =
    work.mediaMime ??
    (work.type === "audio"
      ? "audio/mpeg"
      : work.type === "video"
        ? "video/mp4"
        : work.type === "image"
          ? "image/jpeg"
          : "text/plain");

  if (url || work.type === "text") {
    await prisma.mediaAsset.deleteMany({ where: { workId: row.id } });
    if (url) {
      let hostedUrl = url;
      let hostedMime = mime;
      let provider = work.mediaProvider ?? (work.type === "image" ? "picsum" : "sample");
      try {
        const hosted = await hostMediaLocally({
          url,
          cacheDir: seedCacheDir,
          publicApiUrl: env.publicApiUrl,
          prefix: kind,
        });
        hostedUrl = hosted.localUrl;
        hostedMime = hosted.mimeType || mime;
        provider = "seed-cache";
      } catch (e) {
        console.warn(`[seed] host local failed for ${slug}:`, e instanceof Error ? e.message : e);
      }
      await prisma.mediaAsset.create({
        data: {
          workId: row.id,
          kind,
          provider,
          publicUrl: work.type === "text" ? null : hostedUrl,
          externalUrl: hostedUrl,
          mimeType: hostedMime,
          moderationStatus: "approved",
        },
      });
    }
  }
  return row;
}

async function seedCreatorsFromAi(targetCount: number) {
  const costMode = env.seedAiCostMode;
  const liveMode = resolveLiveMode(env.seedAiMode, Boolean(env.openRouterApiKey.trim()));
  const textModel = env.openRouterModel.trim() || TEXT_MODELS[costMode];
  console.log(`AI seed: live=${liveMode} cost=${costMode} — ${COST_MODE_BLURBS[costMode]}`);
  console.log(`AI seed text model: ${textModel}`);

  const gateway = createSeedMediaGateway(costMode, {
    openRouterApiKey: env.openRouterApiKey,
    openRouterMusicModel: env.openRouterMusicModel,
    // Lyria streams can take >90s — omit so client default (180s) applies
    pixazoApiKey: env.pixazoApiKey,
    freeAiApiKey: env.freeAiApiKey,
    falApiKey: env.falApiKey,
    falAudioModel: env.falAudioModel,
    replicateApiKey: env.replicateApiKey,
    hfToken: env.hfToken,
    hfMusicModel: env.hfMusicModel,
    hfAudioEndpoint: env.hfAudioEndpoint,
    elevenLabsApiKey: env.elevenLabsApiKey,
    elevenLabsVoiceId: env.elevenLabsVoiceId,
    elevenLabsModelId: env.elevenLabsModelId,
    elevenLabsMusicModelId: env.elevenLabsMusicModelId,
    elevenLabsPreferMusic: env.elevenLabsPreferMusic,
    elevenLabsTimeoutMs: env.elevenLabsTimeoutMs,
    publicApiUrl: env.publicApiUrl,
    seedCacheDir,
    pixazoTimeoutMs: env.pixazoTimeoutMs,
    freeAiTimeoutMs: env.freeAiTimeoutMs,
    falTimeoutMs: env.falTimeoutMs,
    replicateTimeoutMs: env.replicateTimeoutMs,
    hfTimeoutMs: env.hfTimeoutMs,
  });

  const bundle = await generateSeedCreators({
    liveMode,
    costMode,
    count: targetCount,
    openRouterApiKey: env.openRouterApiKey,
    openRouterModel: textModel,
    openRouterTimeoutMs: env.openRouterTimeoutMs,
  });
  for (const w of bundle.warnings) console.warn(`[seed-ai] ${w}`);
  if (bundle.model) console.log(`[seed-ai] text model used: ${bundle.model}`);

  const fixtures = loadJson<GeneratedSeedCreator[]>("creators.json");
  const byHandle = new Map<string, GeneratedSeedCreator>();
  for (const c of fixtures) byHandle.set(c.handle, c);
  for (const c of bundle.creators) byHandle.set(c.handle, c);

  const creators = [...byHandle.values()].slice(0, targetCount);
  if (!creators.some((c) => c.handle === "maya_k") && fixtures[0]) {
    creators[0] = fixtures[0];
  }

  const createdIds: string[] = [];
  let workCount = 0;
  let imagesGenerated = 0;
  let videosGenerated = 0;
  let audiosGenerated = 0;

  for (const c of creators) {
    const avatarUrl = pravatar(c.handle);
    const profile = await prisma.profile.upsert({
      where: { handle: c.handle },
      create: {
        handle: c.handle,
        displayName: c.displayName,
        bioShort: c.bioShort,
        city: c.city,
        claimStatus: "unclaimed",
        isFounding: true,
        avatarUrl,
        coverUrl: picsumCover(c.handle),
      },
      update: {
        displayName: c.displayName,
        bioShort: c.bioShort,
        city: c.city,
        avatarUrl,
        coverUrl: picsumCover(c.handle),
      },
    });
    await attachDisciplines(profile.id, c.disciplineSlugs);
    createdIds.push(profile.id);

    for (let i = 0; i < (c.works?.length ?? 0); i++) {
      if (workCount >= env.seedQuotaWorks) break;
      const w = c.works![i];
      const type = w.type ?? DISCIPLINE_WORK_TYPE[w.primaryDiscipline as DisciplineSlug] ?? "text";

      let mediaUrl: string | undefined;
      let mediaMime: string | undefined;
      let mediaProvider: string | undefined;

      if (type === "image" && imagesGenerated < env.seedAiImageCount) {
        const img = await generateSeedMedia(
          "image",
          w.imagePrompt ?? w.description ?? w.title,
          gateway,
        );
        if (img.warning) console.warn(`[seed-ai] ${img.warning}`);
        mediaUrl = img.url;
        mediaMime = img.mimeType;
        mediaProvider = img.provider;
        imagesGenerated++;
      } else if (type === "audio" && audiosGenerated < env.seedAiAudioCount) {
        const audio = await generateSeedMedia(
          "audio",
          w.audioPrompt ?? w.description ?? w.title,
          gateway,
        );
        if (audio.warning) console.warn(`[seed-ai] ${audio.warning}`);
        mediaUrl = audio.url;
        mediaMime = audio.mimeType;
        mediaProvider = audio.provider;
        audiosGenerated++;
      } else if (type === "audio") {
        mediaUrl = SAMPLE_MEDIA.audio;
        mediaMime = "audio/mpeg";
        mediaProvider = "sample";
      } else if (type === "video" && videosGenerated < env.seedAiVideoCount) {
        const video = await generateSeedMedia(
          "video",
          w.videoPrompt ?? w.description ?? w.title,
          gateway,
        );
        if (video.warning) console.warn(`[seed-ai] ${video.warning}`);
        mediaUrl = video.url;
        mediaMime = video.mimeType;
        mediaProvider = video.provider;
        videosGenerated++;
      } else if (type === "video") {
        mediaUrl = SAMPLE_MEDIA.video;
        mediaMime = "video/mp4";
        mediaProvider = "sample";
      }

      await ensureWork(
        profile.id,
        {
          title: w.title,
          type,
          description: w.description,
          body: w.body,
          primaryDiscipline: w.primaryDiscipline,
          mediaUrl,
          mediaMime,
          mediaProvider,
        },
        i,
      );
      workCount++;
    }

    if (c.handle === "maya_k") {
      const token = "demo-claim-token-maya-k-phase1";
      await prisma.claimToken.upsert({
        where: { tokenHash: hashToken(token) },
        create: {
          profileId: profile.id,
          tokenHash: hashToken(token),
          expiresAt: claimExpiry(env.claimTokenTtlDays),
        },
        update: { expiresAt: claimExpiry(env.claimTokenTtlDays), usedAt: null },
      });
      await prisma.profile.update({ where: { id: profile.id }, data: { claimStatus: "pending" } });
      console.log(`Demo claim URL: ${env.publicAppUrl}/#/en/claim/${token}`);
    }
  }

  let n = creators.length;
  while (n < targetCount) {
    const disc = DISCIPLINES[n % DISCIPLINES.length];
    const handle = `creator_${String(n + 1).padStart(3, "0")}`;
    const city = LEBANESE_CITIES[n % LEBANESE_CITIES.length];
    const avatarUrl = pravatar(handle);
    const profile = await prisma.profile.upsert({
      where: { handle },
      create: {
        handle,
        displayName: `Creator ${n + 1}`,
        bioShort: `${disc} maker around ${city}.`,
        city,
        claimStatus: "unclaimed",
        isFounding: true,
        avatarUrl,
        coverUrl: picsumCover(handle),
      },
      update: { avatarUrl, coverUrl: picsumCover(handle) },
    });
    await attachDisciplines(profile.id, [disc]);
    createdIds.push(profile.id);

    if (workCount < env.seedQuotaWorks && n % 2 === 0) {
      const type = DISCIPLINE_WORK_TYPE[disc];
      await ensureWork(
        profile.id,
        {
          title: `${handle} ${disc} piece`,
          type,
          description: `Seeded ${type} work.`,
          primaryDiscipline: disc,
          mediaUrl: type === "audio" ? SAMPLE_MEDIA.audio : type === "video" ? SAMPLE_MEDIA.video : undefined,
          mediaMime: type === "audio" ? "audio/mpeg" : type === "video" ? "video/mp4" : undefined,
          mediaProvider: type === "image" ? "picsum" : "sample",
        },
        0,
      );
      workCount++;
    }
    n++;
  }

  return {
    createdIds,
    workCount,
    imagesGenerated,
    videosGenerated,
    audiosGenerated,
    liveMode: bundle.liveMode,
    costMode: bundle.costMode,
  };
}

async function seedOpportunities(adminUserId: string) {
  const rows = loadJson<
    Array<{
      title: string;
      description: string;
      roles?: string;
      discipline?: string;
      location?: string;
      remoteMode?: "onsite" | "remote" | "hybrid";
      compensationStatus?: "paid" | "unpaid" | "negotiable" | "tbd";
    }>
  >("opportunities.json");

  for (const row of rows) {
    const slug = slugify(row.title);
    const imageUrl = picsumOpp(slug);
    await prisma.opportunity.upsert({
      where: { slug },
      create: {
        creatorId: adminUserId,
        title: row.title,
        slug,
        description: row.description,
        roles: row.roles,
        discipline: row.discipline,
        location: row.location,
        remoteMode: row.remoteMode,
        compensationStatus: row.compensationStatus,
        imageUrl,
        status: "open",
      },
      update: { description: row.description, status: "open", imageUrl },
    });
  }
}

async function seedEvents(adminUserId: string) {
  const rows = loadJson<
    Array<{
      name: string;
      description?: string;
      venue?: string;
      city?: string;
      category?: string;
      isHubNight?: boolean;
      daysFromNow: number;
      externalUrl?: string;
    }>
  >("events.json");

  for (const row of rows) {
    const slug = slugify(row.name);
    const startsAt = new Date(Date.now() + row.daysFromNow * 86400000);
    await prisma.event.upsert({
      where: { slug },
      create: {
        organizerId: adminUserId,
        name: row.name,
        slug,
        description: row.description,
        venue: row.venue,
        city: row.city,
        category: row.category,
        isHubNight: row.isHubNight ?? false,
        externalUrl: row.externalUrl,
        imageUrl: picsumEvent(slug),
        startsAt,
        status: "published",
      },
      update: {
        description: row.description,
        startsAt,
        status: "published",
        imageUrl: picsumEvent(slug),
      },
    });
  }
}

async function seedEditorial(_profileIds: string[]) {
  await prisma.editorialFeature.deleteMany({});
  const profiles = await prisma.profile.findMany({ take: 8, orderBy: { createdAt: "asc" } });
  const works = await prisma.work.findMany({ where: { status: "published" }, take: 8 });
  const events = await prisma.event.findMany({ where: { status: "published" }, take: 4 });
  const opps = await prisma.opportunity.findMany({ where: { status: "open" }, take: 4 });

  let order = 0;
  for (const p of profiles) {
    await prisma.editorialFeature.create({
      data: {
        entityType: "profile",
        entityId: p.id,
        placement: "explore_featured_creators",
        sortOrder: order++,
      },
    });
  }
  order = 0;
  for (const w of works) {
    await prisma.editorialFeature.create({
      data: {
        entityType: "work",
        entityId: w.id,
        placement: "explore_featured_works",
        sortOrder: order++,
      },
    });
  }
  order = 0;
  for (const e of events) {
    await prisma.editorialFeature.create({
      data: {
        entityType: "event",
        entityId: e.id,
        placement: "explore_upcoming_events",
        sortOrder: order++,
      },
    });
  }
  order = 0;
  for (const o of opps) {
    await prisma.editorialFeature.create({
      data: {
        entityType: "opportunity",
        entityId: o.id,
        placement: "explore_opportunities",
        sortOrder: order++,
      },
    });
  }
}

async function main() {
  console.log("Seeding Creative Hub (music · photos · films · writings)…");
  await seedTaxonomy();
  const admin = await seedAdmin();
  const seedStats = await seedCreatorsFromAi(env.seedQuotaCreators);
  await seedOpportunities(admin.id);
  await seedEvents(admin.id);
  await seedEditorial(seedStats.createdIds);

  const counts = {
    profiles: await prisma.profile.count(),
    works: await prisma.work.count(),
    opportunities: await prisma.opportunity.count(),
    events: await prisma.event.count(),
    features: await prisma.editorialFeature.count(),
    disciplines: await prisma.discipline.count(),
  };
  console.log("Seed complete:", counts, {
    generatedWorksThisRun: seedStats.workCount,
    aiImages: seedStats.imagesGenerated,
    aiVideos: seedStats.videosGenerated,
    aiAudios: seedStats.audiosGenerated,
    liveMode: seedStats.liveMode,
    costMode: seedStats.costMode,
  });
  console.log(`Admin login: ${env.adminEmail} / (ADMIN_PASSWORD)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
