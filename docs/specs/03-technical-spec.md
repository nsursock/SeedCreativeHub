# Technical Specifications

**Product:** Creative Hub  
**Owner:** Technical Lead  
**Status:** Final consolidated draft v1.0  
**Companions:** [01-product-reqs.md](./01-product-reqs.md) · [02-functional-spec.md](./02-functional-spec.md)

Stack below is **confirmed** for MVP. Swap only with Tech Lead + founder sign-off.

---

## 1. Technical goals

- Fast MVP; low ops burden; low operating cost  
- **Platform-agnostic deploy** — run on managed PaaS early, move to a VPS without rewriting the app  
- Strong **server-side** authorization  
- SEO-friendly public pages (prerender / SSG where needed)  
- Modular media (object storage, not DB blobs)  
- **Elegant i18n** — EN / FR / AR / HE from day one; RTL first-class for AR + HE  
- Graceful under poor connectivity  
- Clear path from Lebanon MVP → diaspora → regional  

---

## 2. Architecture

```text
Clients: Web (Svelte + Vite, mobile-first)  →  later iOS/Android

Edge: CDN · WAF · image resize · object storage
     (same shape on PaaS or VPS)

Frontend (Vite static / prerender)
  ├── Svelte + **ScifiUI** (`@scifiui/core` from workspace `ScifiUI/`)
  ├── GSAP (incl. ScifiUI helpers) · Three.js
  └── GraphQL client → API  (PUBLIC_API_URL)

Backend (Fastify — standard Node process)
  ├── GraphQL API
  ├── Auth (email/password via Argon2id; sessions/JWT)
  ├── Admin routes
  └── Background jobs hooks (email / media)

Services (logical)
  Auth · Profile · Work · Discovery · Collaboration
  Event · Notification · Moderation · Media jobs

Persistence (portable URLs / adapters)
  PostgreSQL · Prisma · Media Storage adapter
    (Supabase Storage | R2 | later Cloudinary)
  Redis (cache/rate limits)
  Optional queue for email/media · Search: Postgres FTS first

Deploy targets
  Early: Vercel / Railway / Supabase (mix OK)
  Scale: VPS (Docker + reverse proxy) — same artifacts
```

### Confirmed stack (MVP)

| Layer | Choice | Rationale |
|---|---|---|
| Frontend | Svelte + Vite + TypeScript | Lean UI, fast DX, full control of motion/3D |
| UI kit | **ScifiUI** (`@scifiui/core`) — workspace root `WD/ScifiUI` | **Required** design system; do not invent a parallel kit |
| Motion | GSAP (+ `@scifiui/core/js` helpers where useful) | Intentional editorial motion; respects reduced-motion / `perf-lite` |
| 3D / immersive | Three.js | Selective hero / work / event moments — not every page |
| Styling | Tailwind CSS v4 + ScifiUI plugin + `--scifi-*` tokens | Class-based (`btn`, `pane`, …); theme via `data-theme` |
| Icons | **Tabler Icons** (`@tabler/icons-svelte` or equiv.) | **Required** site-wide; single icon set only |
| i18n | Locale catalogs + router (`en`/`fr`/`ar`/`he`) | Elegant multi-locale from day one; EN default |
| API | Fastify + GraphQL | Typed schema; flexible client queries |
| DB | PostgreSQL | Relational fit; FTS |
| ORM | Prisma | Type-safe schema + migrations |
| Auth | First-party (Fastify) + **Argon2id** password hashing | Magic link + OAuth optional; passwords never plaintext |
| Storage | **Early:** Supabase Storage **or** Cloudflare R2 → **Later:** optional Cloudinary | Cheap start; switch via adapter |
| Images / transforms | Early: provider CDN / public URLs · Later: Cloudinary (or imgproxy) | Don’t hard-code transform URLs in app |
| Cache | Redis (e.g. Upstash) | Rate limits, sessions, feed cache |
| Email | Resend / Postmark | Transactional |
| Hosting | **Early:** Vercel / Railway / Supabase (or mix) → **Scale:** VPS | Start managed; exit to VPS without rewrite |
| Analytics | PostHog or Plausible + product events | Privacy-aware |
| Errors | Sentry | Standard |

