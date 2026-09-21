# Pass A — Gap Audit

**Date:** 2026-09-20  
**Mode:** Gap audit only; no implementation and no final architecture  
**Authority rule:** `PRODUCT.md`, `MVP_SCOPE_UPDATED.md`, `DOMAIN_CONTRACT.md`, and `USER_FLOWS.md` are authoritative unless they contradict one another or are invalid. Research files are evidence or proposals, not contracts.

## 1. Audit result

The current decision-intelligence synthesis is **not ready to serve as the required 21-section report**.

The blocking reasons are:

1. It declares an 18-section contract, not the required 21-section report.
2. It promotes optional forecasting into a mandatory MVP workstream.
3. It changes the product center from context-aware decision support to probabilistic capacity forecasting.
4. It introduces domain objects and semantics that are not reconciled with the authoritative eight-object domain contract.
5. Its five-day plan combines ledger design, bitemporality, dependency propagation, multiple models, calibration, VOI, JITAI controls, backtesting, privacy/deletion tests, and UI work without estimates or prerequisites.
6. Several citations resolve to different papers than the report claims, and the predecessor report uses non-portable citation tokens.
7. The report marks conclusions as final, high-confidence, or internally passed while material product-owner decisions remain open and supporting evidence is absent.

### Disposition vocabulary

- **CONFIRM** — supported by the authoritative contracts and adequate evidence.
- **MODIFY** — direction is usable, but scope, wording, or semantics must change.
- **REJECT** — conflicts with the contracts, is invalid, or is unsuitable for the five-day MVP.
- **UNCERTAIN** — evidence or an owner decision is still missing.

## 2. Prioritized contradictions and invalid assumptions

