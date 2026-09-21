# Future Me Decision Ecosystem — Final Solution Selection

**Artifact role:** This is the ONE primary solution-selection report for the Future Me decision ecosystem. It supersedes the broader Pass-B solution catalog as the decision record for the five-day MVP. Contracts remain authoritative; this report does not amend them.

**Revision basis:** [Pass-C independent critique](pass-c/critic-report.md), [Pass-C edge-case catalog](pass-c/edge-case-catalog.md), the four authoritative contracts, and the in-repository Pass-A audits.

## 1 Executive Technical Thesis

Select the smallest coherent product slice: a local, seeded, user-invoked assistant for one reversible decision—whether to attend an optional Saturday workshop. It uses explicit structured facts, deterministic constraints and trade-offs, a visible status-quo option, at most one clarification per decision-support turn, user-owned choice, and separate narrative history.

The slice may make only three clearly separated claim levels:

1. **Level 1 — deterministic contract demonstration:** the same fixture and policy produce the same disposition, and a named reality change produces an explainable change.
2. **Level 2 — technical validity of provenance and replay:** evidence, assessments, policy version, recommendation, choice, and reset/replay can be traced and reproduced.
3. **Level 3 — empirical usefulness or improved decision support:** requires later user-grounded evaluation and is not an MVP claim.

The MVP is not a general decision engine, psychological state model, forecasting system, semantic-memory system, intervention system, or learning policy. Those mechanisms are either **DEFERRED** behind prerequisites or **REJECTED** for the five-day slice.

## 2 Final Decision Ecosystem

### Selected control flow

1. Load named, local fixtures and their explicit coverage state.
2. Preserve each immutable evidence assertion and its occurrence/copy lineage.
3. Apply a versioned, decision-scoped assessment for freshness, conflict, admissibility, and assessed independence.
4. Retain the canonical PersonalState boundary; provisional facets cannot influence ordering.
5. Present exactly three meaningful options: Attend, Decline / keep the status quo, and Defer until the RSVP cutoff.
6. Check option completeness, explicit hard constraints, stakes, and reversibility.
7. Ask at most one bounded question during the turn only if one answer can change the disposition.
8. Produce RECOMMEND, ASK, ABSTAIN, or NO-OP under a deterministic policy.
9. Record the recommendation separately from the user’s choice.
10. Store narrative outcome and feedback separately; do not treat either as analytic evidence.
11. Reset to a fixture hash and replay the same path.

### Selected boundaries

Every selected layer is intentionally smaller than its likely production successor. “Confidence” below is confidence that the boundary is appropriate for this five-day deterministic slice, not confidence in a prediction or product outcome.

| Layer | Purpose | Inputs | Outputs | What it knows | What it does not know | Mechanism | Assumptions | Failure modes | Confidence |
|---|---|---|---|---|---|---|---|---|---|
| Evidence | Preserve reviewable facts and their history | Named local fixtures, timestamps, source references, corrections | Immutable assertions, occurrences, lineage, scoped assessments | Fixture content, source, valid/recorded time, explicit correction links | Truth outside fixtures, connector completeness, independent corroboration unless assessed | Structured records with content hashes and typed lineage | Fixtures are correctly seeded and clocks/timezones are explicit | Stale assertion treated as current; copy counted as corroboration; correction overwrites history | HIGH |
| Belief | Record what the system currently accepts for one decision | Assertions, occurrences, policy version, decision scope | Freshness, conflict, admissibility, and independence assessments | Which represented claims are usable under the named policy | Objective truth, user psychology, source reliability beyond the assessment | Versioned `EvidenceAssessment`; assertions remain immutable | P0 assessment rules are approved predicate by predicate | Assessment leaks across scopes; UNKNOWN treated as independent or current | HIGH |
| State | Preserve the authoritative contract boundary without inventing psychology | Canonical `PersonalState`, admissible evidence, concrete reason tags | One revisable canonical state or UNCERTAIN | Only the contract-defined interpretation supported by represented evidence | Latent emotion, intent not explicitly represented, capacity not evidenced | Normative contract fallback; state is ignored when unnecessary to the hero rule | Contract vocabulary remains authoritative; reason tags are sufficient for traceability | Facets affect ordering; low evidence is attributed to the person instead of the system | HIGH |
| Forecast | Make absence explicit and prevent accidental predictive language | None in MVP | `forecast_status: ABSENT` | That no eligible forecast exists | Any future probability, outcome likelihood, calibration, or confidence interval | No forecast computation | Deterministic constraints are sufficient for the hero slice | A score, confidence, or scenario result is mislabeled as a forecast | HIGH |
| Dependency | Represent the few facts that determine hero feasibility | Workshop interval, work duration, deadline, confirmed windows, cutoff | Typed direct edges and constraint results | Direct fixture relationships only | Recurrence, DST exceptions, hidden capacity, transitive real-world dependencies | Minimal typed relationship ontology and deterministic propagation | All relevant hero relationships are explicitly represented | Missing edge interpreted as no dependency; unsupported temporal input is expanded | HIGH |
| Scenario | Show how one explicit reality correction changes the result | S0 or S1 snapshot plus the same deterministic policy | Before/after constraint results and sensitivity note | Consequences inside the represented model | What would happen in the world; causal effects; unrepresented branches | Two deterministic snapshot evaluations | Snapshots differ only by visible linked evidence | Scenario described as prediction, counterfactual estimate, or causal conclusion | HIGH |
| Decision | Convert represented constraints and user-owned criteria into a disposition | Context, canonical state, forecast-absent marker, dependencies, confirmed options and criterion | Trade-offs plus RECOMMEND, ASK, ABSTAIN, or NO-OP | Feasibility under explicit facts and whether the narrow recommendation rule is satisfied | Complete option universe, hidden preferences, global optimality | Deterministic checks; no hidden weights | Low stakes, reversible choice, confirmed option set and criterion | Feasibility becomes desirability; status quo omitted; unknowns hidden | HIGH |
| Retrieval | Fetch only the records required by the hero policy | Exact IDs/types, decision scope, coverage requirements | Ordered record set plus coverage state | Which seeded records matched and which required classes were searched | Semantic relevance, external history, truth of missing sources | Exact deterministic local filter | Seed manifest and required evidence classes are stable | NO_MATCH substituted for NOT_SEARCHED/UNAVAILABLE; stale record returned | HIGH |
| Asking | Acquire one material missing fact without coercion | Disposition blockers, sensitivity check, turn budget | One bounded question or ABSTAIN | Whether one answer could change the disposition | Answers the user does not provide; sensitive facts not in scope | One in-app, skippable question per decision-support turn | User invoked support and urgency permits a reply | Multiple questions, sensitive inquiry, or hidden burden judgment | HIGH |
| Proactive behavior | Prevent unapproved interruption | Any event | NO-OP | That proactive eligibility is not approved | Receptivity, urgency, burden, quiet-hour safety | Constant NO-OP policy | User invocation is the only MVP entry point | Notification, retry, or inferred availability occurs | HIGH |
| Learning | Preserve history without adapting policy | Recommendation, independent choice, narrative outcome, subjective feedback | Separate non-analytic events marked analytically ineligible | What the user explicitly recorded | Exposure, causal effect, calibrated outcome, policy improvement | Append-only narrative history; no updates to rules or weights | History can be useful for replay without being analytic data | Silence becomes outcome; feedback becomes ground truth; policy changes | HIGH |
| Privacy | Bound data and processing to the demonstrable local slice | Seeded non-personal fixtures and minimal reason-code logs | Local views, revocation state, no external transmission | The declared local data flow | External provider behavior, backup deletion, live-source copies | Local deterministic processing with external paths disabled | Seed data contains no real person or third-party content | Raw text logged; provider accidentally enabled; deletion overclaimed | HIGH |

## 3 Evidence Strength Map

Every important conclusion is assigned one, and only one, of the permitted evidence classes. These labels describe support for the conclusion; they are not numeric confidence scores.

| Important conclusion | Classification | Basis and limit |
|---|---|---|
| Contracts require user-owned choice, recommendation/choice separation, canonical `PersonalState`, and distinct Outcome and Feedback records | STRONG DIRECT EVIDENCE | Directly stated in the four authoritative in-repository contracts; says nothing about benefit |
| Immutable assertions plus versioned assessments and provenance improve traceability and replayability | STRONG MECHANISM — TRANSFER REQUIRES VALIDATION | Provenance/bitemporal mechanisms transfer well, but Future Me implementation quality still requires tests |
| Copied occurrences must not count as independent corroboration by default | STRONG MECHANISM — TRANSFER REQUIRES VALIDATION | Lineage addresses a known aggregation error; the exact policy must be validated in the slice |
| Explicit constraints, status quo, reversibility, and sensitivity are appropriate decision-analysis primitives | STRONG MECHANISM — TRANSFER REQUIRES VALIDATION | The primitives are established; their product presentation and user interpretation require validation |
| Exact local retrieval is sufficient for the named fixture path | PLAUSIBLE PRODUCT HYPOTHESIS | It covers the declared hero evidence classes, but runtime acceptance results are not yet recorded |
| The deterministic workshop slice can demonstrate changed-context reasoning and replay | PLAUSIBLE PRODUCT HYPOTHESIS | The fixtures and oracles are specified; implementation and runtime results remain unverified |
| The selected slice improves user decisions or is useful to users | INSUFFICIENT EVIDENCE | No user-grounded evaluation is reported |
| Provisional facets should replace the canonical state contract now | REJECTED | Conflicts with current authority and lacks approved semantics |
| Numeric forecasting is ready for the MVP | REJECTED | No target, labels, horizon, baseline, temporal split, or calibration evidence exists |
| Forecast/calibration methods could later structure evaluation once prerequisites exist | SUPPORTED TRANSFER HYPOTHESIS | Method vocabulary transfers conditionally; product applicability remains unvalidated |
| Scenario planning supports conditional before/after exploration without causal wording | STRONG MECHANISM — TRANSFER REQUIRES VALIDATION | The mechanism is suitable for transparent conditional reasoning, not prediction |
| JITAI and microrandomized-trial concepts could later structure proactive eligibility and evaluation | SUPPORTED TRANSFER HYPOTHESIS | Transfer depends on availability, burden, exposure, assignment, and outcome instrumentation |
| Causal inference could later evaluate a precisely defined intervention effect | SUPPORTED TRANSFER HYPOTHESIS | Requires an estimand, defensible assignment, confounding control, and eligible outcomes |
| Semantic retrieval or an external LLM is needed for the hero slice | REJECTED | The slice has fixed structured inputs and deterministic language; added privacy risk has no demonstrated need |
| Truth discovery, source scoring, or belief aggregation should resolve MVP conflicts | REJECTED | Independence and source-quality assumptions are unavailable, while explicit conflict/abstention is safer |
| End-to-end deletion compatibility is achieved | INSUFFICIENT EVIDENCE | Only local retrieval revocation is represented; snapshots, backups, providers, and external copies are unresolved |
| The unavailable predecessor research is portable and reproducible | INSUFFICIENT EVIDENCE | No allowed archive or normalized manifest is present |

