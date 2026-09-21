# Pass A — PersonalState and epistemic uncertainty audit

**Date:** 2026-09-20  
**Scope:** `PersonalState`, observability, labeling, and epistemic uncertainty only  
**Decision boundary:** research audit; no final architecture and no feature implementation  
**Evidence posture:** project documents define the product's current claims but do not validate them scientifically. The downloaded deep-research report is treated only as a source of hypotheses and search leads.

## Inputs reviewed

- [Product definition](../../PRODUCT.md)
- [Updated MVP scope](../../MVP_SCOPE_UPDATED.md)
- [Domain contract](../../DOMAIN_CONTRACT.md)
- [User flows](../../USER_FLOWS.md)
- [Recovered subagent evidence](../RECOVERED_SUBAGENT_EVIDENCE.md)
- `/home/tdat/Downloads/deep-research-report(3).md` — hypothesis input only; no claim below is accepted because this report asserts it.

## Executive determination

1. **The current five labels are not a coherent single latent state space.** They mix at least four different constructs: plan alignment (`FLOW`, `DRIFTING`), plan validity after an event (`DISRUPTED`), demand–capacity relation (`OVERLOADED`), and the system's lack of knowledge (`UNCERTAIN`). These can co-occur, so a single mutually exclusive enum would discard material information.
2. **Under the current contract, `UNCERTAIN` is epistemic state, not user state.** The contract defines it as the system lacking trustworthy information. In HMM/POMDP terms, it belongs to the estimator's belief quality—not beside candidate world/user states.
3. **Uncertainty can also be a user state, but that is a different construct.** A user may feel unsure about a decision or lack confidence in a judgment. That requires its own definition and evidence; it must not be inferred from the model's uncertainty or represented by the current `UNCERTAIN` label.
4. **HMM/POMDP semantics support a belief over hidden state; they do not validate these five labels.** An HMM would require defensible transition and emission assumptions. A POMDP additionally requires actions, observation effects, rewards, and a sufficient environment state. The project has not yet supplied the longitudinal labels or validated measurements needed to justify either model family.
5. **The safe Pass-A transfer is semantic separation and explicit abstention.** Preserve observations and provenance; express insufficient evidence explicitly; do not treat plans, app activity, silence, or model-generated classes as ground-truth user state.

## 1. State-space test

Canonical HMM semantics distinguish an unobserved state process from observations emitted conditionally on the current state; the hidden process is ordinarily modeled with a Markov transition assumption [S1]. A POMDP uses a probability distribution over possible environment states—a belief state—as the information available for action under partial observability [S2]. Neither formalism says that a product team's labels are valid constructs; construct validity requires evidence that the interpretation assigned to a measure is warranted [S3].

| Current label | Contract meaning | What it actually describes | Directly observable? | Can co-occur with | HMM/POMDP semantic result |
|---|---|---|---|---|---|
| `FLOW` | Observed situation is reasonably aligned with current intent | Relation between behavior/situation and declared intent | No; intent and alignment must be evidenced | `OVERLOADED`, `DISRUPTED`, epistemic uncertainty | Candidate **alignment value**, not a validated global user state. The name collides with psychological flow. |
| `DRIFTING` | Behavior gradually diverges from intent or plan | Time-indexed trend in alignment | No; requires a plan, observations across time, and a divergence rule | `OVERLOADED`, `DISRUPTED`, epistemic uncertainty | Candidate **alignment trend**, not an instantaneous state unless the temporal window is specified. |
| `DISRUPTED` | A meaningful event invalidated or materially changed the plan | Event-to-plan relation / change point | The event may be observed; materiality and invalidation are inferred | Any alignment or load condition | Better treated semantically as **plan status/event evidence** than as the user's hidden state. |
| `OVERLOADED` | Commitments, deadlines, workload, or capacity indicate excessive competing demand | Demand–capacity relation, potentially both objective and perceived | Inputs may be observed; capacity and “excessive” are not directly observed | `FLOW`, `DRIFTING`, `DISRUPTED`, epistemic uncertainty | Candidate **load dimension**. Workload evidence is multidimensional and often subjective [S8]. |
| `UNCERTAIN` | System lacks trustworthy information to determine the current situation | Estimator knowledge / belief quality | Yes as a property of the evidence and inference process | Every possible user condition | **Epistemic meta-state**, not a peer world/user state under the current definition. |

