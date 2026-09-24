# Phase 6 Implementation Contract: User Choice, Outcomes, Feedback, and Reusable History

**Status:** APPROVED — Ready for implementation  
**Branch:** `feat/phase6-choice-outcome-history`  
**Last Updated:** 2026-09-24

---

## GOAL

Capture actual user decisions and real-world outcomes to provide relevant history for future decisions. This phase closes the learning loop: FutureMe remembers what the user chose, what happened, and whether they would make the same choice again—then uses that experience to inform similar decisions later.

**Core Value Proposition:**  
AI doesn't just give advice—it learns what actually happened after the user decided.

---

## KNOWN FACTS

**From Phase 4-5:**
- Decision evaluation returns RECOMMEND/ASK/ABSTAIN with structured reasoning
- User sees recommendation but hasn't recorded their actual choice
- Context engine has event timings from calendar sync
- Decision UI currently shows recommendation without capturing user's final choice

**From Product Analysis:**
- History must inject INTO AI reasoning, not just display alongside
- Three distinct concepts: what user decided, what actually happened, whether user would repeat
- These three can change independently and must be stored separately
- "Learn what matters in context", not "did user follow advice Y/N"

---

## IMPLEMENTATION INTENT

### 01. Decision Choice Capture (at decision time)

**Problem:** Current Phase 4 UI shows recommendation but doesn't record what user actually chose.

**Solution:** Action-based choice buttons with unambiguous semantics.

**UI Pattern:**
```
┌─ Decision Recommendation ────────────────────────────┐
│ Recommended                                          │
│ Decline Project A and focus on your MVP deadline.   │
│                                                      │
│ Your current workload shows 32 committed hours      │
│ with only 8 hours of available capacity.            │
│                                                      │
│ [Decline Project A]  [Join Project A]               │
│ [Decide Later]       [Choose Another Approach]      │
└──────────────────────────────────────────────────────┘
```

**Semantics:**
- Primary buttons = actual actions user will take (not agree/disagree with AI)
- "Decline Project A" / "Join Project A" = final mutually-exclusive choices
- "Decide Later" = defer (NOT a final decision, does NOT trigger outcome check-in)
- "Choose Another Approach" = custom choice (opens free text field, IS a final decision)

**Storage:**
```typescript
{
  decision_id: string
  chosen_action: "decline" | "accept" | "custom" | "deferred"
  chosen_action_display: string  // "Decline Project A"
  custom_notes?: string          // if chosen_action = custom
  ai_recommendation: string      // what AI suggested (separate)
  chosen_at: timestamp
  status: "final" | "deferred"
}
```

**Key Invariant:** User choice is separate from AI recommendation. A user declining when AI recommended accept is valid data, not an error.

---

### 02. Context-Aware Outcome Check-in Scheduling

**Problem:** Fixed 3-day delay doesn't match decision nature. Asking "how did it go?" before the event happens feels tone-deaf.

**Solution:** Use event timing when available, fall back to time-based default.

**Scheduling Logic:**
```typescript
function scheduleCheckIn(decision: Decision): Date {
  const relatedEvent = findRelatedCalendarEvent(decision.context);
  
  if (relatedEvent && relatedEvent.end_time) {
    return addDays(relatedEvent.end_time, 1);
  }
  
  return addDays(decision.chosen_at, 3);
}
```

**Examples:**
| Decision | Check-in Timing |
|----------|----------------|
| "Join hackathon on Sept 25?" | Sept 26 (event_end + 1 day) |
| "Learn AWS tonight?" | 3 days later (no future event) |
| "Accept new role?" | 3 days later (no specific event) |

**Check-in Delivery:**
- **Production:** Proactive in-app card appears on dashboard when due
- **Demo/Dev:** Manual "Trigger Check-in Now" button bypasses schedule

**Out of Scope (Phase 6):** Email notifications, push notifications, SMS. In-app dashboard card only.

---

### 03. Outcome + Feedback Capture

**Problem:** Need to distinguish objective outcome, subjective satisfaction, and whether user would repeat—without forcing premature feedback.

**Solution:** Two-tier capture with explicit "too early" path.

**UI Flow:**

**First Tier: Outcome Assessment**
```
┌─ Outcome Check-in ───────────────────────────────────┐
│ Follow-up                                            │
│                                                      │
│ Three days ago, you decided to decline Project A    │
│ and focus on your MVP deadline.                     │
│                                                      │
│ How did that decision work out?                     │
│                                                      │
│ [Positive]  [Neutral]  [Negative]  [Too Early]     │
└──────────────────────────────────────────────────────┘
```

