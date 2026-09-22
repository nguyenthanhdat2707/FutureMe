# Project Status & Roadmap: Future Me

This document tracks the verified completion of the Future Me MVP roadmap. It separates structural scaffolding from verified behavioral capabilities. Completion criteria require passing automated tests or explicit visual proof, not just code existence.

## Status Summary
- **Last Updated:** 2026-09-22
- **Overall MVP estimate:** Phases 1-3 are COMPLETE; Phases 4-8 remain.
- **Current product position:** AWS backend DEPLOYED AND VERIFIED; frontend Cognito/JWT prerequisite READY_FOR_USER_TEST; Phase 3 context acquisition is merged, verified, and accepted.

| Phase / Track | Status |
|---|---|
| Phase 1 — Core Decision Logic & Foundation | COMPLETE |
| Phase 2 — Live Intelligence Loop | COMPLETE |
| AWS Deployment / Platform Enablement | DEPLOYED AND VERIFIED |
| Phase 3 | COMPLETE |
| Phase 4 | IMPLEMENTING |
| Phase 5 | NOT STARTED |
| Phase 6 | NOT STARTED |
| Phase 7 | NOT STARTED |
| Phase 8 | NOT STARTED |

## Current Execution / Next Prioritized Work
- **Current State:** IMPLEMENTING
- **Completed AWS Evidence:** Backend AWS deployment applied and verified (no-drift); Health returns 200; Bedrock Haiku smoke invocation returned ok (11 input/4 output tokens). AWS Marketplace note: CloudTrail showed no aws-marketplace Subscribe or Marketplace event; Cost Explorer currently shows estimated `$0.00` (caveat: billing may lag).
- **Current Task:** Gate 7 Full Gates / Review
- **Next Steps:** Complete end-to-end integration and verification of the decision loop against the MVP policy contract. Run full automated test coverage for frontend and backend.
- **Blocked/Decision Status:** None currently. The human approved the minimal Phase 4 policy direction; `docs/DECISION_POLICY.md` is recorded. Authenticated browser readback requires Product Owner sign-in. Google Calendar credentials/OAuth were intentionally not changed; any remaining provider-specific calendar sync failure is a separate owner handoff.

## Roadmap Authority / Cross-Cutting Invariants
This roadmap is governed by the following contract files:
- `docs/PRODUCT.md`
- `docs/MVP_SCOPE_UPDATED.md`
- `docs/DOMAIN_CONTRACT.md`
- `docs/USER_FLOWS.md`
- `docs/DECISION_POLICY.md` (restored/frozen active authority)

The following cross-cutting invariants apply to all phases:
- Calendar is plan evidence, never proof of actual behavior.
- Absence of calendar data is not free capacity or low workload.
- Clarification (ASK) or abstention is required over making unsupported assumptions.
- Corrections must preserve old evidence and history.
- Confirmed, decision-relevant context must retain its source, provenance, confidence, and freshness.
- Deterministic, structured logic owns authoritative outcomes where evidence is sufficient.
- LLM output remains unpersisted proposal/hypothesis until explicitly validated by the user.
- Recommendation, user choice, outcome, and feedback remain completely distinct concepts.
- Silence / NO-OP is a valid system behavior.

## Global Deferred / Non-Goals
The following are explicitly deferred or non-goals for this MVP:
- RAG, semantic, or vector retrieval.
- Multi-agent product architecture.
- Custom ML, model training, fine-tuning, or RL.
- Advanced forecasting models.
- Continuous surveillance or screen monitoring.
- Autonomous calendar optimization, write-back, or autonomous actions.
- Cross-device or universal memory.
- Unrelated scope expansion.

## Phase 1 — Core Decision Logic & Foundation
- **Status:** COMPLETE
- **Historical evidence:** Frontend foundation under `frontend/`; root backend/SQLite/domain/repository/adapter/interface foundation; deterministic feasibility and decision support; observation/context/decision flow and user-visible before/after/provenance foundation.
- **Explicit completion criteria satisfied:** The core deterministic decision logic and foundation are implemented and serve as the product baseline, describing actual decision foundation rather than merely scaffolding for future capabilities.