### Consequences of the test

- The set is neither demonstrably mutually exclusive nor exhaustive. A user can be overloaded yet aligned with intent; a disruption can occur while the system is uncertain about its consequences; drifting can be a consequence of overload.
- The labels operate at different time scales. `DISRUPTED` can be an event boundary, `DRIFTING` requires a temporal trend, and `OVERLOADED` may persist.
- A flat categorical model would force one label to hide the others. A multi-label output would avoid forced exclusivity but would still need construct definitions and validated measurements.
- “State” in a product state machine, “latent state” in a statistical model, and “belief state” in a POMDP are not interchangeable terms.

## 2. HMM and POMDP fit

### HMM semantics

An HMM could, in principle, infer a hidden regime from a sequence of observations. That does **not** make the inferred regimes psychological truths. The project would need to specify:

- the latent variable each state represents;
- the observation model for calendar events, confirmations, activity signals, and outcomes;
- the transition time step and whether first-order Markov dependence is credible;
- how simultaneous alignment, load, and disruption are represented;
- independent labels or constraints that give the regimes stable meaning.

HMM parameters can be non-identifiable or identifiable only up to permutation of state labels; attaching human-readable names after unsupervised fitting requires extra constraints and validation [S11]. Therefore a fitted component is not automatically “FLOW” or “OVERLOADED.”

### POMDP belief-state semantics

A POMDP belief state is the agent's posterior distribution over possible environment states after action/observation history [S2]. For Future Me, this makes the following distinction decisive:

```text
candidate user/plan conditions:  s_t
system belief about them:        b_t(s) = P(s_t = s | evidence history)
belief quality / ignorance:      a property of b_t and of the evidence process
user-experienced uncertainty:    a possible component of s_t, if separately defined
```

Encoding “system does not know” as one ordinary value of `s_t` collapses the world with the model's knowledge of the world. It also prevents expressions such as “40% aligned, 35% drifting, 25% overloaded” or “overloaded is likely but evidence is stale.”

POMDP language is useful as a semantic check, but a real POMDP is **deferred**: the current product artifacts do not define a validated environment state, transition model, observation likelihoods, action-conditioned sensing effects, reward function, or enough data to estimate them.

## 3. Measurement validity and labeling audit

Construct validity is about whether evidence warrants the proposed interpretation of a measure, not whether a classifier can reproduce labels [S3]. The current labels lack operational definitions, time windows, discriminant tests, and a label-acquisition protocol.

### Observability map

| Source | What it can support | What it cannot establish alone | Main labeling risk |
|---|---|---|---|
| Calendar/task record | A plan, commitment, declared deadline, or RSVP exists | Attendance, current intent, effort, focus, completion, or available capacity | Treating plans as observed behavior |
| Device/app activity | A device or application produced a timestamped signal | Task meaning, goal alignment, cognitive load, productive progress, or cause | Proxy substitution and context loss |
| User momentary report | Current perceived load, confidence, intent, or self-assessed alignment | Objective task completion or all unreported behavior | Response burden, interpretation differences, reactivity, and missing-not-at-random data |
| User correction/confirmation | The user's current authoritative statement about the asked proposition | A timeless fact or validation of unrelated inferences | Overgeneralizing one answer across time or constructs |
| Outcome evidence | A specific event or task outcome occurred | The preceding internal state or why the outcome occurred | Retrospective causal attribution |
| Model/rule output | A reproducible inference from recorded inputs | New ground truth | Circular labels and confirmation bias |

EMA/experience sampling reduces recall delay and can capture within-person change in natural settings [S4], but recent psychometric review emphasizes that missingness, interpretation, reliability, comparison standards, and whether EMA is a gold standard remain live issues [S5]. Passive sensing can explain some variance in later self-reports, especially with personalized models, but published results also show limited accuracy and validation-scheme sensitivity; sensing remains a proxy rather than a direct label [S10].

