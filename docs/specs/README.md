# Creative Hub — Final Specifications

**Status:** Consolidated draft v1.0  
**Synthesized from:** ChatGPT · Claude · DeepSeek · Gemini  
**Last updated:** 2026-09-18

---

## Documents

| # | Document | Owner (practical) | Purpose |
|---|---|---|---|
| 01 | [Product Requirements (PRD)](./01-product-reqs.md) | Product / Founders | Vision, users, scope, metrics, phases |
| 02 | [Functional Specifications](./02-functional-spec.md) | PM / BA | Feature behavior, rules, flows |
| 03 | [Technical Specifications](./03-technical-spec.md) | Technical Lead | Architecture, data, APIs, infra |
| 04 | [UI/UX Specifications](./04-ui-ux-spec.md) | UX Lead | Experience principles, screens, a11y |
| 05 | [Acceptance Criteria](./05-acceptance-criteria.md) | QA / PM | Done conditions and release gates |

---

## How ownership works

- **Ultimate ownership:** Product owns functional direction; Tech Lead owns technical specs.
- **Practical reality:** Specs are collaborative and iterative. Flag assumptions with 🔶 until confirmed.
- **Change control:** Product changes → update PRD + Functional + AC. Stack/infra changes → update Technical. Visual/interaction changes → update UI/UX.

---

## Synthesis decisions (what we kept / cut)

| Topic | Decision | Why |
|---|---|---|
| Core product | Cross-disciplinary creative connection hub for Lebanon | Consensus across ChatGPT, Claude, DeepSeek |
| Primary market | Lebanon first (Beirut density), then diaspora, then regional | Local density before scale |
| Core loop | Create → Discover → Connect → Collaborate → Create again | ChatGPT thesis; others agree in substance |
| Phase 1 strategy | Waitlist + founding artists + IRL Hub Nights + invite/claim seeding | Claude + DeepSeek; avoids cold-start |
| Languages | **EN · FR · AR · HE from day one** (elegant i18n; RTL for AR + HE) | Founder decision — all launch locales equal |
| Contact in MVP | Structured contact / collab interest (not full realtime chat) | ChatGPT + Claude; DeepSeek DMs = Phase 2 P1 |
| Media | Images + embeds first; native video hosting later | Cost + bandwidth (ChatGPT, Claude, DeepSeek) |
| Monetization | Deferred past MVP (memberships / marketplace later) | ChatGPT, Claude defer; DeepSeek Phase 3 |
| Web3 / crypto / NFT / IPFS | **Out of scope** | Gemini-only; rejected by other three |
| Smart contract tips/splits | Out of scope | Gemini-only |
| Booking marketplace | Out of scope for MVP | All sources defer |
| Native mobile apps | Out of scope until later phase | Consensus |
| **Stack (confirmed)** | **FE:** Svelte + Vite + GSAP + Three.js + **ScifiUI** · **BE:** Fastify + PostgreSQL + Prisma + GraphQL · **Auth passwords:** Argon2id | Founder / Tech Lead decision |
| **UI kit** | **Must use ScifiUI** (`WD/ScifiUI` → `@scifiui/core`); default theme **`retrowave`**; **do not use `seed-hub`**; no parallel design system | Workspace design system; shared with Adaan DNA |
| **Landing page** | Hero (2-part **Godfather offer**, ≤3s) → supporting ×2 → pricing → CTA → **restful footer**; **Tabler Icons** site-wide | Conversion-first marketing structure |
| **Hosting path** | Managed early (Vercel / Railway / Supabase mix OK) → **VPS at scale**; app must stay **platform-agnostic** | Viral-ready exit without rewrite |
| **Media storage** | **Early:** Supabase Storage **or** Cloudflare R2 → **Later:** optional Cloudinary; all behind a **Media Storage adapter** | Easy provider switch / migration |

---

## Phase map (summary)

| Phase | Theme | Exit criteria (high level) |
|---|---|---|
| **0 / Seed** | Waitlist, founding artists, Hub Nights | Community seeded before full product |
| **1 / MVP** | Profiles, works, explore, collabs, events, moderation | Core connection loop proven |
| **2 / Depth** | Open calls, richer messaging, analytics | Opportunity discovery + retention |
| **3 / Commerce** | Memberships, commissions, ticketing | Sustainable revenue |
| **4 / Regional** | MENA expansion | Multi-city / multi-country |

---

## Open decisions still needed from founders

1. Final product name (candidates: Creative Hub, Bayt, Makan, Beirut Creative Hub).
2. Positioning voice: utility (“practical discovery tool”) vs solidarity (“built by working artists after what we lost”).
3. Anchor venue / recurring Hub Night partner.
4. Free vs eventual take-rate vs patron membership first.
5. How “Lebanese” identity is treated (recommendation: do not gate; use location + community curation).