## Phase 2 — Live Intelligence Loop
- **Status:** COMPLETE
- **Historical evidence:** `BedrockLLMProvider` implementation with `MockLLMProvider` fallback, bounded LLM context analyst, `/api/context/analyze` returning non-persisted proposals, and `/api/context/clarify` validating and persisting user-confirmed answers with provenance.
- **Explicit completion criteria satisfied:** Full loop exercised: observation → analyze → clarify → persist (USER_CONFIRMED) → decision. A meaningful observation can change the assessment, and missing information produces clarification rather than unsupported assumptions. The same decision can be evaluated before and after a context change. LLM output operates strictly as a proposal/hypothesis until validated by the user.

---

## AWS Deployment / Platform Enablement
- **Status:** DEPLOYED AND VERIFIED
- **Description:** Deployment and Platform Enablement. Positioned between Phase 2 and Phase 3.
- **Goal:** Provide the approved hackathon deployment target and necessary configuration.
- **Boundary:** It is explicitly not a product phase and does not add new product capability. It never changes the product phase count or the overall ~50% completion estimate.
- **Verified deployment evidence:** The approved bootstrap plan was applied to AWS account `728033416182`: `11 added / 0 changed / 0 destroyed`. Readback confirms the state bucket is private, versioned, AES256-encrypted, lifecycle-managed, and protected by TLS-only/public-access controls. GitHub OIDC trust is exactly scoped, the plan role remains scoped, and the apply role has operator-approved AdministratorAccess. GitHub Actions apply run https://github.com/nguyenthanhdat2707/FutureMe/actions/runs/35689166339 completed SUCCESS at main commit 599a97c37214ecf9e32eb811183002a44b997c74. The application stack is deployed. Post-deploy refreshed Terraform plan shows no changes (no-drift).
- **Verified application-plan evidence:** The application plan was successfully applied (`9 create / 12 no-op / 0 update / 0 delete / 0 replace` after a one-time state reconciliation of 8 successfully-created resources from an earlier failed run).
- **Exit Evidence:** Verified deployed target configuration and handoff to Phase 8; API health check at https://f5efnl82m5.execute-api.ap-southeast-1.amazonaws.com/api/health returns 200 with database=dynamodb.

---

## Remaining Phases

### Phase 3: Trustworthy context acquisition/population and adaptive setup
- **Status:** COMPLETE
- **Goal:** Establish reliable initial context through explicit onboarding, calendar data, and manual updates.
- **Capability boundary:** Context extraction from calendar plans, short adaptive onboarding mini-interview, and manual user correction. Read-only calendar sync-in may be real or seeded per MVP contract. Where live calendar is used, it must include normalization, status, and connect/disconnect/failure-safe behavior. Sparse-context path for users with no calendar data.
- **Main deliverables:** Calendar integration (real or seeded), deterministic extraction, sparse-context path, short adaptive onboarding, manual correction, dashboard context surfaces.
- **Completion criteria:** System successfully extracts calendar evidence (real or seeded), allows short onboarding, supports manual correction. For decision-relevant and confirmed context evidence, it preserves source/provenance/confidence/freshness and correction history. Sparse or empty calendar must not be interpreted as free/low workload.
- **Dependencies:** Phase 2 completion.
- **Explicitly not part of this phase:** Autonomous calendar optimization, surveillance, or continuous screen monitoring.

