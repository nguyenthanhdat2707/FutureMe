# Phase 5 Implementation Contract for Antigravity

**Task:** Implement bounded proactive context maintenance and consequential disruption (Phase 5)

---

## Context

You are implementing Phase 5 of the Future-Me MVP. This phase adds proactive intervention capabilities where the system can detect stale context or material changes and surface bounded in-app interventions to the user.

**Current State:**
- Phase 4 (decision journey) is READY_FOR_USER_TEST
- Backend: 137/137 tests passing
- Frontend: 53/53 tests passing
- Demo mode with 6 personas working
- Branch: `feat/phase5-proactive-interventions` (clean, just created)

**Existing Foundation:**
- `SimpleInterventionPolicy` class exists at `src/intelligence/simple-intervention-policy.ts` but is never called
- `IInterventionPolicy` interface is defined
- `getInterventionPolicy()` exists in service container but has zero consumers
- Context engine, decision engine, and policy evaluator are working

---

## Product Requirements

Per `docs/USER_FLOWS.md`:
1. **Flow #15 — Context Check**: Proactively ask "Are you still working on X?" when context is uncertain
2. **Flow #16 — Consequential Disruption**: Surface material changes like "Your Saturday is no longer free, this may affect your AWS workshop plan"
3. **Flow #17 — Silence**: Explicit NO-OP when nothing consequential happened

Per `docs/MVP_SCOPE_UPDATED.md`:
- Use **in-app cards/modals/popups** (NOT native notifications)
- Default: if nothing important changed → do nothing
- Intervention rules must be **deterministic** (no ML/LLM classification)

---

## Implementation Tasks

### Backend (Priority 1)

#### 1. Enhance SimpleInterventionPolicy

File: `src/intelligence/simple-intervention-policy.ts`

Add deterministic rules for:
- **Stale context detection**: Calendar event ended >1 hour ago without observation confirmation
- **Consequential disruptions**:
  - Free calendar slot now has conflict
  - Deadline proximity increased (was 5+ days, now <3 days)
  - Workload materially increased
  - Important commitment changed/moved

Rules should check `context.calendarEvents`, `context.commitments`, `context.recentDecisions` and return appropriate `InterventionDecision` objects.

#### 2. Create Intervention API Route

File: `src/routes/interventions.ts` (new)

```typescript
GET /api/interventions/check
- Input: userId (from auth)
- Logic: 
  1. Get current context
  2. Get state estimate
  3. Call interventionPolicy.shouldIntervene()
  4. Return intervention decisions
- Output: { interventions: InterventionDecision[], hasInterventions: boolean }

POST /api/interventions/respond
- Input: { interventionId: string, response: 'yes' | 'no' | 'dismiss' }
- Logic: Update context based on response type
- Output: { success: boolean }
```

Wire into `src/routes/index.ts`.

#### 3. Add Intervention Types to Domain

File: `src/domain/types.ts`

Ensure `InterventionDecision` supports these intervention types:
- `CONTEXT_CHECK`
- `CONSEQUENTIAL_DISRUPTION`
- `NONE`

Add fields if missing:
- `interventionId: string` (for tracking responses)
- `interventionType: 'CONTEXT_CHECK' | 'CONSEQUENTIAL_DISRUPTION' | 'NONE'`
- `prompt: string` (user-facing question)
- `suggestedActions: string[]` (action buttons)

#### 4. Backend Tests

Create `src/__tests__/interventions.test.ts`:
- Staleness detection logic
- Disruption detection rules
- API endpoint responses for different scenarios
- NO-OP behavior when nothing changed

Target: maintain ~77-78% coverage.

### Frontend (Priority 2)

#### 1. InterventionCard Component

File: `frontend/src/components/InterventionCard.tsx` (new)

Props:
```typescript
{
  intervention: InterventionDecision;
  onRespond: (response: string) => void;
  onDismiss: () => void;
}
```

Render:
- Modal or card overlay
- Show `intervention.prompt`
- Render action buttons from `intervention.suggestedActions`
- Handle user clicks → call `onRespond` or `onDismiss`

#### 2. Intervention Polling Hook

File: `frontend/src/hooks/useInterventions.ts` (new)

```typescript
useInterventions(userId: string)
- Fetch /api/interventions/check on mount
- Return { interventions, loading, checkInterventions }
- Provide method to respond to interventions
```

#### 3. Integration Points

Update these files to check interventions:
- `frontend/src/pages/HomePage.tsx` — check on load
- After calendar sync (in calendar page)
- After decision evaluation (in decisions page)

Display `<InterventionCard>` when interventions exist.

#### 4. Frontend Tests