### Admissibility order

1. Authoritative contract facts.
2. Explicit user-confirmed, fixture-scoped facts.
3. Source assertions with visible provenance and decision-scoped assessment.
4. Derived constraints with complete parent lineage.
5. Provisional annotations for display only.

Source count is not evidence independence. Three connector copies of one calendar item remain one underlying occurrence unless independence is positively assessed. In the MVP, corroboration has no effect unless an assessment explicitly establishes independence.

## 4 Mechanism Decision Matrix

Alternatives appear only where they justify a SELECT, DEFER, REJECT, or UNRESOLVED disposition.

| Layer | Problem | Candidates | Selected Direction | Why | Evidence Strength |
|---|---|---|---|---|---|
| Evidence | Facts change and copies can masquerade as corroboration | Mutable row; immutable assertion plus scoped assessment; source score | **SELECT — immutable assertion plus scoped assessment and copy lineage** | Preserves history and makes independence explicit | STRONG MECHANISM — TRANSFER REQUIRES VALIDATION |
| State | Preserve contract authority while representing uncertainty | Canonical enum; new facets; latent score | **SELECT — canonical enum fallback; DEFER facets** | Avoids a silent contract amendment and psychological overreach | STRONG DIRECT EVIDENCE |
| Forecast | Represent future uncertainty | No forecast; heuristic score; trained probability | **SELECT — no MVP forecast; DEFER forecasting** | Target, labels, horizon, and evaluation are absent | REJECTED |
| Dependency | Detect workshop/deadline feasibility | Direct typed edges; general graph; optimizer | **SELECT — direct typed fixture constraints; REJECT general solver** | Direct relationships fully express the hero predicate | PLAUSIBLE PRODUCT HYPOTHESIS |
| Scenario | Explain changed reality | Two snapshots; Monte Carlo simulation; causal counterfactual | **SELECT — deterministic S0/S1 evaluation; REJECT probabilistic and causal variants** | The report can show conditional consequences without pretending to predict | STRONG MECHANISM — TRANSFER REQUIRES VALIDATION |
| Decision | Turn represented facts into a safe disposition | Explicit constraint policy; hidden weighted score; unconstrained deliberation | **SELECT — explicit criteria, constraints, trade-offs, and abstention** | Testable and preserves user ownership | STRONG DIRECT EVIDENCE |
| Retrieval | Get relevant hero context | Exact local filter; semantic/vector search; unrestricted history | **SELECT — exact local filter; REJECT semantic retrieval for MVP** | Required classes and coverage are enumerable | PLAUSIBLE PRODUCT HYPOTHESIS |
| Information acquisition | Resolve material uncertainty | One bounded question; multi-step interview; silent inference | **SELECT — one question then ABSTAIN** | Makes burden and uncertainty visible | PLAUSIBLE PRODUCT HYPOTHESIS |
| Proactive support | Decide whether to interrupt | NO-OP; rule-based prompt; learned JITAI | **SELECT — NO-OP; DEFER proactive support** | Eligibility, availability, cooldown, and burden policy are absent | STRONG DIRECT EVIDENCE |
| Learning | Improve future policy | Narrative history; supervised update; bandit/RL | **SELECT — non-analytic history; REJECT adaptive MVP** | Exposure and eligible outcomes do not exist | STRONG DIRECT EVIDENCE |
| Privacy/LLM | Explain results without unsafe external processing | Local template; local model; external LLM | **SELECT — local deterministic template; DEFER external LLM** | Provider and deletion terms are unresolved and no LLM is needed | STRONG DIRECT EVIDENCE |
| Deletion | Define the truthful deletion promise | Local revocation; end-to-end deletion workflow | **SELECT — local retrieval revocation only; UNRESOLVED — production deletion compatibility** | Only the local store and derived views are controlled in the MVP | INSUFFICIENT EVIDENCE |
| Outcome evaluation | Distinguish narrative from analytic evidence | Narrative record; target-qualified analytic outcome | **SELECT — narrative only; DEFER analytic eligibility** | Target semantics and observation rules are absent | STRONG DIRECT EVIDENCE |

## 5 Mechanism Transfer Matrix

| Source Domain | Mechanism | Original Problem | Future Me Transfer | Assumptions | Failure Modes | Confidence |
|---|---|---|---|---|---|---|
| Data provenance and bitemporal systems | Immutable assertion, valid/recorded time, lineage, versioned assessment | Reconstruct what was known, when, and from where | **SELECT narrowly:** evidence/assessment separation, correction links, decision-time replay | Stable IDs, trustworthy timestamps, complete lineage capture | Overwrite destroys history; copied sources appear independent; replay uses current assessment | HIGH for mechanism; MEDIUM for product transfer |
| Decision analysis | Constraints, explicit criteria, trade-off and sensitivity display | Compare alternatives without hiding value judgments | **SELECT without invented weights:** represent feasibility, reversibility, stakes, and user-confirmed criterion | Options and hard constraints are adequately represented | Feasibility becomes desirability; omitted option; arbitrary weight presented as user value | HIGH for mechanism; MEDIUM for product transfer |
| Scenario planning | Conditional scenario comparison | Explore consequences under differing assumptions | **SELECT narrowly:** evaluate S0 and S1 fixture snapshots | Scenario inputs and changed facts are explicit | Scenario treated as prediction or causal counterfactual; unrepresented branch omitted silently | HIGH for mechanism; MEDIUM for product transfer |
| Forecasting and calibration | Defined target, horizon, baseline, temporal evaluation, calibration | Estimate future event probabilities and test reliability | **DEFER; retain eligibility gates only** | Stable target, representative labels, chronological evaluation, regime comparability | Leakage, target drift, uncalibrated confidence, selective resolution | HIGH for prerequisites; LOW for current product applicability |
| Conformal prediction | Coverage under stated exchangeability conditions | Produce uncertainty sets with coverage guarantees | **DEFER:** transfer assumption/coverage discipline, not intervals | Exchangeability or a justified variant and defined nonconformity score | Coverage language survives after assumptions fail; marginal coverage misread per person | MEDIUM for later transfer |
| JITAI design | Availability, decision point, intervention option, tailoring variable, burden | Deliver support at a suitable moment | **DEFER; proactive MVP remains NO-OP** | Approved availability, urgency, cooldown, sensitivity, and burden policies | Intrusion, unsafe timing, repeated prompting, inferred receptivity | MEDIUM for vocabulary; LOW for enabling a feature |
| Microrandomized trials | Repeated randomization and proximal outcome measurement | Estimate time-varying intervention effects | **DEFER evaluation design** | Ethical randomization, assignment logging, exposure, eligible proximal outcome | Missing exposure, nonresponse bias, interference, underpowered or mis-scoped estimand | MEDIUM for later method selection |
| Causal inference | Explicit estimand, assignment/confounding assumptions, bounded effect claim | Estimate effect rather than association | **DEFER; prohibit causal language in MVP** | Defensible design, positivity, consistency, measured confounding where required | Selection bias, post-treatment adjustment, effect transported beyond scope | HIGH for boundary; LOW for Future Me effect claims |
| Truth discovery | Source reliability and conflict aggregation | Infer truth from conflicting multi-source claims | **REJECT for MVP** | Multiple sufficiently independent sources and identifiable reliability | Copies counted as corroboration; minority truth suppressed; opaque reliability score | LOW for this slice |
| Belief functions | Mass assignment and belief/plausibility intervals | Represent epistemic uncertainty across hypotheses | **REJECT pending demonstrated need** | Defensible frame and mass assignment | Arbitrary masses create false formality; conflict combination obscures provenance | LOW for this slice |
| LLM deliberation | Natural-language synthesis under constraints | Explain or generate reasoning over complex context | **DEFER external LLM; use deterministic template** | Approved provider terms, prompt isolation, confirmation gates, reliable structured result | Prompt injection, invented options/criteria, data leakage, persuasive unsupported rationale | LOW for MVP need; UNRESOLVED for production |

Transfer is methodological, not evidence that any mechanism improves this product.

## 6 Evidence Model

### Concrete representations

| Representation | Required fields | MVP behavior |
|---|---|---|
| Evidence | `assertion_id`, `predicate`, `object`, `valid_time`, `recorded_time`, `source_ref`, `content_hash` | Immutable factual assertion; never silently overwritten |
| Belief | `assessment_id`, `assertion_id`, `occurrence_id`, `decision_scope_id`, `policy_version`, `freshness`, `conflict`, `admissibility`, `independence_relation`, `assessed_at` | Versioned system assessment for one decision; not objective truth |
| State | `state_id`, canonical `PersonalState`, `reason_tags`, `evidence_ids`, `assessment_ids`, `as_of`, `policy_version` | Revisable contract state; ignored by the hero rule if it adds no admissible constraint |
| Inference | `inference_id`, `rule_id`, `rule_version`, `parent_ids`, `result`, `generated_at`, `decision_scope_id` | Deterministic derivation with complete parents; recomputed after relevant revision |
| Forecast | `forecast_status: ABSENT`, `target: null`, `issue_time: null`, `horizon: null`, `value: null` | Explicitly absent in MVP; no probability, score, or calibrated confidence |
| Outcome | `outcome_id`, `decision_id`, `description`, `reported_at`, `source: USER_NARRATIVE`, `analytic_status: ANALYTICALLY_INELIGIBLE` | Optional narrative history; never treated as target resolution |
| Feedback | `feedback_id`, `decision_id`, `helpfulness_text_or_rating`, `reported_at`, `analytic_status: ANALYTICALLY_INELIGIBLE` | Optional subjective response stored separately from Outcome |

