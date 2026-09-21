---
title: "Pass A — JITAI, Receptivity, Burden, Outcome Learning, Preference Learning, and MRT Evidence Audit"
status: "pass-a-complete"
scope: "evidence audit only; not architecture; not implementation"
date: "2026-09-20"
sources_accessed: "2026-09-20"
---

# Pass A — JITAI and Learning Evidence Audit

## 1. Audit boundary

This is a Pass A evidence audit for Future Me. It does **not** synthesize a final architecture, choose persistence boundaries, specify APIs, or authorize implementation. The prior report is treated as a hypothesis inventory, not as evidence.

The product contracts establish the following facts that frame the audit:

- Future Me supports consequential future decisions; the user remains the decision owner, and silence is valid behavior ([Product Definition](../../PRODUCT.md), [User Flows](../../USER_FLOWS.md)).
- The core loop separates observation, selective context acquisition, decision support, user choice, outcome, and learning. For the MVP, learning means updating stored context, not training a model ([Product Definition](../../PRODUCT.md)).
- Planned, observed, believed, confirmed, predicted, and eventual events must remain distinguishable; an inference must not silently become a fact ([Domain Contract](../../DOMAIN_CONTRACT.md)).
- The MVP is user-invoked. Adaptive thresholds, receptivity modeling, interruption optimization, and long-term intervention learning are deferred ([MVP Scope](../../MVP_SCOPE_UPDATED.md)).
- The prior report proposes no-op, cooldown, prompt-budget, exposure logging, and later MRT/RL work, but its JITAI conclusions remain hypotheses until supported here ([prior report](../FUTURE_ME_DECISION_INTELLIGENCE_RESEARCH.md)). Recovered subagent material is lead-generation only ([recovered evidence](../RECOVERED_SUBAGENT_EVIDENCE.md)).

### Disposition vocabulary

| Disposition | Meaning in this audit |
|---|---|
| **USE** | The evidence supports carrying the mechanism or semantic rule into later design work. It is not an implementation instruction. |
| **DEFER** | Plausible and evidence-backed in some settings, but Future Me lacks the prerequisites, measurements, sample, or safety case. |
| **REJECT** | The stated mechanism or inference is contradicted, overclaimed, or invalid for the available evidence. |
| **UNRESOLVED** | Evidence is insufficient or the necessary product definition has not been made. |

## 2. Evidence-level map

The central result is that different data support different kinds of learning. Collapsing them creates false confidence.

| Evidence available | What it can teach | What it cannot teach |
|---|---|---|
| One recommendation exposure and one observed outcome | What was delivered; whether a choice, response, or outcome was observed; whether the episode was technically feasible; explicit feedback about that episode | Whether the recommendation caused the outcome; whether the policy is effective; a stable preference; calibration; a general rule |
| Repeated non-random episodes | Frequencies, sequences, candidate associations, recurring explicit preferences, prediction hypotheses, burden trends | Causal effects, because context and the policy determine which recommendations are shown; unobserved counterfactuals remain missing |
| Repeated randomized decision points (MRT) | Average proximal causal effect of a randomized component among eligible/available decision points; time-varying effect and pre-specified moderation when powered | Effect of the whole product; distal benefit without a separate distal design; an individual causal effect from a few observations; transfer outside the tested population, content, timing, and availability rule |
| Randomized package-level trial | Effect of the tested package on a defined distal outcome under the trial conditions | Which component caused the effect unless the design separately randomizes components; universal personalization benefit |
| Online bandit/RL history | Whether an algorithm can update action probabilities to maximize its explicit reward under its model and exploration policy | That the reward represents the user's preference or welfare; that apparent personalization is real; safe transfer to consequential decisions |

This ladder follows the distinction between proximal component effects in MRTs and distal package effects in JITAI methodology [S1, S2], and is reinforced by trials in which large immediate engagement effects did not produce longer engagement [S10].

## 3. Structured claim records

### JL-01 — JITAI is a decision-rule framework, not a synonym for personalized notifications

