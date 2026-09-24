# Future Me — Architecture Audit Report

**Date:** September 24, 2026  
**Version:** 1.0  
**Scope:** Frontend architectural analysis before UI/UX specification implementation

---

## Executive Summary

This audit analyzes the existing Future Me React application before implementing four new UI/UX specifications (Landing Page, Dashboard, Understanding Page, Ask Future Me). The codebase is a working MVP with authentication, decision support, context management, and calendar integration. **The primary finding: the current architecture is simple and sufficient for the existing scope. Major architectural patterns are NOT needed yet — the specifications require primarily UI changes, not structural rewrites.**

### Key Findings

1. **Technology Stack is Modern and Appropriate**
   - React 19.2.8 + TypeScript 6.0.2 + Vite 8.3.0
   - Tailwind CSS 4.3.3 with semantic tokens
   - React Router 6.28.0 for navigation
   - Amazon Cognito for authentication
   - **No state management library, no data fetching library, no charting library**

2. **Current Architecture is Lean by Design**
   - Four main pages: HomePage, ContextPage, DecisionsPage, CalendarPage
   - Three-column AppShell layout (left context, center content, right calendar)
   - Direct API calls via fetch wrapper
   - Local component state with `useState`
   - No complex state machines or containers

3. **Gap Analysis: UI Changes vs Architectural Changes**
   - **Landing Page spec requires NEW page** (currently no public landing)
   - **Dashboard spec requires RENAMED HomePage + calendar grid component**
   - **Understanding Page spec requires RENAMED ContextPage + 2 charts**
   - **Ask Future Me spec maps to DecisionsPage + layout adjustments**

4. **What Does NOT Need to Change**
   - API integration layer (`api/client.ts`)
   - Authentication flow (`AuthProvider`, `RequireAuth`)
   - Domain types (`types/domain.ts`)
   - Business logic (decision engine, context derivation)
   - AppShell three-column layout (already matches specs)

---

## 1. Current Architecture Overview

### 1.1 Directory Structure

```
frontend/
├── src/
│   ├── api/
│   │   └── client.ts              # API wrapper (decisionsApi, contextApi, calendarApi)
│   ├── auth/
│   │   ├── AuthProvider.tsx       # Cognito authentication context
│   │   └── RequireAuth.tsx        # Protected route wrapper
│   ├── components/
│   │   ├── demo/
│   │   │   └── DemoPersonaSelector.tsx
│   │   ├── layout/
│   │   │   ├── AppShell.tsx       # 3-column layout
│   │   │   ├── LeftSidebar.tsx    # Personal context anchors
│   │   │   └── RightSidebar.tsx   # Calendar timeline
│   │   └── InterventionCard.tsx   # Proactive intervention UI
│   ├── config/
│   │   └── demo-personas.ts       # Demo mode configuration
│   ├── hooks/
│   │   └── useInterventions.ts    # Proactive interventions hook
│   ├── pages/
│   │   ├── HomePage.tsx           # Setup + current context summary
│   │   ├── ContextPage.tsx        # What Future Me Understands
│   │   ├── DecisionsPage.tsx      # Ask Future Me / Decision support
│   │   ├── CalendarPage.tsx       # Calendar management
│   │   ├── AuthPage.tsx           # Login/signup
│   │   └── DemoPage.tsx           # Demo persona selection
│   ├── types/
│   │   └── domain.ts              # TypeScript domain models
│   ├── App.tsx                    # Router configuration
│   └── main.tsx                   # Application entry point
├── tailwind.config.js             # Design system tokens
└── package.json
```

### 1.2 Routing Structure

**Current Routes** (from `App.tsx:16-25`):
```
/auth                  → AuthPage (public)
/                      → HomePage (protected, default after login)
/context               → ContextPage (protected)
/decisions             → DecisionsPage (protected)
/calendar              → CalendarPage (protected)
/demo                  → DemoPage (demo mode only)
```

**Gap:** No public landing page. The root route requires authentication.

### 1.3 Data Flow

```
User Action
    ↓
Component (useState)
    ↓
api/client.ts (fetch wrapper)
    ↓
AWS API Gateway + Lambda
    ↓
DynamoDB / Calendar API
    ↓
Response updates component state
    ↓
UI re-renders
```

