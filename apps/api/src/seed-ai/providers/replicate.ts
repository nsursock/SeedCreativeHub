import { SeedAiError, type GenerateAudioInput, type GenerateImageInput, type GenerateVideoInput, type GeneratedMedia, type MediaProvider } from "./types.js";

const API = "https://api.replicate.com/v1";

/** Replicate — usage billed (PubFana). Also used for MusicGen in paid mode. */
export class ReplicateClient implements MediaProvider {
  readonly id = "replicate" as const;
  readonly label = "Replicate";
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
      throw new SeedAiError("REPLICATE_API_TOKEN is not configured", { code: "missing_key" });
    }
    this.apiKey = opts.apiKey.trim();
    this.timeoutMs = opts.timeoutMs ?? 180_000;
    this.imageModelId = opts.imageModelId?.trim() || "black-forest-labs/flux-schnell";
    this.videoModelId = opts.videoModelId?.trim() || "wan-video/wan-2.1-1.3b";
    this.audioModelId = opts.audioModelId?.trim() || "meta/musicgen";
  }

  async generateImage(input: GenerateImageInput): Promise<GeneratedMedia> {
    const prompt = input.prompt.trim();
    if (!prompt) throw new SeedAiError("Image prompt is required", { code: "validation" });
    const output = await this.runModel(this.imageModelId, {
      prompt,
      aspect_ratio: "1:1",
    });
    const url = firstUrl(output);
    if (!url) throw new SeedAiError("Replicate image missing URL", { code: "empty" });
    return {
      url,
      mimeType: "image/png",
      kind: "image",
      provider: "replicate",
      model: this.imageModelId,
      commercialOk: true,
    };
  }

  async generateVideo(input: GenerateVideoInput): Promise<GeneratedMedia> {
    const prompt = input.prompt.trim();
    if (!prompt) throw new SeedAiError("Video prompt is required", { code: "validation" });
    const payload: Record<string, unknown> = { prompt };
    if (input.imageUrl?.trim()) {
      payload.image = input.imageUrl.trim();
      payload.image_url = input.imageUrl.trim();
    }
    const output = await this.runModel(this.videoModelId, payload);
    const url = firstUrl(output);
    if (!url) throw new SeedAiError("Replicate video missing URL", { code: "empty" });
    return {
      url,
      mimeType: "video/mp4",
      kind: "video",
      provider: "replicate",
      model: this.videoModelId,
      commercialOk: true,
      durationSec: input.durationSec,
    };
  }

  async generateAudio(input: GenerateAudioInput): Promise<GeneratedMedia> {
    const prompt = input.prompt.trim();
    if (!prompt) throw new SeedAiError("Audio prompt is required", { code: "validation" });
    const duration = Math.min(Math.max(input.durationSec ?? 8, 3), 15);
    const output = await this.runModel(this.audioModelId, {
      prompt,
      duration,
      model_version: "stereo-melody-large",
      output_format: "mp3",
      normalization_strategy: "peak",
    });
    const url = firstUrl(output);
    if (!url) throw new SeedAiError("Replicate audio missing URL", { code: "empty" });
    return {
      url,
      mimeType: "audio/mpeg",
      kind: "audio",
      provider: "replicate",
      model: this.audioModelId,
      commercialOk: true,
      durationSec: duration,
    };
  }

  private async runModel(modelId: string, input: Record<string, unknown>): Promise<unknown> {
    const [owner, name] = splitOwnerName(modelId);
    // Prefer versioned /v1/predictions (models/.../predictions 404s for some accounts)
    const modelMeta = await this.request("GET", `${API}/models/${owner}/${name}`);
    const versionId =
      typeof modelMeta.latest_version === "object" &&
      modelMeta.latest_version &&
      typeof (modelMeta.latest_version as { id?: string }).id === "string"
        ? (modelMeta.latest_version as { id: string }).id
        : null;

    const create = versionId
      ? await this.request("POST", `${API}/predictions`, { version: versionId, input })
      : await this.request("POST", `${API}/models/${owner}/${name}/predictions`, { input });

    if (create.status === "succeeded") return create.output;

    const getUrl =
      typeof create.urls === "object" &&
      create.urls &&
      typeof (create.urls as { get?: string }).get === "string"
        ? (create.urls as { get: string }).get
        : typeof create.id === "string"
          ? `${API}/predictions/${create.id}`
          : null;
    if (!getUrl) throw new SeedAiError("Replicate missing poll URL", { code: "empty" });

    const deadline = Date.now() + this.timeoutMs;
    while (Date.now() < deadline) {
      await sleep(1500);
      const status = await this.request("GET", getUrl);
      const st = String(status.status ?? "");
      if (st === "succeeded") return status.output;
      if (st === "failed" || st === "canceled") {
        throw new SeedAiError(`Replicate failed: ${String(status.error ?? st)}`, {
          code: "provider",
        });
      }
    }
    throw new SeedAiError("Replicate timed out", { code: "timeout" });
  }

  private async request(
    method: "GET" | "POST",
    url: string,
    body?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(url, {
        method,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          Prefer: "wait=55",
        },
        body: body ? JSON.stringify(body) : undefined,
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
          `Replicate error: ${String(json.detail ?? json.error ?? res.statusText)}`,
          { status: res.status, code: "provider" },
        );
      }
      return json;
    } catch (e) {
      if (e instanceof SeedAiError) throw e;
      if (e instanceof Error && e.name === "AbortError") {
        throw new SeedAiError("Replicate timed out", { code: "timeout" });
      }
      throw new SeedAiError(e instanceof Error ? e.message : String(e), { code: "network" });
    } finally {
      clearTimeout(timer);
    }
  }
}

function splitOwnerName(id: string): [string, string] {
  const parts = id.split("/");
  if (parts.length < 2) {
    throw new SeedAiError(`Invalid Replicate model id: ${id}`, { code: "validation" });
  }
  return [parts[0], parts.slice(1).join("/")];
}

function firstUrl(output: unknown): string | null {
  if (typeof output === "string" && /^https?:\/\//i.test(output)) return output;
  if (Array.isArray(output)) {
    for (const item of output) {
      const u = firstUrl(item);
      if (u) return u;
    }
  }
  if (output && typeof output === "object") {
    const o = output as Record<string, unknown>;
    for (const k of ["url", "video", "image", "audio", "output"]) {
      const u = firstUrl(o[k]);
      if (u) return u;
    }
  }
  return null;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
