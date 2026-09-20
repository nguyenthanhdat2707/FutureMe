# Future Me — Domain Contract

> Status: Draft  
> Purpose: Define the core domain concepts and invariants that every Future Me component must agree on.

---

## 1. Domain Principle

Future Me maintains a continuously updated model of the user in order to support future decisions.

The system must distinguish between:

- what was **planned**
- what was **observed**
- what the system **believes**
- what the user **confirmed**
- what is **predicted**
- what eventually **happened**

An inference must never silently become a fact.

---

# 2. Core Domain Objects

Future Me has eight primary domain objects:

```text
PersonalContext
PersonalState
Observation
Forecast
Decision
Intervention
Outcome
Feedback
```

Their relationship is approximately:

```text
                 ┌───────────────┐
                 │ PersonalContext│
                 └───────┬───────┘
                         │
Observation ────────→ PersonalState
     │                   │
     │                   ↓
     └──────────────→ Forecast
                         │
                         ↓
                      Decision
                         │
                         ↓
                   Intervention
                         │
                         ↓
                      Outcome
                         │
                         ↓
                      Feedback
                         │
                         └────→ PersonalContext
```

This is not a strict execution pipeline.

Objects may exist independently.

---

# 3. PersonalContext

`PersonalContext` is the accumulated knowledge Future Me currently has about the user.

It is **not** equivalent to the user's current state.

Examples:

```text
Goals
Commitments
Preferences
Constraints
Calendar
Deadlines
Historical behavior
Past decisions
Past outcomes
Known routines
Relevant relationships
Energy / focus patterns
```

Example:

```yaml
goal:
  description: "Finish hackathon MVP"
  deadline: "2026-09-25T23:59"
  priority: high

commitment:
  description: "University class"
  time: "Monday 08:00-11:00"

preference:
  description: "Avoid low-value workshops during deadline weeks"
```

## Context Evidence

Important context SHOULD carry provenance.

```yaml
source:
confidence:
observed_at:
valid_from:
expires_at:
```

Possible sources:

```text
USER_CONFIRMED
CALENDAR
SYSTEM_OBSERVED
SYSTEM_INFERRED
HISTORICAL_PATTERN
EXTERNAL_SOURCE
```

Example:

```yaml
claim: "User is currently working on hackathon"
source: USER_CONFIRMED
confidence: 1.0
observed_at: 2026-09-20T10:05
```

versus:

```yaml
claim: "User may be working on hackathon"
source: SYSTEM_INFERRED
confidence: 0.62
observed_at: 2026-09-20T10:03
```

These claims are not equivalent.

---

# 4. PersonalState

`PersonalState` represents the system's best current interpretation of the user's situation.

It is temporary and continuously revisable.

Initial state vocabulary:

```text
FLOW
UNCERTAIN
DRIFTING
DISRUPTED
OVERLOADED
```

### FLOW

The user's observed situation is reasonably aligned with current intent.

### UNCERTAIN

The system lacks enough trustworthy information to determine the user's current situation.

### DRIFTING

Observed behavior appears to be gradually diverging from current intent or plan.

### DISRUPTED

A meaningful event has invalidated or materially changed the current plan.

### OVERLOADED

Known commitments, deadlines, workload, or capacity indicate excessive competing demand.

These states represent **system beliefs**, not objective truths.

Example:

```yaml
state: DRIFTING
confidence: 0.58
evidence:
  - scheduled_focus_block
  - unexplained_context_change
```

Low confidence may cause the system to ask rather than act.

---

# 5. Observation

An `Observation` is an input describing something that happened or appears to be happening.

Examples:

```text
Calendar event started
Calendar event ended
User answered a popup
User changed active context
Task completed
Deadline moved
Meeting invitation received
User manually reported fatigue
```

Observation does NOT automatically imply meaning.

Example:

```text
Observation:
User changed from IDE to browser.
```

The system must not automatically conclude:

```text
User stopped working.
```

The browser could contain:

```text
documentation
research
GitHub
AI assistant
unrelated entertainment
```

Observation therefore feeds reasoning rather than becoming truth directly.

Minimal conceptual fields:

```yaml
id:
type:
timestamp:
source:
data:
confidence:
```

---

# 6. Forecast

A `Forecast` represents a probabilistic belief about a future state or outcome.

Forecasts are never facts.

Example:

```yaml
target:
  type: commitment
  id: hackathon-deep-work

prediction:
  outcome: likely_disruption
  probability: 0.68

horizon: 4h

drivers:
  - previous_block_overrun
  - insufficient_break
  - deadline_pressure

generated_at:
```

Forecasts must be revisable when new evidence arrives.

```text
Forecast(t0) ≠ permanent truth

new observation
        ↓
new state
        ↓
new forecast
```

The system SHOULD preserve why a forecast changed when relevant.

---

# 7. Decision

`Decision` is a first-class domain object.

A Decision represents a meaningful choice the user is considering.

Example:

```text
"Should I attend the AWS workshop this Saturday?"
```

A Decision contains:

```yaml
question:

options:

relevant_context:

constraints:

tradeoffs:

recommendation:

confidence:

reasoning_summary:

user_choice:

status:
```

Example:

```yaml
question: "Should I attend the AWS workshop?"

options:
  - attend
  - skip

relevant_context:
  - hackathon deadline in 5 days
  - workshop aligns with cloud career goal
  - only one free 4-hour block remains

tradeoffs:
  attend:
    gains:
      - career relevance
      - networking
    costs:
      - 4 hours
      - reduced recovery time

recommendation:
  option: skip
  confidence: 0.72

user_choice: attend
```

The recommendation and the user's choice MUST remain separate.

Future Me supports the decision.

Future Me does not rewrite the user's decision as its own.

---

# 8. Intervention

An `Intervention` is any proactive system action intended to obtain information or reduce a consequential risk.

Examples:

```text
Ask for missing context
Warn about disruption
Surface an important trade-off
Suggest reconsidering an existing plan
```

Not every observation should produce an intervention.

Conceptually:

```text
Observe
    ↓
Is context sufficiently trustworthy?
    ↓
NO → Is missing information important?
           ↓
          YES
           ↓
     Can we interrupt safely?
           ↓
          YES
           ↓
       INTERVENE
```

An intervention SHOULD consider:

```text
impact
urgency
confidence
receptivity
interruption_cost
```

Example:

```yaml
type: CONTEXT_CHECK

reason:
  current_state: UNCERTAIN
  missing_context: current_activity

prompt:
  "Are you still working on the planned task,
   or have you switched to something else?"
```

Default behavior:

```text
If intervention value is low → do nothing.
```

---

# 9. Outcome

An `Outcome` records what eventually happened after a decision, commitment, prediction, or intervention.

Example:

```yaml
decision:
  "Attend AWS workshop"

user_choice:
  attend

observed_outcome:
  - useful networking
  - hackathon work delayed by 3 hours

timestamp:
```

Outcome is important because:

```text
Decision
   ↓
Choice
   ↓
Reality
   ↓
Future context
```

Future Me should learn from actual outcomes rather than assuming its recommendation was correct.

---

# 10. Feedback

`Feedback` is explicit information from the user about the quality or relevance of Future Me's behavior.

Examples:

```text
"This recommendation was useful."

"You interrupted me while I was actually working."

"This workshop mattered more than you assumed."

"Don't notify me for this kind of event."
```

Feedback may update:

```text
preferences
intervention policy
context confidence
decision factors
personal patterns
```

Feedback differs from Outcome.

```text
Outcome
= what happened.

Feedback
= how the user evaluates what happened or the system's behavior.
```

---

# 11. Context Trust Model

Context should not be treated as equally reliable.

Conceptually:

```text
trustworthiness =
    source reliability
  + confidence
  + freshness
  + corroboration
```