**No global state manager.** Each page independently loads and manages its data. Shared state (auth) lives in React Context (`AuthProvider`).

---

## 2. Component Dependency Analysis

### 2.1 HomePage (Current "Dashboard")

**File:** `frontend/src/pages/HomePage.tsx` (242 lines)

**Responsibilities:**
- **First-time setup flow:** Collect priorities, deadlines, tracking preferences
- **Context summary:** Show active goals, commitments, calendar sync status
- **Proactive interventions:** Display and respond to AI suggestions

**State:**
- `context: PersonalContext | null` — loaded from `/api/context/current`
- `setupAnswers: SetupAnswers` — form state for initial setup
- `loading, error, submitting` — UI state flags
- `intervention` — from `useInterventions()` hook

**Dependencies:**
- `api.context.getCurrent()` → fetch current context
- `api.context.setup(answers)` → save initial setup
- `InterventionCard` component
- `useInterventions` hook

**Data Flow:**
```
useEffect → loadContext() → api.context.getCurrent()
                          ↓
                   setContext(data)
                          ↓
         Conditional render: setupCompleted?
              ↓                    ↓
         Setup Form          Context Summary
```

**UI Structure (when setup completed):**
- Header: greeting + last sync time
- Goals section: list of active goals with priority badges
- Commitments section: upcoming commitments
- Calendar sync status card
- Intervention card (if present)

**Gap vs Dashboard Spec:**
- ✅ Already has goals + commitments display
- ❌ Missing weekly Gantt calendar
- ❌ Missing three-card insight grid (Deadlines, Task Type, Upcoming)
- ❌ Missing date-range control

### 2.2 ContextPage (Current "What Future Me Understands")

**File:** `frontend/src/pages/ContextPage.tsx` (525 lines)

**Responsibilities:**
- Display all personal context AI has learned
- Show observation sources and confidence levels
- Allow user confirmation and correction of inferred attributes
- Render goals, commitments, preferences, decisions with edit/confirm actions

**State:**
- `context: PersonalContext | null`
- `editingItem: { type, id, value } | null`
- `actionInProgress: string | null` — track which item is being saved

**API Calls:**
- `api.context.getCurrent()` → fetch all context
- `api.context.confirm(attributeId)` → confirm an inferred attribute
- `api.context.correct({ attributeId, correctedValue, reason })` → user correction

**UI Structure:**
- Header + sync status
- Goals section (expandable list with priority, status, source badges)
- Commitments section (expandable list with deadline, source badges)
- Preferences section (expandable list with value, source badges)
- Decisions section (recent decisions with feasibility outcomes)

**Key Business Logic:**
- `getSourceBadge(source, confidence)` — render visual indicator for observation source
- `isInferred(source)` — determine if attribute needs confirmation
- Inline editing with save/cancel
- Color-coded badges: USER_CONFIRMED (green), SYSTEM_INFERRED (purple), etc.

**Gap vs Understanding Spec:**
- ✅ Already has all four context types (Goals, Commitments, Preferences, Decisions)
- ❌ Missing Understanding Evolution line chart (4 series over time)
- ❌ Missing Context by Category bar chart
- ❌ Missing AI insight card ("What Future Me Learned")
- ❌ Missing Focus Patterns streamgraph
- ❌ Missing three KPI summary cards at top

### 2.3 DecisionsPage (Current "Ask Future Me")

**File:** `frontend/src/pages/DecisionsPage.tsx` (1,038 lines)

**Responsibilities:**
- Decision support form (question, target, deadline, constraints)
- Feasibility assessment from backend decision engine
- Clarification flow when backend needs more context
- Context observation submission (workload increase, disruption, etc.)
- Display decision reasoning, personal state, and recommendations
- Choice recording and outcome history

**State:**
- `form: DemoForm` — decision request form fields
- `result: DecisionApiResponse | null` — feasibility assessment result
- `beforeResult: DecisionApiResponse | null` — "before observation" baseline
- `clarificationAnswers: Record<string, string>` — user responses to clarifications
- `observationForm: ObservationForm` — context update form
- `intervention` — proactive intervention from hook

**API Calls:**
- `decisionsApi.requestDecision(payload)` → get feasibility assessment
- `decisionsApi.answerClarification(answerPayload)` → provide missing context
- `contextApi.reportObservation(observation)` → update personal context with new information

