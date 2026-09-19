# Functional Specifications

**Product:** Creative Hub  
**Owner:** Product Manager / Business Analyst  
**Status:** Final consolidated draft v1.0  
**Companion to:** [01-product-reqs.md](./01-product-reqs.md)  
**Scope focus:** Phase 0 + Phase 1 MVP (Phase 2 noted where it affects design)

---

## 1. Global rules

### 1.1 Locales (launch)

Launch locales — **all required from day one**, none deferred:

| Code | Language | Direction |
|---|---|---|
| `en` | English | LTR |
| `fr` | French | LTR |
| `ar` | Arabic | RTL |
| `he` | Hebrew | RTL |

**Elegant localization rules:**

- Every UI string lives in locale catalogs (no hard-coded user-facing English in components).  
- Locale in the URL (`/en/...`, `/fr/...`, `/ar/...`, `/he/...`) so links are shareable and crawlable.  
- Document `lang` + `dir` always match the active locale (`dir="rtl"` for `ar` and `he`).  
- Prefer **logical CSS** (`margin-inline-start`, `inset-inline-end`, etc.) over physical left/right.  
- Locale picker is visible and persistent (cookie / account preference); switching updates URL + catalog without full product regression.  
- Default when no preference: **English (`en`)**, then `Accept-Language` if it matches a launch locale; never invent a fifth locale silently.  
- Native (or professionally reviewed) copy for EN / FR / AR / HE — UI is not machine-translated-only.  
- UGC is never auto-translated in MVP; store and display as authored.  
- Dates, numbers, and lists via `Intl` for the active locale.  
- Mixed-script / bidi: use isolation (`bdi` / `dir=auto` where needed) for handles, URLs, and bilingual names.  
- Emails and transactional copy respect the user’s locale preference.  

Layouts must work in **RTL (AR, HE)** and **LTR (EN, FR)** with equal quality.

### 1.2 Account / capability states

| State | Can do |
|---|---|
| Guest | Browse public profiles, works, explore, events, open opportunities |
| Member | Guest + create/edit own profile & works, follow, contact, post opportunities/events (if policy allows), report |
| Artist verified (optional gate) | Appear in curated discovery; post open calls (Phase 2) |
| Admin / editor | Moderation, feature content, seed/claim tooling |
| Suspended | Read-only |

🔶 MVP may ship without a hard “verified” gate if seeding is invite-based; keep the concept for Phase 2 open calls.

### 1.3 Media rules (MVP)

| Kind | Formats | Guidance |
|---|---|---|
| Image | JPG, PNG, WEBP (AVIF OK) | Max ~20MB; generate thumbnails |
| Audio | Upload limited **or** SoundCloud/Bandcamp/Spotify embed | Prefer embed |
| Video | YouTube/Vimeo embed preferred | Direct upload deferred or strict size cap |
| Text | Plain / Markdown subset | Arabic- and Hebrew-aware rendering; bidi-safe |

Uploads: MIME + size validation server-side; EXIF stripped from public derivatives when processed. Storage provider is an infra concern (Supabase Storage / R2 early; Cloudinary optional later) — product behavior must not depend on a specific vendor.

### 1.4 Abuse rate limits (indicative)

Signup attempts, password resets, contact/interest messages, reports, and uploads must be rate-limited. New accounts get stricter contact limits for the first 7 days.

### 1.5 Errors

User-facing errors: plain-language message in locale + recovery action + correlation ID for support (technical systems).

---

## 2. Authentication & onboarding

### Requirements

- Email + password (hashed with **Argon2id** server-side); magic link; OAuth (Google/Apple) without changing identity model.
- Accept Terms + community guidelines.
- Password reset; secure session; logout.
- Email verification before publish / contact / opportunity create (browse allowed while unverified).

### Onboarding (≤4 steps)

1. Identity — display name, handle, email  
2. Disciplines — multi-select (min 1)  
3. Location — country (default Lebanon), city  
4. Intent — showcase / collaborate / find opportunities / attend / support  