- **Claim:** A JITAI requires an explicit distal outcome, proximal outcome(s), decision points, tailoring variables, intervention options (including possibly no intervention), and decision rules. “Personalized” or “timely” messaging alone does not establish a JITAI.
- **Evidence status:** Confirmed as the field's canonical conceptual framework; systematic reviews report inconsistent use of the term [S1, S3, S4].
- **What the evidence supports:** Using the framework as a checklist that forces the intended outcome, intervention option, trigger, and measurement window to be named.
- **What it does not support:** That implementing the checklist produces benefit, or that a JITAI is appropriate for Future Me's current user-invoked MVP.
- **Assumptions:** The framework transfers as experimental vocabulary from health behavior to decision-support prompts.
- **Limitations:** The strongest empirical literature targets health behaviors, not open-ended personal decisions.
- **Failure conditions:** Calling any contextual notification a JITAI; omitting a no-action option; failing to define the proximal outcome or its observation window.
- **Transfer confidence:** **High** for terminology and experimental decomposition; **low** for outcome effectiveness in Future Me.
- **Mechanism disposition:** **USE** the vocabulary in later evaluation planning. **REJECT** “JITAI” as a benefit claim.

### JL-02 — Need, availability, interruptibility, and receptivity are different constructs

- **Claim:** A person can need support but be unavailable or unreceptive; conversely, being interruptible does not imply that an intervention is needed or useful.
- **Evidence status:** Confirmed conceptually and supported by notification studies showing that content, task state, presentation, relationship, and individual differences affect response and perceived disruption [S1, S5].
- **What the evidence supports:** Separate assessment of (a) whether support could help, (b) whether delivery is safe/feasible, (c) whether interruption is acceptable, and (d) whether the person engages.
- **What it does not support:** Inferring receptivity from calendar vacancy, phone use, notification opening, or a single contextual signal.
- **Assumptions:** Future Me's proactive prompt is sufficiently similar to a mobile notification for interruption findings to provide a cautionary transfer.
- **Limitations:** Most interruptibility studies are small, technology-specific, and use response or perceived disruption rather than decision quality.
- **Failure conditions:** Treating “not busy” as “wants advice”; treating a fast response as benefit; sending a consequential recommendation merely because the channel is available.
- **Transfer confidence:** **Medium-high** for the separation; **low-medium** for any predictive feature or threshold.
- **Mechanism disposition:** **USE** the separation and a no-op path. **DEFER** learned receptivity prediction.

### JL-03 — Context-aware timing can improve response, but the evidence is narrow and high-risk

- **Claim:** Context-aware notification management can improve notification response rates in some settings, but evidence for shorter response delay and broader benefit is weak.
- **Evidence status:** A 2017 systematic review/meta-analysis found higher response rates across four analyzable studies (weighted odds ratio 1.71, 95% CI 1.28–2.28), high heterogeneity (I²=75%), little evidence on response delay, and high or unclear risk of bias across included studies [S6]. A primary experiment found activity-transition interruptions were better received than random-time interruptions [S7].
- **What the evidence supports:** Context may be useful for choosing among delivery moments when the outcome is notification response or perceived burden.
- **What it does not support:** Better decisions, better downstream outcomes, or a universal “best time.”
- **Assumptions:** Response-rate findings are at least directionally relevant to optional Future Me prompts.
- **Limitations:** Small and demographically narrow studies, heterogeneous systems, older mobile platforms, and response-centric endpoints.
- **Failure conditions:** Optimizing click/open speed while worsening perceived autonomy, distraction, decision quality, or long-term trust.
- **Transfer confidence:** **Medium** for context sensitivity; **low** for direct policy transfer.
- **Mechanism disposition:** **DEFER** context-aware timing optimization; **REJECT** response rate as sufficient success evidence.

### JL-04 — Sensor-based or adaptive timing is not automatically better than simple timing

- **Claim:** Adaptive timing must beat a meaningful comparator; sophistication is not evidence of incremental value.
- **Evidence status:** In a 77-participant exploratory trial, sensor-driven “intelligent” timing produced no meaningful advantage over pre-defined delivery times. Response and use were low, 53% stopped using the app within two weeks, and the study was underpowered; participants also reported repetition-related annoyance [S8]. In a separate 83-participant field deployment, a static model improved measured receptivity versus random timing, while the adaptive model improved over time but was not significantly better than control over the full study and suffered a deployment bug [S9].
- **What the evidence supports:** Learned timing can be tested, and a population model may sometimes outperform random delivery.
- **What it does not support:** An adaptive per-user model at cold start, or superiority over user-selected/fixed windows in Future Me.
- **Assumptions:** Future Me can define a receptivity label that is not merely “opened quickly.”
- **Limitations:** Different intervention content, populations, platforms, labels, and comparison policies; technical failures altered exposure in both real-world studies.
- **Failure conditions:** No valid comparator; sparse labels; delayed/missing sensor data; model drift; optimizing responsiveness rather than usefulness; no technical exposure audit.
- **Transfer confidence:** **Medium** that adaptation is testable; **low** that it will help Future Me.
- **Mechanism disposition:** **DEFER** learned timing. **REJECT** “adaptive is better” as a product assumption.

