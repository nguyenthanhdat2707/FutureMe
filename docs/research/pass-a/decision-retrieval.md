# Pass A — Decision Reasoning, Retrieval, Question Value, and Abstention Audit

> **Status:** Pass A research audit; transfer assessment only  
> **Date:** 2026-09-20  
> **Scope:** Decision reasoning, decision-context retrieval, value-of-information question ranking, abstention/selective prediction, and automation bias  
> **Not in scope:** Final architecture, final schema, application implementation, model/vendor selection, autonomous action, or approval of the prior synthesis  
> **Evidence rule:** Repository contracts control product intent. [`RECOVERED_SUBAGENT_EVIDENCE.md`](../RECOVERED_SUBAGENT_EVIDENCE.md) and [`web-search-results.json`](../evidence/web-search-results.json) are reusable evidence inputs, not self-validating conclusions.

## 1. Executive finding

Future Me needs a **decision audit trail**, not an oracle. Its contracted role is to retrieve sufficiently trustworthy context, expose options and trade-offs, state uncertainty, and leave the choice with the user. No reviewed method establishes an objectively correct personal recommendation from sparse, changing evidence.

The methods answer different questions:

- **Expected utility** asks which option has the highest probability-weighted value, but only after probabilities, consequences, utility scales, and risk attitude are defensible.
- **MCDA** makes multiple criteria and value judgments explicit. **Pareto analysis** can remove dominated options without inventing weights. **Sensitivity analysis** tests whether a recommendation survives plausible changes to weights, probabilities, and assumptions.
- **Robust decision making (RDM)** searches for options that remain acceptable across multiple plausible futures; it is preferable to false probabilistic precision under deep uncertainty. It is distinct from formal robust optimization.
- **Case-based reasoning (CBR)** retrieves prior situations as analogies, then requires explicit adaptation and outcome checking. Similarity is not proof that the same action will work.
- **Hybrid semantic-temporal retrieval** should combine decision relevance with validity time, recording time, status, provenance, and contradiction handling. Semantic similarity or recency alone is unsafe.
- **Value of information (VOI)** ranks a question by expected improvement in the downstream decision minus effort, delay, interruption, and privacy costs. **Information gain** ranks uncertainty reduction; it may value facts that cannot change the decision.
- **Selective prediction** supplies the right operational metaphor for abstention: evaluate both error among answered cases and coverage. Its published guarantees do not transfer automatically to open-ended personal decisions.

The strongest Pass-A transfers are qualitative and auditable: explicit criteria and hard constraints; dominance and sensitivity checks; bounded retrieval with time/provenance filters; decision-centric question gating; a visible `ABSTAIN / ASK / PRESENT_OPTIONS_ONLY` path; and interface controls against automation bias. Numerical expected utility, learned personal weights, learned VOI, formal RDM ensembles, calibrated selective-risk thresholds, and automated adaptation of past cases remain deferred.

## 2. Repository contract anchors

| ID | Confirmed repository evidence | Consequence for this audit |
|---|---|---|
| PC-01 | [`PRODUCT.md`](../../PRODUCT.md) defines the core value as maintaining enough trustworthy personal context to improve consequential decision support. It requires relevant context, options, trade-offs, forecasted consequences, a recommendation, and uncertainty, while the user remains decision owner. | Decision reasoning is advisory and must expose uncertainty and trade-offs rather than present an objective answer. |
| PC-02 | [`MVP_SCOPE_UPDATED.md`](../../MVP_SCOPE_UPDATED.md) defines a user-invoked flow: retrieve relevant context, evaluate options/trade-offs, recommend, let the user decide, then retain outcome/feedback. It permits a context check when important information is missing and says unnecessary interruptions should be avoided. | Retrieval, question ranking, abstention, and outcome separation are contract-relevant. Continuous autonomous optimization is not. |
| PC-03 | [`DOMAIN_CONTRACT.md`](../../DOMAIN_CONTRACT.md) distinguishes plans, observations, inferred state, forecasts, decisions, interventions, outcomes, and feedback. Important context carries provenance/freshness, and low confidence may cause the system to ask rather than act. `userChoice` and `Outcome` are separate from `recommendation`. | A recommendation cannot overwrite evidence, equal user choice, or count acceptance as success. Unknown and stale context must remain representable. |
| PC-04 | [`src/intelligence/interfaces.ts`](../../../src/intelligence/interfaces.ts) separates `getRelevantContext`, `supportDecision`, and `clarificationNeeded`. | The current interface leaves room for retrieval and abstention policy but does not define their semantics or thresholds. |
| PC-05 | [`src/intelligence/mock-decision-engine.ts`](../../../src/intelligence/mock-decision-engine.ts) is explicitly provisional. It prompts an LLM over goals, commitments, and state, accepts model-supplied confidence, and always returns an empty clarification list. | Current behavior is implementation evidence of a gap, not a validated decision policy. It does not demonstrate VOI, calibration, abstention, or automation-bias control. |
| PC-06 | Existing Pass-A audits require provenance-first evidence, separate valid/recorded time, preserved `UNKNOWN`/`CONFLICTED`, assumption-visible scenarios, and an advisory LLM boundary. | This audit reuses those constraints rather than creating a competing evidence or forecasting model. |

## 3. Method comparison and selection boundary