### Construct-specific findings

- **`FLOW`: naming/construct collision.** Validated flow instruments measure a multidimensional subjective experience, not merely alignment with intent [S7]. Future Me's definition can be useful, but calling it `FLOW` invites unsupported transfer from the psychological construct. `ALIGNED` is a less misleading hypothesis label; renaming is a contract question, not an architecture decision.
- **`DRIFTING`: temporal and counterfactual ambiguity.** “Gradually diverging” needs an explicit reference plan, observation window, expected trajectory, and tolerance. A late start may be adaptation, not drift. User revision of intent can make yesterday's “drift” today's valid plan.
- **`DISRUPTED`: category error risk.** The definition is primarily about an event changing a plan. It may be strongly evidenced without knowing the user's internal condition. Conflating disruption evidence with user state would encourage causal overreach.
- **`OVERLOADED`: multidimensional and partly subjective.** Workload measures such as NASA-TLX treat workload as multidimensional and elicit ratings during or after tasks [S8]. Commitments and deadlines indicate demand, not actual capacity or perceived overload. The product needs to decide whether the target is objective infeasibility, perceived load, or both.
- **`UNCERTAIN`: two different uncertainties.** Model/system confidence and user confidence have different validation targets. Metacognitive work distinguishes confidence bias, sensitivity, and efficiency; a confidence report is not automatically accurate [S9]. A user saying “I am unsure” is valid evidence of experienced uncertainty, but not proof that their substantive judgment is wrong.

### Labeling problems to expose in any later study

1. **No uncontested ground truth:** alignment, capacity, and perceived overload are latent constructs; self-report is necessary for some targets but not infallible.
2. **Circular supervision:** rules such as “calendar mismatch → `UNCERTAIN`” cannot produce labels later used to claim that the same features independently validate `UNCERTAIN`.
3. **Label leakage:** post-outcome facts must not enter features for an earlier state estimate.
4. **Within-person heterogeneity:** the same signal can mean different things across people and across a person's regimes; personalized models may outperform pooled inference, but require enough individual labels [S10].
5. **Missingness is informative:** ignored check-ins may coincide with overload or disruption. Silence cannot be coded as confirmation or absence of the state.
6. **Temporal mismatch:** a five-minute activity signal, a two-hour focus block, and a week-long workload condition cannot share a label without an explicit window.
7. **Inter-rater mismatch:** user, system, and researcher may answer different questions while using the same label.
8. **Construct drift:** the meaning of “aligned” or “overloaded” can change after a new semester, role, health condition, or goal revision.

## 4. Structured claim records

### PA-01 — Reject the five-value enum as a validated latent user-state space

- **Disposition:** **REJECT** as scientific/measurement semantics; it may remain only as explicitly provisional UI shorthand.
- **Evidence status:** **Inferred** from the contract definitions plus canonical model semantics.
- **Claim:** `FLOW | DRIFTING | DISRUPTED | OVERLOADED | UNCERTAIN` does not currently define one mutually exclusive, collectively exhaustive latent state variable.
- **Supports:** The contract definitions describe different kinds of entities and permit co-occurrence. HMM/POMDP formalisms require a defined state variable and observation relation [S1][S2]. Construct interpretation requires validation evidence [S3].
- **Does not support:** It does not prove that categorical summaries are unusable, or that no future study could validate a smaller state vocabulary.
- **Assumptions:** A single enum means one value at a time and is intended to describe the user's current situation.
- **Limitations:** No product telemetry or labeled longitudinal sample was available in Pass A.
- **Failure conditions:** Overturn this claim if the team supplies operational definitions that make the values exclusive/exhaustive at a fixed time scale and validates them against independent observations and user reports.
- **Counter-evidence:** Discrete HMM regimes are useful in many domains [S1], and interpretable constraints can stabilize regimes. That establishes possibility, not validity of these names.
- **Future-Me transfer:** Mark the vocabulary provisional and prevent downstream logic from treating one selected value as the whole current situation.

