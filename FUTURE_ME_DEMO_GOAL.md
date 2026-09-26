# FUTURE ME — DEMO IMPLEMENTATION CONTRACT

## Status

This document is the source of truth for the hackathon demo branch.

It defines the exact product behavior, mock data model, decision logic, scheduling logic, UI responsibilities, state transitions, reset semantics, and acceptance criteria for the presentation-grade Future Me prototype.

The implementation may be entirely frontend-only and deterministic. It does not need a real AI model, real calendar integration, real OAuth, or a production backend.

The priority is not technical completeness. The priority is to make the product idea coherent, believable, internally consistent, and demonstrable.

---

# 1. Product thesis

Future Me is not a calendar availability checker.

It should answer a broader question:

> Is this new commitment actually a good fit for me, given my current capacity, existing commitments, personal direction, and what I want to achieve?

The two demo scenarios must demonstrate both sides of the same thesis:

- **Busy does not always mean impossible.**
- **Free does not always mean available.**

The system must not treat a free calendar slot as equivalent to usable capacity, and it must not treat a busy calendar as automatic proof that a valuable opportunity should be rejected.

---

# 2. Non-negotiable implementation principles

## 2.1 Frontend-only is acceptable and preferred

The demo branch may use:

- React state/store
- localStorage
- deterministic rules
- fixed seeded data
- fixed dates
- prepared scenario logic
- mocked outcomes

It does not need:

- LLM calls
- backend API
- database
- real Google Calendar
- OAuth
- external authentication
- external network calls
- production recommendation engine
- generalized scheduling optimization

Do not add backend infrastructure merely because the current repository already contains backend concepts.

## 2.2 One coherent world state

All pages must read from the same shared demo state.

Never hard-code contradictory copies of data inside individual components.

The following surfaces must remain consistent with one another:

- Dashboard
- Calendar
- Tasks
- Understanding / Full Context
- Ask Future Me
- Decision Analysis
- Plan Preview
- History / Reflection

If a task moves in the plan preview and the user applies that plan, every page that references the task must reflect the same new state.

## 2.3 One persona

Use only:

> **Persona A**

Do not give Persona A a personal name.

Persona A is a university lecturer with business / entrepreneurial responsibilities.

Do not create multiple personas for the two scenarios.

## 2.4 One fixed two-week timeline

Use a fixed demo period:

> **Monday, October 5, 2026 through Sunday, October 18, 2026**

Do not derive the demo timeline from the runtime clock.

Do not use `new Date()` or equivalent to make the story drift as real time changes.

All date-sensitive demo behavior must use the fixed seeded timeline.

## 2.5 Two scenarios, same baseline

Both scenarios use the same Persona A, goals, tasks, calendar, capacity profile, history, and two-week world state.

They are independent demonstrations from the same pristine baseline.

Do not make Scenario B depend on having completed Scenario A.

A presenter must be able to reset and demonstrate either scenario cleanly.

---

# 3. Core context model

Future Me should maintain five conceptual areas.

## 3.1 Capacity — What can I actually handle?

Attributes:

- Time Available
- Workload
- Focus Capacity
- Mental Well-being

## 3.2 Commitments — What am I already committed to?

Attributes:

- Future Calendar
- Tasks
- Deadlines
- Commitment Flexibility

## 3.3 Personal Direction — What truly matters to me?

Attributes:

- Personal Goals
- Short-term Goals
- Long-term Goals
- Priorities / Importance

## 3.4 Expected Value — What do I want to achieve from this opportunity?

Attributes:

- Expected Outcome
- Opportunity Value
- Required Commitment

Expected Value is opportunity-specific and should not be treated as a permanent personal profile section when no active opportunity exists.

## 3.5 History & Reflection — What has happened before?

Attributes:

- Decision History
- Previous Choices
- Actual Outcomes
- Historical Preferences

This section exists to support Continuous Understanding.

---

# 4. Derived outputs are not raw inputs

The following are analysis outputs derived from the context above:

- Remaining Hours
- Available Capacity
- Deadline Pressure
- Decision Fit
- Trade-offs
- Adjusted Plan

Do not display these as if the user manually entered them.

Do not ask the user to fill them.

They should be derived deterministically from the seeded world state.

---

# 5. Provenance model

Every important context item should carry a provenance concept.

Use the following categories:

1. **User Reported**
2. **Imported / Source Data**
3. **Observed History**
4. **Inferred**
5. **Derived**

The UI does not need to show provenance on every pixel, but detailed context views should make it possible to understand where important information came from.

Examples:

- Mental Well-being → User Reported
- Future Calendar → Imported / Source Data
- Previous decision result → Observed History
- Opportunity Value → Inferred
- Available Capacity → Derived

---

# 6. Editability rules

Do not make every attribute editable.

## 6.1 Editable directly

These are subjective and owned by the user:

- Mental Well-being
- Personal Goals
- Short-term Goals
- Long-term Goals
- Priorities / Importance
- Expected Outcome
- Commitment Flexibility when it is user-known context
- Actual Outcome corrections