**Not in MVP stack:** blockchain, IPFS/Arweave, separate microservice fleet, MetaMask/WalletConnect as primary auth. **Do not** ship a second UI kit (no shadcn/daisyUI/custom component library replacing ScifiUI).

### UI: ScifiUI (required)

Source of truth: workspace sibling **`/ScifiUI`** (`@scifiui/core`). Seed Creative Hub **must** build the product UI on this kit.

**Consume:**

```css
@import "tailwindcss";
@plugin "@scifiui/core";
@import "@scifiui/core/index.css";
```

**Rules:**

1. Prefer ScifiUI semantic classes (`btn`, `pane`, `card`, `modal`, `navbar`, inputs, etc.) + Tailwind utilities — do not reinvent equivalent chrome.
2. Theme with `data-theme` and `--scifi-*` tokens. Default product theme: **`retrowave`**. Other ScifiUI themes may be used (`ghibli`, `fiesta`, `dawn`, `synthwave84`, `solarizedDark`, `cottonCandy`, `goldenTwilight`, `brightContrasts`). **Do not use `seed-hub`.** Override tokens for brand/RTL needs; do not fork a parallel token system.
3. Wire dependency via workspace package / path to `ScifiUI/packages/core` (or published `@scifiui/core` once versioned) — keep upgrade path clear.
4. Optional JS from `@scifiui/core/js` (dropdowns, toasts, GSAP `enterShell`, …) when it fits; still respect `prefers-reduced-motion` and low-bandwidth / `perf-lite`.
5. Extend ScifiUI in the ScifiUI repo when a primitive is missing; **do not** copy-paste a one-off design system into SeedCreativeHub.
6. **i18n / RTL:** ScifiUI + logical CSS; `lang` + `dir` per locale. Latin HUD may use JetBrains Mono / `--scifi-font`; pair proper **Arabic** and **Hebrew** body faces. Never hard-code LTR-only layout assumptions.
7. **Icons:** Tabler Icons only across landing and app UI. Import from the Tabler package; do not ship a second icon library.

### Localization architecture (elegant)

```text
/{locale}/...     locale ∈ { en, fr, ar, he }
html[lang][dir]   en|fr → ltr · ar|he → rtl
messages/*.json   one catalog per locale (parity required)
Intl.*            dates, numbers, relative time
hreflang          en, fr, ar, he, x-default=en
```

**Rules:**

1. No user-facing strings inline in Svelte except via i18n helpers.  
2. Missing key fails loudly in dev; production falls back to **en** and logs.  
3. Locale middleware/guard rejects unknown codes (404 or redirect to `en`).  
4. GraphQL context carries `locale` for emails and server-rendered messages.  
5. Search: Arabic + Hebrew normalization helpers; Latin FTS for EN/FR.  
6. Font loading: subset or unicode-range so AR/HE visitors are not blocked by unused Latin weight (and vice versa) where practical.

---

### Platform-agnostic deployment (required)

**Intent:** Ship fast on managed platforms; if traffic spikes (“goes viral”), move FE + API + data plane to a VPS (or any standard Linux host) with config/env changes only — **not** a rewrite.

| Stage | Typical placement | Goal |
|---|---|---|
| **Seed / MVP** | Vite static on Vercel (or CDN) · Fastify on Railway · Postgres (+ optional Auth helpers / storage) on Supabase — mix-and-match OK | Low ops, fast iterate |
| **Scale** | Single or multi VPS (or container on VPS): reverse proxy + Node + Postgres + Redis + object storage (or S3-compatible) | Cost control, no PaaS lock-in, full process control |

**Portability rules (non-negotiable for app code):**

