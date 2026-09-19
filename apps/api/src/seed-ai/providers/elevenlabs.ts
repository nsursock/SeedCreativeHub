import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { SeedAiError, type GenerateAudioInput, type GeneratedMedia, type MediaProvider } from "./types.js";

/**
 * ElevenLabs audio:
 * 1. Music Compose API  POST /v1/music  (paid plan — see docs)
 * 2. Falls back to free-tier TTS if music returns payment_required / limited_access
 *
 * Docs: https://elevenlabs.io/docs/api-reference/music/compose
 */
export class ElevenLabsTtsClient implements MediaProvider {
  readonly id = "elevenlabs" as const;
  readonly label = "ElevenLabs Music / TTS";
  readonly free = true;
  /** Free-plan TTS is personal/non-commercial; Music needs paid */
  readonly commercialOk = false;

  private readonly apiKey: string;
  private readonly voiceId: string;
  private readonly ttsModelId: string;
  private readonly musicModelId: string;
  private readonly preferMusic: boolean;
  private readonly timeoutMs: number;
  private readonly cacheDir: string;
  private readonly publicBaseUrl: string;

  constructor(opts: {
    apiKey: string;
    voiceId?: string;
    modelId?: string;
    musicModelId?: string;
    /** Try /v1/music first (default true); set ELEVENLABS_PREFER_MUSIC=0 to TTS-only */
    preferMusic?: boolean;
    timeoutMs?: number;
    cacheDir: string;
    publicBaseUrl: string;
  }) {
    if (!opts.apiKey?.trim()) {
      throw new SeedAiError("ELEVENLABS_API_KEY is not configured", { code: "missing_key" });
    }
    this.apiKey = opts.apiKey.trim();
    // Premade voice that works on free-plan API (Rachel/library voices often 402)
    this.voiceId = opts.voiceId?.trim() || "JBFqnCBsd6RMkjVDRZzb";
    this.ttsModelId = opts.modelId?.trim() || "eleven_multilingual_v2";
    this.musicModelId = opts.musicModelId?.trim() || "music_v2";
    this.preferMusic = opts.preferMusic !== false;
    this.timeoutMs = opts.timeoutMs ?? 180_000;
    this.cacheDir = opts.cacheDir;
    this.publicBaseUrl = opts.publicBaseUrl.replace(/\/$/, "");
  }

  async generateAudio(input: GenerateAudioInput): Promise<GeneratedMedia> {
    const prompt = input.prompt.trim();
    if (!prompt) throw new SeedAiError("Audio prompt is required", { code: "validation" });

    if (this.preferMusic) {
      try {
        return await this.composeMusic(prompt, input.durationSec);
      } catch (e) {
        if (!isMusicUnavailable(e)) throw e;
        // Fall through to free TTS
      }
    }

    return this.synthesizeSpeech(prompt, input.durationSec);
  }

  /** https://elevenlabs.io/docs/api-reference/music/compose */
  private async composeMusic(prompt: string, durationSec?: number): Promise<GeneratedMedia> {
    const lengthMs = Math.min(
      Math.max(Math.round((durationSec ?? 8) * 1000), 3000),
      30_000, // keep smoke cheap
    );

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(
        "https://api.elevenlabs.io/v1/music?output_format=mp3_44100_128",
        {
          method: "POST",
          headers: {
            "xi-api-key": this.apiKey,
            "Content-Type": "application/json",
            Accept: "audio/mpeg",
          },
          body: JSON.stringify({
            prompt: prompt.slice(0, 2000),
            music_length_ms: lengthMs,
            model_id: this.musicModelId,
            force_instrumental: true,
          }),
          signal: controller.signal,
        },
      );

      if (!res.ok) {
        const errText = await res.text();
        throw new SeedAiError(
          `ElevenLabs music error: ${errText.slice(0, 280) || res.statusText}`,
          { status: res.status, code: res.status === 402 ? "payment_required" : "provider" },
        );
      }

      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 500) {
        throw new SeedAiError("ElevenLabs music returned empty audio", { code: "empty" });
      }