Escape: “Finish later.”

### Handle rules

- Unique, case-insensitive; 3–30 chars; `a-z0-9_`; reserved list (admin, api, root, …).
- Suggest alternatives when taken.

### Phase 0 claim flow

- Admin creates shell profile + single-use claim token (expire ~7 days).
- Claim → set auth → land on editable profile.

### Phase 0 waitlist landing (F-01)

Public `/` marketing page with fixed section order (see UI/UX):

1. **Hero (2 parts)** — Godfather offer that wins attention in ≤3 seconds + proof/reinforcement  
2. **Supporting content A** — one job  
3. **Supporting content B** — one different job  
4. **Pricing** — tiers/inclusions visible (checkout may be waitlist/manual until payments)  
5. **CTA** — restate offer + primary conversion  
6. **Footer** — restful, sparse (not a second pitch)

Capture: email (+ disciplines as required) into waitlist; confirmation UX; optional referral code. Landing available in **EN / FR / AR / HE**; Tabler Icons for all UI icons on the page.
- Unclaimed profiles visible, marked “unclaimed,” cannot post.

---

## 3. Creator profiles

### Fields

Display name · handle/slug · avatar · cover (optional) · short bio · long bio (optional) · city/region/country · disciplines · skills/tags · website/social links · open to collab / looking for · contact preference · portfolio works · opportunities/events created

### Rules

- Unique handle; stable public URL `/{locale}/{handle}` (or equivalent).
- Owner-only edit; server-side authz.
- Public by default; privacy controls can expand later.
- Multi-discipline profiles are first-class.
- Completion score (optional UX): fields + ≥3 works + multi-discipline.

---

## 4. Creative works

A **work** is a published creative item.

### Types

Text · Image · Audio · Video · External embed · Mixed (later)

### Metadata

Title · description · creator · discipline(s) · tags · location (optional) · created/published dates · media · external links · collaborators (optional, accept-to-appear)

### Lifecycle

`draft → published → archived/deleted`

### Rules

- Owner edit/delete only.
- Deleted/archived works leave discovery.
- Stable public URL; creator always prominent.
- Collaborator tags require acceptance before public credit.

---

## 5. Explore / discovery

### Views

Featured · New · Creators · Works · Opportunities · Events

### Filters

Discipline · city/region · media type · tag · date (where relevant) · availability (open to collab)

### Ranking (MVP)

Deterministic, simple:

1. Editorial / featured  
2. Recency  
3. Light engagement  
4. Diversity (avoid same creator/discipline spam)

No ML recommendations in MVP. Chronological “Latest” toggle is acceptable.

### Empty / cold start

Never blank: curated placeholder / invite CTA.

---

## 6. Search

### Targets

Creators · works · opportunities · events · tags · (Phase 2: open calls, collections)

### Behavior

- Case-insensitive; partial match where practical.
- Arabic: diacritic-insensitive; alef/yaa/taa marbuta normalization.
- Hebrew: practical normalization where useful (e.g. final-letter forms / niqqud handling as implemented).
- Transliteration fallback where practical (“nour” ↔ Arabic spelling; Latin ↔ Hebrew where practical).
- Filterable by discipline and location.

---

## 7. Follow

- Follow / unfollow (idempotent); no self-follow.
- Counts visible on profile; following state visible to current user.
- Mute without unfollow (nice-to-have in MVP; required Phase 2).

---

## 8. Collaboration opportunities (“Looking for…”)

Structured posts describing a need — bar-room “looking for a bassist” online.

### Fields

Title · description · poster · discipline · roles wanted · location · remote/hybrid/in-person · compensation (paid / unpaid / discuss / unspecified) · deadline (optional) · external link (optional) · status open/closed

### Rules

- Owner edit/close; closed remain viewable, clearly marked.
- Users express interest with short message + optional link to work.
- Reports apply.
- Max open opportunities per user (e.g. 5) to reduce spam.

### Example

> Looking for a vocalist for an experimental electronic EP. Beirut or remote. Paid.

