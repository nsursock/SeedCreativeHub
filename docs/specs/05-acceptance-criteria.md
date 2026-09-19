# Acceptance Criteria & Definition of Done

**Product:** Creative Hub  
**Owner:** QA Lead + Product  
**Status:** Final consolidated draft v1.0  
**Companions:** Functional · Technical · UI/UX specs  
**Format:** Given / When / Then

Feature IDs map to [02-functional-spec.md](./02-functional-spec.md) §18.

---

## 1. Global Definition of Done

A feature is **done** when:

### Functional
- All ACs for the feature pass in staging  
- Edge cases from Functional Spec handled  
- Business rules enforced **server-side**  
- Empty + error states implemented  

### Quality
- No open P0/P1 bugs against the feature  
- Critical path covered by automated or documented manual test  
- Tested on at least one real mobile viewport  

### Localization (P0 screens)
- Strings externalized  
- EN / FR / AR / HE verified (string parity on P0)  
- RTL verified for **AR + HE** (no horizontal scroll; icons mirrored where required)  

### Accessibility
- Keyboard operable; visible focus  
- Meaningful images have alt text  
- Contrast meets WCAG AA for text  
- axe: 0 critical / 0 serious on P0 screens (target)  

### Security / ops
- Authz verified on mutations  
- Rate limits on abuse-sensitive endpoints  
- No secrets in client bundles  
- Errors observable (Sentry or equivalent)  
- App configurable via env only; no hard dependency on a single PaaS for core auth/DB/storage (VPS-ready)  

### UI
- Product chrome built with **ScifiUI** (`@scifiui/core` from workspace `ScifiUI/`); no replacement UI kit  
- Default theme `retrowave` (other ScifiUI themes OK except `seed-hub`)  
- **Tabler Icons** only for UI icons site-wide  

---

## 2. Phase 0 — Seed

### AC-01 Waitlist (F-01)

**AC-01.1** Given a visitor on `/` or `/en`, when the page loads with locale `en`, then English + LTR above the fold with a clear primary CTA. Equivalent checks pass for `/fr` (LTR), `/ar` (Arabic + RTL), and `/he` (Hebrew + RTL).

**AC-01.1a** Given `/`, when the visitor views the page, then sections appear in order: Hero (2 parts) → Supporting A → Supporting B → Pricing → CTA → Footer — with no required section missing.

**AC-01.1b** Given the hero in the first viewport, when attention is tested (~3 seconds), then the Godfather offer (headline + stacked value + primary CTA) is readable without scrolling past Hero A.

**AC-01.1c** Given the footer, when viewed, then it is sparse/restful (minimal links; no second sales pitch competing with the CTA section).

**AC-01.1d** Given UI icons on the landing page (and product chrome), when audited, then icons are Tabler Icons only (no mixed icon libraries or emoji-as-icons).

**AC-01.2** Given a valid new email + ≥1 discipline, when they submit, then a waitlist record is created and a confirmation state (optional referral code) is shown.

**AC-01.3** Given a duplicate email, when they submit, then behavior is idempotent (success UX, no duplicate row).

**AC-01.4** Given invalid email, when they submit, then inline error; no record created.

**AC-01.5** Given the pricing section, when viewed, then at least one tier shows price/inclusion signals and a CTA (may route to waitlist/founding signup before live payments).

### AC-02 Claim / founding seed (F-02)

**AC-02.1** Given an admin-created shell profile, when a claim link is generated, then the token is unique, single-use, and expires (e.g. 7 days).

**AC-02.2** Given a valid claim link, when the artist sets auth, then they land on an editable version of their profile.

**AC-02.3** Given expired/used token, when opened, then a clear error + path to request a new link.

**AC-02.4** Given an unclaimed profile, when a visitor views it, then an “unclaimed” banner shows and no edit controls.

### AC-03 Hub Night RSVP (F-03) — if enabled

**AC-03.1** Given capacity available, when an authenticated user RSVPs, then RSVP is confirmed and count updates.