1. **No vendor-only APIs in core paths.** Prefer Postgres, Redis, S3-compatible object storage, SMTP/HTTP email providers. Avoid baking in Vercel/Railway/Supabase SDK calls for auth, DB, or storage unless behind a thin adapter.
2. **Config via env.** `DATABASE_URL`, `REDIS_URL`, `STORAGE_PROVIDER`, provider credentials (`S3_*` / `R2_*` / `SUPABASE_*` / later `CLOUDINARY_*`), `SESSION_SECRET`, `PUBLIC_APP_URL`, `CORS_ORIGINS`, etc. Same binary/image runs locally, PaaS, and VPS.  
3. **Stateless API.** Sessions in cookie + Redis (or signed JWT); no reliance on ephemeral local disk for durable state. Uploads go through the **Media Storage adapter**, never the app filesystem.  
4. **Standard Node process.** Fastify listens on `HOST`/`PORT`; works behind nginx/Caddy or any PaaS proxy. No serverless-only handlers as the primary API shape (optional edge helpers must stay non-critical).  
5. **Frontend is a static Vite build** (plus prerender assets). Deployable to Vercel, Cloudflare Pages, nginx, or any CDN. API base URL is env-driven (`PUBLIC_API_URL` / equivalent).  
6. **Prisma + migrations** against plain PostgreSQL — works on Supabase, Railway Postgres, or self-hosted Postgres on a VPS.  
7. **Docker (or equivalent) preferred for VPS path.** `Dockerfile` + compose (or similar) for API + optional workers; PaaS can still build from the same Dockerfile when supported.  
8. **Adapters, not forks.** Auth-adjacent helpers, **Media Storage**, Mail, and Cache are internal interfaces. Supabase Storage / R2 / Cloudinary are **adapter implementations** — swap provider by env + new adapter, not by rewriting product code.

**Explicitly avoid locking in:**

- Serverless GraphQL as the only runtime model  
- Platform-specific auth that cannot be reimplemented with Argon2id + our sessions  
- Proprietary DB extensions that block self-hosted Postgres  
- Hard-coded platform hostnames or dashboard-only secrets flows without documented env equivalents  
- Hard-coded Supabase / R2 / Cloudinary URLs or SDKs in GraphQL resolvers or the Svelte app  

---

## 3. Domain model (core)

```text
User 1:1 Profile
Profile N:M Discipline
Profile 1:N Work
Work 1:N MediaAsset
Work N:M Tag
User N:M User (Follow)
User 1:N Opportunity (+ Interest)
User 1:N Event (+ optional RSVP)
User 1:N Notification
User 1:N Report
Admin → EditorialFeature / Collection
Phase 2: OpenCall → Application
Phase 2: Conversation → Message
```

### Key tables (sketch)

**users** — id, email, password_hash (Argon2id), role, status, locale, email_verified_at, created_at, deleted_at  

**profiles** — user_id, handle, display_name, bio_short, bio_long, avatar_url, cover_url, country, city, availability, visibility, claim_status, claim_token, verified_at, completion_score  

**works** — profile_id, type, title, slug, description, status, primary_discipline, published_at, view_count  

**media_assets** — work_id, kind, provider, storage_key, public_url (or derived), external_url, mime_type, size_bytes, dimensions/duration, moderation_status  

Store **provider-agnostic keys** (`storage_key`) plus `provider` enum. Never persist only a hard-coded CDN host path that cannot be rebuilt after a provider switch. 

**follows** — follower_id, following_id, unique pair, CHECK ≠ self  

**opportunities** — creator_id, title, description, roles, discipline, location, remote_mode, compensation_status, deadline, status  

**opportunity_interest** — opportunity_id, user_id, message  

**events** — organizer_id, name, description, starts_at, ends_at, venue, city, category, external_url, image_url, status, capacity  

**rsvps** (optional MVP) — event_id, user_id, status, qr_token, checked_in_at  

**notifications** — user_id, type, payload/actor/entity, read_at  

**reports** — reporter_id, entity_type, entity_id, reason, status, resolved_by  

**editorial_features** — entity_type, entity_id, placement, window  

**audit_log** — actor, action, target, metadata, created_at (append-only)

Use UUID PKs. Soft-delete users/content where legal needs require a recovery window (~30 days).

---

## 4. Authorization

Every mutation checked server-side:

- Only owner edits profile/work/opportunity/event (unless admin)
- Only admin/editor features content
- Any auth user can report
- Never trust client-supplied owner IDs

---

## 5. API principles