## 6.2 Correctable / overridable

These may be inferred by Future Me but the user must be able to correct them:

- Opportunity Value
- Historical Preferences
- inferred goal alignment
- inferred commitment flexibility when not source-confirmed

Use language such as:

- Correct
- Override
- Update understanding

Do not make the user edit an unexplained internal score.

## 6.3 Read-only derived values

These should not be directly editable:

- Time Available
- Workload aggregate
- Available Capacity
- Remaining Hours
- Deadline Pressure
- Decision Fit
- Trade-offs

They may expose an explanation of the underlying inputs.

## 6.4 Source-owned values

Examples:

- calendar events
- task deadlines
- fixed meetings

These may be changed through the relevant Calendar / Task interaction if appropriate, but not by directly editing a derived summary card on the Understanding page.

## 6.5 Historical records

Past decisions and previous choices are historical records.

They should not be casually editable.

If an actual outcome was recorded incorrectly, provide an explicit correction action rather than inline editing the history row.

---

# 7. Missing-context rule

This rule is critical.

Future Me must **not** require every attribute to be present before generating a recommendation.

Use this logic:

```text
IF missing information could materially change the recommendation
    ask the user
ELSE
    continue using existing context
    show an assumption if necessary
```

Missing data is not automatically a reason to ask a question.

Examples:

- Missing a fresh Mental Well-being update does not necessarily require a question if the decision is already strongly constrained by a hard deadline.
- An approximate focus pattern can be used if historical context is sufficient.
- Missing Expected Outcome in Scenario A is material because different desired outcomes can change the recommendation.
- Unknown flexibility of the mentoring commitment is material because it determines whether a smaller alternative can exist.

The product should feel like it already knows the user, not like a questionnaire.

---

# 8. Clarification UX

Decision-stage clarification must be minimal.

For Scenario A, ask at most two decision questions.

Each question should present:

- three selectable options
- one custom option

The custom option opens a text input.

Example interaction pattern:

```text
1. Option A
2. Option B
3. Option C
4. Something else...
```

Do not ask unnecessary follow-up questions merely to make the demo appear intelligent.

Execution-stage questions are separate from decision-stage clarification and may occur after the user chooses a recommendation.

---

# 9. Persona A — seeded direction and state

## 9.1 Roles

Persona A has:

- university teaching responsibilities
- business / entrepreneurial responsibilities
- project and stakeholder responsibilities
- an interest in mentoring and advisory work

Do not over-specify biography that the demo does not use.

## 9.2 Short-term goals

- Deliver current teaching responsibilities.
- Protect important business and project deadlines.
- Avoid unnecessary disruption to critical work.
- Maintain enough recovery capacity to avoid an unsustainable schedule.

## 9.3 Long-term goals

- Grow a sustainable technology venture.
- Increase involvement in the startup ecosystem.
- Contribute through mentoring and advisory work.
- Build a sustainable balance between professional ambition and personal capacity.

This long-term direction is the reason a startup mentoring opportunity can have high value without automatically being feasible in its original form.

## 9.4 Current capacity state

Seed the baseline with:

- Workload: **High**
- Available Capacity: **Limited**
- Mental Well-being: **Slightly strained**
- Mental Well-being provenance: **User Reported**
- Strong focus window on selected afternoons
- Weekend time treated as protected recovery / personal time rather than automatic spare capacity

## 9.5 Historical preference

Seed a believable historical pattern:

> Persona A tends to do better with clearly scoped, bounded advisory commitments than with open-ended recurring commitments.

This is an inferred / historical signal, not a hard rule.

---

# 10. Decision Fit labels

Do not use percentages.

Decision Fit is not a probability of success.

Use a more granular label scale:

1. **Very Strong Fit**
2. **Strong Fit**
3. **Moderate Fit**
4. **Conditional Fit**
5. **Weak Fit**
6. **Poor Fit**

The label must always be accompanied by concise reasons.

The product should emphasize evidence and trade-offs over the label itself.

Suggested Scenario A labels:

- Focused mentoring session → **Strong Fit**
- Reject completely → **Moderate Fit**
- Full two-week mentoring → **Weak Fit**

These are deterministic demo labels, not probabilistic predictions.

---

# 11. Shared two-week baseline calendar

All scenario logic must use this calendar.

## Week 1

### Monday, October 5

| Time | Commitment | Properties |
|---|---|---|
| 09:00–11:00 | Teaching | Fixed |
| 13:30–15:00 | Operations Review | Fixed |
| 15:30–17:00 | Product Planning | Flexible, Medium Focus |

### Tuesday, October 6

| Time | Commitment | Properties |
|---|---|---|
| 09:00–10:30 | Team Sync | Fixed |
| 14:00–16:00 | Proposal Deep Work | Flexible, High Focus |

### Wednesday, October 7

| Time | Commitment | Properties |
|---|---|---|
| 10:00–12:00 | Partner Meeting | Fixed |
| 14:00–15:30 | Research / Admin | Flexible, Low Focus |

