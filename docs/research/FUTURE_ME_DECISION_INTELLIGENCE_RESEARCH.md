# Future Me — Decision Intelligence Research

> **Status:** Codex-only research synthesis and implementation decision brief  
> **Date:** 2026-09-20  
> **Scope:** Preserve the useful prior synthesis while converting it into the required 18-section product and technical contract.  
> **Boundary:** Future Me remains user-owned decision support. It does not silently infer consent, turn plans into facts, or make choices for the user.

## 1 Executive Technical Thesis

Future Me should be a **provenance-first, calibrated decision-support loop**. It maintains revisable context, forecasts decision-relevant consequences, and chooses among `RECOMMEND`, `ASK`, and `ABSTAIN`; the user remains the decision owner. The core object is a claim with lineage, validity, uncertainty, and conflict state, not an opaque “personal score.”

The MVP should use deterministic evidence handling plus simple probabilistic baselines. It should measure forecast quality and decision quality separately, preserve unknowns and contradictions, and make no-op behavior a valid result. Advanced language models may normalize ambiguous text or explain an already-computed result, but they must not be the state estimator, source of truth, or authority for causal claims.

Primary foundations include provenance ([W3C PROV-DM](https://www.w3.org/TR/prov-dm/)), event-driven consistency ([EDC](https://www2.cs.arizona.edu/~rts/pubs/EDC.pdf)), probabilistic data ([Kifer & Li](https://doi.org/10.1109/tkde.2007.190745)), calibration ([Gneiting & Raftery](https://sites.stat.washington.edu/raftery/Research/PDF/Gneiting2007jasa.pdf)), causal limits ([Pearl](https://proceedings.mlr.press/v6/pearl10a/pearl10a.pdf)), and privacy risk management ([NIST AI RMF](https://doi.org/10.6028/NIST.AI.100-1), [NIST Privacy Framework](https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.01162020.pdf)).

## 2 Final Decision Ecosystem

The ecosystem is a chain of separately versioned objects:

`Observation → Evidence Claim → Personal State → Forecast → Decision → Intervention → Choice → Outcome → Feedback`.

Calendar and task records are observations of plans. User confirmations, corrections, and outcomes are distinct evidence. A recommendation contains options, trade-offs, assumptions, relevant claims, forecast distributions, and an abstain reason when applicable. Silence is not confirmation; an absent event is not free capacity; a correction supersedes a derived view without deleting the ledger history.

The product boundary is consequential, user-invoked support. Proactive behavior is limited to context maintenance or a material, time-sensitive disruption, with cooldowns and a no-op path.

## 3 Mechanism Decision Table

| Mechanism | MVP decision | Production evolution | Why / boundary |
|---|---|---|---|
| Immutable provenance-first ledger | **Use** append-only claims, corrections, source, actor, event time, transaction time | Event store plus lineage graph and retention controls | Enables audit, replay, and correction without erasure ([PROV-DM](https://www.w3.org/TR/prov-dm/)) |
| Multidimensional trust | **Use** vector dimensions: source authority, recency, completeness, agreement, label quality, user confirmation | Learned/calibrated trust policies by claim type | A scalar confidence hides why a claim is weak; probabilistic DBs preserve uncertainty ([Kifer & Li](https://doi.org/10.1109/tkde.2007.190745)) |
| Valid-time + transaction-time | **Use** both on every claim and forecast | Bitemporal query engine and temporal audits | Distinguishes when a fact was true from when Future Me learned it ([EDC](https://www2.cs.arizona.edu/~rts/pubs/EDC.pdf)) |
| Conflict preservation | **Use** `CONFLICTED` and `UNKNOWN`; never silently merge | Claim-specific adjudication and user review queues | Contradictions are decision evidence, not ingestion errors |
| Forecasting | **Use** baseline, logistic/quantile model, deterministic feasibility rule | Hierarchical/state-space/global probabilistic models | Sparse per-user history favors updateable models; state-space is a production option ([Kalman](https://doi.org/10.1115/1.3662552)) |
| LLM | **Bound** to semantic normalization and explanation over structured inputs | Optional audited tool with abstention and prompt/data minimization | LLM is not a state estimator and cannot mint evidence |
| Question policy | **Use** VOI plus interruption cost and freshness | Personalized policy learned from outcomes | Ask only when an answer can change a consequential decision |
| JITAI | **Use** no-op, cooldown, prompt budget, user-invoked default | Micro-randomized trials after calibration | Intervention effects require experimental evidence ([Klasnja et al.](https://doi.org/10.1007/s12160-016-9830-8)) |

## 4 Mechanism Transfer Matrix

| Research mechanism | Transfer to Future Me | MVP implementation | Explicit non-transfer |
|---|---|---|---|
| Provenance graphs | Claim lineage and explanation | `source_id`, parent claims, actor, timestamps | No provenance-free generated summary |
| Probabilistic databases | Set-valued/uncertain state | distributions, intervals, trust dimensions | No single “truth probability” for heterogeneous evidence ([Fagin et al.](https://projecteuclid.org/journals/annals-of-mathematical-statistics/volume-38/issue-2/Upper-and-Lower-Probabilities-Induced-by-a-Multivalued-Mapping/10.1214/aoms/1177698950)) |
| Temporal reasoning | Expiry and dependency propagation | deterministic interval checks and dependency DAG | No vague recency heuristic |
| Proper scoring rules | Release and model comparison | Brier, CRPS, pinball, reliability, coverage | Accuracy-only leaderboard ([Gneiting & Raftery](https://sites.stat.washington.edu/raftery/Research/PDF/Gneiting2007jasa.pdf)) |
| Conformal prediction | Honest finite-sample intervals where assumptions fit | offline exploratory intervals | No claim of universal coverage under drift ([Angelopoulos & Bates](https://arxiv.org/abs/0710.3742)) |
| Causal inference | Separate intervention questions from forecasts | scenario simulation labels | No causal language from correlations ([Pearl](https://proceedings.mlr.press/v6/pearl10a/pearl10a.pdf)) |
| Active learning / VOI | Reduce interruption while improving decisions | candidate-question utility calculation | No “ask because uncertain” rule ([Lindley](https://doi.org/10.2307/2346806)) |
| JITAI/MRT | Test timing and intervention effects | no-op and cooldown first | No adaptive treatment claim before trial evidence |
| Privacy engineering | Minimize collection and exposure | local preprocessing, coarse features, deletion path | No default keystrokes, screenshots, clipboard, bodies, or audio ([Solove](https://digitalcommons.law.uw.edu/wlr/vol79/iss1/10)) |

## 5 Evidence Model

An evidence claim is `{claim_id, subject, predicate, value, source, actor, observed_at, valid_from, valid_to, recorded_at, confidence_dimensions, label_quality, access_scope, parents}`. `observed_at` and valid-time describe the world; `recorded_at` and transaction-time describe ledger knowledge. Corrections append a new claim and link the superseded view; they do not mutate history.

Trust is multidimensional: authority, recency, completeness, agreement, directness, and user confirmation are retained separately. The system uses **claim-specific freshness**: each predicate has its own expiry rule and a forecast records the freshness policy used. Derived state carries all supporting claims and a reason code. Claims can be `CONFIRMED`, `OBSERVED`, `INFERRED`, `PREDICTED`, `CONFLICTED`, or `UNKNOWN`. A calendar plan is not completion evidence.

## 6 Forecast Model

The MVP forecasts one operational target in a defined window, such as `usable_focus_minutes`, plus `P(required_minutes)`. It runs a free-time baseline, historical mean, logistic feasibility model, and quantile regression (P20/P50/P80); a dynamic state-space model is rejected for the five-day MVP but remains a production option ([Kalman](https://doi.org/10.1115/1.3662552)).

Forecasts include target definition, horizon, training cutoff, feature provenance, model version, distribution/quantiles, and abstain conditions. Scenario simulation may answer “what if this commitment is accepted?” by propagating assumptions. It does not establish that accepting the commitment causes the simulated outcome; causal claims require identification and intervention data ([Pearl](https://proceedings.mlr.press/v6/pearl10a/pearl10a.pdf)).

## 7 Dependency / Disruption Model

Represent commitments and forecasts as a dependency DAG. Each edge has a deterministic temporal constraint (ordering, overlap, deadline, minimum duration, buffer, or expiry). A changed or conflicted upstream claim propagates invalidation or widening uncertainty to dependent forecasts. The engine emits `STALE`, `BLOCKED`, `CONFLICTED`, or `UNKNOWN` with the exact edge and claim responsible.

Disruption policy ranks impact, imminence, reversibility, and user interruption cost. A disrupted plan can trigger a user-invoked replan or a bounded alert; it cannot silently rewrite commitments.

## 8 Decision Reasoning Model

For each decision, enumerate options, constraints, relevant claims, forecast distributions, utility assumptions, downside buffers, and reversibility. Compute expected utility only where assumptions are explicit; show sensitivity when the recommendation changes across plausible assumptions. Keep the recommendation separate from the eventual choice and outcome.

The reasoning engine can compare scenarios and trade-offs. It must not call a correlation a cause, treat acceptance as success, or convert a model score into authority. If evidence is stale, conflicted, or insufficient to distinguish options, return `ASK` or `ABSTAIN`.

## 9 Context Retrieval Model

Retrieve by decision scope, subject, validity interval, freshness policy, access scope, and provenance—not by semantic similarity alone. The retrieval result is a compact evidence bundle containing confirmed facts, observations, inferences, conflicts, unknowns, and dependencies, each with timestamps and source links.

Use deterministic filters first, then optional semantic retrieval for explanation or ambiguous matching. Redact raw content at ingestion and prefer local aggregation. Retrieval must preserve contradictions rather than selecting the most fluent passage.

## 10 Information Acquisition / Question Policy

Ask a question when its expected value of information exceeds interruption cost and privacy cost:

`VOI(q) = expected decision utility after answer − expected utility without answer − answer/interruption/privacy cost`.

Candidate questions must identify the claim they would resolve, possible answers, expiry, and which options could change. If no answer can change the decision, do not ask. If impact is high but evidence is irreducibly ambiguous, ask the user to choose or abstain. This is an active policy, not a generic confidence threshold ([Lindley](https://doi.org/10.2307/2346806)).

## 11 JITAI Policy

Default to no-op. Intervene only when a decision is consequential, evidence is fresh enough, expected benefit is positive, and the user has prompt budget. Enforce per-topic cooldowns, deduplicate equivalent prompts, support dismiss/skip, and record intervention exposure and outcome. A prompt must state why now, what evidence changed, and how to silence it.

The MVP uses user-invoked flows and deterministic cooldowns. Micro-randomized trials and adaptive timing are later work after calibration and privacy gates; they are not assumed benefits ([Klasnja et al.](https://doi.org/10.1007/s12160-016-9830-8)).

## 12 Learning Loop

`observe → ledger → derive state → forecast → calibrate → decide/abstain → choice → outcome → feedback → audit/retrain`.

Keep prospective labels separate from retrospective explanations. Preserve label quality (`explicit`, `weak`, `proxy`) and missingness. Use rolling temporal backtests, shadow forecasts, and a silent control before recommendation experiments. Retraining cannot rewrite historical forecasts; each version is replayable from the ledger.

Calibration precedes confidence language. Track Brier for binary events, CRPS for distributions, pinball loss for quantiles, reliability, interval coverage, width, subgroup/horizon slices, drift, prompt burden, correction rate, feasible-plan rate, and user-reported usefulness ([Gneiting & Raftery](https://sites.stat.washington.edu/raftery/Research/PDF/Gneiting2007jasa.pdf)).

## 13 Contradictions and Failure Modes

| Failure | Required behavior |
|---|---|
| Plan treated as behavior | Keep planned and observed claims distinct |
| Silence treated as confirmation | Preserve `UNKNOWN` |
| New weak signal contradicts user confirmation | Preserve `CONFLICTED`; request adjudication when decision-relevant |
| Stale upstream claim | Propagate `STALE` through dependencies |
| Overconfident forecast | Abstain or widen interval; calibration gate blocks release |
| LLM hallucinated fact | Reject unsupported claim; LLM sees structured evidence only |
| Scenario described as cause | Label as simulation; require causal design for causal wording |
| Privacy over-collection | Minimize locally, redact, scope access, support deletion |
| Prompt fatigue | No-op, cooldown, budget, and dismissal learning |
| Correction erases history | Append correction and retain provenance |

## 14 MVP Architecture — 5 Days

**Day 1:** Freeze one decision slice and target; implement append-only claim ledger with provenance, valid-time, transaction-time, and access scope.

**Day 2:** Build deterministic context retrieval, freshness/expiry, conflict preservation, dependency propagation, and a visible evidence panel.

**Day 3:** Add baselines, quantile/logistic forecasts, feasibility calculation, calibration metrics, and replayable forecast records.

**Day 4:** Add decision reasoning, VOI question policy, `RECOMMEND`/`ASK`/`ABSTAIN`, no-op, cooldown, prompt budget, and user choice capture.

**Day 5:** Seed/demo observations, run rolling backtests and shadow mode, test contradictions and deletion boundaries, and document MVP versus production seams.

MVP choices: deterministic rules, seeded or user-entered data, one target, one decision slice, local preprocessing, bounded LLM only for normalization/explanation, no surveillance, no deep model training, no causal claims. Production choices are listed in section 15.

## 15 Production Evolution

Move to a bitemporal event store, lineage graph, encrypted per-user partitions, connector-specific retention, and auditable policy versions. Add hierarchical/state-space or global probabilistic forecasting when history and consent justify it; add conformal or distributional methods with drift checks. Introduce learned multidimensional trust only with calibration evidence. Add JITAI/MRT experimentation, subgroup fairness analysis, deletion verification, differential access controls, and human review for high-impact conflicts.

Keep the LLM behind a typed interface with retrieval citations, schema validation, redaction, cost/latency budgets, and deterministic fallback. It may summarize or ask a question; it may not create an ungrounded observation, resolve a conflict silently, or claim causality.

## 16 Research Confidence Map

| Claim | Confidence | Evidence / limitation |
|---|---|---|
| Provenance and append-only history improve auditability | High | W3C PROV-DM; implementation details remain product-specific |
| Scalar trust is inadequate | High | Heterogeneous evidence and probabilistic DB literature; exact dimensions need validation |
| Valid-time and transaction-time are necessary | High | Temporal/event consistency foundations; retention semantics still open |
| Calibration must precede confidence | High | Proper scoring rules and reliability literature ([Gneiting & Raftery](https://sites.stat.washington.edu/raftery/Research/PDF/Gneiting2007jasa.pdf)) |
| VOI can reduce needless questions | Medium-high | Decision-theoretic basis; user interruption cost requires measurement |
| Simple models fit a five-day MVP | Medium-high | Sparse-data reasoning; lift over baselines is unmeasured |
| State-space model is useful in production | Medium | Strong modeling fit; per-user data volume and drift unknown |
| Scenario simulation is feasible | Medium-high | Deterministic dependency propagation; simulation is not causal evidence |
| JITAI improves outcomes | Low until tested | Requires randomized intervention evidence |
| Local preprocessing reduces privacy exposure | Medium-high | Minimization principle; residual inference and metadata risk remain ([NIST](https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.01162020.pdf)) |
| Cross-user learning is acceptable | Unknown | Requires consent, governance, and utility evidence |

## 17 Prior Research Audit

| Prior report claim | Audit result | Required disposition |
|---|---|---|
| Use distributions rather than point estimates | **MODIFIED** | Retain distributions/quantiles, but define one observable target and binary feasibility event |
| State-space model as MVP backbone | **REJECTED for 5-day MVP; production option** | MVP uses baselines plus quantile/logistic models; retain state-space seam |
| “Usable focus minutes” as target | **MODIFIED / UNRESOLVED** | Keep as candidate only until operational definition and label quality are validated |
| LLM as state estimator | **CONFIRMED: do not use** | LLM limited to bounded normalization/explanation |
| Calibration before confidence | **CONFIRMED** | Release gate with proper scores, reliability, and coverage |
| Active questioning / VOI | **CONFIRMED** | Implement question policy with interruption and privacy costs |
| Privacy / local preprocessing | **MODIFIED** | Make local coarse aggregation the default; add access, retention, deletion, and residual-risk controls |
| Conformal intervals | **MODIFIED** | Exploratory only until drift and exchangeability assumptions are monitored ([Angelopoulos & Bates](https://arxiv.org/abs/0710.3742)) |
| Causal claims from forecasts | **REJECTED** | Use scenario simulation labels and causal designs for intervention claims |
| Advanced deep forecasting now | **REJECTED for MVP** | Revisit after history, consent, and baseline lift exist |

## 18 Product Owner Decision Backlog

**Internal consistency review (required before backlog):**

| Check | Result |
|---|---|
| User remains decision owner | Pass: sections 1, 2, 8, 11 |
| Evidence is immutable and provenance-first | Pass: sections 3, 5, 12 |
| Trust is multidimensional | Pass: sections 3, 5, 16 |
| Valid-time and transaction-time are distinct | Pass: sections 3, 5, 14 |
| Conflicts and unknowns are preserved | Pass: sections 3, 7, 13 |
| Temporal constraints propagate deterministically | Pass: sections 6, 7, 14 |
| Simulation is not causal evidence | Pass: sections 4, 6, 17 |
| Calibration precedes confidence | Pass: sections 6, 12, 16, 17 |
| VOI governs questions | Pass: sections 4, 10, 11, 17 |
| JITAI has no-op/cooldowns and MRT is later | Pass: sections 3, 11, 15 |
| LLM is bounded and not a state estimator | Pass: sections 3, 14, 15, 17 |
| Privacy minimization is explicit | Pass: sections 3, 4, 14, 15, 16, 17 |
| MVP and production choices are explicit | Pass: sections 3, 14, 15 |

| ID | Decision required | Default recommendation | Owner / exit evidence |
|---|---|---|---|
| PO-01 | First decision slice | One time-bound commitment feasibility decision | Product owner selects; written target and options |
| PO-02 | Forecast target | Candidate `usable_focus_minutes` with explicit definition | Product + research; label spec and pilot labels |
| PO-03 | Retention/deletion | Minimum metadata, user-visible deletion, per-user scope | Product + privacy; deletion test passes |
| PO-04 | Prompt budget | Conservative daily/topic cap plus cooldown | Product; prompt burden baseline |
| PO-05 | LLM boundary | Normalization/explanation only, citations required | Engineering; schema and fallback test |
| PO-06 | Release gate | Calibration and decision metrics must both pass | Product + research; predeclared thresholds |
| PO-07 | Production investment | Bitemporal event store and state-space option after MVP evidence | Engineering; replay and drift plan |

The product owner can close PO-01 through PO-07 only when the listed evidence exists. Until then, the system remains in seeded/shadow or abstain mode.

### Primary citation set

- [W3C PROV-DM](https://www.w3.org/TR/prov-dm/)
- [Event-driven consistency](https://www2.cs.arizona.edu/~rts/pubs/EDC.pdf)
- [Probabilistic databases](https://doi.org/10.1109/tkde.2007.190745)
- [Lindley, information for decisions](https://doi.org/10.2307/2346806)
- [Kalman filtering](https://doi.org/10.1115/1.3662552)
- [Upper and lower probabilities](https://projecteuclid.org/journals/annals-of-mathematical-statistics/volume-38/issue-2/Upper-and-Lower-Probabilities-Induced-by-a-Multivalued-Mapping/10.1214/aoms/1177698950)
- [Gneiting & Raftery, predictive distributions](https://sites.stat.washington.edu/raftery/Research/PDF/Gneiting2007jasa.pdf)
- [Conformal prediction](https://arxiv.org/abs/0710.3742)
- [Calibration in modern neural networks](https://proceedings.neurips.cc/paper/2019/hash/5103c3584b063c431bd1268e9b5e76fb-Paper.pdf)
- [Temporal constraint reasoning](https://doi.org/10.1016/0004-3702(91)90006-6)
- [Pearl, causal inference](https://proceedings.mlr.press/v6/pearl10a/pearl10a.pdf)
- [JITAI micro-randomized trials](https://doi.org/10.1007/s12160-016-9830-8)
- [mHealth intervention design](https://pmc.ncbi.nlm.nih.gov/articles/PMC4732571)
- [Information systems decision support](https://doi.org/10.1287/isre.1070.0111)
- [NIST AI RMF](https://doi.org/10.6028/NIST.AI.100-1)
- [NIST Privacy Framework](https://nvlpubs.nist.gov/nistpubs/CSWP/NIST.CSWP.01162020.pdf)
- [Privacy self-management limits](https://digitalcommons.law.uw.edu/wlr/vol79/iss1/10)
- [Adaptive data systems](https://doi.org/10.14778/3157794.3157797)
