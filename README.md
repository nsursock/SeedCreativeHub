# Creative Hub

> A digital home for creative communities worldwide — discover people and work, find collaborators, and turn online connections into real projects and Hub Nights. (Local/dev can stay Lebanon-focused via `HUB_MARKET=lebanon`.)

**Working title:** Creative Hub · **Repo:** SeedCreativeHub · **Status:** Phase 1 MVP monorepo

**Media scope (MVP):** music (audio) · photography (images) · film (video) · writing (text)

**Locales:** English · French · Arabic · Hebrew (RTL first-class for AR + HE)

---

## Table of contents

- [Why this exists](#why-this-exists)
- [Product thesis](#product-thesis)
- [What’s in the MVP](#whats-in-the-mvp)
- [Monorepo layout](#monorepo-layout)
- [Tech stack](#tech-stack)
- [Architecture](#architecture)
- [Prerequisites](#prerequisites)
- [Local setup](#local-setup)
- [Environment variables](#environment-variables)
- [Seed AI (demo content)](#seed-ai-demo-content)
- [Useful scripts](#useful-scripts)
- [Demo accounts & claim links](#demo-accounts--claim-links)
- [App routes](#app-routes)
- [API surface](#api-surface)
- [Adapters & portability](#adapters--portability)
- [UI, i18n & design system](#ui-i18n--design-system)
- [Documentation](#documentation)
- [Roadmap](#roadmap)
- [Out of scope (MVP)](#out-of-scope-mvp)
- [Troubleshooting](#troubleshooting)
- [Contributing](#contributing)
- [License](#license)

---

## Why this exists

Creative activity in Lebanon is fragmented across Instagram, TikTok, Behance, SoundCloud, WhatsApp groups, university networks, galleries, and personal introductions.

Creators and audiences struggle to:

- Discover emerging talent outside their immediate circle
- Search by discipline, city, skills, and “looking for collaborator”
- Present multidisciplinary work without being forced into one medium
- Turn online discovery into a meaningful human connection
- Stay connected from the diaspora to the home scene

Creative Hub aims to combine **local density + cross-discipline discovery + community depth + a recurring physical ritual (Hub Nights)**.

---

## Product thesis

This is not primarily a portfolio site or a social feed. Core value is **creative connection**.

```text
Create → Discover → Connect → Collaborate → Create again
```

Launch loop (physical ↔ digital):

```text
Hub Night / event → coverage & discovery → profiles claimed → collaboration → next event
```

**North-star metric:** meaningful creative connections per month (follows, collab interest, contact, event-based connections).

---

## What’s in the MVP

| Area | Capabilities |
|---|---|
| **Auth** | Email/password (Argon2id), magic link, session cookies, CSRF |
| **Profiles** | Multi-discipline creators, city/location, collab availability, claim flow for seeded artists |
| **Works** | Native text / image / audio / video works with media assets |
| **Discovery** | Explore, creators directory, works browse, search + filters |
| **Social** | Follow / unfollow |
| **Collaborate** | “Looking for…” opportunities + express interest |
| **Events** | Hub Night–style listings (external links / RSVP-oriented) |
| **Contact** | Structured contact / collab interest (not realtime chat) |
| **Notifications** | In-app notifications |
| **Moderation** | Reports + admin resolve |
| **Admin** | Seed/import profiles, claim links, feature content, waitlist, stats |
| **Waitlist** | Landing waitlist signup |
| **i18n** | EN / FR / AR / HE catalogs + `lang` / `dir` |
| **Seed AI** | Multi-provider gateway to generate demo creators & media (`free` / `paid`) |

---

## Monorepo layout

```text
SeedCreativeHub/
├── apps/
│   ├── web/                 # Svelte 5 + Vite SPA (@creative-hub/web)
│   │   ├── src/pages/       # Landing, Explore, Profiles, Works, Auth, Admin…
│   │   ├── src/messages/    # Locale catalogs (en/fr/ar/he)
│   │   └── e2e/             # Playwright + axe
│   └── api/                 # Fastify + GraphQL (@creative-hub/api)
│       ├── prisma/          # Schema, migrations, seed
│       ├── src/adapters/    # Media storage, mailer, cache
│       ├── src/auth/        # Sessions, passwords, magic/claim tokens
│       ├── src/graphql/     # typeDefs + resolvers
│       └── src/seed-ai/     # PubFana-style multi-provider media gateway
├── packages/
│   └── shared/              # Shared types, Zod, disciplines, cities (@creative-hub/shared)
├── docs/
│   ├── specs/               # PRD, functional, technical, UI/UX, acceptance
│   └── marketing/           # Marketing plan
├── docker-compose.yml       # Postgres 16 + Redis 7
├── .env.example             # Canonical env template
└── pnpm-workspace.yaml      # apps/* · packages/* · ../ScifiUI/packages/core
```

**Workspace note:** UI kit `@scifiui/core` is linked from the sibling repo `WD/ScifiUI` via pnpm workspace. Clone/checkout ScifiUI next to this repo (or adjust the workspace path) before installing.

---

## Tech stack

| Layer | Choice |
|---|---|
| **Package manager** | pnpm `11` (Node `≥20`) |
| **Web** | Svelte 5 · Vite 6 · Tailwind CSS v4 · svelte-spa-router |
| **UI kit** | **ScifiUI** (`@scifiui/core`) — default theme **`retrowave`** (do **not** use `seed-hub`) |
| **Icons** | Tabler Icons (`@tabler/icons-svelte`) only |
| **Fonts** | JetBrains Mono · Noto Sans Arabic · Noto Sans Hebrew |
| **API** | Fastify 5 · GraphQL · Zod |
| **Auth** | First-party sessions · Argon2id · Redis-backed sessions / rate limits |
| **DB** | PostgreSQL 16 · Prisma 6 |
| **Cache** | Redis 7 (sessions + rate limits only in MVP) |
| **Media** | MediaStorage adapter → Supabase Storage |
| **Mail** | Mailer adapter → Resend |
| **Observability** | Optional Sentry + analytics keys |
| **E2E** | Playwright (+ axe-core) |

---

## Architecture

```text
Browser (Svelte SPA, hash locales /#/{en|fr|ar|he}/…)
        │  GraphQL over HTTP
        ▼
Fastify API  ──► PostgreSQL (Prisma)
        │
        ├── Redis          (sessions, rate limits)
        ├── MediaStorage   (Supabase | future R2 / Cloudinary)
        ├── Mailer         (Resend | future SMTP)
        └── Seed AI gateway (OpenRouter, fal, Pixazo, ElevenLabs, …)
```

Design goals from the technical spec:

- Platform-agnostic deploy (managed PaaS early → VPS later without rewrite)
- Strong server-side authorization
- Adapters for storage / mail / cache — never hard-code provider SDKs into resolvers/UI
- Low-bandwidth dignity (`perf-lite`, reduced motion)

---

## Prerequisites

- **Node.js** ≥ 20
- **pnpm** 11+ (`corepack enable` recommended)
- **Docker** + Docker Compose (Postgres + Redis)
- Sibling **ScifiUI** checkout at `../ScifiUI` (workspace dependency)
- Optional API keys for real email, Supabase uploads, and Seed AI generation

---

## Local setup

```bash
# 1. Infra
pnpm db:up

# 2. Install (from SeedCreativeHub root; needs ../ScifiUI present)
pnpm install

# 3. Env (smoke + normal profiles)
cp .env.smoke.example apps/api/.env.smoke
cp .env.normal.example apps/api/.env.normal
# Fill provider keys in both (same secrets). Activate either for the API:
pnpm env:smoke    # or: pnpm env:normal

# 4. Shared package
pnpm --filter @creative-hub/shared build

# 5. Database (reset = empty schema; seed is a separate choice)
pnpm --filter @creative-hub/api exec prisma migrate dev
pnpm db:seed:smoke    # or: pnpm db:seed:normal

# 6. Dev servers (web :5173 · api :3001)
pnpm dev
```

Open **http://localhost:5173** → redirects to `/#/en` landing.

### First-time checklist

1. Docker health: Postgres on **5433**, Redis on **6379**
2. `SESSION_SECRET` / `CSRF_SECRET` are long random strings (≥32 chars)
3. For AI-backed seed media: set `SEED_AI_COST_MODE` and at least free-tier keys (see below)
4. Without live AI keys, seed still runs with stubs / sample media where configured

---

## Environment variables

Canonical template: [`.env.example`](./.env.example). Seed profiles: [`.env.smoke.example`](./.env.smoke.example) (tiny) · [`.env.normal.example`](./.env.normal.example) (fuller).

Local files: `apps/api/.env.smoke` / `apps/api/.env.normal` → activate with `pnpm env:smoke` or `pnpm env:normal` (copies onto `apps/api/.env`).

`pnpm db:reset` leaves a **migrated empty DB** (no demo data). Seed when you want:

```bash
pnpm db:reset
pnpm db:seed:smoke    # or: pnpm db:seed:normal
```

| Profile | Creators / works | Text / image / video / audio |
|---|---|---|
| **smoke** | 2 / 2 | 2 / 0 / 0 / 1 |
| **normal** | 8 / 8 | 8 / 1 / 1 / 1 |

### App & CORS

| Variable | Purpose | Default (local) |
|---|---|---|
| `NODE_ENV` | Runtime mode | `development` |
| `HUB_MARKET` | Audience scope: `lebanon` (local) or `worldwide` (prod) | `lebanon` when not production; `worldwide` in production |
| `VITE_HUB_MARKET` | Web build-time mirror of `HUB_MARKET` | same auto rule via Vite `PROD` |
| `PUBLIC_APP_URL` | Web origin | `http://localhost:5173` |
| `PUBLIC_API_URL` | API origin | `http://localhost:3001` |
| `CORS_ORIGINS` | Allowed origins | `http://localhost:5173` |
| `HOST` / `PORT` | API bind | `0.0.0.0` / `3001` |

### Data plane

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection (schema **`creative_hub`**) | Local docker on **5433**; staging = Supabase “My Stuff”; VPS later = same schema, new host |
| `REDIS_URL` | Redis for sessions + rate limits |

### Auth

| Variable | Purpose |
|---|---|
| `SESSION_SECRET` | Cookie/session signing |
| `SESSION_TTL_SECONDS` | Session lifetime (default 7d) |
| `CSRF_SECRET` | CSRF token secret |
| `MAGIC_LINK_TTL_SECONDS` | Magic link expiry |
| `CLAIM_TOKEN_TTL_DAYS` | Profile claim link expiry |

### Adapters

| Variable | Purpose |
|---|---|
| `STORAGE_PROVIDER` | `supabase` (MVP) |
| `SUPABASE_URL` / `SUPABASE_SECRET_KEY` / `SUPABASE_STORAGE_BUCKET` | Object storage (Secret key from dashboard; legacy `SUPABASE_SERVICE_ROLE_KEY` still accepted) |
| `MAIL_PROVIDER` | `resend` |
| `RESEND_API_KEY` / `MAIL_FROM` | Transactional email |

### Bootstrap / seed quotas

| Variable | Purpose |
|---|---|
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` | Seeded admin account |
| `SEED_QUOTA_CREATORS` / `SEED_QUOTA_WORKS` | How much demo content to generate |

### Observability (optional)

`SENTRY_DSN`, `PUBLIC_SENTRY_DSN`, `PUBLIC_ANALYTICS_KEY`, `PERF_LITE_DEFAULT`

---

## Seed AI (demo content)

Seed uses a **PubFana-style multi-provider gateway** with two cost modes.

Set in `apps/api/.env`:

```bash
SEED_AI_COST_MODE=free   # or paid
SEED_AI_MODE=            # live | stub  (omit → live when OPENROUTER_API_KEY is set)
SEED_AI_TEXT_COUNT=8     # OpenRouter creator packs (bios + work copy)
SEED_AI_IMAGE_COUNT=1
SEED_AI_VIDEO_COUNT=1
SEED_AI_AUDIO_COUNT=1
# OPENROUTER_MODEL=      # optional; empty → openrouter/free (free) or openai/gpt-4o-mini (paid)
```

### Cost mode matrix

| Mode | Text | Image | Video | Audio |
|---|---|---|---|---|
| **free** | OpenRouter `openrouter/free` | Pixazo → Free.ai → Picsum | Pixazo → Free.ai → sample | **ElevenLabs TTS** → HF/Replicate/Lyria → sample |
| **paid** | OpenRouter paid | fal → Replicate → Pixazo | fal → Replicate → Pixazo | fal → Replicate → HF → Lyria → ElevenLabs → sample |

### Free-mode keys

- `OPENROUTER_API_KEY` (+ optional `OPENROUTER_MODEL`, `OPENROUTER_MUSIC_MODEL`)
- `PIXAZO_API_KEY`, `FREEAI_API_KEY`
- `ELEVENLABS_API_KEY` (+ optional `ELEVENLABS_VOICE_ID`) — free plan TTS ~10k credits/mo

> Free audio tries [ElevenLabs Music Compose](https://elevenlabs.io/docs/api-reference/music/compose) first (`POST /v1/music`), then falls back to free TTS. Music Compose needs a paid ElevenLabs plan; free TTS needs a non-library voice ID (`ELEVENLABS_VOICE_ID`).

### Paid-mode keys

- `FAL_KEY` (+ optional `FAL_AUDIO_MODEL`)
- `REPLICATE_API_TOKEN`
- `HF_TOKEN` / `HF_AUDIO_ENDPOINT`
- OpenRouter + ElevenLabs as fallbacks

---

## Useful scripts

From the repo root (`package.json`):

| Script | What it does |
|---|---|
| `pnpm dev` | Web + API in parallel |
| `pnpm dev:web` | Vite only (`:5173`) |
| `pnpm dev:api` | Fastify only (`:3001`) |
| `pnpm build` | Build shared → api → web |
| `pnpm db:up` / `db:down` | Docker Compose Postgres + Redis |
| `pnpm db:migrate` | Prisma migrate deploy |
| `pnpm db:reset` | Hard reset (`creative_hub` + public leftovers) + migrate — **empty DB, no seed** |
| `pnpm db:seed` | Seed using whatever is in `apps/api/.env` |
| `pnpm db:seed:smoke` | Activate smoke env, then seed |
| `pnpm db:seed:normal` | Activate normal env, then seed |
| `pnpm lint` | Workspace lint (where present) |
| `pnpm test:e2e` | Playwright against web |

API package extras:

```bash
pnpm --filter @creative-hub/api db:migrate:dev
pnpm --filter @creative-hub/api db:generate
pnpm --filter @creative-hub/api db:push
```

---

## Demo accounts & claim links

After `pnpm db:seed`:

| Item | Value |
|---|---|
| **Admin** | `admin@creativehub.local` / `ChangeMeAdmin123!` |
| **Demo claim** | `/#/en/claim/demo-claim-token-maya-k-phase1` |

Change admin credentials via `ADMIN_EMAIL` / `ADMIN_PASSWORD` before seeding in any shared environment.

---

## App routes

Hash SPA routes (locale ∈ `en` \| `fr` \| `ar` \| `he`):

| Path | Page |
|---|---|
| `/#/{locale}` | Landing / waitlist |
| `/#/{locale}/explore` | Editorial + discovery |
| `/#/{locale}/creators` | Creator directory |
| `/#/{locale}/works` | Works browse |
| `/#/{locale}/works/:slug` | Work detail |
| `/#/{locale}/u/:handle` | Creator profile |
| `/#/{locale}/search` | Search |
| `/#/{locale}/collaborate` · `…/:slug` | Opportunities |
| `/#/{locale}/events` · `…/:slug` | Events |
| `/#/{locale}/auth` · `…/magic` | Sign in / magic link |
| `/#/{locale}/claim/:token` | Claim seeded profile |
| `/#/{locale}/create` | Publish (auth required) |
| `/#/{locale}/notifications` | Inbox (auth required) |
| `/#/{locale}/admin` | Admin (admin/editor) |

Browse is public; account surfaces gate on session.

---

## API surface

GraphQL endpoint on the Fastify server (`PUBLIC_API_URL`, default `http://localhost:3001`).

**Queries (high level):** `health`, `me`, `csrfToken`, `profile`, `work`, `explore`, `search`, `creators`, `works`, `opportunities`, `events`, `notifications`, `disciplines`, `cities`, plus admin list/stats.

**Mutations (high level):** waitlist, sign up/in/out, magic link, claim profile, onboarding/profile/work CRUD, opportunities + interest, events, follow, contact, reports, uploads, notifications, and a full admin suite (profiles, claim links, feature, moderation, etc.).

See `apps/api/src/graphql/typeDefs.ts` for the live schema.

---

## Adapters & portability

Internal interfaces live under `apps/api/src/adapters/`:

| Concern | Interface | MVP implementation |
|---|---|---|
| Media | `MediaStorage` | Supabase Storage |
| Mail | `Mailer` | Resend |
| Cache | Cache adapter | Redis |

**Portability rules:** config via env; stateless API; uploads never on local disk; Prisma against plain Postgres; swap providers by adding an adapter — not by forking product code. Early deploy can mix Vercel / Railway / Supabase; scale path is VPS + reverse proxy with the same artifacts.

---

## UI, i18n & design system

- **Must use ScifiUI** semantic classes (`btn`, `pane`, `card`, …) + Tailwind utilities
- Theme via `data-theme` and `--scifi-*` tokens; default **`retrowave`**
- **Tabler Icons only** — no second icon library
- Locales: catalogs under `apps/web/src/messages/`; missing keys fail loudly in dev and fall back to **en** in production
- `html[lang]` + `dir`: `en`/`fr` → LTR · `ar`/`he` → RTL
- Respect `prefers-reduced-motion` and optional `perf-lite`

Landing structure (marketing): hero (2-part Godfather offer) → supporting ×2 → pricing → CTA → restful footer.

---

## Documentation

Product and engineering specs live under [`docs/specs/`](./docs/specs/README.md):

| # | Document | Purpose |
|---|---|---|
| 01 | [Product Requirements (PRD)](./docs/specs/01-product-reqs.md) | Vision, users, scope, metrics, phases |
| 02 | [Functional Specifications](./docs/specs/02-functional-spec.md) | Feature behavior, rules, flows |
| 03 | [Technical Specifications](./docs/specs/03-technical-spec.md) | Architecture, data, APIs, infra |
| 04 | [UI/UX Specifications](./docs/specs/04-ui-ux-spec.md) | Experience principles, screens, a11y |
| 05 | [Acceptance Criteria](./docs/specs/05-acceptance-criteria.md) | Done conditions and release gates |

Also: [`docs/marketing/plan.md`](./docs/marketing/plan.md).

---

## Roadmap

| Phase | Theme | Exit criteria (high level) |
|---|---|---|
| **0 / Seed** | Waitlist, founding artists, Hub Nights | Community seeded before full product |
| **1 / MVP** | Profiles, works, explore, collabs, events, moderation | Core connection loop proven |
| **2 / Depth** | Open calls, richer messaging, analytics | Opportunity discovery + retention |
| **3 / Commerce** | Memberships, commissions, ticketing | Sustainable revenue |
| **4 / Regional** | MENA expansion | Multi-city / multi-country |

---

## Out of scope (MVP)

- Native realtime chat / group DMs
- ML recommendations
- Creator monetization marketplace / paid memberships
- Native mobile apps
- Web3, wallets, NFTs, IPFS
- Full ticketing / payments
- Heavy media transcoding pipelines
- Multi-country expansion

---

## Troubleshooting

| Symptom | Likely fix |
|---|---|
| `pnpm install` fails on `@scifiui/core` | Ensure `WD/ScifiUI` exists beside this repo (see `pnpm-workspace.yaml`) |
| `pnpm db:reset` / seed P2021 `creative_hub.*` missing | Stock Prisma reset only drops `creative_hub` and can leave stale `public` tables + `_prisma_migrations`. Use `pnpm db:reset` (hard reset script), or wipe docker volumes: `pnpm db:down && docker volume rm … && pnpm db:up` |
| DB connection errors | `pnpm db:up`; confirm `DATABASE_URL` port **5433** |
| Redis / session issues | Confirm Redis on **6379** and `REDIS_URL` |
| Empty / stub media after seed | Set `SEED_AI_COST_MODE` + provider keys, or accept sample fallbacks |
| CORS errors from web | Align `CORS_ORIGINS` with `PUBLIC_APP_URL` |
| Claim link expired | Regenerate via admin (`adminGenerateClaimLink`) or re-seed |
| Admin login fails | Re-seed after setting `ADMIN_*`, or reset password in DB |

---

## Contributing

1. Read the specs under `docs/specs/` before large product changes.
2. Prefer adapters over vendor lock-in for storage, mail, and cache.
3. Keep ScifiUI + Tabler as the only UI/icon systems.
4. Ship i18n parity for **en / fr / ar / he** on user-facing strings.
5. Run `pnpm build` and relevant e2e before opening a PR when UI flows change.

Open decisions still owned by founders (name, positioning voice, Hub Night venue, monetization order) are tracked in the PRD / specs README.

---

## License

Private / unlicensed unless a `LICENSE` file is added. All rights reserved by the project owners until stated otherwise.