Example ordering is context-dependent, but generally:

```text
explicit user confirmation
        ↓
direct structured source
        ↓
strong observation
        ↓
historical pattern
        ↓
system inference
```

This ordering is NOT absolute.

Example:

A calendar says:

```text
14:00 Workshop
```

but the user says:

```text
"I cancelled that."
```

The newer explicit information wins.

---

# 12. Freshness

Some context decays.

Example:

```text
Career goal
→ months

Deadline
→ days

Current workload
→ hours/days

Current activity
→ minutes

Current receptivity
→ minutes
```

Therefore context SHOULD support freshness or expiration semantics.

```yaml
observed_at:
valid_until:
```

Stale context should reduce confidence rather than silently remain true.

---

# 13. Invariants

The following rules should remain stable across implementations.

### I1 — Observation is not truth

```text
observed behavior ≠ confirmed intent
```

### I2 — Forecast is probabilistic

```text
forecast ≠ future fact
```

### I3 — Recommendation and decision are separate

```text
system recommendation ≠ user choice
```

### I4 — PersonalState is temporary

A state can change immediately when new evidence arrives.

### I5 — Context requires provenance

Important beliefs should be traceable to where they came from.

### I6 — Uncertainty is valid state

Future Me may explicitly say:

```text
"I don't know enough yet."
```

rather than fabricate certainty.

### I7 — Silence is valid behavior

No intervention is often the correct intervention.

### I8 — Learning means context update

For MVP:

```text
learning =
new evidence / outcome / feedback
→ update stored context
→ use updated context later
```

It does NOT require model fine-tuning.

### I9 — User remains decision owner

Future Me provides:

```text
context
trade-offs
forecast
recommendation
```

The user provides:

```text
choice
```

---

# 14. Primary Domain Loop

The primary Future Me loop is:

```text
OBSERVE
   ↓
DETECT CHANGE / UNCERTAINTY
   ↓
ACQUIRE CONTEXT IF NEEDED
   ↓
UPDATE PERSONAL STATE
   ↓
UPDATE PERSONAL CONTEXT
   ↓
FORECAST RELEVANT FUTURES
   ↓
SUPPORT DECISION
   ↓
USER CHOOSES
   ↓
OBSERVE OUTCOME
   ↓
INCORPORATE FEEDBACK
   ↓
UPDATE CONTEXT
```

The loop does not need to execute continuously.

Future Me should remain inactive when nothing consequential has changed.

---

# 15. Example End-to-End

Initial context:

```text
Hackathon deadline: September 25
User needs ~20 hours more work
Saturday afternoon is currently free
Career goal: Cloud / DevOps
Recent workload: high
```

New event:

```text
User receives invitation:
AWS Workshop
Saturday 13:00–17:00
```

User asks:

```text
"Should I attend?"
```

Future Me creates:

```text
Decision
```

Relevant context is retrieved.

Forecasts:

```text
Attend:
+ strong career relevance
+ potential networking
- removes 4-hour build block
- increases deadline pressure

Skip:
+ protects hackathon block
- loses workshop/networking opportunity
```

Future Me provides recommendation and trade-offs.

User chooses:

```text
Attend
```

Later:

```text
Workshop produced valuable contact.
Hackathon work shifted into Sunday.
```

These become:

```text
Outcome
```

User says:

```text
"That workshop was worth it."
```

This becomes:

```text
Feedback
```

Future Me updates its context about how the user values similar opportunities.

---

# 16. Explicit Non-Goals of the Domain Model

This contract does not define:

```text
database schema
API endpoints
LLM prompts
UI components
sensor implementation
screen-monitoring implementation
ML model architecture
notification transport
```

Those systems must conform to this domain model, not define its semantics.

Important 
**All scoring, classification, forecasting, and intervention logic in the MVP is provisional. Implementations MUST NOT hard-code the example values or state examples in this document as final decision rules.**