### Thursday, October 8

| Time | Commitment | Properties |
|---|---|---|
| 09:00–10:30 | Business Meeting | Fixed |
| 13:00–14:30 | Project Review | Fixed |
| 14:30–16:00 | Lighter Work / Transition | Flexible, Low Focus |
| **16:00–17:00** | **FREE** | Visibly free calendar slot |
| **19:00** | **Client Proposal Deadline** | Hard Deadline |

Additional context for this day:

- approximately 90 minutes of focused proposal work still remains after 16:00
- 16:00–18:00 is one of Persona A's strongest remaining focus windows
- current workload is high
- mental well-being is slightly strained

This is the basis of Scenario B.

### Friday, October 9

| Time | Commitment | Properties |
|---|---|---|
| 09:00–11:00 | Business Review | Fixed |
| 14:00–15:30 | Stakeholder Meeting | Fixed |
| 15:30–17:00 | Admin / Review | Flexible, Low Focus |

### Weekend, October 10–11

Protected personal / recovery time.

Do not treat these days as default capacity that can always be consumed.

---

## Week 2

### Monday, October 12

| Time | Commitment | Properties |
|---|---|---|
| 09:00–11:00 | Teaching | Fixed |
| 14:00–16:00 | Product Planning | Flexible, Medium Focus |

### Tuesday, October 13

| Time | Commitment | Properties |
|---|---|---|
| 10:00–12:00 | Partner Meeting | Fixed |
| 14:00–15:00 | Teaching Preparation | Flexible, Low Focus |
| **15:00–16:00** | **Low-focus spare capacity** | Available for safe relocation |

### Wednesday, October 14

| Time | Commitment | Properties |
|---|---|---|
| 09:00–11:00 | Business Operations | Fixed |
| 13:30–15:00 | Admin / Review | Flexible, Low Focus |

### Thursday, October 15

| Time | Commitment | Properties |
|---|---|---|
| 09:00–10:30 | External Meeting | Fixed |
| 13:00–14:30 | Project Review | Fixed |
| 15:00–16:00 | Flexible Business Follow-up | Flexible, Low Focus |

### Friday, October 16 — important Scenario A day

| Time | Commitment | Properties |
|---|---|---|
| **08:00–11:00** | **Teaching** | Fixed |
| 11:00–13:00 | Lunch / Recovery | Protected |
| **13:00–14:00** | **Monthly Report** | Flexible, Low Focus, Low Priority |
| 14:00–15:00 | Flexible Work | Flexible |
| **15:00–16:00** | **Weekly Planning** | Flexible, Low Priority |
| 16:00–17:00 | Buffer / Flexible Capacity | Flexible |

### Weekend, October 17–18

Protected personal / recovery time.

---

# 12. Scenario A — Hero flow: Busy does not mean impossible

This is the primary live-demo scenario.

## 12.1 The only live-demo user question

The presenter should always ask:

> **Should I accept a two-week mentoring commitment for a student startup team?**

The opportunity priority is explicitly:

> **High**

Priority should appear as a selector / pill associated with the question.

Do not require the presenter to encode priority inside the natural-language prompt.

## 12.2 What Future Me already knows

Before asking any follow-up question, the system already has:

- the two-week calendar
- current workload
- focus capacity
- latest user-reported mental well-being
- tasks
- deadlines
- fixed vs flexible commitments
- short-term goals
- long-term goals
- priorities
- history / preferences
- high opportunity priority
- strong alignment between mentoring and the user's long-term startup / advisory direction

The initial mentoring request implies:

> sustained involvement across two weeks, with recurring mentoring time and preparation

Do not over-specify detailed outputs, exact number of sessions, or artificial deliverables unless required by UI.

## 12.3 Why Future Me must ask

The system should not immediately decide.

Two pieces of information are material and cannot be safely inferred.

### Clarification 1 — Expected Outcome

Ask:

> **What matters most to you about this opportunity?**

Options:

1. **I want to contribute meaningfully, even if my involvement is limited.**
2. **I want to stay actively involved throughout the full two weeks.**
3. **Building the relationship and supporting the team matters most.**
4. **Something else...**

For the canonical demo path, select:

> **I want to contribute meaningfully, even if my involvement is limited.**

### Clarification 2 — Commitment Flexibility

Ask:

> **How flexible is the mentoring commitment?**

Options:

1. **The scope and schedule can be adjusted.**
2. **The schedule can change, but meaningful involvement is still expected.**
3. **The full two-week commitment is required.**
4. **Something else...**

For the canonical demo path, select:

> **The scope and schedule can be adjusted.**

Do not ask more decision-stage questions after these two.

## 12.4 Exact decision logic

Implement only the required two-branch logic.

```text
IF
    Expected Outcome does not require full two-week involvement
    AND
    commitment can be adjusted
THEN
    explore a smaller commitment
    recommend a Focused Mentoring Session
ELSE
    evaluate full two-week involvement against current capacity
    recommend not taking the full commitment now
```

