# Future-Me Phase 4 Task Contract

## GOAL
Implement the Phase 4 Decision Journey, where deterministic structured logic acts as authoritative, the LLM explains bounded trade-offs but cannot override, missing material facts result in an explicit ASK, and remaining missing facts or conflicting evidence result in an ABSTAIN. Recommendations must be separate from the user's independent choice, preserving provenance/freshness and separation of facts/inferences/assumptions/uncertainty. This is a complete implementation contract, encompassing logic, context engine modifications, UI, and testing.

## KNOWN FACTS
- The human approved the minimal Phase 4 policy direction.
- Phase 3 context includes user-confirmed and calendar-derived evidence, while LLM proposals remain unpersisted until user validation.
- Phase 4 focuses strictly on the decision journey (the recommendation/trade-offs logic and interaction).
- Persisting user choices is reserved for Phase 6.
- **Verified Gaps**:
  - `SimpleContextEngine` currently returns broad context rather than true decision relevance.
  - `impactProfile` currently drives feasibility directly.
  - `DecisionsPage` has no covering page tests.
  - User choice persistence is deferred to Phase 6.

## UNKNOWN
- Exact implementation details to be resolved by code/tests, including how `SimpleContextEngine` relevance logic will be scoped and how the UI state will handle the `ABSTAIN` separation, before/after explanations, and the precise test strategies for UI separation.

## IMPLEMENTATION INTENT
- Produce a rigid and clear `docs/DECISION_POLICY.md` contract.
- Build the 8-step `docs/PHASE4_PROGRESS.md` completion gate tracker.
- Modify `SimpleContextEngine` to ensure relevant context filtering instead of broad inclusion.
- Implement the strict separation where deterministic logic computes feasibility and the LLM merely explains trade-offs.
- Build UI separation showing before/after explanation and clear distinction between system recommendation vs. user choice.
- Write tests to cover the `DecisionsPage` and logic components.
- Fulfill Gates 3-8: relevant context, ASK/ABSTAIN integration, UI separation, before/after explanation, tests/build/lint/browser/review.

## SCOPE
- Defining the MVP decision policy in `docs/DECISION_POLICY.md`.
- Setting up the progress tracker for the Phase 4 slice.
- Updating `SimpleContextEngine` to resolve the relevance gap.
- Extending the decision contract minimally to expose ASK/ABSTAIN while preserving existing feasibility inputs and mappings.
- Implementing UI components and separation (before/after explanation).
- Adding `DecisionsPage` tests and verifying build/lint/browser integration.

## OUT OF SCOPE
- Cloud, infrastructure, and deployment changes.
- Phase 5 intervention thresholds.
- Phase 6 user choice persistence and outcome/feedback capture.
- Complex heuristic or ML scoring logic (stick to deterministic rules).
- Autonomous actions or native push notifications.

## ACCEPTANCE CRITERIA
- `PHASE4_TASK.md` accurately describes the full implementation contract.
- `docs/DECISION_POLICY.md` is frozen and compliant with the policy.
- `docs/PHASE4_PROGRESS.md` tracking 8 equal-weight gates is established.
- `PROJECT_STATUS.md` is updated.
- Relevant context is injected (Gate 3).
- `ASK`/`ABSTAIN` rules are implemented (Gate 4).
- UI successfully separates logic/LLM and recommendation/choice (Gate 5 & 6).
- Tests, build, lint, and browser review pass for `DecisionsPage` and logic (Gate 7 & 8).

## VERIFICATION
- Unit and integration tests cover `DecisionsPage` and decision logic.
- Build and lint pass without errors.
- Browser review passes (UI checks).
- Manual verification of the output Markdown files.
- `git diff --check` to ensure no whitespace or formatting errors.

## STOP CONDITIONS
- The 4 specified artifacts (`PHASE4_TASK.md`, `docs/DECISION_POLICY.md`, `docs/PHASE4_PROGRESS.md`, `PROJECT_STATUS.md`) are successfully generated or modified for the documentation phase.
- No code, package files, tests, infra, credentials, or `.env` files are touched during this specific documentation update.