**Primary API:** GraphQL over Fastify (single `/graphql` endpoint). Optional thin REST for webhooks, health, and presigned upload helpers.

Example GraphQL surface (sketch):

```text
Query
  me · profile(handle) · work(slug) · explore · search
  opportunities · events · notifications

Mutation
  signUp · signIn · resetPassword · claimProfile
  updateProfile · publishWork · follow / unfollow
  createOpportunity · expressInterest
  createEvent · rsvp (if enabled)
  createReport · markNotificationRead
```

Conventions:

- Cookie sessions and/or Bearer tokens; CSRF on cookie-based mutations  
- Cursor pagination on lists  
- Idempotency on creates (client key or mutation input)  
- Structured GraphQL errors with `correlationId` / extensions  
- `Accept-Language` / locale on context  
- Authorization in resolvers / services — never trust client-supplied owner IDs

---

## 6. Media storage & pipeline

### Provider path

| Stage | Provider options | Notes |
|---|---|---|
| **MVP / early** | **Supabase Storage** *or* **Cloudflare R2** | Pick one to start; both behind the same adapter |
| **Later (optional)** | **Cloudinary** (and/or keep R2/Supabase for originals) | Transforms, responsive delivery, moderation helpers |

Switching providers must be a **config + adapter** change (and a one-time migration job if moving existing objects) — not a product rewrite.

### Media Storage adapter (required)

Internal interface (sketch) used by API/services only:

```text
createUpload(intent) → { uploadUrl | formFields, assetId, storageKey }
confirmUpload(assetId) → MediaAsset
getPublicUrl(storageKey, variant?) → string
deleteObject(storageKey) → void
```

- **Implementations:** `SupabaseStorageAdapter` · `R2StorageAdapter` (S3-compatible) · later `CloudinaryStorageAdapter`
- Select via `STORAGE_PROVIDER=supabase|r2|cloudinary` (and credentials env vars)
- GraphQL / FE never import provider SDKs for uploads; they call our API (presign / signed upload)
- Delivery URLs come from `getPublicUrl` (or stored `public_url` refreshed on read) so Cloudinary transforms can replace CDN resize later without changing callers

### Pipeline

**MVP**

1. Presigned / signed upload via adapter **or** store embed URL  
2. Thumbnails / variants via current provider (R2+CDN, Supabase public URL, or later Cloudinary)  
3. Prefer external embeds for audio/video  

**Later**

- Chunked resumable uploads (tus)  
- Transcode workers  
- Automated NSFW moderation queue  
- Optional: originals on R2/Supabase + derivatives on Cloudinary  

**Low-bandwidth mode**

When `saveData` or slow effective connection: smaller images / lighter variants from `getPublicUrl`, no autoplay, smaller page size, disable Three.js scenes, reduce/skip GSAP non-essential motion.

---

## 7. Search

**MVP:** Postgres full-text + trigram indexes on handle, display name, titles, tags, city; Arabic normalization (alef/yaa/taa marbuta, diacritics); Hebrew normalization where implemented; Latin FTS for EN/FR corpora.

**Later:** Meilisearch / dedicated engine when latency or corpus requires it.

---

## 8. Discovery ranking

```text
score = editorial + recency + light_engagement + discipline_diversity_penalty
```

No ML in MVP.

---

## 9. SEO & routes (example)

```text
/
/en|/fr|/ar|/he
/explore
/creators
/{locale}/{handle}
/works/{slug}
/opportunities/{slug}
/events/{slug}
/collections/{slug}
```

Canonical URLs + Open Graph + `hreflang` for `en`, `fr`, `ar`, `he` (`x-default` → `en`). Public marketing/profile/work pages should be prerendered or otherwise crawlable from the Vite app (SSG/prerender first; SSR only if needed later).

---

## 10. Security

- **Passwords:** Argon2id only (never bcrypt/scrypt for new hashes; migrate if legacy appears). Salt + memory/time params tuned for the host; never log passwords.  
- CSRF where applicable; strict CSP; sanitize UGC HTML  
- Rate limits on auth, upload, contact, report  
- MIME sniffing + size caps on uploads  
- SSRF whitelist for embeds  
- Secrets in env / secret manager only  
- Admin: 2FA strongly recommended  
- Audit log for moderation  

