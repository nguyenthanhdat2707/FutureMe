# Future Me — MVP Refactor Assessment

**Created:** 2026-09-24  
**Phase:** IMPLEMENTATION  
**Implementation Authorized:** YES (2026-09-24)

---

## Implementation Progress

### Phase 0: CSS Foundation Fix
**Status:** COMPLETE  
**Branch:** feat/mvp-refactor  
**Commit:** 0855855

**Completed:**
- Removed `--color-*: initial;` from `@theme` to restore Tailwind v4 default palette
- Added four missing surface tokens: `--color-surface-card`, `--color-surface-hover`, `--color-surface-border`
- Migrated 14 v3 opacity occurrences to v4 slash syntax across 5 files
- Build verified successful (1.56s, no warnings)

---

### Phase 1: Dashboard UI Rebuild
**Status:** COMPLETE (merged to main via PR #36 / c16d5f2)  
**Branch:** feat/mvp-refactor → origin/main

**Completed:**
- Removed legacy AppShell, left/right sidebars, old Today timeline, old Calendar page
- Added top navigation, `/dashboard` default route, persona/profile control top-right
- Desktop/tablet weekly Gantt with overlapping-event lanes
- Mobile daily agenda
- Event detail dialog, conditional meeting links, deadline cards
- Three workload bubbles, deterministic suggestions heuristic
- Loading/error/empty/retry states

---

### Phase 1b: Dashboard Demo Calendar Data Fix
**Status:** READY_FOR_USER_TEST  
**Branch:** feat/dashboard-demo-calendar (from origin/main / c16d5f2)  
**Commit:** 741aaea

#### Root Cause
`GET /api/calendar/events` called `findUpcoming(userId)` with no lower or upper bound — defaulting to "from now, unbounded". MockCalendarAdapter generated 3 generic events at `now+2h/+4h/+24h` identical for every user. Persona seed used millisecond offsets from `seededAt` (not week-anchored), producing events at wrong UTC hours (e.g. 03:00 UTC instead of 09:00 local). Only 16 total calendar events across 6 personas.

#### Solution
**Backend:**
- Added `findByRange(userId, from, to)` to `ICalendarEventRepository` interface and both SQLite and Dynamo implementations
- Dynamo `findUpcoming` limit raised from 50→200
- `GET /api/calendar/events` now accepts optional `start`/`end` ISO query params; uses `findByRange` when present, falls back to `findUpcoming` for existing callers
- `MockCalendarAdapter` now generates week-anchored events at sensible local hours (Mon-Fri 09:00–15:00)
- Bumped `DEMO_SEED_VERSION` to `phase4-eval-v2`
- Rewrote persona calendar seeding: 94 week-anchored events (was 16), stored as UTC 02–11h = Vietnam 09–18h

**Frontend:**
- `api.calendar.getEvents()` accepts optional `{ start, end }` range params
- `DashboardPage` passes the selected week range to every `getEvents` call
- Week navigation now re-fetches events for the newly displayed week (effect on `rangeStart`)
- All retry callbacks pass `rangeStart` to `loadData`

#### Seeded Persona Scenarios
| Persona | Events | Scenario |
|---|---|---|
| focused-builder | 12 | Deep-work mornings Mon–Fri, few meetings, clear space |
| busy-balancer | 18 | Mon–Thu spread, overlapping 1:1/DW on Mon, gym/reading |
| overloaded-lead | 30 | Mon–Thu packed 8 events/day, standups + meetings + reviews |
| needs-clarity | 9 | Sparse with Q3 report deadline Friday 17:00 |
| uncertain-skipper | 11 | Mix of CONFIRMED + TENTATIVE optional events |
| conflict-check | 14 | Deliberate overlaps Mon/Wed, back-to-back Tue, full-day crunch Thu |

#### Changed Files
- `src/repositories/interfaces.ts`
- `src/repositories/calendar-event.repository.ts`
- `src/repositories/dynamo/calendar-event.repository.ts`
- `src/routes/calendar.routes.ts`
- `src/adapters/mock-calendar-adapter.ts`
- `src/demo/personas.ts`
- `src/demo/phase4-evaluation-dataset.ts`
- `src/__tests__/phase4-demo-data.test.ts`
- `src/__tests__/cognito-identity.test.ts`
- `src/__tests__/http-auth.test.ts`
- `src/__tests__/routes.integration.test.ts`
- `frontend/src/api/client.ts`
- `frontend/src/pages/DashboardPage.tsx`

#### Test Results
- Backend: 22 suites, 163/163 tests pass
- Frontend: 12 suites, 68/68 tests pass
- Backend build: tsc clean
- Frontend build: Vite 947ms, no warnings

#### Known Limitations / Deferred
- `allocationRange='next-week'` and `allocationRange='today'` in the TaskType card still filter client-side from the already-loaded current-week events; those ranges are not separately fetched (acceptable for demo, both ranges are within reasonable window)
- Browser smoke across all 6 personas not yet completed — awaiting user test
- Ask Future Me, Understanding, Landing remain separate phases

---
**Status:** READY_FOR_USER_TEST — SPEC-STRICT UI REBUILD COMPLETE
**Branch:** feat/mvp-refactor
**Base checkpoint:** 539e70a
**Dashboard checkpoint commit:** 23291da

**Completed:**
- Created `dashboard-utils.ts` with calendar range, event filtering, workload calculation, deadline extraction, smart suggestion heuristic (215 lines)
- Added EventCategory type system: deep_work, meeting, deadline, recovery, other
- Implemented parseEventMetadata to read category + meetingLink from CalendarEvent.rawData JSON
- Extended CalendarEvent type with optional status + rawData fields
- Created comprehensive test suite: dashboard-utils.test.ts (94 lines)
- Updated phase4-demo-data.test.ts with category + meetingLink validation
- Added valid category metadata to all 16 Phase 4 calendar fixtures and an HTTPS meeting link to the focused-builder sync fixture
- Replaced the legacy Calendar page with the vertical weekly Dashboard UI wired to the existing derivation helpers
- Implemented the seven-day Gantt, mobile daily agenda, overlapping-event lanes, out-of-hours summary, conditional meeting links, deadline cards, exactly three task-type bubbles, and deterministic explained suggestions
- Preserved sync, loading, error, empty, and proactive-intervention states; sync reloads status, events, context, and interventions
- Linked Dashboard tasks to `/understanding` (with `/context` retained as a compatibility redirect) and verified the responsive 7-day/tablet and daily/mobile layouts
- Rebuilt the authenticated shell from the approved Markdown spec: removed the legacy AppShell, both sidebars, old Today timeline, old Calendar presentation, and Demo persona card from the active codebase
- Added the approved top navigation, `/dashboard` default route, top-right profile/persona control, fresh Dashboard component hierarchy, event detail dialog/mobile sheet, shared week control, and per-surface retry states
- Corrected planned-time allocation so only explicit deep-work, meeting, and recovery categories count; uncategorized events no longer become false recovery time
- Added deterministic overlap lanes, active overdue-deadline treatment, and a viewport-balanced Gantt height (`clamp(22rem, 50vh, 30rem)`)

**Verification:**
- Backend: 22 suites, 163/163 tests pass; lint and build pass
- Frontend: 12 files, 68/68 tests pass; lint and production build pass
- Focused Dashboard: dashboard utility and page tests pass, including truthful allocation, overlap lanes, overdue deadlines, event detail, category highlighting, and sync reload
- Browser smoke with deterministic demo fixture: desktop 1280px and tablet 800px render seven Gantt days; mobile 390px renders one selected day; conditional Join link, three workload bubbles, two suggestions, overlapping event lanes, and no page-level horizontal overflow verified
- Independent Antigravity review found the demo metadata compliant and no test/build regressions; its actionable route, overlap, clamping, breakpoint, and accessibility findings were repaired or verified against the explicit responsive spec
- Scoped `git diff --check` passes

**Demo Direction:**
- Demo mode is the MVP path; Cognito is not required for this refactor/demo flow
- Keep the six deterministic personas as distinct user profiles and enrich their examples so each exposes a different user need and a visible Future Me capability
- Demo data must remain synthetic, deterministic, editable, and separate from authoritative core decision logic

**Blockers:** None

**Remaining non-blocking items:**
- Run the Product Owner browser sweep across all six demo personas and enrich persona-specific weekly examples where they materially improve the demo
- Add server-side bounded calendar range support before arbitrary past/future week navigation must be production-complete; the accepted demo currently filters the returned events client-side
- Calendar event editing and persisted suggestion Accept/Deny write-back remain deferred beyond this checkpoint; the current suggestion controls are explicitly local-only acknowledgements

**Next phase:** Phase 2 — Ask Future Me, using the approved Conversation Facade approach

---

### Phase 3: Understanding Page Rebuild
**Status:** READY_FOR_USER_TEST
**Branch:** feat/understanding (from origin/main a5487ad)
**Commits:** 6bad5cf (history datasource + persona timelines), HEAD (entity-dedup fix + full UI)

**Completed:**
- Rebuilt `ContextPage.tsx` from scratch — new 7-block spec layout: header → 3 KPIs → Understanding Evolution chart → Context by Category bars → Focus Patterns empty state → Personal Context section → Calendar Overview card
- New `frontend/src/features/understanding/` component tree (14 components): UnderstandingHeader, UnderstandingKpiCards, UnderstandingEvolutionChart, ContextByCategory, FocusPatternsCard, PersonalContextSection, CalendarDataSourcesCard, WhatFutureMeLearned, UnderstandingFooter, UnderstandingSkeleton, UnderstandingErrorState, AllContextEmptyState, understanding-utils
- Backend `GET /api/context/history?days=N` route (additive, read-only over existing `personal_context.observed_at` + `valid_until`)
- `src/services/understanding-history.ts`: entity-dedup via `extractEntityId` + `sourceAuthority` — confirm/correct no longer creates false count inflation; history chart series are truthful
- Seed: DEMO_SEED_VERSION bumped to phase4-eval-v3; 6 persona context timelines with backdated `observed_at` so evolution chart has visible shape
- Focus Patterns: required empty state (no fabricated data, no new table)
- Existing confirm/correct/update UI preserved and wired to new presentation layer
- `frontend/src/api/client.ts` extended with `context.getHistory()` client

**Verification:**
- Backend: 15/15 understanding-history tests pass (entity-dedup, expiry dip, decisions series, empty, API route, six-persona differentiation); tsc build clean
- Frontend: 100/100 vitest tests pass (13 suites); Vite production build clean (440 kB JS, 75 kB CSS); oxlint exit 0
- `git diff --check` exit 0

**Blockers:** None

---

## Current Status

**UNDERSTANDING PAGE COMPLETE; READY FOR USER TEST**

Phase 3 (Understanding) is complete on `feat/understanding`. All 15 backend tests and 100 frontend tests pass; both builds are clean. The branch is ready for user browser test before merge to main.

**Approved Decisions (2026-09-24):**
1. Ask Future Me: Conversation Facade (frontend-only state, preserve Decision Engine)
2. Event metadata: store `category` + `meetingLink` in `rawData` JSON (no schema migration)
3. Smart Suggestions: deterministic heuristic using calendar/workload/deadlines (no LLM module, no fabricated scores)
4. Understanding Evolution: real historical query over `personal_context` using `observed_at` + `valid_until`; seed backdated persona context
5. Focus Patterns: required empty state (no fabricated focus-session data, no new table)
6. HomePage/onboarding: preserve as `/onboarding`; Dashboard becomes post-setup main page
7. Git: checkpoint commits per phase on `feat/mvp-refactor` (no PR per phase)

**Implementation Order:**
- Phase 0: CSS Foundation (CRITICAL) → Dashboard → Ask Future Me → Understanding → Landing → Polish/Verification

**Worker Policy:** Codex GPT-5.6 Terra High default; Antigravity for lighter tasks; escalate only on concrete blockers

---

## Historical Baseline Assessment (Pre-Implementation)

The gap analysis below is preserved as the pre-refactor audit. Its "Current State" labels describe the repository before the completed Phase 0 and Dashboard checkpoint; use the Implementation Progress and Current Status sections above for the authoritative present state.

Future Me has working business logic (Decision Engine, Context Engine, demo personas) but significant gaps between current UI and approved specifications. Most gaps are **UI-only** or require **demo data**, not business logic changes.

### Critical Blocker (Must Fix First)

**CSS Palette Breakage** — `frontend/src/index.css:22` contains `--color-*: initial;` inside `@theme`, which wipes Tailwind v4's entire default color palette.

Verified against the current production build (`frontend/dist/assets/index-NtIk8znS.css`, built 2026-09-24 18:48, newer than every source file, so these results are current — note `frontend/dist` is gitignored and local-only):

- **190 palette-utility occurrences (80 unique) in source resolve to nothing.** e.g. `border-slate-200` (14), `border-slate-300` (11), `bg-slate-100` (9), `bg-green-50` (8), `ring-blue-500` (6), `bg-red-50` (4).
- The built CSS emits **only 12 colour utilities in total**, all of them project-custom: `bg-accent-ai`, `bg-accent-intention`, `bg-accent-warning`, `bg-background`, `border-accent-ai`, `border-accent-warning`, `ring-accent-ai`, `text-accent-ai`, `text-accent-intention`, `text-accent-warning`, `text-text-primary`, `text-text-secondary`.

**Three distinct defects, not one:**

1. **Wiped default palette** (`index.css:22`) — the 190 occurrences above.
2. **Four semantic tokens are used but never defined anywhere** (not in `index.css`, not in `tailwind.config.js`): `bg-surface` (21 uses), `border-surface-border` (20), `bg-surface-hover` (12), `bg-surface-card` (9) — **62 usages that cannot render**. Note `--color-surface` *is* defined as a variable, but `.bg-surface` is never emitted as a utility, so the variable alone does not help.
3. **Tailwind v3 opacity syntax** `bg-opacity-*` / `hover:bg-opacity-*` is used in `LeftSidebar.tsx` (5×), `ContextPage.tsx`, `DecisionsPage.tsx` — removed in v4, must become `bg-*/10` style.

**Correction to the existing audit:** `FUTURE_ME_ARCHITECTURE_AUDIT.md` recommends fixing this by extending `tailwind.config.js`. **That fix would have no effect.** `tailwind.config.js` is referenced by nothing (`postcss.config.js`, `vite.config.ts`, and `index.css` never mention it) — Tailwind v4 is CSS-first via `@theme`, so that config file is dead. All token work must happen in `src/index.css`.

**Impact:** Current UI is visually broken in production builds (invisible backgrounds, missing borders, unreadable badges).

**Solution:** Remove `--color-*: initial;`, define the four missing `surface-*` tokens in `@theme`, and migrate `bg-opacity-*` to v4 slash syntax. Verify by rebuilding and re-grepping the emitted CSS.

---

## Gap Analysis by Page

### 1. Landing Page

**Status:** MISSING (not implemented)

**Current State:**
- No `/` route for unauthenticated users
- No hero, features, or use-case sections
- App immediately requires auth and shows HomePage (onboarding)

**Approved Spec Requires:**
- Hero with headline, subheadline, visual, CTA
- How It Works (3 steps)
- Use Cases (3 scenarios)
- Footer with links

**Classification:** **UI ONLY**

**Recommendation:**
- Implement as new `LandingPage.tsx`
- Route: unauthenticated `/` → LandingPage; authenticated `/` → Dashboard
- All content can be static prose + demo screenshots
- No backend changes required

---

### 2. Dashboard (Main Page After Auth)

**Status:** WRONG IMPLEMENTATION (HomePage is onboarding, not dashboard)

**Current State:**
- `HomePage.tsx` renders **onboarding setup flow** (4 questions)
- After setup: hardcoded "Right Now" snapshot + "Active Goals" card in left sidebar
- No calendar view, no smart suggestions, no goal cards

**Approved Spec Requires** (`Future-Me-Dashboard-Page-Design-Spec.md` §4–§8) — a **vertical layout, not the 3-column AppShell**:
1. Top bar (logo; nav Dashboard / Ask Future Me / Decisions / Understanding; avatar). Spec: "Không đưa navigation của landing page vào Dashboard."
2. Dashboard header — eyebrow `YOUR WEEK AT A GLANCE`, heading, supporting text, plus a **date-range control** (e.g. 22–28 September 2026). Changing the range must update calendar, deadlines, Task Type and suggestions together.
3. **Weekly Gantt calendar, full width** — the primary surface. Hour column shows 09:00 / 11:00 / 14:00 / 17:00; seven columns Mon–Sun; event pills carry icon + title + badge (`Approved` / `Focus` / `Join` / `Personal`).
4. **Insight grid, three cards** — Deadlines, Task Type (exactly three bubbles + 3-metric footer), Upcoming & Suggestions.

Desktop = 3 equal columns for the insight grid; tablet = 2; mobile = daily agenda + one column.

**Corrections to my earlier draft of this section:** there is no left sidebar of goals, no right sidebar, and **Focus Patterns is not on the Dashboard at all** — it belongs to the Understanding page (§5 of the Understanding spec). The "8am–8pm, 4 visual layers" timeline is the *existing* `RightSidebar.tsx` implementation, not a spec requirement.

**Classification:** mostly **UI**, plus a real **MINOR DATA CHANGE** (bounded calendar range; event category + meeting link). Not purely "UI + DEMO DATA" — see below.

**Current Implementation Can Provide:**
- Goals/Commitments/Preferences: API exists (`GET /api/context`), returns `context.goals`, `context.commitments`, `context.preferences`
- Sync status: API exists (`GET /api/calendar/status`)
- Calendar events: API exists (`GET /api/calendar/events`) — but see the precise limitation below

**Calendar range support — verified precisely:**

The repository layer already has a *partial* capability; it is the route that does not expose it.

- `findUpcoming(userId, fromDate?)` is declared in `src/repositories/interfaces.ts:19` and implemented in both `src/repositories/calendar-event.repository.ts:27` (SQLite) and `src/repositories/dynamo/calendar-event.repository.ts:43` (DynamoDB).
- Both implementations filter on a **lower bound only**: SQLite `WHERE user_id = ? AND start_time >= ?`, Dynamo `KeyConditionExpression: "user_id = :userId AND start_time >= :from"`. There is **no upper bound** in either.
- `fromDate` defaults to `new Date()` (now) when omitted.
- The route `GET /api/calendar/events` (`src/routes/calendar.routes.ts:20`) calls `findUpcoming(userId)` with **no `fromDate` argument**, so it always means "from now, unbounded".
- The Dynamo implementation additionally caps results at `Limit: 50`.

**Consequence for the approved Dashboard spec:** the spec requires a Mon–Sun week view with date-range navigation (e.g. "22–28 September 2026"). The current endpoint cannot serve that, for two separate reasons:
1. **Past days in the current week are invisible.** If today is Thursday, the Mon–Wed events of the displayed week have `start_time < now` and are filtered out.
2. **No upper bound**, so "this week" cannot be isolated from all future events; and past weeks / arbitrary ranges are unreachable entirely.

**The event model lacks two fields the spec depends on — verified:**

`CalendarEvent` (`src/domain/types.ts:391-402`) is exactly: `id`, `userId`, `externalId`, `title`, `startTime`, `endTime`, `status?`, `rawData?` (JSON string), `syncedAt`, `createdAt`.

There is **no category field and no meeting-link field**, and the seed generator sets neither (`grep -cE 'meeting_link|meetingLink|location|category' src/demo/phase4-evaluation-dataset.ts` → **0**).

Three spec requirements depend on those missing fields:
1. **Event pill badges** — spec mandates one of `Approved` / `Focus` / `Join` / `Personal` per pill. Not derivable from `title` + `status` without guessing.
2. **Task Type card** — spec defines it as planned-time allocation by category ("Tỷ lệ được tính từ tổng duration của event hoặc time block đã có category"), with a 3-metric footer (16h Deep work / 5h Meetings / 2h Recovery). **Category is the input, and it does not exist.**
3. **`Join now`** — spec: show it *only* when a meeting link exists. There is no field to check, so the button's visibility rule is currently unimplementable.

**Smallest MVP path (no schema migration):** `rawData` is already a free-form JSON string on the event. Categories and meeting links can be written into it by the seeder and read by the UI, keeping the table and the sync path untouched. A typed `category` column is the cleaner long-term fix but is not needed for the demo.

**This reclassifies part of the Dashboard from "UI + DEMO DATA" to "MINOR DATA CHANGE"** — the Task Type card and pill badges need a data field that does not exist today, however it is stored.

**What's Missing:**
- **Calendar needs a true bounded range**: add an upper bound to the repositories and expose `start`/`end` query params on the route (the `fromDate` lower bound already exists and can be reused)
- **Event category + meeting link** (via `rawData` for the MVP) — required by Task Type, pill badges and the `Join now` rule
- **Richer seed calendars**: currently 16 events across 6 personas — focused-builder 2, busy-balancer 4, overloaded-lead 6, needs-clarity 1, uncertain-skipper 1, conflict-check 2. A Mon–Sun week view needs materially more per persona.
- **Gantt rendering** (UI only — 7 day-columns × hour rows 09:00/11:00/14:00/17:00, pills positioned by day + duration)
- **Deadlines card** — derivable from existing context (goals/commitments carry `deadline`); needs relative-time text + High/Medium priority badge + colour-by-urgency (red <24h, amber 1–3d, neutral >3d)
- **Upcoming & Suggestions** — small deterministic heuristic using existing/demo calendar, workload, deadlines and available gaps. No new LLM module, no unexplained fabricated scores.

**Recommendation:**
1. **UI:** Implement `DashboardPage.tsx` with the spec's **vertical** layout (top bar → header + date-range → full-width Gantt → 3-card insight grid). Do **not** reuse the 3-column `AppShell` here.
2. **MINOR DATA:** Add a bounded range to the calendar read path (`start`/`end` on `GET /api/calendar/events`; upper bound in both repos; revisit Dynamo `Limit: 50`).
3. **MINOR DATA:** Carry event **category** + **meeting link** through `rawData` so Task Type, pill badges and the `Join now` rule become implementable.
4. **DEMO DATA:** Extend persona seeding with a fuller week of categorised events (today: 16 events total across 6 personas).
5. **PRESERVE:** Keep HomePage as `/onboarding` for the setup flow (or inline it into the Dashboard empty state).
6. **Note:** Focus Patterns belongs to the Understanding page, not here.

---

### 3. What Future Me Understands

**Status:** WRONG STRUCTURE (list view, not charts)

**Current State:**
- `ContextPage.tsx` renders flat list of context attributes with edit/confirm buttons
- Shows Goals, Commitments, Preferences as separate cards
- No charts, no historical evolution, no category breakdown

**Approved Spec Requires:**
- Section 1: Current Understanding (Goals, Commitments, Preferences as cards) ✓ exists
- Section 2: **Understanding Evolution chart** (line chart, context count over 30 days)
- Section 3: **Context by Category pie chart** (goals 40%, preferences 30%, calendar 20%, observations 10%)
- Section 4: **Focus Patterns bar chart** (deep work vs meetings vs rest)

**Classification:** **UI + DEMO DATA**

**Backend Reality (verified) — the two charts are NOT equivalent in cost:**

**Understanding Evolution — derivable from existing data, no schema change needed.**
The spec defines the Y axis as "số bản ghi ngữ cảnh đang hợp lệ tại từng thời điểm" (count of context records valid at each point in time). The existing table can already express exactly that:
- `personal_context` (`src/database/schema.ts:19-29`) has `observed_at TIMESTAMP NOT NULL` **and** `valid_until TIMESTAMP` (nullable), plus `source` and `confidence`.
- `create()` (`src/repositories/personal-context.repository.ts:42`) **inserts a new row** rather than overwriting, so the table accumulates history; `update()` can set `valid_until` to expire a record.
- So the four series are a query, not new persistence: for each date D, count rows where `observed_at <= D AND (valid_until IS NULL OR valid_until > D)`, grouped by attribute type.
- The seed generator already exercises this: `phase4-evaluation-dataset.ts:179` seeds an `overloaded-lead` record with an `expired` `observed_at` and a `valid_until`, which is precisely the "commitment expired, so the line dips" case the spec calls out.

What is genuinely missing is only the **read path**, not the data model:
- `IPersonalContextRepository` (`src/repositories/interfaces.ts:55-61`) exposes only `findByUserId`, `findByUserIdAndAttribute`, `findById`, `create`, `update` — **no time-range/as-of query**.
- `contextRouter` has `/`, `/setup`, `/update`, `/confirm`, `/correct`, `/analyze`, `/clarify` — **no history endpoint**.

**Focus Patterns — genuinely has no data source.**
- Grepping `src` for `focus.?session|focusPattern|deep.?work.?minutes` returns **0 matches** (excluding tests). No entity, no table, no route.
- The 10 tables are: `users`, `personal_context`, `decisions`, `observations`, `calendar_events`, `outcomes`, `decision_choices`, `check_in_schedule`, `feedback`, `interventions`. **There is no focus-session table.**
- The spec explicitly forbids faking this one: render the streamgraph "chỉ khi đã ghi nhận focus session thực tế", and a calendar entry named "Deep Work 4 hours" is only a plan, not a completed session. It mandates the empty state "Record a focus session to see your patterns" when data is absent.

**Practical consequence:** these two charts should be treated as separate work items with different risk, not lumped together as "demo data".

**Recommendation:**
1. **UI:** Implement the layout per spec — header, 3 KPI cards, Understanding Evolution (full width), then Context by Category + What Future Me Learned side by side, then Focus Patterns (full width), then Personal Context, then Calendar Overview.
2. **Understanding Evolution — query existing data via `observed_at` + `valid_until` temporal windowing.** Add an as-of/time-range read path over `personal_context`. Seed backdated persona context where useful for demo history.
3. **Context by Category — derive from current context.** Four horizontal bars counting current Goals / Commitments / Preferences / Decisions. Do **not** hardcode 40/30/20/10, and per spec do not render an "AI understands you 75%" figure (no defined denominator).
4. **Focus Patterns — ship the required empty state.** No focus-session data exists anywhere in the backend (verified). Render "Record a focus session to see your patterns" rather than a synthetic streamgraph; the spec explicitly forbids a fake waveform and forbids deriving focus quality from calendar events.
5. **ABSTRACTION:** Introduce a `getUnderstandingHistory()` seam so the datasource can move from query to richer API later without touching chart components.
6. **Labelling:** any illustrative figures shown in mockups must carry the spec's "Minh họa · dữ liệu giả" label.

**Business Logic:** PRESERVE (Context Engine untouched; all four items above are read paths and presentation)

---

### 4. Ask Future Me

**Status:** WRONG STRUCTURE (form-based, not conversation)

**Current State:**
- `DecisionsPage.tsx` is a large form with 11 input fields (`DemoForm` interface, lines 7-19: `userId`, `question`, `target`, `deadline`, `timeCostHours`, `availableHoursBeforeDeadline`, `workloadHoursBeforeDeadline`, `energyCost`, `availableEnergy`, `goalRelevance`, `source`)
- Single request → single response display
- Shows: feasibility badge, recommendation card, tradeoffs grid, clarification form, evidence delta
- **NO conversation thread, NO history, NO follow-up messages**

**Approved Spec Requires:**
- Conversation UI: user message → Future Me response → clarification → refined response → observation → updated response
- Thread view with interleaved messages
- Relevant context sidebar (right column)
- Smooth message append (not full-page replace)

**Classification:** **UI ONLY** (presentation mapping layer)

**Backend Reality (verified):**
- Decision API works (`POST /api/decisions`, `src/routes/decision.routes.ts:19`)
- Returns: `decision`, `assessment`, `clarificationNeeded`, `policy`, `state`, `relevantHistory` (`src/intelligence/mock-decision-engine.ts:157-164`)
- Clarification flow exists (ASK → user answers → re-assess)
- Observation reporting exists (`POST /api/context/update`)

**History — the gap is in the frontend, not the backend:**
- **The backend history endpoint already exists**: `GET /api/decisions` (`src/routes/decision.routes.ts:120-133`) returns `{ decisions }` via `decisionRepo.findByUserId(userId, limit)`, with a `limit` query param. `GET /api/decisions/:id` (line 70) fetches one decision with ownership checks. Choices and outcomes have live endpoints too (`/api/choices`, `/api/outcomes`).
- **The frontend client deliberately returns nothing**: `decisionsApi.getHistory()` in `frontend/src/api/client.ts:389-392` is a stub — `await delay(300); return [];`. It never calls the API.
- **Nothing in the frontend renders history or a conversation.** Grepping `frontend/src` (excluding tests) for `conversation|thread|ChatMessage|UserMessage|AssistantMessage|composer` returns **0 matches**. `DecisionsPage.tsx` contains no call to `getHistory`, `listChoices`, or `listOutcomes`.

This materially lowers the cost of the left-hand History sidebar required by the spec: it is wiring an existing endpoint into a stubbed client, not building a backend feature.

**Critical Decision Required (ASK USER):**

Two MVP-safe approaches:

**A. Conversation Facade (Simpler)**
- Map each API interaction to conversation items:
  - User question → UserMessage
  - Recommendation → FutureMeMessage (with reasoning, tradeoffs)
  - Clarification needed → ClarificationBlock (inline form)
  - Observation submitted → UserMessage ("I just got 4 more hours of work") → re-assess → FutureMeMessage (updated)
- Store conversation in **frontend session state only** (lost on refresh)
- Each decision is independent (no multi-turn conversation persistence)

**B. Persistent Conversation (More Work)**
- Add conversation entity to backend (`conversationId`, `messages[]`)
- Store all interactions server-side
- Support multi-turn refinement within one conversation
- Requires new API endpoints + DB schema

**Recommendation:** **Approach A for MVP** — conversation UI without backend persistence. User experience feels conversational, backend logic remains unchanged.

---

## Demo Personas & Data

**Current State:**
- 6 demo personas defined in `src/demo/personas.ts` (Focused Builder, Busy Balancer, Overloaded Lead, Needs Clarity, Uncertain Skipper, Conflict Check)
- Phase 4 evaluation dataset in `src/demo/phase4-evaluation-dataset.ts` generates synthetic context/calendar/decisions
- Demo seeding exists (`POST /api/demo/seed?scenario=...`)

**Gaps for MVP:**
- Personas lack rich calendar data for Dashboard Gantt view
- Historical context snapshots needed for Understanding Evolution chart (will seed backdated context via `observed_at`)
- Smart Suggestions require deterministic heuristic using calendar/workload/deadlines

**Recommendation:**
- Extend `generatePhase4Dataset()` to include:
  - 10-15 categorized calendar events per persona (with `category` + `meetingLink` in `rawData`)
  - Backdated personal_context records (for Understanding Evolution temporal query)
- Create centralized demo profile structure instead of scattered hardcoded values

---

## Business Logic Preservation

**PRESERVE THESE — DO NOT MODIFY:**

1. **Decision Engine** (`src/intelligence/mock-decision-engine.ts`)
   - Uses LLM for tradeoff reasoning
   - Retrieves relevant history (Phase 6 feature)
   - Integrates with feasibility assessment, policy evaluator
   - **Status:** Working correctly, believable for demo

2. **Context Engine** (`src/intelligence/simple-context-engine.ts`)
   - Manages goals, commitments, preferences, observations
   - Confirmation/correction flow
   - **Status:** Working correctly

3. **Feasibility Assessment** (`src/intelligence/deterministic-feasibility-assessment.ts`)
   - Time-based feasibility calculation
   - **Status:** Working correctly

4. **Policy Evaluator** (`src/intelligence/decision-policy-evaluator.ts`)
   - RECOMMEND / ASK / ABSTAIN logic
   - **Status:** Working correctly

5. **History Retrieval** (`src/intelligence/decision-history-retrieval.ts`)
   - Retrieves past decisions with outcomes
   - **Status:** Working correctly

**Implementation Rule:** UI refactor must NOT touch these files unless a concrete bug is found.

---

## Data / DB Changes

**No table needs to be created or altered for the Dashboard or for Understanding Evolution.** Only one item below touches the schema, and it is optional.

### Required (Small) — read path only, no schema change

1. **Bounded calendar range**
   - `findUpcoming(userId, fromDate?)` already exists and already filters `start_time >= fromDate` in both repos; it has **no upper bound** and the route passes no `fromDate` at all.
   - Add an upper bound (`toDate`) to `IPersonalContextRepository`'s calendar sibling `ICalendarEventRepository`, both implementations (SQLite `AND start_time <= ?`, Dynamo `BETWEEN` on the `userId-startTime-index`), and expose `start`/`end` on `GET /api/calendar/events`.
   - Also revisit Dynamo's hardcoded `Limit: 50` (`src/repositories/dynamo/calendar-event.repository.ts:54`) — a busy week plus focus blocks can exceed it.
   - **Impact:** Isolated, additive, low-risk. Existing callers keep working if both params stay optional.

2. **Context as-of / history read path**
   - Add a time-range query to `IPersonalContextRepository` and a `GET /api/context/history?days=30` route.
   - **No new column and no new table**: `personal_context.observed_at` + `personal_context.valid_until` already carry everything the four series need, and `create()` already appends rather than overwrites.
   - **Impact:** Additive read path over existing data.

### Optional (only if Focus Patterns must show real data)

3. **Focus session tracking** — the one genuine schema addition
   - Verified absent: 0 code matches for focus-session concepts, and none of the 10 tables stores completed focus time.
   - Would need a `focus_sessions` table (userId, startTime, endTime, completed minutes, optional self-rated 1–5) plus a record/read path.
   - **The spec's own rule makes this skippable for the MVP:** do not render the streamgraph without real sessions; show "Record a focus session to see your patterns" instead. A calendar block titled "Deep Work" is a plan, not a session.

**Recommendation:** Do #1 and #2 (both additive read paths). **Ship the Focus Patterns empty state rather than doing #3** — it satisfies the spec, costs almost nothing, and avoids inventing data the spec explicitly forbids faking.

---

## Implementation Phases (Proposed)

**Once user approves, recommended sequence:**

### Phase 0: Foundation (Critical Blocker)
Three separate defects, all in `frontend/src/index.css` plus call sites:
- Remove `--color-*: initial;` (`index.css:22`) to restore the default palette (190 occurrences / 80 unique utilities)
- Define the four missing `surface-*` tokens in `@theme` (`bg-surface` 21, `border-surface-border` 20, `bg-surface-hover` 12, `bg-surface-card` 9 = 62 usages)
- Migrate v3 `bg-opacity-*` / `hover:bg-opacity-*` to v4 slash syntax (`LeftSidebar.tsx` ×5, `ContextPage.tsx`, `DecisionsPage.tsx`)
- Do **not** edit `tailwind.config.js` — verified dead under Tailwind v4 (referenced by nothing)
- Verify by rebuilding and re-grepping emitted CSS for the previously-missing selectors; the built CSS currently emits only 12 colour utilities

### Phase 1: Landing Page
- Implement LandingPage.tsx (unauthenticated `/`)
- Static content, no backend changes
- Update routing (unauthenticated → Landing, authenticated → Dashboard)

### Phase 2: Dashboard
Note: the Dashboard spec is **not** the 3-column AppShell — it is top bar → header + date-range → full-width weekly Gantt → 3-card insight grid.
- Implement DashboardPage.tsx per that vertical layout (Gantt is the largest surface on desktop/tablet)
- **Add an upper bound to the calendar range** (lower bound `fromDate` already exists in both repos; the route passes neither) and expose `start`/`end` on `GET /api/calendar/events`; revisit Dynamo's `Limit: 50`
- Extend demo persona seeding with richer calendar data (currently 2–6 events/persona, too sparse for a week view)
- Gantt rendering: hour rows 09:00/11:00/14:00/17:00, Mon–Sun columns, event pills with badge (Approved/Focus/Join/Personal)
- Task Type card: exactly 3 bubbles + 3-metric footer, computed from **event duration by category** (spec: planned-time allocation, not energy); empty state when data is insufficient
- Upcoming & Suggestions: `Join now` only when a meeting link exists; Accept/Deny must not mutate the calendar before the user acts
- Mobile: daily agenda + day switcher, **not** a compressed 7-day Gantt
- Preserve HomePage as `/onboarding` or integrate into Dashboard empty state

### Phase 3: Understanding
- Restructure ContextPage.tsx into the spec's 7-block order (header → 3 KPIs → Evolution → Category + AI insight → Focus → Personal Context → Calendar Overview)
- Cap at **two large charts + one small chart** per spec; no donut/gauge/fourth chart
- Understanding Evolution: multi-series **line** chart (not a streamgraph, not stacked areas) backed by an as-of query over existing `personal_context` columns
- Context by Category: 4 horizontal bars derived from current counts
- Focus Patterns: **empty state** ("Record a focus session to see your patterns") — no data source exists and the spec forbids a fake waveform
- Preserve existing context lists + confirm/correct actions (mobile: accordion, bottom sheets)

### Phase 4: Ask Future Me
- Restructure DecisionsPage.tsx into conversation UI
- Map API interactions to conversation items (UserMessage, FutureMeMessage, ClarificationBlock)
- Implement thread view with message append
- Add relevant context sidebar (right column)
- Preserve existing Decision Engine integration

### Phase 5: Polish & Verification
- Responsive behavior verification
- Empty states (new user, no calendar, no decisions)
- Loading states
- Error states
- Demo persona switching UX
- End-to-end test of important flows

---

## Open Questions for User

### 1. Ask Future Me Conversation Persistence

Should conversations persist across page refreshes, or is session-only state acceptable for the MVP?

**Option A (Session Only):**
- Simpler, no backend changes
- Each decision is independent
- Conversation lost on refresh
- Faster to implement

**Option B (Persistent):**
- Better UX (refresh preserves conversation)
- Requires new backend API + DB schema
- More work, higher risk

**Your Preference:** _____

### 2. Understanding Evolution datasource

Verification changed this question. The original framing ("demo data vs build new tables") was wrong: `personal_context` **already** has `observed_at` + `valid_until`, and `create()` appends rather than overwrites, so the four series are a query over existing data — no new table, no new column.

So the real choice is narrower:

**Option A (recommended): query real data, accept a short history.**
- Add an as-of read path over `personal_context`
- Lines are truthful; early demo accounts will simply show a short/flat history
- Empty state when there is no change history yet (spec requires this)

**Option B: query real data + seed richer persona history.**
- Same read path, plus backdated seed rows per persona so lines have visible shape for the demo
- Still real data flowing through the real query, just pre-populated
- Slightly more seeding work

**Your Preference:** _____

**Note — Focus Patterns is deliberately not offered as a choice here.** No focus-session data exists anywhere in the backend (0 code matches, no table among the 10), and the spec forbids rendering a synthetic waveform or inferring focus from calendar events. Recommendation is the empty state. Say so explicitly if you want a `focus_sessions` table built instead.

### 3. HomePage / Onboarding Flow

Current HomePage is onboarding. Should we:

**Option A:** Keep as `/onboarding` route, show Dashboard after setup  
**Option B:** Inline onboarding into Dashboard empty state (no separate route)  
**Option C:** Remove onboarding entirely, use demo personas only

**Your Preference:** _____

### 4. Smart Suggestions Logic

Dashboard Smart Suggestions — acceptable MVP approach?

**Option A:** Hardcoded per persona ("You have 2h free at 2pm — consider focus session")  
**Option B:** Simple heuristic (find 2h+ gaps in calendar, suggest focus/rest based on workload)  
**Option C:** LLM-generated suggestions (requires new intelligence module)

**Your Preference:** _____

### 5. Git Workflow for Implementation

Once approved, should I:

**Option A:** Work on `feat/mvp-refactor` branch, create one large PR at end  
**Option B:** Work on `feat/mvp-refactor`, create incremental PRs per phase  
**Option C:** Work directly on `feat/ci-cd-optimization` (current branch)  
**Option D:** Other workflow you prefer

**Your Preference:** _____

---

## Risk Assessment

### Low Risk
- Landing Page (static content)
- CSS palette fix (isolated, easily testable)
- Calendar date-range filter (isolated API change)

### Medium Risk
- Dashboard Gantt rendering (complex UI logic, 4 visual layers)
- Understanding charts (demo data abstraction must be clean)
- Ask Future Me conversation mapping (presentation layer must not break Decision Engine)

### High Risk
- None identified (we are preserving working business logic)

---

## Next Steps

**User must:**
1. Review this assessment
2. Answer the 5 open questions above
3. Approve or modify the proposed implementation phases
4. Explicitly authorize implementation to begin

**After approval, I will:**
1. Update this STATUS.md with approved decisions
2. Create detailed phase documents if needed
3. Begin Phase 0 (CSS palette fix)
4. Provide incremental progress updates as each phase completes

---

## Appendix: Evidence

### CSS Palette Breakage (Empirical)

**Build artifact used:** `frontend/dist/assets/index-NtIk8znS.css`, built 2026-09-24 18:48. Confirmed newer than every `.ts`/`.tsx`/`.css` file under `frontend/src` (`find src -newer` returned nothing), so the artifact reflects current source. `frontend/dist` is gitignored (local-only).

**Commands and actual results:**
```bash
cd frontend
CSS=dist/assets/index-NtIk8znS.css

# palette utilities referenced in source
grep -rhoE '\b(bg|text|border|ring|from|to|via)-(slate|gray|zinc|red|rose|green|emerald|amber|yellow|orange|blue|sky|indigo|violet|purple|fuchsia|pink|teal|cyan|lime)-[0-9]{2,3}\b' \
  src --include=*.tsx --include=*.ts | wc -l          # 190 occurrences
#   ... | sort -u | wc -l                             # 80 unique

# every colour-ish utility actually emitted
grep -oE '\.(bg|text|border|ring)-[A-Za-z0-9_-]+' "$CSS" | sort -u
#   12 colour utilities, ALL project-custom:
#   .bg-accent-ai .bg-accent-intention .bg-accent-warning .bg-background
#   .border-accent-ai .border-accent-warning .ring-accent-ai
#   .text-accent-ai .text-accent-intention .text-accent-warning
#   .text-text-primary .text-text-secondary
#   (zero slate/red/green/amber/blue/... utilities)
```

**Three distinct defects:**

1. **Wiped palette** — `frontend/src/index.css:22` contains `--color-*: initial;` inside `@theme`, discarding Tailwind v4's default palette. Accounts for the 190 dead occurrences.

2. **Undefined `surface-*` tokens** — used in source, defined nowhere (`grep 'surface-card\|surface-border\|surface-hover' src/index.css tailwind.config.js` → no match):

   | token | uses | in built CSS |
   |---|---:|---|
   | `bg-surface` | 21 | NOT_IN_CSS |
   | `border-surface-border` | 20 | NOT_IN_CSS |
   | `bg-surface-hover` | 12 | NOT_IN_CSS |
   | `bg-surface-card` | 9 | NOT_IN_CSS |

   = 62 usages that cannot render. `--color-surface:#fff` *is* emitted as a variable, but `.bg-surface` is never emitted as a utility.

3. **Tailwind v3 opacity syntax** — `bg-opacity-*` / `hover:bg-opacity-*`, removed in v4: `LeftSidebar.tsx:31,41,51,61,71`, `ContextPage.tsx:92,229,330`, `DecisionsPage.tsx:555,599`.

**Correction to `FUTURE_ME_ARCHITECTURE_AUDIT.md`:** it prescribes fixing this via `tailwind.config.js`. That would have no effect — `grep 'tailwind.config' postcss.config.js vite.config.ts src/index.css` returns nothing, so under Tailwind v4 (CSS-first `@theme`) the config file is dead. Fixes belong in `src/index.css`.

### Decision Engine Verification

**File:** `src/intelligence/mock-decision-engine.ts:56-165`

Evidence shows:
- LLM integration (line 112-115)
- History retrieval (line 58-64)
- Context integration (line 67)
- Feasibility assessment (line 68)
- Policy evaluation (line 71-75)
- Reasoning construction (line 119-120)

**Conclusion:** Working correctly, no refactor needed.

### Demo Persona Evidence

**File:** `src/demo/personas.ts:3-52`

6 personas defined:
- focused-builder
- busy-balancer
- overloaded-lead
- needs-clarity
- uncertain-skipper
- conflict-check

**Seeding:** `src/demo/phase4-evaluation-dataset.ts:104-196` generates 64 records (6 users, 28 context attrs, 8 observations, 16 calendar events, 6 decisions).

**Gap:** Personas lack rich calendar data for Dashboard Gantt view.

---

**Document Status:** COMPLETE — awaiting user input to proceed

---

## Deployed Demo Runtime Fix
**Status:** COMPLETE  
**Branch:** fix/deployed-demo-runtime  
**Commit:** 887a42e (merged to main as 5e8b41c)  
**Date:** 2026-09-25

### Issues Fixed

#### Issue 1: Amplify SPA Deep-Link 404
**Root cause:** Not actionable — Amplify rewrite rule (`/<*>` → `/index.html` 404-200) was already correct.  
**Decision:** Skipped per user direction; deep-link routing is not required for demo flow.

#### Issue 2: Deployed Demo Persona Version Mismatch
**Root cause:** `frontend/src/config/demo-personas.ts` had hardcoded `phase4-eval-v1` persona IDs for all 6 personas. The backend bumped to `phase4-eval-v2` in commit 741aaea but the frontend config was not updated in that PR.  
**Files changed:**  
- `frontend/src/config/demo-personas.ts` — all 6 persona IDs updated from v1 to v2  
- `frontend/src/api/client.test.ts` — test mock updated to v2  
- `package.json` — `demo:phase4:*` scripts updated to pass `phase4-eval-v2` as confirmation arg  

**Deployed:** Amplify job #34 rebuilding from commit 5e8b41c (in progress at time of writing).

#### Issue 3: /api/interventions/check Returns 404
**Root cause (A):** Lambda binary was built on 2026-09-23 19:26, before `intervention.routes.ts` was wired into `app.ts`. The route existed in source but the deployed ZIP did not contain `dist/routes/intervention.routes.js`.  
**Root cause (B):** `future-me-prod-interventions` DynamoDB table did not exist (not provisioned in Terraform). Lambda IAM role had no permission to access it. No `INTERVENTIONS_TABLE` env var on Lambda.  

**Actions taken (all direct, no Terraform apply):**  
1. Rebuilt Lambda ZIP with `npm run package:lambda` — now contains `dist/routes/intervention.routes.js`  
2. Created `future-me-prod-interventions` DynamoDB table with 3 GSIs: `userId-createdAt-index`, `userId-status-index`, `userId-issueKey-index`  
3. Updated `future-me-prod-lambda-role` IAM inline policy to grant DynamoDB actions on the new table + indexes  
4. Added `INTERVENTIONS_TABLE=future-me-prod-interventions` to Lambda environment variables  
5. Deployed updated ZIP via `aws lambda update-function-code`  

### DEPLOYED DEMO VERIFICATION

**Backend API verification (direct curl against deployed API):**

| Persona | interventions/check | Calendar events (week Sep 21–28) |
|---|---|---|
| phase4-eval-v2:focused-builder | 200 OK | 12 events |
| phase4-eval-v2:busy-balancer | 200 OK | 18 events |
| phase4-eval-v2:overloaded-lead | 200 OK | 30 events |
| phase4-eval-v2:needs-clarity | 200 OK | 9 events |
| phase4-eval-v2:uncertain-skipper | 200 OK | 11 events |
| phase4-eval-v2:conflict-check | 200 OK | 14 events |

**Total seeded events:** 94 (matches commit message expected counts).  
**Seed verification:** `npm run demo:phase4:verify` passed with "Verification passed."

**Test results:**  
- Frontend: 12 test files, 68 tests — all PASS  
- Backend: 22 test suites, 163 tests — all PASS  

**Remaining for browser verification (pending Amplify build #34 completion):**  
- Confirm deployed frontend sends `x-demo-user: phase4-eval-v2:<persona>` in browser  
- Confirm Dashboard Gantt renders populated calendars for all 6 personas  
- Confirm no console errors from these fixes

### BROWSER VERIFICATION COMPLETE (Amplify build #34 — 2026-09-25)

**Persona header verification:**  
`localStorage.getItem('future-me-demo-persona')` returns `phase4-eval-v2:<slug>` for every selected persona. Confirmed in deployed browser session.

**Six-persona calendar verification:**

| Persona | x-demo-user header | Gantt renders events? | Sample events |
|---|---|---|---|
| focused-builder | phase4-eval-v2:focused-builder | YES | Deep Work, Team Sync, Code Review, 1:1 with Manager, Sprint Planning, Feature Demo, Weekly Review |
| busy-balancer | phase4-eval-v2:busy-balancer | YES | Daily Standup, Deep Work, 1:1 with Lead, Client Call |
| overloaded-lead | phase4-eval-v2:overloaded-lead | YES | Daily Standup, Incident Review, 1:1 Alpha, Lunch Briefing |
| needs-clarity | phase4-eval-v2:needs-clarity | YES | Focus Block, Team Sync, Research Block, Planning Notes |
| uncertain-skipper | phase4-eval-v2:uncertain-skipper | YES | Team Standup, Conference Talk Prep (Tentative), Lunch with Client |
| conflict-check | phase4-eval-v2:conflict-check | YES | Important Deep Work, All-hands (Overlap), Lunch, Sprint Plan |

**Intervention endpoint:** No "No events in this range" shown. Disruption Alert intervention renders for focused-builder (correct — intervention policy triggered on active decision).

**Console errors:** None related to these fixes. Only [role="alert"] present is the Disruption Alert intervention (expected behavior).

**All acceptance gates PASSED.**
