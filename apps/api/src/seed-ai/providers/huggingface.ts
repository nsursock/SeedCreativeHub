import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { SeedAiError, type GenerateAudioInput, type GeneratedMedia, type MediaProvider } from "./types.js";

/**
 * Hugging Face music generation.
 *
 * MusicGen is no longer on HF serverless Inference Providers. Options:
 * 1. Custom Inference Endpoint URL (HF_AUDIO_ENDPOINT) — pay-as-you-go GPU
 * 2. Legacy router attempt for HF_MUSIC_MODEL (usually 400 unsupported)
 *
 * Binary audio is written to seed-cache and served at /seed-media/*.
 */
export class HuggingFaceMusicClient implements MediaProvider {
  readonly id = "huggingface" as const;
  readonly label = "Hugging Face Music (Credits)";
  readonly free = false;
  readonly commercialOk = true;

  private readonly apiKey: string;
  private readonly timeoutMs: number;
  private readonly modelId: string;
  private readonly endpointUrl: string | null;
  private readonly cacheDir: string;
  private readonly publicBaseUrl: string;

  constructor(opts: {
    apiKey: string;
    timeoutMs?: number;
    modelId?: string;
    /** Dedicated Inference Endpoint base URL (preferred for MusicGen) */
    endpointUrl?: string;
    cacheDir: string;
    publicBaseUrl: string;
  }) {
    if (!opts.apiKey?.trim()) {
      throw new SeedAiError("HF_TOKEN is not configured", { code: "missing_key" });
    }
    this.apiKey = opts.apiKey.trim();
    this.timeoutMs = opts.timeoutMs ?? 180_000;
    this.modelId = opts.modelId?.trim() || "facebook/musicgen-small";
    this.endpointUrl = opts.endpointUrl?.trim().replace(/\/$/, "") || null;
    this.cacheDir = opts.cacheDir;
    this.publicBaseUrl = opts.publicBaseUrl.replace(/\/$/, "");
  }

  async generateAudio(input: GenerateAudioInput): Promise<GeneratedMedia> {
    const prompt = input.prompt.trim();
    if (!prompt) throw new SeedAiError("Audio prompt is required", { code: "validation" });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const urls = this.endpointUrl
        ? [this.endpointUrl]
        : [
            `https://router.huggingface.co/hf-inference/models/${this.modelId}`,
            `https://api-inference.huggingface.co/models/${this.modelId}`,
          ];

      let lastErr: Error | null = null;
      for (const url of urls) {
        try {
          const media = await this.callOnce(url, prompt, input.durationSec, controller.signal);
          if (media) return media;
        } catch (e) {
          lastErr = e instanceof Error ? e : new Error(String(e));
          // Model cold-start: wait and retry same URL once
          if (e instanceof SeedAiError && e.status === 503) {
            await sleep(15_000);
            try {
              const media = await this.callOnce(url, prompt, input.durationSec, controller.signal);
              if (media) return media;
            } catch (e2) {
              lastErr = e2 instanceof Error ? e2 : new Error(String(e2));
            }
          }
        }
      }
      throw lastErr ?? new SeedAiError("Hugging Face music failed", { code: "provider" });
    } catch (e) {
      if (e instanceof SeedAiError) throw e;
      if (e instanceof Error && e.name === "AbortError") {
        throw new SeedAiError("Hugging Face timed out", { code: "timeout" });
      }
      throw new SeedAiError(e instanceof Error ? e.message : String(e), { code: "network" });
    } finally {
      clearTimeout(timer);
    }
  }

  private async callOnce(
    url: string,
    prompt: string,
    durationSec: number | undefined,
    signal: AbortSignal,
  ): Promise<GeneratedMedia> {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        inputs: prompt,
        parameters: {
          max_new_tokens: Math.min(Math.max(Math.round((durationSec ?? 8) * 50), 128), 512),
        },
      }),
      signal,
    });

    if (res.status === 503) {
      throw new SeedAiError("Hugging Face model loading", { status: 503, code: "provider" });
    }

    if (!res.ok) {
      const text = await res.text();
      throw new SeedAiError(`Hugging Face error: ${text.slice(0, 220) || res.statusText}`, {
        status: res.status,
        code: "provider",
      });
    }

    const ct = (res.headers.get("content-type") || "").toLowerCase();
    let buf = Buffer.from(await res.arrayBuffer());

    // Some custom endpoints return JSON with base64 / float arrays
    if (ct.includes("json") || (buf[0] === 0x7b /* { */)) {
      buf = decodeJsonAudio(buf);
    }

    if (buf.length < 100) {
      throw new SeedAiError("Hugging Face returned empty audio", { code: "empty" });
    }

    mkdirSync(this.cacheDir, { recursive: true });
    const ext = sniffAudioExt(buf);
    const filename = `hf-music-${Date.now()}.${ext}`;
    writeFileSync(join(this.cacheDir, filename), buf);

    return {
      url: `${this.publicBaseUrl}/seed-media/${filename}`,
      mimeType: ext === "mp3" ? "audio/mpeg" : "audio/wav",
      kind: "audio",
      provider: "huggingface",
      model: this.endpointUrl ? `endpoint:${this.modelId}` : this.modelId,
      commercialOk: true,
      durationSec,
    };
  }
}

function decodeJsonAudio(buf: Buffer): Buffer {
  try {
    const json = JSON.parse(buf.toString("utf8")) as unknown;
    const b64 = findBase64Audio(json);
    if (b64) return Buffer.from(b64, "base64");
  } catch {
    /* fall through */
  }
  return buf;
}

function findBase64Audio(node: unknown): string | null {
  if (!node) return null;
  if (typeof node === "string" && node.length > 200) return node;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findBase64Audio(item);
      if (found) return found;
    }
    return null;
  }
  if (typeof node === "object") {
    const o = node as Record<string, unknown>;
    for (const k of ["audio", "audio_base64", "blob", "data", "generated_audio", "output"]) {
      if (k in o) {
        const found = findBase64Audio(o[k]);
        if (found) return found;
      }
    }
  }
  return null;
}

function sniffAudioExt(buf: Buffer): "wav" | "mp3" {
  if (buf.length >= 4 && buf.toString("ascii", 0, 4) === "RIFF") return "wav";
  if (buf.length >= 3 && buf.toString("ascii", 0, 3) === "ID3") return "mp3";
  if (buf.length >= 2 && buf[0] === 0xff && (buf[1]! & 0xe0) === 0xe0) return "mp3";
  return "wav";
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
