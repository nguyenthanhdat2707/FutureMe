# Future Me — MVP Scope

> Status: Draft / Near Freeze\
> Timebox: 5-day MVP\
> Goal: Prove the core product thesis without overbuilding the intelligence layer.

---

# 1. MVP Goal

The MVP must prove one core idea:

> Future Me can maintain enough trustworthy personal context to give better decision support when the user's real situation changes.

The MVP does **not** need to perfectly understand the user.

It only needs to demonstrate that:

```text
changing reality
→ updated context
→ different reasoning
→ different decision support
```

---

# 2. Hero Flow

The primary MVP flow is:

```text
Future Me already has Personal Context
        ↓
Reality changes
        ↓
System detects uncertainty / stale context
        ↓
System selectively asks for clarification
        ↓
Personal Context is updated
        ↓
User asks a consequential question
        ↓
Future Me retrieves relevant context
        ↓
Future Me evaluates options and trade-offs
        ↓
Future Me gives a recommendation
        ↓
User makes the decision
        ↓
Outcome / feedback becomes new history
```

Primary interaction:

```text
User-invoked decision support
```

Proactive behavior exists only to:

```text
maintain context
or
surface consequential disruption
```

Default behavior:

```text
If nothing important changed → do nothing.
```

---

# 3. MUST HAVE

These capabilities are required for the MVP.

## 3.1 Personal Context

Future Me must maintain a basic persistent context about the user.

Minimum context:

```text
Goals
Commitments
Calendar events
Deadlines
Current workload
Preferences
Recent decisions
Recent outcomes
```

Context should support at least:

```text
source
confidence
freshness
```

The implementation can remain simple.

The semantic distinction must remain:

```text
user-confirmed information
≠
system inference
```

---

## 3.2 Calendar Context

Future Me must be able to understand scheduled commitments.

Minimum:

```text
event title
start/end time
status
basic metadata
```

For the MVP this can come from:

```text
real calendar integration
or
seeded demo data
```

The system should treat calendar events as **plans**, not proof of what the user is actually doing.

---

## 3.3 Observation Input

The MVP must support observations about changes in reality.

Supported MVP sources:

```text
manual user input
system-generated demo events
simulated activity signals
calendar changes
```

Real continuous desktop surveillance is NOT required.

Observation sources must be replaceable later.

Conceptually:

```text
ObservationSource
    ↓
Observation
```

Future implementations may plug in:

```text
desktop telemetry
mobile signals
email
location
wearables
other integrations
```

without changing the core domain.

---

## 3.4 Detect Uncertainty / Context Staleness

Future Me must be able to detect that its current understanding may no longer be reliable.

Examples:

```text
scheduled activity does not match observed signal

important event changed

deadline became closer

user's current activity is unknown

existing context is too old
```

The MVP does NOT require sophisticated ML.

Simple deterministic rules are acceptable.

Example:

```text
calendar says deep work
+
activity signal cannot verify current intent
+
decision relevance is high

→ state = UNCERTAIN
```

---

## 3.5 Context Check

When important context is missing, Future Me must be able to ask the user.

Example:

```text
"Are you still working on the planned task,
or have you switched to something else?"
```

The answer must update the user's current context.

The system should avoid unnecessary interruptions.

For MVP:

```text
context check
→ user answer
→ context update
```

is sufficient.

---

## 3.6 Decision Support

The main product interaction must allow the user to ask a consequential future-oriented question.

Primary supported pattern:

```text
"Should I do X?"
```

Examples:

```text
Should I attend this workshop?

Should I accept this opportunity?

Should I spend tonight working on the hackathon?

Should I take this additional commitment?
```

Future Me should not behave as a generic chatbot.

Decision support must use Personal Context.

---

## 3.7 Relevant Context Retrieval

Future Me must select context relevant to the current decision.

Example:

```text
Question:
"Should I attend the AWS workshop?"
```

Relevant context might include:

```text
career goals
hackathon deadline
current workload
remaining available time
recent similar events
user preferences
```

Irrelevant context should not automatically be included.

The MVP does not require perfect retrieval.

It must demonstrate contextual relevance.

---

## 3.8 Trade-off Analysis

Future Me must present meaningful trade-offs between options.

Example:

```text
Attend workshop

Benefits:
- career relevance
- networking

Costs:
- loses 4 hours
- less recovery time
- increases deadline pressure
```

Decision support should clearly distinguish:

