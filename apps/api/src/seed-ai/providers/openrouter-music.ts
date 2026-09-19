import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { SeedAiError, type GenerateAudioInput, type GeneratedMedia, type MediaProvider } from "./types.js";

/**
 * OpenRouter music via Google Lyria (chat completions + audio modality).
 * Free smoke: google/lyria-3-clip-preview:free
 * Paid: google/lyria-3-clip-preview or google/lyria-3-pro-preview
 *
 * Audio is streamed as base64 chunks, then written to seed-cache for /seed-media/*.
 */
export class OpenRouterMusicClient implements MediaProvider {
  readonly id = "openrouter" as const;
  readonly label: string;
  readonly free: boolean;
  readonly commercialOk = true;

  private readonly apiKey: string;
  private readonly modelId: string;
  private readonly timeoutMs: number;
  private readonly cacheDir: string;
  private readonly publicBaseUrl: string;

  constructor(opts: {
    apiKey: string;
    modelId?: string;
    timeoutMs?: number;
    cacheDir: string;
    publicBaseUrl: string;
    free?: boolean;
  }) {
    if (!opts.apiKey?.trim()) {
      throw new SeedAiError("OPENROUTER_API_KEY is not configured", { code: "missing_key" });
    }
    this.apiKey = opts.apiKey.trim();
    this.modelId = opts.modelId?.trim() || "google/lyria-3-clip-preview:free";
    this.timeoutMs = opts.timeoutMs ?? 180_000;
    this.cacheDir = opts.cacheDir;
    this.publicBaseUrl = opts.publicBaseUrl.replace(/\/$/, "");
    this.free = opts.free ?? this.modelId.includes(":free");
    this.label = this.free
      ? "OpenRouter Lyria (Free)"
      : "OpenRouter Lyria (Paid)";
  }

  async generateAudio(input: GenerateAudioInput): Promise<GeneratedMedia> {
    const prompt = input.prompt.trim();
    if (!prompt) throw new SeedAiError("Audio prompt is required", { code: "validation" });

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:5173",
          "X-Title": "Creative Hub Seed",
          Accept: "text/event-stream",
        },
        body: JSON.stringify({
          model: this.modelId,
          messages: [{ role: "user", content: prompt }],
          modalities: ["audio", "text"],
          stream: true,
        }),
        signal: controller.signal,
      });

      if (res.status === 429) {
        throw new SeedAiError("OpenRouter music rate limit", { status: 429, code: "rate_limit" });
      }
      if (!res.ok) {
        const text = await res.text();
        throw new SeedAiError(
          `OpenRouter music error: ${text.slice(0, 240) || res.statusText}`,
          { status: res.status, code: "api_error" },
        );
      }

      const chunks = await collectAudioChunks(res);
      if (!chunks.length) {
        throw new SeedAiError("OpenRouter Lyria returned no audio chunks", { code: "empty" });
      }

      const buf = Buffer.concat(chunks.map((c) => Buffer.from(c, "base64")));
      if (buf.length < 100) {
        throw new SeedAiError("OpenRouter Lyria audio too small", { code: "empty" });
      }

      mkdirSync(this.cacheDir, { recursive: true });
      const ext = sniffAudioExt(buf);
      const filename = `lyria-${Date.now()}.${ext}`;
      writeFileSync(join(this.cacheDir, filename), buf);

      return {
        url: `${this.publicBaseUrl}/seed-media/${filename}`,
        mimeType: ext === "mp3" ? "audio/mpeg" : "audio/wav",
        kind: "audio",
        provider: "openrouter",
        model: this.modelId,
        commercialOk: true,
        durationSec: input.durationSec,
      };
    } catch (e) {
      if (e instanceof SeedAiError) throw e;
      if (e instanceof Error && e.name === "AbortError") {
        throw new SeedAiError("OpenRouter music timed out", { code: "timeout" });
      }
      throw new SeedAiError(e instanceof Error ? e.message : String(e), { code: "network" });
    } finally {
      clearTimeout(timer);
    }
  }
}

async function collectAudioChunks(res: Response): Promise<string[]> {
  const out: string[] = [];
  if (!res.body) {
    // Non-stream fallback
    const json = (await res.json()) as Record<string, unknown>;
    const fromJson = extractAudioBase64(json);
    if (fromJson) out.push(fromJson);
    return out;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const parts = buffer.split("\n");
    buffer = parts.pop() ?? "";
    for (const line of parts) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const data = trimmed.slice(5).trim();
      if (!data || data === "[DONE]") continue;
      try {
        const json = JSON.parse(data) as Record<string, unknown>;
        const chunk = extractDeltaAudio(json);
        if (chunk) out.push(chunk);
      } catch {
        /* ignore partial JSON */
      }
    }
  }
  return out;
}

function extractDeltaAudio(json: Record<string, unknown>): string | null {
  const choices = json.choices;
  if (!Array.isArray(choices) || !choices[0] || typeof choices[0] !== "object") return null;
  const choice = choices[0] as { delta?: unknown; message?: unknown };
  for (const node of [choice.delta, choice.message]) {
    if (!node || typeof node !== "object") continue;
    const audio = (node as { audio?: unknown }).audio;
    if (typeof audio === "string" && audio.length > 20) return audio;
    if (audio && typeof audio === "object") {
      const data = (audio as { data?: unknown }).data;
      if (typeof data === "string" && data.length > 20) return data;
    }
    const content = (node as { content?: unknown }).content;
    if (Array.isArray(content)) {
      for (const part of content) {
        if (!part || typeof part !== "object") continue;
        const p = part as { type?: string; data?: string; audio?: { data?: string } };
        if (p.type === "audio" && typeof p.data === "string") return p.data;
        if (p.audio?.data) return p.audio.data;
      }
    }
  }
  return null;
}

function extractAudioBase64(json: Record<string, unknown>): string | null {
  const fromChoices = extractDeltaAudio(json);
  if (fromChoices) return fromChoices;
  return null;
}

function sniffAudioExt(buf: Buffer): "wav" | "mp3" {
  if (buf.length >= 4 && buf.toString("ascii", 0, 4) === "RIFF") return "wav";
  if (buf.length >= 3 && buf.toString("ascii", 0, 3) === "ID3") return "mp3";
  if (buf.length >= 2 && buf[0] === 0xff && (buf[1] & 0xe0) === 0xe0) return "mp3";
  return "wav";
}
