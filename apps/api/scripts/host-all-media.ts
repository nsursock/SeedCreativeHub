/**
 * 1) Regen Corniche After Midnight via Pixazo (or Free.ai) and host on /seed-media
 * 2) Mirror every external work/avatar/event/opportunity image onto /seed-media
 */
import "dotenv/config";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { env } from "../src/env.js";
import {
  createSeedMediaGateway,
  generateSeedMedia,
  hostMediaLocally,
  isSeedHosted,
} from "../src/seed-ai/index.js";

const prisma = new PrismaClient();
const cacheDir = join(process.cwd(), "data", "seed-cache");
const publicApiUrl = env.publicApiUrl;

async function hostUrl(url: string, prefix: string) {
  return hostMediaLocally({ url, cacheDir, publicApiUrl, prefix, timeoutMs: 120_000 });
}

async function regenCorniche() {
  const work = await prisma.work.findFirst({
    where: { slug: "corniche-after-midnight-ca910d-0" },
    include: { media: true },
  });
  if (!work) throw new Error("corniche-after-midnight-ca910d-0 not found");

  const gateway = createSeedMediaGateway(env.seedAiCostMode, {
    openRouterApiKey: env.openRouterApiKey,
    pixazoApiKey: env.pixazoApiKey,
    freeAiApiKey: env.freeAiApiKey,
    falApiKey: env.falApiKey,
    replicateApiKey: env.replicateApiKey,
    hfToken: env.hfToken,
    elevenLabsApiKey: env.elevenLabsApiKey,
    publicApiUrl,
    seedCacheDir: cacheDir,
    pixazoTimeoutMs: env.pixazoTimeoutMs,
    freeAiTimeoutMs: env.freeAiTimeoutMs,
  });

  const prompt =
    work.description?.trim() ||
    "Beirut Corniche after midnight, sodium streetlights on wet asphalt, cinematic night photography, empty promenade";
  console.log("[regen] Corniche prompt:", prompt);
  const img = await generateSeedMedia("image", prompt, gateway);
  console.log("[regen] provider", img.provider, img.model, img.url.slice(0, 100));

  const hosted = await hostUrl(img.url, "corniche");
  await prisma.mediaAsset.deleteMany({ where: { workId: work.id } });
  await prisma.mediaAsset.create({
    data: {
      workId: work.id,
      kind: "image",
      provider: img.provider === "picsum" ? "seed-cache" : img.provider,
      publicUrl: hosted.localUrl,
      externalUrl: hosted.localUrl,
      mimeType: hosted.mimeType || img.mimeType,
      moderationStatus: "approved",
    },
  });
  console.log("[regen] hosted", hosted.localUrl, `(${hosted.bytes} bytes)`);
}

async function mirrorAll() {
  let ok = 0;
  let fail = 0;
  let skip = 0;

  const assets = await prisma.mediaAsset.findMany();
  for (const a of assets) {
    const url = a.publicUrl || a.externalUrl;
    if (!url) {
      skip++;
      continue;
    }
    if (isSeedHosted(url, publicApiUrl)) {
      skip++;
      continue;
    }
    try {
      const hosted = await hostUrl(url, a.kind || "media");
      await prisma.mediaAsset.update({
        where: { id: a.id },
        data: {
          publicUrl: hosted.localUrl,
          externalUrl: hosted.localUrl,
          mimeType: hosted.mimeType || a.mimeType,
          provider: "seed-cache",
        },
      });
      ok++;
      if (ok % 10 === 0) console.log(`[mirror] assets ${ok}…`);
    } catch (e) {
      fail++;
      console.warn(`[mirror] asset ${a.id}:`, e instanceof Error ? e.message : e);
    }
  }

  const profiles = await prisma.profile.findMany({ where: { avatarUrl: { not: null } } });
  for (const p of profiles) {
    if (!p.avatarUrl || isSeedHosted(p.avatarUrl, publicApiUrl)) {
      skip++;
      continue;
    }
    try {
      const hosted = await hostUrl(p.avatarUrl, "avatar");
      await prisma.profile.update({
        where: { id: p.id },
        data: { avatarUrl: hosted.localUrl },
      });
      ok++;
    } catch (e) {
      fail++;
      console.warn(`[mirror] avatar ${p.handle}:`, e instanceof Error ? e.message : e);
    }
  }

  const events = await prisma.event.findMany({ where: { imageUrl: { not: null } } });
  for (const row of events) {
    const url = row.imageUrl;
    if (!url || isSeedHosted(url, publicApiUrl)) {
      skip++;
      continue;
    }
    try {
      const hosted = await hostUrl(url, "event");
      await prisma.event.update({ where: { id: row.id }, data: { imageUrl: hosted.localUrl } });
      ok++;
    } catch (e) {
      fail++;
      console.warn(`[mirror] event ${row.slug}:`, e instanceof Error ? e.message : e);
    }
  }

  const opps = await prisma.opportunity.findMany({ where: { imageUrl: { not: null } } });
  for (const row of opps) {
    const url = row.imageUrl;
    if (!url || isSeedHosted(url, publicApiUrl)) {
      skip++;
      continue;
    }
    try {
      const hosted = await hostUrl(url, "opp");
      await prisma.opportunity.update({
        where: { id: row.id },
        data: { imageUrl: hosted.localUrl },
      });
      ok++;
    } catch (e) {
      fail++;
      console.warn(`[mirror] opp ${row.slug}:`, e instanceof Error ? e.message : e);
    }
  }

  console.log(`[mirror] done ok=${ok} fail=${fail} skip=${skip}`);
}

try {
  await regenCorniche();
  await mirrorAll();
} finally {
  await prisma.$disconnect();
}
