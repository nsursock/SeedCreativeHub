# UI / UX Specifications

**Product:** Creative Hub  
**Owner:** UX / UI Lead  
**Status:** Final consolidated draft v1.0  
**Companions:** [01-product-reqs.md](./01-product-reqs.md) · [02-functional-spec.md](./02-functional-spec.md)

Visual identity is **ScifiUI-first** (workspace `ScifiUI/` / `@scifiui/core`). Tokens and chrome come from `--scifi-*` and ScifiUI classes; co-founders still lead art direction *within* that system (theme overrides, photography, copy). Avoid inventing a parallel design kit.

---

## 1. Experience principles

1. **Cultural, not corporate.** Feels like an independent cultural publication / studio / scene space — not LinkedIn for artists.
2. **Work is the hero; people always one click away.** Media leads; creator is always visible.
3. **Multilingual from day one — not bolted on.** EN / FR / AR / HE with native-quality UI; rhythm and layout work in LTR and RTL.  
4. **Cross-disciplinary.** Audio, image, video, text coexist without forcing one metaphor.  
5. **Local identity.** Lebanon present through people, places, language, events — not kitsch.
6. **Low friction.** First publish in minutes; claim flow ≤ 2 screens.
7. **Community over vanity.** No engagement counters dominating cards; no gamification badges explosion.
8. **Low-bandwidth dignity.** Slow networks get a complete experience.
9. **Public by default.** Explore/feed/events browsable without login; auth for create/connect.
10. **Physical–digital continuity.** Coverage and Hub Nights should feel continuous with the product.

---

## 2. Brand feeling

**curiosity · culture · discovery · human connection · experimentation**

Tone: warm, direct, literate, unpretentious. Bilingual comfort.

| Do | Don’t |
|---|---|
| “Your work belongs somewhere. This is it.” | “Unlock your creative potential!” |
| “Discover who’s making things in Lebanon.” | “Join the ultimate creator economy platform!” |
| Native EN / FR / AR / HE copy | Machine-translated-only UI strings |

Positioning Option A (utility) vs B (solidarity) from PRD §10 drives microcopy — resolve before final empty states / claim emails.

---

## 3. Navigation

### Primary (desktop / large)

```text
Explore · Creators · Collaborate · Events · Search
[Create]
Profile · Notifications
```

### Mobile

Compact bottom nav (≤5 destinations), e.g.:

```text
Home/Explore · Collaborate · Create · Events · Profile
```

No nested mega-menus in MVP.

**Locale switcher:** Always available (nav or footer) for `en` / `fr` / `ar` / `he`. Shows native language names (English · Français · العربية · עברית). Switching updates URL prefix + `lang`/`dir` without losing the current page context when a localized equivalent exists.

---

## 4. Core screens (MVP)

| Screen | Purpose |
|---|---|
| Landing / waitlist (Phase 0+) | Fixed section stack (hero → support ×2 → pricing → CTA → restful footer); AR-first |
| Home / Explore | Featured + new work/creators/opportunities/events |
| Search results | Filtered discovery |
| Creator profile | Living identity, not a resume |
| Work detail | Media → title → creator → actions |
| Collaborate / opportunities | Distinct from social feed |
| Opportunity detail | Need, place, pay, deadline, interest CTA |
| Event detail | Hero, when/where, lineup, external/RSVP |
| Create flow | Work / opportunity / event |
| Auth + onboarding | Short; resumable |
| Claim profile | Password/magic → editable profile |
| Notifications | Dense, scannable |
| Report modal | Accessible, not dominant |
| Admin moderation (internal) | Queue + actions |
| Empty / error / offline | Designed, human |

---

## 5. Screen-level rules

### Landing page (marketing / waitlist) — required structure

Single composition in order. Do **not** reorder or omit sections. One job per section.

```text
1. Hero (2 parts)          ← first viewport; ≤3s attention grab
2. Supporting content A
3. Supporting content B
4. Pricing
5. CTA
6. Footer                  ← “a place to rest”
```

#### 1. Hero — two parts (Godfather offer)

Must stop the scroll and make the offer feel **impossible to refuse** within **~3 seconds** (Godfather offer: stacked value so clear and asymmetric that “no” feels irrational).

| Part | Role | Content |
|---|---|---|
| **Hero A** | Attention + offer | Brand signal + one irresistible headline + short supporting line that names the stacked value (what they get / why now) + primary CTA |
| **Hero B** | Proof / reinforcement | Dominant visual or interactive proof (real scene / product atmosphere / Three.js moment optional) that backs the offer — not a second competing headline |

Rules:

- First viewport = hero A + hero B only (no pricing, stats strips, or secondary marketing in the hero).  
- Primary CTA in Hero A is the Godfather path (join waitlist / claim founding access / equivalent).  
- ScifiUI + Tabler icons for any iconography in the hero.  
- Motion may amplify the offer (GSAP); respect reduced-motion.

#### 2–3. Supporting content (exactly two sections)

Two separate sections after the hero. Each has **one** purpose, one headline, one short supporting sentence, and Tabler-led visual cues (icons/illustration), not a card grid dump.

Examples of jobs (pick two distinct ones): who it’s for · how connection works · Hub Nights / IRL · disciplines / cross-scene · founding cohort.

#### 4. Pricing

Required on the landing page. Show clear tiers/plans (even if Phase 0 is “founding / early access” and checkout is waitlist or manual). Prices, what’s included, and a CTA per tier. Use Tabler icons for feature checkmarks/benefits — not emoji.

🔶 Until commerce rails ship, pricing may convert to waitlist/founding signup rather than live card checkout — still present real offer numbers and inclusions.

#### 5. CTA section

Dedicated closing conversion block (not buried in the footer): restates the Godfather offer in one line + primary action. No new competing narratives.

#### 6. Footer — a place to rest

Calm, sparse, unhurried. Breathing room after the CTA. Minimal links (legal, locale, contact/social). No dense link farms, no second sales pitch, no promo stickers. Feels like a place to land and leave quietly.

Icons site-wide: **Tabler Icons only** (see §6 / technical spec). No emoji as UI icons; no mixed icon sets.

### Homepage / Explore (authenticated / product home)

Communicate in seconds. Suggested structure:

1. Strong editorial/visual hero (real scene photography, not stock)  
2. Featured work  
3. New creators  
4. Latest opportunities  
5. Upcoming events  
6. CTA to join / create  

Headline direction:

> Discover the people making things in Lebanon.

### Profile

```text
Avatar + Name + City
Disciplines
Bio
[Follow] [Contact]
Open to / Looking for
Featured work → All work → Opportunities
```

Unclaimed: clear banner; no edit affordances for visitors.

### Work detail

Hierarchy: media → title → creator → description → tags → related → CTAs (View creator / Follow / Contact).

### Collaborate

Feels different from a feed.

> Make something together.

Cards expose immediately: what / who needed / where / paid? / deadline / poster.

### Create

1. Choose type (work / opportunity / event)  
2. Details (minimal required fields)  
3. Preview  
4. Publish  

Support mobile camera capture for coverage-style uploads.

### Empty states

Always human + one CTA (invite a creator, clear filters, add first work). Never sterile “No results.”

---

## 6. Visual direction (ScifiUI)

**Required UI system:** [ScifiUI](../../../ScifiUI/) (`@scifiui/core`) from the workspace root. Product UI uses ScifiUI semantic classes + Tailwind utilities. Default `data-theme="retrowave"`; other ScifiUI themes allowed except **`seed-hub`** (do not use). Retheme via `--scifi-*` / theme blocks.

Desired:

- ScifiUI chrome (panes, brackets, glass/HUD language) as the product shell — editorial media still leads content areas  
- Strong typography; large media; intentional negative space  
- Subtle, intentional motion (2–3 meaningful motions, not noise) — prefer `@scifiui/core/js` GSAP helpers where they fit  
- Readable body type per script: Arabic and Hebrew line-height ≥1.7 for body; Latin HUD may use JetBrains Mono / `--scifi-font`  
- Color & glow via `--scifi-*` tokens (not ad-hoc hex in components)

Avoid:

- Generic SaaS dashboards unrelated to ScifiUI  
- Purple-on-white / purple–indigo gradient clichés outside ScifiUI themes  
- Default “cream + terracotta serif” template look  
- Engagement counter chrome; badge spam  
- A second component library or one-off CSS kit that duplicates `btn` / `pane` / `modal`  
- Flat single-color backgrounds with no atmosphere when ScifiUI surfaces/themes already provide one  

**Typography:** Proper **Arabic** face + proper **Hebrew** face + ScifiUI Latin stack. Do not default brand voice to Inter/Roboto/Arial.