**Second Tier: Reflection (only if outcome recorded)**
```
┌─ Outcome Recorded ───────────────────────────────────┐
│ Outcome: Positive                                    │
│                                                      │
│ Would you make the same choice again?                │
│ Knowing what you know now.                           │
│                                                      │
│ [Yes]  [No]                                          │
│                                                      │
│ What happened? (Optional)                            │
│ [_____________________________________________]      │
│                                                      │
│ [Save]  [Skip]                                       │
└──────────────────────────────────────────────────────┘
```

**"Too Early to Tell" Behavior:**
- Does NOT record an outcome (status remains `pending`)
- Does NOT ask would-repeat question (user just said they don't have enough info)
- Allows future check-in (re-schedule or user-initiated)
- Valid UX: user isn't forced to give feedback prematurely

**Storage:**
```typescript
{
  decision_id: string
  outcome_status: "positive" | "neutral" | "negative" | "pending"
  would_repeat: boolean | null
  outcome_notes: string | null
  recorded_at: timestamp
  updated_at: timestamp  // supports corrections
}
```

**Key Invariant:** No feedback ≠ negative feedback. Null values are explicit "unknown", not inferred negative.

---

### 04. Outcome Correction

**Problem:** Incorrect historical outcomes continue influencing future AI recommendations indefinitely.

**Solution:** Allow users to edit previously recorded outcomes.

**IN SCOPE for Phase 6 MVP.**

**UI Entry Point:**
```
┌─ Past Decisions ─────────────────────────────────────┐
│ September 12 · Opportunity                           │
│ Declined Project A to focus on MVP                   │
│ Outcome: Positive · Would repeat: Yes                │
│                                                      │
│ [Edit Outcome]                                       │
└──────────────────────────────────────────────────────┘
```

**Edit Flow:**
- Reuse existing outcome check-in form
- Pre-fill current outcome, would-repeat, notes
- Allow update and save
- Preserve correction history in backend (audit trail)
- Use corrected outcome in future history retrieval

**What Can Be Edited:**
- ✅ Outcome (positive/neutral/negative)
- ✅ Would-repeat (yes/no)
- ✅ Outcome notes (free text)
- ❌ Original decision choice (out of scope—that's what they DID, not what happened after)

**Key Invariant:** Original decision choices are historical fact. Outcomes are assessments that can be revised as understanding evolves.

---

### 05. History Retrieval BEFORE Recommendation Generation

**Critical Architecture Requirement:**

```
WRONG (just display):
  generate_recommendation() → retrieve_history() → display_both

RIGHT (inject context):
  retrieve_history() → inject_into_context() → generate_recommendation()
```

**Retrieval Logic (MVP):**
```typescript
function retrieveRelevantHistory(
  currentDecision: DecisionContext
): HistoricalDecision[] {
  return query({
    filters: {
      category: currentDecision.category,        // MUST match
      created_at: { gte: sixMonthsAgo() },       // recency
      outcome_status: { ne: "pending" },         // exclude unresolved
      keywords: overlapWith(currentDecision.keywords, minScore: 0.3)
    },
    orderBy: [
      { matchScore: "desc" },  // keyword overlap + goal alignment
      { created_at: "desc" }   // prefer recent
    ],
    limit: 2
  });
}
```

**Matching Prioritization:**
1. Same category (required)
2. Within 6 months (required)
3. Keyword overlap (required minimum threshold)
4. Goal alignment (bonus if goals/commitments match)
5. Recency (tie-breaker)

**Context Injection Format:**
```typescript
const aiContext = {
  current_decision: currentDecision,
  relevant_history: [
    {
      decision_id: "dec_abc123",
      date: "2024-09-12",
      situation: "Similar workload decision",
      chosen_action: "Declined Project A",
      outcome: "positive",
      would_repeat: true,
      user_notes: "Had more time to complete MVP deadline"
    }
  ]
};
```

**Key Invariant:** History is EVIDENCE for reasoning, not a RULE. AI should reference past experience without mechanically applying it.

---

### 06. History Display in Decision UI

**Problem:** User must perceive that FutureMe remembers and uses their past experience.

**Solution:** Show relevant history with clear indication that AI reasoning considered it.

**UI Pattern:**
```
┌─ Similar Past Decisions ─────────────────────────────┐
│ September 12 · Opportunity                           │
│ Declined Project A to focus on your MVP.             │
│ Positive outcome · Would repeat                      │
│                                                      │
│ You reported having more time to complete your MVP.  │
│                                                      │
│ ℹ FutureMe is considering this previous experience   │
│   in your current recommendation.                    │
└──────────────────────────────────────────────────────┘

┌─ Current Recommendation ─────────────────────────────┐
│ Consider declining Project B if its time commitment  │
│ conflicts with your MVP deadline.                    │
│                                                      │
│ Your previous experience suggests that protecting    │
│ focused project time has been valuable to you.       │
│                                                      │
│ [Decline Project B]  [Join Project B]               │
│ [Decide Later]       [Choose Another Approach]      │
└──────────────────────────────────────────────────────┘
```

**Display Rules:**
- Show top 2 most relevant past decisions
- Include date, category, chosen action, outcome, would-repeat
- Include user's outcome notes if present
- Explicit indicator: "FutureMe is considering this previous experience"
- If NO relevant history exists: hide section entirely (don't show empty state)

**AI Reasoning Requirements:**
- Must reference specific past decision in natural language
- Avoid mechanical application: "You always decline" ❌ → "Your previous experience in similar high-workload contexts suggests..." ✅
- Acknowledge when history conflicts with current context: "Although you previously..., your current goals have shifted..."

**Key Invariant:** History informs recommendations contextually, not absolutely. FutureMe learns "what mattered in that context", not "user preference rules".

---

## SCOPE

**In Scope:**
- Decision choice persistence with action-based UI
- Context-aware outcome check-in scheduling (event-based + time-based)
- Outcome + feedback capture with explicit "too early" option
- Outcome correction UI (edit past outcomes)
- History retrieval integrated into decision evaluation pipeline
- History injection into AI reasoning context (structured prompt)
- History display in decision UI with AI reasoning that references past decisions
- Proactive in-app check-in cards (dashboard)
- Manual debug trigger for check-ins (demo/dev utility)

**Explicitly Out of Scope:**
- Model fine-tuning, weight adjustment, or policy learning
- Semantic embeddings for matching (use keyword overlap + category + time for MVP)
- Decision analytics dashboard (separate future phase)
- Email/push/SMS notifications (in-app only)
- Decision choice editing (outcomes can be edited; original choices cannot)
- Complex scheduling engine (simple event-based + time-based rules only)

---

## ACCEPTANCE CRITERIA

### Decision Capture
- [ ] User records choice with unambiguous action buttons
- [ ] "Decline Project A" and "Join Project A" clearly represent actual actions
- [ ] "Decide Later" marks status as deferred and does NOT trigger outcome check-in
- [ ] "Choose Another Approach" captures free text custom choice
- [ ] User choice stored separately from AI recommendation
- [ ] Same decision can have choice ≠ recommendation without error

### Check-in Scheduling
- [ ] Check-in scheduled at `event_end_time + 1 day` when related calendar event exists
- [ ] Check-in scheduled at `decision_time + 3 days` when no event timing available
- [ ] Proactive check-in card appears on dashboard when due
- [ ] Manual "Trigger Check-in Now" button works in demo/dev mode
- [ ] Deferred decisions do NOT appear in check-in queue

### Outcome Capture
- [ ] Check-in UI offers Positive / Neutral / Negative / Too Early
- [ ] "Too Early to Tell" does NOT record an outcome (status remains pending)
- [ ] "Too Early" does NOT ask would-repeat question
- [ ] Recording actual outcome (Positive/Neutral/Negative) proceeds to would-repeat question
- [ ] Would-repeat question: "Would you make the same choice again? Knowing what you know now."
- [ ] Outcome notes field is optional
- [ ] User can skip would-repeat + notes and still save outcome

### Outcome Correction
- [ ] User can edit a previously recorded outcome from Past Decisions view
- [ ] Edit form pre-fills current outcome, would-repeat, notes
- [ ] User can update outcome (positive ↔ neutral ↔ negative)
- [ ] User can update would-repeat (yes ↔ no)
- [ ] User can update outcome notes
- [ ] Corrected outcome persists successfully
- [ ] Subsequent recommendations use corrected outcome
- [ ] Original decision choice cannot be edited (correct UI constraint)

### History Retrieval & Injection
- [ ] History retrieved BEFORE recommendation generation (not after)
- [ ] Retrieval filters: same category, within 6 months, outcome not pending
- [ ] Retrieval ranks by keyword overlap + goal alignment + recency
- [ ] Returns top 2 most relevant decisions
- [ ] History injected into AI context as structured data
- [ ] AI reasoning references specific past decisions in generated text
- [ ] AI reasoning uses contextual application, not mechanical rules

### History Display
- [ ] Decision UI shows top 2 relevant past decisions
- [ ] Display includes: date, category, chosen action, outcome, would-repeat, notes
- [ ] Explicit indicator: "FutureMe is considering this previous experience"
- [ ] When NO relevant history exists, section hidden entirely (no empty state)
- [ ] AI reasoning text references past experience naturally
- [ ] Recommendation acknowledges when history conflicts with current context

### Learning Loop Verification
- [ ] Full cycle test: record decision → record outcome → new similar decision uses history
- [ ] Correction cycle test: record positive → correct to negative → new decision uses corrected outcome
- [ ] AI reasoning explicitly mentions past decision ID in logs (for tracing)
- [ ] Decision IDs used internally for tracing; not exposed in user-facing UI
- [ ] Test verifies history injection actually changes AI output (not just UI display)

---

## VERIFICATION

### Unit Tests
- Decision choice persistence (all four actions: accept/decline/defer/custom)
- Check-in scheduling logic (event-based vs time-based)
- History retrieval ranking (category + keywords + recency + outcome status filtering)
- Outcome correction (update preserves decision choice, updates outcome/would-repeat/notes)
- "Too early" does not create completed outcome record

### Integration Tests
- Full learning loop: decide → check-in → outcome → new similar decision retrieves history
- History injection: verify retrieved history appears in AI reasoning context before generation
- Correction propagation: update outcome → verify next recommendation uses corrected data
- Deferred decision: verify defer does NOT trigger check-in
- Custom choice: verify free text captured and stored

### Browser/E2E Tests
- Record choice with action buttons
- Manual trigger check-in (demo mode)
- Record outcome (Positive/Neutral/Negative)
- Select "Too early" and verify no would-repeat question
- Record would-repeat + notes
- Edit past outcome and verify updated
- New decision shows relevant history with AI reasoning referencing it
- No relevant history → section hidden

### Evidence Requirements
- Backend tests PASS with coverage >75%
- Frontend tests PASS
- Backend lint/build PASS
- Frontend lint/build PASS
- Browser proof: full cycle from choice → outcome → new decision shows history
- Logs show AI reasoning received injected history context
- Logs show AI output references specific past decision(s)

---

## STOP CONDITIONS

**Escalate to Product Owner if:**
- History retrieval consistently returns irrelevant decisions (matching logic needs product refinement)
- AI reasoning ignores injected history (prompt engineering issue requiring human review)
- Check-in timing feels wrong in practice (event detection heuristic needs adjustment)
- "Too early" option used >50% of time (timing strategy fundamentally wrong)
- Outcome correction becomes primary workflow instead of exception (data quality or timing problem)

**Escalate to Supervisor if:**
- Attempting same implementation approach 3+ times without progress
- Fundamental technical blocker (e.g., AI provider doesn't support history injection)
- Test evidence contradicts expected behavior and root cause unclear after investigation
- Scope expanding beyond Phase 6 contract without explicit approval

---

## DEPENDENCIES

- **Phase 4:** Decision evaluation logic with RECOMMEND/ASK/ABSTAIN states
- **Phase 5:** Context maintenance for up-to-date calendar event timing
- **Phase 3:** Calendar sync for event_end_time availability

---

## PITFALLS

1. **History displayed but not injected**: UI shows past decisions but AI generates recommendation without seeing them → appears to work but doesn't actually learn
2. **Defer triggers check-in**: "Decide Later" treated as final decision → premature outcome requests confuse users
3. **"Too early" forces feedback**: Asking would-repeat after user said they can't assess yet → low-quality data
4. **Mechanical history application**: "You always decline opportunities" → ignores context, becomes rigid rule instead of evidence
5. **Missing correction path**: Bad outcome data persists indefinitely → learning loop trains on wrong information
6. **Check-in timing ignores events**: Always 3-day delay even when event is 2 weeks away → asks before outcome knowable
7. **History shown for ABSTAIN state with no reasoning**: UI shows past decisions but AI explicitly said "I can't advise" → confusing juxtaposition
8. **Decision ID exposed in UI**: Internal tracing IDs leak into user-facing text → technical debt visible to users

---

## SUCCESS METRICS (Qualitative, for demo)

- User can demonstrate: "I declined Project A, it went well, now FutureMe remembers that when I face Project B"
- AI reasoning visibly references past experience: "Based on your previous experience declining Project A..."
- User can correct a past outcome and see the correction reflected in next recommendation
- Check-in appears at appropriate time (not too early, not weeks late)
- "Too early" option used <30% of time (indicates timing mostly correct)
- History section appears when relevant, hidden when not (no empty states or irrelevant matches)

---

**Approved for implementation. Technical architecture and API design decisions remain with implementation owner.**
