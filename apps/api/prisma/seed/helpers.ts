import {
  DISCIPLINES,
  WORLD_CITIES,
  CITY_LABELS,
  type DisciplineSlug,
} from "@creative-hub/shared";
import type { PrismaClient } from "@prisma/client";
import { SAMPLE_MEDIA } from "../../src/seed-ai/index.js";
import { hostMediaLocally } from "../../src/seed-ai/index.js";
import { env } from "../../src/env.js";
import type { SeedWorkFixture } from "./types.js";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const seedCacheDir = join(__dirname, "../../data/seed-cache");

const DISCIPLINE_LABELS: Record<
  DisciplineSlug,
  { en: string; fr: string; ar: string; he: string }
> = {
  music: { en: "Music", fr: "Musique", ar: "موسيقى", he: "מוזיקה" },
  photography: { en: "Photography", fr: "Photographie", ar: "تصوير", he: "צילום" },
  film: { en: "Film", fr: "Cinéma", ar: "سينما", he: "קולנוע" },
  writing: { en: "Writing", fr: "Écriture", ar: "كتابة", he: "כתיבה" },
};

export function pravatar(seed: string, size = 400) {
  return `https://i.pravatar.cc/${size}?u=${encodeURIComponent(seed)}`;
}
export function picsumCover(seed: string) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}-cover/1200/400`;
}
export function picsumWork(seed: string) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/800/600`;
}
export function picsumEvent(seed: string) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}-event/960/540`;
}
export function picsumOpp(seed: string) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}-opp/960/540`;
}

export { DISCIPLINE_LABELS, DISCIPLINES, WORLD_CITIES, CITY_LABELS };

export async function upsertTaxonomy(prisma: PrismaClient) {
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
  }

  i = 0;
  for (const slug of WORLD_CITIES) {
    const labels = CITY_LABELS[slug];
    const sortOrder = i++;
    await prisma.city.upsert({
      where: { slug },
      create: {
        slug,
        nameEn: labels.en,
        nameFr: labels.fr,
        nameAr: labels.ar,
        nameHe: labels.he,
        sortOrder,
      },
      update: {
        nameEn: labels.en,
        nameFr: labels.fr,
        nameAr: labels.ar,
        nameHe: labels.he,
        sortOrder,
      },
    });
  }
}

let cachedDisciplines: { id: string; slug: string }[] | null = null;

export async function attachDisciplines(prisma: PrismaClient, profileId: string, slugs: string[]) {
  if (!cachedDisciplines) {
    cachedDisciplines = await prisma.discipline.findMany({ select: { id: true, slug: true } });
  }
  const discs = cachedDisciplines.filter((d) => slugs.includes(d.slug));
  await prisma.profileDiscipline.deleteMany({ where: { profileId } });
  if (discs.length) {
    await prisma.profileDiscipline.createMany({
      data: discs.map((d) => ({ profileId, disciplineId: d.id })),
    });
  }
}

/** Opt-in: download each media URL into seed-cache (slow over remote). Default: keep external URLs. */
const hostMediaEnabled = process.env.SEED_HOST_MEDIA === "1";

export type MediaAssetSeedRow = {
  workId: string;
  kind: string;
  provider: string;
  publicUrl: string | null;
  externalUrl: string;
  mimeType: string;
  moderationStatus: "approved";
};

/** Resolve media URLs for a fixture (no DB). Used for batched createMany. */
export async function mediaRowsForWork(
  workId: string,
  work: SeedWorkFixture,
): Promise<MediaAssetSeedRow[]> {
  const kind =
    work.type === "audio" ? "audio" : work.type === "video" ? "video" : work.type === "image" ? "image" : "file";

  let url: string | null = work.mediaUrl ?? (work.mediaMode === "url" ? null : null);
  if (!url) {
    if (work.type === "audio") url = SAMPLE_MEDIA.audio;
    else if (work.type === "video") url = SAMPLE_MEDIA.video;
    else if (work.type === "image") url = picsumWork(work.slug);
    else url = null;
  }

  const mime =
    work.mediaMime ??
    (work.type === "audio"
      ? "audio/mpeg"
      : work.type === "video"
        ? "video/mp4"
        : work.type === "image"
          ? "image/jpeg"
          : "text/plain");

  const rows: MediaAssetSeedRow[] = [];
  if (url) {
    let hostedUrl = url;
    let hostedMime = mime;
    let provider = work.mediaMode === "picsum" || work.type === "image" ? "picsum" : "sample";
    if (hostMediaEnabled) {
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
        console.warn(`[seed] host local failed for ${work.slug}:`, e instanceof Error ? e.message : e);
      }
    }
    rows.push({
      workId,
      kind,
      provider,
      publicUrl: work.type === "text" ? null : hostedUrl,
      externalUrl: hostedUrl,
      mimeType: hostedMime,
      moderationStatus: "approved",
    });
  }

  if (work.type === "audio" || work.type === "video" || work.type === "text") {
    const coverUrl = picsumWork(`${work.slug}-cover`);
    rows.push({
      workId,
      kind: "image",
      provider: "picsum",
      publicUrl: coverUrl,
      externalUrl: coverUrl,
      mimeType: "image/jpeg",
      moderationStatus: "approved",
    });
  }
  return rows;
}

export async function ensureFixtureWork(
  prisma: PrismaClient,
  profileId: string,
  work: SeedWorkFixture,
  disciplineIdBySlug?: Map<string, string>,
) {
  const description =
    work.type === "text" && work.body
      ? work.body
      : (work.description ?? "Seeded work for Creative Hub.");
  const primaryDisciplineId =
    disciplineIdBySlug?.get(work.primaryDiscipline) ??
    (
      await prisma.discipline.findUnique({ where: { slug: work.primaryDiscipline } })
    )?.id;

  return prisma.work.upsert({
    where: { slug: work.slug },
    create: {
      profileId,
      title: work.title,
      slug: work.slug,
      type: work.type,
      externalUrl: work.externalUrl,
      status: work.status ?? "published",
      publishedAt: work.status === "draft" ? null : new Date("2026-08-15T12:00:00.000Z"),
      primaryDisciplineId,
      description,
      aiGenerated: work.aiGenerated ?? false,
      viewCount: work.viewCount ?? 0,
    },
    update: {
      title: work.title,
      description,
      type: work.type,
      status: work.status ?? "published",
      aiGenerated: work.aiGenerated ?? false,
      viewCount: work.viewCount ?? 0,
      primaryDisciplineId,
      profileId,
    },
  });
}
