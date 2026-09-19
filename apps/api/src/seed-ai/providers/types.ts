import { SeedAiError } from "../errors.js";

export type MediaKind = "image" | "video" | "audio";

export type PixelProviderId =
  | "pixazo"
  | "freeai"
  | "fal"
  | "replicate"
  | "openrouter"
  | "huggingface"
  | "elevenlabs"
  | "sample"
  | "picsum";

export type GeneratedMedia = {
  url: string;
  mimeType: string;
  kind: MediaKind;
  provider: PixelProviderId;
  model: string;
  /** Free-tier / personal-use only — not for commercial licensing claims */
  commercialOk: boolean;
  warning?: string;
  durationSec?: number;
};

export type GenerateImageInput = {
  prompt: string;
  width?: number;
  height?: number;
};

export type GenerateVideoInput = {
  prompt: string;
  imageUrl?: string;
  durationSec?: number;
};

export type GenerateAudioInput = {
  prompt: string;
  /** Keep short for smoke seeds (seconds) */
  durationSec?: number;
};

export interface MediaProvider {
  readonly id: PixelProviderId;
  readonly label: string;
  readonly free: boolean;
  readonly commercialOk: boolean;
  generateImage?(input: GenerateImageInput): Promise<GeneratedMedia>;
  generateVideo?(input: GenerateVideoInput): Promise<GeneratedMedia>;
  generateAudio?(input: GenerateAudioInput): Promise<GeneratedMedia>;
}

export { SeedAiError };
