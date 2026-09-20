# Future Me — User Flows

> **Status:** Near Freeze  
> **Purpose:** Define user-visible interaction flows and observable system behavior for the Future Me MVP.

---

# 1. Scope

`USER_FLOWS.md` defines:

```text
what the user does
what the system shows
how the system responds
how context changes through interaction
```

It does **not** define:

```text
scoring formulas
confidence calculation
forecast algorithms
JITAI thresholds
recommendation policy
attribute weighting
behavioral prediction formulas
```

Those belong to:

```text
DECISION_POLICY.md
```

The MVP may use deterministic, heuristic, simulated, or otherwise replaceable logic behind these flows.

The interaction contract should remain stable even when the intelligence layer changes later.

---

# 2. Interaction Invariants

## INV-01 — Absence of evidence is not evidence of absence

Example:

```text
No events found in Google Calendar
```

does **not** imply:

```text
user is free
user has no commitments
user has low workload
```

---

## INV-02 — User silence is not confirmation

If Future Me displays:

```text
"I currently understand AWS learning
to be an important priority."
```

and the user does nothing, the information remains:

```text
inferred
```

It becomes:

```text
confirmed
```

only after explicit confirmation or equivalent direct user evidence.

---

## INV-03 — Calendar represents plans, not observed behavior

```text
Calendar event
≠
proof that the activity occurred
```

---

## INV-04 — User correction must not erase history

New evidence changes the current understanding while preserving previous evidence.

---

## INV-05 — Unknown is a valid state

Future Me may allow:

```text
Unknown
Not sure
Skip
Later
```

rather than forcing the user to produce low-quality information.

---

## INV-06 — User remains the decision owner

```text
Future Me recommendation
≠
User final choice
```

---

## INV-07 — Silence is valid system behavior

If nothing meaningful changed:

```text
do nothing
```

is an intentional outcome.

---

# 3. Core Product Loop

```text
Observe
    ↓
Detect uncertainty / change
    ↓
Acquire missing context if necessary
    ↓
Update Personal Context
    ↓
Support a future decision
    ↓
User chooses
    ↓
Observe actual outcome
    ↓
Collect feedback
    ↓
Use new history later
```

The primary interaction is:

```text
User-invoked decision support
```

Proactive interaction exists primarily to:

```text
maintain trustworthy context

or

surface consequential disruption
```

---

# 4. Core User Flows — MUST

## 4.1 First Login / Adaptive Context Setup

### Goal

Give the user useful value quickly without requiring a long setup form.

### Flow

```text
User signs in
    ↓
Future Me presents:

[Try Demo]
[Connect Google Calendar]
    ↓
If Calendar is connected:
    fetch available calendar data
    ↓
extract deterministic facts / patterns
    ↓
show immediate context brief
    ↓
LLM Context Analyst proposes hypotheses
and useful clarification questions
    ↓
Future Me asks a short adaptive mini-interview
    ↓
User may:

Confirm
Correct
Skip
Not sure
    ↓
Context updates
    ↓
Home Dashboard
```

### Expected onboarding question count

Initial setup should normally ask only a small number of questions.

Conceptual limit:

```text
initial questions: up to 4
follow-up questions: up to 2
```

This is an interaction constraint, not a fixed requirement to always ask that many questions.

Future Me may ask fewer.

### Example

```text
Future Me:

I found "AWS Study" six times in your recent calendar.

What does this usually represent?

[Current priority]
[Long-term goal]
[Routine]
[Flexible placeholder]
[Something else]
[Skip]
```

After answer:

```text
Got it.

I'll currently treat AWS learning as
an important but flexible commitment.
```

The user receives immediate value after providing context.

---

# 5. Sparse / Empty Context Flow

## Trigger

Calendar contains little or no useful information.

### Flow

```text
Calendar connected
    ↓
No useful scheduled context found
    ↓
Future Me does NOT infer that user is free
    ↓
Future Me explains that it lacks schedule context
    ↓
ask a small number of high-yield questions
```