| Priority | Severity | Location | Gap | Why it matters | Evidence needed to close | Provisional disposition |
|---|---|---|---|---|---|---|
| P0-01 | Blocker | `MVP_SCOPE_UPDATED.md` §4.1, lines 433-459; `FUTURE_ME_DECISION_INTELLIGENCE_RESEARCH.md` §6 and §14, lines 59-63 and 120-132 | The contract makes numerical/probabilistic forecasting a SHOULD and explicitly says it is not a dependency of the MVP decision path. The synthesis schedules several forecast models and calibration as mandatory Day 3 work. | This can consume the timebox while failing the actual success criterion: context changes reasoning. | Product-owner decision to promote forecasting to MUST, plus a measurable target, usable labels, data volume, and an implementation estimate. | **REJECT** mandatory forecasting; **MODIFY** to an optional, replaceable seam. |
| P0-02 | Blocker | `PRODUCT.md` §§3-4 and §10, lines 65-93 and 244-260; `deep-research-report(3).md` lines 5-25 and 54-58 | The product contract centers trustworthy context and better decisions; forecasting is a supporting mechanism. The source report declares uncertain future capacity to be the strongest product thesis. | It changes what the MVP is trying to prove and risks building an AI forecaster rather than Future Me's contracted hero loop. | Explicit product-owner amendment to `PRODUCT.md`, supported by user/problem evidence. | **REJECT** the forecast-first product thesis; **CONFIRM** forecasting only as supporting evidence when useful. |
| P0-03 | Blocker | `FUTURE_ME_DECISION_INTELLIGENCE_RESEARCH.md` frontmatter and headings, lines 3-5 and 8-203 | The document says it is the required **18-section** contract and contains only sections 1-18. The requested report has 21 sections; no authoritative source in scope defines the missing three headings. | Structural compliance cannot be asserted, and inventing three headings would fabricate the user's reporting contract. | The canonical 21-section outline or an explicit mapping approved by the report owner. | **UNCERTAIN**; do not call the 18-section document complete. |
| P0-04 | Blocker | `USER_FLOWS.md` §1, lines 19-39; repository check: no `docs/DECISION_POLICY.md` found | User flows reserve scoring, confidence, forecasting, JITAI, recommendation, weighting, and behavior policy for `DECISION_POLICY.md`, but that contract is absent. The research synthesis silently fills the vacuum. | Research recommendations can be mistaken for authoritative behavior, causing incompatible UI and backend assumptions. | A bounded decision-policy contract or explicit owner decision that the report itself will serve that role. | **UNCERTAIN**; **REJECT** claims that the policy is already closed. |
| P0-05 | Critical | `FUTURE_ME_DECISION_INTELLIGENCE_RESEARCH.md` §§1, 3-4, 17 and citation set, lines 14, 31, 37, 44, 47, 49, 95, 167 and 203-222; detailed audit in §3 below | Multiple anchors resolve to unrelated or differently authored papers. | The report's evidence chain cannot be trusted until mechanical and semantic citation checks pass. | Correct URLs, bibliographic metadata, and a claim-to-source support check. | **REJECT** current citation closure; individual claims remain **UNCERTAIN**. |
| P1-01 | High | `DOMAIN_CONTRACT.md` §2, lines 25-69; `FUTURE_ME_DECISION_INTELLIGENCE_RESEARCH.md` §2, lines 16-22 | The domain contract defines eight primary objects. The synthesis declares a final chain of separately versioned objects that adds `Evidence Claim` and `Choice` and omits `PersonalContext` as a named chain object. | Storage, APIs, UI, and event semantics will diverge if the object model is not mapped explicitly. | A compatibility mapping showing whether the additions are subobjects, events, or approved new primary objects. | **MODIFY**; do not treat the nine-stage chain as final. |
| P1-02 | High | `DOMAIN_CONTRACT.md` §§3-4, lines 112-153 and 157-205; `FUTURE_ME_DECISION_INTELLIGENCE_RESEARCH.md` §5, lines 53-57 | The contract separates provenance source types from `PersonalState` values. The synthesis creates claim statuses (`CONFIRMED`, `OBSERVED`, `INFERRED`, `PREDICTED`, `CONFLICTED`, `UNKNOWN`) without mapping them to either concept. | Conflating evidence type, confidence, conflict, and user state creates ambiguous transitions and inconsistent UI labels. | A state/field mapping with allowed transitions and examples covering correction and conflict. | **MODIFY**. |
| P1-03 | High | `FUTURE_ME_DECISION_INTELLIGENCE_RESEARCH.md` lines 30, 55, 116, 136 and 195 | The report requires an immutable/append-only ledger while also requiring deletion and retention controls, but it gives no erasure, tombstone, derived-data, backup, or replay semantics. | Personal data cannot simultaneously be retained immutably and deleted without a defined boundary. | Retention policy, deletion threat model, backup policy, and tests defining what is physically removed versus auditable metadata retained. | **UNCERTAIN**; **REJECT** “immutable” as an unqualified requirement. |
| P1-04 | High | `DOMAIN_CONTRACT.md` §§3, 5-6 and 12, lines 112-121, 253-261, 266-305 and 570-600; `FUTURE_ME_DECISION_INTELLIGENCE_RESEARCH.md` lines 30-32 and 55 | The synthesis mandates valid-time and transaction-time on every claim and forecast. The contract only requires/encourages simpler provenance, observation timestamps, forecast generation time, and freshness semantics. | This is a material model and migration burden not justified for the demo. | Demonstrated temporal query that cannot be supported by the contracted fields, plus cost estimate. | **MODIFY**; preserve the semantic distinction, but do not mandate a bitemporal engine or every-record schema in the MVP. |
| P1-05 | High | `MVP_SCOPE_UPDATED.md` §§5.3 and 8, lines 527-542 and 684-735; `FUTURE_ME_DECISION_INTELLIGENCE_RESEARCH.md` §§10-11 and §14, lines 83-95 and 128 | The contract defers a full JITAI and allows simple rules. The synthesis introduces explicit VOI calculation, privacy/interruption costs, candidate answer modeling, prompt budgets, deduplication, cooldowns, and exposure/outcome recording within the MVP. | This is a policy engine and instrumentation program, not the simplest replaceable behavior required by the contract. | Evidence that a deterministic “important + decision-changing + acceptable interruption” rule fails the demo, and an estimate for the added policy/data work. | **REJECT** calculated VOI/JITAI for five days; **CONFIRM** no-op, skip/dismiss, and simple bounded rules. |
| P1-06 | High | `FUTURE_ME_DECISION_INTELLIGENCE_RESEARCH.md` §7 and §14, lines 65-69 and 124-130; `DOMAIN_CONTRACT.md` §16, lines 799-817 | A dependency DAG with typed edges, propagation, invalidation, and widening uncertainty is introduced even though the domain contract deliberately does not define model architecture or final classification rules. | It adds a second reasoning subsystem and new failure states before the hero path is proven. | One contracted hero scenario that requires multi-hop propagation rather than direct context comparison, with acceptance tests and estimate. | **REJECT** as a five-day requirement; **UNCERTAIN** for later evolution. |
| P1-07 | High | `FUTURE_ME_DECISION_INTELLIGENCE_RESEARCH.md` §14, lines 122-130 | Each day contains several independent systems and cross-cutting concerns; no staffing, existing-code reuse, estimates, or dependency ordering is supplied. | The schedule is presented as executable despite no feasibility evidence. | Repository-level spike, owner count, estimates, dependency graph, and explicit cuts. | **REJECT** the current five-day schedule as unsupported closure. |
| P1-08 | High | `FUTURE_ME_DECISION_INTELLIGENCE_RESEARCH.md` §§12, 16-18, lines 101-103, 142-154, 158-201 | Calibration, backtests, release gates, and shadow mode are prescribed before the target, labels, dataset, minimum sample, and thresholds exist. | Scores computed on seeded/demo data can create false scientific legitimacy without validating real-user forecasting. | Operational target, label protocol, sample-size rationale, temporal split, baseline, predeclared thresholds, and actual observations. | **REJECT** as MVP release gates; **MODIFY** into later evaluation requirements. |
| P1-09 | High | `deep-research-report(3).md` lines 620-647; `FUTURE_ME_DECISION_INTELLIGENCE_RESEARCH.md` lines 34, 61 and 149-150 | The source report proposes logistic, quantile, and dynamic state models in parallel; the synthesis drops the state-space model but still assumes multiple trained models fit a five-day MVP with sparse personal data. | There may be no trainable per-user dataset, and seeded data cannot establish predictive utility or calibration. | Available row counts, label prevalence/quality, cold-start plan, training/evaluation runtime, and baseline comparison. | **REJECT** model training as required MVP work; **UNCERTAIN** as a later experiment. |
| P1-10 | High | `FUTURE_ME_DECISION_INTELLIGENCE_RESEARCH.md` §18, lines 173-201 | The internal consistency table says “Pass” while the first decision slice, forecast target, retention/deletion, prompt budget, LLM boundary, release gate, and production investment are explicitly unresolved. | A checklist of cross-references is not evidence that semantics, feasibility, or contract alignment pass. | Resolution evidence for PO-01 through PO-07 and adversarial examples against each claimed pass. | **REJECT** the pass labels; **MODIFY** them to open checks. |
| P1-11 | High | `FUTURE_ME_DECISION_INTELLIGENCE_RESEARCH.md` lines 3, 16, 26 and 171-201 | “Implementation decision brief,” “Final Decision Ecosystem,” and “Mechanism Decision Table” imply closure before owner decisions are made. | Downstream teams may implement provisional research as approved design. | Signed decision record or status language that distinguishes proposal, accepted decision, and open question. | **MODIFY** status and headings. |
| P1-12 | High | `MVP_SCOPE_UPDATED.md` §7, lines 654-677; `USER_FLOWS.md` §25, lines 1144-1183; `FUTURE_ME_DECISION_INTELLIGENCE_RESEARCH.md` lines 12, 35, 132 and 138 | The scope gives `DecisionEngine: LLM + retrieved context` as an MVP example, while user flows prohibit the Context Analyst from defining recommendation policy, and the synthesis limits LLMs to normalization/explanation. The exact decision-reasoning role remains unresolved. | The boundary affects prompts, deterministic checks, provenance, testing, and demo quality. | Explicit role contract: permitted inputs/outputs, authority, validation, failure fallback, and which component owns recommendation policy. | **UNCERTAIN**; the synthesis's bounded role is safer but not yet an authoritative closure. |
| P2-01 | Medium | `FUTURE_ME_DECISION_INTELLIGENCE_RESEARCH.md` §16, lines 142-154 | Confidence labels (“High,” “Medium-high,” etc.) have no rubric, assessor, source-coverage measure, or uncertainty calculation. | The labels look calibrated but are subjective. | Published confidence rubric and per-claim evidence assessment. | **MODIFY** to qualitative “supported / partially supported / hypothesis / unknown,” or supply a rubric. |
| P2-02 | Medium | `FUTURE_ME_DECISION_INTELLIGENCE_RESEARCH.md` line 145 | “Scalar trust is inadequate” is marked High confidence, but the cited URL elsewhere is a truth-discovery paper and no product-specific comparison is shown. | Multidimensional trust may be useful, but “inadequate” is stronger than the evidence. | Failure cases showing a scalar cannot support contracted decisions, plus usability/implementation evidence for the vector. | **MODIFY** to a design hypothesis. |
| P2-03 | Medium | `FUTURE_ME_DECISION_INTELLIGENCE_RESEARCH.md` lines 144 and 146 | “Append-only history improves auditability” and “valid-time and transaction-time are necessary” move from standards/design concepts to product-effect and necessity claims. | Standards establish representational mechanisms, not that this full implementation is necessary for this MVP. | Traceability acceptance tests and simpler-alternative comparison. | **MODIFY**. |
| P2-04 | Medium | `FUTURE_ME_DECISION_INTELLIGENCE_RESEARCH.md` lines 148-151 | VOI reducing questions, simple models fitting five days, production state-space usefulness, and scenario feasibility are assigned medium or medium-high confidence without Future Me data or implementation evidence. | These are hypotheses presented as planning facts. | Prototype measurements, label/data audit, and user interruption study. | **UNCERTAIN**. |

