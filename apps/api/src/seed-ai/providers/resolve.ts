import { join } from "node:path";
import {
  MUSIC_MODELS,
  parseCostMode,
  PROVIDER_CHAINS,
  type CostMode,
  type ProviderSlot,
} from "../costMode.js";
import { FalClient } from "./fal.js";
import { FreeAiClient } from "./freeai.js";
import { ElevenLabsTtsClient } from "./elevenlabs.js";
import { HuggingFaceMusicClient } from "./huggingface.js";
import { OpenRouterMusicClient } from "./openrouter-music.js";
import { PixazoClient } from "./pixazo.js";
import { ReplicateClient } from "./replicate.js";
import type {
  GenerateAudioInput,
  GenerateImageInput,
  GenerateVideoInput,
  GeneratedMedia,
  MediaProvider,
} from "./types.js";

export type GatewayKeys = {
  openRouterApiKey?: string;
  openRouterMusicModel?: string;
  pixazoApiKey?: string;
  freeAiApiKey?: string;
  falApiKey?: string;
  falAudioModel?: string;
  replicateApiKey?: string;
  hfToken?: string;
  hfMusicModel?: string;
  hfAudioEndpoint?: string;
  elevenLabsApiKey?: string;
  elevenLabsVoiceId?: string;
  elevenLabsModelId?: string;
  elevenLabsMusicModelId?: string;
  elevenLabsPreferMusic?: boolean;
  publicApiUrl?: string;
  seedCacheDir?: string;
  openRouterTimeoutMs?: number;
  pixazoTimeoutMs?: number;
  freeAiTimeoutMs?: number;
  falTimeoutMs?: number;
  replicateTimeoutMs?: number;
  hfTimeoutMs?: number;
  elevenLabsTimeoutMs?: number;
};

const SAMPLE_AUDIO =
  "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
const SAMPLE_VIDEO =
  "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

class PicsumProvider implements MediaProvider {
  readonly id = "picsum" as const;
  readonly label = "Picsum placeholder";
  readonly free = true;
  readonly commercialOk = true;

  async generateImage(input: GenerateImageInput): Promise<GeneratedMedia> {
    const seed = encodeURIComponent(input.prompt.slice(0, 40) || "seed");
    return {
      url: `https://picsum.photos/seed/${seed}/800/600`,
      mimeType: "image/jpeg",
      kind: "image",
      provider: "picsum",
      model: "picsum",
      commercialOk: true,
      warning: "Placeholder image (Picsum)",
    };
  }
}

class SampleProvider implements MediaProvider {
  readonly id = "sample" as const;
  readonly label = "Public sample media";
  readonly free = true;
  readonly commercialOk = true;

  async generateVideo(_input: GenerateVideoInput): Promise<GeneratedMedia> {
    return {
      url: SAMPLE_VIDEO,
      mimeType: "video/mp4",
      kind: "video",
      provider: "sample",
      model: "sample/video",
      commercialOk: true,
      warning: "Public sample video (no AI gen)",
    };
  }

  async generateAudio(_input: GenerateAudioInput): Promise<GeneratedMedia> {
    return {
      url: SAMPLE_AUDIO,
      mimeType: "audio/mpeg",
      kind: "audio",
      provider: "sample",
      model: "sample/audio",
      commercialOk: true,
      warning: "Public sample audio (no AI gen)",
    };
  }
}