Example:

```text
What are the 1–3 things that matter most
to you over the next few weeks?

Is there an important deadline or commitment
I should know about?

How do you normally keep track of your plans?
```

User may:

```text
answer
skip
start using Future Me anyway
```

Context acquisition continues progressively later.

---

# 6. Home Dashboard

The Home screen should expose the product's current understanding rather than behaving as a generic full-screen chatbot.

Minimum surfaces:

```text
Calendar

What Future Me Understands

Needs Your Input

Ask Future Me

Recent Decisions
```

Conceptual layout:

```text
HOME

Current Context
─────────────────────
Goals
Commitments
Upcoming pressure
Relevant inferred state

Calendar
─────────────────────
Today / Week
Upcoming commitments

What Future Me Understands
─────────────────────
Confirmed / inferred context

Needs Your Input
─────────────────────
Selective clarification requests

Ask Future Me
─────────────────────
"What are you deciding?"

Recent Decisions
─────────────────────
Decision → choice → outcome status
```

---

# 7. What Future Me Understands / Correction / Manual Update

This surface exposes Future Me's current context model.

Example:

```text
AWS Study
Current priority
Status: Inferred

[Looks right]
[Correct]
```

User correction:

```text
"No, AWS is not important this week.
The hackathon is my main priority."
```

System:

```text
create new user-confirmed evidence
    ↓
update current context
    ↓
preserve old evidence/history
```

## Manual Context Update

The user must also be able to update context without waiting for Future Me to ask.

Examples:

```text
"Hackathon is now my highest priority."

"My deadline moved to Friday."

"I cancelled tomorrow's meeting."

"I prefer not to schedule deep work after 9 PM."
```

Conceptually:

```text
User input
    ↓
Observation / context update
    ↓
affected current state becomes stale
    ↓
regenerate relevant state
```

---

# 8. Happy Decision Flow

This is the primary product interaction.

### Example request

```text
"Should I attend this AWS workshop?"
```

### Flow

```text
User asks consequential question
    ↓
Future Me identifies the decision
    ↓
retrieve relevant Personal Context
    ↓
identify relevant facts
    ↓
identify assumptions / inference
    ↓
evaluate alternatives and trade-offs
    ↓
provide decision support
```

Response should conceptually separate:

```text
Relevant context

Benefits

Costs / opportunity costs

Important assumptions

Uncertainty

Recommendation
```

Example:

```text
Recommendation:
Skip the workshop this time.

Why:

The workshop aligns with your Cloud/DevOps goal,
but your hackathon deadline is approaching and
remaining available capacity is limited.
```

The exact method used to reach the recommendation belongs to `DECISION_POLICY.md`.

---

# 9. Missing Context During Decision

Future Me must not require complete onboarding before supporting decisions.

### Flow

```text
User asks decision
    ↓
system identifies missing context
    ↓
would the missing context materially affect the decision?
```

If no:

```text
continue reasoning
```

If yes:

```text
ask minimum necessary clarification
    ↓
user answers / skips / says not sure
    ↓
update context
    ↓
continue the same decision flow
```

Example:

```text
Before I answer this well:

Is the hackathon deadline still Thursday?
```

The user should not be redirected into a long setup process.

---

# 10. User Choice Flow

After receiving decision support:

```text
Future Me recommends:
SKIP

User may choose:
ATTEND
```

Both must be stored independently.

Possible interaction:

```text
What did you decide?

[I'll attend]
[I'll skip]
[Not decided yet]
```

The product must not treat recommendation acceptance as mandatory.

---

# 11. Outcome / Feedback Flow

A decision becomes useful historical context only after its outcome can be observed or reported.

### Flow

```text
decision recorded
    ↓
appropriate outcome point reached
    ↓
Future Me requests outcome
or
user manually adds outcome
    ↓
store outcome / feedback
    ↓
use it as future context
```

