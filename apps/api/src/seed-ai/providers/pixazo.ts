import { SeedAiError, type GenerateImageInput, type GenerateVideoInput, type GeneratedMedia, type MediaProvider } from "./types.js";

const GATEWAY = "https://gateway.pixazo.ai";

const IMAGE_PATHS: Record<string, { path: string; request: "schnell" | "simple" }> = {
  "flux-1-schnell": { path: "/flux-1-schnell/v1/getData", request: "schnell" },
  flux: { path: "/flux/text-to-image", request: "simple" },
  sdxl: { path: "/sdxl/text-to-image", request: "simple" },
  "stable-diffusion": { path: "/stable-diffusion/text-to-image", request: "simple" },
};

const VIDEO_PATHS: Record<string, string> = {
  "ltx-video": "/ltx-video/v1/text-to-video",
  ltx: "/ltx/text-to-video",
};

/** Pixazo free tier — no card (PubFana). */
export class PixazoClient implements MediaProvider {
  readonly id = "pixazo" as const;
  readonly label = "Pixazo (Free)";
  readonly free = true;
  readonly commercialOk = true;

  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly imageModelId: string;
  private readonly videoModelId: string;

  constructor(opts: {
    apiKey: string;
    timeoutMs?: number;
    imageModelId?: string;
    videoModelId?: string;
  }) {
    if (!opts.apiKey?.trim()) {
      throw new SeedAiError("PIXAZO_API_KEY is not configured", { code: "missing_key" });
    }
    this.apiKey = opts.apiKey.trim();
    this.timeoutMs = opts.timeoutMs ?? 120_000;
    this.imageModelId = opts.imageModelId?.trim() || "flux-1-schnell";
    this.videoModelId = opts.videoModelId?.trim() || "ltx-video";
  }

  async generateImage(input: GenerateImageInput): Promise<GeneratedMedia> {
    const prompt = input.prompt.trim();
    if (!prompt) throw new SeedAiError("Image prompt is required", { code: "validation" });
    const model = IMAGE_PATHS[this.imageModelId] ?? IMAGE_PATHS["flux-1-schnell"];
    const width = input.width ?? 512;
    const height = input.height ?? 512;
    const payload =
      model.request === "schnell"
        ? { prompt, num_steps: 4, width, height }
        : { prompt, width, height };
    const body = await this.postJson(model.path, payload);
    const url = extractUrl(body);
    if (!url) throw new SeedAiError("Pixazo image missing URL", { code: "empty" });
    return {
      url,
      mimeType: guessMime(url, "image/png"),
      kind: "image",
      provider: "pixazo",
      model: this.imageModelId,
      commercialOk: true,
    };
  }

  async generateVideo(input: GenerateVideoInput): Promise<GeneratedMedia> {
    const prompt = input.prompt.trim();
    if (!prompt) throw new SeedAiError("Video prompt is required", { code: "validation" });
    const path = VIDEO_PATHS[this.videoModelId] ?? VIDEO_PATHS["ltx-video"];
    const submit = await this.postJson(path, {
      prompt,
      ...(input.imageUrl ? { image_url: input.imageUrl } : {}),
    });

    const immediate = extractUrl(submit);
    const requestId =
      (typeof submit.request_id === "string" && submit.request_id) ||
      (typeof submit.requestId === "string" && submit.requestId) ||
      null;
    const pollingUrl =
      (typeof submit.polling_url === "string" && submit.polling_url) ||
      (requestId ? `${GATEWAY}/v2/requests/status/${requestId}` : null);

    if (immediate && !requestId) {
      return {
        url: immediate,
        mimeType: "video/mp4",
        kind: "video",
        provider: "pixazo",
        model: this.videoModelId,
        commercialOk: true,
        durationSec: input.durationSec,
      };
    }
    if (!pollingUrl) throw new SeedAiError("Pixazo video missing poll URL", { code: "empty" });

    const completed = await this.poll(pollingUrl);
    const url = extractUrl(completed);
    if (!url) throw new SeedAiError("Pixazo video completed without URL", { code: "empty" });
    return {
      url,
      mimeType: "video/mp4",
      kind: "video",
      provider: "pixazo",
      model: this.videoModelId,
      commercialOk: true,
      durationSec: input.durationSec,
    };
  }

  private async poll(pollingUrl: string): Promise<Record<string, unknown>> {
    const deadline = Date.now() + this.timeoutMs;
    let delay = 4000;
    while (Date.now() < deadline) {
      const body = await this.getJson(pollingUrl);
      const status = String(body.status ?? "").toUpperCase();
      if (status === "COMPLETED" || status === "SUCCESS" || status === "SUCCEEDED") return body;
      if (status === "FAILED" || status === "ERROR") {
        throw new SeedAiError(`Pixazo video failed: ${String(body.error ?? status)}`, {
          code: "api_error",
        });
      }
      await sleep(delay);
      delay = Math.min(delay + 2000, 12_000);
    }
    throw new SeedAiError("Pixazo video timed out", { code: "timeout" });
  }

  private headers() {
    return {
      "Content-Type": "application/json",
      "Cache-Control": "no-cache",
      "Ocp-Apim-Subscription-Key": this.apiKey,
    };
  }

  private async postJson(path: string, payload: Record<string, unknown>) {
    return this.fetchJson(`${GATEWAY}${path}`, {
      method: "POST",
      headers: this.headers(),
      body: JSON.stringify(payload),
    });
  }

  private async getJson(url: string) {
    return this.fetchJson(url, { method: "GET", headers: this.headers() });
  }

  private async fetchJson(url: string, init: RequestInit): Promise<Record<string, unknown>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(url, { ...init, signal: controller.signal });
      if (res.status === 429) {
        throw new SeedAiError("Pixazo rate limit", { status: 429, code: "rate_limit" });
      }
      if (res.status === 401 || res.status === 403) {
        throw new SeedAiError("Pixazo rejected API key", { status: res.status, code: "auth" });
      }
      let body: Record<string, unknown> = {};
      try {
        body = (await res.json()) as Record<string, unknown>;
      } catch {
        /* ignore */
      }
      if (!res.ok) {
        throw new SeedAiError(
          `Pixazo error: ${String(body.error ?? body.message ?? res.statusText)}`,
          { status: res.status, code: "api_error" },
        );
      }
      return body;
    } catch (e) {
      if (e instanceof SeedAiError) throw e;
      if (e instanceof Error && e.name === "AbortError") {
        throw new SeedAiError("Pixazo timed out", { code: "timeout" });
      }
      throw new SeedAiError(e instanceof Error ? e.message : String(e), { code: "network" });
    } finally {
      clearTimeout(timer);
    }
  }
}

function extractUrl(body: Record<string, unknown>): string | null {
  const out = body.output;
  if (typeof out === "string" && /^https?:\/\//.test(out)) return out;
  if (out && typeof out === "object") {
    const media = (out as { media_url?: unknown }).media_url;
    if (typeof media === "string" && /^https?:\/\//.test(media)) return media;
    if (Array.isArray(media) && typeof media[0] === "string") return media[0];
  }
  if (typeof body.url === "string" && /^https?:\/\//.test(body.url)) return body.url;
  if (typeof body.image_url === "string") return body.image_url;
  if (typeof body.video_url === "string") return body.video_url;
  return null;
}

function guessMime(url: string, fallback: string): string {
  const lower = url.toLowerCase();
  if (lower.includes(".jpg") || lower.includes(".jpeg")) return "image/jpeg";
  if (lower.includes(".webp")) return "image/webp";
  if (lower.includes(".png")) return "image/png";
  if (lower.includes(".mp4")) return "video/mp4";
  return fallback;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
