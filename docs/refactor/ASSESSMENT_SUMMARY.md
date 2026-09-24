# Future Me — Assessment Summary

**Date:** 2026-09-24  
**Status:** Assessment complete, awaiting approval to begin implementation  
**Full Details:** See `docs/refactor/STATUS.md`

---

## What This Assessment Did

1. Inspected the repository against four approved UI/UX specifications
2. Verified current implementation state (APIs, data models, demo system, Decision Engine)
3. Classified every gap as UI / UI + DEMO DATA / MINOR DATA CHANGE / BUSINESS LOGIC CHANGE
4. Identified what can be preserved vs what must change
5. Documented findings with evidence (file paths, line numbers, grep output, actual API responses)

**Implementation has NOT started.** No code was modified, no packages installed, no PRs created.

---

## Critical Blocker (Must Fix First)

**CSS palette is broken in production builds.**

`frontend/src/index.css:22` wipes Tailwind v4's default color palette via `--color-*: initial;` inside `@theme`.

**Verified impact (against current build artifact `frontend/dist/assets/index-NtIk8znS.css`):**
- 190 palette-utility occurrences in source (80 unique tokens like `border-slate-200`, `bg-green-50`) resolve to nothing
- Built CSS emits only 12 colour utilities total, all project-custom
- Four `surface-*` tokens used 62 times are undefined: `bg-surface`, `border-surface-border`, `bg-surface-hover`, `bg-surface-card`
- Tailwind v3 opacity syntax (`bg-opacity-*`) used in 3 files, removed in v4

**Result:** Invisible backgrounds, missing borders, unreadable badges.

**Fix:** Remove the `initial` wipe, define the four missing tokens, migrate v3 opacity syntax to v4 slash notation. ~30 minutes.

---

## Main Gaps (After CSS Fix)

### 1. Landing Page
**Status:** Not implemented  
**Classification:** UI only (static prose + demo screenshots)  
**Effort:** ~4-6 hours

Current state: App routes authenticated users straight to `/decisions`  
Spec requires: Hero section, About, Footer, routing (unauthenticated → Landing, authenticated → Dashboard)

No backend changes needed.

---

### 2. Dashboard
**Status:** Wrong implementation — current `HomePage.tsx` is an onboarding flow, not a dashboard  
**Classification:** UI (80%) + MINOR DATA CHANGE (20%)  
**Effort:** ~12-16 hours

**What's missing:**
- Vertical layout per spec (top bar → header + date-range control → full-width weekly Gantt → 3-card insight grid)
- Calendar API needs bounded range (`start`/`end` query params; upper bound in repos)
- Event model lacks `category` + `meeting_link` fields — needed for pill badges, Task Type card, "Join now" button
  - **Smallest MVP path:** store both in the existing `rawData` JSON field (no schema migration)
- Seed data: currently 16 events across 6 personas; a Mon–Sun week view needs materially more per persona
- Gantt rendering (7 day-columns, hour rows, positioned pills)
- Three insight cards: Deadlines (derivable from existing context), Task Type (requires event categories), Upcoming & Suggestions (seeded suggestions + commitment score explanation)

**What can be preserved:**
- Existing APIs: `GET /api/context` (goals/commitments/preferences), `GET /api/calendar/status`, `GET /api/calendar/events`
- Demo persona system

---

### 3. Understanding Page
**Status:** Not implemented  
**Classification:** UI + DEMO DATA  
**Effort:** ~8-10 hours

**What's missing:**
- Overview section (4 insight cards, all derivable from current context)
- Evolution chart — will use **real historical query** via `personal_context` table's `observed_at` + `valid_until` temporal fields, seeding backdated persona context where useful for demo
- Categories breakdown (current context already has categories)
- Focus Patterns chart — **required empty state** when no focus sessions exist (no fabricated data, no new table for MVP)

**What can be preserved:**
- Current context structure (`GET /api/context`)
- Observation system (context audit already passes 11 tests)
- Context history mechanism (`observedAt`/`validUntil` temporal windowing)

---

### 4. Ask Future Me (Decisions Page)
**Status:** Wrong structure — form-based, not conversational  
**Classification:** UI MAPPING LAYER over existing logic (95%), possibly MINOR DATA (conversation persistence, 5%)  
**Effort:** ~10-14 hours

**Current state:**
- Large 11-field form
- Single request → single response
- Shows feasibility badge, recommendation, tradeoffs, clarification form, evidence delta
- **No conversation thread, no history, no follow-up**

**Spec requires:**
- Conversational layout (user message → Future Me response with context pills → clarification → recommendation)
- Conversation history (left sidebar, by date)
- Follow-up capability

**Key decision for you:**

The backend Decision Engine works. The question is whether the approved conversational UX can be achieved by **mapping the existing single-question flow into a conversation-style presentation** (user message bubble → clarification as a response bubble → recommendation block), or whether it genuinely requires **converting the backend to a stateful multi-turn conversation API**.