Example:

```text
You attended the AWS workshop.

How did it go?

[Worth it]
[Not worth it]
[Mixed]
[Add details]
[Later]
```

Optional details:

```text
Useful networking contact.

Lost three hours of hackathon work.
```

For MVP:

```text
learning
=
store history
+
retrieve relevant history later
```

No model training is required.

---

# 12. Same Decision After Reality Changes

This is the main hero proof of the MVP.

### Initial state

```text
Hackathon deadline:
5 days away

Remaining work:
manageable

Saturday:
mostly free

AWS workshop:
career relevant
```

User asks:

```text
"Should I attend the AWS workshop?"
```

Future Me produces:

```text
Decision Support A
```

### Reality changes

New evidence:

```text
Hackathon progress slower than expected

Remaining work increased

Available free time decreased

New commitment added
```

Context updates.

The user asks the same question again:

```text
"Should I attend the AWS workshop?"
```

Future Me produces:

```text
Decision Support B
```

If the context change is consequential:

```text
reasoning should materially change
```

The explanation should expose which context changed.

---

# 13. Returning User Flow

Returning users should not repeat onboarding.

### Flow

```text
Open Future Me
    ↓
refresh calendar/context
    ↓
check for new / stale / conflicting information
```

If nothing consequential changed:

```text
Home Dashboard
```

If clarification is useful:

```text
Needs Your Input
```

Example:

```text
I noticed tomorrow's event moved from
14:00 to 17:00.

Does this affect your evening plan?
```

---

# 14. Context Maintenance Flows — MUST

## 14.1 Calendar Sync-In

Calendar provides scheduled context.

### Initial connection

```text
Google Calendar
    ↓
initial fetch
    ↓
normalize event data
    ↓
store calendar evidence
```

Minimum event data:

```text
title
start time
end time
status
basic metadata
```

### Returning sync

MVP may use simple refresh or incremental sync.

The user-visible requirement is:

```text
changes in Google Calendar
can eventually update Future Me's context
```

Production-grade realtime synchronization is not required.

---

# 15. Basic JITAI / Context Check Flow

Future Me may proactively ask for clarification when its current understanding may no longer be reliable.

Example:

```text
Your calendar planned Hackathon Focus for 09:00–11:00.

Are you still working on that?
```

Options:

```text
[Yes]
[Plans changed]
[Not sure]
[Dismiss]
```

Response:

```text
User answer
    ↓
new Observation
    ↓
update context
```

Important:

```text
MVP trigger may be deterministic,
heuristic,
or simulated.
```

`USER_FLOWS.md` defines the interaction.

It does **not** define the trigger threshold.

---

# 16. Consequential Disruption Flow

Future Me may proactively surface a change that could materially affect an important future commitment.

Examples:

```text
important event moved

deadline changed

available capacity fell

commitment was added

planned dependency failed
```

### Flow

```text
Meaningful disruption detected
    ↓
determine whether clarification is required
    ↓
if needed:
ask user
    ↓
update context
    ↓
surface consequence
```

Example:

```text
Your Saturday afternoon is no longer free.

This may affect your previous plan to
attend the AWS workshop.
```

Future Me may suggest revisiting an earlier decision.

---

# 17. Silence / No-Action Flow

Proactive behavior must not become constant interruption.

### Flow

```text
context refresh
    ↓
no meaningful change
    ↓
no important uncertainty
    ↓
no consequential disruption
    ↓
do nothing
```

Silence is an intentional system decision.

---

# 18. End-of-Block / End-of-Day Reflection

Future Me may ask what actually happened after an appropriate reflection point.

Example:

```text
Hackathon Focus
Planned: 19:00–21:00

What actually happened?

[Completed]
[Partially completed]
[Didn't happen]
[Skip]
```

Optional follow-up:

```text
What changed?

[Took longer than expected]
[Changed plans]
[Low energy]
[Interrupted]
[Something else]
```

Response becomes historical evidence.

`USER_FLOWS.md` does not specify the exact time or threshold that triggers reflection.

That belongs to `DECISION_POLICY.md`.

---

# 19. Conflicting Evidence / Override Flow

Future Me must explicitly handle conflicting evidence.

### Example

Calendar evidence:

```text
Meeting:
14:00–15:00
Status: active
```

User later says:

```text
"That meeting was cancelled."
```

### Flow

```text
retain original Calendar evidence
    ↓
create newer user correction
    ↓
current context prefers stronger/newer relevant evidence
    ↓
regenerate affected current state
```

Important:

```text
history is preserved
```

A later background Calendar sync must not silently remove or override a valid user correction without recognizing the conflict.

Conceptually:

```text
Calendar still says:
meeting exists

User says:
meeting cancelled

Current belief:
cancelled / conflicting evidence exists
```

The exact evidence-ranking mechanism belongs to `DECISION_POLICY.md`.

---

# 20. Skip / Not Sure Flow

Future Me must not force certainty.

Relevant interactions should allow:

```text
Skip
Not sure
Later
Dismiss
```

Example:

```text
Future Me:
Is CKA currently more important than AWS study?

User:
Not sure
```

Store:

```text
priority relationship = unknown
```

Do not fabricate an answer.

---

# 21. Failure / Demo Flows — MUST

## 21.1 OAuth / Calendar Sync Failure

Possible failure:

```text
permission denied

OAuth failure

Calendar API unavailable

sync failed
```

User sees a clear recoverable state.

Example:

```text
We couldn't sync your Google Calendar.

[Retry]
[Continue without Calendar]
[Try Demo]
```

Failure must not make the whole application unusable.

---

# 22. No Useful Context Yet

Future Me may reach a decision request without enough trustworthy context.

Example:

```text
User:
Should I accept this opportunity?
```

But system knows almost nothing about:

```text
goal relevance
time cost
deadline pressure
existing commitments
```

Future Me should say:

```text
I don't know enough yet to make
a useful recommendation.
```

Then request the smallest amount of missing information necessary.

False certainty is not allowed.

---

# 23. Demo Mode + Reset / Replay

Demo Mode is required for reliable hackathon presentation.

### Start

```text
[Try Demo]
    ↓
load seeded scenario
```

Seeded scenario should include enough context to demonstrate:

```text
initial decision
reality change
context update
new reasoning
user choice
outcome / feedback
```

### Reset

```text
[Reset Demo]
    ↓
clear demo mutations
    ↓
restore initial seeded state
```

This allows judges or presenters to replay the hero flow multiple times.

Demo Mode is a hackathon-support capability, not part of the core product thesis.

---

# 24. Supporting System Behavior

The following behavior supports user flows but is not itself a user journey.

## 24.1 Context Acquisition Pipeline

Structured sources should not require an LLM when deterministic extraction is sufficient.

```text
Calendar / structured data
    ↓
deterministic extraction
    ↓
evidence
```

Ambiguous or semantic information may use the LLM Context Analyst.

```text
Evidence + current context
    ↓
LLM Context Analyst
    ↓
hypotheses
candidate attributes
candidate clarification questions
```

The backend validates output before persistence.

---

# 25. LLM Context Analyst Rules

The Context Analyst should follow these rules:

```text
Never convert an inference into confirmed fact.

Never overwrite user-confirmed information silently.

Calendar plans are not proof of actual behavior.

Every inference should preserve evidence provenance.

Unknown is valid.

Prefer questions that resolve consequential uncertainty.

Avoid asking for information already known.

Prefer questions that unlock multiple useful context attributes.

Do not ask unnecessary questions.

Do not directly execute calendar mutations.

Do not define recommendation or JITAI policy.
```

Typical output:

```text
facts

hypotheses

candidate questions

context attributes unlocked

whether more clarification is useful
```