**Key Business Logic:**
- Form validation and submission
- Clarification loop (backend asks for missing fields, user provides, re-submit)
- Observation submission triggers context refresh
- Feasibility color coding: `feasible` (green), `at-risk` (amber), `not-feasible` (red)
- Personal state badges: `FLOW`, `UNCERTAIN`, `DRIFTING`, `DISRUPTED`, `OVERLOADED`
- Session storage persistence for form state

**UI Structure:**
- Decision form (question + constraints)
- Clarification panel (if backend needs more info)
- Result card with feasibility verdict, reasoning, personal state
- "Report Context Change" button → observation form
- Before/after comparison when observation submitted
- Intervention card

**Gap vs Ask Future Me Spec:**
- ✅ Already has main chat/decision area (center)
- ✅ Already has left sidebar (from AppShell)
- ✅ Already has right calendar sidebar (from AppShell)
- ❌ Missing explicit conversation history in left sidebar
- ❌ Missing relevant context card display
- ❌ Form layout needs refinement (currently demo-focused with all fields exposed)

### 2.4 CalendarPage

**File:** `frontend/src/pages/CalendarPage.tsx` (not fully read, but structure known from imports)

**Responsibilities:**
- Display calendar events
- Calendar sync status
- Event management (RSVP, approval)

**Gap:** Not covered by the four UI/UX specifications. Likely subsumed into Dashboard's weekly Gantt calendar.

---

## 3. Design System Analysis

### 3.1 Tailwind Configuration

**File:** `frontend/tailwind.config.js` (62 lines)

**Custom Tokens Defined:**
```javascript
colors: {
  background: '#FBF9F6',           // Warm page background
  surface: '#FFFFFF',              // Card background
  'text-primary': '#2D3748',
  'text-secondary': '#718096',
  
  // Semantic accent colors
  'accent-anchor': '#3182CE',      // Trust blue (commitments)
  'accent-intention': '#319795',   // Calm teal (flexible intentions)
  'accent-ai': '#7C3AED',          // Violet (AI suggestions)
  'accent-warning': '#D97706',     // Amber (warnings, NOT red)
  'accent-rest': '#10B981',        // Green (recovery time)
  
  // Slate palette for depth
  slate: { 50-900 }
}

spacing: {
  'sidebar-left': '20%',
  'sidebar-right': '32%',
  'center': '48%',
}

maxWidth: {
  'sidebar-left': '280px',
  'sidebar-right': '400px',
}
```

**Design System Alignment:**
- ✅ Semantic color naming matches Future Me domain language
- ✅ Three-column spacing tokens match AppShell layout
- ✅ Warm, calm palette aligns with Experience Principles in specs

### 3.2 Design System Issues Found

**Evidence from Session Audit (message 8668, 8671):**

1. **Dead color utilities in production CSS:**
   ```bash
   # Clean build confirmation:
   grep -o "\\.(bg|text|border)-(green|rose|sky|violet|amber|red|slate)-[0-9]\\{2,3\\}" dist/assets/*.css
   # Result: (none above = confirmed dead)
   ```
   - Tailwind 4.3.3 is NOT generating standard palette utilities (`bg-red-500`, `text-green-600`, etc.)
   - Code uses these classes but they don't exist in production CSS
   - Causes: classes may render invisible or fall back to browser defaults

2. **Undefined semantic tokens used in code:**
   ```
   bg-surface-card          in-built-css:0  (not defined, not generated)
   border-surface-border    in-built-css:0  (not defined, not generated)
   bg-surface-hover         in-built-css:0  (not defined, not generated)
   ```
   - Code in `ContextPage.tsx:229-235` uses `bg-opacity-10` (removed in Tailwind v4)
   - Priority badges reference undefined tokens

3. **Dead file:**
   ```bash
   grep -rn "App.css" src index.html
   # Result: NOT IMPORTED (dead file)
   ```
   - `App.css` exists but is never imported

**Impact:**
- Some UI elements may have broken styling (invisible backgrounds, missing borders)
- Priority badges likely have contrast issues
- Must audit and fix before implementing new specs

**Recommended Fix:**
- Extend `tailwind.config.js` with missing semantic tokens
- Replace Tailwind v4-incompatible classes (`bg-opacity-*` → `bg-*/10`)
- Audit all `bg-`, `text-`, `border-` classes against production CSS
- Remove or import `App.css`

