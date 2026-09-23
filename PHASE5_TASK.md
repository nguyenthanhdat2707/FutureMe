# Phase 5: Bounded Proactive Context Maintenance and Consequential Disruption

**Status:** IMPLEMENTING  
**Branch:** `feat/phase5-proactive-interventions`  
**Worker:** Antigravity (Gemini model)  
**Started:** 2026-09-23

---

## Goal

Implement proactive context maintenance and consequential disruption to enable the system to detect stale context, material changes, and surface bounded in-app interventions when necessary.

---

## Product Requirement

Per `PROJECT_STATUS.md` Phase 5:
- **Capability boundary:** Approved deterministic/basic intervention policy, returning refresh, bounded in-app Needs Your Input/disruption cards.
- **Main deliverables:** Basic intervention rules, returning refresh logic, in-app disruption cards, explicit silence/NO-OP behavior.
- **Completion criteria:** Approved deterministic/basic rules trigger bounded in-app clarification/disruption or NO-OP. Explicit silence is valid and remains the behavior when no consequential change occurs.

Per `docs/USER_FLOWS.md`:
- Flow #15: Context Check (proactive clarification when context is uncertain)
- Flow #16: Consequential Disruption (surface material changes affecting commitments)
- Flow #17: Silence / No-Action (explicit NO-OP when nothing consequential occurred)

Per `docs/MVP_SCOPE_UPDATED.md`:
- MVP proactive surface should use **in-app card/popup/modal/Needs Your Input**
- Native/browser notifications are optional and deferred
- Default behavior: If nothing important changed → do nothing

---

## Known Facts

- `SimpleInterventionPolicy` class exists at `src/intelligence/simple-intervention-policy.ts` but has zero runtime consumers
- Interface `IInterventionPolicy` defines `shouldIntervene(state: StateEstimate, context: PersonalContext): Promise<InterventionDecision>`
- Phase 4 decision journey is READY_FOR_USER_TEST with complete context retrieval and policy evaluation
- Demo mode with 6 deterministic personas is implemented and tested
- Current backend: 137/137 tests pass; frontend: 53/53 tests pass
- Branch `feat/phase4-demo-personas` contains latest working state

---

## Implementation Plan

### Backend Tasks

1. **Staleness Detection Logic**
   - Implement in `SimpleContextEngine` or new `ContextStalenessDetector`
   - Detect: calendar event ended without observation confirmation, important context too old, planned activity vs. actual mismatch
   - Return staleness indicators with context metadata

2. **Disruption Detection**
   - Enhance `SimpleInterventionPolicy` with disruption rules:
     - Calendar conflicts (free time now occupied)
     - Deadline pressure increase
     - Capacity decrease
     - Important commitment changes
   - All rules deterministic (no LLM classification)

3. **Intervention Types**
   - `CONTEXT_CHECK`: "Are you still working on X?" (Flow #15)
   - `CONSEQUENTIAL_DISRUPTION`: "Your Saturday is no longer free, this may affect..." (Flow #16)
   - `NONE`: Explicit silence/NO-OP (Flow #17)

4. **Intervention API**
   - Create `/api/interventions/check` endpoint
   - Input: userId
   - Output: `{ interventions: InterventionDecision[], hasInterventions: boolean }`
   - Wire `getInterventionPolicy()` into route handler

5. **Context Update from Intervention Response**
   - Create `/api/interventions/respond` endpoint
   - Handle user responses: Yes/No/Dismiss/Skip
   - Update context based on response type

### Frontend Tasks

1. **InterventionCard Component**
   - Display intervention prompt and reason
   - Show action buttons (Yes/No/Dismiss based on intervention type)
   - Handle user response and call backend API
   - Modal/card UI aligned with existing design

2. **Polling/Check Mechanism**
   - Check interventions on app load
   - Check after context updates (calendar sync, observations)
   - Polling acceptable (no websockets required for MVP)

3. **Integration Points**
   - HomePage: check on load
   - After calendar sync completion
   - After decision evaluation
   - After context corrections

### Testing Requirements

- Unit tests: staleness detection logic, disruption rules, intervention policy decisions
- Integration tests: `/api/interventions/check` returns correct interventions for test scenarios
- Frontend tests: InterventionCard component renders and handles actions
- Browser proof: trigger staleness/disruption, see card, respond, verify context update
- Maintain coverage levels (backend ~77-78%, frontend existing coverage)

---

## Scope Boundaries

### In Scope
- Deterministic intervention rules
- In-app disruption cards/modals
- Context staleness detection
- Consequential disruption detection
- User response flow
- Explicit NO-OP behavior

### Out of Scope
- Native OS notifications
- Push notifications
- Advanced ML/JITAI algorithms
- Autonomous actions
- Choice persistence (Phase 6)
- Real-time websockets
- Training or learning
- Continuous screen surveillance

---

## Acceptance Criteria

1. ✅ System detects stale context (calendar event ended without confirmation)
2. ✅ System detects consequential disruptions (calendar conflicts, deadline pressure)
3. ✅ `/api/interventions/check` returns intervention decisions with prompts
4. ✅ Frontend displays in-app disruption cards
5. ✅ User can respond to interventions (Yes/No/Dismiss)
6. ✅ Responses update context appropriately
7. ✅ System explicitly returns NO-OP when nothing consequential occurred
8. ✅ All intervention rules are deterministic
9. ✅ Demo personas trigger appropriate interventions based on seeded data
10. ✅ Backend tests pass with coverage maintained
11. ✅ Frontend tests and lint pass
12. ✅ No new warnings/errors

---

## Stop Conditions

- Policy thresholds unclear → escalate for human decision
- Intervention types don't match USER_FLOWS → clarify requirement
- Demo data insufficient to trigger interventions → may need seed data adjustments
- Uncertainty about UI placement or behavior → confirm with user

---

## Progress Tracking

Updates will be recorded here as implementation proceeds:

- [ ] Task contract written and approved
- [ ] Antigravity worker started
- [ ] Backend: staleness detection implemented
- [ ] Backend: disruption detection implemented
- [ ] Backend: intervention API created
- [ ] Backend: tests written and passing
- [ ] Frontend: InterventionCard component created
- [ ] Frontend: polling mechanism implemented
- [ ] Frontend: tests written and passing
- [ ] Browser proof completed
- [ ] Independent review
- [ ] Committed and pushed
- [ ] Phase 5 READY_FOR_USER_TEST

---

## References

- `PROJECT_STATUS.md` — Phase 5 definition
- `docs/USER_FLOWS.md` — Flows #15, #16, #17
- `docs/MVP_SCOPE_UPDATED.md` — Section 3.5 (Context Check), 4.3 (Uncertainty), 5.3 (JITAI deferred)
- `docs/DECISION_POLICY.md` — Policy framework (intervention thresholds explicitly deferred to Phase 5)
- `src/intelligence/simple-intervention-policy.ts` — Existing implementation
- `src/intelligence/interfaces.ts` — IInterventionPolicy interface