### JL-05 — Burden is an outcome, not a fixed prompt-count constant

- **Claim:** Burden can arise from frequency, timing, content repetition, cognitive demand, competing life demands, and accumulated exposure. It should be measured alongside benefit rather than represented only by a universal daily cap.
- **Evidence status:** The JITAI framework identifies engagement, cognitive overload, habituation, trust, and intervention fatigue as proximal outcomes [S1]. Notification research shows that even useful content can be disruptive [S5]. The Healthy Mind trial found repetition-related annoyance despite attempts at intelligent timing [S8].
- **What the evidence supports:** Tracking exposure, dismissal/deferral, perceived disruption or usefulness, and change over time; retaining “provide nothing” as an intervention option.
- **What it does not support:** A specific Future Me prompt budget, cooldown duration, or claim that non-response equals burden.
- **Assumptions:** Future Me prompts impose attention and cognitive costs comparable in kind, though not necessarily magnitude, to mHealth prompts.
- **Limitations:** Self-reported burden and behavior may disagree; absence of response can reflect non-delivery, lack of need, habit, competing demands, or successful learning outside the app.
- **Failure conditions:** Optimizing only acceptance/open rate; counting all non-response as rejection; failing to account for repeated content or delayed burden; ignoring users who disable prompts or leave.
- **Transfer confidence:** **High** for treating burden as multidimensional and time-varying; **low** for thresholds.
- **Mechanism disposition:** **USE** burden as an explicit measured outcome and no-op criterion. **UNRESOLVED** measurement instrument and thresholds.

### JL-06 — JITAI effectiveness is promising but heterogeneous, domain-bound, and not established for Future Me

- **Claim:** Published JITAI evidence does not justify a general effectiveness claim for consequential personal decision support.
- **Evidence status:** The 2019 physical-activity review found mixed behavioral effects, no sufficiently powered study, sensor/timeliness problems, and little evidence on sustained engagement, reach, inequality, or cost [S3]. A 2026 review of 37 physical-activity studies (6,939 participants) found preliminary positive trends but high heterogeneity (I²=85%), inconsistent reporting, and a methodologically immature evidence base; two sedentary-time RCTs were directionally positive but non-significant [S4]. A 2023 meta-analysis reported a positive pooled effect (g=0.77) but mixed pre/post and controlled designs, substantial within- and between-study variance, and called for RCT-focused synthesis [S13]. A 2025 mental-health review found only a small between-group effect (g=0.15) and moderate-to-high risk from adherence and missing outcomes [S14].
- **What the evidence supports:** Some JITAI components and packages can improve some outcomes in some health contexts.
- **What it does not support:** Transport to Future Me's broad decision-support domain, or a claim that adaptivity adds value beyond good static or user-invoked support.
- **Assumptions:** Health-behavior studies reveal general intervention-design risks, not direct product efficacy.
- **Limitations:** Definition drift, diverse comparators, short studies, underpowered trials, attrition, selective outcome reporting, and domain-specific proximal measures.
- **Failure conditions:** Citing pooled effects without design quality; transferring a step-count result to decision quality; ignoring null components and missing-data burden.
- **Transfer confidence:** **Low** for effectiveness; **medium-high** for the warning against blanket claims.
- **Mechanism disposition:** **REJECT** “JITAI improves Future Me outcomes.” **UNRESOLVED** whether any specific Future Me intervention is beneficial.

### JL-07 — MRTs support proximal component causality under explicit conditions

- **Claim:** Repeated randomization at defined decision points can identify the average proximal causal effect of a randomized intervention component among eligible/available occasions and can estimate pre-specified time/context moderation when the trial is adequately powered and correctly analyzed.
- **Evidence status:** Confirmed by the foundational MRT design and causal-moderation methods [S2, S11].
- **What the evidence supports:** Questions such as “At eligible decision points, does showing option A versus no prompt change the defined outcome within the next X hours?”
- **What it does not support:** The causal effect of an unrandomized recommendation, overall product efficacy, long-term benefit, or an individual's personal causal effect from a handful of trials.
- **Assumptions:** Consistency, correct logging of availability and assignment probability, no interference that invalidates the estimand, a well-defined proximal outcome window, and appropriate longitudinal analysis.
- **Limitations:** Burden, delayed effects, nonstationarity, missing outcomes, and treatment-induced future availability complicate design and interpretation. Standard longitudinal methods can be biased for MRT data.
- **Failure conditions:** Randomizing consequential advice without equipoise or consent; changing intervention content mid-trial without versioning; missing exposure or assignment logs; selecting moderators after seeing results; interpreting a proximal effect as distal benefit.
- **Transfer confidence:** **High** for the methodological claim; **low-medium** for feasibility in Future Me.
- **Mechanism disposition:** **DEFER** MRTs until intervention options, eligibility, proximal outcomes, safeguards, and sample-size calculations are stable.