Supporting records are `ClaimOccurrence(occurrence_id, assertion_id, source_occurrence_ref, observed_at)`, `LineageEdge(child_id, parent_id, relation)`, and `DecisionSnapshot(decision_id, assertion_ids, assessment_ids, inference_ids, policy_version, fixture_hash, generated_at)`. `LineageEdge.relation` is limited to `COPIED_FROM`, `DERIVED_FROM`, `CORRECTS`, or `RETRACTS`.

### Conflict, freshness, revision, and provenance behavior

- **Conflict:** incompatible admissible assertions remain visible. A predicate-specific P0 rule may select an explicit correction; otherwise `conflict: UNRESOLVED` makes the affected constraint unknown and yields ASK or ABSTAIN. Conflict is never averaged away.
- **Freshness:** freshness is assessed per predicate, occurrence, decision scope, and policy version using explicit validity, expiry, or correction. Age alone does not prove staleness, and past confirmation does not prove current validity.
- **Revision:** `EvidenceAssertion` is immutable. A correction or retraction creates a new assertion and linked event; derived inferences that depend on the superseded assertion are invalidated for the new snapshot while old snapshots remain replayable.
- **Provenance:** every assertion names a source reference and content hash; every inference names all parents and a rule version; every recommendation names its snapshot and policy version. Missing lineage makes the item inadmissible for recommendation.
- **Replay:** replay uses the exact fixture hash, assertions, assessment versions, inference rules, and policy version captured at decision time, not today’s assessment.

### Copy-lineage rule

A copied item retains a shared root occurrence. The test fixture **FX-COPY-ROOT-01** appears through **FX-COPY-CALENDAR-01**, **FX-COPY-EMAIL-01**, and **FX-COPY-NOTES-01**. Acceptance test **FM-COPY-3** requires all three to contribute zero additional corroboration until independence is explicitly assessed. The default assessment is UNKNOWN, not independent.

## 7 Personal State / Belief Model

The authoritative [DOMAIN_CONTRACT.md](../DOMAIN_CONTRACT.md) PersonalState object and enum remain the canonical boundary.

### Normative contract fallback

The following meanings are normative because they come from the current contract. The “MVP resolution” column narrows their use; it does not redefine them.

| Canonical state | Normative contract meaning | MVP resolution |
|---|---|---|
| FLOW | Observed situation is reasonably aligned with current intent | Use only when admissible represented evidence explicitly supports alignment; it does not imply wellbeing or optimality |
| DRIFTING | Observed behavior appears to be gradually diverging from current intent or plan | Use only with explicit longitudinal divergence evidence; the one-shot hero fixtures do not establish it |
| DISRUPTED | A meaningful event invalidated or materially changed the current plan | The linked deadline correction may support this state for the changed snapshot, with `deadline_changed` reason tag |
| OVERLOADED | Known commitments, deadlines, workload, or capacity indicate excessive competing demand | Use only when represented commitments and capacity make competing demand explicit; a single conflict is not automatically overload |
| UNCERTAIN | The system lacks enough trustworthy information to determine the current situation | Mandatory fallback for missing, stale, conflicting, inadmissible, or insufficient state evidence |

These are system beliefs, not objective labels of the person. In the hero path, `DISRUPTED` may document the changed plan, but the recommendation still comes from the explicit deadline/window constraint. If the state is not needed, it is carried for compatibility and has no ordering effect.

### Proposed production semantics are non-normative

The proposed facets—plan_alignment, plan_integrity, and load_feasibility—are **BLOCKED FOR NORMATIVE USE PENDING PO AMENDMENT**. Until an amendment is approved:

- facets may exist only as provisional, non-authoritative annotations;
- they may not determine feasibility, ordering, recommendation, or proactive behavior;
- epistemic uncertainty must be attributed to the system, not the person;
- any adapter back to the canonical enum must document deterministic information loss;
- facet-to-enum mapping may not justify a recommendation.

The safe canonical fallback uses only the existing `PersonalState` contract plus concrete reason tags such as `deadline_changed` or `explicit_time_conflict`. Proposed production semantics—facet definitions, thresholds, aggregation, confidence, update cadence, and loss-aware mapping to the canonical enum—remain **UNRESOLVED** until a PO-approved amendment and user-grounded validation exist. No proposed facet is an MVP feature.

## 8 Forecasting Model

**MVP selection: NO FORECAST.**

The workshop slice has no numeric probability, confidence score, calibrated output, or learned predictor. It compares explicit constraints under two decision snapshots.

| Required concept | Explicit resolution |
|---|---|
| What should be forecast | **UNRESOLVED and absent in MVP.** A later candidate must be a decision-relevant, temporally resolvable event, not “future success,” “best choice,” wellbeing, or a state label |
| What should not be forecast | Hidden intent, personality, moral worth, unobservable “true preference,” general life success, or causal benefit of following a recommendation |
| Observable target | A later proposal must name one event with a versioned operational definition, issue time, horizon, and resolution rule |
| Ground truth | A designated source and timestamped resolution event; user narrative alone is not automatically objective ground truth |
| Proxy | Must be named as a proxy, linked to the target, and tested for mismatch; clicks, acceptance, and helpfulness are not substitutes for the target by default |
| Uncertainty | Separate missing input, epistemic model uncertainty, outcome variability, and changed target semantics; do not compress them into one confidence number |
| Calibration | Prospective or chronological comparison of predicted probabilities with resolved targets, reported by relevant regime and against a simple baseline |
| Evaluation | Predeclared temporal split, target version, missingness handling, baseline, discrimination/error metric where appropriate, calibration metric, and release threshold |
| Unmeasurable constructs | “Right decision,” authentic self, latent flourishing, and complete option quality remain outside analytic claims unless a defensible observable construct is defined |

A later forecast is ineligible unless all of the following exist:

- a versioned target definition;
- issue time and horizon;
- resolution rule and data source;
- immutable training cutoff;
- chronological evaluation against a simple baseline;
- missingness and changed-definition handling;
- population and regime scope;
- calibration and release criteria.

One resolved episode cannot establish calibration or user benefit. Pass-C FG-02 through FG-06 remain later gates, not MVP features. The explicit MVP forecast representation remains `forecast_status: ABSENT`.

## 9 Dependency / Disruption Model

### Representation and minimal relationship ontology

`DependencyEdge(edge_id, from_id, relation, to_id, constraint_value, evidence_ids, valid_time, status)` is the only MVP dependency representation. `relation` is restricted to:

| Relation | Meaning in the slice |
|---|---|
| `CONSUMES_INTERVAL` | An option occupies an explicit time interval |
| `REQUIRES_DURATION_BEFORE` | Remaining work requires a confirmed duration before a deadline |
| `AVAILABLE_DURING` | A user explicitly confirmed a usable interval |
| `CONFLICTS_WITH` | Two represented uses cannot share the same interval under the fixture rule |
| `REVERSIBLE_UNTIL` | A commitment can be changed until an explicit cutoff |
| `CORRECTS` | A later assertion revises a prior represented fact without erasing it |

The MVP supports only these direct, typed dependencies in the hero fixtures:

- workshop attendance consumes Saturday 09:00–13:00 Asia/Ho_Chi_Minh;
- project completion requires a user-confirmed four-hour block before its current deadline;
- the user-confirmed decision criterion is “attend when the project deadline remains feasible”;
- the workshop RSVP can be reversed until Friday 17:00.

### Propagation and consequence boundary

Propagation is deterministic and single-hop except for the explicit chain `deadline correction → availability feasibility → option constraint result → disposition`. A changed parent invalidates dependent inferences in the new snapshot, which are then recomputed in topological fixture order. There is no general graph traversal, learned edge, or inferred transitive relation.

Deterministic consequences are limited to statements such as “under S1, Attend consumes the only confirmed four-hour pre-deadline interval.” Probabilistic consequences are absent: the system does not estimate the chance that the project will finish or that attendance will be beneficial. A constraint result is not an outcome probability.

No recurrence rule, DST transition, all-day interpretation, resource capacity inference, or transitive dependency graph is supported. A recurring event, missing timezone, ambiguous local time, or exception series yields ASK if one answer can resolve it; otherwise ABSTAIN. The system never treats an empty calendar as availability.

The deadline correction is a linked event, not an overwrite. It invalidates the prior derived feasibility assessment for the new decision snapshot while preserving the earlier snapshot for replay.

The causal boundary is strict: an edge represents a declared scheduling or lineage relation, not a claim that one real-world event causes another. The model may derive represented feasibility; it may not conclude that attendance causes delay, that declining causes completion, or that the recommendation causes any user outcome.

## 10 Scenario Reasoning

The exact hero scenario is conditional and noncausal.

| Language | Explicit meaning and MVP rule |
|---|---|
| Prediction | A claim about an observable future target before resolution. **Absent in MVP; do not use this label for a constraint result.** |
| Scenario Simulation | Evaluation of declared rules under a specified hypothetical or changed snapshot. **Selected for S0/S1, deterministic only.** |
| Counterfactual Estimate | An estimate of what would have happened to the same unit under an unobserved alternative action. **Not produced; the two option branches are not identified causal counterfactuals.** |
| Causal Conclusion | A claim that an action or exposure changes an outcome. **Prohibited without a defined estimand and defensible causal design.** |

| Snapshot | Explicit facts | Deterministic result |
|---|---|---|
| S0 — baseline | Project due Monday 17:00; four hours remain; Sunday 13:00–17:00 is user-confirmed available; workshop is Saturday 09:00–13:00 | Attend satisfies the confirmed criterion and remains reversible before the cutoff |
| S1 — changed reality | A correction moves the project deadline to Sunday 12:00; Saturday 09:00–13:00 is the only user-confirmed four-hour window before the deadline | Attend violates the hard deadline constraint; Decline / status quo preserves the only represented feasible window |