| Method | Primary question | Minimum defensible inputs | Useful near-term role | Main failure mode | Pass-A disposition |
|---|---|---|---|---|---|
| Expected utility | Which action maximizes expected preference-weighted outcome? | Mutually understood options, outcome states, probabilities, utility/value model, risk attitude | Explain a small decision when inputs are explicitly elicited; otherwise use qualitatively | Guessed probabilities or utilities create precise-looking fiction | **DEFER numeric use; USE the decomposition** |
| MCDA | How do options compare across several criteria? | Explicit criteria, direction, units/scales, hard constraints, user-authorized weights or an acknowledged partial order | Make trade-offs visible; keep incomparable criteria separate | Arbitrary normalization/weights hide value judgments | **USE qualitatively; DEFER learned weights** |
| Pareto analysis | Is any option no worse on every accepted criterion and better on at least one? | Comparable option-by-criterion judgments and declared uncertainty | Remove clearly dominated options without forcing a total ranking | Measurement error or omitted criteria can create false dominance | **USE with uncertainty labels** |
| Sensitivity analysis | Does the conclusion change under plausible inputs or weights? | Declared ranges/scenarios and a decision rule | Expose brittle recommendations and identify decisive assumptions | Implausibly narrow ranges manufacture stability | **USE** |
| Robust decision making | Which option performs acceptably across many plausible futures? | Candidate actions, scenarios, vulnerability/acceptability measures, regret or robustness definition | Stress-test choices under deep uncertainty | Scenario set and acceptability threshold encode hidden policy | **USE as a small stress-test; DEFER formal ensemble** |
| Formal robust optimization | Which decision satisfies constraints across a mathematical uncertainty set? | Numeric decision variables, objective, constraints, justified uncertainty set and recourse | Later bounded scheduling/capacity problems | Over-wide sets are unusably conservative; narrow sets provide false safety | **DEFER** |
| Case-based reasoning | Which prior cases are similar, and how should their solutions be adapted? | Structured problem/context features, action, outcome, differences, case quality | Retrieve inspectable precedents and counterexamples | Surface similarity, survivorship bias, missing outcomes, and copied mistakes | **USE as evidence; DEFER automatic adaptation** |
| Hybrid semantic-temporal retrieval | Which evidence is relevant to this decision and valid for the decision time? | Decision query, typed claims, valid/recorded time, status, provenance, contradiction and access metadata | Produce a bounded evidence set with fresh and conflicting items visible | “Newest” or “closest embedding” silently displaces authoritative or valid evidence | **USE the principle; DEFER learned ranker** |
| VOI | Is a question worth asking because its answer may improve the action? | Current action choice, possible answers, resulting decisions/values, answer probabilities or bounds, total query cost | Deterministic question gate and ordinal ranking | Bad utility/cost assumptions; myopia; repeated questioning | **USE heuristic; DEFER calibrated numeric/sequential VOI** |
| Information gain | Which observation is expected to reduce uncertainty most? | Belief distribution and information measure | Diagnostic tie-breaker or model-learning objective | Can prefer irrelevant uncertainty that never changes an action | **REJECT as the sole question policy** |
| Selective prediction | When should the system answer versus abstain? | Defined loss, labeled evaluation set, score/selector, coverage target | Explicit abstention vocabulary and evaluation discipline | Miscalibrated confidence; unknown losses; distribution shift | **USE the concept; DEFER statistical guarantees** |

These methods can be composed for analysis, but this audit does not prescribe a component graph or runtime architecture. A defensible sequence is conceptual: remove infeasible/dominated options, show criterion trade-offs, test sensitivity/robustness, ask only decision-changing questions, and abstain when remaining support is inadequate. That is a reasoning discipline, not an implementation decision.

## 4. Structured claim records

### CR-01 — Expected utility is conditional analysis, not an objective recommendation