### PA-02 — Separate system epistemic uncertainty from user condition

- **Disposition:** **USE**.
- **Evidence status:** **Confirmed** for the current contract's meaning; **inferred** for the modeling consequence.
- **Claim:** Current `UNCERTAIN` is a property of the system's evidence/belief, not a peer user state.
- **Supports:** The domain contract says the system lacks enough trustworthy information. POMDPs represent partial knowledge as a belief over states [S2]. Epistemic uncertainty refers to uncertainty in a model/knowledge state rather than inherent observation noise [S6].
- **Does not support:** It does not imply that all uncertainty is reducible with more data, or that numeric posterior probabilities are presently calibrated.
- **Assumptions:** The contract wording is authoritative for the term in this pass.
- **Limitations:** Different uncertainty decompositions exist; [S6] is from machine learning and transfers only at the distinction level.
- **Failure conditions:** This transfer fails if the product later redefines `UNCERTAIN` specifically as the user's experienced indecision. In that case, a separate name is still required for system ignorance.
- **Counter-evidence:** Engineering state machines sometimes include `UNKNOWN` as an ordinary sentinel value. That can be practical storage syntax, but it must not be presented as a world/user state or used to learn transitions as if it were one.
- **Future-Me transfer:** Represent “insufficient/conflicting/stale evidence” separately from any current-state hypothesis and permit abstention.

### PA-03 — Treat user-experienced uncertainty as a separate, optional construct

- **Disposition:** **UNRESOLVED** whether it belongs in MVP `PersonalState`; **USE** the semantic separation if introduced.
- **Evidence status:** **Supported**, with scope unresolved.
- **Claim:** A user may genuinely experience uncertainty, but this is not the same variable as the system being uncertain about the user.
- **Supports:** Metacognitive research treats confidence as a judgment about one's own performance and distinguishes bias, sensitivity, and efficiency [S9].
- **Does not support:** A single “not sure” response does not establish poor decision quality, low metacognitive sensitivity, or a stable user trait.
- **Assumptions:** User-experienced uncertainty is relevant only when tied to a specific proposition or decision.
- **Limitations:** The reviewed project documents do not define this construct, its time scale, or its product value.
- **Failure conditions:** Reject adding it if it cannot change a decision, clarification policy, or explanation without increasing burden or ambiguity.
- **Counter-evidence:** Users can be confidently wrong, and confidence reports can reflect response bias [S9].
- **Future-Me transfer:** If needed, capture proposition-scoped self-report such as “confidence in this plan/choice,” not a global `UNCERTAIN` person label.

### PA-04 — Use belief semantics; defer HMM/POMDP implementation

- **Disposition:** **USE** the observation/state/belief distinction; **DEFER** HMM learning and POMDP control.
- **Evidence status:** **Supported** at the semantic level.
- **Claim:** Future Me benefits from representing alternative hypotheses and explicit ignorance, but the evidence does not justify selecting an HMM or POMDP as the implementation.
- **Supports:** HMMs separate hidden processes from observed emissions [S1]. POMDPs formalize action under partial observability through belief states [S2].
- **Does not support:** These sources do not show that Future Me's states are Markov, that emissions are conditionally independent, or that a reward function is known.
- **Assumptions:** Consequential recommendations should depend on what is known and unknown.
- **Limitations:** Pass A did not compare production model families or design an architecture.
- **Failure conditions:** HMM inference fails semantically if states overlap or observations depend on unmodeled history; POMDP policy claims fail if actions/rewards are undefined or misspecified.
- **Counter-evidence:** Simple deterministic rules may satisfy the MVP's abstention requirement with less data and complexity, as the current MVP scope explicitly permits.
- **Future-Me transfer:** Keep a model-agnostic contract that can express evidence, candidate interpretations, confidence basis, and abstention. Revisit model family only after measurement data exists.

### PA-05 — Keep observations and labels distinct