Do not invent a large generic decision tree.

### Handling "I'm not sure"

If the user indicates that flexibility is unknown, Future Me may state:

> Confirming whether the mentoring scope can be reduced is the next useful step before committing.

This should still fit the same decision logic rather than introducing another major scenario.

---

# 13. Scenario A — Alternatives and trade-offs

Show exactly three meaningful alternatives.

## 13.1 Reject the opportunity

Suggested fit:

> **Moderate Fit**

Benefits:

- protects current capacity
- protects existing commitments
- avoids additional workload

Trade-off:

- gives up a high-value opportunity aligned with long-term mentoring / startup direction

## 13.2 Accept the full two-week commitment

Suggested fit:

> **Weak Fit**

Benefits:

- maximizes involvement
- strongly supports the mentoring opportunity

Trade-offs:

- sustained load is poorly matched to current limited capacity
- increases disruption risk
- competes with existing deadlines and recovery needs

## 13.3 Focused Mentoring Session

Suggested fit:

> **Strong Fit**

Benefits:

- preserves the user's real desired outcome: meaningful contribution
- maintains strong alignment with long-term direction
- limits sustained load
- can be made feasible by restructuring flexible work

Trade-offs:

- less continuous involvement
- requires deliberate schedule adjustment

This is the recommended canonical path.

---

# 14. Scenario A — From recommendation to execution

Recommendation and execution are separate stages.

Do not automatically modify the calendar when a recommendation appears.

Required flow:

```text
Recommendation
→ User chooses "Use this plan"
→ Check execution information
→ Ask only what is still required
→ Build schedule proposal
→ Show Before / After
→ User confirms
→ Apply plan
```

## 14.1 Execution clarification

Future Me already knows Persona A's calendar.

Do not ask:

> When are you free?

The missing information is the external team's availability.

Ask:

> **When could the student team attend the focused session?**

Options:

1. Thursday afternoon
2. Friday afternoon
3. **They are flexible — choose the best fit**
4. Another time...

Canonical demo selection:

> **They are flexible — choose the best fit**

This question is an execution-stage question and does not count toward the maximum two decision-stage clarification questions.

---

# 15. Scenario A — Required schedule transformation

The schedule proposal must demonstrate both:

1. **Consolidation / batching**
2. **Relocation**

Do not implement only one of these.

## 15.1 Before

### Friday, October 16

| Time | Before |
|---|---|
| 08:00–11:00 | Teaching |
| 11:00–13:00 | Lunch / Recovery |
| 13:00–14:00 | Monthly Report |
| 14:00–15:00 | Flexible Work |
| 15:00–16:00 | Weekly Planning |
| 16:00–17:00 | Buffer / Flexible Capacity |

### Tuesday, October 13

| Time | Before |
|---|---|
| 14:00–15:00 | Teaching Preparation |
| 15:00–16:00 | Low-focus spare capacity |

## 15.2 Transformation 1 — Consolidate Teaching + Monthly Report

Future Me proposes moving the Monthly Report into the Friday morning Teaching block.

Represent it as:

> **Teaching + Monthly Report — Consolidated Morning Block**

Internal rationale:

- Teaching remains the fixed anchor.
- Monthly Report is flexible.
- Monthly Report has low focus demand.
- Monthly Report has low relative priority.
- The report can be handled within compatible low-intensity periods of the morning block in this demo model.

Do not pretend that two high-attention tasks are being performed simultaneously.

The UI should communicate this as a consolidated block, not as magical time compression.

## 15.3 Transformation 2 — Relocate Weekly Planning

Move:

> Weekly Planning — Friday 15:00–16:00

to:

> Tuesday, October 13 — 15:00–16:00

Rationale:

- Weekly Planning is flexible.
- It has no immediate hard deadline.
- Tuesday 15:00–16:00 is compatible low-focus capacity.
- The move does not create a downstream conflict.

## 15.4 After

### Tuesday, October 13

| Time | After |
|---|---|
| 14:00–15:00 | Teaching Preparation |
| **15:00–16:00** | **Weekly Planning — moved from Friday** |

### Friday, October 16

| Time | After |
|---|---|
| **08:00–11:00** | **Teaching + Monthly Report — Consolidated Morning Block** |
| 11:00–13:00 | Lunch / Recovery |
| **13:00–13:30** | **Mentoring Preparation** |
| **13:30–15:00** | **Focused Mentoring Session** |
| 15:00–16:00 | Buffer / Recovery |
| 16:00–17:00 | Flexible Work |

## 15.5 Required explanation card

Show a concise explanation such as:

### Why this plan works

- Teaching and critical commitments remain protected.
- The flexible, low-focus Monthly Report is consolidated into the morning block.
- Weekly Planning is moved to compatible low-focus capacity on Tuesday.
- No existing hard deadline is violated.
- The changes create a continuous afternoon block for the higher-priority mentoring opportunity.

The exact copy may be polished, but the causal reasoning must remain intact.

---

# 16. Scheduling rule

The demo scheduling logic should be deterministic and explainable.

