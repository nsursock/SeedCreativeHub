# Creative Hub

Phase 1 MVP monorepo: discover creators in Lebanon, collaborate, and attend Hub Nights.

**Media scope (for now):** music (audio) · photography (images) · film (video) · writing (text).

## Stack

- **Web:** Svelte 5 · Vite · Tailwind v4 · ScifiUI (`retrowave`) · Tabler Icons · EN/FR/AR/HE
- **API:** Fastify · GraphQL · Prisma · Postgres · Redis (sessions + rate limits only)
- **Adapters:** MediaStorage → Supabase · Mailer → Resend · Cache → Redis
- **Seed AI:** PubFana-style multi-provider gateway with **two cost modes** — `free` and `paid`

## AI seed cost modes

| Mode | Text | Image | Video | Audio |
|---|---|---|---|---|
| **free** | OpenRouter `openrouter/free` | Pixazo → Free.ai → Picsum | Pixazo → Free.ai → sample | **ElevenLabs TTS** → HF/Replicate/Lyria → sample |
| **paid** | OpenRouter paid | fal → Replicate → Pixazo | fal → Replicate → Pixazo | fal → Replicate → HF → Lyria → ElevenLabs → sample |

Set `SEED_AI_COST_MODE=free` or `paid` in `apps/api/.env`. For free spoken audio: `ELEVENLABS_API_KEY` (10k credits/mo). Optional: `ELEVENLABS_VOICE_ID`, `HF_AUDIO_ENDPOINT`, `OPENROUTER_MUSIC_MODEL`, `FAL_AUDIO_MODEL`.

> Free audio tries [ElevenLabs Music Compose](https://elevenlabs.io/docs/api-reference/music/compose) first (`POST /v1/music`), then falls back to free TTS. Music API requires a paid plan; free TTS needs a non-library voice ID (`ELEVENLABS_VOICE_ID`).

## Local setup

```bash
pnpm db:up
pnpm install
cp .env.example apps/api/.env
# Set SEED_AI_COST_MODE=free (default) and free-tier keys, or paid + FAL/Replicate keys
pnpm --filter @creative-hub/shared build
pnpm --filter @creative-hub/api exec prisma migrate dev --name init
pnpm db:seed
pnpm dev
```

Open http://localhost:5173 → redirects to `/#/en` landing.

### Useful accounts / tokens

| Item | Value |
|---|---|
| Admin | `admin@creativehub.local` / `ChangeMeAdmin123!` |
| Demo claim | `/#/en/claim/demo-claim-token-maya-k-phase1` |