      return this.writeCache(buf, "music", this.musicModelId, durationSec ?? lengthMs / 1000);
    } catch (e) {
      if (e instanceof SeedAiError) throw e;
      if (e instanceof Error && e.name === "AbortError") {
        throw new SeedAiError("ElevenLabs music timed out", { code: "timeout" });
      }
      throw new SeedAiError(e instanceof Error ? e.message : String(e), { code: "network" });
    } finally {
      clearTimeout(timer);
    }
  }

  private async synthesizeSpeech(prompt: string, durationSec?: number): Promise<GeneratedMedia> {
    const text = toSpokenSeed(prompt).slice(0, 400);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const url =
        `https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(this.voiceId)}` +
        `?output_format=mp3_44100_128`;

      const res = await fetch(url, {
        method: "POST",
        headers: {
          "xi-api-key": this.apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: this.ttsModelId,
        }),
        signal: controller.signal,
      });

      if (res.status === 401 || res.status === 403) {
        const errText = await res.text();
        throw new SeedAiError(
          `ElevenLabs auth error: ${errText.slice(0, 160) || res.statusText}`,
          { status: res.status, code: "provider" },
        );
      }
      if (res.status === 429) {
        throw new SeedAiError("ElevenLabs rate limit / quota", { status: 429, code: "rate_limit" });
      }
      if (!res.ok) {
        const errText = await res.text();
        throw new SeedAiError(
          `ElevenLabs TTS error: ${errText.slice(0, 220) || res.statusText}`,
          { status: res.status, code: "provider" },
        );
      }

      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 100) {
        throw new SeedAiError("ElevenLabs returned empty audio", { code: "empty" });
      }

      return {
        ...this.writeCache(buf, "tts", this.ttsModelId, durationSec),
        warning:
          "ElevenLabs free TTS (spoken audio). Music Compose needs a paid plan — see /v1/music docs.",
      };
    } catch (e) {
      if (e instanceof SeedAiError) throw e;
      if (e instanceof Error && e.name === "AbortError") {
        throw new SeedAiError("ElevenLabs TTS timed out", { code: "timeout" });
      }
      throw new SeedAiError(e instanceof Error ? e.message : String(e), { code: "network" });
    } finally {
      clearTimeout(timer);
    }
  }

  private writeCache(
    buf: Buffer,
    kind: "music" | "tts",
    model: string,
    durationSec?: number,
  ): GeneratedMedia {
    mkdirSync(this.cacheDir, { recursive: true });
    const filename = `elevenlabs-${kind}-${Date.now()}.mp3`;
    writeFileSync(join(this.cacheDir, filename), buf);
    return {
      url: `${this.publicBaseUrl}/seed-media/${filename}`,
      mimeType: "audio/mpeg",
      kind: "audio",
      provider: "elevenlabs",
      model,
      commercialOk: kind === "music",
      durationSec,
    };
  }
}

function isMusicUnavailable(e: unknown): boolean {
  if (!(e instanceof SeedAiError)) return false;
  if (e.code === "payment_required" || e.status === 402) return true;
  const msg = e.message.toLowerCase();
  return (
    msg.includes("paid_plan_required") ||
    msg.includes("not available for free") ||
    msg.includes("payment_required") ||
    msg.includes("limited_access")
  );
}

function toSpokenSeed(prompt: string): string {
  const lower = prompt.toLowerCase();
  if (
    lower.includes("instrumental") ||
    lower.includes("beat") ||
    lower.includes("lo-fi") ||
    lower.includes("lofi") ||
    lower.includes("bpm") ||
    lower.includes("synth")
  ) {
    return `A Creative Hub seed. Imagine this sound: ${prompt}.`;
  }
  return prompt;
}