function buildProvider(
  slot: ProviderSlot,
  keys: GatewayKeys,
  costMode: CostMode,
): MediaProvider | null {
  switch (slot) {
    case "openrouter":
      if (!keys.openRouterApiKey?.trim()) return null;
      return new OpenRouterMusicClient({
        apiKey: keys.openRouterApiKey,
        modelId: keys.openRouterMusicModel?.trim() || MUSIC_MODELS[costMode],
        timeoutMs: keys.openRouterTimeoutMs,
        cacheDir: keys.seedCacheDir ?? join(process.cwd(), "data", "seed-cache"),
        publicBaseUrl: keys.publicApiUrl ?? "http://localhost:3001",
        free: costMode === "free",
      });
    case "pixazo":
      if (!keys.pixazoApiKey?.trim()) return null;
      return new PixazoClient({
        apiKey: keys.pixazoApiKey,
        timeoutMs: keys.pixazoTimeoutMs,
      });
    case "freeai":
      if (!keys.freeAiApiKey?.trim()) return null;
      return new FreeAiClient({
        apiKey: keys.freeAiApiKey,
        timeoutMs: keys.freeAiTimeoutMs,
      });
    case "fal":
      if (!keys.falApiKey?.trim()) return null;
      return new FalClient({
        apiKey: keys.falApiKey,
        timeoutMs: keys.falTimeoutMs,
        audioModelId: keys.falAudioModel,
      });
    case "replicate":
      if (!keys.replicateApiKey?.trim()) return null;
      return new ReplicateClient({
        apiKey: keys.replicateApiKey,
        timeoutMs: keys.replicateTimeoutMs,
      });
    case "huggingface":
      if (!keys.hfToken?.trim()) return null;
      return new HuggingFaceMusicClient({
        apiKey: keys.hfToken,
        timeoutMs: keys.hfTimeoutMs,
        modelId: keys.hfMusicModel,
        endpointUrl: keys.hfAudioEndpoint,
        cacheDir: keys.seedCacheDir ?? join(process.cwd(), "data", "seed-cache"),
        publicBaseUrl: keys.publicApiUrl ?? "http://localhost:3001",
      });
    case "elevenlabs":
      if (!keys.elevenLabsApiKey?.trim()) return null;
      return new ElevenLabsTtsClient({
        apiKey: keys.elevenLabsApiKey,
        voiceId: keys.elevenLabsVoiceId,
        modelId: keys.elevenLabsModelId,
        musicModelId: keys.elevenLabsMusicModelId,
        preferMusic: keys.elevenLabsPreferMusic,
        timeoutMs: keys.elevenLabsTimeoutMs,
        cacheDir: keys.seedCacheDir ?? join(process.cwd(), "data", "seed-cache"),
        publicBaseUrl: keys.publicApiUrl ?? "http://localhost:3001",
      });
    case "picsum":
      return new PicsumProvider();
    case "sample":
      return new SampleProvider();
    default:
      return null;
  }
}

export type MediaGateway = {
  costMode: CostMode;
  generateImage(input: GenerateImageInput): Promise<GeneratedMedia>;
  generateVideo(input: GenerateVideoInput): Promise<GeneratedMedia>;
  generateAudio(input: GenerateAudioInput): Promise<GeneratedMedia>;
};

/**
 * Multi-provider AI media gateway.
 * Walks the free or paid chain; skips missing keys; falls through on errors.
 */
export function createMediaGateway(
  costModeRaw: string | CostMode,
  keys: GatewayKeys,
): MediaGateway {
  const costMode = typeof costModeRaw === "string" ? parseCostMode(costModeRaw) : costModeRaw;
  const chains = PROVIDER_CHAINS[costMode];

  async function runChain<T extends "image" | "video" | "audio">(
    kind: T,
    fn: (p: MediaProvider) => Promise<GeneratedMedia> | undefined,
  ): Promise<GeneratedMedia> {
    const errors: string[] = [];
    for (const slot of chains[kind]) {
      const provider = buildProvider(slot, keys, costMode);
      if (!provider) continue;
      try {
        const result = await fn(provider);
        if (result) {
          if (errors.length) {
            return {
              ...result,
              warning: [result.warning, `Earlier providers failed: ${errors.join(" · ")}`]
                .filter(Boolean)
                .join(" — "),
            };
          }
          return result;
        }
      } catch (e) {
        errors.push(`${slot}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }
    if (kind === "image") return new PicsumProvider().generateImage({ prompt: "fallback" });
    if (kind === "video") return new SampleProvider().generateVideo({ prompt: "fallback" });
    return new SampleProvider().generateAudio({ prompt: "fallback" });
  }

  return {
    costMode,
    generateImage: (input) =>
      runChain("image", (p) => (p.generateImage ? p.generateImage(input) : undefined)),
    generateVideo: (input) =>
      runChain("video", (p) => (p.generateVideo ? p.generateVideo(input) : undefined)),
    generateAudio: (input) =>
      runChain("audio", (p) => (p.generateAudio ? p.generateAudio(input) : undefined)),
  };
}

export { SAMPLE_AUDIO, SAMPLE_VIDEO };
