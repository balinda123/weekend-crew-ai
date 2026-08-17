# Project Documentation Map

## Authority And Purpose

| Document | Responsibility | Must not become |
|---|---|---|
| `docs/PRD-weekend-crew-ai.md` | Product behavior, information architecture, business rules, scope, roles, privacy expectations, acceptance criteria, roadmap | Low-level framework or database manual |
| `docs/TECHNICAL-DESIGN.md` | Cross-client architecture, domain model, shared state machines, data flows, security, provider and cost boundaries | Screen-by-screen UI specification |
| `docs/FRONTEND-IMPLEMENTATION.md` | Routes, components, client state, interactions, API consumption, responsive behavior, frontend tests | Source of truth for server calculations |
| `docs/BACKEND-IMPLEMENTATION.md` | API resources, persistence, workers, deterministic algorithms, idempotency, permissions, observability, backend tests | Product marketing copy |
| `README.md` | Concise current product summary, core workflow, technology, status and links | Complete PRD or implementation manual |
| `docs/superpowers/specs/*.md` | Historical decision records | Mutable current specification |

Always inventory newly added documents under `docs/` and assign them an explicit role before deciding whether they need changes.

## Change-To-Document Matrix

| Change class | Required review/update |
|---|---|
| User workflow, menu, page, field, eligibility rule | PRD, frontend, README; technical/backend when contracts change |
| API, async task, error or idempotency behavior | Technical, backend, frontend; PRD when user-visible |
| Data entity, versioning, audit or retention | Technical, backend; frontend when exposed; PRD for privacy/business impact |
| AI input/output, cost, points, quota or fallback | PRD, technical, frontend, backend, README |
| Permission, publishing, privacy or third-party content boundary | PRD, technical, frontend, backend, README |
| Responsive or visual-only change | PRD visual requirement and frontend; README only if product identity changes |
| Testable behavior or threshold | PRD acceptance, frontend/backend tests, technical non-functional requirements when cross-cutting |
| Prototype-only simulation | PRD prototype notes, frontend, README current status; do not claim production backend support |

## Current Canonical Baseline

Use this section to detect stale text, then update it whenever a confirmed requirement changes:

- Global menus: Home and Profile only.
- Profile trip scopes: owned, joined, and saved.
- New trips are private to the owner and members; only approved, sanitized snapshots become public.
- Public detail, publishing snapshots, and copied guides always exclude AA expenses, splits, transfers, member identity, source links, and original screenshots.
- WeChat identity exchange is separate from user-confirmed avatar and nickname completion.
- First app entry requires both session exchange and explicit profile confirmation before home or public content is shown.
- Trip workspace tabs: Map and Itinerary first, AA Ledger second.
- Private map drawer tabs: Place Collection and Itinerary List.
- Public guide detail also uses map plus drawer, with Place Overview and day-grouped Itinerary List; it never exposes AA.
- AI itinerary requires at least 3 confirmed places.
- The AI 3-place gate does not block manual itinerary creation with fewer confirmed places.
- Trip dates define inclusive Day 1...N groups; every AI or manual stop has a valid day_index, and empty days are allowed.
- Profile credits and AI usage are compact metrics inside the user profile card, not a separate large card.
- New user grant: 100 points.
- Successful AI itinerary: 20 points; successful link parse: 5 points.
- Approved public itinerary reward: 30 points, at most 3 rewarded publications per month.
- AI itinerary quota: at most 5 per month and 3 per day.
- Failed, cancelled, timed-out, or fallback-only AI tasks do not charge points.
- Place entry modes: POI search and controlled public-share-link parsing only; no map-center place creation.
- Search and link candidates enter an editable confirmation flow before becoming places.
- Restricted third-party content must not be scraped by bypassing login, CAPTCHA, anti-bot, or access controls.
- AA settlement is generated explicitly and becomes stale after any ledger mutation.
- Home, Profile, and Settings use one light card system; the prototype exposes four gradient palette candidates until a final brand theme is chosen.
- The trip workspace Itinerary List header exposes a "发布" action when the guide has at least 3 itinerary stops (or an AI-generated itinerary); otherwise the action is disabled with a hint.
- Trip visibility states are `private` -> `reviewing` -> `published`; published requires backend/admin review.
- A standalone prototype admin review page exists at `prototype/admin.html` and simulates the review UI only.

## Consistency Search Checklist

Search for:

- old version labels such as `v0.1` in active documents;
- claims that public search or the public square are not in scope;
- old creation fields such as companion type or per-capita budget;
- claims that links are only stored and never parsed;
- old AI limits or statements that no points system exists;
- route or entity names that differ between frontend and backend;
- AA results shown before explicit generation;
- private member, ledger, source-link, or screenshot data described as public;
- prototype behavior described as already deployed.

After editing, run targeted searches for every changed number, state, endpoint, entity, and renamed concept.

- Add-place layout must keep segmented modes, search field, and candidate actions stable at 375px and 390px.