## 3. Source and citation audit

### 3.1 Mechanical failures

| Severity | Location | Finding | Why it matters | Evidence needed | Disposition |
|---|---|---|---|---|---|
| Blocker | `deep-research-report(3).md` lines 1-941 | The file contains 63 opaque `citeturn…` markers and zero portable Markdown links. The source map at lines 889-941 repeats those opaque markers rather than resolvable citations. | A reader cannot reproduce or verify the research outside the original browsing session. | Exported bibliography with stable URL/DOI, author, title, year, and claim mapping. | **REJECT** as a citable evidence artifact; retain only as a lead list. |
| High | `FUTURE_ME_DECISION_INTELLIGENCE_RESEARCH.md` lines 203-222 | The “Primary citation set” is a flat list. Several entries are not cited inline, while repeated links do not specify which sentence they support. | A bibliography is not a claim-evidence map. | Inline source binding or a claim/source matrix with support and limitations. | **MODIFY**. |
| High | `RECOVERED_SUBAGENT_EVIDENCE.md` lines 1-1008 | This is recovered agent output, not a normalized research artifact; task metadata, JSON fragments, recommendations, and source lists are mixed together. | Provenance exists, but readers cannot distinguish extracted source claims from agent inference without manual reconstruction. | Normalize each source into citation, claim supported, limitation, and inference fields. | **MODIFY**; evidence leads remain useful. |