Use the following conceptual rule:

```text
IF an existing commitment is flexible
AND moving or consolidating it does not violate its deadline
AND its focus demand is compatible with the destination block
AND its relative priority is lower than the new commitment
THEN
    it may be consolidated or relocated
ELSE
    protect it
```

Low priority alone is not sufficient reason to move a task.

The required combination is:

- flexibility
- deadline safety
- focus compatibility
- relative priority / value

Fixed commitments and hard deadlines must be protected.

---

# 17. Scenario B — Free does not mean available

Scenario B exists in the same world state.

It should primarily appear as a proactive insight on the Dashboard rather than requiring a second Ask Future Me prompt during the main demo.

## 17.1 Opportunity

Thursday, October 8:

> **Optional Professional Development Workshop**
> 16:00–17:00

Properties:

- optional
- one hour
- professionally useful
- moderate goal alignment
- not urgent
- recording / materials are available later

## 17.2 What the calendar says

The calendar visibly shows:

> **16:00–17:00 — FREE**

A basic calendar therefore sees no conflict.

## 17.3 What Future Me knows

Future Me also knows:

- Client Proposal Deadline: 19:00
- approximately 90 minutes of focused proposal work remains
- 16:00–18:00 is a strong focus window
- workload is High
- Mental Well-being is Slightly strained
- workshop value is Moderate
- workshop is Optional
- recording / materials are available

## 17.4 Derived reasoning

```text
Calendar Conflict = No
Time Available = Yes

BUT

Deadline Pressure = High
Focus Opportunity Cost = High
Usable Capacity = Low
```

Future Me therefore surfaces a proactive insight:

> **4:00 PM looks free, but the workshop would consume your strongest remaining focus window before a critical 7:00 PM deadline.**

Recommendation:

> **Skip the live workshop and review the recording later.**

No clarification question is needed because existing context is already sufficient.

## 17.5 Scenario B action

The user may open the insight and choose:

> **Use recording instead**

This may mark the workshop as not attending and optionally create a low-priority flexible "Review workshop recording" task.

Do not force it into a fixed calendar slot unless the product already has a natural place for that action.

The primary purpose of Scenario B is reasoning, not schedule rearrangement.

---

# 18. Two scenarios summarized

```text
PERSONA A
    |
SAME 2-WEEK WORLD STATE
    |
    +-----------------------------+
    |                             |
SCENARIO A                    SCENARIO B
Calendar busy                 Calendar free
High-value mentoring          Optional workshop
Full version too heavy        Strong focus need before deadline
Ask material questions        Existing context already sufficient
Change commitment shape       Protect usable capacity
Batch + relocate work         Skip live event
Focused mentoring             Recording later

BUSY != IMPOSSIBLE            FREE != AVAILABLE
```

---

# 19. Dashboard requirements

The Dashboard should feel like a real product home, not a scenario launcher or attribute dump.

It should surface a coherent summary of the same world state.

Recommended sections:

## 19.1 Current state

Compact summary such as:

- Workload: High
- Available Capacity: Limited
- Mental Well-being: Slightly strained
- Next critical deadline
- current high-priority opportunity if active

## 19.2 14-day capacity view

Use one useful chart / timeline.

It should visually communicate:

- existing commitments
- demanding periods
- remaining usable capacity

Do not add charts merely for decoration.

## 19.3 Upcoming commitments / deadlines

Show the same events and deadlines used elsewhere.

## 19.4 Personal direction snapshot

Show active short-term and long-term goals at a glance.

## 19.5 Proactive insight

Scenario B should be visible here:

> 4:00 PM looks free, but using it for the workshop would put your 7:00 PM deadline under unnecessary pressure.

Provide a clear action:

> View reasoning

Do not expose developer terminology such as "Scenario B" in the normal product UI.

## 19.6 Navigation to full understanding

Provide a natural route such as:

> View what Future Me understands

---

# 20. Understanding / Full Context page

This is a major product page.

Its purpose is:

> Show the user what Future Me currently understands about them, where that understanding comes from, what can be corrected, and how it influences decisions.

It must not be a flat list of text fields.

It must not be a giant form.

## 20.1 Top-level summary cards

Keep prominent summary cards.

Use four persistent high-level cards:

1. **Capacity**
2. **Commitments**
3. **Personal Direction**
4. **History & Reflection**

When an active opportunity exists, show a separate **Current Opportunity / Expected Value** panel.

Each top-level card should show a few important insights, not every attribute.

Examples:

### Capacity

- High workload
- Limited usable capacity
- Strongest focus windows

### Commitments

- number of fixed commitments
- upcoming deadlines
- flexible work available for adjustment

### Personal Direction

- startup / venture direction
- mentoring / advisory direction
- active short-term priorities

### History & Reflection

- bounded commitments tend to fit better
- preparation effort has sometimes been underestimated
- recent decision patterns

## 20.2 Capacity section

Show the four capacity attributes:

- Time Available
- Workload
- Focus Capacity
- Mental Well-being

