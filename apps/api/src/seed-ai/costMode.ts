/**
 * Cost modes for Creative Hub AI seeding / media gateway.
 *
 * FREE  — OpenRouter free text · Pixazo/Free.ai image/video · ElevenLabs free TTS audio.
 * PAID  — fal / Replicate / OpenRouter Lyria music (+ optional ElevenLabs).
 */
export type CostMode = "free" | "paid";

export type MediaKind = "image" | "video" | "audio";

export type ProviderSlot =
  | "elevenlabs"
  | "openrouter"
  | "pixazo"
  | "freeai"
  | "fal"
  | "replicate"
  | "huggingface"
  | "picsum"
  | "sample";

export const COST_MODE_BLURBS: Record<CostMode, string> = {
  free: "OpenRouter free text · Pixazo/Free.ai image+video · ElevenLabs free TTS audio.",
  paid: "fal (media+music) · Replicate · OpenRouter Lyria · ElevenLabs. Credits apply.",
};

/** Ordered provider chains by cost mode + media kind. */
export const PROVIDER_CHAINS: Record<CostMode, Record<MediaKind, ProviderSlot[]>> = {
  free: {
    image: ["pixazo", "freeai", "picsum"],
    video: ["pixazo", "freeai", "sample"],
    // Free TTS first; paid music providers only if keys/credits exist
    audio: ["elevenlabs", "huggingface", "replicate", "openrouter", "sample"],
  },
  paid: {
    image: ["fal", "replicate", "pixazo", "picsum"],
    video: ["fal", "replicate", "pixazo", "sample"],
    audio: ["fal", "replicate", "huggingface", "openrouter", "elevenlabs", "sample"],
  },
};

export const TEXT_MODELS: Record<CostMode, string> = {
  free: "openrouter/free",
  paid: "openai/gpt-4o-mini",
};

/** Default OpenRouter Lyria model (clip ≈ $0.04). */
export const MUSIC_MODELS: Record<CostMode, string> = {
  free: "google/lyria-3-clip-preview",
  paid: "google/lyria-3-clip-preview",
};

export function parseCostMode(raw: string | undefined | null): CostMode {
  const v = (raw ?? "").trim().toLowerCase();
  if (v === "paid") return "paid";
  return "free";
}

export function keysForCostMode(mode: CostMode): {
  elevenlabs: boolean;
  openrouter: boolean;
  pixazo: boolean;
  freeai: boolean;
  fal: boolean;
  replicate: boolean;
  huggingface: boolean;
} {
  if (mode === "free") {
    return {
      elevenlabs: true,
      openrouter: true,
      pixazo: true,
      freeai: true,
      fal: false,
      replicate: true,
      huggingface: true,
    };
  }
  return {
    elevenlabs: true,
    openrouter: true,
    pixazo: true,
    freeai: false,
    fal: true,
    replicate: true,
    huggingface: true,
  };
}