### 3.2 Confirmed identity and attribution mismatches

| Severity | Report location | Label/claim in current report | URL actually resolves to | Why it matters | Evidence needed | Disposition |
|---|---|---|---|---|---|---|
| Critical | Lines 14, 31 and 207 | “Kifer & Li” / “Probabilistic databases” | Yin, Han & Yu, *Truth Discovery with Multiple Conflicting Information Providers on the Web*, DOI `10.1109/TKDE.2007.190745`; correctly identified in recovered evidence lines 112-114 and 266-267. | Author, topic, and claimed support are wrong. It does not establish the stated probabilistic-database rationale. | Correct Kifer/Li source or rewrite the claim around truth discovery with its actual limitations. | **REJECT** citation as used. |
| Critical | Lines 49, 89 and 208 | “Lindley, information for decisions” as support for VOI | Dawid & Skene, *Maximum Likelihood Estimation of Observer Error-Rates Using the EM Algorithm*, DOI `10.2307/2346806`; correctly identified in recovered evidence lines 140-142 and 269-271. | The cited paper is unrelated to the VOI formula. | Correct Lindley/VOI primary source and semantic verification. | **REJECT** citation as used. |
| Critical | Lines 47, 167 and 212 | “Angelopoulos & Bates” / conformal prediction | arXiv `0710.3742`, Adams & MacKay, *Bayesian Online Changepoint Detection*; recovered evidence lines 347-349 also identify the actual paper. | The link does not support conformal coverage or exchangeability claims. | Correct conformal source, likely with explicit drift/exchangeability limitations. | **REJECT** citation as used. |
| High | Line 44 | “Fagin et al.” | A. P. Dempster, *Upper and Lower Probabilities Induced by a Multivalued Mapping*, DOI `10.1214/aoms/1177698950`; recovered evidence lines 168-170. | Attribution is wrong, and the leap from belief-function theory to “no single truth probability” for this product is not demonstrated. | Correct attribution and a narrower transfer argument. | **MODIFY**. |
| High | Lines 37, 95 and 216 | “Klasnja et al.” / “JITAI micro-randomized trials” | DOI `10.1007/s12160-016-9830-8`, Nahum-Shani et al., *Just-in-Time Adaptive Interventions in Mobile Health: Key Components and Design Principles*. Recovered evidence lists actual MRT sources at lines 878-890. | JITAI design principles and MRT experimental evidence are different claims. | Cite the actual MRT paper for experimental-effect claims and the design paper for components. | **MODIFY**. |
| High | Line 213 | “Calibration in modern neural networks” | The linked NeurIPS 2019 paper is *Conformalized Quantile Regression*. | The title and subject are wrong; the entry cannot support neural-network calibration. | Correct Guo et al. citation or relabel the linked paper accurately. | **REJECT** citation label. |
| High | Line 222 | “Adaptive data systems” | DOI `10.14778/3157794.3157797`, Ratner et al., *Snorkel*. | The label hides the actual weak-supervision topic and is not bound to an inline claim. | Relabel as Snorkel and state the limited transfer from weak supervision to Future Me. | **MODIFY**. |
| Medium | Lines 14, 32 and 206 | “EDC” / “Event-driven consistency” | The recovered evidence identifies the linked `EDC.pdf` as Snodgrass & Ahn, *Temporal Databases* (lines 89-91 and 281-283). | The source may support valid/transaction-time concepts, but the title and “event-driven consistency” characterization are unreliable. | Verify the PDF title/content and cite the specific temporal concept used. | **MODIFY**. |

