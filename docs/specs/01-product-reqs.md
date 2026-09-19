# Product Requirements Document (PRD)

**Product:** Creative Hub (working title)  
**Owner:** Product / Founders  
**Status:** Final consolidated draft v1.0  
**Last updated:** 2026-09-17  
**Sources synthesized:** ChatGPT · Claude · DeepSeek · Gemini

🔶 = assumption — confirm before treating as locked.

---

## 1. Vision

A digital home for Lebanon’s creative communities — and the diaspora that still orbits them — where people discover work, discover people, find collaborators, and turn online connections into real projects and real-world gatherings.

**Product thesis:** This is not primarily a portfolio site or a social feed. Core value is **creative connection**.

**Core loop:**

```text
Create → Discover → Connect → Collaborate → Create again
```

**Physical–digital loop (launch strategy):**

```text
Hub Night / event → coverage & discovery → profiles claimed → collaboration → next event
```

---

## 2. Problem

Creative activity in Lebanon is fragmented across Instagram, TikTok, Behance, SoundCloud, Facebook/WhatsApp groups, university networks, galleries, venues, and personal introductions.

Creators and audiences struggle to:

- Discover emerging talent outside their immediate circle
- Search by discipline, city, skills, and “looking for collaborator”
- Present multidisciplinary work without being forced into one medium
- Find opportunities (open calls, residencies, commissions) in one place
- Turn online discovery into a meaningful human connection
- Stay connected from the diaspora to the home scene

Existing tools solve adjacent pieces (club listings, global discovery, marketplaces) but none combine **local density + cross-discipline + community depth + a recurring physical ritual**.

---

## 3. Target users

### 3.1 Creator (primary)

Makes or publishes creative work: music, photography, film, writing, design, visual art, performance, fashion, architecture, etc.

**Job:** Show my work and become discoverable; find collaborators.

### 3.2 Collaborator-seeker

Actively looking to work with others (jam, shoot, write, score, design).

**Job:** Find the right people and projects quickly.

### 3.3 Audience / scene regular

Enjoys discovering culture; may not create professionally.

**Job:** Know what’s happening; follow interesting people and work.

### 3.4 Organizer / cultural organization

Runs exhibitions, screenings, workshops, concerts, festivals, talks.

**Job:** Reach and activate the relevant creative community.

### 3.5 Diaspora creative / patron (secondary, monetization later)

Connected to Lebanon culturally; may commission, collaborate remotely, or support.

**Job:** Stay plugged into the home scene; collaborate or support with confidence.

---

## 4. Value propositions

| Audience | Value |
|---|---|
| Creators | Multidisciplinary identity, discovery beyond existing followers, collaborators, opportunities, events |
| Audiences | Discover Lebanese creators and work; find events; explore across disciplines |
| Organizations | Concentrated creative audience; publish events and calls; discover talent |
| Diaspora | Bridge back to the home scene without WhatsApp archaeology |

---

## 5. Product principles

1. **People before feeds.** The creator is more important than the post.
2. **Cross-disciplinary by design.** Do not force one medium.
3. **Local density first.** Make Lebanon useful before expanding.
4. **Participation over vanity metrics.** Optimize for connections, projects, and events — not likes.
5. **Open web friendly.** Profiles and works are shareable and indexable.
6. **Human curation matters.** Editorial discovery complements simple ranking.
7. **Trust and safety are core.** Moderation from day one.
8. **Multilingual dignity.** English, French, Arabic, and Hebrew ship from day one — each locale is first-class (native copy, correct `dir`), not an afterthought.
9. **IRL fuels digital.** Hub Nights and coverage close the cold-start loop.
10. **Low-bandwidth dignity.** Slow connections get a complete experience, not an apology.

---

## 6. Goals & metrics

### 6.1 North-star

**Meaningful creative connections per month.**

Counted when one of the following occurs between users:

- Follow
- Collaboration interest / request
- Contact initiation
- Shared project interaction (later)
- Event-based connection (RSVP + attendance / coverage tag)

### 6.2 Phase targets (🔶 adjust with runway)

| Horizon | Target |
|---|---|
| Pre-launch seed | 20–50 founding / claimed artist profiles |
| Phase 1 IRL | Recurring Hub Night sustained 8+ weeks |
| MVP (Phase 1 product) | Visitor can discover work → creator → collab/event → join & publish |
| Mid-term | Strong weekly returning visitors to feed / explore |
| Later | Marketplace / membership revenue (Phase 3) |

### 6.3 Supporting KPIs

- Monthly active creators
- Profile completion rate (≥3 works + bio + disciplines)
- Works published / week
- Collaboration opportunities created and responses
- Events published; RSVP → attendance rate
- Cross-discipline connections
- Retention of seeded artists at week 8
- % of event attendees who claim/update a profile within 7 days

---

## 7. Scope by phase

### Phase 0 — Validate & seed (weeks 1–12 🔶)

- Waitlist / landing in **EN / FR / AR / HE** with required section stack: hero (2-part Godfather offer) → supporting ×2 → pricing → CTA → restful footer; Tabler Icons site-wide
- Founding artist application or invite list
- Hub Night RSVP (+ simple check-in if capacity matters)
- Manual curation / admin seeding of shell profiles + claim links
- Email nurture