```text
facts
inferences
trade-offs
recommendation
```

---

## 3.9 Recommendation

Future Me may recommend an option.

Example:

```text
Recommendation:
Skip the workshop this time.

Reason:
The workshop aligns with your long-term career goal,
but the current hackathon deadline and remaining workload
make the opportunity cost unusually high.
```

Recommendation must be based on current context.

The user remains the decision owner.

```text
system recommendation ≠ user choice
```

---

## 3.10 Explanation of Used Context

The user must be able to understand why Future Me reached its recommendation.

Example:

```text
I considered:

- hackathon deadline: 5 days
- remaining estimated work: 20 hours
- Saturday free block: 4 hours
- workshop relevance to Cloud/DevOps goal
- recent workload: high
```

This also helps expose stale or incorrect context and demonstrates that a change in Personal Context caused a change in reasoning.

---

## 3.11 User Choice

The user must be able to record what they actually decided.

Example:

```text
Future Me recommends:
SKIP

User chooses:
ATTEND
```

Both must be stored independently.

---

## 3.12 Outcome / Feedback

The MVP must allow the result of a decision to become future context.

Example:

```text
Decision:
Attend workshop

Outcome:
Useful networking contact
Hackathon delayed 3 hours

Feedback:
"The workshop was worth it."
```

The system can later use this information when reasoning about similar decisions.

For MVP:

```text
learning
=
store outcome / feedback
+
use it in later reasoning
```

No model training is required.

---

# 4. SHOULD HAVE

These features improve the MVP but are not required for the core demo.

## 4.1 Simple Forecast

Future Me may estimate likely future disruption.

Example:

```text
Risk of missing tonight's planned work:
HIGH
```

or:

```text
Estimated disruption probability:
~70%
```

Forecasts can initially use simple heuristics.

Forecasting is **not a required dependency of the MVP decision path**. The core demo must still work when decision support uses updated Personal Context directly without generating a numerical or probabilistic forecast.

The architecture should allow replacement with more advanced forecasting later.

---

## 4.2 Uncertainty

Future Me should be allowed to say:

```text
I don't have enough information yet.
```

and request the missing information.

Recommendation confidence may optionally be shown.

---

## 4.3 Context Timeline

A simple timeline may show:

```text
09:00 planned deep work
10:05 context became uncertain
10:07 user confirmed hackathon research
10:07 context updated
```

This is useful for demo/debugging but not core product value.

---

# 5. DEFERRED

These are intentionally excluded from the first MVP.

## 5.1 Continuous Screen Surveillance

No full:

```text
screen capture
OCR
continuous application monitoring
browser-history surveillance
```

The domain architecture may support these later through new Observation Sources.

---

## 5.2 Advanced Behavior Prediction

No requirement for:

```text
custom ML model
deep behavioral forecasting
long-term prediction engine
fine-tuning
reinforcement learning
```

MVP forecasting may use simple rules.

---

## 5.3 Full JITAI Engine

The MVP does not require a scientifically complete JITAI policy.

Only basic intervention decisions are needed.

Advanced:

```text
adaptive thresholds
receptivity modeling
interruption optimization
long-term intervention learning
```

are deferred.

---

## 5.4 Autonomous Planning

Future Me MVP does not automatically reorganize the user's life.

Deferred:

```text
automatic calendar optimization

automatic task rescheduling

automatic meeting cancellation

automatic acceptance/rejection of invitations

autonomous action execution
```

---

## 5.5 Universal Personal Memory

The MVP does not attempt to remember everything about the user.

Only decision-relevant context is required.

---

## 5.6 Cross-device Context

No requirement for synchronization across:

```text
desktop
phone
tablet
wearables
```

---

## 5.7 Advanced Multi-agent Architecture

Future Me does not require a complex agent swarm for the MVP.

A modular service architecture is enough.

---

# 6. NON-GOALS

Future Me MVP is not trying to:

```text
perfectly predict user behavior

monitor every action

maximize productivity metrics

force users to follow their schedule

replace human judgment

become another generic AI chatbot

become a calendar optimizer

become a notification manager

build a complete digital twin of the user
```

---

# 7. Architecture Constraints

Even though the MVP logic is intentionally simple, the implementation should allow later replacement without rewriting the whole product.

The following modules should remain logically separate:

These are **logical module boundaries**, not deployment or service boundaries. The MVP may implement all of them inside a single application/process. Do not split them into microservices unless there is a concrete need.

