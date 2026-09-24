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

## Phase 5 — Intervention Policy

**Status:** Approved and active as of Phase 5 implementation.

### When to Evaluate Intervention

Evaluate intervention **event-driven** after:
- Calendar sync or calendar change
- Manual context update
- Goal/deadline/workload update
- App open/resume (catch-up evaluation)

**Do NOT** use periodic polling.

### Materiality Rule

**A context change alone is NOT sufficient to trigger intervention.**

A change becomes intervention-worthy only if it **materially affects an active decision**.

An **active decision** is a persisted decision that:
- Has already been evaluated for the user
- Is not completed/resolved/expired
- Can still be affected by current context

Treat a change as **material** when it causes at least one of:
- `RECOMMEND / ASK / ABSTAIN` outcome changes
- Feasibility changes between `feasible / at-risk / not-feasible / needs-info`
- Evidence conflict or missing evidence makes the current decision unreliable
- Confidence meaningfully decreases
- Usable capacity changes by at least **30 minutes OR 25%** of relevant remaining capacity

**Core Invariant:**
> A context change is not itself an intervention trigger. It becomes intervention-worthy only when it materially changes an active decision, its confidence, or the user's ability to execute it.

If context changes but no active decision is materially affected: **NO_OP**.

### Staleness Policy

Different context types have different temporal meaning:

- **Calendar event outcome:** If an event ended but expected outcome/observation is unavailable, allow **30-minute grace period**. After that, mark evidence as stale/uncertain if the result matters to a decision.
- **Energy/current-state/workload observations:** Treat as stale after **24 hours**.
- **Calendar availability:** Do not use fixed TTL; derive from current calendar state.
- **Stable/static context:** Do not expire automatically unless conflicting newer evidence exists.

### Dismiss and Burden Policy

Rules:
- Maximum **1 active proactive intervention** at a time.
- When user dismisses an intervention for a specific issue: suppress same issue for **4 hours**.
- Cooldown may be bypassed only when:
  - Severity materially increases, OR
  - New evidence changes the decision/outcome

Do not repeatedly ask the same unresolved question without new material evidence.

### Conflicting Evidence

**Do not silently overwrite conflicting evidence.**

If two sources conflict:

**If conflict affects the current decision:**
- Return/surface `NEEDS_INPUT` or clarification equivalent
- Ask the smallest useful clarification

**If conflict does NOT affect the decision:**
- Keep both pieces of evidence with provenance
- Return **NO_OP**

Do not automatically decide one source wins based solely on generic authority hierarchy.

### Intervention Assignment

Do NOT use simplistic state-only rules (e.g., `UNCERTAIN → SUGGESTION`).

Consider: impact, urgency, confidence, interruption_cost, decision consequence.

Conceptual ordering:
```
if no_material_change:
    NO_OP

elif conflicting_or_missing_evidence
     and current_decision_depends_on_it:
    NEEDS_INPUT

elif impact == HIGH
     and urgency == HIGH
     and confidence >= 0.8:
    SUGGESTION

elif impact in [MEDIUM, HIGH]
     and confidence >= 0.6
     and interruption_cost != HIGH:
    AMBIENT

else:
    NO_OP
```

### Proactive Surface

**In-app intervention only.**

Do NOT implement:
- Browser notifications
- Email notifications
- Mobile push notifications
- External notification delivery

### Receptivity

Do NOT infer sophisticated receptivity in MVP.

For MVP:
- Being inside the app is sufficient for intervention to be displayable
- `interruption_cost` may suppress or downgrade an intervention
- It must never justify more aggressive interruption

### Intervention State Persistence

Track intervention state in persistent storage (DynamoDB):
- Each intervention has deterministic `issue_key` based on decision + intervention_type + affected_context
- Track: `issue_key`, `decision_id`, `status`, `created_at`, `dismissed_at`, `last_material_change_at`
- Cooldown calculated from `dismissed_at`
- Same underlying problem maps to same `issue_key` (not bypassed by new events)

### Phase 5 Architecture Flow

```
Context Event
    ↓
Affected Decision Lookup
    ↓
Existing Decision Engine (re-evaluate)
    ↓
Old vs New Evaluation Comparison
    ↓
Materiality Check
    ↓
Intervention Policy
    ↓
NO_OP / AMBIENT / SUGGESTION / NEEDS_INPUT
    ↓
Persist Intervention State
```

Decision feasibility calculations remain in the decision engine, not intervention policy.

## Non-Goals (Explicitly Out of Scope)
- Inventing complex confidence scores beyond the existing deterministic feasibility behavior.
- Autonomous action based on recommendations.
- Periodic polling for interventions.
- External notification infrastructure.
- Evaluating hypothetical/potential decisions not yet persisted.

## Policy Versioning
- Version: 1.0 (Frozen MVP for Phase 4)
- Version: 2.0 (Phase 5 intervention semantics approved and active)
- Updates to this policy require explicit human approval and version bumping.
