import "dotenv/config";
import { defaultCountryForMarket, resolveMarketScope } from "@creative-hub/shared";
import { parseCostMode } from "./seed-ai/costMode.js";

const nodeEnv = process.env.NODE_ENV ?? "development";
const marketScope = resolveMarketScope(process.env.HUB_MARKET ?? process.env.MARKET_SCOPE, {
  isProduction: nodeEnv === "production",
});

export const env = {
  nodeEnv,
  /** lebanon (local default) · worldwide (prod default). Override with HUB_MARKET. */
  marketScope,
  /** Profile country when omitted — Lebanon in local market, empty worldwide. */
  defaultCountry: defaultCountryForMarket(marketScope),
  host: process.env.HOST ?? "0.0.0.0",
  port: Number(process.env.PORT ?? 3001),
  publicAppUrl: process.env.PUBLIC_APP_URL ?? "http://localhost:5173",
  publicApiUrl: process.env.PUBLIC_API_URL ?? "http://localhost:3001",
  corsOrigins: (process.env.CORS_ORIGINS ?? "http://localhost:5173").split(",").map((s) => s.trim()),
  databaseUrl: process.env.DATABASE_URL ?? "",
  redisUrl: process.env.REDIS_URL ?? "redis://localhost:6379",
  sessionSecret: process.env.SESSION_SECRET ?? "dev-session-secret-change-me-32chars",
  sessionTtlSeconds: Number(process.env.SESSION_TTL_SECONDS ?? 604800),
  csrfSecret: process.env.CSRF_SECRET ?? "dev-csrf-secret-change-me-32chars!!",
  magicLinkTtlSeconds: Number(process.env.MAGIC_LINK_TTL_SECONDS ?? 900),
  claimTokenTtlDays: Number(process.env.CLAIM_TOKEN_TTL_DAYS ?? 7),
  storageProvider: process.env.STORAGE_PROVIDER ?? "supabase",
  supabaseUrl: process.env.SUPABASE_URL ?? "",
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY ?? "",
  supabaseStorageBucket: process.env.SUPABASE_STORAGE_BUCKET ?? "media",
  mailProvider: process.env.MAIL_PROVIDER ?? "resend",
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  mailFrom: process.env.MAIL_FROM ?? "Creative Hub <noreply@localhost>",
  sentryDsn: process.env.SENTRY_DSN ?? "",
  adminEmail: process.env.ADMIN_EMAIL ?? "admin@creativehub.local",
  adminPassword: process.env.ADMIN_PASSWORD ?? "ChangeMeAdmin123!",
  seedQuotaCreators: Number(process.env.SEED_QUOTA_CREATORS ?? 100),
  seedQuotaWorks: Number(process.env.SEED_QUOTA_WORKS ?? 50),

  /** live | stub — omit to auto: live when OPENROUTER_API_KEY present */
  seedAiMode: (process.env.SEED_AI_MODE ?? "").trim().toLowerCase(),
  /** free | paid — selects provider chains (default free) */
  seedAiCostMode: parseCostMode(process.env.SEED_AI_COST_MODE),

  openRouterApiKey: process.env.OPENROUTER_API_KEY ?? "",
  /** Override text model; empty → TEXT_MODELS[costMode] (free: openrouter/free, paid: openai/gpt-4o-mini) */
  openRouterModel: process.env.OPENROUTER_MODEL ?? "",
  /** Override Lyria music model; defaults by cost mode (free→:free clip, paid→clip) */
  openRouterMusicModel: process.env.OPENROUTER_MUSIC_MODEL ?? "",
  openRouterTimeoutMs: Number(process.env.OPENROUTER_TIMEOUT_MS ?? 90_000),

  pixazoApiKey: process.env.PIXAZO_API_KEY ?? "",
  pixazoTimeoutMs: Number(process.env.PIXAZO_TIMEOUT_MS ?? 120_000),
  freeAiApiKey: process.env.FREEAI_API_KEY ?? "",
  freeAiTimeoutMs: Number(process.env.FREEAI_TIMEOUT_MS ?? 180_000),
  falApiKey: process.env.FAL_KEY ?? "",
  /** fal music model — default fal-ai/lyria3 (or fal-ai/minimax-music/v2.6) */
  falAudioModel: process.env.FAL_AUDIO_MODEL ?? "",
  falTimeoutMs: Number(process.env.FAL_TIMEOUT_MS ?? 180_000),
  replicateApiKey: process.env.REPLICATE_API_TOKEN ?? "",
  replicateTimeoutMs: Number(process.env.REPLICATE_TIMEOUT_MS ?? 180_000),
  hfToken: process.env.HF_TOKEN ?? "",
  hfTimeoutMs: Number(process.env.HF_TIMEOUT_MS ?? 180_000),
  /** MusicGen / custom Inference Endpoint URL (MusicGen is not on serverless providers) */
  hfAudioEndpoint: process.env.HF_AUDIO_ENDPOINT ?? "",
  hfMusicModel: process.env.HF_MUSIC_MODEL ?? "",

  /** Free-tier TTS (spoken audio). Music API is paid — not used here. */
  elevenLabsApiKey: process.env.ELEVENLABS_API_KEY ?? "",
  elevenLabsVoiceId: process.env.ELEVENLABS_VOICE_ID ?? "",
  elevenLabsModelId: process.env.ELEVENLABS_MODEL_ID ?? "",
  elevenLabsMusicModelId: process.env.ELEVENLABS_MUSIC_MODEL ?? "",
  elevenLabsPreferMusic: (process.env.ELEVENLABS_PREFER_MUSIC ?? "1").trim() !== "0",
  elevenLabsTimeoutMs: Number(process.env.ELEVENLABS_TIMEOUT_MS ?? 180_000),

  /** How many creator profiles to generate via OpenRouter text (rest = stub/filler). */
  seedAiTextCount: Number(process.env.SEED_AI_TEXT_COUNT ?? 8),
  seedAiImageCount: Number(process.env.SEED_AI_IMAGE_COUNT ?? 1),
  seedAiVideoCount: Number(process.env.SEED_AI_VIDEO_COUNT ?? 0),
  seedAiAudioCount: Number(process.env.SEED_AI_AUDIO_COUNT ?? 1),
};