### JL-08 — MRTs reveal null components and effect decay, not only winners

- **Claim:** A useful MRT may conclude that a component has no detectable effect or that an early effect attenuates; these are optimization findings, not trial failures.
- **Evidence status:** In the 44-person, six-week HeartSteps MRT, the average effect of any suggestion on 30-minute steps was 14% with p=.06; walking suggestions had a positive average effect, anti-sedentary suggestions had no detectable effect, and the initial overall effect diminished until it was indistinguishable from zero by day 28 [S12].
- **What the evidence supports:** Component-specific testing, time-varying effects, and explicit null/negative reporting.
- **What it does not support:** That contextual walking prompts improve overall activity, health, or Future Me decisions. The authors explicitly framed the trial as component optimization rather than whole-package efficacy.
- **Assumptions:** The measured proximal outcome is sensitive to the component's intended mechanism.
- **Limitations:** Small sample, one behavior, one population, one device ecosystem, missing sensor data, and possible mismatch between anti-sedentary behavior and step-count measurement.
- **Failure conditions:** Choosing an outcome that cannot register the intended behavior; averaging away decay; retaining a liked component with no measured benefit without revisiting the outcome or mechanism.
- **Transfer confidence:** **High** for the lesson that nulls/decay matter; **low** for effect-size transfer.
- **Mechanism disposition:** **USE** null, attenuation, and burden findings as first-class evaluation results. **REJECT** winner-only reporting.

### JL-09 — Immediate engagement is not sustained engagement or user benefit

- **Claim:** Opening or responding to a notification is a proximal engagement outcome; it is not evidence that the content improved the target behavior, decision, or long-term retention.
- **Evidence status:** In the Drink Less MRT, notifications increased one-hour app opening 3.52-fold (95% CI 2.92–4.26), but fixed, randomized, and no-notification policies did not significantly differ in time to disengagement, session count, or session length [S10].
- **What the evidence supports:** Notifications can causally trigger near-term app opening.
- **What it does not support:** That the intervention was useful, that drinking changed, that users preferred the message, or that more opens should be optimized.
- **Assumptions:** Future Me may observe analogous engagement events such as opening a recommendation or starting a check-in.
- **Limitations:** Alcohol-reduction app, daily decision point, 30-day horizon; engagement was the proximal target.
- **Failure conditions:** Treating click-through as recommendation quality; rewarding attention capture even when no decision or outcome improves; ignoring displaced or deferred use.
- **Transfer confidence:** **High** for the engagement/outcome distinction; **low** for numerical transfer.
- **Mechanism disposition:** **USE** separate engagement metrics. **REJECT** engagement as a proxy for beneficial outcome without validation.

### JL-10 — One outcome can update an episode, not establish a policy

- **Claim:** One observed outcome can validate or correct facts about that episode and provide a labeled example; it cannot estimate a stable effect, preference, or decision rule.
- **Evidence status:** This is a direct consequence of the missing counterfactual in a single non-random episode and the repeated-randomization requirement of MRT causal estimands [S2, S11]. It also follows Future Me's contract rule that an inference is not a confirmed fact.
- **What the evidence supports:** Recording whether the user chose an option, what happened, whether the intended action was feasible, and what the user explicitly said about the recommendation.
- **What it does not support:** “This recommendation works for this user,” “the user prefers this,” or a confidence increase based solely on success after exposure.
- **Assumptions:** The observed outcome is correctly linked to the episode and is not merely a stale or ambiguous proxy.
- **Limitations:** Even the episode label may be incomplete, delayed, partially observed, or affected by events outside Future Me.
- **Failure conditions:** Automatic reinforcement from any post-recommendation success; penalizing advice for an outcome outside its horizon; rewriting a durable preference from one choice.
- **Transfer confidence:** **High**.
- **Mechanism disposition:** **USE** episode-level updates and provenance. **REJECT** single-outcome policy learning.