- **Disposition:** **USE**.
- **Evidence status:** **High support** from measurement literature and product invariants.
- **Claim:** Calendar, device activity, and silence are observations/proxies; they must not be promoted to user-state labels without an explicit validated inference.
- **Supports:** EMA is designed to sample current behavior/experience in context [S4], while contemporary review warns that EMA itself has reliability, interpretation, selection, and missingness issues [S5]. Passive-sensing studies require careful validation and often benefit from personalization [S10].
- **Does not support:** It does not require self-report for every state estimate or deny that passive signals can become predictive.
- **Assumptions:** State labels will influence consequential recommendations or prompts.
- **Limitations:** Evidence from well-being and clinical-adjacent sensing transfers only to measurement cautions, not to Future Me effect sizes.
- **Failure conditions:** Transfer fails if the product presents a proxy as direct measurement, trains and tests on the same person's overlapping time windows, or treats nonresponse as a negative label.
- **Counter-evidence:** Personalized sensing predicted a meaningful portion of later self-report variance in one 158-person study [S10]. The result supports feasibility but not direct observability or universal accuracy.
- **Future-Me transfer:** Preserve source, timestamp, freshness, and inference lineage; ask a proposition-specific question only when the answer matters.

### PA-06 — Do not equate Future Me `FLOW` with psychological flow

- **Disposition:** **REJECT** the construct equivalence; **UNRESOLVED** whether to rename the product label.
- **Evidence status:** **Supported**.
- **Claim:** “Aligned with intent” is not the same construct as psychological flow.
- **Supports:** The Flow State Scale-2 operationalizes flow as a multidimensional subjective experience and was validated through factor models and self-report [S7]. The contract defines `FLOW` only as observed alignment.
- **Does not support:** It does not invalidate alignment as a useful product concept.
- **Assumptions:** Users and implementers may import the established psychological meaning of “flow.”
- **Limitations:** [S7] focuses on physical activity; the construct-collision conclusion relies on the mismatch of definitions, not transfer of its scale to Future Me.
- **Failure conditions:** This concern is resolved if the label is renamed (for example, `ALIGNED`) or explicitly disclaimed and validated under its own definition.
- **Counter-evidence:** Everyday product language often uses “flow” loosely. That helps communication but increases measurement ambiguity.
- **Future-Me transfer:** Do not cite flow psychology to validate an alignment classifier; specify the intended alignment relation directly.

### PA-07 — Define overload before measuring it

- **Disposition:** **UNRESOLVED** construct; **REJECT** calendar load as sufficient label.
- **Evidence status:** **Supported**.
- **Claim:** `OVERLOADED` currently conflates external demand, available capacity, and perceived workload.
- **Supports:** NASA-TLX treats workload as multidimensional and subjective, with ratings taken during or after task performance [S8]. Calendar density can evidence demand but not all dimensions of load or capacity.
- **Does not support:** It does not require adopting NASA-TLX, which is too burdensome and task-specific for routine product use.
- **Assumptions:** “Excessive competing demand” is meant to predict a decision-relevant constraint rather than diagnose health.
- **Limitations:** Workload research spans many domains; no Future-Me-specific validation study exists.
- **Failure conditions:** A single overload label fails when objective infeasibility and perceived strain disagree, or when high demand is chosen and sustainable.
- **Counter-evidence:** Objective schedule conflicts and insufficient clock time can establish infeasibility without self-report. That is a narrower construct than global overload.
- **Future-Me transfer:** Decide which proposition is needed—schedule infeasibility, perceived load, or capacity risk—and measure that proposition without clinical language.

### PA-08 — Defer numeric confidence and learned transitions until labels support calibration