### 3.3 Forecast-claim support check

| Severity | Location | Claim | Audit | Evidence needed | Disposition |
|---|---|---|---|---|---|
| High | Current research lines 34 and 61 | Sparse per-user history favors baseline/logistic/quantile models, with Kalman as production support. | Kalman's paper establishes linear recursive filtering; it does not compare these model families for sparse personal data or prove product fit. | Future Me dataset audit and comparative baseline experiment. | **UNCERTAIN**. |
| High | Current research lines 61-63 | `usable_focus_minutes` and `P(required_minutes)` should be the MVP forecast. | The same report later calls the target unresolved (line 162). The contracts do not select it, and no label definition exists. | Observable label definition, measurement error analysis, and owner selection. | **REJECT** as a settled target; **UNCERTAIN** as a candidate. |
| High | Current research lines 101-103 and 164 | Calibration metrics should gate release. | Proper scores are appropriate after a real target and forecast sample exist; the report provides no minimum sample, threshold, baseline, or real-user data. | Predeclared evaluation protocol and sufficient prospective data. | **MODIFY** to a later model-release requirement, not MVP completion. |
| High | Current research lines 149-151 | Simple models fit five days; state-space is useful later; scenario simulation is feasible. | These are planning/feasibility claims without estimates or implementation evidence. | Spikes, estimates, data inventory, and baseline results. | **UNCERTAIN**. |
| High | Source report lines 23-25 and 620-647 | Dynamic state-space, logistic, and quantile models are proposed as the MVP foundation. | This conflicts with the MVP contract's optional forecast and with the current synthesis's own rejection of state-space for five days (lines 160-162). | None unless the MVP contract is amended and data prerequisites are met. | **REJECT** for the current MVP. |
| Medium | Source report lines 787-802 | Ask at probability 0.35-0.65, cap at 1-2 questions/day, and weaken language when an 80% interval spans half the window. | The report labels these as heuristics, but they are not research results and should not be copied into a contract. | User burden data, decision-loss function, and threshold tuning. | **UNCERTAIN**; keep out of authoritative rules. |
| High | Source report lines 879-887 | The strongest MVP output gives a personalized 3.5-5.5-hour calibrated estimate from recent patterns. | A five-day seeded demo is unlikely to have the longitudinal labels required to justify that output. | Real history, prospective labels, calibration evidence, and an abstention path. | **REJECT** as a five-day acceptance example. |