### JL-11 — Repeated observational patterns support prediction hypotheses, not causal effects

- **Claim:** Repeated outcomes under the existing policy can reveal recurring associations and improve forecasts, but recommendations are selected based on context, so observed response differences are confounded by the policy and situation.
- **Evidence status:** MRT literature introduces randomization precisely because observational mobile histories do not identify component effects without stronger assumptions [S2, S11]. Real-world notification studies also show that context, content, and individual factors jointly affect response [S5, S8].
- **What the evidence supports:** Candidate rules such as “the user often defers this topic during work hours,” labeled as observational and subject to change.
- **What it does not support:** “Prompts during work hours cause worse outcomes” or “the alternative would have been better.”
- **Assumptions:** Events are consistently defined, exposure is logged, missingness is visible, and policy versions are retained.
- **Limitations:** Feedback loops, selective exposure, nonstationarity, changing goals, seasonal routines, and sparse per-context data.
- **Failure conditions:** Learning only from shown recommendations; hiding exploration/exposure; aggregating across incompatible outcomes; letting historical frequency override an explicit current correction.
- **Transfer confidence:** **High** for the inference boundary; **medium** for predictive usefulness.
- **Mechanism disposition:** **USE** repeated patterns as hypotheses/predictors with provenance. **REJECT** causal language from them. **UNRESOLVED** promotion thresholds.

### JL-12 — Causal evidence is local to the randomized component, outcome, window, and policy

- **Claim:** Even valid MRT evidence is “local”: it concerns the randomized contrast, eligible occasions, defined proximal outcome and time window, and the trial's treatment and availability policy.
- **Evidence status:** Confirmed by MRT estimands and time-varying moderation methods [S2, S11], and illustrated by HeartSteps' different results for walking versus anti-sedentary content [S12].
- **What the evidence supports:** Component-specific, version-specific causal statements with explicit scope.
- **What it does not support:** Generalizing from “prompt versus no prompt” to a different message, channel, population, decision type, or distal outcome.
- **Assumptions:** The trial protocol and implementation match, and exposure/missingness are auditable.
- **Limitations:** Moderation analyses require substantially more information than estimating an average effect and are vulnerable to multiplicity and sparse strata.
- **Failure conditions:** Pooling unlike recommendation types; changing outcome windows after inspection; using an average benefit to justify prompts in untested high-burden contexts.
- **Transfer confidence:** **High**.
- **Mechanism disposition:** **USE** scoped causal wording. **REJECT** mechanism-wide or product-wide extrapolation.

### JL-13 — Preference, receptivity, adherence, and reward must not be conflated

- **Claim:** A user's explicit preference, immediate choice, notification response, adherence, and measured outcome are different labels. An online learning algorithm optimizes its encoded reward, which may be step count or engagement rather than the user's preference or welfare.
- **Evidence status:** HeartSteps' RL work defines reward as near-term physical activity and highlights sparse data, nonstationarity, unobserved engagement/burden, cold start, model assumptions, and the need for continued randomized exploration [S15]. Later work warns that apparent personalization can arise from algorithmic stochasticity and requires explicit assessment [S16].
- **What the evidence supports:** Learning action probabilities against a predeclared reward after sufficient repeated data, while separately storing explicit preferences and burden.
- **What it does not support:** Calling a click, compliance, or positive outcome a preference; assuming reward optimization is aligned with decision quality; claiming personalization because action probabilities vary.
- **Assumptions:** A stable, ethically acceptable reward can be defined and observed frequently enough.
- **Limitations:** Future Me's outcomes are heterogeneous, delayed, partially observed, value-laden, and likely far sparser than step counts.
- **Failure conditions:** Reward hacking; suppressing user-stated preferences because behavior differs; exploration on consequential decisions; learning from proxies that reward attention; no cold-start or drift guard.
- **Transfer confidence:** **High** for the separation; **low** for online preference learning in Future Me.
- **Mechanism disposition:** **USE** explicit preference records as authoritative input subject to correction. **DEFER** online bandit/RL personalization. **REJECT** implicit behavior as equivalent to preference.

### JL-14 — Decision, recommendation, intervention exposure, choice, outcome, and feedback require semantic separation

