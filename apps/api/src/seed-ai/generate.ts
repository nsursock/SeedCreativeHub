import {
  DISCIPLINES,
  DISCIPLINE_WORK_TYPE,
  LEBANESE_CITIES,
  CITY_LABELS,
  type DisciplineSlug,
  type WorkType,
} from "@creative-hub/shared";
import { parseCostMode, TEXT_MODELS, type CostMode } from "./costMode.js";
import { SeedAiError } from "./errors.js";
import { OpenRouterClient } from "./openrouter.js";
import {
  createMediaGateway,
  SAMPLE_AUDIO,
  SAMPLE_VIDEO,
  type GatewayKeys,
} from "./providers/resolve.js";
import type { GeneratedMedia } from "./providers/types.js";

/** live = call providers; stub = offline fixtures only */
export type SeedAiLiveMode = "live" | "stub";

export type GeneratedSeedWork = {
  title: string;
  type: WorkType;
  description: string;
  body?: string;
  imagePrompt?: string;
  audioPrompt?: string;
  videoPrompt?: string;
  primaryDiscipline: DisciplineSlug;
};

export type GeneratedSeedCreator = {
  handle: string;
  displayName: string;
  bioShort: string;
  city: string;
  disciplineSlugs: DisciplineSlug[];
  works: GeneratedSeedWork[];
};

export type SeedAiBundle = {
  liveMode: SeedAiLiveMode;
  costMode: CostMode;
  model?: string;
  creators: GeneratedSeedCreator[];
  warnings: string[];
};

export const SAMPLE_MEDIA = {
  audio: SAMPLE_AUDIO,
  video: SAMPLE_VIDEO,
} as const;

function extractJsonObject(raw: string): unknown {
  const trimmed = raw.trim();
  const fence = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence?.[1]?.trim() ?? trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start < 0 || end <= start) {
    throw new SeedAiError("Model reply had no JSON object", { code: "parse" });
  }
  try {
    return JSON.parse(candidate.slice(start, end + 1));
  } catch {
    throw new SeedAiError("Model JSON was invalid", { code: "parse" });
  }
}

function stubCreators(count: number): GeneratedSeedCreator[] {
  const names = [
    { first: "Maya", last: "Khoury", handle: "maya_k" },
    { first: "Rami", last: "Beats", handle: "rami_beats" },
    { first: "Karim", last: "Abou", handle: "karim_film" },
    { first: "Lina", last: "Haddad", handle: "lina_writes" },
  ];
  const out: GeneratedSeedCreator[] = [];
  for (let i = 0; i < count; i++) {
    const disc = DISCIPLINES[i % DISCIPLINES.length];
    const person = names[i % names.length];
    const handle = i < names.length ? person.handle : `creator_${String(i + 1).padStart(3, "0")}`;
    const type = DISCIPLINE_WORK_TYPE[disc];
    const city = LEBANESE_CITIES[i % LEBANESE_CITIES.length];
    out.push({
      handle,
      displayName: `${person.first} ${person.last}`,
      bioShort: `${person.first} makes ${disc} work from ${CITY_LABELS[city].en} — seeded stub.`,
      city,
      disciplineSlugs: [disc],
      works: [
        {
          title: `${person.first}'s ${disc} piece`,
          type,
          description: `Short ${type} work for Creative Hub smoke tests.`,
          body:
            type === "text"
              ? `A short seeded essay by ${person.first}. Beirut light on wet asphalt; the night keeps its own archive.`
              : undefined,
          imagePrompt:
            type === "image"
              ? `Documentary photo of Beirut night streets, grainy film look, no text`
              : undefined,
          audioPrompt:
            type === "audio"
              ? `lo-fi instrumental beat, warm pads, subtle Beirut night mood, no vocals`
              : undefined,
          videoPrompt:
            type === "video"
              ? `short cinematic shot of stone stairs in Saida, soft daylight, handheld`
              : undefined,
          primaryDiscipline: disc,
        },
      ],
    });
  }
  return out;
}