Required wording is: **“Scenario Simulation: given these represented inputs and rules, this option has this constraint result.”** The report does not call the result a Prediction, Counterfactual Estimate, or Causal Conclusion. It claims only that the declared inputs change the deterministic constraint result. It does not claim that attending, declining, or following the recommendation causes project completion, wellbeing, or any other outcome.

Sensitivity is visible: if another confirmed four-hour window exists before Sunday 12:00, the S1 disposition returns to ASK or trade-off display rather than keeping the earlier recommendation.

## 11 Decision Reasoning Model

### Full reasoning path and responsibility boundary

The selected path is explicit and complete:

`context + canonical state + forecast_status: ABSENT + typed dependencies + user-confirmed preferences/criteria → represented option feasibility → visible trade-offs → deterministic disposition → recommendation record → independent human choice`

| Stage | Structured calculation | Statistical inference | LLM | Human judgment |
|---|---|---|---|---|
| Context assembly | Exact local filter, coverage-state calculation, provenance checks | None | None | User supplies or confirms missing facts |
| State | Contract-state fallback and reason tags | None | None | User may correct represented context; no psychological label is imposed as truth |
| Forecast | Emit `ABSENT` marker | None | None | No forecast interpretation requested |
| Dependencies | Interval/duration/deadline constraint evaluation | None | None | User confirms availability and remaining-work facts |
| Preferences and criteria | Validate explicit criterion and option confirmation | None; no learned weights | None | User owns criteria, values, and any relative importance |
| Trade-offs | Display feasibility, reversibility, stakes, and uncertainty separately | None | None | User interprets trade-offs and may add an option |
| Recommendation | Apply versioned RECOMMEND/ASK/ABSTAIN/NO-OP rules | None | None; deterministic template only | User accepts, rejects, defers, or chooses another option |

Structured calculation is the only automated reasoning mechanism in the MVP. There is no statistical model and no external LLM. Human judgment supplies values and makes the final choice; it is not silently converted into a model weight.

### Required option record

Each option carries origin, user_confirmation, feasibility, reversibility, stakes, external_commitment, and supporting evidence IDs.

The workshop option set is:

1. **Attend workshop** — low stakes; reversible until RSVP cutoff; consumes four hours.
2. **Decline / status quo** — no new commitment; preserves the workshop window.
3. **Defer until Friday 17:00** — preserves choice only while the cutoff remains open.

The interface always warns that it reasons over represented options, not all possible options. It invites the user to add alternatives. “Only represented feasible option” is a feasibility statement, not sufficient by itself for recommendation.

### Disposition policy

1. Reject unconfirmed model-suggested options or criteria from ordering.
2. Require a meaningful status quo / no-action / defer alternative.
3. Display reversibility and stakes separately; do not assign their weights.
4. Apply only explicit hard constraints with admissible, current evidence.
5. For irreversible or high-stakes decisions, ABSTAIN unless the user confirms the option set and relevant criteria; the MVP workshop slice is deliberately neither.
6. RECOMMEND only when the option set and criterion are explicitly user-confirmed, required evidence classes are covered, and one option deterministically satisfies the criterion while alternatives do not.
7. Otherwise ASK once if one material answer can change the result; else ABSTAIN.
8. Preserve recommendation and user choice as separate events.

The user may choose any option without being marked wrong.

## 12 Context Retrieval

MVP retrieval is an exact, deterministic filter over seeded local records. It has no embeddings, similarity ranking, or unrestricted history.

The retrieval request is `RetrievalRequest(decision_scope_id, required_evidence_classes, allowed_record_types, as_of, policy_version)`. The response is `RetrievalResult(matched_ids, excluded_ids_with_reason, per_class_coverage, query_version, fixture_hash)`. Eligibility requires the decision scope, an allowed record type, admissible provenance, and temporal validity under the P0 rule. Ordering is stable by required evidence class and stable ID; it is not relevance ranking.

### Coverage state

| State | Meaning |
|---|---|
| COMPLETE_FOR_HERO | Every required hero evidence class is represented and current under the P0 policy |
| INCOMPLETE | At least one required class was searched but coverage is partial |
| NOT_SEARCHED | A required source/class has not been queried |
| UNAVAILABLE | A required source/class cannot be accessed |
| NO_MATCH | Search completed for the class and found no matching record |

NO_MATCH is never substituted for NOT_SEARCHED, INCOMPLETE, or UNAVAILABLE. Required hero classes are current deadline, remaining work, explicitly confirmed time window, workshop interval and cutoff, option set, stakes/reversibility, and decision criterion.

Cold start begins as NOT_SEARCHED or UNAVAILABLE, never COMPLETE_FOR_HERO. A completeness-dependent decision with missing classes yields ASK once or ABSTAIN. Retrieval output cannot certify its own sufficiency.

Imported text is untrusted data. Extraction is isolated from deliberation: raw text is not placed in a prompt that can propose criteria, options, recommendations, or actions. Any later model-suggested option or criterion must show its origin and remain excluded until explicit user confirmation. If this separation is unavailable, use the deterministic template.

| Retrieval condition | Required behavior |
|---|---|
| Required class COMPLETE_FOR_HERO | Pass represented records to deterministic reasoning |
| One resolvable material gap | ASK one bounded question |
| Multiple gaps, unavailable source, unresolved conflict, or inadmissible provenance | ABSTAIN |
| Exact query finds nothing | Return NO_MATCH for that class; never infer availability or nonexistence outside the store |
| Revoked local record | Exclude it and invalidate derived local views for the new snapshot |

Live connectors, semantic retrieval, cross-user memory, embeddings, and automated sufficiency judgments remain deferred. This section defines no enabling path for them.

## 13 Information Acquisition Policy

The question budget is visible and fixed at **one question per decision-support turn**. This is not an onboarding limit.

A question is allowed only when:

- the user invoked decision support;
- one non-sensitive answer can change feasibility or disposition;
- the allowed channel is the current in-app turn;
- urgency permits a response;
- Skip, Not sure, and Later are available.

The MVP does not ask sensitive health, financial, legal, relationship, or third-party questions. Such needs cause ABSTAIN and, outside this MVP, require an approved escalation policy.

If more than one material unknown remains before or after the one question, the disposition is ABSTAIN. The system does not apply a hidden judgment that information benefit “plainly exceeds” burden.

The question record is `QuestionEvent(question_id, decision_id, missing_field, reason_it_could_change_disposition, channel, asked_at, budget_before, response_status)`. Allowed `response_status` values are `ANSWERED`, `SKIPPED`, `NOT_SURE`, and `LATER`; all are valid user choices.

| Situation | Acquisition decision |
|---|---|
| No material unknown | Ask nothing; continue deterministic evaluation |
| Exactly one non-sensitive unknown can change the disposition | Ask one concise question with why it matters |
| Answer is Skip, Not sure, Later, or still ambiguous | ABSTAIN without retry or penalty |
| More than one material unknown | ABSTAIN; do not start an interview |
| Sensitive or third-party information would be required | ABSTAIN; do not ask in the MVP |
| RSVP cutoff makes a response infeasible | ABSTAIN or show the deadline; do not infer an answer |

No answer updates a general profile or becomes a learned preference. It is scoped to the decision unless the user explicitly creates a separate contract-supported record, which is outside this MVP.

## 14 JITAI Policy

**MVP behavior is user-invoked only. Proactive policy returns NO-OP for every event.**

The product does not send notifications, interrupt focus, infer receptivity, or retry dismissed prompts. Availability, urgency, cooldown, materiality, sensitive-context exclusions, and burden limits are not approved for proactive use.

A later proactive capability is DEFERRED until those policies are P0 for that release and tests cover assignment, delivery, visibility, dismissal, cooldown, and quiet hours. NO-OP remains the default even after eligibility is introduced.

For clarity, the complete MVP intervention tuple is: `decision_point = none`, `eligibility = false`, `availability = unknown`, `intervention_options = {NO_OP}`, `assignment = NO_OP`, `delivery = none`, and `burden = zero proactive contacts`. A user opening the decision flow is ordinary pull-based use, not a proactive intervention exposure.

JITAI vocabulary is retained only as a future safety/evaluation checklist. The report does not define notification triggers, receptivity inference, quiet-hour defaults, cooldown duration, or an optimization objective; each remains a PO decision before any proactive production semantics can exist.

## 15 Learning Loop

The MVP stores non-analytic history only:

- recommendation event;
- independent user choice;
- optional narrative outcome report;
- optional subjective feedback;
- explicit ANALYTICALLY_INELIGIBLE status.

Narrative outcome and feedback remain separate. No episode updates weights, preferences, prompts, or policy.

The MVP loop is therefore `record → review/replay`, not `observe → optimize`. Its stable event chain is `RecommendationEvent → ChoiceEvent → optional Outcome → optional Feedback`; each link is nullable and absence is recorded as missing, never as a negative outcome. Policy changes require an explicit versioned product decision and are never produced by this history automatically.

### Later eligibility and exposure gate

Before effectiveness or burden analysis, every episode must represent eligibility/availability, decision point, assignment policy and probability where applicable, generation, delivery, visibility, action, response, timestamps, observation window, and missingness reason. Old episodes lacking these fields are ineligible for effectiveness or burden estimates.

### Later analytic-outcome gate

An outcome becomes analytically eligible only with a versioned target definition, horizon, resolution rule, source, and target-version compatibility. Otherwise it stays qualitative history with ANALYTICALLY_INELIGIBLE status. Silence remains missing; recommendation generation is not exposure; subjective helpfulness is not objective outcome.

No deferred gate is enabled by collecting the MVP events. Exposure instrumentation, analytic target resolution, experimentation, effect estimation, preference learning, and adaptive policies remain off until their separate prerequisites and approvals are satisfied.

## 16 Privacy Architecture

### MVP-safe deployment profile

- seeded/local data only;
- no live connector;
- no third-party content;
- no raw escalation;
- no external LLM by default;
- deterministic local rules and templates;
- read-only behavior with no calendar write;
- minimized logs containing identifiers and reason codes, not raw personal text.