- **Question:** When may Future Me rank options by expected utility?
- **Mechanism / claim:** Expected utility compares each option using consequences across uncertain states, their probabilities, and the user's value for those consequences. The output is conditional on all three inputs and the assumed risk attitude.
- **Sources:** Howard and Matheson, “Influence Diagrams,” reprinted in *Decision Analysis*, [DOI 10.1287/deca.1050.0020](https://doi.org/10.1287/deca.1050.0020); MIT 14.124, *Decision Making under Uncertainty*, [lecture notes](https://ocw.mit.edu/courses/14-124-microeconomic-theory-iv-spring-2017/52e80271a5a92ebed25c55f3f2ca6e69_MIT14_124S17_Notes1.pdf); existing Pass-A decision-analysis boundary in [`dependency-scenario.md`](dependency-scenario.md#cr-06--influence-diagrams-can-structure-decisions-but-do-not-confer-causality-or-trustworthy-utility).
- **Supports:** Separating chance, action, information, consequence, and value; comparing actions under an explicitly assessed model; showing how new information can change the preferred action.
- **Does not support:** LLM-generated probabilities or utilities as measurements; treating confidence as probability; assuming the system knows the user's utility; causal claims from influence-diagram arrows; one universal utility scale for a person's life.
- **Assumptions:** Options and outcome horizons are defined; probabilities are coherent or explicitly bounded; value judgments come from the user; hard constraints are not traded away by a score; material uncertainty is included.
- **Counter-evidence / limitations:** Sparse, nonstationary personal histories rarely identify reliable probabilities. Some values are incommensurable, lexicographic, or rights-like. A qualitative comparison can be more faithful than a precise number.
- **Failure conditions:** Hidden options; guessed probabilities; arbitrary utility normalization; double-counted criteria; unmodeled tail harms; a recommendation that flips under small plausible changes without disclosure.
- **Future Me transfer:** Preserve the decomposition—options, uncertain states, consequences, values, and assumptions. Do not make numeric expected utility a default requirement.
- **Transfer confidence:** **High** for the decomposition and conditionality; **low-to-medium** for numeric personalized expected utility with current evidence.

### CR-02 — MCDA, Pareto screening, and sensitivity preserve plural values better than a premature scalar

- **Question:** How should Future Me compare options when several goals and constraints matter?
- **Mechanism / claim:** MCDA keeps criteria explicit. Pareto screening identifies an option as dominated only when another is at least as good on every accepted criterion and better on one. Sensitivity analysis varies weights, probabilities, thresholds, and uncertain measurements to reveal whether a ranking is stable.
- **Sources:** Keeney and Raiffa, *Decisions with Multiple Objectives: Preferences and Value Tradeoffs*, [Cambridge edition](https://doi.org/10.1017/CBO9781139174084); Miettinen, *Nonlinear Multiobjective Optimization*, [DOI 10.1007/978-1-4615-5563-6](https://doi.org/10.1007/978-1-4615-5563-6); Saltelli et al., *Global Sensitivity Analysis: The Primer*, [DOI 10.1002/9780470725184](https://doi.org/10.1002/9780470725184).
- **Supports:** Explicit criteria and trade-offs; partial orders when weights are unresolved; dominance screening; testing how assumptions influence the result.
- **Does not support:** Universal criterion weights, automatic normalization across unlike units, majority vote over criteria, or a claim that a Pareto-efficient option is uniquely best.
- **Assumptions:** Criteria are non-duplicative enough to avoid double counting; directions and scales are understood; hard constraints are separated; weight ranges reflect user values; uncertainty in criterion estimates is visible.
- **Counter-evidence / limitations:** MCDA can legitimize arbitrary scores. Nearly every option may be Pareto-efficient when criteria are numerous. Sensitivity results are only as honest as the tested ranges.
- **Failure conditions:** Correlated criteria counted twice; ordinal labels treated as cardinal distances; hidden normalization; dominance declared inside measurement uncertainty; recommendation remains singular when plausible weights select different options.
- **Future Me transfer:** Use explicit criteria, hard-constraint checks, cautious dominance, and “stable / sensitive / unresolved” summaries. Treat weights as user-authorized assumptions, not learned truths.
- **Transfer confidence:** **High** for explicit criteria and sensitivity; **medium** for Pareto screening with uncertain evidence; **low** for automated personal weight learning now.

### CR-03 — Robust decision making complements, but does not replace, expected utility

- **Question:** What should Future Me do when probabilities are not defensible?
- **Mechanism / claim:** RDM explores many plausible futures, finds vulnerabilities, and compares strategies by robustness or regret rather than optimizing against one best-estimate forecast. Formal robust optimization is narrower: it protects a mathematical objective/constraint system against a declared uncertainty set.
- **Sources:** Lempert, Popper, and Bankes, *Shaping the Next One Hundred Years: New Methods for Quantitative, Long-Term Policy Analysis*, [RAND MR-1626-RPC](https://www.rand.org/pubs/monograph_reports/MR1626.html); Bertsimas and Sim, “The Price of Robustness,” [DOI 10.1287/opre.1030.0065](https://doi.org/10.1287/opre.1030.0065); reused boundary analysis in [`dependency-scenario.md`](dependency-scenario.md#cr-08--robust-optimization-protects-against-a-declared-set-with-a-measurable-price-of-robustness).
- **Supports:** Stress-testing across plausible futures; identifying vulnerabilities; making the price of conservatism visible; distinguishing robustness from probability.
- **Does not support:** Calling an option “safe” without naming the futures or constraints protected; assigning likelihoods to scenarios; assuming worst-case protection maximizes personal value.
- **Assumptions:** Scenario families span material uncertainties; acceptability/regret measures are user-authorized; adaptations and reversibility are represented; scenario generation does not omit inconvenient futures.
- **Counter-evidence / limitations:** Scenario choice and robustness thresholds embed value judgments. Too many scenarios can overwhelm explanation; too few can manufacture confidence. Formal optimization can be disproportionate to a small personal decision.
- **Failure conditions:** Narrow scenario set; implausibly broad worst case; all preferences hardened into constraints; nominal cost hidden; “robust” used as a synonym for accurate or beneficial.
- **Future Me transfer:** Use a small, assumption-visible stress test and report where an option fails. Defer formal RDM ensembles and robust optimization until scenarios, measures, and uncertainty sets are validated.
- **Transfer confidence:** **High** for stress-testing and the probability/robustness distinction; **low-to-medium** for formal optimization or quantitative regret now.

### CR-04 — Case-based reasoning supplies precedents, not precedential authority

- **Question:** Can past decisions and outcomes justify a current recommendation?
- **Mechanism / claim:** CBR retrieves similar cases, reuses or adapts a past solution, revises it against the new situation, and retains the new case. For Future Me, a useful case needs the prior context, considered options, action/choice, known outcome, feedback, and important differences—not merely a similar question string.
- **Sources:** Watson and Marir, “Case-based reasoning: A review,” *The Knowledge Engineering Review*, [publisher record](https://www.cambridge.org/core/journals/knowledge-engineering-review/article/abs/casebased-reasoning-a-review/6A1974F0B7242E5785A9330813BE6CF2); Li et al., “A Review of the Development and Future Challenges of Case-Based Reasoning,” [DOI 10.3390/app14167130](https://doi.org/10.3390/app14167130). Both were retained in [`web-search-results.json`](../evidence/web-search-results.json).
- **Supports:** Reusing inspectable experience; retrieving counterexamples; adapting rather than applying a global rule; learning a richer case library over time.
- **Does not support:** “Similar problem, same answer” as a guarantee; causal effect from one past case; treating user acceptance as a positive outcome; an embedding distance as sufficient case similarity.
- **Assumptions:** Case features capture decision-relevant similarity; outcomes are observed on an appropriate horizon; differences can be explained; bad or superseded cases remain identifiable; retention respects purpose and privacy.
- **Counter-evidence / limitations:** Historical choices are selected, confounded, and affected by changing goals. Outcomes may be missing or delayed. Reusing only accepted recommendations creates self-reinforcing selection bias.
- **Failure conditions:** No outcome; changed hard constraint; stale goal; superficially similar text but different stakes; one memorable case dominates; unsuccessful cases are deleted; adaptation rationale is absent.
- **Future Me transfer:** Retrieve a small set of supporting and contrasting cases, show decisive similarities/differences and outcome gaps, and label them as analogies. Defer automated solution adaptation.
- **Transfer confidence:** **Medium-high** for inspectable precedent retrieval; **low** for causal or automated prescriptive transfer.

### CR-05 — Decision-context retrieval must be semantic, temporal, provenance-aware, and contradiction-preserving

- **Question:** What makes a context item eligible and useful for a current decision?
- **Mechanism / claim:** Semantic relevance answers “about the same concern”; temporal reasoning answers “valid for the decision time and known when”; provenance/status answers “where it came from and whether it is observed, inferred, stale, retracted, or conflicted.” These dimensions should remain separable before any ranking score.
- **Sources:** Snodgrass and Ahn, “A Taxonomy of Time in Databases,” [DOI 10.1145/318898.318921](https://doi.org/10.1145/318898.318921); W3C, *PROV-DM*, [Recommendation](https://www.w3.org/TR/2013/REC-prov-dm-20130430/); Re3, “Learning to Balance Relevance & Recency for Temporal Information Retrieval,” [arXiv 2509.01306](https://doi.org/10.48550/arxiv.2509.01306); TimelyRAG, [arXiv 2609.11572](https://arxiv.org/abs/2609.11572). The last two are recent retrieval research retained in [`web-search-results.json`](../evidence/web-search-results.json), not validated Future Me policies.
- **Supports:** Separating relevance from recency; representing valid time separately from recording time; retaining derivation/provenance; treating document evolution and supersession as retrieval concerns.
- **Does not support:** A universal freshness decay; semantic embeddings as truth; newest-wins conflict resolution; direct transfer from public-document QA to private, claim-level personal evidence.
- **Assumptions:** Claims have typed identity and time semantics; access/purpose filters run before ranking; retractions and corrections are represented; retrieved evidence can cite stable IDs; contradictions are not deduplicated away.
- **Counter-evidence / limitations:** The temporal-retrieval papers are recent and concern evolving documents, not longitudinal personal decisions. Some preferences have vague validity; an old durable constraint may outrank a recent weak inference.
- **Failure conditions:** Recency substitutes for validity; transaction time substitutes for event time; ranking hides counter-evidence; copied records appear independent; private but semantically relevant data bypasses purpose limits; no “as-of” reconstruction is possible.
- **Future Me transfer:** Require an eligibility boundary first, then combine topical relevance with explicit time/provenance/status signals. Return supporting, conflicting, and missing evidence separately. Do not select a final ranker in Pass A.
- **Transfer confidence:** **High** for separating eligibility, semantics, time, and provenance; **low-to-medium** for any learned hybrid ranking formula.

### CR-06 — VOI and information gain are not interchangeable

- **Question:** Should Future Me ask the question that reduces uncertainty most?
- **Mechanism / claim:** Information gain values an expected reduction in uncertainty. VOI values the expected increase in the best achievable decision utility after observing an answer, minus acquisition cost. A question can have high information gain but zero decision value if every plausible answer leaves the same action preferred.
- **Sources:** D. V. Lindley, “On a Measure of the Information Provided by an Experiment,” *The Annals of Mathematical Statistics* 27(4), 1956, [DOI 10.1214/aoms/1177728069](https://doi.org/10.1214/aoms/1177728069); MIT 14.124 [decision/VOI notes](https://ocw.mit.edu/courses/14-124-microeconomic-theory-iv-spring-2017/52e80271a5a92ebed25c55f3f2ca6e69_MIT14_124S17_Notes1.pdf); Saar-Tsechansky and Provost, “Decision-Centric Active Learning of Binary-Outcome Models,” [DOI 10.1287/isre.1070.0111](https://doi.org/10.1287/isre.1070.0111); recovered decision-centric findings in [`RECOVERED_SUBAGENT_EVIDENCE.md`](../RECOVERED_SUBAGENT_EVIDENCE.md).
- **Supports:** Keeping statistical information measures distinct from decision value; asking near a decision boundary; subtracting the cost of acquiring information; stopping when no answer can improve the action enough.
- **Does not support:** Treating Lindley's information measure as a complete personal-question policy; assuming entropy reduction equals benefit; exact numeric VOI without utilities, answer likelihoods, and costs.
- **Assumptions:** Candidate answers are sufficiently enumerated; their effect on the decision can be assessed; effort, delay, interruption, privacy, and anchoring costs are included; “do not ask” is an available action.
- **Counter-evidence / limitations:** One-step VOI can miss useful question sequences. A question can alter preferences rather than merely reveal them. The decision-centric active-learning evidence comes from business targeting, not personal planning.
- **Failure conditions:** Asking because confidence is low even though the answer cannot change the decision; ignoring privacy cost; using response rate as value; repeated near-duplicate questions; invented answer probabilities.
- **Future Me transfer:** Use a deterministic counterfactual gate: for each candidate question, test whether plausible answers change feasibility, dominance, recommendation stability, or a material trade-off. Rank surviving questions by ordinal decision impact minus burden; ask at most the contracted minimum.
- **Transfer confidence:** **High** for the VOI-versus-information-gain distinction and decision-changing gate; **medium** for ordinal ranking; **low** for calibrated numeric or multi-step VOI now.

### CR-07 — The Lindley citation must be corrected, and its claim boundary retained

- **Question:** Which primary source is actually identified by the DOI previously attributed to Lindley?
- **Mechanism / claim:** DOI identity is a mechanical prerequisite to claim support. A correctly resolved paper must still be checked for semantic fit.
- **Sources:** `10.2307/2346806` resolves to A. P. Dawid and A. M. Skene, “Maximum Likelihood Estimation of Observer Error-Rates Using the EM Algorithm,” *Applied Statistics* 28(1), 1979, [DOI](https://doi.org/10.2307/2346806). Lindley's paper is D. V. Lindley, “On a Measure of the Information Provided by an Experiment,” 1956, [DOI 10.1214/aoms/1177728069](https://doi.org/10.1214/aoms/1177728069). The mismatch is independently recorded in [`gap-audit.md`](gap-audit.md#32-confirmed-identity-and-attribution-mismatches).
- **Supports:** Rejecting the old DOI attribution; citing the correct Lindley paper for a Bayesian information measure; citing Dawid–Skene for observer error-rate estimation under its own assumptions.
- **Does not support:** Using Dawid–Skene as evidence for VOI; using Lindley's information measure alone as evidence for net decision utility, interruption policy, or personalized question ranking.
- **Assumptions:** DOI metadata and paper identity are verified before using the source; support is assessed against the specific claim rather than title similarity.
- **Counter-evidence / limitations:** Correct metadata does not prove the proposed product transfer. Later VOI and decision-centric acquisition sources are still needed for the question-policy claim.
- **Failure conditions:** The old DOI survives in a bibliography, link label, generated reference, or downstream document; the corrected Lindley citation is still overclaimed as a complete VOI policy.
- **Future Me transfer:** Mark the `10.2307/2346806 → Lindley/VOI` citation as **REJECTED** and use `10.1214/aoms/1177728069` only within the information-measure boundary stated above.
- **Transfer confidence:** **High** for bibliographic identity and rejection of the false citation; **high** for the semantic distinction.

### CR-08 — Selective prediction supplies an abstention discipline, not a ready-made threshold

- **Question:** When should Future Me decline to recommend?
- **Mechanism / claim:** Selective prediction pairs a predictor with a selector that answers only on a subset of cases. Evaluation considers **coverage** (fraction answered) and **selective risk** (error/loss among answered cases). A system can reduce answered-case risk by abstaining, but usefulness falls if coverage collapses.
- **Sources:** C. K. Chow, “On Optimum Recognition Error and Reject Tradeoff,” *IEEE Transactions on Information Theory* 16(1), 1970, [DOI 10.1109/TIT.1970.1054406](https://doi.org/10.1109/TIT.1970.1054406); Geifman and El-Yaniv, “Selective Classification for Deep Neural Networks,” [arXiv 1705.08500](https://arxiv.org/abs/1705.08500). Repository support comes from `UNCERTAIN`, `clarificationNeeded`, and “ask rather than act” contracts.
- **Supports:** An explicit reject/abstain option; measuring risk together with coverage; recognizing that forced answers can be worse than bounded non-answer; making the cost of abstention visible.
- **Does not support:** Applying classification guarantees to open-ended recommendations; using an LLM's self-reported confidence as the selector; one threshold across decision types and stakes; assuming abstention is costless.
- **Assumptions:** A decision-specific loss is definable; outcomes/labels are observable enough for evaluation; abstention routes to a useful next state such as ask, present options only, defer, or escalate; high-stakes categories can use stricter policy.
- **Counter-evidence / limitations:** Personal decisions often lack objective labels and have delayed, multi-criteria outcomes. Selective-classification studies use defined prediction tasks; transfer is conceptual until Future Me has evaluation data.
- **Failure conditions:** “Uncertain” still displays a default recommendation; abstention becomes a generic error; coverage is optimized without risk; risk is estimated on seeded/demo data; unknown distribution shift is ignored; the user cannot proceed without accepting advice.
- **Future Me transfer:** Use explicit outcomes such as `RECOMMEND`, `ASK`, `PRESENT_OPTIONS_ONLY`, `DEFER`, and `OUT_OF_SCOPE`. Defer any calibrated risk/coverage promise until a target, loss, labels, temporal evaluation split, and stakes policy exist.
- **Transfer confidence:** **High** for explicit abstention and joint risk/coverage evaluation; **low** for numeric guarantees or thresholds now.

### CR-09 — User choice alone does not neutralize automation bias

- **Question:** Is it sufficient to state that the user owns the final decision?
- **Mechanism / claim:** Decision aids can produce omission errors (failing to seek or notice contrary information) and commission errors (following incorrect advice). Presentation, workload, verification difficulty, apparent confidence, and defaults affect reliance. Human confirmation can become a rubber stamp.
- **Sources:** “Automation bias and verification complexity: a systematic review,” [DOI 10.1093/jamia/ocw105](https://doi.org/10.1093/jamia/ocw105); “Automation bias: a systematic review of frequency, effect mediators, and mitigators,” [DOI 10.1136/amiajnl-2011-000089](https://doi.org/10.1136/amiajnl-2011-000089); NIST AI RMF 1.0, [DOI 10.6028/NIST.AI.100-1](https://doi.org/10.6028/NIST.AI.100-1); reused Pass-A assessment in [`privacy-llm.md`](privacy-llm.md#cr-11--human-choice-does-not-neutralize-automation-bias-or-transfer-accountability).
- **Supports:** Treating reliance as a socio-technical risk; preserving organizational responsibility; evaluating verification burden, defaults, confidence presentation, and human-AI roles.
- **Does not support:** A universal UI mitigation; assuming explanations always reduce bias; assuming a user click transfers accountability; direct effect-size transfer from clinical or laboratory settings to Future Me.
- **Assumptions:** Recommendations can influence consequential personal choices; the interface can make disagreement easier or harder; evidence and alternatives can be inspected before choice.
- **Counter-evidence / limitations:** The strongest reviewed evidence comes from healthcare, human-factors, or bounded experimental tasks. More explanation can persuade rather than calibrate. Hiding the recommendation entirely can also reduce usefulness.
- **Failure conditions:** Preselected option; high-confidence styling without calibration; counter-evidence hidden below a fold; decline/override is costly; recommendation appears before assumptions; action executes on acceptance; acceptance is logged as correctness.
- **Future Me transfer:** Keep the recommendation advisory; present assumptions, material missing/conflicting evidence, alternatives, and sensitivity; provide an equally easy decline/abstain path; never equate acceptance with success. Specific UI treatments require evaluation rather than assertion.
- **Transfer confidence:** **High** that user ownership is insufficient by itself; **medium** for which presentation controls work best in this product.

### CR-10 — Recommendation quality requires outcome evidence, not acceptance or retrospective narrative

- **Question:** How can Future Me learn whether its retrieval and reasoning helped?
- **Mechanism / claim:** A decision record must keep recommendation, user choice, action, observed outcome, user feedback, decision horizon, and later context distinct. Retrieval/CBR and abstention evaluation require cases with known evidence gaps and outcomes, including rejected recommendations and no-action cases.
- **Sources:** [`DOMAIN_CONTRACT.md`](../../DOMAIN_CONTRACT.md) separates `Decision`, `Outcome`, and `Feedback`; [`MVP_SCOPE_UPDATED.md`](../../MVP_SCOPE_UPDATED.md) ends the hero flow with outcome/feedback as new history; [`RECOVERED_SUBAGENT_EVIDENCE.md`](../RECOVERED_SUBAGENT_EVIDENCE.md) explicitly says to collect outcomes without treating recommendation acceptance as success.
- **Supports:** Auditable replay; learning from accepted and rejected advice; measuring question usefulness by context/recommendation change and later outcomes; detecting systematic abstention or retrieval failures.
- **Does not support:** A causal claim that the recommendation produced the outcome; one outcome metric for all decisions; backfilling missing outcomes from an LLM; treating subjective feedback as universal ground truth.
- **Assumptions:** Outcome windows and meanings are declared; missing/censored outcomes remain missing; user correction can revise interpretation; evidence available at decision time is reconstructable; evaluation avoids leakage from future facts.
- **Counter-evidence / limitations:** Outcomes may be delayed, multi-causal, private, and preference-dependent. Users who return feedback differ from those who do not. Hindsight can alter the remembered rationale.
- **Failure conditions:** Acceptance labeled positive; only recommended/accepted cases retained; future evidence leaks into replay; outcome horizon changes after seeing results; no-action cases disappear; old cases are reused despite a changed objective.
- **Future Me transfer:** Define evaluation cases before claiming personalized decision quality. Preserve decision-time snapshots and separate assistance quality, user satisfaction, observed outcome, and causal effect.
- **Transfer confidence:** **High** for the separation and audit requirement; **low-to-medium** for any aggregate quality score before real longitudinal data.

## 5. Decision-question and abstention boundaries

### 5.1 Minimum question-ranking test

A candidate question is eligible only if all of the following are true:

1. It resolves a named missing, stale, or conflicting claim relevant to the current decision.
2. At least two plausible answers lead to a material difference in feasibility, dominance, sensitivity, recommendation, or a trade-off the user must see.
3. The information cannot be obtained from an already authorized, less burdensome source.
4. Expected benefit is not obviously outweighed by effort, delay, interruption, privacy sensitivity, or anchoring risk.
5. The question is answerable, non-leading, non-duplicative, and permits `Skip`, `Not sure`, or `Later`.

If test 2 fails, information gain is not sufficient reason to ask. If test 4 fails, the correct decision action is `NO_QUESTION`. This is a qualitative VOI gate, not a validated numeric formula.

### 5.2 Minimum abstention vocabulary

| Outcome | Meaning | Required explanation |
|---|---|---|
| `RECOMMEND` | Evidence supports a conditional preference under stated assumptions | Decisive evidence, assumptions, main trade-off, uncertainty, and sensitivity |
| `ASK` | One bounded answer could materially change the decision | The question, why it matters, and an easy non-answer path |
| `PRESENT_OPTIONS_ONLY` | Options/trade-offs can be described, but no preference is defensible | Missing/conflicting values or evidence and what would resolve them |
| `DEFER` | Decision should wait because material evidence is expected soon or the timing is not forced | What is pending, delay cost, and revisit condition |
| `OUT_OF_SCOPE` | Stakes, domain, authority, or evidence exceed the system's supported role | Boundary and appropriate human/professional escalation |

These are research vocabulary recommendations. They do not change the current domain contract or select a schema.

## 6. Pass-A disposition

### USE

- Explicit options, hard constraints, criteria, evidence, assumptions, trade-offs, time horizon, and user choice.
- Pareto screening with uncertainty-aware dominance and sensitivity analysis over plausible weights/inputs.
- Small, assumption-visible robustness stress tests when probabilities are not credible.
- CBR as retrieval of supporting and contrasting precedents with outcomes and differences visible.
- Retrieval eligibility based on authorization/purpose, status, valid time, recorded time, provenance, and contradiction before semantic ranking.
- A deterministic, decision-changing VOI gate with interruption, delay, effort, privacy, and anchoring costs.
- First-class abstention/non-answer outcomes and later evaluation of both risk and coverage.
- Automation-bias controls that preserve alternatives, counter-evidence, uncertainty, easy rejection, and human accountability.
- Separate recommendation, user choice, outcome, feedback, and causal attribution.

### DEFER

- Numeric personalized expected utility until probabilities, utility elicitation, risk attitude, and calibration evidence exist.
- Learned criterion weights, automatic normalization, and personalized trade-off models.
- Formal RDM scenario ensembles, regret optimization, or robust optimization beyond bounded, evidenced problems.
- Learned semantic-temporal rankers and opaque composite relevance/freshness scores.
- Automatic CBR adaptation or policy learning from historical acceptance.
- Numeric or multi-step VOI and learned question policies until costs, outcomes, and longitudinal behavior are measured.
- Calibrated selective-risk thresholds or coverage guarantees until a target, loss, labels, stakes taxonomy, and temporal test set exist.
- Claims that a particular explanation, confidence display, or interface treatment mitigates automation bias without product-specific evaluation.

### REJECT

- `10.2307/2346806` as a Lindley or VOI citation; it is Dawid–Skene.
- Entropy/information gain, model uncertainty, or low confidence as a sufficient reason to interrupt the user.
- Semantic similarity, recency, embedding distance, or a single scalar score as sufficient retrieval authority.
- A forced recommendation when values, evidence, or supported scope are inadequate.
- LLM self-reported confidence as calibrated decision confidence or an abstention selector.
- “Pareto-efficient,” “robust,” or “optimal” as synonyms for objectively best.
- User acceptance as recommendation correctness, outcome success, or causal evidence.
- The statement “the user remains decision owner” as a complete automation-bias or accountability control.

### UNRESOLVED

- Which decision classes and stakes Future Me is permitted to support or must route out of scope.
- How users express hard constraints, criterion priorities, risk attitude, reversibility, and unacceptable outcomes without excessive burden.
- What constitutes a material recommendation/trade-off change for question eligibility.
- The cost scale for interruption, delay, privacy sensitivity, anchoring, and cognitive effort.
- Outcome definitions and observation horizons for different decision types, including censored and subjective outcomes.
- The loss function and target risk/coverage curve for abstention.
- Retrieval evaluation cases, including stale, superseded, contradictory, privacy-restricted, and superficially similar evidence.
- Whether a recommendation should be withheld until after the user forms an initial view in high automation-bias settings.
- How to detect preference drift without interpreting disagreement as user error.

## 7. Edge cases and required behavior

| Edge case | Required Pass-A-safe behavior |
|---|---|
| No explicit options | Clarify the decision frame or present candidate options as hypotheses; do not rank an invented closed set as complete. |
| Only one feasible option | Distinguish “only modeled feasible option” from “best”; expose the constraints and allow challenge/correction. |
| All options violate a hard constraint | Abstain from recommendation, identify the conflicting constraints, and ask whether the frame or constraint is wrong. |
| One option appears dominated but measurements overlap | Do not declare dominance; retain both and show the uncertainty interval or unknown comparison. |
| Plausible weights select different options | Report the recommendation as sensitive and present the decisive value trade-off; do not average away disagreement. |
| Deep uncertainty with no defensible probabilities | Use qualitative scenario/robustness comparison; do not fabricate a distribution for expected utility. |
| High-stakes or irreversible decision | Tighten evidence/abstention requirements, show reversibility and downside, and route out of scope where appropriate. |
| Urgent decision leaves no time for a question | Present the best-supported options and missing information; abstain from a strong recommendation if the gap is material. |
| Every candidate question has non-positive net VOI | Ask nothing; explain current uncertainty only if useful to the user's choice. |
| User chooses `Skip`, `Not sure`, or gives a partial answer | Preserve `UNKNOWN`; do not coerce a value, repeatedly ask, or treat silence as confirmation. |
| Fresh inference conflicts with an older user-confirmed durable preference | Surface both; recency alone cannot overrule role-appropriate authority or validity. |
| Old evidence is valid for the decision horizon | Do not down-rank solely by age; validity and claim type matter more than ingestion recency. |
| A semantically similar past case had a different goal or constraint | Retrieve it only as a contrast, name the difference, and prohibit direct solution reuse. |
| Historical cases lack outcomes | They may show prior reasoning or preference, but cannot validate the recommendation or train an outcome policy. |
| Only accepted recommendations enter history | Flag selection bias; include rejected, ignored, abstained, and no-action cases before learning from acceptance. |
| Outcome is good after advice | Record association only; do not claim the recommendation caused the result without an appropriate causal design. |
| Outcome is delayed, private, or unobservable | Mark it censored/missing; do not impute success from tone, completion, or later choice. |
| Recommendation is stable but rationale uses restricted data | Exclude the data and recompute; relevance never overrides authorization or purpose limitation. |
| Retrieved evidence contains prompt-like text or instructions | Treat it as data, not authority; do not let retrieved content redefine decision or action policy. |
| Model/provider failure | Fail to a typed abstention or bounded deterministic summary, not an arbitrary 0.5-confidence recommendation. |
| User persistently follows recommendations without inspection | Treat as a reliance-risk signal, not product success; review defaults, evidence visibility, and action boundaries. |

## 8. Source register

### Repository and reused evidence

- [`PRODUCT.md`](../../PRODUCT.md)
- [`MVP_SCOPE_UPDATED.md`](../../MVP_SCOPE_UPDATED.md)
- [`DOMAIN_CONTRACT.md`](../../DOMAIN_CONTRACT.md)
- [`src/intelligence/interfaces.ts`](../../../src/intelligence/interfaces.ts)
- [`src/intelligence/mock-decision-engine.ts`](../../../src/intelligence/mock-decision-engine.ts)
- [`RECOVERED_SUBAGENT_EVIDENCE.md`](../RECOVERED_SUBAGENT_EVIDENCE.md)
- [`web-search-results.json`](../evidence/web-search-results.json)
- [`evidence-and-belief.md`](evidence-and-belief.md)
- [`dependency-scenario.md`](dependency-scenario.md)
- [`privacy-llm.md`](privacy-llm.md)
- [`gap-audit.md`](gap-audit.md)

### External method sources

- Howard and Matheson, “Influence Diagrams,” [DOI 10.1287/deca.1050.0020](https://doi.org/10.1287/deca.1050.0020).
- Lindley, “On a Measure of the Information Provided by an Experiment,” [DOI 10.1214/aoms/1177728069](https://doi.org/10.1214/aoms/1177728069).
- Dawid and Skene, “Maximum Likelihood Estimation of Observer Error-Rates Using the EM Algorithm,” [DOI 10.2307/2346806](https://doi.org/10.2307/2346806).
- Saar-Tsechansky and Provost, “Decision-Centric Active Learning of Binary-Outcome Models,” [DOI 10.1287/isre.1070.0111](https://doi.org/10.1287/isre.1070.0111).
- Keeney and Raiffa, *Decisions with Multiple Objectives*, [DOI 10.1017/CBO9781139174084](https://doi.org/10.1017/CBO9781139174084).
- Miettinen, *Nonlinear Multiobjective Optimization*, [DOI 10.1007/978-1-4615-5563-6](https://doi.org/10.1007/978-1-4615-5563-6).
- Saltelli et al., *Global Sensitivity Analysis: The Primer*, [DOI 10.1002/9780470725184](https://doi.org/10.1002/9780470725184).
- Lempert, Popper, and Bankes, *Shaping the Next One Hundred Years*, [RAND MR-1626-RPC](https://www.rand.org/pubs/monograph_reports/MR1626.html).
- Bertsimas and Sim, “The Price of Robustness,” [DOI 10.1287/opre.1030.0065](https://doi.org/10.1287/opre.1030.0065).
- Snodgrass and Ahn, “A Taxonomy of Time in Databases,” [DOI 10.1145/318898.318921](https://doi.org/10.1145/318898.318921).
- W3C, *PROV-DM*, [Recommendation](https://www.w3.org/TR/2013/REC-prov-dm-20130430/).
- Chow, “On Optimum Recognition Error and Reject Tradeoff,” [DOI 10.1109/TIT.1970.1054406](https://doi.org/10.1109/TIT.1970.1054406).
- Geifman and El-Yaniv, “Selective Classification for Deep Neural Networks,” [arXiv 1705.08500](https://arxiv.org/abs/1705.08500).
- “Automation bias and verification complexity: a systematic review,” [DOI 10.1093/jamia/ocw105](https://doi.org/10.1093/jamia/ocw105).
- “Automation bias: a systematic review of frequency, effect mediators, and mitigators,” [DOI 10.1136/amiajnl-2011-000089](https://doi.org/10.1136/amiajnl-2011-000089).

## 9. Self-check

- [x] Covers decision reasoning, context retrieval, VOI/question ranking, abstention, and automation bias.
- [x] Compares expected utility; MCDA, Pareto, and sensitivity; robust decision making; case-based reasoning; hybrid semantic-temporal retrieval; VOI versus information gain; and selective prediction.
- [x] Contains **10** structured claim records, each with sources, support boundary, non-support boundary, assumptions, counter-evidence/limitations, failure conditions, and transfer confidence.
- [x] Corrects the false citation: `10.2307/2346806` is Dawid–Skene; Lindley is `10.1214/aoms/1177728069`.
- [x] Ends with explicit **USE / DEFER / REJECT / UNRESOLVED** dispositions and edge cases.
- [x] Reuses repository contracts, recovered evidence, and the existing web-search result set; no broad research was repeated.
- [x] Makes no final architecture, schema, implementation, provider, or autonomous-action decision.
- [x] Changes only `docs/research/pass-a/decision-retrieval.md`.

