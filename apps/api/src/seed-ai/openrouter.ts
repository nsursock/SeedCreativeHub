import { SeedAiError } from "./errors.js";

export type OpenRouterMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type OpenRouterChatResult = {
  content: string;
  model: string;
};

/**
 * Thin OpenRouter chat client (PubFana-inspired).
 * Prefer free router `openrouter/free` for seed smoke tests.
 */
export class OpenRouterClient {
  private readonly apiKey: string;
  private readonly model: string;
  private readonly baseUrl: string;
  private readonly timeoutMs: number;

  constructor(opts: { apiKey: string; model?: string; timeoutMs?: number }) {
    if (!opts.apiKey?.trim()) {
      throw new SeedAiError("OPENROUTER_API_KEY is not configured", { code: "missing_key" });
    }
    this.apiKey = opts.apiKey.trim();
    this.model = opts.model?.trim() || "openrouter/free";
    this.baseUrl = "https://openrouter.ai/api/v1";
    this.timeoutMs = opts.timeoutMs ?? 90_000;
  }

  async chat(
    messages: OpenRouterMessage[],
    opts?: { temperature?: number },
  ): Promise<OpenRouterChatResult> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      const res = await fetch(`${this.baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:5173",
          "X-Title": "Creative Hub Seed",
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: opts?.temperature ?? 0.7,
        }),
        signal: controller.signal,
      });

      if (res.status === 429) {
        throw new SeedAiError("OpenRouter rate limit — retry shortly", {
          status: 429,
          code: "rate_limit",
        });
      }
      if (!res.ok) {
        let detail = res.statusText;
        try {
          const errBody = (await res.json()) as { error?: { message?: string } };
          detail = errBody.error?.message ?? detail;
        } catch {
          /* ignore */
        }
        throw new SeedAiError(`OpenRouter error: ${detail}`, {
          status: res.status,
          code: "api_error",
        });
      }

      const body = (await res.json()) as {
        model?: string;
        choices?: { message?: { content?: string | null; reasoning?: string | null } }[];
      };
      const message = body.choices?.[0]?.message;
      let content = message?.content?.trim() ?? "";
      if (!content && message?.reasoning) content = message.reasoning.trim();
      if (!content) {
        throw new SeedAiError("OpenRouter returned an empty completion", { code: "empty" });
      }
      return { content, model: body.model ?? this.model };
    } catch (e) {
      if (e instanceof SeedAiError) throw e;
      if (e instanceof Error && e.name === "AbortError") {
        throw new SeedAiError(`OpenRouter timed out after ${this.timeoutMs}ms`, {
          code: "timeout",
        });
      }
      throw new SeedAiError(e instanceof Error ? e.message : String(e), { code: "network" });
    } finally {
      clearTimeout(timer);
    }
  }
}