### Phase 1 — Platform MVP

**In scope**

1. Auth (email/password + magic link; OAuth optional)
2. Creator profiles (multi-discipline, location, social links, “open to collab”)
3. Publish works (image, text; audio/video via embed preferred; file upload within limits)
4. Explore / discovery + search + filters
5. Follow
6. Collaboration opportunities (“Looking for…”)
7. Event listings (external ticket link OK; free RSVP optional)
8. Structured contact / interest (not full realtime chat)
9. Notifications (in-app + critical email)
10. Reporting + basic admin moderation
11. Editorial feature / collections (lightweight)
12. Public shareable URLs + SEO metadata
13. Localization: **English, French, Arabic, Hebrew** from launch (elegant i18n — see Technical + UI/UX)

**Out of scope (MVP)**

- Native realtime chat / group DMs
- ML recommendations
- Creator monetization marketplace
- Paid memberships / billing
- Native mobile apps
- Web3, wallets, smart contracts, NFTs, IPFS
- Full ticketing / payments
- Sophisticated media transcoding pipelines
- Multi-country expansion

### Phase 2 — Depth

- Open calls board + applications
- Richer messaging (request inbox, rate limits)
- Peer feedback / critique (optional)
- Stronger admin curation tools
- Artist-facing analytics (basic)

### Phase 3 — Activation & commerce

- Commissions / digital sales
- Event ticketing (paid)
- Membership tiers (especially diaspora/patron)
- Payment rails suitable for Lebanon + diaspora (see Technical Spec)

### Phase 4 — Regional

- Open registration across MENA/SWANA as capacity allows
- Partner / institution API

---

## 8. Key entities

User · Creator Profile · Work · Media Asset · Discipline · Tag · Follow · Collaboration Opportunity · Event · Organization (light) · Report · Notification · Editorial Feature / Collection · Open Call (Phase 2) · Application (Phase 2)

---

## 9. Key journeys

### A — Join and publish

Sign up → disciplines → profile → first work → visible in discovery when eligible.

### B — Discover a creator

Explore → filter/browse → open work → creator profile → follow or contact.

### C — Find a collaborator

Post or browse “Looking for…” → express interest → review profile → connect.

### D — Discover / attend an event

Events → filter → details → external link or RSVP → (optional) coverage tags artists.

### E — Seed claim (Phase 0)

Admin creates shell profile → claim link → artist claims → edits profile → appears as claimed.

---

## 10. Competitive positioning

🔶 **Decision required before marketing copy:**

| Option | Frame |
|---|---|
| **A — Utility** | The practical discovery / collaboration tool nobody built for Lebanon |
| **B — Solidarity** | Built by working artists for this scene, after what we lost |

Both can share the same product; voice, onboarding, and partnerships differ.

**Not competing with:** Resident Advisor on electronic club listings; Behance as global portfolio scale; generic “creator economy” SaaS.

---

## 11. Constraints & assumptions

- 🔶 Small founding team; prefer managed services and a shippable MVP over over-engineering.
- 🔶 Bootstrapped / self-funded at v1.
- Lebanese connectivity is often unstable → low-bandwidth mode is a product requirement.
- Stripe is not available to Lebanon-based entities → payments deferred and multi-provider when needed.
- IRL activation is required to seed the community; digital alone will not cold-start.

---

## 12. Risks (summary)

| Risk | Mitigation |
|---|---|
| Platform fatigue | Lead with IRL + easy import/embed of existing work |
| Payment rails | Defer commerce; plan multi-provider later |
| Bandwidth | CDN, embeds, image budgets, low-bandwidth mode |
| Moderation / political sensitivity | Clear guidelines + staged moderation from day one |
| Competitor copies model | Community depth + founding cohort + cultural narrative |
| Poor RTL / locale UX (AR, HE) | Native copy review; RTL QA for AR + HE; logical CSS |

---

## 13. MVP success criteria

A new visitor can:

1. Discover interesting local creative work quickly  
2. Understand who created it  
3. Find related creators  
4. Identify collaboration opportunities  
5. Discover relevant events  
6. Join and publish their own work without friction  

Evidence of the loop:

```text
creator → work → discovery → connection → collaboration / event
```

---

## 14. Open questions

- [ ] Final name
- [ ] Positioning Option A vs B
- [ ] Anchor venue / Hub Night partner
- [ ] Free vs sponsor vs eventual take-rate
- [ ] Founding artist incentives (recognition only vs other)
- [ ] Final Godfather offer copy per launch locale (EN / FR / AR / HE)
- [ ] Default locale strategy when Accept-Language is ambiguous (recommend: EN)
- [ ] Whether invite-only claim remains after public launch

---

## 15. Document ownership

| Doc | Primary owner |
|---|---|
| This PRD | Product / Founders |
| Functional Spec | PM / BA |
| Technical Spec | Technical Lead |
| UI/UX Spec | UX Lead |
| Acceptance Criteria | QA Lead + PM |