---

## 9. Contact / collaboration interest (MVP messaging)

**MVP does not require full chat.**

Preferred behavior:

1. User clicks Contact / Interested  
2. Submits short message (+ optional profile/work link)  
3. Recipient gets in-app + email notification  

Reduces spam and engineering cost vs realtime messaging.

**Phase 2:** 1:1 DMs with request inbox, non-mutual message caps, block/report.

---

## 10. Events

### Fields

Name · description · organizer · start/end · venue · city · category · external URL · image · free/price indicator · linked artists/lineup (optional)

### MVP behavior

Discovery/publishing layer. Ticketing external unless Phase 3.

### Optional Phase 0/1 RSVP

- “I’m going” / RSVP with capacity + waitlist if needed.
- QR check-in for Hub Nights when capacity matters.
- Past events remain as archive; coverage can attach.

### Rules

- Organizer/admin edit/cancel.
- Stable public URLs.
- Recurring weekly anchor night: manual weekly post OK for MVP (automate later).

---

## 11. Notifications

### MVP types

New follower · collaboration interest · contact request · coverage/tag (if used) · moderation/security · optional editorial feature

Channels: in-app + email for important events only. Push = later.

Users can disable non-critical types; security alerts cannot be disabled.

---

## 12. Moderation & reports

Users can report: work · profile · opportunity · event · (later: messages)

### Reasons

Spam · harassment · hate/abuse · copyright · sexual/inappropriate · fraud/scam · other

### Admin actions

Review · hide/restore · suspend · reject opportunity/event · feature/unfeature

All actions audited. Appeals process documented (even if manual in MVP).

---

## 13. Editorial curation

Editor/admin can:

- Feature work / creator / opportunity / event  
- Create curated collections with narrative intro  

Editorial content visually distinct from organic discovery.

---

## 14. Sharing & SEO

Every public creator, work, opportunity, and event has:

- Stable URL  
- SEO title & description  
- Open Graph image where possible  
- `hreflang` for `en`, `fr`, `ar`, `he` (+ `x-default` → `en`)  

---

## 15. Admin (MVP)

- User / content search  
- Reports queue  
- Feature/unfeature  
- Seed shell profiles + claim links (or spreadsheet import for first cohort)  
- Basic metrics  

Do not over-build admin for the first 20–50 seeds.

---

## 16. Phase 2 features (summary)

| Feature | Behavior sketch |
|---|---|
| Open calls | Grants, residencies, commissions; deadline; apply external or internal form |
| Applications | Immutable after submit; statuses; CSV export for poster |
| DMs | Request inbox; caps; block |
| Peer feedback | Structured Strengths / Questions / Suggestions; private by default |
| Analytics | Artist sees own views / follows (no vanity on public cards) |

---

## 17. Explicit non-goals (MVP)

- Web3 wallet login, smart contract splits, crypto tipping, NFT/IPFS  
- Booking/payments marketplace  
- Native apps  
- Full streaming catalog  
- Ad-supported model  
- AI art generation tools  

---

## 18. Traceability (feature IDs)

| ID | Feature | Phase |
|---|---|---|
| F-01 | Waitlist landing | 0 |
| F-02 | Founding / claim seeding | 0 |
| F-03 | Event RSVP / Hub Night | 0–1 |
| F-04 | Auth & onboarding | 1 |
| F-05 | Artist profile | 1 |
| F-06 | Portfolio / works | 1 |
| F-07 | Discover + search | 1 |
| F-08 | Editorial collections | 1 |
| F-09 | Follow + feed | 1 |
| F-10 | Contact / interest | 1 |
| F-11 | Collaboration opportunities | 1 |
| F-12 | Events | 1 |
| F-13 | Notifications | 1 |
| F-14 | Moderation | 1 |
| F-15 | i18n EN/FR/AR/HE | 0–1 |
| F-16 | Open calls | 2 |
| F-17 | Applications | 2 |
| F-18 | DMs | 2 |
| F-19 | Commerce | 3 |