### Phase 4: Complete the user-invoked decision journey and planning/explainability experience
- **Status:** IMPLEMENTING
- **Goal:** Deliver a complete, explainable decision support experience based on current user context.
- **Capability boundary:** Decision-scoped relevant context retrieval, minimum material clarification, transparent options/trade-offs, and separation of system recommendation from final user choice.
- **Main deliverables:** Decision-scoped relevant context assembly, minimum material clarification, options/trade-offs generation, clear boundary between recommendation vs choice separation, separation of facts/inferences/assumptions/uncertainty/confidence, and same-decision before/after explanation UI.
- **Completion criteria:** System provides relevant context, options, and trade-offs for a decision. It explicitly requires ASK/ABSTAIN when material evidence is missing. It uses deterministic authority for structured evidence and ensures LLM proposals are validated before use. It maintains a complete user-visible separation of facts, inference, assumptions, trade-offs, uncertainty/confidence, and recommendation. Record choice remains Phase 6.
- **Dependencies:** Phase 3 context acquisition, restored/frozen `DECISION_POLICY.md` for exact recommendation/abstention rules.
- **Explicitly not part of this phase:** Autonomous planning, autonomous action execution, RAG, or semantic/vector retrieval.

### Phase 5: Bounded proactive context maintenance and consequential disruption
- **Status:** NOT STARTED
- **Goal:** Proactively maintain context validity without unnecessary interruption.
- **Capability boundary:** Approved deterministic/basic intervention policy, returning refresh, bounded in-app Needs Your Input/disruption cards.
- **Main deliverables:** Basic intervention rules, returning refresh logic, in-app disruption cards, explicit silence/NO-OP behavior.
- **Completion criteria:** Approved deterministic/basic rules trigger bounded in-app clarification/disruption or NO-OP. Explicit silence is valid and remains the behavior when no consequential change occurs.
- **Dependencies:** Phase 4 decision journey, restored/frozen `DECISION_POLICY.md` for intervention thresholds/rules.
- **Explicitly not part of this phase:** Native notifications, advanced JITAI, autonomous action, or custom ML/model training.

### Phase 6: User choice, outcomes, feedback, and reusable history
- **Status:** NOT STARTED
- **Goal:** Capture actual user decisions and real-world outcomes to provide relevant history for future decisions.
- **Capability boundary:** Choice is separate from recommendation; outcome is separate from feedback. Future decision retrieval uses relevant stored history.
- **Main deliverables:** Recent decision/history surfaces, choice persistence flow, outcome and feedback capture flows, historical context retrieval.
- **Completion criteria:** MVP learning is exactly defined as storing outcome/feedback plus retrieving relevant history later; history must not silently change weights/policy. User can persist a final choice separate from recommendation, and an outcome separate from feedback. The system reuses this relevant history in future related decisions.
- **Dependencies:** Phase 4 and 5.
- **Explicitly not part of this phase:** Automatic policy learning, model training, or fine-tuning.

### Phase 7: Deterministic Demo Mode, reset/replay, and recoverable fallbacks
- **Status:** NOT STARTED
- **Goal:** Ensure reliable product demonstration and graceful degradation.
- **Capability boundary:** Seeded hero scenario, reliable state reset, fallback paths for external services (calendar/OAuth/LLM), insufficient-context abstention.
- **Main deliverables:** Seeded hero scenario covering the whole loop, reliable reset mechanism, continue without calendar/try demo paths, insufficient-context abstention ("I don't know enough yet").
- **Completion criteria:** A deterministic seeded hero scenario must cover the initial decision, reality change, material clarification, changed reasoning, independent choice, outcome/feedback, later history reuse, and exact reset/replay. Calendar/OAuth/LLM failures must offer recoverable continue-without-calendar / Try Demo / validated mock or abstain paths.
- **Dependencies:** Phase 6.
- **Explicitly not part of this phase:** Hardcoded demo rules leaking into core product logic.