```text
Observation Sources

Context Engine

Personal State

Forecast Engine

Intervention Policy

Decision Engine

Outcome / Feedback Store
```

Example:

```text
MVP
---

ObservationSource:
manual / simulated

ForecastEngine:
simple rules

InterventionPolicy:
basic thresholds

DecisionEngine:
LLM + retrieved context
```

Later:

```text
ObservationSource:
desktop / mobile / integrations

ForecastEngine:
probabilistic model

InterventionPolicy:
JITAI

DecisionEngine:
more advanced reasoning
```

The rest of the application should continue to work.

---

# 8. MVP Policy Rules

Initial policy can remain deliberately simple.

## Context Acquisition

Ask the user only when:

```text
important context is missing
AND
the missing information may change a consequential decision
```

---

## Intervention

Proactive intervention is allowed when:

```text
impact is meaningful
AND
confidence is sufficient
AND
interruption cost is acceptable
```

Otherwise:

```text
do nothing
```

---

## Decision Support

A recommendation must:

```text
use relevant context

show meaningful trade-offs

distinguish assumptions from confirmed facts

allow uncertainty

leave final choice to the user
```

---

# 9. Demo Scenario

The MVP demo should prove that changing context changes decision support.

## Step 1 — Initial Context

```text
Hackathon deadline:
5 days away

Remaining work:
manageable

Saturday:
mostly free

Career goal:
Cloud / DevOps
```

User receives:

```text
AWS Workshop
Saturday
13:00–17:00
```

User asks:

```text
"Should I attend the workshop?"
```

Future Me evaluates:

```text
career value
time cost
current workload
remaining commitments
```

and provides recommendation A.

---

## Step 2 — Reality Changes

New observations arrive:

```text
hackathon progress slower than expected

remaining work increased

only one major focus block remains

current workload became high
```

Future Me detects:

```text
existing context is stale / incomplete
```

and asks for confirmation if needed.

Context is updated.

---

## Step 3 — Same Decision, New Context

User asks again:

```text
"Should I attend the workshop?"
```

Future Me now produces:

```text
different trade-offs
and potentially a different recommendation
```

The explanation explicitly shows what changed.

---

# 10. Demo Success Criteria

The MVP is successful if all of the following can be demonstrated.

### D1 — Persistent Context

Future Me remembers relevant context between interactions.

### D2 — Reality Can Update Context

A new observation or user confirmation changes Personal Context.

### D3 — Context Provenance

The system can distinguish at least:

```text
user-confirmed
calendar-derived
system-inferred
```

information.

### D4 — Contextual Decision Support

A decision query retrieves context relevant to that decision.

### D5 — Trade-offs

Future Me can explain benefits and costs of multiple options.

### D6 — Recommendation

Future Me can produce a contextual recommendation without hiding uncertainty.

### D7 — Context Changes Recommendation

Materially changing the user's context results in materially different reasoning.

This is the primary MVP success criterion.

### D8 — User Choice Is Independent

User can disagree with the recommendation.

### D9 — Outcome Becomes History

The eventual result can be stored and used as future context.

---

# 11. MVP Definition of Done

The MVP is done when the following end-to-end loop works:

```text
Load Personal Context
        ↓
Receive Observation
        ↓
Detect uncertainty/change
        ↓
Ask user if necessary
        ↓
Update Context
        ↓
User asks Decision
        ↓
Retrieve relevant context
        ↓
Generate trade-offs
        ↓
Provide recommendation
        ↓
Record user choice
        ↓
Record outcome / feedback
        ↓
Use new history later
```

The quality of each intelligence module may still be basic.

The important requirement is that the architecture and domain flow are correct enough to evolve without rebuilding the product from scratch.

---

# 12. Freeze Level

For the MVP:

### Relatively Stable

```text
Hero flow

Core domain objects

Primary decision-support interaction

Context provenance

User ownership of decisions

Outcome / feedback loop

Module boundaries
```

### Intentionally Provisional

```text
forecast logic

JITAI thresholds

intervention thresholds

confidence calculation

context ranking

LLM prompts

activity detection logic

recommendation policy
```

These provisional components should be replaceable without changing the core domain contract.

Important 

**Any decision, forecasting, scoring, JITAI, intervention, or behavioral inference logic not explicitly defined in the specification is provisional. Implement only the interface and the simplest replaceable behavior necessary for the end-to-end flow. Do not invent domain rules or hard-code assumptions.**