**Icons:** **[Tabler Icons](https://tabler.io/icons)** throughout the product (landing + app). Prefer `@tabler/icons-svelte` (or equivalent Tabler package). One set only — do not mix Lucide/Heroicons/Font Awesome/emoji-as-icons. Mirror directional Tabler icons in RTL where required.

**Theme:** **`retrowave` default.** Allowed: `ghibli`, `fiesta`, `dawn`, `synthwave84`, `solarizedDark`, `cottonCandy`, `goldenTwilight`, `brightContrasts`. **Forbidden: `seed-hub`.** Contrast must meet AA. Honor `perf-lite` / `prefers-reduced-motion` from ScifiUI base.

**Radius / elevation:** Follow ScifiUI tokens (`--scifi-radius`, pane/glass patterns). Cards/panes are for interactive or HUD containers — not decorative boxes around every block.

---

## 7. Motion

**Implementation:** GSAP via product code and/or `@scifiui/core/js` (`enterShell`, landing intro helpers, etc.); Three.js only for selective immersive moments (hero / featured work / event atmosphere) — not as default chrome.

| Token | Duration | Use |
|---|---|---|
| fast | ~120ms | Hover/focus |
| base | ~200ms | Tabs, reveals |
| slow | ~300ms | Sheets/modals |

Respect `prefers-reduced-motion` (disable non-essential GSAP; skip or static-fallback Three.js). Low-bandwidth mode also disables Three.js and non-essential motion.

Intentional MVP motions (examples):

1. Work media fade/settle on explore (GSAP)  
2. Create publish confirmation (GSAP)  
3. Opportunity interest success (GSAP)  
4. Optional: one Three.js moment on home or featured work — progressive enhancement only 

---

## 8. Accessibility (WCAG 2.2 AA target)

- Keyboard navigation; visible focus  
- Skip link; landmarks; one h1; no skipped heading levels  
- Alt text required for meaningful images  
- Captions/transcripts for platform-owned video/audio where feasible  
- Contrast 4.5:1 body / 3:1 large  
- Target size ≥24px (44px preferred for primary)  
- No hover-only interactions  
- `lang` + `dir` correct per locale (`ar`/`he` → `rtl`; `en`/`fr` → `ltr`)  
- Toasts: `role="status"` / `alert`  
- Test LTR + RTL; Arabic and Hebrew screen-reader paths planned  

---

## 9. RTL rules (Arabic + Hebrew)

**Flips:** layout, text alignment, drawers, steppers, directional icons (arrows, back, send), toast corner, form label start edge.

**Does not flip:** photos/video content, logos (unless directional), play icon direction, numbers/URLs (use `bdi` where mixed scripts need isolation).

Never letter-space Arabic or Hebrew body text; never faux-italic Arabic or Hebrew.

---

## 10. Responsive

Mobile-first for discovery and post-event sharing. Desktop: richer multi-column browsing. Preserve media aspect ratios; reserve space to limit CLS.

Breakpoints (indicative): phone / tablet / laptop / desktop. Max content width ~1200px for reading layouts; media can go wider.

---

## 11. Trust & safety UX

Report available but quiet. States clear: under review / removed / closed / suspended. No public shaming.

Block (Phase 2 messaging) ends contact without spectacle.

---

## 12. Component notes (MVP)

Build with **ScifiUI** primitives first (`btn`, `pane`, `input`, `modal`, `navbar`, badges, toasts, drawers, etc.). Compose with Tailwind; extend `@scifiui/core` in the ScifiUI repo when a primitive is missing.

- **Buttons:** `btn` variants (primary / secondary / ghost / danger); loading locks width  
- **Inputs:** ScifiUI inputs + visible labels (not placeholder-as-label); errors via `aria-describedby`  
- **Work cards / panes:** preview + title + creator + discipline; minimal chrome beyond ScifiUI pane patterns  
- **Skeletons:** mirror layout; RTL-aware  
- **Modals:** ScifiUI `modal` / bottom sheet on mobile; focus trap; Esc closes  

---

## 13. Definition of design done

- [ ] Mobile + desktop  
- [ ] EN + FR + AR + HE frames  
- [ ] Default / empty / loading / error states  
- [ ] A11y annotations  
- [ ] Copy reviewed by native (or professional) writers for **each** launch locale  
- [ ] Screens implemented with ScifiUI (`retrowave` default, or another allowed theme — not `seed-hub`)  
- [ ] Landing matches required section order (hero 2-part → support ×2 → pricing → CTA → restful footer)  
- [ ] Hero delivers Godfather offer within ~3s attention test (per locale)  
- [ ] Tabler Icons used consistently; no mixed icon sets  
- [ ] Tokens mapped via `--scifi-*` (no parallel token sheet)  

---

## 14. Open UX questions

- [ ] Final Godfather offer copy for **EN / FR / AR / HE** for Hero A  
- [ ] Exact jobs for Supporting A vs Supporting B  
- [ ] Pricing tier names, prices, and inclusions (founding vs later) — localized  
- [ ] Final art direction *within* ScifiUI / `retrowave` (or chosen allowed theme) with photographer/filmmaker co-founders  
- [ ] Whether marketing vs app shell use different allowed ScifiUI themes  
- [ ] How prominent follower counts are (recommend de-emphasize)  
- [ ] View counts public vs artist-only (recommend artist-only)  
- [ ] Anonymous RSVP vs login-required  