Privacy: no public emails; city-level location; GDPR-aligned export/delete path.

---

## 11. Performance budgets

| Metric | Target |
|---|---|
| LCP (mobile 4G) | < 2.5s |
| INP | < 200ms |
| CLS | < 0.1 |
| API p95 | < 400ms |
| Feed weight (low-bandwidth) | < ~150KB critical path where practical |

CDN-cache / prerender public profiles and works where practical; keep GraphQL mutations uncached.

---

## 12. Payments (Phase 3 only)

Lebanon entities generally cannot use Stripe directly. Plan multi-provider:

- Regional cards (e.g. Paymob)  
- Local wallets (Whish / MyMonty)  
- Stripe via non-LB entity for diaspora  
- Payouts via Wise / Payoneer / bank  

MVP: **no payments**.

---

## 13. Observability

Track product events at minimum:

```text
signup · profile_completed · work_published · work_viewed
creator_followed · opportunity_created · opportunity_interest
event_viewed · event_created · contact_sent · report_created
```

Plus errors, upload failures, auth failures, latency.

Environments: local · preview/staging · production. Separate DBs. Never commit secrets.

---

## 14. Testing

| Level | Expectation |
|---|---|
| Unit | Business rules |
| Integration | Authz + key GraphQL mutations/queries |
| E2E | Core journeys (Playwright); **EN + FR + AR + HE** (at least P0 paths) |
| A11y | axe on P0 screens; WCAG 2.2 AA target |
| Security | Dependency audit; baseline ZAP before public launch |

---

## 15. Cost discipline & hosting path

**Early (managed):** Prefer a cheap mix — e.g. Vercel (static FE) + Railway (Fastify) + Supabase (Postgres) + **Supabase Storage or R2** for media + Resend. Target low hundreds USD/month while validating product.

**Scale (VPS):** When egress, DB, or compute costs / limits hurt, migrate to a VPS (or small fleet) using the same Docker/env-driven artifacts. Keep media on R2/S3-compatible (or migrate to Cloudinary behind the same adapter).

Revisit Meilisearch / workers when media volume or search latency forces it — still behind the same portable interfaces.

---

## 16. Explicitly rejected (Gemini proposals)

Do **not** implement for MVP:

- MetaMask / WalletConnect as primary auth  
- Solidity split / tip contracts  
- IPFS/Arweave as primary asset store  

Revisit only if product strategy explicitly changes post–Phase 2.

---

## 17. Open technical questions

- [x] Frontend: Svelte + Vite + GSAP + Three.js  
- [x] UI kit: **ScifiUI** (`@scifiui/core` from workspace `ScifiUI/`); default theme `retrowave` (not `seed-hub`)  
- [x] Icons: Tabler Icons site-wide  
- [x] Locales: **en / fr / ar / he** from day one; EN default; RTL for ar + he  
- [x] Landing section order: hero (2-part Godfather offer) → support ×2 → pricing → CTA → restful footer  
- [x] Backend: Fastify + PostgreSQL + Prisma + GraphQL  
- [x] Password hashing: Argon2id  
- [x] Hosting path: managed (Vercel / Railway / Supabase) early → VPS at scale; code platform-agnostic  
- [x] Media storage: Supabase Storage or R2 early → optional Cloudinary later; switch via Media Storage adapter  
- [ ] Claim-token admin: spreadsheet import vs internal page for first cohort  
- [ ] When (if ever) native audio hosting is required  
- [ ] RPO/RTO targets (recommend RPO ≤ 1h, RTO ≤ 4h)  
- [ ] Legal entity for future payments  
- [ ] GraphQL auth transport: httpOnly cookie sessions vs Bearer JWT (or hybrid)  
- [ ] SEO strategy for public pages: Vite prerender/SSG vs selective SSR later  
- [ ] Exact early mix (which service for FE vs API vs DB) — flexible as long as portability rules hold  
- [ ] Pick initial media provider: Supabase Storage vs Cloudflare R2 