---

## 4. Existing Design Patterns

### 4.1 Patterns Currently Implemented

**✅ Component Composition**
- `AppShell` composes `LeftSidebar`, `Outlet`, `RightSidebar`
- `InterventionCard` is reusable across pages
- Sidebars are layout components, not domain logic

**✅ Custom Hook Pattern**
- `useInterventions()` encapsulates intervention polling and response logic
- Clean separation: hook manages state/API, component handles rendering

**✅ Protected Route Pattern**
- `RequireAuth` wrapper checks authentication before rendering children
- Redirects to `/auth` if not authenticated

**✅ API Client Adapter**
- `api/client.ts` provides typed wrappers over fetch
- Environment-based URL configuration
- Error handling abstraction

**✅ Demo Mode via Feature Flag**
- `isDemoMode` conditional logic
- `DEMO_PERSONA_CHANGED_EVENT` for persona switching
- Clean separation from production auth flow

### 4.2 Patterns NOT Implemented (and why they're not needed yet)

**❌ Feature-Based Architecture**
- Current: pages organized by route
- Not needed: only 4 main pages, no feature overlap
- Threshold: consider when > 8-10 pages or shared feature modules emerge

**❌ Container/Presentational Split**
- Current: pages handle both data fetching and rendering
- Not needed: pages are simple, no shared presentation logic
- Threshold: consider when multiple pages render the same data differently

**❌ State Management Library (Redux/Zustand)**
- Current: local `useState` + `AuthProvider` context
- Not needed: no shared state between pages, no complex derived state
- Threshold: consider when 3+ pages need the same data or derive complex views

**❌ Data Fetching Library (TanStack Query/SWR)**
- Current: manual fetch + `useEffect`
- Not needed: simple CRUD, no caching requirements, no optimistic updates
- Threshold: consider when implementing real-time sync or offline support

**❌ State Machine (XState)**
- Current: boolean flags (`loading`, `submitting`, `actionInProgress`)
- Not needed: no complex multi-step flows, clarification loop is simple
- Threshold: consider if decision flow becomes multi-stage wizard with branching

---

## 5. UI/UX Specification Gap Analysis

### 5.1 Landing Page (NEW)

**Specification:** Public marketing page, hero section, value proposition, CTA

**Current State:** No public landing page exists. Root `/` requires authentication.

**Required Changes:**
- ✅ **SAFE:** Create new `LandingPage.tsx` component
- ✅ **SAFE:** Update `App.tsx` routes:
  ```
  /              → LandingPage (public)
  /dashboard     → HomePage renamed to DashboardPage (protected, new default)
  ```
- ✅ **SAFE:** Add hero section, feature cards, testimonials (pure UI)
- ⚠️ **MEDIUM RISK:** Update authentication redirect logic (login → `/dashboard` not `/`)

**No business logic changes.** Purely additive.

### 5.2 Dashboard Page (RENAME + ENHANCE HomePage)

**Specification:** Weekly Gantt calendar, three insight cards, dashboard header, date-range control

**Current State:** `HomePage` shows context summary + setup flow

**Required Changes:**

| Component | Current | Spec | Change Type |
|-----------|---------|------|-------------|
| Route | `/` | `/dashboard` | SAFE: rename route |
| Setup flow | In HomePage | Keep as-is or move to modal | SAFE: UI refactor |
| Weekly calendar | None | Gantt grid with event pills | NEW: component |
| Insight cards | None | Deadlines, Task Type, Upcoming | NEW: components |
| Date range | None | Week selector with range display | NEW: component |

**New Components Needed:**
- `WeeklyGanttCalendar.tsx` — 7-day grid with time slots and event pills
- `DeadlineInsightCard.tsx` — upcoming deadlines card
- `TaskTypeInsightCard.tsx` — task distribution card
- `UpcomingSuggestionsCard.tsx` — AI suggestions card
- `DateRangeControl.tsx` — week navigation

**API Requirements:**
- `api.calendar.getEventsInRange(startDate, endDate)` — fetch events for date range
- `api.context.getDeadlines(range)` — deadlines for insight card
- No new backend endpoints needed if calendar API already supports date filtering