## 4. Five-day MVP overbuild audit

The following does not define a replacement architecture; it identifies where the proposed plan exceeds the contracted proof.

| Day/proposal | Location | Overbuild or missing prerequisite | Contract-aligned disposition |
|---|---|---|---|
| Day 1: append-only ledger + provenance + valid-time + transaction-time + access scope | Current research line 122 | Five distinct data-governance concerns are treated as one day's work; deletion semantics are unresolved. | **MODIFY** to only the minimum provenance/freshness behavior needed by D3 and the hero flow. |
| Day 2: retrieval + expiry + conflicts + dependency propagation + evidence panel | Lines 124 and 67-69 | Dependency propagation and a new evidence UI are not required to prove context-driven reasoning. | **MODIFY**; preserve visible provenance/conflict, defer general DAG machinery. |
| Day 3: baselines + logistic + quantile + feasibility + calibration + replay | Lines 126 and 61-63 | Requires a fixed target, labels, sufficient data, model code, evaluation, storage, and UI; none are closed. | **REJECT** as required five-day scope. |
| Day 4: decision reasoning + computed VOI + tri-state policy + cooldown + budget + choice capture | Lines 128 and 83-95 | Bundles core decision support with a full acquisition/intervention policy. | **MODIFY** to contracted trade-offs, recommendation, uncertainty, user choice, and simple replaceable ask/no-op rules. |
| Day 5: seeded data + rolling backtests + shadow mode + contradiction/deletion tests + seam documentation | Line 130 | Rolling backtests and shadow mode are not meaningful without prospective real data; deletion is not a one-day add-on to an immutable ledger. | **MODIFY** to demo-path verification and explicit limitations; move empirical model validation out of MVP DoD. |
| Parallel three-model prototype | Source report lines 620-647 | No data or staffing evidence; includes a state-space model the synthesis later rejects. | **REJECT**. |
| Final probabilistic-state architecture | Source report lines 838-874 | Presented as the model hierarchy to build before the product thesis is validated. | **REJECT** as MVP architecture; retain only as a research hypothesis. |