- **Claim:** Valid learning requires the following concepts to remain distinguishable even if later implementation co-locates them:

  | Concept | Meaning | Learning boundary |
  |---|---|---|
  | Decision | The user's decision episode: question, options, constraints, and evidence state | Defines the problem; it is not the system's answer |
  | Recommendation | The system's versioned proposed option/rationale/abstention for that decision | A prediction or proposal, not observed truth |
  | Intervention exposure | Whether, when, how, and under which policy the recommendation/prompt was made available | Required to distinguish assigned, delivered, seen, and acted-on support |
  | Choice | The option the user explicitly selects, including defer/none/unknown | Reveals that episode's choice, not necessarily a durable preference |
  | Outcome | What later happened in a specified horizon, with source and observation quality | Can evaluate forecasts or goals when repeatedly and consistently defined; does not alone identify cause |
  | Feedback | The user's evaluation or correction of a recommendation, intervention, forecast, choice record, or outcome | Direct evidence about the feedback target; subjective usefulness and objective outcome may diverge |

- **Evidence status:** Confirmed as an inference requirement by MRT design, which needs assignment/exposure and proximal outcome separated [S2, S11], and by trials where engagement and distal behavior diverged [S10]. It also matches Future Me's domain principle, but the current repository embeds recommendation and user choice inside `Decision` in one architecture view while the prior report hypothesizes separate objects.
- **What the evidence supports:** Semantic and event-level distinction, stable identifiers, timestamps, provenance, versioning, and explicit missingness.
- **What it does not support:** A particular database schema, service boundary, event-store design, or number of tables.
- **Assumptions:** Future Me intends to audit and learn from past recommendations rather than only display them.
- **Limitations:** Some episodes will have no explicit choice, no observable outcome, or feedback that targets multiple objects.
- **Failure conditions:** Overwriting the recommendation after learning the outcome; treating delivery as view; treating silence as choice; attaching feedback to the wrong target; merging subjective approval with objective success.
- **Transfer confidence:** **High** for semantic separation; **unresolved** for persistence granularity.
- **Mechanism disposition:** **USE** the semantic contract. **UNRESOLVED** storage/architecture realization.

### JL-15 — Future Me should not run MRTs or adaptive policies before measurement and safety prerequisites exist

- **Claim:** An MRT or online policy is premature unless Future Me has stable intervention options, a no-op comparator, eligibility/availability rules, a measurable proximal outcome and window, exposure/assignment logging, burden and adverse-effect measures, consent/equipoise, and sufficient decision points/sample size.
- **Evidence status:** Confirmed as a methodological prerequisite across JITAI and MRT guidance [S1, S2, S11]; real trials demonstrate failure from underpowering, sensor faults, sparse data, disengagement, and outcome mismatch [S3, S8, S9, S12, S15].
- **What the evidence supports:** A later staged research program: observational instrumentation first, then predeclared randomized component tests, then only evidence-gated adaptive learning.
- **What it does not support:** A timetable, experiment design, or architecture for Future Me in this pass.
- **Assumptions:** Future Me may eventually have a sufficiently frequent, low-risk intervention component. That remains unproven.
- **Limitations:** Consequential decisions may be too rare, heterogeneous, or ethically sensitive for MRT randomization.
- **Failure conditions:** Randomizing recommendation quality in high-stakes situations; no stable outcome; inadequate power; no burden stop rule; no way to reproduce the policy decision; optimizing before validating measurement.
- **Transfer confidence:** **High** for prerequisites; **low** that the current product satisfies them.
- **Mechanism disposition:** **DEFER** MRTs and adaptive learning. **UNRESOLVED** whether a safe, frequent experimental slice exists.

## 4. Consolidated mechanism map

### USE

- JITAI component vocabulary for research questions: distal outcome, proximal outcome, decision point, tailoring variable, intervention option, decision rule, and no-op.
- Semantic separation of decision, recommendation, intervention exposure, choice, outcome, and feedback; this is a data-validity requirement, not an architecture decision.
- Explicit burden, disruption, engagement, and usefulness measures alongside target outcomes.
- Exposure, eligibility/availability, policy version, assignment probability (when randomized), observation window, missingness, and outcome-source logging.
- One outcome as episode evidence only; repeated observational patterns as labeled hypotheses/predictors only.
- Null effects, effect decay, non-adherence, missingness, and burden as first-class findings.
- Causal wording limited to the randomized contrast, eligible population/decision points, outcome, horizon, and policy actually tested.

### DEFER

- Learned interruptibility or receptivity timing.
- Automatic prompt-frequency optimization.
- Online bandit/RL personalization and implicit preference learning.
- MRTs until a low-risk, frequent, stable intervention slice and measurement plan exist.
- Cross-user pooling for policy learning until consent, governance, heterogeneity, and transfer are addressed.