**AC-03.2** Given capacity full, when they RSVP, then waitlist is offered (if implemented).

**AC-03.3** Given a valid QR (if used), when scanned once, then check-in recorded; second scan shows already checked in.

---

## 3. Phase 1 — MVP

### AC-04 Auth & onboarding (F-04)

**AC-04.1** Given valid registration, when submitted, then account is created and onboarding can start.

**AC-04.2** Given invalid/duplicate registration, when submitted, then error explained without leaking sensitive account existence beyond safe messaging.

**AC-04.3** Given valid credentials, when login succeeds, then a secure session is established.

**AC-04.4** Given unverified email, when user tries to publish or contact, then they are blocked and prompted to verify; intended action can resume after.

**AC-04.5** Given a taken/reserved handle, when chosen, then submission is blocked (suggestions optional).

### AC-05 Profiles (F-05)

**AC-05.1** Given required fields complete, when saved, then a public profile exists at a stable URL.

**AC-05.2** Given profile owner, when they edit, then changes persist; other users cannot modify it (server rejects).

**AC-05.3** Given multiple disciplines, when published, then profile is discoverable under each.

### AC-06 Works (F-06)

**AC-06.1** Given a valid image (or text) work, when published, then it has a public URL and appears in eligible discovery.

**AC-06.2** Given a draft, when saved, then it is not publicly discoverable.

**AC-06.3** Given another user, when they attempt edit/delete, then server rejects.

**AC-06.4** Given an embed URL from a supported provider, when added, then it renders; unsupported URLs are rejected with guidance.

### AC-07 Discovery & search (F-07)

**AC-07.1** Given a guest, when they open Explore, then public content is visible without login.

**AC-07.2** Given a discipline filter, when applied, then results match that discipline.

**AC-07.3** Given city metadata, when filtered, then matching creators/content surface.

**AC-07.4** Given a known creator name/handle, when searched, then matching public creators return.

**AC-07.5** Given Arabic query variants (alef forms / diacritics), when searching, then normalized matches return where implemented.

**AC-07.6** Given empty results, when shown, then a designed empty state with ≥1 alternative action appears.

### AC-08 Editorial (F-08)

**AC-08.1** Given an editor features a work/creator, when Explore loads, then featured placement is visible and distinct.

### AC-09 Follow (F-09)

**AC-09.1** Given auth user on another profile, when they Follow, then relationship is created and counts update.

**AC-09.2** Given existing follow, when Unfollow, then relationship is removed.

**AC-09.3** Given own profile, when Follow attempted, then UI unavailable or server rejects.

### AC-10 Contact / interest (F-10)

**AC-10.1** Given auth user, when they submit a valid contact/interest message, then recipient gets in-app and/or email notification.

**AC-10.2** Given rate limit exceeded, when further contact sent, then request is rejected with clear message.

### AC-11 Collaboration opportunities (F-11)

**AC-11.1** Given auth user, when they submit a valid opportunity, then it is public with status Open.

**AC-11.2** Given owner, when they close it, then it is marked Closed and excluded from open lists.

**AC-11.3** Given open opportunity, when another user expresses interest, then owner is notified.

### AC-12 Events (F-12)

**AC-12.1** Given authorized organizer, when they submit valid event details, then a public event page is created.

**AC-12.2** Given start date/time, when viewed, then time renders consistently for the locale/timezone strategy.

**AC-12.3** Given external URL, when CTA clicked, then user reaches configured destination.

### AC-13 Notifications (F-13)

**AC-13.1** Given a follow or interest event, when triggered, then a notification is created for the recipient.

**AC-13.2** Given user disables a non-critical email type, when that event fires, then in-app may still appear but email does not.

### AC-14 Moderation (F-14)

**AC-14.1** Given a user, when they report content with a reason, then report is stored against the entity.

**AC-14.2** Given admin, when they resolve a report, then an allowed action is applied and report status updates; audit logged.

**AC-14.3** Given non-admin, when they call admin-only APIs, then server rejects.

### AC-15 i18n (F-15)

