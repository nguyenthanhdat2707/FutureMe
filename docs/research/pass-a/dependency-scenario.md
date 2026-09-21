# Pass A — Dependency, Disruption, Temporal, Scenario, Robustness, and Causal-Boundary Audit

> **Status:** Pass A research audit; transfer assessment only  
> **Date:** 2026-09-20  
> **Scope:** Dependency/disruption semantics, temporal constraints, scenario simulation, robustness, and causal boundaries for Future Me  
> **Not in scope:** Final architecture, final domain schema, implementation, model selection, or approval of the prior deep report  
> **Evidence rule:** Product contracts are repository evidence. `RECOVERED_SUBAGENT_EVIDENCE.md` and the prior deep report are hypothesis inputs that require independent support.

## 1. Executive finding

Future Me can safely make a **deterministic consequence** claim only when the result is entailed by explicit, current, typed constraints and asserted inputs. It can make a **probabilistic forecast** only when a defined future target and horizon are backed by relevant outcome data and evaluated probabilistically. It can run a **scenario simulation** by changing declared assumptions and propagating them through a verified model, but that output remains model-conditional. A **counterfactual estimate** additionally requires an intervention semantics and an identified causal model for the same unit or population. A **causal conclusion** requires a defined estimand and evidence that supports identification, ideally randomized intervention data or a defensible observational design with explicit assumptions.

The methods reviewed are complementary, not substitutes:

- STNs/TCNs, dependency DAGs, CPM, and constraint programming answer different forms of consistency, precedence, scheduling, and resource-feasibility questions.
- Plan repair concerns how to revise a plan after change while controlling unnecessary churn.
- Influence diagrams organize decisions under uncertainty, but their arrows are not automatically causal and their result depends on assessed probabilities and utilities.
- Monte Carlo propagates specified uncertainty through a model; it does not make the model true, calibrated, or causal.
- Robust optimization protects against a declared uncertainty set, often at a cost in nominal performance; it does not estimate the probability of scenarios.
- Counterfactual and causal methods require stronger evidence and assumptions than ordinary forecasting or scenario comparison.

For Future Me, the strongest near-term transfer is a small, typed relationship vocabulary plus deterministic temporal/capacity checks and assumption-visible scenario comparison. Quantitative PERT, Monte Carlo, robust optimization, individualized counterfactuals, and causal effects should remain gated by evidence not currently established in the product contracts.

## 2. Repository contract anchors

These are the controlling repository facts for this audit.

| ID | Contract evidence | Audit consequence |
|---|---|---|
| PC-01 | [`PRODUCT.md`](../../PRODUCT.md) defines the core value as maintaining enough trustworthy personal context for consequential future decisions; it says the problem is not simply scheduling. | Scheduling mechanisms are supporting tools, not the product definition. |
| PC-02 | [`PRODUCT.md`](../../PRODUCT.md) permits proactive action only for context maintenance or a consequential disruption, defined as a detected change that may materially affect an important future commitment. | “Disruption” requires a change, a supported impact path, materiality, and an important future commitment; a graph change alone is insufficient. |
| PC-03 | [`USER_FLOWS.md`](../../USER_FLOWS.md) says no calendar events does not imply free capacity, calendar plans are not observed behavior, unknown is valid, silence is valid, and the user remains the decision owner. | Missing records cannot be converted to available capacity; plan and execution states must not be conflated; uncertainty and no-op outcomes are required. |
| PC-04 | [`USER_FLOWS.md`](../../USER_FLOWS.md) explicitly excludes scoring formulas, confidence calculations, forecast algorithms, and recommendation policy from the interaction contract. | No research method reviewed here is already selected by the product contract. |
| PC-05 | [`DOMAIN_CONTRACT.md`](../../DOMAIN_CONTRACT.md) defines a forecast as a probabilistic belief, never a fact, and marks all MVP scoring, classification, forecasting, and intervention logic provisional. | Existing examples are not validated decision rules or evidence of predictive performance. |
| PC-06 | [`MVP_SCOPE_UPDATED.md`](../../MVP_SCOPE_UPDATED.md) says forecasting is optional for the MVP path, deep behavioral forecasting is out of scope, and the simplest replaceable behavior should be used without invented domain rules. | A deterministic demo can be valid without numerical forecasting; advanced methods have a high burden of proof. |
| PC-07 | [`RECOVERED_SUBAGENT_EVIDENCE.md`](../RECOVERED_SUBAGENT_EVIDENCE.md) proposes STN-style constraints, scenario cloning, robust optimization boundaries, and strict causal wording. | These are useful hypotheses and source leads, not accepted architecture. They are reassessed below. |
| PC-08 | [`FUTURE_ME_DECISION_INTELLIGENCE_RESEARCH.md`](../FUTURE_ME_DECISION_INTELLIGENCE_RESEARCH.md) presents an integrated deep report. Per the Pass A brief, it is treated only as a hypothesis. | Claims are retained only where repository contracts and independent sources support them; architecture prescriptions are not adopted here. |

## 3. Claim-record format

Each substantive conclusion uses this structure:

| Field | Meaning |
|---|---|
| `claim_id` | Stable identifier for this audit only. |
| `claim` | Narrow proposition being assessed. |
| `claim_class` | Repository fact, method capability, boundary, or transfer assessment. |
| `support` | Repository and external evidence that supports the claim. |
| `counter_evidence` | Evidence or reasoning that narrows, competes with, or could defeat the claim. |
| `assumptions` | Conditions that must hold for the claim to transfer. |
| `limitations` | What the method or evidence does not establish. |
| `failure_conditions` | Conditions under which Future Me should abstain, downgrade, or relabel the output. |
| `transfer_assessment` | Smallest defensible use for Future Me, not an architecture decision. |
| `transfer_confidence` | `high`, `medium`, or `low`, scoped to the stated transfer rather than the method in general. |

## 4. Terminology and causal boundaries

### 4.1 Terms that must remain distinct