### REJECT

- “JITAI improves outcomes” as a general product claim.
- “Adaptive timing is better” without a comparator and target-outcome evidence.
- Treating calendar vacancy, notification opening, response speed, choice, compliance, or a positive outcome as interchangeable evidence.
- Learning a durable preference or effective policy from one recommendation-outcome pair.
- Causal claims from repeated observational patterns under an existing recommendation policy.
- Optimizing engagement as if it were decision quality or user benefit.
- Allowing learned behavior to silently override explicit user correction or preference.

### UNRESOLVED

- Future Me's first intervention component that is frequent, low-risk, and homogeneous enough to test.
- The proximal outcome(s), distal outcome(s), and observation windows for that component.
- How burden, annoyance, trust, usefulness, and deferral should be measured and combined.
- Prompt budget and cooldown thresholds; the literature supports measuring burden, not a universal number.
- Minimum evidence required to promote an observational pattern into a user-visible preference hypothesis.
- Whether enough eligible decision points and users will exist for powered moderation or individualization.
- Ethical exclusions from randomization for consequential decisions.
- Persistence granularity for recommendation and choice; only their semantic separation is supported here.

## 5. Assumptions and transfer limits

1. **Domain transfer is limited.** Most primary evidence concerns physical activity, alcohol reduction, stress management, or generic notifications. Future Me supports heterogeneous personal decisions; effect sizes and decision rules do not transfer.
2. **Receptivity labels are construct-dependent.** Opening, quick response, conversation completion, self-reported availability, and perceived disruption measure different things.
3. **Proximal outcomes can be misleading.** A prompt may increase an immediate action without improving a distal goal, or may improve an outcome while reducing trust or increasing burden.
4. **Missingness is informative but ambiguous.** Silence may reflect non-delivery, no opportunity, no interest, overload, technical failure, successful off-app learning, or refusal. It must not be automatically labeled negative.
5. **Personalization needs repeated comparable events.** Future Me's decisions may not recur with enough similarity to support per-user causal learning.
6. **User control remains prior.** Explicit correction, defer, silence, and opt-out cannot be treated merely as low rewards for an optimizing policy.
7. **No architecture conclusion follows.** The evidence supports semantic and evaluation constraints only.

## 6. Source appendix

All external sources below are peer-reviewed primary studies, methodological papers, or systematic/scoping reviews. DOI URLs are used as stable identifiers.