**Risks:**
- ⚠️ **MEDIUM RISK:** No charting library installed (no d3, recharts, chart.js)
- ⚠️ **MEDIUM RISK:** No date utility library (no date-fns, dayjs, luxon)
- ✅ **SAFE:** Gantt can be pure CSS grid + positioned divs (no chart lib needed)

### 5.3 Understanding Page (RENAME + ENHANCE ContextPage)

**Specification:** Line chart (Understanding Evolution), bar chart (Context by Category), streamgraph (Focus Patterns), KPI cards

**Current State:** `ContextPage` shows lists of goals/commitments/preferences/decisions

**Required Changes:**

| Component | Current | Spec | Change Type |
|-----------|---------|------|-------------|
| Route | `/context` | `/understanding` | SAFE: rename route |
| KPI cards | None | Active Goals, Commitments, Preferences counts | NEW: simple cards |
| Line chart | None | 4-series time series (Goals, Commitments, Preferences, Decisions) | NEW: chart component |
| Bar chart | None | 4-bar horizontal (current counts by category) | NEW: chart component |
| AI insight | None | "What Future Me Learned" text card | NEW: component |
| Streamgraph | None | Focus Patterns layered area chart | NEW: chart component |
| Context lists | Exists | Keep expandable sections | SAFE: preserve existing |

**New Components Needed:**
- `UnderstandingEvolutionChart.tsx` — multi-series line chart
- `ContextByCategoryChart.tsx` — horizontal bar chart
- `AIInsightCard.tsx` — text-based insight card
- `FocusPatternsChart.tsx` — streamgraph (conditional render if data exists)

**API Requirements:**
- `api.context.getHistoricalSnapshot(range)` — time-series data for line chart
- `api.context.getFocusSessions(range)` — focus session data for streamgraph
- **NEW BACKEND ENDPOINTS NEEDED** (context evolution tracking not implemented yet)

**Risks:**
- 🔴 **HIGH RISK:** No charting library installed
- 🔴 **HIGH RISK:** Backend may not track historical context snapshots
- ⚠️ **MEDIUM RISK:** Streamgraph rendering complexity (consider D3 or Recharts)

**Recommendation:**
- Install lightweight charting library: **Recharts** (React-native, simpler than D3)
- Verify backend supports historical context queries before starting
- Implement empty state for Focus Patterns if no session data exists (per spec)

### 5.4 Ask Future Me Page (ENHANCE DecisionsPage)

**Specification:** 3-column layout (left history, center chat, right calendar), conversation history, relevant context cards

**Current State:** `DecisionsPage` has decision form + result display, already inside 3-column `AppShell`

**Required Changes:**

| Component | Current | Spec | Change Type |
|-----------|---------|------|-------------|
| Layout | Already 3-column (AppShell) | Same | ✅ NO CHANGE |
| Left sidebar | Generic context anchors | Decision history / conversation threads | ENHANCE: update LeftSidebar with page-aware content |
| Center area | Decision form + result | Chat-style conversation UI | REFACTOR: UI styling |
| Right sidebar | Generic calendar | Same | ✅ NO CHANGE |
| Context cards | None | Relevant context display | NEW: component |
| Input composer | Form fields | Chat input box | REFACTOR: UI styling |

**Structural Changes:**
- Convert form-based UI to chat-based UI (visual only, same API)
- Add conversation history rendering in center area
- Update `LeftSidebar` to show decision threads when on `/ask` route

**API Requirements:**
- `api.decisions.getHistory(userId)` — fetch past decisions for left sidebar
- `api.decisions.getConversation(decisionId)` — fetch full conversation thread
- Likely already exists (backend has decision history per Phase 6 STATUS)

**Risks:**
- ✅ **SAFE:** No new business logic, purely UI refactor
- ⚠️ **MEDIUM RISK:** Left sidebar currently static, needs page-aware routing logic

---

## 6. Architectural Recommendations

### 6.1 What NOT to Change

**Preserve these as-is:**

1. **API Layer (`api/client.ts`)**
   - Current wrapper is simple and sufficient
   - No complex caching or retry logic needed
   - Avoid introducing TanStack Query unless caching becomes a real problem

2. **Authentication Flow**
   - `AuthProvider` + `RequireAuth` pattern works well
   - Cognito integration is stable
   - Demo mode separation is clean

