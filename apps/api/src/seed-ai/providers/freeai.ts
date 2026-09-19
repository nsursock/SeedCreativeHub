import { SeedAiError, type GenerateImageInput, type GenerateVideoInput, type GeneratedMedia, type MediaProvider } from "./types.js";

const BASE = "https://api.free.ai";

/** Free.ai daily token pool (PubFana). */
export class FreeAiClient implements MediaProvider {
  readonly id = "freeai" as const;
  readonly label = "Free.ai (Daily pool)";
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
      throw new SeedAiError("FREEAI_API_KEY is not configured", { code: "missing_key" });
    }
    this.apiKey = opts.apiKey.trim();
    this.timeoutMs = opts.timeoutMs ?? 180_000;
    this.imageModelId = opts.imageModelId?.trim() || "sdxl";
    this.videoModelId = opts.videoModelId?.trim() || "cogvideox-2b";
  }

  async generateImage(input: GenerateImageInput): Promise<GeneratedMedia> {
    const prompt = input.prompt.trim();
    if (!prompt) throw new SeedAiError("Image prompt is required", { code: "validation" });
    const body = await this.postJson("/v1/image/generate/", {
      prompt,
      model: this.imageModelId,
      aspect_ratio: "1:1",
    });
    const url = pickUrl(body, ["image_url", "url", "output"]);
    if (!url) throw new SeedAiError("Free.ai image missing URL", { code: "empty" });
    return {
      url,
      mimeType: guessMime(url, "image/png"),
      kind: "image",
      provider: "freeai",
      model: this.imageModelId,
      commercialOk: true,
    };
  }

  async generateVideo(input: GenerateVideoInput): Promise<GeneratedMedia> {
    const prompt = input.prompt.trim();
    if (!prompt) throw new SeedAiError("Video prompt is required", { code: "validation" });
    const duration = Math.min(Math.max(input.durationSec ?? 3, 2), 5);
    const payload: Record<string, unknown> = {
      prompt,
      model: this.videoModelId,
      duration,
    };
    if (input.imageUrl?.trim()) payload.image_url = input.imageUrl.trim();
    const body = await this.postJson("/v1/video/generate/", payload);
    const url = pickUrl(body, ["video_url", "url", "output"]) ?? (await this.pollIfNeeded(body));
    if (!url) throw new SeedAiError("Free.ai video missing URL", { code: "empty" });
    return {
      url,
      mimeType: guessMime(url, "video/mp4"),
      kind: "video",
      provider: "freeai",
      model: this.videoModelId,
      commercialOk: true,
      durationSec: duration,
    };
  }

  private async pollIfNeeded(body: Record<string, unknown>): Promise<string | null> {
    const jobId =
      (typeof body.job_id === "string" && body.job_id) ||
      (typeof body.id === "string" && body.id) ||
      null;
    if (!jobId) return null;
    const deadline = Date.now() + this.timeoutMs;
    while (Date.now() < deadline) {
      await sleep(2000);
      const status = await this.getJson(`/v1/status/${encodeURIComponent(jobId)}/`);
      const st = String(status.status ?? status.state ?? "").toLowerCase();
      if (["completed", "succeeded", "success", "done"].includes(st)) {
        return pickUrl(status, ["video_url", "image_url", "url", "output"]);
      }
      if (st === "failed" || st === "error") {
        throw new SeedAiError(`Free.ai job failed: ${String(status.error ?? st)}`, {
          code: "provider",
        });
      }
    }
    throw new SeedAiError("Free.ai job timed out", { code: "timeout" });
  }

  private async postJson(path: string, payload: Record<string, unknown>) {
    return this.request("POST", path, payload);
  }

  private async getJson(path: string) {
    return this.request("GET", path);
  }

  private async request(
    method: "GET" | "POST",
    path: string,
    payload?: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(`${BASE}${path}`, {
        method,
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          ...(payload ? { "Content-Type": "application/json" } : {}),
        },
        body: payload ? JSON.stringify(payload) : undefined,
        signal: controller.signal,
      });
      const text = await res.text();
      let json: Record<string, unknown> = {};
      try {
        json = text ? (JSON.parse(text) as Record<string, unknown>) : {};
      } catch {
        json = { raw: text };
      }
      if (res.status === 402) {
        throw new SeedAiError("Free.ai out of tokens — wait for daily reset", {
          status: 402,
          code: "quota",
        });
      }
      if (!res.ok) {
        throw new SeedAiError(
          `Free.ai error: ${String(json.error ?? json.message ?? res.statusText)}`,
          { status: res.status, code: "provider" },
        );
      }
      return json;
    } catch (e) {
      if (e instanceof SeedAiError) throw e;
      if (e instanceof Error && e.name === "AbortError") {
        throw new SeedAiError("Free.ai timed out", { code: "timeout" });
      }
      throw new SeedAiError(e instanceof Error ? e.message : String(e), { code: "network" });
    } finally {
      clearTimeout(timer);
    }
  }
}

function pickUrl(body: Record<string, unknown>, keys: string[]): string | null {
  for (const k of keys) {
    const v = body[k];
    if (typeof v === "string" && /^https?:\/\//i.test(v)) return v;
    if (Array.isArray(v) && typeof v[0] === "string" && /^https?:\/\//i.test(v[0])) return v[0];
  }
  const nested = body.output;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return pickUrl(nested as Record<string, unknown>, keys);
  }
  return null;
}

function guessMime(url: string, fallback: string): string {
  const lower = url.toLowerCase();
  if (lower.includes(".png")) return "image/png";
  if (lower.includes(".jpg") || lower.includes(".jpeg")) return "image/jpeg";
  if (lower.includes(".webp")) return "image/webp";
  if (lower.includes(".mp4")) return "video/mp4";
  return fallback;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