**My assessment:** A presentation mapping is feasible for the MVP if:
1. Each "conversation" is one decision request
2. History sidebar shows past decisions as conversation threads
3. Follow-up questions create new decision requests (not appended to the same conversation)
4. Clarification responses are displayed as message bubbles, not a separate form

This would preserve the existing Decision Engine entirely.

**If you want true multi-turn conversations where clarifications and follow-ups stay in one thread**, that requires backend changes (conversation state, turn history, context accumulation across turns). Not a rewrite, but material work.

**Which direction do you prefer?**

---

## What Does NOT Need Changing

1. **Decision Engine** — works, uses context, produces reasoning + tradeoffs + clarifications. Accuracy is believable for a demo.
2. **Context Engine (Phase 1)** — complete, 11 passing tests, supports derivation + retrieval.
3. **Demo persona system** — centralized in `src/demo/phase4-evaluation-dataset.ts`, extendable.
4. **All backend decision/choice/outcome APIs** — history endpoints exist and work.
5. **Current React + API client architecture** — no Redux/Zustand/TanStack Query migration needed.

---

## Recommended MVP Implementation Order

Once you approve, the suggested sequence is:

### Phase 0: Foundation (CRITICAL — blocks everything else)
**Effort:** ~30 minutes  
**Worker:** Direct (tiny change)

Fix CSS palette breakage. Verify by rebuilding and confirming utilities emit correctly.

---

### Phase 1: Landing Page
**Effort:** ~4-6 hours  
**Worker:** Codex

Static implementation, no backend changes. Gets the entry point right.

---

### Phase 2: Dashboard Data Layer
**Effort:** ~4-6 hours  
**Worker:** Codex

1. Add bounded range to calendar API (`start`/`end` query params, upper bound in repos)
2. Extend demo seeding: carry event `category` + `meetingLink` in `rawData`, generate a full week per persona
3. Add smart suggestions to seed data

No schema migration, no business logic changes.

---

### Phase 3: Dashboard UI
**Effort:** ~8-10 hours  
**Worker:** Codex

Implement `DashboardPage.tsx` with spec's vertical layout:
- Top bar (logo, nav, avatar)
- Header + date-range control
- Full-width weekly Gantt (7 columns, hour rows, positioned pills with badges)
- 3-card insight grid (Deadlines, Task Type, Upcoming & Suggestions)

Responsive: 3 columns desktop, 2 tablet, 1 mobile.

---

### Phase 4: Understanding Page
**Effort:** ~8-10 hours  
**Worker:** Codex

1. Overview section (4 insight cards from current context)
2. Evolution chart (seeded historical snapshots)
3. Categories breakdown (current context categories)
4. Focus Patterns chart (seeded focus sessions)

All demo data, no production analytics backend.

---

### Phase 5: Ask Future Me Conversation UX
**Effort:** ~10-14 hours (depending on your direction choice above)  
**Worker:** Codex

Transform `DecisionsPage.tsx` into conversational layout:
- User message bubble
- Future Me response (context pills inline)
- Clarification as message
- Recommendation block
- History sidebar (past decisions as threads)

**Decision pending:** presentation mapping vs true multi-turn backend.

---

## Questions for You

1. **Ask Future Me direction:** Should follow-up questions stay in one conversation thread (requires backend conversation state), or is each decision a separate "conversation" acceptable for the MVP (preserves existing Decision Engine)?

2. **Task Type card:** The spec defines it as time allocation by event category. Current event model has no category field. I recommend storing `category` + `meetingLink` in the existing `rawData` JSON field (no schema migration). Acceptable?

3. **Smart Suggestions scoring:** The spec shows a commitment score (0-100) with an explanation. No such scoring exists in the backend. For the MVP, should this be seeded suggestions with fabricated scores + short explanations, or do you want a real scoring heuristic (e.g. based on calendar fit + goal alignment)?

4. **Implementation sequence:** The order above front-loads critical UI (Landing, Dashboard) and defers Understanding until after the core decision flow. Does that match your demo priorities, or would you prefer Understanding earlier?

5. **Git workflow once implementation starts:** Should each phase land on its own branch with a PR (for review/verification), or do you prefer one long-lived feature branch with checkpoint commits?

---

## File Structure

All assessment documentation lives under `docs/refactor/`:

```
docs/refactor/
├── STATUS.md              — full findings (563 lines, evidence-backed)
└── ASSESSMENT_SUMMARY.md  — this file (executive summary + questions)
```

When implementation begins, `STATUS.md` will be updated continuously with progress, decisions, blockers, and PR links.

---

## Next Step

**I am waiting for your explicit approval to begin implementation.**

Once you approve:
1. Answer the 5 questions above (or tell me to decide where product input isn't needed)
2. Say "begin implementation" or similar
3. I will start with Phase 0 (CSS fix), verify it, push it, then proceed through the sequence

No work has started yet. The repository is in the same state you left it.