3. **Domain Types (`types/domain.ts`)**
   - Strongly typed interfaces for all domain entities
   - Backend contracts are stable (per Phase 6 completion)
   - Do NOT modify types during UI refactor

4. **Business Logic**
   - Decision engine reasoning (backend)
   - Context derivation (backend)
   - Calendar integration (backend)
   - Clarification flow logic (backend)

5. **AppShell Three-Column Layout**
   - Already matches all four specs
   - Responsive breakpoints are appropriate
   - Sidebar sizing tokens are well-defined

### 6.2 Recommended Changes (Minimal)

**Priority 1: Design System Fixes (BLOCKING)**

Before implementing any spec:

1. Fix Tailwind configuration to generate palette utilities
2. Define missing semantic tokens: `surface-card`, `surface-border`, `surface-hover`
3. Replace Tailwind v4-incompatible classes (`bg-opacity-*` → `bg-*/10`)
4. Audit all color classes against production CSS
5. Add missing tokens to `tailwind.config.js`:
   ```javascript
   'surface-card': '#FFFFFF',
   'surface-border': '#E2E8F0',
   'surface-hover': '#F7FAFC',
   ```

**Priority 2: Install Charting Library**

For Dashboard + Understanding Page:

```bash
npm install recharts
npm install --save-dev @types/recharts
```

Why Recharts:
- React-native, declarative API
- Supports line, bar, area charts out of box
- Smaller bundle than D3
- Good TypeScript support

**Priority 3: Component Extraction**

Extract reusable UI components from pages:

- `SourceBadge.tsx` (from ContextPage line 87-107)
- `PriorityBadge.tsx` (from ContextPage line 229-235)
- `FeasibilityBadge.tsx` (from DecisionsPage line 76-87)
- `PersonalStateBadge.tsx` (from DecisionsPage line 90-99)

**Priority 4: Sidebar Routing Logic**

Make sidebars page-aware:

```typescript
// LeftSidebar.tsx
const location = useLocation();

if (location.pathname === '/ask') {
  return <DecisionHistorySidebar />;
}
return <ContextAnchorsSidebar />;
```

### 6.3 Patterns to Introduce (ONLY IF NEEDED)

**Introduce AFTER hitting threshold:**

| Pattern | Threshold | Current State | Recommendation |
|---------|-----------|---------------|----------------|
| Feature-based architecture | 8+ pages with shared modules | 4 pages | ❌ NOT YET |
| State management library | 3+ pages sharing state | Auth only | ❌ NOT YET |
| Data fetching library | Real-time sync or offline | Simple CRUD | ❌ NOT YET |
| Container/Presentational split | Multiple views of same data | One view per entity | ❌ NOT YET |
| Component library (Shadcn/Radix) | 20+ shared components | ~5 components | ⚠️ CONSIDER for charts/inputs |
| State machine | Multi-stage wizards | Simple boolean flags | ❌ NOT YET |

**Recommended Addition (LOW RISK):**

Install **Radix UI primitives** for accessible UI components:
```bash
npm install @radix-ui/react-dialog @radix-ui/react-dropdown-menu @radix-ui/react-tabs
```

Why:
- Spec requires modals, dropdowns, tabs
- Radix provides accessible, unstyled primitives
- Smaller than full component library
- Works with existing Tailwind styles

---

## 7. Incremental Refactoring Plan

### Phase 1: Foundation (Week 1)

**Goal:** Fix design system, install dependencies, no user-facing changes

- [ ] Fix Tailwind configuration (add missing tokens, verify production CSS)
- [ ] Install Recharts + Radix UI primitives
- [ ] Extract badge components (`SourceBadge`, `PriorityBadge`, etc.)
- [ ] Write Storybook stories or component tests for badges
- [ ] Run full build + test suite, ensure no regressions

**Verification:**
```bash
npm run build
npm run test
# Verify all bg-*, text-*, border-* classes render in dist/assets/*.css
```

### Phase 2: Landing Page (Week 1-2)

**Goal:** Add public landing page, update routing

- [ ] Create `LandingPage.tsx` (hero, features, CTA)
- [ ] Update `App.tsx` routes (`/` → LandingPage, `/dashboard` → DashboardPage)
- [ ] Update authentication redirect (login → `/dashboard`)
- [ ] Test public access + authenticated redirect
- [ ] Deploy to staging