Use at most one meaningful chart here.

Recommended:

> **14-day Capacity Timeline**

It should help explain why a visually empty hour may still have high opportunity cost.

## 20.3 Commitments section

Show:

- Future Calendar
- Tasks
- Deadlines
- Commitment Flexibility

Use timeline / compact cards rather than a full duplicate calendar.

Clearly distinguish:

- Fixed
- Flexible
- Protected
- Hard Deadline

## 20.4 Personal Direction section

Do not render this as a plain text table.

Use a goal hierarchy / relationship visual.

Example concept:

```text
LONG TERM
Grow a sustainable technology venture
        |
Increase startup ecosystem involvement
        |
Mentoring & advisory activities

SHORT TERM
Protect current deadlines
Deliver teaching responsibilities
Maintain sustainable workload
```

This section is important because it explains why Future Me can infer that mentoring is a valuable opportunity.

## 20.5 History & Reflection

Show recent decision cards.

Each should be capable of communicating:

- decision
- chosen option
- actual outcome
- what Future Me learned

Example:

> Previous advisory work
> Expected preparation: 45 min
> Actual preparation: 75 min
> Updated understanding: similar mentoring work may require more preparation buffer.

Do not claim a future outcome has happened before it is marked complete.

## 20.6 Current Opportunity / Expected Value

When Scenario A is active, show:

- Expected Outcome
- Opportunity Value
- Required Commitment

Example state before clarification:

- Expected Outcome → Unknown / needs clarification
- Opportunity Value → High alignment, inferred
- Required Commitment → Sustained involvement across two weeks

Opportunity Value may be corrected by the user.

Expected Outcome is user-owned.

Required Commitment is primarily opportunity/source context.

---

# 21. Relevant Context vs Full Context

These are different UX concepts.

## 21.1 Relevant Context

On the Decision / Ask Future Me surface, show only context materially relevant to the current decision.

For Scenario A, examples:

- High workload
- Limited two-week capacity
- Several fixed commitments
- Mentoring strongly aligns with long-term direction
- Priority is High
- Expected Outcome is unknown before clarification

Keep this to approximately 4–6 signals.

## 21.2 Full Context

Provide a control such as:

> **View Full Context**

This opens or navigates to the broader Understanding model.

Do not dump all attributes into the decision result by default.

---

# 22. Assumptions

Future Me may continue with a non-material uncertainty instead of asking.

When it does, show the assumption clearly.

Example:

> **Assumption:** mentoring timing is flexible.

Provide:

> Correct

or:

> Update

Never silently invent user context.

---

# 23. Apply Plan semantics

Applying a plan must mutate the shared world state.

At minimum, update:

- Calendar
- Tasks
- Available Capacity
- Workload projection
- Opportunity status
- Decision History
- Relevant Context
- Understanding summaries

No page may continue showing the old state after the plan is applied.

The UI should make the user confirm before mutation.

Required sequence:

```text
Plan Preview
→ Before / After
→ Confirm
→ Apply
```

---

# 24. Decision state vs Actual Outcome

These must remain separate.

Immediately after applying Scenario A:

```text
Decision: Focused mentoring
Status: Planned
```

Do not create an Actual Outcome yet.

Only after a completion / reflection action should an Actual Outcome exist.

---

# 25. Continuous Understanding / Reflection

This is secondary to the primary live demo, but should be implemented enough to prove the concept.

After the mentoring session is marked complete, allow a simple reflection state.

Canonical mock example:

- Estimated preparation: 30–45 minutes
- Actual preparation: 75 minutes

Update Understanding with a historical insight such as:

> Similar mentoring commitments have required more preparation than previously expected.

This should then appear in History & Reflection.

It does not need a machine-learning implementation.

It is a deterministic state transition.

---

# 26. Runtime state model

A simple shared state is sufficient.

Suggested conceptual shape:

```ts
type DemoWorld = {
  demoVersion: string;

  persona: PersonaContext;

  calendarEvents: CalendarEvent[];
  tasks: Task[];
  goals: Goal[];
  priorities: PriorityItem[];
  capacityProfile: CapacityProfile;

  opportunities: Opportunity[];
  decisions: DecisionRecord[];
  outcomes: OutcomeRecord[];

  activeDecision?: ActiveDecisionState;
  activePlan?: PlanProposal;

  ui?: DemoUIState;
};
```

The exact TypeScript shape may adapt to the existing repository.

Do not force a rewrite if the current state architecture can express the same invariants.

---

# 27. Entity identity and cross-page consistency

Important entities should have stable IDs.

Examples:

```text
event.teaching.2026-10-16
task.monthly-report
task.weekly-planning
deadline.client-proposal
opportunity.student-startup-mentoring
opportunity.professional-workshop
decision.mentoring
```

Components should reference shared entities rather than copying their text values into unrelated local mock objects.

The exact naming convention may follow existing project conventions.

---

# 28. Persistence

Use localStorage or the existing equivalent client-side persistence mechanism.

Requirements:

- browser refresh preserves current demo state
- navigating between pages preserves current demo state
- Apply Plan survives refresh
- reflection state survives refresh
- no server is required

Add a version key so stale incompatible demo state can be reset safely when the schema changes.

---

# 29. Reset Demo

Provide a presenter-safe Reset Demo action.

Reset must restore the complete pristine baseline.

It must restore:

- calendar
- tasks
- capacity
- goals if modified during demo
- opportunities
- active decision
- decisions created during demo
- outcomes created during demo
- Understanding updates generated during demo
- selected scenario / UI transient state
- localStorage demo state

Reset must not be implemented as independent per-page resets.

There is one world state and one reset.

---

# 30. Demo controls

Do not make the normal product experience look like a developer tool.

A subtle presenter control is acceptable.

It may expose:

- Reset Demo
- Return to Baseline
- Open Scenario A state
- Open Scenario B insight

Do not place a giant "Scenario A / Scenario B" launcher in the main customer-facing interface.

---

# 31. UI language

All demo UI copy must be in:

> **English**

The presenter may speak another language, but the product UI remains English.

---

# 32. Visual direction

Reuse the current application's visual language and useful existing components.

Do not redesign the entire app from zero unless an existing component genuinely prevents the required demo behavior.

Requirements:

- formal, clean typography
- balanced spacing
- desktop-first
- presentation / projector friendly
- 16:9 laptop display should look intentional
- mobile only needs to avoid obvious breakage
- charts should be limited and meaningful
- avoid excessive saturated color
- avoid dense walls of text
- use hierarchy, badges, cards, timelines, and lightweight charts to communicate state

The Understanding page in particular should be visually rich enough to feel like a real "model of the user", while remaining readable.

---

# 33. What not to build

Do not spend implementation time on:

- generalized AI agent architecture
- prompt engineering infrastructure
- live LLM integration
- vector database
- embeddings
- generalized recommendation engine
- generalized optimizer
- real calendar sync
- OAuth
- backend persistence
- multi-user support
- production auth
- generic scenario authoring
- dozens of edge cases
- large analytics suite
- complex mobile polish
- production-grade privacy system

These are outside the demo objective.

---

# 34. Required user journey — Scenario A canonical path

The following path must work exactly and deterministically:

1. Start from pristine Persona A baseline.
2. Open Ask Future Me.
3. Enter:
   - `Should I accept a two-week mentoring commitment for a student startup team?`
   - Priority = High.
4. Future Me shows relevant context already known.
5. Future Me asks Expected Outcome.
6. Select:
   - `I want to contribute meaningfully, even if my involvement is limited.`
7. Future Me asks Commitment Flexibility.
8. Select:
   - `The scope and schedule can be adjusted.`
9. Future Me shows three alternatives.
10. Focused Mentoring Session is recommended with **Strong Fit**.
11. User selects `Use this plan`.
12. Future Me asks student-team availability.
13. Select:
   - `They are flexible — choose the best fit`.
14. Future Me builds schedule proposal.
15. Before / After clearly shows:
   - Monthly Report consolidated into Friday morning Teaching block.
   - Weekly Planning moved to Tuesday 15:00–16:00.
   - Mentoring Preparation added Friday 13:00–13:30.
   - Focused Mentoring Session added Friday 13:30–15:00.
16. User confirms.
17. Apply Plan mutates shared world state.
18. Calendar, Dashboard, Tasks, Understanding, History all show the updated state.
19. Refresh keeps the applied state.
20. Reset Demo returns the exact pristine baseline.

---

# 35. Required user journey — Scenario B canonical path

1. Start from pristine baseline.
2. Dashboard shows the proactive Thursday 16:00 insight.
3. Calendar visibly contains a free 16:00–17:00 slot.
4. Open the insight.
5. Future Me explains:
   - 19:00 critical deadline
   - ~90 minutes focused work remaining
   - 16:00–18:00 strong focus window
   - High workload
   - Slightly strained mental state
   - Workshop optional
   - recording available
6. No clarification question is asked.
7. Recommendation:
   - skip live workshop
   - use recording later
8. The explanation explicitly distinguishes:
   - calendar availability
   - usable capacity
9. If the user applies the suggestion, state updates consistently.
10. Reset returns the baseline.

---

# 36. Acceptance criteria

The implementation is complete only if all of the following are true.

## 36.1 Data coherence

- [ ] One shared data source drives all demo pages.
- [ ] No page contains contradictory copies of major scenario data.
- [ ] Dates are fixed to October 5–18, 2026.
- [ ] Persona A has no personal name.
- [ ] Both scenarios use the same baseline.

## 36.2 Scenario A