---

# 26. Context Attribute Confirmation

When Future Me displays an inferred context attribute:

```text
AWS Study
Importance: High
Status: Inferred
```

User may explicitly confirm:

```text
[Looks right]
```

Then:

```text
status:
confirmed

source:
user_confirmation
```

If user does nothing:

```text
status remains:
inferred
```

---

# 27. Calendar Disconnect

If Google Calendar is connected, the user should have a basic disconnect option.

Example:

```text
Google Calendar
Connected

[Disconnect]
```

MVP does not require a complete privacy/data-management center.

---

# 28. SHOULD Flows

The following capabilities should not block the hero MVP.

## 28.1 Calendar View

Future Me should ideally provide a basic Today / Week calendar view inside the application.

This helps the user inspect the context Future Me is reasoning from.

Minimum:

```text
event title
start/end
status
```

---

## 28.2 Calendar Manual Edit

If time permits:

```text
create event

edit owned event

reschedule event

cancel/delete owned event
```

Complex recurring-event editing and shared-calendar semantics are not required.

---

## 28.3 Calendar Write-Back

Future Me may propose:

```text
Move Hackathon Focus
from 14:00–16:00
to 19:00–21:00?
```

User must explicitly confirm:

```text
[Update Calendar]
[Keep Current]
```

Only after confirmation may the application modify the Calendar.

Future Me must not autonomously reorganize the user's calendar in the MVP.

---

## 28.4 OS / Browser Notifications

Native notifications are optional.

The MVP proactive surface should primarily use:

```text
in-app card
popup
modal
Needs Your Input
```

Native/browser notification support may be added later.

---

# 29. Flow Priority

## Hero MVP path

The minimum end-to-end path that must work is:

```text
First Login / Demo
    ↓
Initial Context
    ↓
Decision Query
    ↓
Decision Support
    ↓
Reality Changes
    ↓
Context Check / Update
    ↓
Same Decision Again
    ↓
Different Reasoning
    ↓
User Choice
    ↓
Outcome / Feedback
```

Everything else supports the reliability and usability of this loop.

---

# 30. Implementation Boundary

The FE and BE may be built before the final intelligence logic is frozen.

Example:

```text
UI asks for context
    ↓
backend stores evidence
    ↓
placeholder / simple replaceable policy
    ↓
UI renders result
```

Later:

```text
simple policy
    ↓ replace
research-backed decision / forecast / JITAI model
```

The user-visible interaction contract should remain stable.

---

# 31. MVP Success Behavior

The complete experience should demonstrate:

```text
Future Me knows some relevant personal context.

Reality changes.

Future Me recognizes that old context may no longer be reliable.

It acquires missing information when necessary.

Its current understanding updates.

Decision reasoning uses the new context.

The user remains free to disagree.

The actual outcome becomes future evidence.
```

The central demonstration is:

```text
same question
+
different real context
=
different reasoning
```

---

# 32. Freeze Boundary

Relatively stable after this document is frozen:

```text
interaction structure
context correction behavior
user ownership of decisions
context acquisition behavior
feedback loop
conflicting-evidence behavior
Calendar as evidence
silence behavior
demo hero path
```

Intentionally provisional:

```text
exact scoring formulas
confidence computation
forecasting model
question-ranking model
JITAI trigger thresholds
interruption policy
recommendation algorithm
attribute weighting
receptivity calculation
behavioral prediction
```

These may evolve without requiring major changes to the user flows.

---

# 33. Final Interaction Principle

Future Me should not try to understand everything before becoming useful.

It should:

```text
use trustworthy evidence already available
        ↓
expose what it currently understands
        ↓
ask selectively when uncertainty matters
        ↓
allow correction
        ↓
support a real decision
        ↓
observe what actually happened
        ↓
improve its future context
```

The product should continuously improve its understanding without making the user repeatedly rebuild their profile from scratch.