## 5. Unsupported closure

| Severity | Location | Closure asserted | Why unsupported | Evidence needed | Disposition |
|---|---|---|---|---|---|
| High | Current research line 16 | “Final Decision Ecosystem” | Domain compatibility and owner decisions are still open. | Approved domain mapping. | **MODIFY** to “candidate ecosystem.” |
| High | Lines 28-37 | Mechanisms marked **Use** or **Bound** | Several are optional, deferred, or absent from contracts; citations are partly invalid. | Contract decision plus corrected evidence for each row. | **MODIFY/UNCERTAIN**. |
| High | Lines 142-154 | High/medium confidence map | No assessment method or product evidence. | Confidence rubric and product-specific validation. | **REJECT** current labels. |
| High | Lines 173-189 | Internal checks marked “Pass” | Cross-references show consistency of wording, not correctness, completeness, or feasibility. | Testable criteria and adversarial examples. | **MODIFY** to “appears aligned / still unverified.” |
| High | Lines 193-201 | Seven owner decisions have default recommendations and a global seeded/shadow/abstain gate | The contracts require a working contextual recommendation and do not establish this global gate. | Owner approval and revised MVP acceptance criteria. | **REJECT** the global gate; retain the items as open decisions. |
| Medium | Lines 144-153 | Standards/literature are used as product-effect evidence | The cited work supports mechanisms or cautions, not observed Future Me outcomes. | Product experiments or narrower wording. | **MODIFY**. |

## 6. Missing decisions for the required 21-section report

No source in scope supplies the canonical 21-section outline. Therefore the exact three headings missing from the 18-section synthesis are **UNKNOWN**. The following are unresolved decision slots that the 21-section report must cover or explicitly map; they are not a proposed final architecture.

| # | Required decision slot | Current gap / required closure | Status |
|---|---|---|---|
| 1 | Report contract and section mapping | Supply the authoritative 21-section outline and map every section to source evidence and owner. | **UNCERTAIN** |
| 2 | Authority and change control | State which document wins when PRODUCT, MVP, DOMAIN, USER_FLOWS, and research disagree, and how amendments are approved. | **MODIFY** |
| 3 | Product thesis | Reaffirm context-aware decision support versus formally changing to probabilistic capacity forecasting. | **REJECT** forecast-first default |
| 4 | Exact hero decision slice | PO-01 is open; select the one decision, options, context change, and expected different reasoning. | **UNCERTAIN** |
| 5 | MVP forecast role | Decide optional display/supporting input versus mandatory dependency. Current contract says optional. | **CONFIRM** optional unless contract changes |
| 6 | Forecast target and horizon | Define or reject `usable_focus_minutes`; specify observable event, unit, horizon, and abstention. | **UNCERTAIN** |
| 7 | Ground-truth and label-quality policy | Define explicit, proxy, weak, missing, corrected, and late labels and how each may be used. | **UNCERTAIN** |
| 8 | Core domain-object compatibility | Map Evidence Claim and Choice to the eight authoritative objects or approve contract changes. | **UNCERTAIN** |
| 9 | Evidence/provenance minimum | Choose the minimum fields and correction semantics needed for D3 without prematurely fixing storage architecture. | **MODIFY** |
| 10 | PersonalState semantics | Reconcile FLOW/UNCERTAIN/DRIFTING/DISRUPTED/OVERLOADED with claim conflict/staleness statuses. | **UNCERTAIN** |
| 11 | Freshness and conflict behavior | Define claim-type freshness and decision-relevant conflict handling without hard-coded universal values. | **MODIFY** |
| 12 | Context retrieval contract | Define what “relevant” means for the hero decision, what must be shown, and when retrieval abstains. | **UNCERTAIN** |
| 13 | Recommendation policy | Create the missing `DECISION_POLICY.md` equivalent: inputs, trade-offs, assumptions, uncertainty, recommendation, and abstention. | **UNCERTAIN** |
| 14 | LLM authority boundary | Resolve whether the LLM reasons, only explains/normalizes, or does both under validation; specify fallback. | **UNCERTAIN** |
| 15 | Question/acquisition policy | Decide whether simple deterministic rules suffice; do not assume computed VOI without utility/cost definitions. | **MODIFY** |
| 16 | Proactive intervention boundary | Define “consequential,” cooldown/dismiss behavior, and demo-safe prompt budget; defer adaptive JITAI claims. | **UNCERTAIN** |
| 17 | Dependency/disruption scope | Decide whether the hero flow needs a general DAG or only direct, scenario-specific constraints. | **REJECT** general DAG until proven necessary |
| 18 | Privacy, retention, and deletion | Resolve immutable history versus deletion, local preprocessing, raw-data exclusions, access, backups, and consent. | **UNCERTAIN** |
| 19 | Evaluation and release evidence | Separate hero-flow acceptance from future model calibration; define metrics only after target/data are fixed. | **MODIFY** |
| 20 | Five-day delivery envelope | Supply staffing, reuse assumptions, estimates, dependencies, explicit cuts, and a demo fallback. | **UNCERTAIN** |
| 21 | Citation and research governance | Replace opaque/mismatched citations; bind claims to sources, limitations, retrieval date, and confidence rubric. | **REJECT** current closure |