**Verification:**
- Public user can view `/` without auth
- Authenticated user redirected to `/dashboard`
- Login redirects to `/dashboard`

### Phase 3: Dashboard Page (Week 2-3)

**Goal:** Rename HomePage, add weekly calendar + insight cards

- [ ] Rename `HomePage.tsx` → `DashboardPage.tsx`
- [ ] Update route `/` → `/dashboard`
- [ ] Build `WeeklyGanttCalendar` component (CSS grid + event pills)
- [ ] Build three insight cards (Deadlines, Task Type, Upcoming)
- [ ] Add `DateRangeControl` component
- [ ] Integrate calendar API (`getEventsInRange`)
- [ ] Test date range changes update all sections
- [ ] Responsive testing (desktop, tablet, mobile)

**Verification:**
- Calendar displays events for selected week
- Changing date range updates calendar + insight cards
- Existing setup flow still works
- All tests pass

### Phase 4: Understanding Page (Week 3-4)

**Goal:** Rename ContextPage, add charts

**PREREQUISITE:** Verify backend supports historical context queries

- [ ] Confirm API endpoints exist: `getHistoricalSnapshot`, `getFocusSessions`
- [ ] If not, coordinate with backend team (DO NOT PROCEED WITHOUT API)
- [ ] Rename `ContextPage.tsx` → `UnderstandingPage.tsx`
- [ ] Update route `/context` → `/understanding`
- [ ] Add three KPI cards at top
- [ ] Build `UnderstandingEvolutionChart` (Recharts LineChart)
- [ ] Build `ContextByCategoryChart` (Recharts BarChart)
- [ ] Build `AIInsightCard` (text component)
- [ ] Build `FocusPatternsChart` (Recharts AreaChart with empty state)
- [ ] Preserve existing context lists below charts
- [ ] Test with real historical data
- [ ] Test empty states (no data, loading, error)

**Verification:**
- Charts render with real data
- Empty states render correctly
- Existing context lists still functional
- User can still confirm/edit attributes

### Phase 5: Ask Future Me Page (Week 4-5)

**Goal:** Refactor DecisionsPage to chat UI

- [ ] Add decision history API integration
- [ ] Update `LeftSidebar` to show decision threads when on `/ask`
- [ ] Refactor center area from form to chat-style conversation
- [ ] Add conversation history rendering
- [ ] Add relevant context cards display
- [ ] Convert input fields to chat composer
- [ ] Preserve clarification flow logic (no business logic changes)
- [ ] Test full decision flow end-to-end
- [ ] Test conversation history loading

**Verification:**
- Decision flow works identically to before (same API, same logic)
- Conversation history displays correctly
- Left sidebar shows decision threads
- Clarification flow still functional

### Phase 6: Polish (Week 5-6)

**Goal:** Responsive refinements, accessibility, testing

- [ ] Responsive testing all pages (320px - 1920px)
- [ ] Keyboard navigation testing
- [ ] Screen reader testing (ARIA labels, semantic HTML)
- [ ] Loading states consistency
- [ ] Error states consistency
- [ ] Empty states consistency
- [ ] Animation/transition polish
- [ ] Cross-browser testing (Chrome, Firefox, Safari)
- [ ] Performance audit (Lighthouse)
- [ ] Final integration testing

**Verification:**
- All pages responsive on mobile/tablet/desktop
- Keyboard navigation works throughout
- No accessibility violations (axe DevTools)
- Lighthouse score > 90 (performance, accessibility, best practices)

---

## 8. Risk Assessment

### 8.1 Low Risk (Safe to proceed)

- ✅ Landing page creation (pure additive)
- ✅ Route renaming (`/context` → `/understanding`)
- ✅ Component extraction (badges, cards)
- ✅ CSS/styling changes (design system tokens)
- ✅ UI layout refactors (form → chat UI)

### 8.2 Medium Risk (Verify first)

- ⚠️ Calendar API date range filtering (verify API supports this)
- ⚠️ Sidebar routing logic (may affect all pages)
- ⚠️ Charting library bundle size (audit production build size)
- ⚠️ Authentication redirect changes (test all auth flows)

### 8.3 High Risk (Requires backend coordination)

- 🔴 Historical context queries (backend may not support time-series)
- 🔴 Focus session tracking (backend may not store this data)
- 🔴 API contract changes (avoid at all costs during frontend refactor)