### Data flow and control boundaries

| Boundary | Data admitted | Processing | Stored output | Explicit exclusion |
|---|---|---|---|---|
| Seed import | Named synthetic/local fixtures only | Parse and hash locally | Assertions, occurrences, lineage | Live account data, third-party content, opaque files |
| Retrieval | Allowed IDs/types in one decision scope | Exact local filter | Matched IDs and coverage state | Embeddings, semantic search, unrestricted history |
| Reasoning | Structured fields and assessments | Deterministic local rules | Inferences, trade-offs, disposition | Raw-source prompting, external LLM, hidden profile inference |
| Interaction | One user-invoked decision turn | Local render and optional bounded question | Recommendation and independent choice | Notification, calendar write, external commitment |
| History | Minimal structured event plus optional user-entered narrative | Append and replay locally | Separate outcome and feedback records | Analytics, model training, policy adaptation |
| Logging | IDs, versions, reason codes, failure state | Local diagnostic record | Minimized log | Raw personal text, provider prompt, secret values |

Access is limited to the local demo environment; networking and write integrations remain disabled. Retention is limited to what the reset manifest and local demonstration require. The reset path returns to the named fixture hash. These are MVP constraints, not claims about production identity, authorization, backup, or incident-response systems.

Any external provider path is OFF until the PO approves provider, fields, purpose, retention, region, training reuse, abuse logging, deletion terms, and incident ownership. A local deterministic fallback is mandatory.

### Deletion boundary

**Deletion compatibility: BLOCKED.** The MVP does not claim end-to-end deletion across snapshots, logs, embeddings, providers, external copies, or backups. It claims only immediate retrieval revocation for the seeded/local store when the local record and its local derived views are demonstrably removed or invalidated.

Production deletion remains blocked pending an artifact/derivation registry, deletion state machine, content-minimized tombstone, external-copy status, backup-restore reconciliation, verified/pending/exempt reporting, and exact snapshot treatment.

Local revocation means the targeted seeded assertion and its local current derived views are unavailable to new retrieval. It does not erase historical external copies, backups, provider logs, or every decision snapshot. The UI and report must use “local retrieval revoked,” never “fully deleted,” until the production deletion state machine can verify the wider boundary.

## 17 Previous Research Audit

The predecessor private source is unavailable in this repository. It is not linked, cited as reproducible evidence, or used directly. **PORTABILITY: UNRESOLVED** until an allowed archival copy or normalized manifest records origin, access date, hash, claim mapping, and transfer limitations. This report relies only on the in-repository [Pass-A gap audit](pass-a/gap-audit.md) for predecessor-claim review.

The audit below re-evaluates major substantive findings rather than limiting the review to citation identity.

| Previous Finding | Independent Finding | Status | Explanation |
|---|---|---|---|
| Future Me should react when reality changes | Changed-context reasoning is directly required by PRODUCT.md and can be represented by linked snapshots | CONFIRMED | The product thesis survives, but the MVP demonstrates only deterministic recomputation |
| A broad personal decision ecosystem should be built in the first slice | One reversible workshop decision is the only coherent five-day vertical slice | MODIFIED | Broad scope would exceed the timebox and obscure verification |
| PersonalState facets are implementation-ready | The canonical enum is authoritative; proposed facets lack approved normative semantics | REJECTED | Facets may not affect feasibility, ordering, recommendation, or proactive behavior |
| Multiple source copies strengthen a claim | Copies of one occurrence add no corroboration until independence is positively assessed | REJECTED | Provenance and occurrence identity take precedence over connector count |
| Evidence confidence can live on the fact itself | Assertions must remain immutable while freshness, conflict, admissibility, and independence are scoped assessments | MODIFIED | This preserves revision history and decision-time replay |
| An empty or unmatched calendar indicates availability | Coverage states must distinguish NO_MATCH, NOT_SEARCHED, INCOMPLETE, and UNAVAILABLE | REJECTED | Absence of a represented event is not evidence of free time |
| Semantic retrieval or an LLM is needed for useful reasoning | Exact structured retrieval and deterministic rules are sufficient for the named hero path | MODIFIED | Advanced retrieval and generation remain deferred behind demonstrated need and safety gates |
| A numeric forecast should express confidence | No eligible target, labels, horizon, baseline, or calibration protocol exists | REJECTED | The MVP uses no forecast and no numeric confidence |
| Scenario comparison can show how a changed decision affects outcomes | It can show only how declared inputs change represented constraint results | MODIFIED | Prediction, counterfactual estimates, and causal conclusions are not supported |
| Proactive support is part of the MVP loop | All proactive events must return NO-OP | REJECTED | Eligibility, availability, urgency, cooldown, materiality, and burden policies are absent |
| Recorded outcomes can drive learning | MVP outcome and feedback records are narrative and analytically ineligible | MODIFIED | Exposure, target version, observation rule, and missingness are prerequisites for analysis |
| Deletion compatibility is satisfied by deleting primary data | Only local retrieval revocation is currently supportable | REJECTED | Derived artifacts, snapshots, backups, providers, and external copies are unresolved |
| The deterministic demo validates product usefulness | It can validate contract behavior and traceability only after runtime tests; user benefit needs separate evaluation | MODIFIED | The report makes no empirical usefulness claim |
| The prior research package is reproducible | The in-repository Pass-A audit is usable, but the predecessor source lacks an allowed archive/manifest | UNCERTAIN | C-017 remains open and no machine-local path is introduced |

### Corrected citation identities retained

| Misidentified use | Correct identity | Disposition |
|---|---|---|
| 10.2307/2346806 as Lindley/VOI | Dawid & Skene, “Maximum Likelihood Estimation of Observer Error-Rates Using the EM Algorithm” | Not VOI evidence |
| Lindley assigned the Dawid–Skene DOI | Lindley, “On a Measure of the Information Provided by an Experiment,” DOI 10.1214/aoms/1177728069 | Method history only |
| arXiv 0710.3742 as conformal prediction | Adams & MacKay, “Bayesian Online Changepoint Detection” | Not conformal evidence |
| Angelopoulos–Bates assigned 0710.3742 | Angelopoulos & Bates, “A Gentle Introduction to Conformal Prediction,” arXiv 2107.07511 | Deferred method context |
| 10.1109/TKDE.2007.190745 as Kifer/Li | Yin, Han & Yu, “Truth Discovery with Multiple Conflicting Information Providers on the Web” | Truth discovery rejected for MVP |
| 10.1214/aoms/1177698950 as Fagin et al. | Dempster, “Upper and Lower Probabilities Induced by a Multivalued Mapping” | Belief-function mechanism only |
| 10.1007/s12160-016-9830-8 as an MRT paper | Nahum-Shani et al., JITAI components and design principles | Vocabulary only |
| MRT evidence assigned the JITAI DOI | Klasnja et al., “Microrandomized Trials…,” DOI 10.1037/hea0000305 | Experimental design deferred |
| NeurIPS hash 5103c358… as Guo calibration | Romano, Patterson & Candès, “Conformalized Quantile Regression” | Not neural calibration |
| Guo et al. omitted or mislinked | Guo et al., “On Calibration of Modern Neural Networks” | Method evidence, not product calibration |

Identity correction does not establish applicability.

## 18 Adversarial Critique

### Critic verdict

Pass C’s verdict was **REVISE** with three blocking corrections: overclaimed demo evidence, PersonalState authority conflict, and deletion compatibility. This revision accepts that verdict. It explicitly disagrees with the former Pass-B closure wherever Pass B treated a deterministic demo as product validation, treated facets as implementation-ready, or marked deletion compatibility as satisfied. Surviving conclusions—user ownership, evidence/assessment separation, noncausal scenario language, no numeric MVP forecast, and narrow mechanism transfer—are retained.

### Correction disposition

| ID | Disposition in this report |
|---|---|
| C-001 | **APPLIED:** three claim levels; MVP limited to Levels 1–2 |
| C-002 | **APPLIED / BLOCKED:** facets non-authoritative pending amendment; canonical fallback selected |
| C-003 | **APPLIED:** occurrence/copy lineage, assessed independence, FM-COPY-3 |
| C-004 | **APPLIED:** immutable assertion plus scoped, versioned assessment |
| C-005 | **APPLIED:** hero predicate freshness/admissibility moved to P0 |
| C-006 | **APPLIED BY CUT:** recurrence and DST reasoning unsupported in MVP |
| C-007 | **APPLIED:** completeness warning, status quo/defer, reversibility, stakes, high-stakes abstention |
| C-008 | **APPLIED:** extraction isolated; suggested options/criteria require confirmation |
| C-009 | **APPLIED:** coverage/cold-start states and required evidence classes |
| C-010 | **APPLIED:** one-question turn budget and abstention |
| C-011 | **APPLIED BY CUT:** proactive MVP is NO-OP only |
| C-012 | **APPLIED AS LATER GATE:** eligibility, exposure, response, and missingness requirements |
| C-013 | **BLOCKED:** only local retrieval revocation is claimed |
| C-014 | **APPLIED:** local seeded profile; external provider path off and provider policy P0 if enabled |
| C-015 | **APPLIED:** one exact reversible hero slice, fixtures, tests, estimates, owners, prerequisites, hard cut |
| C-016 | **APPLIED:** static traceability; runtime results remain UNVERIFIED |
| C-017 | **UNRESOLVED:** no machine-local link; only in-repo audit used |
| C-018 | **APPLIED AS LATER GATE:** narrative and analytic outcomes separated |

Residual disagreement is visible: the report prefers a narrower product than Pass B, and it does not treat C-013 or C-017 as closed.

## 19 Five-Day MVP Mapping

### Exact reversible hero slice

**Decision:** “Should I attend the optional Saturday workshop?”  
**Reversibility:** RSVP can be changed until Friday 17:00.  
**Stakes:** low, with no financial, medical, legal, employment, or irreversible external action.  
**User-confirmed criterion:** attend only if the current project deadline remains feasible.

This is the one and only hero slice. The layer mapping below does not add scenarios or implementation scope.