| Term | Meaning in this audit | Must not silently mean |
|---|---|---|
| Dependency | A typed relation under which one item’s feasibility, validity, or availability depends on another item or resource. | Statistical association or causation. |
| Temporal constraint | A permitted bound on one time point or on the difference between time points. | A claim that the activity actually occurred. |
| Feasible | At least one assignment satisfies the modeled hard constraints. | Desirable, likely, behaviorally realistic, or chosen by the user. |
| Infeasible | No assignment satisfies the modeled hard constraints. | Impossible in reality if the model is incomplete or inputs are estimates. |
| Disruption | A newly observed or asserted change that invalidates a relied-on premise or creates a material constraint violation/risk for an important commitment. | Any deviation, notification-worthy event, or negative outcome. |
| Forecast | A probability or predictive distribution for a defined future target at a defined horizon. | Deterministic propagation, a recommendation, or a causal effect. |
| Scenario simulation | A model run under explicit changed assumptions or decisions. | “What would actually happen,” a calibrated probability, or a causal counterfactual. |
| Robustness | Stability of feasibility or decision quality across declared perturbations or an uncertainty set. | General reliability, truth, or causal validity. |
| Counterfactual estimate | An estimate concerning an outcome under an intervention contrary to the observed treatment/history, defined by a causal framework. | Any hypothetical branch in a calculator. |
| Causal conclusion | A conclusion about an intervention’s effect on a defined outcome for a defined unit/population and time. | Correlation, temporal ordering, dependency, prediction, or simulation. |

### 4.2 Required evidence by claim strength

| Output class | Defensible form | Minimum required evidence | Permitted language | Prohibited upgrade |
|---|---|---|---|---|
| Deterministic consequence | Logical implication within a closed, typed constraint model. | Current asserted inputs; exact or explicitly bounded times/durations; hard/soft status; timezone and calendar semantics; typed dependency path; complete relevant constraints; solver/rule verification; provenance and validity times. | “Given A–D, option X violates constraint C” or “no feasible assignment exists in this model.” | Do not turn estimated duration, missing calendar data, or preference into a hard fact. |
| Probabilistic forecast | `P(Y within horizon H | evidence E, model M)` or a predictive interval. | Predefined target/outcome; horizon; reference class; timestamped training cutoff; repeated comparable outcomes; feature provenance; handling of censoring/drift; out-of-sample evaluation; calibration and proper scoring; baseline comparison. | “The model estimates a 35% chance, calibrated on …” | Do not call a heuristic score a probability or infer causation from predictive drivers. |
| Scenario simulation | Model-conditional propagation after explicit changes to inputs/decisions. | Baseline snapshot; intervention/assumption delta; transition/constraint rules; units; branch-specific assumptions; verification tests; sensitivity ranges; unresolved unknowns. Probabilities require separately justified input distributions. | “Under these assumptions, accepting X leaves two hours of modeled slack.” | Do not label the branch a counterfactual effect or attach likelihood without distributional evidence. |
| Counterfactual estimate | Unit- or subgroup-specific estimate of `Y(a)` versus an unobserved alternative `Y(a')`, often conditioned on observed history. | Precisely defined intervention and outcome; temporal ordering; consistency/SUTVA or stated interference model; causal graph/structural model; identification proof; positivity; exchangeability/no-unmeasured-confounding assumptions or randomization; measurement validity; uncertainty; sensitivity analysis. | “Under assumptions A–F, the estimated counterfactual difference is …” | A scenario clone, matched anecdote, or predictive model alone is not a counterfactual estimator. |
| Causal conclusion | Effect estimand such as ATE, CATE, or proximal intervention effect for a defined population and period. | All counterfactual requirements plus a design that supports the estimand: randomized intervention where feasible, or defensible quasi-experimental/observational identification; treatment adherence; outcome measurement; missingness analysis; pre-specified analysis; robustness and external-validity assessment. | “The intervention increased outcome Y by … for population P under design D.” | Do not generalize an association, before/after change, or single-user history into causal efficacy. |

