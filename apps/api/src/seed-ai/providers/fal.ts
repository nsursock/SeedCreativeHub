import { SeedAiError, type GenerateAudioInput, type GenerateImageInput, type GenerateVideoInput, type GeneratedMedia, type MediaProvider } from "./types.js";

/** fal.ai — signup credits / prepaid (PubFana). Includes music (Lyria / MiniMax). */
export class FalClient implements MediaProvider {
  readonly id = "fal" as const;
  readonly label = "fal.ai (Credits)";
  readonly free = false;
  readonly commercialOk = true;

  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly imageModelId: string;
  private readonly videoModelId: string;
  private readonly audioModelId: string;

  constructor(opts: {
    apiKey: string;
    timeoutMs?: number;
    imageModelId?: string;
    videoModelId?: string;
    audioModelId?: string;
  }) {
    if (!opts.apiKey?.trim()) {
      throw new SeedAiError("FAL_KEY is not configured", { code: "missing_key" });
    }
    this.apiKey = opts.apiKey.trim();
    this.timeoutMs = opts.timeoutMs ?? 180_000;
    this.imageModelId = opts.imageModelId?.trim() || "fal-ai/flux/schnell";
    this.videoModelId = opts.videoModelId?.trim() || "fal-ai/ltx-video";
    this.audioModelId = opts.audioModelId?.trim() || "fal-ai/lyria3";
  }

  async generateImage(input: GenerateImageInput): Promise<GeneratedMedia> {
    const prompt = input.prompt.trim();
    if (!prompt) throw new SeedAiError("Image prompt is required", { code: "validation" });
    const body = await this.run(this.imageModelId, {
      prompt,
      image_size: "square_hd",
      num_images: 1,
    });
    const url = extractFalImage(body);
    if (!url) throw new SeedAiError("fal image missing URL", { code: "empty" });
    return {
      url,
      mimeType: "image/png",
      kind: "image",
      provider: "fal",
      model: this.imageModelId,
      commercialOk: true,
    };
  }

  async generateVideo(input: GenerateVideoInput): Promise<GeneratedMedia> {
    const prompt = input.prompt.trim();
    if (!prompt) throw new SeedAiError("Video prompt is required", { code: "validation" });
    const payload: Record<string, unknown> = { prompt };
    if (input.imageUrl?.trim()) payload.image_url = input.imageUrl.trim();
    const body = await this.run(this.videoModelId, payload);
    const url = extractFalVideo(body);
    if (!url) throw new SeedAiError("fal video missing URL", { code: "empty" });
    return {
      url,
      mimeType: "video/mp4",
      kind: "video",
      provider: "fal",
      model: this.videoModelId,
      commercialOk: true,
      durationSec: input.durationSec,
    };
  }

  async generateAudio(input: GenerateAudioInput): Promise<GeneratedMedia> {
    const prompt = input.prompt.trim();
    if (!prompt) throw new SeedAiError("Audio prompt is required", { code: "validation" });

    const id = this.audioModelId;
    let payload: Record<string, unknown>;
    if (id.includes("minimax-music")) {
      payload = {
        prompt: prompt.slice(0, 280),
        lyrics_prompt:
          "[verse]\nBeirut night lights on wet asphalt\nPort horns in the distance\n[chorus]\nLoop the harbor until morning",
        ...(id.includes("v2.6") ? { is_instrumental: true } : {}),
      };
    } else {
      payload = { prompt };
    }

    const body = await this.run(id, payload);
    const url = extractFalAudio(body);
    if (!url) throw new SeedAiError("fal audio missing URL", { code: "empty" });
    return {
      url,
      mimeType: guessAudioMime(url),
      kind: "audio",
      provider: "fal",
      model: id,
      commercialOk: true,
      durationSec: input.durationSec,
    };
  }

  private async run(endpointId: string, input: Record<string, unknown>) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(`https://fal.run/${endpointId}`, {
        method: "POST",
        headers: {
          Authorization: `Key ${this.apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
        signal: controller.signal,
      });
      const text = await res.text();
      let json: Record<string, unknown> = {};
      try {
        json = text ? (JSON.parse(text) as Record<string, unknown>) : {};
      } catch {
        json = { raw: text };
      }
      if (!res.ok) {
        throw new SeedAiError(
          `fal error: ${String(json.detail ?? json.message ?? res.statusText)}`,
          { status: res.status, code: "provider" },
        );
      }
      return json;
    } catch (e) {
      if (e instanceof SeedAiError) throw e;
      if (e instanceof Error && e.name === "AbortError") {
        throw new SeedAiError("fal timed out", { code: "timeout" });
      }
      throw new SeedAiError(e instanceof Error ? e.message : String(e), { code: "network" });
    } finally {
      clearTimeout(timer);
    }
  }
}

function extractFalImage(body: Record<string, unknown>): string | null {
  const images = body.images;
  if (Array.isArray(images) && images[0] && typeof images[0] === "object") {
    const u = (images[0] as { url?: string }).url;
    if (typeof u === "string") return u;
  }
  if (typeof body.image === "object" && body.image && "url" in body.image) {
    const u = (body.image as { url?: string }).url;
    if (typeof u === "string") return u;
  }
  return typeof body.url === "string" ? body.url : null;
}

function extractFalVideo(body: Record<string, unknown>): string | null {
  const video = body.video;
  if (typeof video === "object" && video && "url" in video) {
    const u = (video as { url?: string }).url;
    if (typeof u === "string") return u;
  }
  if (typeof body.video_url === "string") return body.video_url;
  return typeof body.url === "string" ? body.url : null;
}

function extractFalAudio(body: Record<string, unknown>): string | null {
  const audio = body.audio;
  if (typeof audio === "string" && /^https?:\/\//i.test(audio)) return audio;
  if (audio && typeof audio === "object") {
    const u = (audio as { url?: string }).url;
    if (typeof u === "string") return u;
  }
  if (typeof body.audio_url === "string") return body.audio_url;
  if (typeof body.url === "string" && /^https?:\/\//i.test(body.url)) return body.url;
  return null;
}

function guessAudioMime(url: string): string {
  const lower = url.toLowerCase();
  if (lower.includes(".wav")) return "audio/wav";
  if (lower.includes(".flac")) return "audio/flac";
  return "audio/mpeg";
}