| ID | Source type | Citation and stable URL | Used for |
|---|---|---|---|
| S1 | Peer-reviewed conceptual/methodological paper | Nahum-Shani et al. (2018), “Just-in-Time Adaptive Interventions (JITAIs) in Mobile Health: Key Components and Design Principles for Ongoing Health Behavior Support.” [https://doi.org/10.1007/s12160-016-9830-8](https://doi.org/10.1007/s12160-016-9830-8) | JITAI components; proximal/distal outcomes; receptivity; no-op; fatigue and burden |
| S2 | Peer-reviewed methodological paper | Klasnja et al. (2015), “Microrandomized Trials: An Experimental Design for Developing Just-in-Time Adaptive Interventions.” [https://doi.org/10.1037/hea0000305](https://doi.org/10.1037/hea0000305) | Repeated randomization; proximal causal effects; moderation boundaries |
| S3 | Systematic review | Hardeman et al. (2019), “A systematic review of just-in-time adaptive interventions (JITAIs) to promote physical activity.” [https://doi.org/10.1186/s12966-019-0792-7](https://doi.org/10.1186/s12966-019-0792-7) | Mixed effects; underpowering; feasibility, reporting, and sustained-engagement gaps |
| S4 | Systematic review | Yang et al. (2026), “Just-in-Time Adaptive Interventions for physical activity: a systematic review of their public health impact and methodological quality.” [https://doi.org/10.3389/fpubh.2026.1934024](https://doi.org/10.3389/fpubh.2026.1934024) | Current physical-activity evidence; heterogeneity; null sedentary-time results; methodological immaturity |
| S5 | Peer-reviewed primary field study | Mehrotra et al. (2016), “My Phone and Me: Understanding People's Receptivity to Mobile Notifications.” [https://doi.org/10.1145/2858036.2858566](https://doi.org/10.1145/2858036.2858566) | Task/content/individual effects on response and perceived disruption |
| S6 | Systematic review and meta-analysis | Künzler, Kramer, and Kowatsch (2017), “Efficacy of Mobile Context-aware Notification Management Systems.” [https://doi.org/10.1109/WiMOB.2017.8115839](https://doi.org/10.1109/WiMOB.2017.8115839) | Context-aware response-rate evidence, heterogeneity, and risk of bias |
| S7 | Peer-reviewed primary experiment | Ho and Intille (2005), “Using context-aware computing to reduce the perceived burden of interruptions from mobile devices.” [https://doi.org/10.1145/1054972.1055100](https://doi.org/10.1145/1054972.1055100) | Activity transitions and perceived interruption burden |
| S8 | Peer-reviewed exploratory randomized trial | Morrison et al. (2017), “The Effect of Timing and Frequency of Push Notifications on Usage of a Smartphone-Based Stress Management Intervention.” [https://doi.org/10.1371/journal.pone.0169162](https://doi.org/10.1371/journal.pone.0169162) | Null timing comparison; low use; attrition; repetition annoyance; underpowering |
| S9 | Peer-reviewed primary field deployment | Mishra et al. (2021), “Detecting Receptivity for mHealth Interventions in the Natural Environment.” [https://doi.org/10.1145/3463492](https://doi.org/10.1145/3463492) | Static/adaptive receptivity models; cold start; time trend; deployment limitations |
| S10 | Peer-reviewed primary MRT | Bell et al. (2023), “How Notifications Affect Engagement With a Behavior Change App: Results From a Micro-Randomized Trial.” [https://doi.org/10.2196/38342](https://doi.org/10.2196/38342) | Immediate engagement effect versus no sustained engagement-policy effect |
| S11 | Peer-reviewed causal-methods paper | Boruvka et al. (2018), “Assessing Time-Varying Causal Effect Moderation in Mobile Health.” [https://doi.org/10.1080/01621459.2017.1305274](https://doi.org/10.1080/01621459.2017.1305274) | Scoped causal moderation under repeated treatment and availability |
| S12 | Peer-reviewed primary MRT | Klasnja et al. (2019), “Efficacy of Contextually Tailored Suggestions for Physical Activity: A Micro-randomized Optimization Trial of HeartSteps.” [https://doi.org/10.1093/abm/kay067](https://doi.org/10.1093/abm/kay067) | Positive, null, and decaying proximal effects; component versus package distinction |
| S13 | Systematic review and meta-analysis | Xu and Smit (2023), “Using a complexity science approach to evaluate the effectiveness of just-in-time adaptive interventions.” [https://doi.org/10.1177/20552076231183543](https://doi.org/10.1177/20552076231183543) | Positive pooled evidence and its design/heterogeneity limitations |
| S14 | Systematic review and meta-analysis | von Lützow, Neuendorf, and Scherr (2025), “Effectiveness of just-in-time adaptive interventions for improving mental health and psychological well-being.” [https://doi.org/10.1136/bmjment-2025-301641](https://doi.org/10.1136/bmjment-2025-301641) | Small between-group effects; adherence and missing-data risk; domain limits |
| S15 | Peer-reviewed primary algorithm/design paper with pilot data | Liao et al. (2020), “Personalized HeartSteps: A Reinforcement Learning Algorithm for Optimizing Physical Activity.” [https://doi.org/10.1145/3381007](https://doi.org/10.1145/3381007) | Reward definition; sparse data; cold start; nonstationarity; burden and model assumptions |
| S16 | Peer-reviewed methodological case study | Ghosh et al. (2024), “Did we personalize? Assessing personalization by an online reinforcement learning algorithm using resampling.” [https://doi.org/10.1007/s10994-024-06526-x](https://doi.org/10.1007/s10994-024-06526-x) | Apparent versus demonstrated personalization; stochasticity and truth-in-advertising |

## 7. Pass A conclusion

The evidence supports conservative semantics and evaluation discipline, not a proactive adaptive architecture. Future Me can safely carry forward: an explicit no-op option; separation of need, availability, interruptibility, and receptivity; burden as a measured outcome; decision/recommendation/exposure/choice/outcome/feedback separation; and strict limits on what one episode, repeated observational patterns, or randomized evidence can teach.

Learned timing, implicit preference learning, online RL, and MRTs remain deferred. The evidence rejects generic JITAI efficacy, “adaptive is better,” engagement-as-benefit, single-outcome policy learning, and causal claims from observational recommendation histories. The next pass, if requested, would need product-level definitions of the first testable intervention, proximal/distal outcomes, burden measures, and ethical exclusions; those questions are intentionally left unresolved here.