The boundaries follow the distinction between statistical association and causal analysis in Pearl’s review and the potential-outcome framing in Rubin’s treatment-effect paper ([Pearl 2009](https://doi.org/10.1214/09-SS057); [Rubin 1974](https://doi.org/10.1037/h0037350)).

## 5. Method comparison

| Method | Primary question | Core inputs | Valid result | Key blind spot | Future Me transfer assessment |
|---|---|---|---|---|---|
| STN / general TCN | Are metric temporal constraints mutually consistent; what time windows are feasible? | Time points and unary/binary difference constraints; general TCNs may allow interval disjunctions. | Consistency, feasible windows, implied temporal bounds, or a consistent scenario. | Does not model intent, utility, execution truth, resource capacity by itself, or causation. General disjunction increases complexity. | High for exact/bounded temporal checks; medium for a richer disjunctive model; low for interpreting behavior. |
| STNU and richer uncertain temporal networks | Is there an execution strategy that remains feasible as bounded exogenous durations are revealed? | Executable and contingent time points, valid bounds, observability assumptions. | Strong/weak/dynamic controllability under the formal model. | Bounds may be unjustified for personal behavior; richer conditions/disjunctions can be computationally hard. | Medium only after uncertain-duration semantics are evidenced; low for MVP need. |
| Dependency DAG | Is precedence acyclic; what is upstream/downstream reachability and topological order? | Nodes plus directed, semantically typed edges. | Cycle detection, topological order, affected descendants. | Plain edges do not express lag, duration, resource capacity, probability, utility, or causality. | High as a small structural view if edge types are explicit; low if a generic arrow is allowed to mean everything. |
| Critical path method | Which deterministic-duration activities determine project completion; where is slack? | Project network, fixed activity durations, precedence. | Earliest/latest times, slack, critical path under the fixed model. | Critical path can change when durations change; resource limits and behavioral variability are not solved by basic CPM. | Medium for bounded project-like commitments; low as a general personal decision model. |
| PERT | How might uncertain activity-time estimates affect completion? | Network and elicited activity-time estimates/probability assumptions. | Expected completion approximations or schedule-risk estimates under the PERT assumptions. | Expert three-point estimates, distribution shape, independence, and path-selection effects can be weak; outputs are not automatically calibrated. | Low now; possibly medium after validated duration data and honest uncertainty elicitation. |
| Constraint programming | Is there an assignment satisfying temporal, logical, optional, and resource constraints, possibly optimizing an objective? | Explicit decision variables, domains, hard/soft constraints, resource capacities, and an objective if optimizing. | Feasible schedules, proofs of infeasibility, or optimum/bounds relative to the encoded model. | Garbage-in/omitted-constraint risk; objective functions can encode false precision; combinatorial growth; a feasible schedule need not be acceptable. | Medium for a later constrained scheduler; low as an MVP dependency unless cases exceed simple checks. |
| Plan repair | How can a valid plan be restored after state/goal change while limiting perturbation? | Current observed state, remaining goals, old plan, validity model, and a stability/change-cost metric. | Repaired valid plan with measured deviation from the old one. | Preserving a stale or poor plan may be harmful; high dynamics can make repair inferior or impossible; “minimal change” is value-laden. | High for the principle “recompute only affected parts and show changes”; medium for automated repair. |
| Influence diagram | Which decision has best expected utility given uncertainty and information available at decision time? | Chance, decision, and value nodes; conditional probabilities; utility/preferences; information structure. | Conditional policy/expected utility and sometimes value of information. | Arcs are probabilistic, functional, or informational—not automatically causal; probabilities and utilities may be speculative. | Medium for transparent decision framing and question value; low for precise expected utility without elicitation/data. |
| Monte Carlo | What output distribution results when declared input distributions pass through a model? | Verified model, joint input distributions/dependencies, random sampler, sufficient runs, convergence/error checks. | Numerical approximation to model-implied output distributions and tail probabilities. | It propagates misspecification; repeated sampling does not validate inputs, capture omitted mechanisms, or establish causality. | Medium for later sensitivity/schedule-risk analysis; low for user-facing probabilities until inputs are calibrated. |
| Robust optimization | Which decision remains feasible or performs acceptably across a declared uncertainty set? | Decision model, objective, constraints, uncertainty set/budget, recourse assumptions. | Worst-case or budgeted-uncertainty solution and nominal-versus-robust trade-off. | Uncertainty-set choice dominates the result; broad sets can be unusably conservative; no scenario probabilities are implied. | Medium as a later stress-test; low for formal optimization until objectives and sets are defensible. |
| Counterfactual / causal inference | What would change under an intervention, and is the effect identifiable? | Causal estimand, intervention, causal assumptions/graph, suitable experimental or observational data, measurement and analysis design. | Identified effect estimate with uncertainty, or an explicit non-identifiability result. | Fundamental missing counterfactual, confounding, selection, interference, positivity failures, drift, and limited transportability. | High confidence in the boundary; low confidence that individualized effects are currently supportable. |

## 6. Structured claim records

### CR-01 — STNs are suitable for deterministic metric-time consistency, not behavioral interpretation

- **claim_class:** Method capability and boundary.
- **claim:** A Simple Temporal Network can represent constraints of the form `lower ≤ t_j − t_i ≤ upper` and determine temporal consistency and implied windows in polynomial time. General temporal constraint networks can express disjunctive permitted intervals but are materially harder.
- **support:** Dechter, Meiri, and Pearl define temporal constraint satisfaction problems, distinguish simple from general temporal problems, and show polynomial solvability for the simple case ([Dechter et al. 1991](https://doi.org/10.1016/0004-3702%2891%2990006-6)). This fits Future Me’s explicit calendar start/end times, deadlines, minimum gaps, and ordering constraints.
- **counter_evidence:** Personal commitments often have optionality, uncertain duration, resource limits, recurrence, and changing intent. A pure STN does not represent all of these. Adding disjunction, conditions, and uncertainty increases expressiveness and may raise controllability checking to PSPACE-complete for richer network classes ([Bhargava & Williams 2019](https://doi.org/10.1016/j.artint.2018.11.008)).
- **assumptions:** Timepoints and bounds are correctly normalized; constraints have declared hard/soft status; timezone, all-day, recurrence, and inclusivity semantics are resolved; relevant hard constraints are complete.
- **limitations:** Consistency is relative to the model. An STN cannot show that a calendar event occurred, that the user intends to attend, that a feasible schedule is desirable, or that one activity causes an outcome.
- **failure_conditions:** Unknown or stale bounds; treating estimates as exact; hidden resource constraints; contradictory timezones; recurrence expansion errors; reliance on absent calendar entries as free time.
- **transfer_assessment:** Use STN-style reasoning vocabulary for deterministic time-window and lag checks. Do not infer that Future Me needs a formal STN solver until ordinary interval checks become inadequate.
- **transfer_confidence:** **High** for the semantic transfer; **medium** for near-term solver need.

### CR-02 — A dependency DAG is an explainable structural view only if edge meaning is typed

- **claim_class:** Method capability and semantic boundary.
- **claim:** A DAG supports cycle detection, topological ordering, reachability, and bounded propagation from a changed node; those operations are useful for explaining affected commitments.
- **support:** Kahn’s topological-sorting work establishes the algorithmic basis for ordering acyclic networks and explicitly connects it to PERT-style networks ([Kahn 1962](https://doi.org/10.1145/368996.369025)).
- **counter_evidence:** Many real relations are not acyclic: recurring work, feedback, rework, mutual resource conflict, and belief revision can create cycles. A DAG edge does not say whether the relation is temporal, logical, evidential, resource-based, probabilistic, or causal.
- **assumptions:** Nodes have stable identity and lifecycle; each edge has a single declared semantics and direction; cycles are either invalid for that relation or represented outside the DAG view.
- **limitations:** A DAG alone cannot compute metric slack, model uncertain duration, enforce cumulative capacity, quantify disruption probability, or support causal identification.
- **failure_conditions:** Generic `affects`, `depends_on`, or `causes` edges; mixed semantics in one traversal; silent transitive closure across soft and hard edges; deleting history when a node changes.
- **transfer_assessment:** A typed dependency projection is useful for impact tracing and explanations. It should not become a universal knowledge graph or causal graph by default.
- **transfer_confidence:** **High** for typed reachability; **low** for an untyped graph.

### CR-03 — CPM and PERT answer narrower project-network questions than Future Me’s product problem

- **claim_class:** Comparative method assessment.
- **claim:** CPM is useful for deterministic precedence networks with fixed durations; PERT extends project-network reasoning with uncertain time estimates. Neither is a general personal decision model.
- **support:** Kelley’s CPM formulation uses sequence, duration, and cost information to analyze project timing and delay effects ([Kelley 1961](https://doi.org/10.1287/opre.9.3.296)). The original PERT work uses ordered event networks and probability-expressed elapsed-time estimates to evaluate progress and schedule changes ([Malcolm et al. 1959](https://doi.org/10.1287/opre.7.5.646)).
- **counter_evidence:** Future Me’s choices include preference, value, energy, optional commitments, incomplete observation, and user ownership. These are not captured by a critical path. PERT’s elicited duration distributions can create numerical precision without calibration, and resource constraints can change which path matters.
- **assumptions:** Stable project endpoint; precedence network is valid; activity definitions are comparable; CPM durations are fixed or PERT uncertainty is honestly specified; dependencies between durations are modeled where relevant.
- **limitations:** Basic CPM/PERT does not establish actual human capacity, utility, intervention effect, or causal consequence.
- **failure_conditions:** Applying a project completion model to open-ended life goals; treating three-point estimates as empirical distributions; ignoring shared resources or correlated delays; presenting a critical activity as causally responsible for an outcome.
- **transfer_assessment:** Borrow slack and critical-dependency explanations for bounded projects. Do not make “critical path” the organizing model of all personal context.
- **transfer_confidence:** **Medium** for bounded deadline episodes; **low** for the overall product.

### CR-04 — Constraint programming expands feasible scheduling power but raises modeling and objective risk

- **claim_class:** Method capability and transfer assessment.
- **claim:** Constraint programming can express temporal, disjunctive, optional, and cumulative-resource scheduling constraints more directly than a plain DAG or STN and can search for satisfying or optimizing assignments.
- **support:** The canonical constraint-based scheduling treatment separates problem constraints from search and covers one-machine, cumulative, disjunctive, and objective propagation ([Baptiste, Le Pape & Nuijten 2001](https://doi.org/10.1007/978-1-4615-1479-4)).
- **counter_evidence:** More expressive scheduling is not automatically more truthful. A solver will optimize whatever objective is encoded, including a poor proxy for user values, and omitted constraints remain invisible.
- **assumptions:** Variables/domains are well-defined; hard and soft constraints are distinguished; resources and capacities have defensible units; objectives come from user-authorized preferences; infeasibility explanations are available.
- **limitations:** Feasibility is not preference, and optimization is not recommendation. Solver optimality is conditional on a complete model and does not prove real-world success.
- **failure_conditions:** Hidden or stale commitments; unsupported productivity weights; arbitrary penalty scales; user values collapsed into one score; unexplained “optimal” schedules.
- **transfer_assessment:** Defer a general constraint-programming solver unless real cases require cumulative resources, optional intervals, or richer disjunction than simple checks can handle.
- **transfer_confidence:** **Medium** for later scheduling; **low** as a current dependency.

### CR-05 — Plan repair transfers as a stability principle, not as an obligation to preserve the old plan

- **claim_class:** Method capability and disruption response.
- **claim:** After a material state or goal change, repairing the remaining plan while measuring perturbation can reduce churn compared with full replanning.
- **support:** Fox et al. define plan repair as adapting an existing plan to a new context while minimizing perturbation and report more stable, sometimes more efficient repairs than replanning in their evaluated domains ([Fox et al. 2006](https://cdn.aaai.org/ICAPS/2006/ICAPS06-022.pdf)).
- **counter_evidence:** The same paper notes that in highly dynamic situations stability may be impossible. Minimal change can preserve sunk-cost bias, stale intent, or a plan that was never good. Personal inconvenience is not equivalent to safety-critical plan stability.
- **assumptions:** Current state and goals are known enough; the original plan remains partly relevant; the stability metric reflects user cost; repaired plans are independently revalidated.
- **limitations:** Plan repair does not predict execution, reveal preferences, or prove that the repaired plan is better for the user.
- **failure_conditions:** Goal reversal; many invalidated premises; high environment volatility; repair cost exceeds replanning cost; preserving the old plan conflicts with an explicit user correction.
- **transfer_assessment:** Recompute affected descendants first, compare with a fresh alternative when change is broad, and show what moved and why. Automated repair remains unselected.
- **transfer_confidence:** **High** for selective recomputation and change explanation; **medium** for automatic repair.

### CR-06 — Influence diagrams can structure decisions but do not confer causality or trustworthy utility

- **claim_class:** Decision-analysis boundary.
- **claim:** Influence diagrams compactly represent chance variables, decisions, values, probabilistic dependence, and information available at decision time; evaluated diagrams can support conditional decision policies.
- **support:** Shachter describes influence diagrams as structures for uncertain variables and decisions that reveal probabilistic dependence and information flow and provides an evaluation method ([Shachter 1986](https://doi.org/10.1287/opre.34.6.871)).
- **counter_evidence:** An arc into a decision node is informational, and chance/value arcs need not represent causal effects. Expected-utility results are sensitive to probability and utility assessments, which Future Me does not yet have evidence to estimate precisely.
- **assumptions:** Options are explicit; information timing is correct; conditional probabilities are coherent; utilities or multi-attribute preferences are elicited and sensitivity-tested; the decision maker is the user.
- **limitations:** A diagram can organize unsupported numbers elegantly. It does not identify a causal graph, predict user choice, or show an objectively best life decision.
- **failure_conditions:** LLM-generated probabilities/utilities treated as measurements; arrows described as causes without causal semantics; recommendation changes under plausible preference scales but sensitivity is hidden.
- **transfer_assessment:** Use influence-diagram concepts to separate facts, unknowns, decisions, information, and user values. Numeric expected utility is not justified by the current contracts alone.
- **transfer_confidence:** **Medium** for qualitative framing; **low-to-medium** for quantitative evaluation.

### CR-07 — Monte Carlo quantifies model-implied uncertainty, not real-world truth

- **claim_class:** Simulation capability and evidence boundary.
- **claim:** Monte Carlo sampling can approximate the distribution of outputs induced by a model and declared joint input distributions.
- **support:** The foundational method is a statistical sampling approach to problems whose behavior is specified mathematically ([Metropolis & Ulam 1949](https://doi.org/10.1080/01621459.1949.10483310)). Simulation credibility separately requires verification and validation; running more samples addresses numerical sampling error, not conceptual-model error ([Sargent 1992](https://doi.org/10.1145/167293.167311)).
- **counter_evidence:** Personal durations, energy, interruptions, and dependencies are nonstationary and correlated. Sparse self-history may not identify their joint distribution. Tail outputs can be dominated by guessed inputs.
- **assumptions:** The simulation is correctly implemented; the conceptual model is fit for purpose; units and dependencies are correct; distributions are empirically supported or explicitly subjective; sampling error and convergence are reported.
- **limitations:** Monte Carlo does not validate assumptions, create causal identification, or turn a scenario into a forecast. Its output is conditional on the model and distributions.
- **failure_conditions:** Independent sampling of correlated inputs; undocumented priors; too few effective samples; unvalidated tail behavior; reporting percentiles as personalized facts.
- **transfer_assessment:** Use later for sensitivity exploration when input ranges/distributions are defensible; until then, a small deterministic scenario grid is more honest.
- **transfer_confidence:** **High** for the boundary; **medium** for later use; **low** for current calibrated user-facing probabilities.

### CR-08 — Robust optimization protects against a declared set, with a measurable price of robustness

- **claim_class:** Robustness capability and boundary.
- **claim:** Robust optimization trades nominal performance for feasibility or performance across an uncertainty set; budgeted uncertainty can control conservatism.
- **support:** Bertsimas and Sim formalize the trade-off and probabilistic violation bounds for a class of robust linear/discrete problems while retaining tractability ([Bertsimas & Sim 2004](https://doi.org/10.1287/opre.1030.0065)).
- **counter_evidence:** If the uncertainty set is too narrow, the protection is false; if too broad, the result may waste scarce time and reject useful opportunities. Personal-context uncertainty may be epistemic, semantic, and preference-dependent rather than a bounded numeric coefficient.
- **assumptions:** Decision variables and objectives are explicit; uncertainty sets are justified; hard constraints truly require worst-case protection; recourse and adaptation are modeled; nominal loss is shown.
- **limitations:** Robustness does not attach probabilities to scenarios, guarantee calibration, or prove user benefit. Worst-case feasibility is different from likely success.
- **failure_conditions:** Arbitrary ranges; unbounded or structurally wrong uncertainty; all preferences treated as hard constraints; nominal and robust outcomes not compared; “safe” presented without specifying the protected set.
- **transfer_assessment:** Use robustness first as a stress-test: does a recommendation survive plausible bounds and edge removals? Defer formal robust optimization until sets and objectives are evidenced.
- **transfer_confidence:** **High** for stress-testing principle; **low-to-medium** for formal optimization now.

### CR-09 — Scenario branches are not counterfactual or causal estimates

- **claim_class:** Epistemic boundary.
- **claim:** Cloning the current state, applying “accept workshop,” and propagating modeled time/capacity consequences is a scenario simulation. It becomes a causal counterfactual only if the intervention and structural causal assumptions identify the relevant potential outcome.
- **support:** Pearl distinguishes statistical from causal questions and requires causal assumptions for interventions and counterfactuals ([Pearl 2009](https://doi.org/10.1214/09-SS057)). Rubin’s potential-outcome framework emphasizes that causal effects compare outcomes under treatments whose pair cannot both be observed for the same unit ([Rubin 1974](https://doi.org/10.1037/h0037350)).
- **counter_evidence:** Mechanistic physical constraints can sometimes be causally interpretable from domain knowledge without randomized data—for example, two non-overlappable events cannot occupy the same exclusive resource at the same time. But that narrow structural fact does not identify downstream human outcomes such as deadline success, learning, stress, or productivity.
- **assumptions:** Scenario rules are explicit and verified; causal claims additionally specify the intervention, causal graph/structural equations, estimand, identification assumptions, and supported data/design.
- **limitations:** Personal observational logs are vulnerable to time-varying confounding, self-selection, interference between commitments, measurement error, missing outcomes, and preference drift.
- **failure_conditions:** “What if” used as a synonym for counterfactual; model outputs described as what would have happened; prediction features treated as causes; post-treatment variables adjusted without a causal justification.
- **transfer_assessment:** Label ordinary branches `scenario analysis` or `model-conditional consequence`. Reserve `counterfactual estimate` and causal verbs for independently reviewed causal work.
- **transfer_confidence:** **High**.

### CR-10 — A consequential disruption is a product-level threshold over evidence, dependency impact, and urgency

- **claim_class:** Repository-derived product boundary.
- **claim:** Future Me should surface a disruption only when a new, sufficiently trustworthy change invalidates a relied-on premise or materially worsens feasibility/risk for an important future commitment, with enough urgency that waiting for user invocation has meaningful cost.
- **support:** This follows directly from the proactive-behavior boundary in `PRODUCT.md`, the consequential disruption flow and no-op invariant in `USER_FLOWS.md`, and the MVP rule that no meaningful change should produce no action.
- **counter_evidence:** The contracts do not define numerical materiality, importance, confidence, or urgency thresholds. Those remain provisional; this audit cannot supply them from scheduling literature.
- **assumptions:** Importance is user-grounded; change evidence is fresh and traceable; the impacted path uses valid typed relations; notification/interruption cost is considered.
- **limitations:** A detected conflict may be irrelevant, already known, easily reversible, or based on a soft assumption. A large graph impact is not necessarily consequential to the user.
- **failure_conditions:** No new evidence; only a stale inference changed; path crosses an unsupported relation; impact is below a declared threshold; user already acknowledged it; no time-sensitive action exists.
- **transfer_assessment:** Treat disruption as a derived, explainable assessment with a no-op result—not as a primitive edge or every schedule deviation.
- **transfer_confidence:** **High** for the qualitative boundary; **unknown** for thresholds pending product evidence.

## 7. Temporal and disruption reasoning rules

### 7.1 Deterministic temporal claims

A deterministic claim is allowed only if all operands are deterministic for the decision horizon. For time points `t_i` and `t_j`, an explicit constraint such as `120 min ≤ t_j − t_i ≤ 240 min` can be propagated. If “two to four hours” is merely an uncertain duration estimate, the result is a scenario bound or robustness test, not a fact.

Before declaring infeasibility, require:

1. normalized timezone and calendar semantics;
2. valid start/end/deadline values and interval inclusivity;
3. hard-versus-soft classification;
4. stated duration basis—fixed, bounded, estimated, or unknown;
5. resource exclusivity or capacity evidence;
6. recurrence expansion for the relevant horizon;
7. provenance, `observed_at`, `valid_from`, and expiry/freshness state;
8. a minimal conflicting set or explainable path;
9. explicit unresolved unknowns.

### 7.2 Dependency propagation

Propagation must follow relation-specific rules:

- A failed `REQUIRES` prerequisite can invalidate the dependent item if the dependency is hard and no substitute exists.
- A changed `TEMPORAL_BOUND` can reduce slack or create infeasibility.
- A changed `CONSUMES_RESOURCE` value can create overload only under an explicit capacity/window model.
- Changed evidence can stale or invalidate a derived conclusion through `DERIVED_FROM`; it does not rewrite historical evidence.
- A soft preference or association can change a trade-off score, but cannot create a deterministic “blocked” state.

Stop propagation at an unknown, stale, contradicted, soft, or semantically incompatible edge and report the boundary. Do not multiply or aggregate confidence values without a validated probabilistic model.

### 7.3 Consequential-disruption test

The following is a research-derived checklist, not a final policy:

```text
new trustworthy change
AND a valid typed path to an important future commitment
AND deterministic violation OR material model-conditional risk increase
AND enough urgency that delayed awareness matters
AND unresolved uncertainty is not better handled by one clarification
AND interruption cost does not dominate
→ candidate consequential disruption
ELSE → no-op, update context, or ask selectively
```

## 8. Scenario simulation and robustness probes

### 8.1 Worked boundary example

Suppose a user considers a four-hour workshop before a deadline.

- **Deterministic consequence:** If the workshop has a fixed four-hour interval, the remaining fixed work requires six hours, only seven exclusive hours exist, and the model is complete, accepting the workshop creates a three-hour shortfall. This is a constraint consequence.
- **Scenario simulation:** If work duration is uncertain, compare declared branches such as four, six, and eight hours. Output: “Under the six-hour assumption, modeled slack is −3 hours.”
- **Probabilistic forecast:** “There is a 70% chance of missing the deadline” requires a defensible joint distribution for work duration, interruptions, attendance, and completion behavior plus calibration data. A scenario grid alone cannot support it.
- **Robust statement:** “Skipping the workshop remains feasible for all work durations in the declared [5,7]-hour set; attending does not” is robust only with respect to that set and model.
- **Counterfactual estimate:** After the user attends and misses the deadline, “they would have succeeded had they skipped” is not identified by the schedule model. It requires a causal model for how attendance changes available effort and completion, including confounding and alternative uses of time.
- **Causal conclusion:** “Workshop attendance causes missed deadlines” would require a population, intervention definition, outcome window, and causal design; an individual episode does not establish it.

### 8.2 Required scenario record

Every scenario result should disclose at least:

```yaml
baseline_snapshot_id:
decision_or_change:
assumptions_added:
facts_held_fixed:
rules_or_constraints_applied:
hard_violations:
soft_tradeoffs:
propagated_effects:
unresolved_unknowns:
sensitivity_cases:
model_version:
result_label: deterministic_consequence | scenario_projection | probabilistic_forecast
```

This is a reporting contract for research evaluation, not a final storage schema.

### 8.3 Robustness and falsification probes

Before trusting a scenario comparison, test:

| Probe | Question | Failure signal |
|---|---|---|
| Input sensitivity | Does the recommendation flip under plausible duration/capacity ranges? | A small unsupported perturbation reverses the answer. |
| Edge sensitivity | Does removing one low-confidence dependency eliminate the disruption? | The result rests on a weak or ambiguous relation. |
| Freshness sensitivity | Does expiring stale evidence change feasibility or trade-offs? | Old context silently drives the result. |
| Missing-capacity test | Does “no calendar event” supply capacity? | The model violates the absence-of-evidence invariant. |
| Alternative-model test | Do a simple interval model and richer scheduler disagree? | Hidden semantics or solver assumptions require explanation. |
| Baseline comparison | Is the advanced model better than a transparent fixed-rule baseline? | Complexity adds no validated decision value. |
| Adversarial case | Can a feasible but obviously unacceptable schedule be generated? | Preferences/soft constraints are incomplete. |
| Repair-versus-replan | Does local repair preserve a bad plan or create excessive churn? | Stability metric is misaligned with user cost. |
| Distribution stress | Do Monte Carlo tails change under plausible correlations/distributions? | Numerical risk claims are input-model artifacts. |
| Causal placebo | Does a supposed “cause” predict pre-treatment or unrelated outcomes? | Confounding, leakage, or misspecification is likely. |

## 9. Smallest useful relationship ontology — transfer assessment only

This is the smallest vocabulary that appears capable of supporting explainable dependency impact without collapsing scheduling, evidence, and causality. It is **not** a final design.

### 9.1 Candidate asserted relations

| Relation | Semantics | Required qualifiers | Why it earns inclusion |
|---|---|---|---|
| `REQUIRES(dependent, prerequisite)` | The dependent item cannot satisfy a declared condition unless the prerequisite is satisfied. | hard/soft, satisfaction condition, validity interval, source. | Supports prerequisite failure propagation without pretending all dependencies are temporal. |
| `TEMPORAL_BOUND(from, to)` | Constrains `time(to) − time(from)` to a permitted interval. | lower, upper, units, hard/soft, timezone/calendar semantics, source. | Covers precedence, minimum gap, maximum lag, deadline, and window reasoning in one precise form. |
| `CONSUMES(item, resource)` | The item consumes a quantity of a capacity-limited resource in a window. | quantity/range, unit, interval, capacity source, uncertainty status. | Makes time, attention, or other capacity conflict explicit instead of inferring it from blank calendars. |
| `EXCLUDES(a, b)` | The two alternatives or occurrences cannot both be selected/realized under a stated condition. | scope, condition, hard/soft, source. | Represents genuine mutual exclusion that neither precedence nor resource quantity always captures. |
| `DERIVED_FROM(derived, evidence)` | A conclusion, scenario input, or disruption assessment relies on evidence. | policy/model version, derivation time, evidence validity. | Supports invalidation, audit, and explanation when evidence changes. |

### 9.2 Candidate derived relations/states

- `CONFLICTS_WITH(a,b)` should be computed from violated temporal, resource, or exclusion constraints and retain the minimal conflicting set.
- `INVALIDATED(derived, change)` should be computed when a `DERIVED_FROM` premise is retracted, superseded, expired, or contradicted.
- `AT_RISK(commitment, scenario)` is model-conditional and must state assumptions; it is not a deterministic edge.
- `DISRUPTION(change, commitment)` is a product-level assessment requiring materiality and urgency; it should not be an asserted primitive relationship.

### 9.3 Explicit exclusions

- Do not include a generic `AFFECTS` edge; it is too weak to determine propagation semantics.
- Do not include `CAUSES` in the operational ontology without a separately governed causal model and evidence review.
- Do not encode `ENABLES` or `BLOCKS` without reducing it to `REQUIRES`, `EXCLUDES`, a temporal bound, a resource constraint, or an explicitly soft preference relation.
- Do not assign probabilities to edges unless they are tied to a defined target, horizon, data set, estimator, and calibration evidence.

**Transfer confidence:** **Medium-high** that the five asserted relations are enough for early audit/prototyping; **low** that they are sufficient as a final domain ontology. Real examples must test substitution, optional activities, recurring commitments, shared resources, and multi-party dependencies before freezing anything.

## 10. What evidence is still required

### 10.1 Before deterministic disruption claims

- Real Future Me cases with explicit hard/soft dependencies, timezones, recurrence, and resource capacity.
- A definition of commitment importance, impact materiality, and urgency owned by product policy.
- Evidence that the relevant constraint set is sufficiently complete for the stated conclusion.
- Tests showing minimal conflict explanations and correct handling of missing/stale/contradictory inputs.

### 10.2 Before probabilistic forecasts

- A stable target such as “commitment completed by deadline,” outcome capture rules, horizon, and censoring policy.
- Repeated timestamped forecasts and outcomes across relevant contexts.
- Baseline forecasts, out-of-sample splits that respect time, Brier/log/interval scoring as appropriate, and calibration by horizon/context.
- Drift monitoring and a rule for abstaining when the reference class is too small or has changed.

### 10.3 Before Monte Carlo or PERT risk percentages

- Empirical or defensibly elicited joint distributions, including correlation and tail behavior.
- Verification of propagation code and validation against held-out or retrospective cases.
- Sensitivity to alternative distributions and transparent separation of epistemic assumptions from observed variation.

### 10.4 Before robust optimization

- User-authorized objectives and hard constraints.
- Justified uncertainty-set construction and recourse assumptions.
- Explicit nominal-versus-robust trade-off and evidence that conservatism improves the decision experience.

### 10.5 Before counterfactual or causal conclusions

- A precise intervention, comparator, outcome, population/unit, and time horizon.
- A causal graph or structural model reviewed for temporality, confounders, mediators, colliders, interference, and measurement.
- Identification analysis and support for its assumptions.
- Preferably randomized or micro-randomized intervention data for notification/prompt effects; otherwise a defensible quasi-experimental strategy.
- Positivity, missingness, adherence, spillover, sensitivity, heterogeneity, and transportability analysis.
- A predeclared rule for reporting “not identifiable” rather than forcing an estimate.

## 11. Overall assumptions, limitations, and failure conditions

### Assumptions of this audit

- The current product contracts describe intended behavior more authoritatively than the recovered reports.
- The cited methods transfer only at the level explicitly stated; success in project scheduling, industrial optimization, or health intervention research does not automatically transfer to personal decision support.
- Future Me continues to preserve user ownership, uncertainty, provenance, correction history, and no-op behavior.

### Limitations

- This is literature and contract analysis, not evaluation on Future Me user data.
- No repository implementation was inspected as evidence of algorithm performance, because the request is a product-method audit and current logic is explicitly provisional.
- The report does not select a solver, data model, forecasting model, objective, threshold, or architecture.
- Canonical literature establishes method properties, not Future Me product efficacy.
- Personal time, energy, preference, and behavior may be poorly captured by formal scheduling variables; user research remains necessary.

### Global failure conditions

Future Me should abstain or downgrade the claim if any of these apply:

- a plan is treated as an observation of actual behavior;
- missing data is treated as zero demand or free capacity;
- a soft or inferred relation is propagated as hard;
- uncertainty is compressed into an unexplained confidence number;
- a scenario is presented without its changed assumptions;
- a probability lacks target, horizon, reference class, and calibration evidence;
- robustness is claimed without naming the perturbations or uncertainty set;
- a dependency arrow is described as causal merely because it is directed;
- an individualized counterfactual is produced from observational history without identification;
- the recommendation is presented as the user’s decision or as objectively optimal.

## 12. Pass A disposition

| Topic | Disposition | Transfer confidence |
|---|---|---|
| Typed dependency reachability | Retain as a useful structural concept; test on real cases. | High |
| Exact/bounded temporal consistency | Retain for deterministic checks; solver choice remains open. | High |
| STNU/richer TCN controllability | Defer pending demonstrated uncertain-duration need and valid bounds. | Medium concept / low current need |
| CPM slack/critical dependency | Borrow selectively for bounded project episodes. | Medium |
| PERT numeric risk | Defer pending distributions and calibration. | Low now |
| Constraint programming | Candidate only when simple checks fail on resource/disjunction complexity. | Medium later |
| Plan repair | Retain selective-recomputation and change-explanation principle; no automated policy selected. | High principle / medium automation |
| Influence diagrams | Retain separation of decisions, uncertainty, information, and value; avoid unsupported numeric utility. | Medium |
| Monte Carlo | Retain as later sensitivity tool; not a current truth or probability generator. | Medium later |
| Robust optimization | Retain stress-testing idea; defer formal optimization. | High principle / low-to-medium formal use |
| Scenario simulation | Retain with explicit assumptions and model-conditional labeling. | High |
| Individual counterfactual estimates | Defer until a causal estimand and identification evidence exist. | Low now |
| Causal conclusions | Require separate causal-design review; default to noncausal language. | High boundary |
| Five-relation transfer ontology | Prototype and falsify; do not freeze as final design. | Medium-high prototype / low finality |

## 13. Sources

Primary, canonical, or peer-reviewed sources used for method claims:

1. R. Dechter, I. Meiri, and J. Pearl, “Temporal Constraint Networks,” *Artificial Intelligence* 49 (1991), 61–95. [DOI](https://doi.org/10.1016/0004-3702%2891%2990006-6)
2. N. Bhargava and B. C. Williams, “Complexity Bounds for the Controllability of Temporal Networks with Conditions, Disjunctions, and Uncertainty,” *Artificial Intelligence* 271 (2019), 1–17. [DOI](https://doi.org/10.1016/j.artint.2018.11.008)
3. A. B. Kahn, “Topological Sorting of Large Networks,” *Communications of the ACM* 5(11) (1962), 558–562. [DOI](https://doi.org/10.1145/368996.369025)
4. J. E. Kelley Jr., “Critical-Path Planning and Scheduling: Mathematical Basis,” *Operations Research* 9(3) (1961), 296–320. [DOI](https://doi.org/10.1287/opre.9.3.296)
5. D. G. Malcolm, J. H. Roseboom, C. E. Clark, and W. Fazar, “Application of a Technique for Research and Development Program Evaluation,” *Operations Research* 7(5) (1959), 646–669. [DOI](https://doi.org/10.1287/opre.7.5.646)
6. P. Baptiste, C. Le Pape, and W. Nuijten, *Constraint-Based Scheduling: Applying Constraint Programming to Scheduling Problems* (2001). [DOI](https://doi.org/10.1007/978-1-4615-1479-4)
7. M. Fox, A. Gerevini, D. Long, and I. Serina, “Plan Stability: Replanning versus Plan Repair,” *ICAPS 2006*. [AAAI proceedings PDF](https://cdn.aaai.org/ICAPS/2006/ICAPS06-022.pdf)
8. R. D. Shachter, “Evaluating Influence Diagrams,” *Operations Research* 34(6) (1986), 871–882. [DOI](https://doi.org/10.1287/opre.34.6.871)
9. N. Metropolis and S. Ulam, “The Monte Carlo Method,” *Journal of the American Statistical Association* 44(247) (1949), 335–341. [DOI](https://doi.org/10.1080/01621459.1949.10483310)
10. R. G. Sargent, “Validation and Verification of Simulation Models,” *Winter Simulation Conference* (1992), 104–114. [DOI](https://doi.org/10.1145/167293.167311)
11. D. Bertsimas and M. Sim, “The Price of Robustness,” *Operations Research* 52(1) (2004), 35–53. [DOI](https://doi.org/10.1287/opre.1030.0065)
12. J. Pearl, “Causal Inference in Statistics: An Overview,” *Statistics Surveys* 3 (2009), 96–146. [DOI](https://doi.org/10.1214/09-SS057)
13. D. B. Rubin, “Estimating Causal Effects of Treatments in Randomized and Nonrandomized Studies,” *Journal of Educational Psychology* 66(5) (1974), 688–701. [DOI](https://doi.org/10.1037/h0037350)

## 14. Source and file self-check criteria

This report is complete only if:

- every external method claim maps to a source in §13;
- all external links use DOI or stable publisher/proceedings URLs;
- local contract links resolve from this file;
- “scenario,” “forecast,” “counterfactual,” and “causal” are not used interchangeably;
- every claim record contains support, counter-evidence, assumptions, limitations, failure conditions, transfer assessment, and transfer confidence;
- no section selects a final architecture or instructs implementation;
- the prior deep report is never treated as dispositive evidence.

### Self-check result — 2026-09-20

- File parsed successfully: 464 lines before this result block, 10 claim records (`CR-01` through `CR-10`), and no missing required claim fields.
- All eight local contract/research links resolve from this file’s directory.
- All 13 unique external source URLs were requested with redirect following. Five returned content directly; eight DOI links resolved to the expected ACM, APA, INFORMS, or Taylor & Francis publisher page and then returned HTTP 403 to the automated client. No source returned 404, an unresolved DOI, or a transport failure.
- Method coverage check passed for STN/TCN, DAG, CPM/PERT, constraint programming, plan repair, influence diagrams, Monte Carlo, robust optimization, and counterfactual/causal inference.
- Scope check passed: the document gives transfer assessments and evidence gates, not a final architecture or implementation plan.
