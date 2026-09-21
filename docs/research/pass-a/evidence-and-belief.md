# Pass A — Evidence Quality and Belief Mechanisms

**Date:** 2026-09-20  
**Scope:** Audit heterogeneous evidence quality for Future Me. This is a mechanism and evidence-transfer audit, not a final architecture or implementation specification.

## 1. Evidence roles and audit boundary

The reviewed inputs do not all have the same evidentiary role:

| Input | Role in this pass | What it can establish | What it cannot establish |
|---|---|---|---|
| [PRODUCT.md](../../PRODUCT.md), [MVP_SCOPE_UPDATED.md](../../MVP_SCOPE_UPDATED.md), [DOMAIN_CONTRACT.md](../../DOMAIN_CONTRACT.md), [USER_FLOWS.md](../../USER_FLOWS.md) | Current product contracts | Intended behavior, invariants, scope, and terminology | Empirical validity of a fusion or belief method |
| [RECOVERED_SUBAGENT_EVIDENCE.md](../RECOVERED_SUBAGENT_EVIDENCE.md) | Research lead and prior analysis | Candidate mechanisms and sources to verify | Authority by itself; its summaries are not substitutes for cited originals |
| `/home/tdat/Downloads/deep-research-report(3).md` | Hypothesis input only | Questions and candidate transfers worth testing | Verified evidence, product decision, or implementation mandate |
| Peer-reviewed originals and official standards below | External evidence | The mechanism, assumptions, and demonstrated scope in the source | Automatic transfer to sparse, personal, role-heterogeneous evidence |

The domain contract's conceptual expression

```text
trustworthiness = source reliability + confidence + freshness + corroboration
```

is therefore treated as a product hypothesis, not a validated equation. Its terms are useful dimensions, but their units, interaction, calibration, and claim-specific relevance are unspecified.

## 2. Comparison at a glance

| Mechanism | Quality representation | Combination/update mechanism | Handles unknown or conflict | Time model | Fit for current Future Me |
|---|---|---|---|---|---|
| Scalar trust | One total order or number | Rank, threshold, or weighted sum | Usually collapses distinct causes | Often an added decay term | **REJECT** as the belief model |
| Multidimensional quality metadata | Separate provenance, directness, freshness, corroboration, uncertainty, and claim-role fields | No fusion rule by itself | Preserves reasons for doubt | Can carry several time fields | **USE** |
| Bayesian fusion/filtering | Prior/posterior probabilities and likelihood/noise models | Bayes update; recursive state estimation | Represents uncertainty if hypotheses and models are sound | Native sequential update | **DEFER** pending measurable targets and calibration |
| Dempster–Shafer | Belief mass on sets of hypotheses | Dempster-style evidence combination | Explicit ignorance is representable; high conflict is delicate | Not inherently bitemporal | **REJECT** for MVP |
| Truth discovery | Source trust and fact confidence learned jointly | Iterative agreement/reinforcement across many providers and facts | Resolves conflicts toward inferred truth | Basic form is not time-aware | **REJECT** for current personal evidence |
| Weak supervision | Accuracies/dependencies of labeling functions | Produces probabilistic training labels, then trains a model | Label functions may abstain and conflict | Not a current-belief history model | **DEFER** until a training task and enough cases exist |
| Provenance | Entities, activities, agents, derivations, attribution | Traces production and transformation | Exposes bases and conflicts; does not resolve them | Records generation/use events | **USE** |
| Temporal/bitemporal validity | Valid time plus transaction/recorded time | Selects evidence by applicable interval and knowledge history | Distinguishes stale, superseded, retroactive, and conflicting records | Core purpose | **USE** |
| Belief revision | Belief-set expansion, contraction, and revision under rationality constraints | Incorporates a new proposition while preserving consistency/minimal change | Formalizes retraction/revision | Time is external to classic AGM | **USE** as a discipline; **DEFER** a formal AGM engine |

## 3. Structured claim records