Create `frontend/src/components/__tests__/InterventionCard.test.tsx`:
- Component renders intervention prompt
- Action buttons work
- Dismiss works
- API calls triggered correctly

---

## Technical Constraints

1. **Deterministic Only**: No LLM calls for intervention classification. Rules based on timestamps, counts, boolean flags.
2. **In-App Only**: No native notifications, no push, no websockets (polling is acceptable).
3. **Explicit NO-OP**: When no intervention needed, `shouldIntervene` must return `{ shouldIntervene: false, interventionType: 'NONE' }`.
4. **Maintain Test Coverage**: Backend ~77-78%, frontend existing levels.
5. **No Breaking Changes**: Don't modify Phase 4 logic or existing routes.

---

## Scope Boundaries

### ✅ In Scope
- Wire SimpleInterventionPolicy into runtime
- Deterministic staleness/disruption detection
- Intervention API endpoints
- In-app InterventionCard component
- User response handling
- Tests for all new logic

### ❌ Out of Scope
- Native OS notifications
- Push notification infrastructure
- ML/JITAI algorithms
- Autonomous actions
- Choice persistence (that's Phase 6)
- Real-time websockets
- Continuous surveillance
- Training/learning

---

## Acceptance Criteria

1. Backend can detect stale context (event ended >1h ago, no observation)
2. Backend can detect disruptions (calendar conflict, deadline pressure)
3. GET `/api/interventions/check` returns interventions with prompts
4. POST `/api/interventions/respond` updates context
5. Frontend displays InterventionCard when interventions exist
6. User can respond (Yes/No/Dismiss)
7. Responses trigger context updates
8. System returns NO-OP when nothing consequential
9. All intervention rules are deterministic
10. Backend tests pass (137+ tests, ~77-78% coverage maintained)
11. Frontend tests pass (53+ tests)
12. Lint passes (backend and frontend)
13. `npm run build` passes (backend and frontend)
14. `git diff --check` passes

---

## Demo Proof Requirements

After implementation, manually verify:
1. Load a demo persona
2. Trigger staleness condition (e.g., persona with event that ended >1h ago)
3. InterventionCard appears with appropriate prompt
4. Click response button
5. Context updates
6. Intervention dismissed
7. Refresh page with no new staleness → NO-OP (no card shown)

---

## Files to Read First

Before starting implementation, read:
1. `PHASE5_TASK.md` — full phase specification
2. `docs/USER_FLOWS.md` — flows #15, #16, #17
3. `docs/MVP_SCOPE_UPDATED.md` — sections 3.5, 4.3, 5.3
4. `src/intelligence/simple-intervention-policy.ts` — existing policy
5. `src/intelligence/interfaces.ts` — IInterventionPolicy interface
6. `src/domain/types.ts` — InterventionDecision type
7. `src/routes/decisions.ts` — example of decision API route structure
8. `frontend/src/pages/DecisionsPage.tsx` — example of decision UI integration

---

## Implementation Order

1. **Backend first** (can test with curl/Postman):
   - Enhance SimpleInterventionPolicy rules
   - Add domain types if needed
   - Create intervention routes
   - Write backend tests
   - Verify with `npm test` and `npm run lint`

2. **Frontend second**:
   - Create InterventionCard component
   - Create useInterventions hook
   - Integrate into HomePage
   - Write frontend tests
   - Verify with `npm test` and `npm run lint`

3. **Integration proof**:
   - Start backend and frontend
   - Load demo persona
   - Trigger intervention condition
   - Verify card appears and responds correctly

---

## Stop Conditions

If you encounter any of these, STOP and report to supervisor:
1. Policy threshold ambiguity (when exactly is context "stale"?)
2. Intervention types don't match USER_FLOWS spec
3. Demo data insufficient to trigger interventions
4. Test failures you cannot resolve after 2 attempts
5. Breaking changes to Phase 4 functionality
6. Uncertainty about UI placement or modal behavior

---

## Success Definition

Phase 5 is complete when:
- All acceptance criteria pass
- All tests pass (backend 137+, frontend 53+)
- Lint and build pass
- Browser proof demonstrates staleness detection → intervention card → response → context update
- NO-OP case proven (no intervention when nothing changed)
- Code committed and pushed to `feat/phase5-proactive-interventions`
- `PHASE5_TASK.md` progress checklist updated

---

## Notes

- Keep intervention rules simple and deterministic for MVP
- In-app cards only; no native notifications
- Silence/NO-OP is a valid and important system behavior
- This phase does NOT include choice persistence (Phase 6)
- All changes stay on `feat/phase5-proactive-interventions` branch