## 7. Contract-aligned findings that can be retained

These conclusions survive the gap audit, subject to simple implementation rather than the proposed overbuilt mechanisms:

| Finding | Evidence | Disposition |
|---|---|---|
| User remains the decision owner; recommendation and choice stay separate. | `PRODUCT.md` lines 124-135; `DOMAIN_CONTRACT.md` lines 309-379; `USER_FLOWS.md` lines 119-125. | **CONFIRM** |
| Calendar and observations are evidence, not proof of behavior or intent. | `MVP_SCOPE_UPDATED.md` lines 119-140; `DOMAIN_CONTRACT.md` lines 209-251; `USER_FLOWS.md` lines 45-95. | **CONFIRM** |
| Unknown, conflict, correction, and silence are valid behaviors. | `DOMAIN_CONTRACT.md` lines 604-659; `USER_FLOWS.md` lines 63-137 and 918-1007. | **CONFIRM** |
| Context should carry provenance and freshness appropriate to the claim. | `MVP_SCOPE_UPDATED.md` lines 82-115; `DOMAIN_CONTRACT.md` lines 112-153 and 570-600. | **CONFIRM**, without requiring a bitemporal event store. |
| The MVP may use deterministic, heuristic, simulated, or replaceable logic. | `USER_FLOWS.md` lines 19-39 and 1350-1374; `MVP_SCOPE_UPDATED.md` lines 940-964. | **CONFIRM** |
| No-op, ask, explain trade-offs, preserve uncertainty, and record user choice/outcome are appropriate. | `MVP_SCOPE_UPDATED.md` lines 684-735 and 830-909. | **CONFIRM** |
| Advanced prediction, full JITAI, autonomous planning, surveillance, and complex multi-agent design are deferred. | `MVP_SCOPE_UPDATED.md` lines 492-595. | **CONFIRM** |

## 8. Pass A exit assessment

**Pass A result: FAIL — material gaps remain.**

The next report must not claim final architecture or closed policy until the P0 items are resolved. The safest current interpretation of the contracts is:

- prove the context-change → reasoning-change hero loop;
- keep forecast, scoring, JITAI, and behavioral inference replaceable and provisional;
- use the minimum provenance, uncertainty, correction, and outcome semantics required by the demo;
- treat probabilistic modeling and calibrated forecasting as later hypotheses unless the product owner explicitly changes MVP scope and supplies real labels/data;
- repair citations before using the research synthesis as decision evidence.