### Claim 01 — A single scalar is not an adequate evidence-quality representation

- **Question:** Can Future Me safely reduce heterogeneous evidence quality to one global `trustworthiness` or `confidence` number?
- **Mechanism:** Scalar trust assigns each item or source one number or rank, then uses that value for ordering, thresholding, or weighted combination.
- **Source metadata / type / URL:** Richard Y. Wang and Diane M. Strong, “Beyond Accuracy: What Data Quality Means to Data Consumers,” *Journal of Management Information Systems* 12(4), 1996, peer-reviewed empirical framework paper, [DOI 10.1080/07421222.1996.11518099](https://doi.org/10.1080/07421222.1996.11518099).
- **Supports:** Data consumers judge quality through multiple intrinsic, contextual, representational, and accessibility dimensions. Quality is broader than one attribute such as accuracy and depends on use context.
- **Does not support:** The paper does not prove that every scalar summary is invalid, prescribe Future Me's dimensions, or validate an additive formula over reliability, confidence, freshness, and corroboration.
- **Assumptions:** Evidence quality matters only relative to a claim and intended use; the dimensions are not automatically commensurable.
- **Limitations:** The source studies data-quality perceptions in organizational settings, not personal belief management or probabilistic fusion.
- **Failure conditions:** A scalar fails when equal scores hide different risks; when a source is authoritative for one claim type but not another; when stale direct evidence and fresh indirect evidence tie; or when correlated reports are counted as corroboration.
- **Independent support / counter-evidence:** W3C's provenance work treats provenance as input to quality or trust assessment, not as trust itself; see Claim 07. A calibrated probability can still be an appropriate scalar for one precisely defined forecast, so the rejection is of a *global evidence-quality scalar*, not all numeric probabilities.
- **Future Me transfer:** Keep distinct quality fields and explicit belief states (`SUPPORTED`, `UNCERTAIN`, `CONFLICTED`, `STALE`, `UNKNOWN`). A numeric value, if later used, must name its semantics: probability of which proposition, under which model and horizon.
- **Source/claim mismatch flag:** `confidence: 1.0` on a user-confirmed record can mean “the user definitely said this,” but it does not establish that the content is externally true, current, or predictive.
- **Confidence:** **High** that a global scalar is insufficient; **medium** on the exact replacement dimensions until product-specific evaluation.

### Claim 02 — Multidimensional metadata preserves decision-relevant distinctions

- **Question:** What is the minimum defensible alternative to scalar trust?
- **Mechanism:** Store separable metadata about the evidence and its use: claim identity and polarity; source/agent; source-to-claim role compatibility; directness; observation and recording method; valid interval; recorded time; derivation; independence/correlation group; uncertainty semantics; and status.
- **Source metadata / type / URL:** Wang and Strong (1996), peer-reviewed data-quality research, [DOI](https://doi.org/10.1080/07421222.1996.11518099); W3C, *PROV-DM: The PROV Data Model*, W3C Recommendation, 30 April 2013, [stable dated Recommendation](https://www.w3.org/TR/2013/REC-prov-dm-20130430/).
- **Supports:** Quality is multidimensional and contextual; provenance can represent entities, activities, agents, attribution, generation, use, and derivation.
- **Does not support:** Neither source supplies a Future Me scoring policy, freshness window, source hierarchy, or claim schema. Metadata alone does not decide what to believe.
- **Assumptions:** Downstream policy can inspect dimensions without silently coercing them into a single score; fields use controlled meanings.
- **Limitations:** More metadata increases capture, validation, storage, and explanation cost. Missing metadata remains possible.
- **Failure conditions:** The design becomes cosmetic if fields are untyped free text, if unknown values default to favorable values, if derivations lose their parent evidence IDs, or if several copied observations appear independent.
- **Independent support / counter-evidence:** Claim 08 independently supports separate time axes. Counterpoint: a compact scalar can be useful for display or a calibrated forecast after the dimensions and model are defined; it should be an output, not the sole retained evidence representation.
- **Future Me transfer:** The current `source`, `confidence`, `observed_at`, `valid_from`, and `expires_at` fields are a useful start. Missing high-value distinctions include `recorded_at`, `source_id`, `derives_from`, explicit claim polarity/status, and a way to mark common origin or dependency.
- **Source/claim mismatch flag:** A source *type* such as `CALENDAR` is not provenance of a particular assertion. It omits the calendar/account/event, ingestion activity, version, and any transformation that produced the claim.
- **Confidence:** **High** for retaining dimensions; **medium** for the proposed application-specific field set.

### Claim 03 — Bayesian fusion and filtering require an explicit generative or measurement model

- **Question:** Should Future Me combine heterogeneous evidence by Bayesian updating or a recursive filter now?
- **Mechanism:** Bayesian updating combines a prior with evidence likelihoods. Kalman filtering recursively estimates a latent state from a specified state-transition model and observation model while propagating estimation covariance.
- **Source metadata / type / URL:** R. E. Kalman, “A New Approach to Linear Filtering and Prediction Problems,” *Journal of Basic Engineering* 82(1), 1960, original peer-reviewed paper, [DOI 10.1115/1.3662552](https://doi.org/10.1115/1.3662552).
- **Supports:** Recursive state estimation can combine sequential observations and carry uncertainty when the state, dynamics, observation relationship, and error structure are specified.
- **Does not support:** The paper does not justify feeding calendar entries, self-reports, app activity, and LLM inferences into one generic filter. It does not turn semantic claim confidence into measurement noise or validate a latent construct such as “overloaded.”
- **Assumptions:** The state is identifiable; observations measure that state in a modeled way; noise assumptions and parameters are defensible; repeated evidence is not treated as independent when it is not.
- **Limitations:** Future Me presently lacks stable targets, likelihoods/noise estimates, dense per-user ground truth, and evidence that personal regimes are sufficiently stationary for a fixed model.
- **Failure conditions:** Model misspecification, concept drift, correlated inputs, circular reuse of derived evidence, unobservable states, or confident but biased measurements can yield precise-looking wrong posteriors.
- **Independent support / counter-evidence:** Dempster–Shafer (Claim 04) represents ignorance differently, showing that Bayesian probability is not the only uncertainty language. The existence of alternatives does not remove the need to define hypotheses and evidence semantics.
- **Future Me transfer:** Defer automatic Bayesian fusion/filtering. It may later fit a narrow, measurable forecast—such as a distribution over usable focus minutes—with explicit outcomes and calibration. It is not presently justified as the generic current-belief resolver.
- **Source/claim mismatch flag:** The downloaded hypothesis report's state-space proposal is plausible for *time-series forecasting*; citing Kalman does not support using a Kalman filter to resolve arbitrary personal claims or source conflicts.
- **Confidence:** **High** on the model requirements and current deferral; **medium** on eventual usefulness for narrow forecasts.

### Claim 04 — Dempster–Shafer can represent ignorance, but combination is assumption-sensitive

- **Question:** Is Dempster–Shafer a better default than Bayesian fusion for conflicting personal evidence?
- **Mechanism:** Assign belief mass to sets in a defined frame of discernment, derive lower and upper support, and combine evidence under a chosen rule.
- **Source metadata / type / URL:** Arthur P. Dempster, “Upper and Lower Probabilities Induced by a Multivalued Mapping,” *The Annals of Mathematical Statistics* 38(2), 1967, original peer-reviewed paper, [DOI 10.1214/aoms/1177698950](https://doi.org/10.1214/aoms/1177698950). Counter-evidence: Lotfi A. Zadeh, “A Simple View of the Dempster-Shafer Theory of Evidence and Its Implication for the Rule of Combination,” *AI Magazine* 7(2), 1986, peer-reviewed critique, [DOI 10.1609/aimag.v7i2.542](https://doi.org/10.1609/aimag.v7i2.542).
- **Supports:** Lower/upper probabilities and mass on sets can distinguish lack of commitment from ordinary probability assigned to a singleton.
- **Does not support:** These sources do not justify mapping arbitrary UI confidence values into mass functions, treating all sources as combinable, or selecting a universal combination rule for Future Me.
- **Assumptions:** The hypothesis frame is explicit and sufficiently complete; evidence mappings are meaningful; combination assumptions, including independence/combinability, are satisfied.
- **Limitations:** Frame design and mass elicitation are substantial modeling tasks. Highly conflicting evidence can produce counterintuitive normalized results when the model or combinability assumptions are wrong.
- **Failure conditions:** Overlapping meanings, missing hypotheses, dependent sources, masses invented from uncalibrated scores, or severe conflict.
- **Independent support / counter-evidence:** Zadeh's critique demonstrates that counterintuitive results may expose an invalid combination model rather than mere arithmetic error. Bayesian methods also fail under wrong likelihoods; Dempster–Shafer does not eliminate modeling risk.
- **Future Me transfer:** Preserve `UNKNOWN` and `CONFLICTED` directly in the product model instead of adopting mass-function calculus for the MVP. Revisit only if a bounded frame and independently validated evidence mappings emerge.
- **Source/claim mismatch flag:** “Can represent ignorance” does not imply “safely combines any heterogeneous evidence.”
- **Confidence:** **High** to reject it for the MVP; **low-to-medium** on whether a future bounded use case could justify it.

### Claim 05 — Truth discovery is mismatched to sparse, role-dependent personal evidence

- **Question:** Can Future Me learn which source is trustworthy by agreement across conflicting claims?
- **Mechanism:** TruthFinder-style methods iteratively estimate provider trustworthiness and fact confidence: facts from trusted providers gain confidence, while providers gain trust by supplying confident facts.
- **Source metadata / type / URL:** Xiaoxin Yin, Jiawei Han, and Philip S. Yu, “Truth Discovery with Multiple Conflicting Information Providers on the Web,” *IEEE Transactions on Knowledge and Data Engineering* 20(6), 2008, original peer-reviewed paper, [DOI 10.1109/TKDE.2007.190745](https://doi.org/10.1109/TKDE.2007.190745). Dependence counter-evidence: Xin Luna Dong, Laure Berti-Équille, and Divesh Srivastava, “Integrating Conflicting Data: The Role of Source Dependence,” *Proceedings of the VLDB Endowment* 2(1), 2009, original peer-reviewed paper, [DOI 10.14778/1687627.1687690](https://doi.org/10.14778/1687627.1687690), [official PVLDB paper](https://www.vldb.org/pvldb/vol2/vldb09-pvldb47.pdf).
- **Supports:** Repeated claims across many providers and objects can support joint estimation of source-level trust and fact confidence; simple majority voting is not the only option.
- **Does not support:** The paper does not establish that agreement reveals truth with few personal sources, that source reliability is global across claim types, or that a user's report, calendar record, and telemetry are interchangeable providers of the same facts.
- **Assumptions:** Many comparable claims exist; providers have learnable regularities; claims refer to resolvable factual alternatives; dependencies or copying do not masquerade as independent agreement.
- **Limitations:** Personal evidence is sparse, nonstationary, privacy-sensitive, and role-heterogeneous. For intent and preference, first-person authority differs categorically from external fact verification.
- **Failure conditions:** Correlated sources, copied calendar data, one source producing most observations, regime change, adversarial or systematic bias, and claims without observable ground truth.
- **Independent support / counter-evidence:** Dong, Berti-Équille, and Srivastava show that copied false values can defeat majority-style truth discovery and model source dependence explicitly. This reinforces the need to record common origin rather than count raw corroboration; see Claim 02.
- **Future Me transfer:** Reject latent global source-trust learning for the current product. Use claim-type compatibility, temporal applicability, explicit conflict, and user clarification when the unresolved difference can affect a decision.
- **Source/claim mismatch flag:** TruthFinder addresses externally conflicting web facts at scale. It does not validate automatic resolution of “what the user intends now” from a calendar and device signals.
- **Confidence:** **High**.

### Claim 06 — Weak supervision is a training-data mechanism, not a runtime belief resolver

- **Question:** Can Future Me treat calendar blocks, telemetry, and heuristics as weak labels and thereby solve current belief quality?
- **Mechanism:** Labeling functions emit labels or abstain; a generative label model estimates their accuracies and dependencies from agreement patterns and creates probabilistic training labels for a downstream discriminative model.
- **Source metadata / type / URL:** Alexander Ratner et al., “Snorkel: Rapid Training Data Creation with Weak Supervision,” *Proceedings of the VLDB Endowment* 11(3), 2017, original peer-reviewed systems paper, [DOI 10.14778/3157794.3157797](https://doi.org/10.14778/3157794.3157797), [official PVLDB paper](https://www.vldb.org/pvldb/vol11/p269-ratner.pdf).
- **Supports:** Multiple noisy programmatic supervision sources can be modeled, including abstention and dependency, to create probabilistic labels and reduce hand-labeling effort for a defined ML task.
- **Does not support:** Snorkel does not make a calendar event ground truth, resolve a single user's live conflicting beliefs, provide temporal validity, or guarantee identifiable accuracies from a tiny stream of idiosyncratic cases.
- **Assumptions:** A stable label space and training examples exist; labeling functions target the same task; their coverage and dependency structure permit useful estimation; downstream performance can be evaluated.
- **Limitations:** Label-model quality depends on the supervision sources and dependency model. A learned label is still not an observed personal outcome.
- **Failure conditions:** Few cases, one dominant labeling function, hidden shared rules, label leakage, drift, no held-out outcomes, or a task definition that changes with context.
- **Independent support / counter-evidence:** Truth discovery also estimates source quality through agreement, but for asserted facts rather than training labels. Their related assumptions make neither a substitute for provenance and temporal validity.
- **Future Me transfer:** Defer until Future Me has a narrow prediction task, a repeatable label definition, enough episodes, explicit user/outcome labels, and evaluation. Do not use “weak supervision” to relabel current evidence as truth.
- **Source/claim mismatch flag:** The downloaded hypothesis report correctly treats telemetry as weak evidence; the stronger inference that Snorkel validates an MVP evidence-fusion layer is unsupported.
- **Confidence:** **High** on deferral and mismatch; **medium** on later utility.

### Claim 07 — Provenance enables traceability but does not determine truth

- **Question:** What does provenance solve for Future Me, and where does it stop?
- **Mechanism:** Represent evidence and derived beliefs as entities; ingestion, parsing, inference, correction, and selection as activities; people/software/providers as agents; and retain attribution, generation, use, and derivation links.
- **Source metadata / type / URL:** W3C, *PROV-DM: The PROV Data Model*, W3C Recommendation, [stable dated Recommendation](https://www.w3.org/TR/2013/REC-prov-dm-20130430/). W3C, *PROV-AQ: Provenance Access and Query*, Working Group Note, [stable dated Note](https://www.w3.org/TR/2013/NOTE-prov-aq-20130430/).
- **Supports:** A standard conceptual vocabulary for entities, activities, agents, derivations, attribution, generation, and usage. PROV-AQ explicitly warns that a provenance record is not guaranteed authoritative or correct and that its trust must be determined separately.
- **Does not support:** PROV does not rank sources, calibrate confidence, resolve conflict, define freshness, or prove that the recorded lineage is honest.
- **Assumptions:** Identifiers and derivation links are captured at transformation time; provenance records themselves have controlled access and integrity appropriate to their sensitivity.
- **Limitations:** Full PROV can be more expressive than the MVP needs. Provenance can be incomplete, incorrect, or too verbose for users.
- **Failure conditions:** Derived claims lose parent links; transformations are overwritten; source identity is confused with source type; provenance is displayed as proof; or sensitive lineage leaks private activity.
- **Independent support / counter-evidence:** Wang and Strong support contextual quality assessment but do not provide lineage. Conversely, PROV supplies lineage but intentionally leaves trust assessment to applications.
- **Future Me transfer:** Use a lightweight PROV mapping, not necessarily the full serialization: evidence/belief records, source agents, processing activities, parent evidence IDs, policy/model version, and recorded timestamps. Explanations should cite the exact basis rather than merely say “from calendar.”
- **Source/claim mismatch flag:** “Has provenance” means traceable production history, not “is trustworthy” or “is true.”
- **Confidence:** **High**.

### Claim 08 — Valid time and recorded/transaction time answer different questions

- **Question:** Are `observed_at`, `valid_from`, and `expires_at` enough to reason about corrections, staleness, and replay?
- **Mechanism:** Valid time states when an assertion applies in the modeled world; transaction/recorded time states when the system stored or knew the record. Keeping both permits “what is believed now about then?” and “what did the system believe then?” queries.
- **Source metadata / type / URL:** Richard T. Snodgrass and Ilsoo Ahn, “A Taxonomy of Time in Databases,” *Proceedings of ACM SIGMOD*, 1985, original peer-reviewed conference paper, [DOI 10.1145/318898.318921](https://doi.org/10.1145/318898.318921), [author-hosted paper](https://www2.cs.arizona.edu/~rts/pubs/SIGMOD85.pdf).
- **Supports:** Distinct time concepts are needed to represent time-varying information without conflating when something is true with when it is recorded or changed in the database.
- **Does not support:** The source does not define Future Me's freshness windows, `expires_at` policy, event-time semantics for every source, or whether an expired claim becomes false.
- **Assumptions:** Claims can be assigned meaningful validity intervals; recorded history is retained; corrections do not rewrite the past.
- **Limitations:** Some personal assertions have vague or open-ended validity. Late-arriving and retroactive corrections can create overlapping intervals that policy must surface or reconcile.
- **Failure conditions:** Only the latest row survives; ingestion time is used as event time; expiry is interpreted as falsity; clock/time-zone errors occur; or a late sync silently displaces a newer user correction.
- **Independent support / counter-evidence:** The product flow requiring preserved history and later replay independently needs recorded-time semantics. Provenance generation times complement but do not replace claim-validity intervals.
- **Future Me transfer:** Add an unambiguous `recorded_at`/system-time axis while preserving `observed_at` and `valid_from`/`valid_until`. Treat freshness as claim-type policy and stale as “not safe to rely on now,” not “false.”
- **Source/claim mismatch flag:** `observed_at` is ambiguous across sources: calendar event start, API sync time, user statement time, and inferred-claim generation time are not interchangeable.
- **Confidence:** **High** for the two-time distinction; **medium** for any specific expiry policy.

### Claim 09 — Belief revision offers useful discipline, not a ready-made personal evidence engine

- **Question:** How should a current belief change when new evidence contradicts an earlier belief?
- **Mechanism:** AGM theory distinguishes expansion, contraction, and revision and characterizes rational belief change, including consistency and minimal loss of prior information under formal assumptions.
- **Source metadata / type / URL:** Carlos E. Alchourrón, Peter Gärdenfors, and David Makinson, “On the Logic of Theory Change: Partial Meet Contraction and Revision Functions,” *The Journal of Symbolic Logic* 50(2), 1985, original peer-reviewed paper, [DOI 10.2307/2274239](https://doi.org/10.2307/2274239).
- **Supports:** Incorporating a contradictory proposition is not equivalent to appending it; principled revision may require withdrawing or weakening prior commitments while preserving as much as possible.
- **Does not support:** Classic AGM does not supply source reliability, probabilistic confidence, provenance, temporal intervals, contradiction detection for natural language, or Future Me's user-over-calendar rule.
- **Assumptions:** Beliefs are represented in a formal logic with closure/consistency notions and an ordering or selection over what to retain.
- **Limitations:** Those assumptions are much stronger than the current typed, uncertain, time-scoped personal claims. Full logical closure can be impractical and can obscure evidentiary history.
- **Failure conditions:** Treating all evidence as categorical propositions; deleting contradicted records; revising across non-overlapping time intervals; or using hidden entrenchment rules that users cannot inspect.
- **Independent support / counter-evidence:** Bitemporal storage argues for preserving old evidence even when the *current derived belief* changes. This differs from maintaining only a logically closed current belief set.
- **Future Me transfer:** Use the discipline now: append evidence, detect same-claim/same-interval conflict, recompute a separate current belief, record its basis and policy version, and preserve prior versions. Defer a formal AGM engine.
- **Source/claim mismatch flag:** “Newer user correction wins” is a domain policy, not a theorem of AGM. It also applies only where the user has authority over the claim (for example, intent or cancellation report).
- **Confidence:** **High** for the lightweight revision discipline; **low-to-medium** for formal AGM transfer.

### Claim 10 — Source quality is claim-role-specific, not a global hierarchy

- **Question:** Can Future Me safely use a general ranking such as user confirmation > structured source > observation > historical pattern > inference?
- **Mechanism:** Evaluate whether a source can directly support the particular proposition before considering freshness, reliability, or corroboration. Keep observation, report, plan, inference, forecast, and outcome as distinct claim roles.
- **Source metadata / type / URL:** Future Me's product invariants in [USER_FLOWS.md](../../USER_FLOWS.md) and [DOMAIN_CONTRACT.md](../../DOMAIN_CONTRACT.md), official local product contracts; Wang and Strong (1996), peer-reviewed contextual data-quality research, [DOI](https://doi.org/10.1080/07421222.1996.11518099); W3C PROV-DM, official Recommendation, [stable dated URL](https://www.w3.org/TR/2013/REC-prov-dm-20130430/).
- **Supports:** Quality depends on intended use; provenance preserves what produced a record; the product correctly distinguishes observation from truth, forecast from fact, calendar plans from observed behavior, silence from confirmation, and missing evidence from evidence of absence.
- **Does not support:** None of these sources validates a universal ranking among user reports, calendars, telemetry, and inferences. “User-confirmed” is not globally superior for externally verifiable facts; telemetry is not globally superior for intent.
- **Assumptions:** Claim types and source roles are explicit enough to test compatibility; the system can retain `UNKNOWN` rather than force a winner.
- **Limitations:** Claim-role policy requires domain definitions and can still encode bias. A user can be mistaken, an API can be stale, telemetry can be incomplete, and an inference can occasionally be more predictive than a report.
- **Failure conditions:** Calendar event implies completion; device activity implies meaningful progress; absence of events implies free time; a user statement about an external event is treated as verified fact; multiple records from one upstream event count as independent corroboration; an LLM inference is stored as an observation.
- **Independent support / counter-evidence:** Truth discovery and Bayesian fusion can learn or estimate source behavior when enough comparable outcomes exist, but current Future Me lacks that evidence. Until then, a transparent compatibility policy is less expressive but more auditable.
- **Future Me transfer:** Use claim-role checks before any ranking. Example: calendar directly supports “an event is scheduled,” a user statement supports “the user reports cancellation,” telemetry supports “activity was observed,” and a model output supports only “the system inferred X from listed evidence.” Preserve conflicts when these do not answer the same proposition.
- **Source/claim mismatch flag:** The current generic source hierarchy is acceptable as an explanatory sketch only; applying it globally would contradict the product's own invariants.
- **Confidence:** **High** on the role distinctions and mismatch flags; **medium** on exact resolution precedence.

## 4. Cross-record source/claim mismatch register

| Source or method | Supported claim | Common unsupported promotion |
|---|---|---|
| Calendar event | A provider currently records a scheduled event with given fields | The user attended, completed it, wants it, or is otherwise free |
| User statement | The user reported an intent, preference, state, correction, or external assertion | Independent verification of an external fact; permanent truth |
| Device/app telemetry | A defined signal was observed on a device during an interval | Productive work, task meaning, motivation, or goal completion |
| Historical pattern | A pattern occurred in selected past observations | The regime is unchanged; the next case will follow it |
| LLM/model output | A versioned process inferred or forecast a proposition from listed inputs | Direct observation, calibrated probability, or verified truth |
| Multiple records | Several records support a proposition | Independent corroboration, unless common origin/dependency is excluded |
| W3C PROV | Lineage can be represented and exchanged | Lineage is correct; the claim is trustworthy or true |
| Kalman/Bayesian methods | Sequential uncertainty update under an explicit model | Generic fusion of untyped semantic claims |
| Dempster–Shafer | Belief/ignorance over a defined frame under combination assumptions | Safe combination of arbitrary confidence scores |
| TruthFinder | Joint provider/fact estimation for many conflicting provider claims | Resolution of sparse first-person intent and heterogeneous sensor roles |
| Snorkel | Probabilistic labels for a defined training task from labeling functions | Runtime personal belief state or ground truth |
| AGM | Rational constraints for formal belief-set change | A provenance, time, confidence, or source-authority policy |

## 5. Candidate mechanism disposition

### USE

- **Multidimensional quality metadata:** retain distinct reasons for confidence or doubt; do not collapse them at ingestion.
- **Lightweight provenance:** identify evidence, source agent/record, producing activity, transformations, parent evidence, and policy/model version.
- **Valid time plus recorded/transaction time:** preserve retroactive corrections, replay, and “known then versus known now.”
- **Explicit `UNKNOWN`, `STALE`, and `CONFLICTED` states:** uncertainty and disagreement are valid outputs.
- **Claim-role compatibility checks:** determine what a source can support before ranking it.
- **Append-only evidence with revisable derived beliefs:** use belief-revision discipline while preserving history.

### DEFER

- **Bayesian/state-space fusion:** defer until a narrow state/forecast, observation model, outcomes, and calibration procedure exist.
- **Weak supervision:** defer until there is a stable supervised task, enough episodes, labeling functions, and evaluation data.
- **Formal AGM engine:** defer; use its change discipline without importing its full logical assumptions.

### REJECT

- **One global scalar trust score as truth:** it destroys claim-role and quality-cause distinctions.
- **TruthFinder-style learned global source trust for the MVP:** the source/task/population assumptions do not fit.
- **Dempster–Shafer combination for the MVP:** frame and mass elicitation costs are unjustified, and high-conflict/dependency behavior is risky.
- **Automatic conflict resolution solely by source class:** source authority is claim-specific and time-specific.

### UNRESOLVED

- **Numeric confidence semantics:** probability of truth, source reliability, model confidence, and UI certainty must not share one field without a definition.
- **Freshness/expiry policy by claim type:** the two-time model is well supported; actual intervals require product evidence and later correction/outcome analysis.
- **Dependency/correlation representation:** a common-origin identifier is a defensible minimum, but the eventual dependency model is open.
- **Resolution precedence for mixed-authority claims:** user correction is strong for personal intent/reporting, but exact policies for externally verifiable facts and ambiguous natural-language claims remain open.

## 6. Pass A conclusion

The strongest transferable evidence supports preserving dimensions, lineage, temporal applicability, and revision history. It does **not** support treating heterogeneous inputs as commensurable confidence numbers or automatically fusing them into truth. Advanced fusion methods are scientifically legitimate within their own assumptions, but the reviewed Future Me evidence does not yet establish those assumptions. The immediate research position is therefore provenance-first and time-aware, with explicit unknown/conflict states and claim-role checks; this is a disposition of candidate mechanisms, not a final architecture.
