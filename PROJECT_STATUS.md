# Project Status & Roadmap: Future Me

This document tracks the verified completion of the Future Me MVP roadmap. It separates structural scaffolding from verified behavioral capabilities. Completion criteria require passing automated tests or explicit visual proof, not just code existence.

## Status Summary
- **Last Updated:** 2026-09-22
- **Overall MVP estimate after Phase 2:** ~50%
- **Current product position:** BETWEEN Phase 2 and Phase 3 — AWS Deployment / Platform Enablement is READY FOR APPLY APPROVAL but NOT DEPLOYED; Phase 3 product implementation NOT STARTED.

| Phase / Track | Status |
|---|---|
| Phase 1 — Core Decision Logic & Foundation | COMPLETE |
| Phase 2 — Live Intelligence Loop | COMPLETE |
| AWS Deployment / Platform Enablement | READY FOR APPLY APPROVAL (NOT DEPLOYED) |
| Phase 3 | NOT STARTED |
| Phase 4 | NOT STARTED |
| Phase 5 | NOT STARTED |
| Phase 6 | NOT STARTED |
| Phase 7 | NOT STARTED |
| Phase 8 | NOT STARTED |

## Roadmap Authority / Cross-Cutting Invariants
This roadmap is governed by the following contract files:
- `docs/PRODUCT.md`
- `docs/MVP_SCOPE_UPDATED.md`
- `docs/DOMAIN_CONTRACT.md`
- `docs/USER_FLOWS.md`
- *Gap identified: `docs/DECISION_POLICY.md` must be restored/frozen.*

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
- **Status:** READY FOR APPLY APPROVAL (NOT DEPLOYED)
- **Description:** Deployment and Platform Enablement. Positioned between Phase 2 and Phase 3.
- **Goal:** Provide the approved hackathon deployment target and necessary configuration.
- **Boundary:** It is explicitly not a product phase and does not add new product capability. It never changes the product phase count or the overall ~50% completion estimate.
- **Verified planning evidence:** Separate bootstrap and application Terraform roots validate cleanly. Machine-parsed plans propose bootstrap `11 create / 0 update / 0 delete / 0 replace / 0 import` and application `21 create / 0 update / 0 delete / 0 replace / 0 import`. The application plan contains no Amplify resources. Lambda packaging is deterministic and within AWS ZIP size limits. No AWS apply/import/deploy has occurred.
- **Next approval gate:** Human approval is required before any bootstrap apply. After bootstrap, remote-state initialization/migration and the application apply require their own reviewed plan and explicit approval.
- **Exit Evidence:** Verified deployed target configuration and handoff to Phase 8; planning completion alone does not satisfy this exit.

---

## Remaining Phases

### Phase 3: Trustworthy context acquisition/population and adaptive setup
- **Status:** NOT STARTED
- **Goal:** Establish reliable initial context through explicit onboarding, calendar data, and manual updates.
- **Capability boundary:** Context extraction from calendar plans, short adaptive onboarding mini-interview, and manual user correction. Read-only calendar sync-in may be real or seeded per MVP contract. Where live calendar is used, it must include normalization, status, and connect/disconnect/failure-safe behavior. Sparse-context path for users with no calendar data.
- **Main deliverables:** Calendar integration (real or seeded), deterministic extraction, sparse-context path, short adaptive onboarding, manual correction, dashboard context surfaces.
- **Completion criteria:** System successfully extracts calendar evidence (real or seeded), allows short onboarding, supports manual correction. For decision-relevant and confirmed context evidence, it preserves source/provenance/confidence/freshness and correction history. Sparse or empty calendar must not be interpreted as free/low workload.
- **Dependencies:** Phase 2 completion.
- **Explicitly not part of this phase:** Autonomous calendar optimization, surveillance, or continuous screen monitoring.

### Phase 4: Complete the user-invoked decision journey and planning/explainability experience
- **Status:** NOT STARTED
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
- **Backend tests:** 72/72 across 11 suites PASS; global coverage 76.97% statements, 57.55% branches, 78.04% functions, 78.66% lines
- **Backend lint/typecheck/build:** PASS
- **Frontend build:** Production build PASS
- **Frontend lint:** Exits 0 with one warning: `react(set-state-in-effect)` in `frontend/src/pages/ContextPage.tsx:30`
- **Frontend tests:** No frontend test suite is currently configured.
- **Lambda package:** deterministic SHA-256 across consecutive builds; 14,667,392 bytes compressed and 39,503,005 bytes uncompressed; `dist/lambda.js` present
- **Terraform:** recursive fmt and both roots validate cleanly; bootstrap plan 11 creates and application plan 21 creates, with zero update/delete/replace/import actions

**Open Verification Debt:**
- Frontend lint still reports one non-blocking `react(set-state-in-effect)` warning, and no frontend test suite is configured.
- Infrastructure is planned but not deployed. The existing Amplify frontend remains externally managed, and frontend Cognito/JWT integration remains a later handoff; neither is evidence of a deployed end-to-end cloud flow.

---

## MVP COMPLETE Gate
The Future Me MVP will be considered complete when:
- All Phase 1-8 completion criteria are satisfied.
- One repeatable end-to-end hero flow demonstrates: load context, observation/change, clarification when material, provenance-preserving update, relevant decision support/trade-offs/recommendation/uncertainty, independent user choice, outcome and feedback, and relevant history reused later.
- D1-D9 pass.
- Demo Mode reset/replay and external-service fallbacks work.
- Required tests/builds/lints and end-to-end browser/runtime checks pass with no MVP-blocking defects.
- The approved hackathon deployment target is verified.