**Mitigation:**
- Confirm all required backend endpoints exist BEFORE starting Phase 4
- If endpoints missing, implement frontend with mock data + feature flag
- Coordinate backend implementation as separate workstream

---

## 9. Testing Strategy

### 9.1 Existing Test Coverage

**Current test files found:**
- `HomePage.test.tsx`
- `ContextPage.test.tsx`
- `DecisionsPage.test.tsx`
- `CalendarPage.test.tsx`
- `AuthPage.test.tsx`
- `DemoPage.test.tsx`
- `InterventionCard.test.tsx`

**Test framework:** Vitest + React Testing Library

### 9.2 Testing Requirements for Refactor

**Component Tests (NEW):**
- [ ] `WeeklyGanttCalendar.test.tsx` — event rendering, date range changes
- [ ] `UnderstandingEvolutionChart.test.tsx` — chart data rendering, empty states
- [ ] `ContextByCategoryChart.test.tsx` — bar chart rendering
- [ ] `FocusPatternsChart.test.tsx` — streamgraph rendering, empty state
- [ ] Badge components (reusable, test once)

**Integration Tests (UPDATE EXISTING):**
- [ ] Update `HomePage.test.tsx` → `DashboardPage.test.tsx` (route change)
- [ ] Update `ContextPage.test.tsx` → `UnderstandingPage.test.tsx` (route change)
- [ ] Update `DecisionsPage.test.tsx` (chat UI refactor, preserve API behavior)

**Regression Tests:**
- [ ] Authentication flow (login, logout, protected routes)
- [ ] Decision flow end-to-end (request → clarification → response)
- [ ] Context confirmation flow (inferred → confirmed)
- [ ] Demo mode persona switching

**Manual Testing Checklist:**
- [ ] Responsive design (mobile, tablet, desktop)
- [ ] Cross-browser (Chrome, Firefox, Safari)
- [ ] Keyboard navigation
- [ ] Screen reader testing
- [ ] Loading/error/empty states

---

## 10. Conclusion

### 10.1 Key Takeaways

1. **Current architecture is appropriate for scale.** Four pages with simple data flows do not need Redux, feature-based architecture, or complex state machines.

2. **UI/UX specs require mostly additive changes.** New components, not structural rewrites. Business logic remains untouched.

3. **Design system needs immediate attention.** Broken Tailwind configuration is blocking issue. Fix before starting spec implementation.

4. **Charting library is only external dependency needed.** Recharts recommended for line/bar/area charts.

5. **Backend coordination is critical for Understanding Page.** Historical context queries may not exist. Verify API before starting Phase 4.

6. **Incremental delivery is feasible.** Five-phase plan allows delivery of Landing → Dashboard → Understanding → Ask Future Me in sequence, with each phase independently testable and deployable.

### 10.2 Recommended Next Steps

1. **Immediate (This Week):**
   - Fix Tailwind configuration
   - Install Recharts + Radix UI
   - Extract badge components
   - Verify production CSS

2. **Backend Coordination (This Week):**
   - Confirm existence of `api.context.getHistoricalSnapshot(range)`
   - Confirm existence of `api.context.getFocusSessions(range)`
   - If missing, prioritize backend implementation or plan mock data strategy

3. **Implementation Start (Week 1):**
   - Begin Landing Page (Phase 2)
   - Parallel: Design system fixes (Phase 1)

4. **Regular Checkpoints:**
   - End of each phase: build + test + deploy to staging
   - Weekly: cross-browser testing
   - Bi-weekly: accessibility audit

### 10.3 Success Criteria

**Architecture Audit Complete When:**
- ✅ Current implementation documented with file paths and line numbers
- ✅ Design patterns identified (existing + missing)
- ✅ UI/UX specification gaps analyzed
- ✅ Incremental refactoring plan defined
- ✅ Risk assessment completed
- ✅ Testing strategy outlined

**Refactoring Complete When:**
- All four UI/UX specifications implemented
- All existing tests passing
- New component tests written
- Responsive design verified on all breakpoints
- Accessibility audit passing
- Production build size within budget
- No business logic changes
- No API contract changes

---

**Audit Completed:** September 24, 2026  
**Next Review:** After Phase 2 (Landing Page) completion