### Phase 8: Final integration, contract verification, approved hackathon deployment readiness, and demo polish
- **Status:** NOT STARTED
- **Goal:** Verify end-to-end correctness, resolve open debt, and prepare for approved hackathon deployment target.
- **Capability boundary:** Verification against requirements, resolution of verification debt, and final deployment handoff. It adds no new capability.
- **Main deliverables:** End-to-end browser/runtime proof, D1-D9 and Definition of Done verification, builds/tests/lints resolution, docs/demo checklist, and deployment/config handoff from infra track.
- **Completion criteria:** D1-D9 and the MVP Definition of Done loop are evidenced end-to-end; backend tests/build/lint, frontend build/lint and appropriate frontend/end-to-end checks pass; browser/runtime hero-flow verification and demo checklist pass; no MVP-blocking defects remain; approved hackathon deployment target is verified.
- **Dependencies:** Phase 7, Infra Track.
- **Explicitly not part of this phase:** Multi-agent product architecture, unrelated expansion, or any new product capability.

---

## Verification State & Open Debt

**Verified Results (2026-09-22):**
- **Phase 4 contract-unit delivery:** Commit 2f34416defe54914940c0a43ea318d4250b86810 pushed and local/remote SHA matched. Gate 3 delivered: commit a8c2d8811580cfb8e0471d2574a6ac0ad859e6c1 was pushed and local/remote SHA matched. Gate 4 delivered: pure and integration evaluator/engine logic for clarification/abstention passing tests. Gate 4 is functionally verified and COMPLETE. Gate 5 is COMPLETE (commit b5f1971a723fb4d072021c843be716842d76e9d4 pushed, local/remote SHA matched exactly). Gate 5 tested explicit UI behaviors for RECOMMEND, ASK, ABSTAIN, strict clarification allowlists, and tradeoff isolation cleanly via TDD. 2026-09-23 Gate 6 supervisor verification: Gate 6 is COMPLETE (focused DecisionsPage 9/9; focused backend before/after 1/1; full frontend 37/37 across 8 files; full backend 116/116 across 18 suites; backend coverage 78.03% statements / 60.95% branches / 78.27% functions / 79.5% lines; frontend lint pass with exactly three pre-existing react(set-state-in-effect) warnings in CalendarPage, HomePage, ContextPage; frontend build pass; backend lint pass; backend build pass; git diff --check pass; scratch artifacts absent). Delivered evidence: commit 10fb9c634f1cb83caddd71c08d0243f9a1d345cb was pushed and local/remote SHA matched. Progress 6/8 = 75%; 2 steps left.
- **Phase 3 delivery:** PR [#15](https://github.com/nguyenthanhdat2707/FutureMe/pull/15) merged into `main` at `d01b848f083ac274bfad82619831c30044912cb4`; post-merge CI run [35710887996](https://github.com/nguyenthanhdat2707/FutureMe/actions/runs/35710887996) passed Lint, Unit Tests, and Build & Scan. Local and `origin/main` were verified at the same SHA.
- **Production fetch hotfix:** Root cause was confirmed on Home, What Future Me Understands, and Calendar: the Amplify branch had no frontend API/Cognito build variables, so the production bundle requested `http://localhost:3001/api`. Amplify branch variables were set from verified Terraform outputs without changing Google Calendar credentials. Focused client tests 9/9, quiet lint, and production build pass. PR [#16](https://github.com/nguyenthanhdat2707/FutureMe/pull/16) merged at `8b15b2f0680c265dc30bc68181122555b37202f5`; main CI run [35714575158](https://github.com/nguyenthanhdat2707/FutureMe/actions/runs/35714575158) and Amplify release job 12 succeeded. Final browser readback reaches Cognito sign-in with zero localhost requests. Authenticated page readback remains for the Product Owner sign-in smoke.
- **Backend tests (Phase 3):** Context API and Context Engine implemented. Tests added for setup <=4 answers, calendar sparse representation, calendar sync marker generation and retrieval, deterministic overlapping calendar interval union, populating correctly typed calendar commitments, typed evidence metadata (observedAt/validUntil) mapping, deterministic entity tie-breaking, and confirm/correct splitting where confirmation appends USER_CONFIRMED while retaining original rows, and correction properly merges JSON shapes. All 10 tests across 3 Phase 3 suites PASS.
- **Backend tests (Overall):** 87/87 tests across 13 suites PASS.
- **Backend lint/typecheck/build:** Build PASS. Lint PASS with 0 errors/warnings.
- **Frontend build:** Production build PASS
- **Frontend lint/build:** Both exit 0; lint reports 3 nonblocking `react(set-state-in-effect)` warnings in the Phase 3 pages.
- **Frontend tests:** 25/25 tests across 7 frontend test files PASS.
- **Browser smoke evidence:** Local onboarding persisted two exact `USER_CONFIRMED` answers; seeded calendar sync displayed three events; context showed provenance/observation/validity and never represented sparse data as free capacity. Existing Cognito route-protection smoke remains verified; full external signup/signin still requires identity provisioning.
- **Independent review:** Codex found one blocking preference-correction payload defect; Antigravity repaired it and the 25-test frontend suite, lint, and build passed afterward. No unresolved Phase 3 blocking finding remains.
- **Lambda package:** deterministic SHA-256 across consecutive builds; 14,667,392 bytes compressed and 39,503,005 bytes uncompressed; `dist/lambda.js` present
- **Terraform:** recursive fmt and both roots validate cleanly; bootstrap plan 11 creates and application plan 21 creates, with zero update/delete/replace/import actions

**Open Verification Debt:**
- Frontend lint `react(set-state-in-effect)` warnings in Phase 3 pages were fixed (Gate 7 warning cleanup). Exact verified results: three prior react(set-state-in-effect) warnings repaired in CalendarPage, HomePage, ContextPage; independent supervisor execution focused 13/13 across 3 files, full frontend 37/37 across 8 files, lint zero warnings/errors, frontend production build pass, git diff --check pass, no untracked artifacts. Independent read-only Claude Opus review found no blocking findings and assessed initial loading/error/reload/unmount/StrictMode behavior preserved. State is currently local/uncommitted/unpushed.
- The AWS backend infrastructure is deployed and no-drift. Frontend Cognito/JWT integration prerequisite unit testing is complete, marked READY_FOR_USER_TEST after supervisor verification. Full browser end-to-end auth flow depends on external identity provisioning/deployment.

---

## MVP COMPLETE Gate
The Future Me MVP will be considered complete when:
- All Phase 1-8 completion criteria are satisfied.
- One repeatable end-to-end hero flow demonstrates: load context, observation/change, clarification when material, provenance-preserving update, relevant decision support/trade-offs/recommendation/uncertainty, independent user choice, outcome and feedback, and relevant history reused later.
- D1-D9 pass.
- Demo Mode reset/replay and external-service fallbacks work.
- Required tests/builds/lints and end-to-end browser/runtime checks pass with no MVP-blocking defects.
- The approved hackathon deployment target is verified.### Phase 4: User-Invoked Decision Journey
- **Status:** IN PROGRESS
- **Goal:** Provide decision support directly responding to user prompts and context changes, bounded by a strict logic policy.
- **Capability boundary:** Context querying, policy-gated decisions (Ask/Recommend/Abstain), before/after explainability UI, non-binding guidance boundary.
- **Main deliverables:** Evaluator logic returning policy metadata and deterministic status, tested UI rendering exact abstention reasons or required clarifications without hallucinating English questions, non-binding boundary disclaimer, explicit trade-off rendering, and before/after outcome tracking.
- **Completion criteria:** An MVP policy is frozen; evaluator separates logic from generation; system explicitly abstains from unanswerable requests or clearly states what inputs are missing; UI implements tested explicit states (RECOMMEND, ASK, ABSTAIN) without parsing English; decision rendering separates confirmed facts/derived context/assumptions/uncertainty/tradeoffs.
- **Dependencies:** Phase 3.
- **Explicitly not part of this phase:** Choice persistence (Phase 6), push interventions (Phase 5), training.