| Layer | MVP Implementation | Why Enough | What Is Heuristic | What Is Simulated | Stable Interface | Deferred |
|---|---|---|---|---|---|---|
| Evidence | Immutable fixture assertions, occurrences, lineage, scoped assessments | Supports provenance, correction, conflict, and replay oracles | Predicate-specific freshness/admissibility policy is a versioned product rule, not learned truth | Source occurrences, correction, and copied records | `EvidenceAssertion`, `ClaimOccurrence`, `LineageEdge`, `EvidenceAssessment` | Live ingestion, source-quality learning, generalized evidence fusion |
| Belief | Decision-scoped assessment with UNKNOWN defaults | Prevents mutable confidence from corrupting facts | Independence/admissibility classifications are explicit policy judgments | Assessment records for the hero snapshot | `EvidenceAssessment` keyed by decision scope and policy version | Validated reliability estimation or richer uncertainty formalism |
| State | Canonical `PersonalState` plus concrete reason tags | Maintains contract compatibility; hero rule does not need richer state | Only the contract fallback rule; no facet score | State records attached to S0/S1 | `State` record using canonical enum | Facets, thresholds, aggregation, migration after amendment |
| Forecast | Explicit `ABSENT` marker | Prevents scenario or confidence language from becoming a forecast | None | Nothing | Nullable/absent `Forecast` interface with target metadata reserved | Target definition, baseline, model, calibration, release criteria |
| Dependency | Direct typed interval/deadline edges | Fully represents the hero feasibility predicate | Fixture rule that intervals cannot satisfy two exclusive uses | Workshop, project, availability, and correction edges | `DependencyEdge` with restricted relation enum | Recurrence/DST, transitive graph, resources, solver |
| Scenario | Deterministic S0/S1 snapshot evaluation | Shows changed-context recomputation and sensitivity | None beyond declared fixture rules | Both before/after fixture snapshots | `DecisionSnapshot` plus deterministic result | Stochastic simulation, identified counterfactual estimation |
| Decision | Three options, explicit criterion, constraint checks, visible trade-offs, disposition rules | Produces the narrow safe recommendation or abstention | P0 disposition thresholds are transparent policy, not learned weights | Attend/Decline/Defer over S0/S1 | Option record, trade-off record, disposition enum, recommendation event | Multi-objective optimization, high-stakes policy, generalized decisions |
| Retrieval | Exact local ID/type filter plus five coverage states | Enumerates every required hero evidence class without semantic leakage | None; stable ordering only | Seeded local store and revocation | `RetrievalRequest` / `RetrievalResult` | Live connectors, embeddings, semantic ranking, unrestricted memory |
| Asking | One bounded, skippable in-turn question | Resolves one material gap or safely abstains | “Could change disposition” is evaluated by deterministic sensitivity, not a burden score | One missing-field branch | `QuestionEvent` and turn-budget counter | Multi-turn acquisition, sensitive-data policy, learned question selection |
| Proactive behavior | Constant NO-OP | Eliminates unapproved interruption and exposure ambiguity | None | NO-OP oracle only | Proactive policy result enum | Eligibility, quiet hours, cooldown, burden policy, delivery |
| Learning | Separate recommendation, choice, narrative outcome, and feedback events | Demonstrates continuity and replay without adaptation | None | Optional narrative entries | Versioned event schemas with `ANALYTICALLY_INELIGIBLE` | Eligible outcomes, exposure data, experiments, adaptive policy |
| Privacy | Seeded/local processing, minimal logs, networking/writes disabled | Contains the exact demo data flow | Retention duration remains a PO policy decision; no inferred deletion guarantee | Local fixture store and local logs | Data-class allowlist, processing-mode flag, local revocation status | Live authorization, provider governance, production retention and incident controls |
| Deletion | Local retrieval revocation and derived-view invalidation | Truthfully covers the controlled local boundary | None | Revocation of one seeded assertion | Revocation status and artifact identifiers | Artifact registry, backups, external copies, verified deletion state machine |
| Outcome evaluation | Narrative Outcome and Feedback remain separate and ineligible | Preserves contract semantics without false learning | None | Optional history attached to the hero decision | Separate `Outcome` and `Feedback` records | Versioned target, observation window, resolution source, analysis |
| External LLM | Disabled; deterministic explanation template | Structured hero result needs no generative model | None | Nothing | Processing mode stays `LOCAL_DETERMINISTIC` | Provider approval, prompt isolation, constrained output, confirmation gates |

### Named fixtures

| Fixture | Content |
|---|---|
| FX-HERO-DECISION-01 | Decision question, three options, low-stakes flag, criterion confirmation |
| FX-WORKSHOP-01 | Saturday 09:00–13:00 Asia/Ho_Chi_Minh; optional; RSVP cutoff |
| FX-PROJECT-01 | Four hours remaining; baseline deadline Monday 17:00 |
| FX-AVAILABILITY-01 | Sunday 13:00–17:00 explicitly user-confirmed available |
| FX-DEADLINE-CORRECTION-01 | Corrects deadline to Sunday 12:00 |
| FX-AVAILABILITY-02 | Saturday 09:00–13:00 is the only confirmed four-hour pre-deadline window |
| FX-COPY-ROOT-01 and three copy fixtures | Same occurrence copied via calendar, email, and notes |
| FX-RESET-MANIFEST-01 | Stable IDs, policy version, and fixture hash |

### Exact acceptance tests

| Test ID | Expected oracle |
|---|---|
| DI-02 | Changed evidence is visible and produces a freshly computed changed disposition |
| DI-03 | Reset restores FX-RESET-MANIFEST-01 and replay is deterministic |
| CX-09 | Seeded recommendation, user choice, and outcome remain separate; no accuracy claim |
| EP-02 | Historical confirmation without explicit validity is current-validity unknown |
| SC-04 | Feasibility is not described as desirability or optimality |
| DR-04 | Reversibility is shown as a separate attribute |
| DR-06 | No justified preference yields ABSTAIN |
| RP-02 | Prompt-like source text remains inert data |
| QJ-02 | At most one bounded, skippable question is asked |
| CF-03 | Incomplete coverage cannot become an empty-calendar inference |
| CX-10 | No invented weights and no external commitment |
| FM-COPY-3 | Three copied connector records produce one root occurrence and no corroboration effect |
| FM-HIGH-STAKES-ABSTAIN | A high-stakes variant always abstains in the MVP |
| FM-RECURRENCE-CUT | A recurrence/DST input yields ASK or ABSTAIN, never expanded reasoning |
| FM-LOCAL-REVOCATION | Revoked local seeded evidence is no longer retrievable; no broader deletion claim is shown |

### Build plan and estimates

Assumption: two implementation owners are available for five days; estimates are engineering effort, not elapsed guarantees.

| Day | Owner | Work | Estimate |
|---|---|---|---:|
| 1 | Product/Research Owner + Implementation Owner A | Approve P0 rules; encode fixtures, canonical state adapter, assertion/assessment/lineage records | 2.0 person-days |
| 2 | Implementation Owner A | Exact retrieval, coverage states, deterministic constraint/disposition policy | 1.5 person-days |
| 2–3 | Implementation Owner B | Three-option UI, provenance view, one-question/abstention flow, separate choice/history | 2.0 person-days |
| 3–4 | Owners A+B | Changed-reality replay, reset manifest, local revocation, acceptance harness | 2.0 person-days |
| 5 | QA Owner + Product/Research Owner | Run named tests, fix slice defects, capture runtime results | 1.5 person-days |

Total planning estimate: **9.0 person-days** within a two-person/five-day capacity of 10 person-days, leaving 1.0 person-day contingency.

### Prerequisites

- P0 freshness/admissibility rules and hero option policy approved before implementation.
- Existing local UI shell, storage, and test runner confirmed reusable by the implementation owner.
- No contract amendment required because the canonical PersonalState fallback is selected.
- Seed data contains no real person or third-party content.
- External networking and write integrations remain disabled.

### Hard cut line

Must ship: named fixtures, immutable assertions and scoped assessments, canonical-state compatibility, exact retrieval with coverage state, three explicit options, deterministic ASK/ABSTAIN/RECOMMEND policy, choice separation, local narrative history, reset/replay, and the listed acceptance tests.

Cut immediately if schedule slips: facets UI, semantic retrieval, external LLM, live connectors, proactive prompts, recurrence/DST, numeric forecast, general solver, analytics, experiments, and adaptive learning. These are not stretch goals; they are REJECTED or DEFERRED for this MVP.

## 20 Production Evolution

Evolution is gated, not automatic. “Advanced” is not a roadmap promise; it is eligible only after the named data and validation justify it.

