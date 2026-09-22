# Decision Policy MVP (Phase 4 Contract)

## Overview
This document represents the frozen MVP policy contract for Future-Me decision recommendations. It enforces a strict boundary between deterministic structured logic and LLM-generated explanations. The LLM cannot override logic; it merely explains bounded trade-offs.

## Evidence Classes & Precedence
Evidence is strictly prioritized to preserve provenance and history. Source authority is prioritized as follows:
1. **Relevant Fresh USER_CONFIRMED Evidence:** The highest authority. Old user input does not automatically win over newer contextual evidence.
2. **Planned Structured Evidence (e.g., Calendar):** Represents intent, but is *never* proof of behavior.
3. **System Observations:** Remain as observations, not absolute truth.
4. **System/LLM Inference:** The lowest authority.

### Conflict Handling
- Resolve conflicts by relevance, source authority, and freshness.
- If a material conflict is not safely resolvable by these criteria, the system MUST pause and ASK the user.
- If missing facts or conflicts remain unresolved after asking, the system MUST ABSTAIN.

## Minimum Material Input
For any deterministic recommendation, the minimum required input is:
- **Time cost** PLUS either **available hours before deadline** OR a **deadline**, consistent with existing feasibility logic.
- **Workload** may be absent only as a clearly displayed assumption and clarification request under existing behavior.
- **Energy and Goal Relevance** are strictly optional.
- The system MUST NOT require explicit user preferences for every decision.

## Deterministic Recommendation Statuses
The decision engine must preserve existing deterministic behavior exactly and output one of the following statuses mapping to the underlying feasibility logic:
- **RECOMMEND proceed (feasible):** All material facts are present, evidence aligns, and the deterministic logic passes feasibility thresholds.
- **RECOMMEND proceed-with-caution (at-risk):** Feasibility thresholds show risk; risks must be made explicit.
- **RECOMMEND do-not-proceed (not-feasible):** Feasibility logic shows it is infeasible.
- **ASK (needs-info):** Material facts are missing or stale. The system requests clarification.
- **ABSTAIN:** A separate outcome reserved *only* for materially conflicting, invalid, or unresolved evidence where deterministic assessment cannot safely select a recommendation. This includes unresolved material facts after an ASK. ABSTAIN must NEVER be mapped from at-risk or not-feasible.

## LLM Boundary & Confidence Semantics
- **Confidence Definition:** Confidence is defined explicitly as input completeness and trustworthiness, *not* the probability of success or correctness.
- **LLM Boundary:** The LLM may generate validated trade-off explanations. However, the LLM CANNOT classify feasibility, recommendation status, confidence, facts, or persistence.
- **Separation of Concerns:** The LLM must explicitly separate facts, inferences, assumptions, and uncertainties in its output. It must never present an inference as a confirmed fact.

## Recommendation vs. User Choice
- The system provides a **recommendation** (or asks/abstains) based on this policy.
- The user makes the final independent **choice**.
- These two concepts are completely decoupled. The system's recommendation is a non-binding input to the user's ultimate choice. Persisting that choice is reserved for Phase 6.

## Non-Goals (Explicitly Out of Scope)
- Inventing complex confidence scores beyond the existing deterministic feasibility behavior.
- Autonomous action based on recommendations.
- Phase 5 intervention thresholds (disruptions/notifications).

## Policy Versioning
- Version: 1.0 (Frozen MVP)
- Updates to this policy require explicit human approval and version bumping.