function normalizeCreators(raw: unknown, count: number): GeneratedSeedCreator[] {
  const root = raw as { creators?: unknown[] };
  if (!Array.isArray(root.creators) || !root.creators.length) {
    throw new SeedAiError("Model JSON missing creators[]", { code: "shape" });
  }

  const out: GeneratedSeedCreator[] = [];
  for (let i = 0; i < Math.min(count, root.creators.length); i++) {
    const c = root.creators[i] as Record<string, unknown>;
    const discRaw = String(c.discipline ?? DISCIPLINES[i % DISCIPLINES.length]);
    const disc = (DISCIPLINES as readonly string[]).includes(discRaw)
      ? (discRaw as DisciplineSlug)
      : DISCIPLINES[i % DISCIPLINES.length];
    const type = DISCIPLINE_WORK_TYPE[disc];
    const handle = String(c.handle ?? `creator_${String(i + 1).padStart(3, "0")}`)
      .toLowerCase()
      .replace(/[^a-z0-9_]/g, "_")
      .slice(0, 30);
    const work = (c.work ?? {}) as Record<string, unknown>;
    const cityRaw = String(c.city ?? "beirut").toLowerCase();
    const city = (LEBANESE_CITIES as readonly string[]).includes(cityRaw) ? cityRaw : "beirut";

    out.push({
      handle: handle.length >= 3 ? handle : `creator_${String(i + 1).padStart(3, "0")}`,
      displayName: String(c.displayName ?? `Creator ${i + 1}`).slice(0, 120),
      bioShort: String(c.bioShort ?? `${disc} creator in Lebanon.`).slice(0, 280),
      city,
      disciplineSlugs: [disc],
      works: [
        {
          title: String(work.title ?? `${disc} work`).slice(0, 200),
          type,
          description: String(work.description ?? `A ${type} work.`).slice(0, 5000),
          body: type === "text" ? String(work.body ?? work.description ?? "").slice(0, 5000) : undefined,
          imagePrompt:
            type === "image"
              ? String(work.imagePrompt ?? work.description ?? "Beirut documentary photo").slice(0, 500)
              : undefined,
          audioPrompt:
            type === "audio"
              ? String(work.audioPrompt ?? work.description ?? "lo-fi instrumental").slice(0, 500)
              : undefined,
          videoPrompt:
            type === "video"
              ? String(work.videoPrompt ?? work.description ?? "cinematic short").slice(0, 500)
              : undefined,
          primaryDiscipline: disc,
        },
      ],
    });
  }

  if (out.length < count) out.push(...stubCreators(count).slice(out.length));
  return out.slice(0, count);
}

export function resolveLiveMode(raw: string, hasOpenRouterKey: boolean): SeedAiLiveMode {
  if (raw === "stub") return "stub";
  if (raw === "live") return "live";
  return hasOpenRouterKey ? "live" : "stub";
}

export async function generateSeedCreators(opts: {
  liveMode: SeedAiLiveMode;
  costMode: CostMode;
  count: number;
  openRouterApiKey?: string;
  openRouterModel?: string;
  openRouterTimeoutMs?: number;
}): Promise<SeedAiBundle> {
  const warnings: string[] = [];
  const costMode = parseCostMode(opts.costMode);
  const defaultModel = TEXT_MODELS[costMode];
  const model = opts.openRouterModel?.trim() || defaultModel;

  if (opts.liveMode === "stub" || !opts.openRouterApiKey?.trim()) {
    return {
      liveMode: "stub",
      costMode,
      creators: stubCreators(opts.count),
      warnings: [
        opts.openRouterApiKey?.trim()
          ? "SEED_AI_MODE=stub"
          : "No OPENROUTER_API_KEY — stub text seed",
      ],
    };
  }

  const client = new OpenRouterClient({
    apiKey: opts.openRouterApiKey,
    model,
    timeoutMs: opts.openRouterTimeoutMs,
  });

  const system = `You generate lightweight seed data for Creative Hub (Lebanon).
Reply with ONLY one JSON object (no markdown). Schema:
{"creators":[{"handle":"snake_case","displayName":"string","bioShort":"<=160 chars","city":"beirut|tripoli|saida|tyre|byblos","discipline":"music|photography|film|writing","work":{"title":"string","description":"<=280 chars","body":"optional short writing when discipline=writing","imagePrompt":"when photography","audioPrompt":"when music — instrumental mood","videoPrompt":"when film"}}]}
Rules: fictional Lebanese creatives; short copy; one creator per discipline when count>=4; handles unique [a-z0-9_].`;

  const user = `Generate exactly ${opts.count} creators covering music, photography, film, and writing (cycle if more). Keep brief — smoke-test seed. Cost mode: ${costMode}.`;

  try {
    const first = await client.chat(
      [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      { temperature: 0.8 },
    );
    try {
      return {
        liveMode: "live",
        costMode,
        model: first.model,
        creators: normalizeCreators(extractJsonObject(first.content), opts.count),
        warnings,
      };
    } catch {
      const repair = await client.chat(
        [
          { role: "system", content: system },
          { role: "user", content: user },
          { role: "assistant", content: first.content },
          {
            role: "user",
            content: "Previous reply was not valid JSON. Reply with ONLY the JSON object.",
          },
        ],
        { temperature: 0.2 },
      );
      warnings.push("OpenRouter JSON repaired on retry");
      return {
        liveMode: "live",
        costMode,
        model: repair.model,
        creators: normalizeCreators(extractJsonObject(repair.content), opts.count),
        warnings,
      };
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    warnings.push(`OpenRouter failed (${msg}) — stub fallback`);
    return { liveMode: "stub", costMode, creators: stubCreators(opts.count), warnings };
  }
}

export function createSeedMediaGateway(costMode: CostMode, keys: GatewayKeys) {
  return createMediaGateway(costMode, keys);
}

export async function generateSeedMedia(
  kind: "image" | "video" | "audio",
  prompt: string,
  gateway: ReturnType<typeof createMediaGateway>,
): Promise<GeneratedMedia> {
  if (kind === "image") return gateway.generateImage({ prompt, width: 512, height: 512 });
  if (kind === "video") return gateway.generateVideo({ prompt, durationSec: 3 });
  return gateway.generateAudio({ prompt, durationSec: 8 });
}