| MVP Mechanism | MVP | Next Validated Mechanism | Validation Gate | Advanced Mechanism Only If Data Justifies It |
|---|---|---|---|---|
| Evidence | Fixture assertions, lineage, scoped assessments | Live-source assertion ingestion with correction and coverage states | Connector permission, clock semantics, replay and conflict tests | Reliability estimation or evidence fusion only with independent-source data and benchmarked error |
| Belief | Explicit assessment fields and UNKNOWN defaults | Audited predicate/source assessment policy | Inter-rater policy review, error taxonomy, held-out decision replay | Learned reliability only with stable labels, independence analysis, and better prospective performance |
| State | Canonical enum and reason tags | PO-amended facet semantics with deterministic mapping | Contract amendment, migration plan, user comprehension and error evaluation | Statistical state estimation only with observable target validity and safety evidence |
| Forecast | ABSENT | Simple declared baseline for one observable target | Versioned target, issue time, horizon, resolution, temporal split, missingness rule | More complex or conformal model only after baseline value, calibration, and assumptions are demonstrated |
| Dependency | Direct typed edges | Validated bounded temporal graph | Occurrence/timezone/DST/exception semantics and graph test suite | General solver only if real cases exceed bounded rules and solver errors are measurable |
| Scenario | Deterministic S0/S1 | Multi-branch deterministic sensitivity analysis | Branch completeness criteria and user comprehension evaluation | Stochastic simulation only with defensible distributions and prospective validation |
| Decision | Explicit constraint/disposition policy | Versioned multi-criteria display with user-set importance | Option coverage, value-elicitation safety, comprehension, and regret/error evaluation | Optimization or learned ranking only with stable objectives, comparative benefit, and override safety |
| Retrieval | Exact local filter and coverage states | Authorized live structured retrieval | Permission, freshness, correction, cold-start, revocation, and sufficiency tests | Semantic retrieval only with relevance set, authorization filters, deletion support, and measured gain |
| Asking | One deterministic material question | Audited bounded multi-turn acquisition | Burden limits, sensitive-field policy, stop rules, and user evaluation | Learned question selection only with exposure/outcome data and demonstrated burden-adjusted value |
| Proactive behavior | NO-OP | Fixed-rule, opt-in, safety-bounded prompt | Eligibility, availability, urgency, cooldown, quiet hours, delivery/view logging | Adaptive JITAI only with ethical assignment, burden outcomes, and defensible effect estimates |
| Learning | Non-analytic append-only history | Descriptive analysis over eligible, version-compatible episodes | Exposure, response, missingness, outcome target, and observation-window completeness | Adaptive policy only after randomized or defensible causal evidence and safety review |
| Privacy | Seeded/local deterministic processing | Production local or approved-provider processing profile | Field/purpose/retention/region/reuse/logging/deletion and incident ownership approval | Broader processing only when necessity, benefit, least-data design, and auditability are demonstrated |
| Deletion | Local retrieval revocation | Artifact registry plus verifiable deletion workflow | Derived-artifact enumeration, backup reconciliation, external-copy states, restore tests | Automated end-to-end deletion assurance only with measured coverage and exception handling |
| Outcome/feedback | Separate narrative, analytically ineligible records | Versioned analytic outcome for one declared target | Resolution source, horizon, compatibility, missingness, and audit | Multi-outcome or surrogate analysis only after target/proxy validity is demonstrated |
| Explanation | Deterministic local template | User-tested structured explanation variants | Fidelity checks, comprehension testing, no invented criteria/options | External LLM explanation only if it measurably improves comprehension under approved provider and grounding controls |

Cross-cutting gates remain: independent runtime results for all hero tests; live-source coverage and permission; provider/privacy approval before external processing; a contract amendment before normative facets; complete temporal semantics before recurrence; exposure before intervention analysis; analytic target eligibility before outcome analysis; chronological user-grounded evaluation before release; and a defensible causal design before effect or adaptive-policy language. Until a gate is met, the related mechanism remains DEFERRED and its safe behavior is ABSTAIN or NO-OP.

## 21 Product Owner Decision Backlog

Only genuine product, policy, or release decisions that affect the selected solution are listed. Routine implementation choices are intentionally excluded.

### P0 — required before the hero build or before enabling the named path

| Decision | Why it matters | Evidence | Options | Trade-offs | Recommended default | Confidence | What would invalidate recommendation |
|---|---|---|---|---|---|---|---|
| Approve the one workshop hero slice and low-stakes boundary | Prevents a five-day demo from implying a general or high-stakes decision product | MVP_SCOPE_UPDATED.md; Pass-C C-001/C-015 | Exact Section 19 slice; broader slice; no build | Narrow scope sacrifices breadth but makes traceability and abstention testable | Approve exactly the Section 19 slice | HIGH | Evidence that the required contract loop cannot be exercised by this slice or that workshop stakes are not actually low/reversible |
| Approve predicate-specific freshness and admissibility | Determines whether deadline, work, availability, cutoff, option, and criterion facts may constrain a recommendation | Pass-C C-004/C-005; EP-02 | Explicit validity/expiry/correction; age threshold; implicit persistence | Explicit rules create more UNKNOWN/ABSTAIN but avoid stale certainty | Require explicit validity, expiry, or correction; otherwise current-validity UNKNOWN | HIGH | A contract-approved source supplies stronger, audited current-validity semantics |
| Approve option completeness and disposition policy | Prevents omission of status quo and conversion of feasibility into desirability | PRODUCT.md; Pass-C C-007 | Three named options and confirmation; unconstrained list; hidden ranking | Confirmation adds friction but preserves user ownership | Require Attend, Decline/status quo, and Defer; high-stakes variants ABSTAIN | HIGH | User testing shows the Defer option is unavailable at the cutoff or a required meaningful option is missing |
| Approve the one-question turn budget | Bounds burden and prevents a hidden intake interview | Pass-C C-010; QJ-02 | Zero; one bounded question; multiple questions | One question may increase abstention but keeps the interaction auditable | One in-app, bounded, skippable, non-sensitive question | MEDIUM | Evidence that even one question is unsafe/burdensome, or an approved evaluation shows a different bound is safer and more useful |
| Approve canonical `PersonalState` fallback | Avoids an unauthorized state-model amendment | DOMAIN_CONTRACT.md; Pass-C C-002 | Canonical fallback; approve facets now; omit state boundary | Fallback is less expressive but contract-safe | Keep facets non-authoritative; use canonical enum only when supported | HIGH | A PO-approved contract amendment defines facet semantics, migration, and tests |
| Approve the MVP deployment/data profile | Sets the privacy claim and keeps external processing out of scope | Pass-A privacy/LLM audit; Pass-C C-014 | Seeded/local; approved external provider; live personal data | Local fixtures limit realism but sharply reduce uncontrolled data risk | Seeded/local, no third-party content, no external LLM, no raw escalation | HIGH | The hero requirement demonstrably cannot be met locally and a complete provider/data approval is granted |
| Approve the deletion claim boundary | Prevents “fully deleted” language where only retrieval revocation is controlled | Pass-C C-013; Section 16 | Local revocation claim; end-to-end claim; no deletion UX | Honest limited claim exposes product incompleteness but avoids false assurance | Say “local retrieval revoked”; production deletion compatibility remains BLOCKED | HIGH | Verified artifact registry, backup/provider reconciliation, and end-to-end deletion tests exist |
| Approve proactive behavior as NO-OP | Prevents unapproved interruptions and false exposure data | Pass-C C-011; Section 14 | NO-OP; fixed prompts; adaptive JITAI | Gives up proactive value in exchange for zero interruption risk | NO-OP for every event; user invocation only | HIGH | A separately approved release defines and tests eligibility, availability, urgency, cooldown, quiet hours, and burden |

If an actual demo requires any external provider, its field, purpose, retention, region, training-reuse, logging, and deletion terms become P0 before that provider is enabled.

### P1 — required before a production pilot

| Decision | Why it matters | Evidence | Options | Trade-offs | Recommended default | Confidence | What would invalidate recommendation |
|---|---|---|---|---|---|---|---|
| Admit live sources and define their coverage/correction policy | A production pilot cannot equate connector silence with complete context | Pass-C C-003–C-006/C-009 | No live sources; one bounded source; multiple sources | More coverage adds permission, lineage, temporal, and failure complexity | Begin with one authorized structured source only after coverage/correction states pass | MEDIUM | Pilot use requires another source class that cannot be represented safely or the bounded source adds no useful coverage |
| Choose the production deletion promise and state machine | User-facing deletion language depends on artifacts, backups, and external copies | Pass-C C-013; Section 16 | Local revocation only; verified staged deletion; immediate universal claim | Stronger promise requires slower verification and explicit exceptions | Retain limited claim until verified/pending/exempt states are operational | HIGH | Independent verification demonstrates complete coverage with restore-safe deletion |
| Set production retention, access, incident, and accountability policy | Local-demo assumptions do not define operational governance | Pass-A privacy/LLM audit | Minimal fixed retention; user-configurable retention; indefinite history | Short retention limits continuity; longer retention increases exposure | Minimize by data class and name accountable owners before pilot | MEDIUM | Legal, contractual, or user requirements justify a different documented minimum |
| Decide whether to amend `PersonalState` for facets | Normative facets change product semantics and migration behavior | Pass-A state audit; Pass-C C-002 | Keep enum; amend with facets; remove state from applicable paths | Richer state may aid explanation but increases inference and labeling risk | Keep canonical enum until facet validity and migration are demonstrated | HIGH | Evidence shows the enum cannot support required pilot behavior and the amendment passes review/evaluation |
| Admit recurring temporal inputs | Recurrence and DST errors can reverse feasibility | Pass-C C-006; FM-RECURRENCE-CUT | Continue cut; bounded recurrence; full calendar semantics | Temporal coverage adds substantial ambiguity and test burden | Keep recurrence excluded until occurrence/zone/exception semantics are approved | HIGH | Pilot requirements cannot avoid recurrence and a comprehensive temporal policy/test set is ready |
| Approve a user-grounded evaluation plan | Runtime correctness cannot establish user comprehension or benefit | Pass-C C-001/C-016; Section 3 | Technical tests only; qualitative evaluation; prospective comparative study | Stronger evaluation costs time but supports stronger claims | Start with independent task-comprehension and decision-support evaluation; keep claims bounded | HIGH | The pilot is explicitly technical-only with no user-benefit claim or release decision |

### P2 — required only before advanced intelligence

| Decision | Why it matters | Evidence | Options | Trade-offs | Recommended default | Confidence | What would invalidate recommendation |
|---|---|---|---|---|---|---|---|
| Select a forecast target and release protocol | Without a resolvable target, probability and calibration language are meaningless | Section 8; forecasting/calibration transfer evidence | No forecast; one simple target/baseline; complex model | A narrow target limits ambition but permits honest evaluation | Keep no forecast until one observable target and prospective protocol are approved | HIGH | A decision-relevant target, sufficient labels, baseline gain, and calibration plan are demonstrated |
| Admit semantic retrieval | Semantic recall may improve coverage but enlarges authorization and deletion surfaces | Pass-A decision/retrieval and privacy audits | Exact retrieval; hybrid bounded retrieval; semantic retrieval | Recall gains can introduce leakage, stale context, and opaque sufficiency | Require relevance benchmark, authorization filtering, revocation, and measurable gain before hybrid use | MEDIUM | Exact structured retrieval continues to meet validated production needs |
| Enable proactive decision support | Proactivity creates interruption, burden, and safety obligations | JITAI transfer evidence; Section 14 | NO-OP; fixed opt-in rules; adaptive policy | Potential timeliness competes with autonomy and burden | First consider fixed opt-in rules after full policy/evaluation approval | MEDIUM | Users reject interruption, burden exceeds benefit, or safe availability cannot be observed |
| Make episodes analytically eligible | Learning claims require exposure, response, missingness, and target-compatible outcomes | Pass-C C-012/C-018; Section 15 | Narrative only; descriptive eligible dataset; experimental dataset | Instrumentation increases data collection and governance cost | Preserve narrative-only status until minimum analytic fields and target versions are approved | HIGH | A privacy-preserving dataset cannot be collected or the target is not stable/valuable |
| Authorize causal or adaptive learning | Effect and policy-improvement claims can change user treatment | Causal/MRT transfer evidence; Section 20 | No causal claim; randomized evaluation; defensible quasi-experiment; adaptive policy | Strong designs cost more and may raise ethical constraints; weak designs mislead | No adaptive policy until estimand, assignment/design, safety review, and release gate are approved | HIGH | The use case does not require an effect claim or ethical/identification assumptions cannot be met |