**AC-15.1** Given `/ar/...` or `/he/...`, when rendered, then `dir="rtl"` and the matching Arabic/Hebrew UI catalog loads. Given `/en/...` or `/fr/...`, then `dir="ltr"` and the matching catalog loads.

**AC-15.2** Given locale switch among `en`/`fr`/`ar`/`he`, when changed, then preference persists and the URL updates to the new locale prefix.

**AC-15.3** Given P0 screens, when reviewed in AR and HE, then no RTL layout breakage (scroll, mirrored controls, label alignment).

**AC-15.4** Given P0 screens, when compared across EN / FR / AR / HE, then no missing translation keys on critical paths (parity).

**AC-15.5** Given an unknown locale segment, when requested, then the app does not silently invent a locale (404 or redirect to `en`).

### AC-16 SEO / sharing

**AC-16.1** Given public profile/work/event URL, when opened logged out, then page loads.

**AC-16.2** Given share to a supported platform, when unfurled, then title/description/image metadata are present.

### AC-17 Core product loop

**AC-17.1** A visitor can go from a work to its creator in one obvious action.

**AC-17.2** An authenticated visitor can follow or contact without restarting discovery.

**AC-17.3** A user can move from profile context to an open collaboration opportunity when one exists.

### AC-18 Non-functional (cross-cutting)

**AC-18.1** Given supported mobile viewport, when browsing core pages, then usable without horizontal scroll.

**AC-18.2** Given keyboard-only use, when navigating core flows, then controls are reachable with visible focus.

**AC-18.3** Given slow media, when page renders, then layout does not jump unexpectedly where dimensions are reserved.

**AC-18.4** Given mobile 4G target, when loading Explore or event page, then LCP aims for < 2.5s under test conditions.

---

## 4. Explicitly out of scope (do not accept as MVP “done”)

- Wallet connect / SIWE login  
- Smart contract tips or royalty splits  
- IPFS/Arweave pinning as primary storage  
- Full realtime chat  
- Paid ticketing / marketplace checkout  

---

## 5. Release gates

### Phase 0 gate
- [ ] AC-01, AC-02 pass (AC-03 if Hub Night tooling ships)  
- [ ] EN / FR / AR / HE landing usable  
- [ ] RTL QA checklist complete on new screens (AR + HE)  
- [ ] At least one real Hub Night or seeding path exercised  

### Phase 1 (MVP pilot) gate
- [ ] Auth, profile, publish, explore, search, follow, opportunities, events, contact, reports pass  
- [ ] Server-side authz tested  
- [ ] Rate limits on contact/auth/upload  
- [ ] Public URLs + OG metadata  
- [ ] Monitoring + backups configured  
- [ ] No P0/P1 open  
- [ ] Core loop AC-17 demonstrated with real content  

### Phase 2 gate (later)
- [ ] Open calls + applications ACs (to be expanded when scoped)  
- [ ] Messaging abuse controls verified  
- [ ] RTL QA checklist complete on new screens (AR + HE)  

---

## 6. Traceability summary

| Feature | AC range | Phase |
|---|---|---|
| Waitlist | AC-01 | 0 |
| Claim/seed | AC-02 | 0 |
| RSVP | AC-03 | 0–1 |
| Auth | AC-04 | 1 |
| Profiles | AC-05 | 1 |
| Works | AC-06 | 1 |
| Discover/search | AC-07 | 1 |
| Editorial | AC-08 | 1 |
| Follow | AC-09 | 1 |
| Contact | AC-10 | 1 |
| Opportunities | AC-11 | 1 |
| Events | AC-12 | 1 |
| Notifications | AC-13 | 1 |
| Moderation | AC-14 | 1 |
| i18n | AC-15 | 1 |
| SEO | AC-16 | 1 |
| Core loop | AC-17 | 1 |
| NFR | AC-18 | 1 |

---

## 7. Approvals

| Role | Sign-off | Date |
|---|---|---|
| Product / Founders | [ ] | |
| Technical Lead | [ ] | |
| UX Lead | [ ] | |
| QA | [ ] | |