- **Disposition:** **DEFER**.
- **Evidence status:** **Supported**.
- **Claim:** Numeric state probabilities and learned transition matrices would imply more measurement precision than the current evidence can defend.
- **Supports:** Confidence must be evaluated for calibration/discrimination rather than assumed meaningful [S9]. HMMs require identifiable parameters and can exhibit label switching or redundancy [S11]. Passive-sensing validation can overstate performance if evaluation schemes are mismatched to deployment [S10].
- **Does not support:** It does not prohibit qualitative confidence bands or deterministic abstention rules in an MVP.
- **Assumptions:** Displayed probabilities would influence user trust or decision policy.
- **Limitations:** No calibration dataset, base rates, or loss function was available.
- **Failure conditions:** A probability is not decision-grade if its target event, horizon, population, or calibration set is undefined; a transition estimate fails if regime definitions change during collection.
- **Counter-evidence:** Probabilistic models can be valuable with sufficient repeated labels and prospective validation.
- **Future-Me transfer:** Use auditable reasons such as `stale`, `conflicting`, `missing`, or `weak proxy` now; introduce numeric confidence only with a named target and held-out temporal calibration.

## 5. Mechanism disposition

| Disposition | Mechanism | Reason for Pass-A classification |
|---|---|---|
| **USE** | Separate observations, inferred condition, and belief quality | Required to avoid converting evidence gaps into user facts |
| **USE** | Explicit `unknown` / abstain behavior | Matches current trust invariants and epistemic semantics |
| **USE** | Proposition-scoped provenance, freshness, and correction history | Makes observability and contradiction inspectable |
| **USE** | Multiple semantic dimensions: alignment, disruption/plan status, demand–capacity, epistemic quality | These distinctions are already present in the definitions; encoding remains open |
| **USE** | User confirmation for subjective or intent-dependent propositions, with `skip/not sure` | Necessary evidence source; not treated as infallible ground truth |
| **DEFER** | Learned HMM states or transition matrix | No validated state variable or longitudinal label set |
| **DEFER** | POMDP policy optimization | Actions, rewards, observation model, and state sufficiency are undefined |
| **DEFER** | Numeric confidence/probabilities | No target-specific calibration evidence |
| **DEFER** | Passive-sensing replacement of user reports | Feasible in research, but construct- and person-specific validity is not established here |
| **REJECT** | Current five labels as one validated, mutually exclusive user-state enum | Mixed ontological levels and demonstrable co-occurrence |
| **REJECT** | `UNCERTAIN` as both system ignorance and user indecision | Collapses two variables with different evidence and failure modes |
| **REJECT** | Calendar/app activity/silence as ground-truth state labels | These are plans, proxies, or missing data |
| **REJECT** | Psychological-flow evidence as validation for current `FLOW` | Construct mismatch |
| **UNRESOLVED** | Whether product `FLOW` should be renamed `ALIGNED` | Semantically cleaner, but naming is a product-contract decision |
| **UNRESOLVED** | Whether `OVERLOADED` means infeasible schedule, perceived workload, capacity risk, or a combination | Each target needs different observations and validation |
| **UNRESOLVED** | Whether user-experienced uncertainty belongs in MVP state | No defined decision value or measurement protocol |
| **UNRESOLVED** | State time step, persistence, transition triggers, and simultaneous-state policy | Required before any state-space model can be tested |

## 6. Minimum evidence needed to revisit deferred mechanisms

This is a research requirement, not an implementation design:

1. Operational definitions for each target proposition, including time window and allowed co-occurrence.
2. A prospective label protocol combining proposition-specific user reports, corrections, observable outcomes, and recorded missingness.
3. Separation of rule-generated weak labels from evaluation labels.
4. Person-held-out and future-time-held-out evaluation, chosen to match the intended deployment claim.
5. Construct checks: convergent evidence, discriminant evidence, known-groups or event sensitivity where appropriate, and correction analysis.
6. Calibration analysis for any numeric probability, by target and horizon.
7. Explicit failure and abstention criteria before state estimates affect consequential advice.

## 7. Source notes and transfer limits

Sources were selected from original peer-reviewed papers, peer-reviewed methodological reviews, or canonical proceedings. Stable DOI or publisher URLs are used. None studies the Future Me product directly. Transfers are therefore limited to model semantics, measurement principles, and demonstrated risks; no external effect size is imported as a Future Me performance expectation.