## Sources

### Local authority and evidence

- [PRODUCT.md](../PRODUCT.md), especially the changed-context product thesis and required options/trade-offs/recommendation boundary.
- [DOMAIN_CONTRACT.md](../DOMAIN_CONTRACT.md), including canonical PersonalState, recommendation/choice separation, and Outcome versus Feedback.
- [USER_FLOWS.md](../USER_FLOWS.md), including the boundary around recommendation policy and attribute weighting.
- [MVP_SCOPE_UPDATED.md](../MVP_SCOPE_UPDATED.md), including the five-day timebox and D1–D9 end-to-end loop.
- [Pass-A gap audit](pass-a/gap-audit.md).
- [Pass-A state audit](pass-a/personal-state.md).
- [Pass-A decision and retrieval audit](pass-a/decision-retrieval.md).
- [Pass-A privacy and LLM audit](pass-a/privacy-llm.md).
- [Pass-A JITAI and learning audit](pass-a/jitai-learning.md).
- [Pass-C edge-case catalog](pass-c/edge-case-catalog.md).
- [Pass-C independent critique](pass-c/critic-report.md).

### Stable external identity links used for citation correction

- [Dawid & Skene, DOI 10.2307/2346806](https://doi.org/10.2307/2346806)
- [Lindley, DOI 10.1214/aoms/1177728069](https://doi.org/10.1214/aoms/1177728069)
- [Adams & MacKay, arXiv 0710.3742](https://arxiv.org/abs/0710.3742)
- [Angelopoulos & Bates, arXiv 2107.07511](https://arxiv.org/abs/2107.07511)
- [Yin, Han & Yu, DOI 10.1109/TKDE.2007.190745](https://doi.org/10.1109/TKDE.2007.190745)
- [Dempster, DOI 10.1214/aoms/1177698950](https://doi.org/10.1214/aoms/1177698950)
- [Nahum-Shani et al., DOI 10.1007/s12160-016-9830-8](https://doi.org/10.1007/s12160-016-9830-8)
- [Klasnja et al., DOI 10.1037/hea0000305](https://doi.org/10.1037/hea0000305)
- [Romano, Patterson & Candès, NeurIPS 2019](https://papers.nips.cc/paper_files/paper/2019/hash/5103c3584b063c431bd1268e9b5e76fb-Abstract.html)
- [Guo et al., PMLR 70](https://proceedings.mlr.press/v70/guo17a.html)

## Static Traceability Check

This is a static mapping, not runtime or empirical verification. “Mapped” means the report contains a representation and oracle. It does not mean the implementation exists or a test passed.

### Internal-consistency edges

| Requested edge | Upstream rule | Downstream rule | Consistency result |
|---|---|---|---|
| Section 2 layers → Section 19 implementation | Every selected layer is narrow and bounded | Every selected/deferred layer names MVP implementation, interface, and deferral | CONSISTENT — no layer silently adds implementation scope |
| Evidence → Belief | Assertions are immutable and provenance-bearing | Freshness, conflict, admissibility, and independence live in scoped assessments | CONSISTENT — belief never overwrites evidence |
| Belief → State | Only admissible assessed evidence may support state | Canonical enum is normative; missing/conflicting evidence falls back to UNCERTAIN | CONSISTENT — proposed facets have no ordering effect |
| Forecast → Decision | Forecast is explicitly ABSENT | Decision uses deterministic constraints and no numeric confidence | CONSISTENT — scenario results are not predictions |
| Dependencies → Scenario | Only direct typed fixture edges propagate | S0/S1 evaluate represented constraint consequences only | CONSISTENT — no probabilistic or causal consequence is introduced |
| Context + state + forecast + dependencies + preferences → trade-offs → recommendation | Full path is explicit and inputs retain their boundaries | Recommendation is a versioned disposition over represented options | CONSISTENT — feasibility is not desirability or global optimality |
| Automation → Human judgment | Structured calculations are the only automated reasoning; no statistical model or external LLM | User owns criteria, relative importance, corrections, and final choice | CONSISTENT — no hidden weights or automated commitment |
| Recommendation → Choice | Recommendation is a system event | Choice is a separate user event and may disagree | CONSISTENT — disagreement is not labeled error |
| Retrieval coverage → Asking | Coverage states distinguish NO_MATCH, NOT_SEARCHED, INCOMPLETE, and UNAVAILABLE | One material gap may yield one question; otherwise ABSTAIN | CONSISTENT — missing data never becomes availability |
| Proactive policy → Exposure | Every proactive event returns NO-OP | No generation/delivery/view is recorded as intervention exposure | CONSISTENT — pull-based MVP use is not a proactive exposure |
| Outcome → Feedback → Learning | Outcome narrative and subjective feedback are distinct and analytically ineligible | No event changes weights, prompts, preferences, or policy | CONSISTENT — history supports replay only |
| Privacy → External processing | Seeded/local data and minimized logs define the MVP boundary | External LLM, connectors, and raw escalation are disabled | CONSISTENT — provider prerequisites do not enable a path |
| Revocation → Deletion claim | Local records and current derived views can be revoked | End-to-end deletion remains BLOCKED | CONSISTENT — UI must not claim full deletion |
| Evidence classes → Mechanism decisions | Section 3 uses only the seven permitted classifications | Sections 4–5 limit alternatives to SELECT/DEFER/REJECT/UNRESOLVED rationale | CONSISTENT — method transfer is not product validation |
| Prior audit → Critic disposition | Section 17 independently confirms, modifies, rejects, or leaves findings uncertain | Section 18 retains REVISE and all C-001–C-018 dispositions | CONSISTENT — citation correction is not the only audit |
| MVP → Evolution | MVP mechanisms remain deterministic/local | Each next or advanced mechanism has an explicit validation/data gate | CONSISTENT — deferred mechanisms are not enabled by this report |

| Requirement | Contract / critique reference | Representation | Test ID and expected oracle | Actual result |
|---|---|---|---|---|
| Changed context changes reasoning | PRODUCT.md lines 21, 93; MVP_SCOPE_UPDATED.md D7 | DecisionSnapshot + deadline correction | DI-02: changed evidence and recomputed disposition | **UNVERIFIED — NOT RUN** |
| User owns the decision | PRODUCT.md lines 124–135; DOMAIN_CONTRACT.md line 375 | Separate recommendation and choice events | DR-02 / CX-09: values remain distinct | **UNVERIFIED — NOT RUN** |
| Canonical state authority | DOMAIN_CONTRACT.md section 4 | Canonical fallback; facets blocked | PS-01 / PS-02: no facet-driven recommendation | **UNVERIFIED — NOT RUN** |
| Evidence replay | Pass-C C-003/C-004 | Immutable assertion, occurrence lineage, scoped assessment | FM-COPY-3 and DI-03 | **UNVERIFIED — NOT RUN** |
| Freshness policy | Pass-C C-005 | P0 predicate policy; unknown fallback | EP-02: old confirmation not treated current | **UNVERIFIED — NOT RUN** |
| Recurrence/DST cut | Pass-C C-006 | Unsupported-input boundary | FM-RECURRENCE-CUT | **UNVERIFIED — NOT RUN** |
| Safe option reasoning | PRODUCT.md lines 124–135; Pass-C C-007 | Three options, completeness warning, stakes/reversibility | DR-04, DR-06, FM-HIGH-STAKES-ABSTAIN | **UNVERIFIED — NOT RUN** |
| Untrusted text isolation | USER_FLOWS.md lines 19–37; Pass-C C-008 | Extraction/deliberation separation | RP-02 / CX-10 | **UNVERIFIED — NOT RUN** |
| Coverage and cold start | Pass-C C-009 | Five explicit coverage states | CF-03: incomplete is not empty | **UNVERIFIED — NOT RUN** |
| One-question budget | Pass-C C-010 | Turn budget and abstention | QJ-02 | **UNVERIFIED — NOT RUN** |
| Proactive safety | Pass-C C-011 | User-invoked only; proactive NO-OP | QJ-04 / QJ-05 | **UNVERIFIED — NOT RUN** |
| Outcome/feedback separation | DOMAIN_CONTRACT.md sections 9–10; Pass-C C-018 | Narrative versus analytic eligibility | FG-02 / LO-03 | **UNVERIFIED — NOT RUN** |
| Deletion honesty | Pass-C C-013 | BLOCKED; local retrieval revocation only | FM-LOCAL-REVOCATION / CX-08 | **UNVERIFIED — NOT RUN** |
| Five-day feasibility | MVP_SCOPE_UPDATED.md five-day scope; Pass-C C-015 | Section 19 estimate and hard cut | DI-05: reject overbuild | **UNVERIFIED — NOT RUN** |
| Predecessor portability | Pass-C C-017 | In-repo audit only; portability unresolved | Repository clone resolves every cited local source | **UNVERIFIED — MANIFEST ABSENT** |

### Static document checks recorded by this revision

- Exactly 21 numbered top-level sections are present.
- C-001 through C-018 each have an explicit disposition.
- All four authoritative contract filenames and both Pass-C artifacts are referenced.
- No machine-local predecessor path is present.
- No runtime test, empirical outcome, deletion completion, or Level 3 claim is reported as passed.