- [ ] The canonical mentoring prompt works.
- [ ] Priority High is represented separately.
- [ ] Exactly two decision-stage clarification questions are used in the canonical flow.
- [ ] There are exactly three main alternatives.
- [ ] Decision Fit uses labels, not percentages.
- [ ] Focused mentoring is recommended in the canonical path.
- [ ] Full two-week mentoring is visibly a worse fit under current capacity.
- [ ] The user must choose to use the recommendation before scheduling begins.
- [ ] Execution may ask team availability.
- [ ] The plan preview shows Before / After.
- [ ] The plan uses both consolidation and relocation.
- [ ] Teaching remains protected.
- [ ] Monthly Report becomes part of the consolidated Friday morning block.
- [ ] Weekly Planning moves to Tuesday 15:00–16:00.
- [ ] Mentoring Preparation and Focused Mentoring appear Friday afternoon.
- [ ] Apply mutates all relevant surfaces.

## 36.3 Scenario B

- [ ] Thursday 16:00–17:00 visibly appears free.
- [ ] Dashboard surfaces the proactive insight.
- [ ] The workshop is optional and recording is available.
- [ ] Future Me does not ask unnecessary clarification.
- [ ] The reasoning explicitly uses deadline pressure and focus opportunity cost.
- [ ] Recommendation is to protect the focus window and use the recording later.

## 36.4 Understanding

- [ ] Top summary cards remain.
- [ ] Full context covers all agreed attributes.
- [ ] The page is not a flat text dump.
- [ ] At least one meaningful capacity timeline / chart is used.
- [ ] Personal Direction is visually structured.
- [ ] Provenance is visible where useful.
- [ ] Editable, correctable, and derived fields behave differently.
- [ ] Current Opportunity / Expected Value appears when relevant.

## 36.5 State

- [ ] Refresh preserves demo state.
- [ ] Reset restores the pristine baseline.
- [ ] No backend is required.
- [ ] No external network dependency is required for the canonical demo.

## 36.6 Presentation quality

- [ ] The main flow is understandable without explaining implementation internals.
- [ ] Relevant Context is concise.
- [ ] Full Context is available but not forced into every decision.
- [ ] Before / After scheduling is visually obvious.
- [ ] Busy != Impossible is evident in Scenario A.
- [ ] Free != Available is evident in Scenario B.

---

# 37. Implementation strategy

Before changing code:

1. Inspect the latest clean `main`.
2. Inspect current frontend structure, routes, state management, tests, and reusable components.
3. Inspect the current Dashboard, Calendar, Understanding, Ask Future Me, and History implementations.
4. Preserve good existing UI and components where possible.
5. Identify current backend/runtime dependencies that can be bypassed safely in the demo branch.
6. Create an isolated demo branch.
7. Implement shared demo world data first.
8. Implement/reset persistence before wiring page-specific behaviors.
9. Wire each page to the same shared state.
10. Implement Scenario A canonical flow.
11. Implement Scenario B proactive insight.
12. Implement Understanding / Full Context.
13. Implement Apply / Reflection / Reset.
14. Test the full demo from pristine state.
15. Test refresh midway through the flow.
16. Test Reset after Apply and after Reflection.
17. Build the frontend in production mode.

Do not begin by redesigning individual pages independently.

The data contract and state transitions come first.

---

# 38. Branch and repository rules

Create a new isolated branch from the latest clean main:

> `demo/pitch-final`

Before editing:

- fetch origin
- inspect git status
- inspect current branch
- inspect origin/main
- inspect recent commits
- update local main safely
- create the demo branch

Do not stack this work onto unrelated feature branches.

Do not merge into main.

Do not create or merge a pull request unless explicitly requested.

Do not modify production architecture merely to support the demo branch.

---

# 39. Decision-making authority during implementation

This document is authoritative for product behavior.

The implementer may make normal engineering decisions such as:

- component decomposition
- exact TypeScript types
- file names
- local state library usage
- minor spacing / typography
- test organization
- refactoring needed to reuse existing components

The implementer must **not** independently change:

- Persona A
- the fixed two-week dates
- the canonical mentoring prompt
- the two clarification concepts
- the two-branch decision logic
- the three alternatives
- Scenario A recommendation
- the required consolidation + relocation behavior
- the Scenario B workshop logic
- the single-source-of-truth requirement
- editability / provenance semantics
- reset semantics
- English UI
- frontend-only demo objective

If a genuine repository constraint makes one of these impossible, stop and report the constraint rather than silently redesigning the product.

If clarification is truly necessary, batch the necessary questions together once. Do not repeatedly ask low-value implementation questions.

---

# 40. Definition of success

The demo succeeds when a judge can understand the following without needing to believe that the prototype contains a production AI system:

1. Future Me already understands meaningful context about Persona A.
2. It does not ask the user to repeatedly re-enter known information.
3. It asks only when missing information can change the decision.
4. It evaluates a commitment using capacity, commitments, direction, expected value, and history.
5. It can discover an alternative commitment rather than only saying Yes or No.
6. It can turn a chosen alternative into a coherent schedule proposal.
7. It protects hard constraints while restructuring flexible work.
8. It distinguishes empty calendar time from usable capacity.
9. Its understanding can evolve after real outcomes are recorded.
10. All of this is represented by one internally coherent data world.

The prototype may be mocked.

The causal logic must not be mocked inconsistently.