- **[S1]** Rabiner, L. R. (1989). “A Tutorial on Hidden Markov Models and Selected Applications in Speech Recognition.” *Proceedings of the IEEE*, 77(2), 257–286. [https://doi.org/10.1109/5.18626](https://doi.org/10.1109/5.18626)
- **[S2]** Kaelbling, L. P., Littman, M. L., & Cassandra, A. R. (1998). “Planning and Acting in Partially Observable Stochastic Domains.” *Artificial Intelligence*, 101(1–2), 99–134. [https://doi.org/10.1016/S0004-3702(98)00023-X](https://doi.org/10.1016/S0004-3702%2898%2900023-X)
- **[S3]** Cronbach, L. J., & Meehl, P. E. (1955). “Construct Validity in Psychological Tests.” *Psychological Bulletin*, 52(4), 281–302. [https://doi.org/10.1037/h0040957](https://doi.org/10.1037/h0040957)
- **[S4]** Shiffman, S., Stone, A. A., & Hufford, M. R. (2008). “Ecological Momentary Assessment.” *Annual Review of Clinical Psychology*, 4, 1–32. DOI `10.1146/annurev.clinpsy.3.022806.091415`. [PubMed record](https://pubmed.ncbi.nlm.nih.gov/18509902/)
- **[S5]** Stone, A. A., Schneider, S., & Smyth, J. M. (2023). “Evaluation of Pressing Issues in Ecological Momentary Assessment.” *Annual Review of Clinical Psychology*, 19, 107–131. DOI `10.1146/annurev-clinpsy-080921-083128`. [PubMed record](https://pubmed.ncbi.nlm.nih.gov/36475718/)
- **[S6]** Kendall, A., & Gal, Y. (2017). “What Uncertainties Do We Need in Bayesian Deep Learning for Computer Vision?” *NeurIPS 2017*. [Official proceedings page](https://papers.nips.cc/paper_files/paper/2017/hash/2650d6089a6d640c5e85b2b88265dc2b-Abstract.html)
- **[S7]** Jackson, S. A., & Eklund, R. C. (2002). “Assessing Flow in Physical Activity: The Flow State Scale–2 and Dispositional Flow Scale–2.” *Journal of Sport & Exercise Psychology*, 24(2), 133–150. [https://doi.org/10.1123/jsep.24.2.133](https://doi.org/10.1123/jsep.24.2.133)
- **[S8]** Hart, S. G. (2006). “NASA-Task Load Index (NASA-TLX); 20 Years Later.” *Proceedings of the Human Factors and Ergonomics Society Annual Meeting*, 50(9), 904–908. DOI `10.1177/154193120605000909`. [Official NASA TLX publications page](https://www.nasa.gov/human-systems-integration-division/nasa-task-load-index-tlx/)
- **[S9]** Fleming, S. M., & Lau, H. C. (2014). “How to Measure Metacognition.” *Frontiers in Human Neuroscience*, 8, 443. DOI `10.3389/fnhum.2014.00443`. [Publisher full text](https://www.frontiersin.org/journals/human-neuroscience/articles/10.3389/fnhum.2014.00443/full)
- **[S10]** Schoedel, R., et al. (2022). “Using Smartphone Sensor Paradata and Personalized Machine Learning Models to Infer Participants' Well-being: Ecological Momentary Assessment.” *Journal of Medical Internet Research*, 24(4), e34015. [https://doi.org/10.2196/34015](https://doi.org/10.2196/34015)
- **[S11]** Dupont, P., et al. (2020). “Parameter Redundancy and Identifiability in Hidden Markov Models.” *METRON*, 78, 105–118. [https://doi.org/10.1007/s40300-019-00156-3](https://doi.org/10.1007/s40300-019-00156-3)

## Pass-A boundary

This audit resolves the semantic question: **uncertainty is both possible user experience and system epistemic condition, but they must be represented and validated separately; the current contract's `UNCERTAIN` means only the latter.** It does not choose a database shape, statistical model, inference pipeline, UI, intervention policy, or final architecture.
