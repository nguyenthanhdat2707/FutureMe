# Future Me — Pass A Privacy and LLM Responsibility Audit

**Status:** Pass A evidence audit only · **Date:** 2026-09-20

**Decision boundary:** This document does not select a final architecture, provider, model, cryptosystem, legal basis, or implementation. It records supported constraints, unsupported claims, open assumptions, and conditions that should block later design decisions.

## 1. Executive finding

Future Me's product contracts contain a useful trust core, but not a complete privacy contract.

The supported core is narrow and important:

- the user remains the decision owner;
- absence, silence, a calendar plan, an observation, and an inference are not truth;
- consequential inferences retain provenance and can remain unknown or conflicted;
- structured sources should use deterministic extraction when sufficient;
- the LLM Context Analyst may propose hypotheses, candidate attributes, and clarification questions, but may not confirm facts, define recommendation policy, or mutate the calendar; and
- backend validation occurs before an LLM output is persisted.

The current evidence does **not** support claims that Future Me already has purpose-bound consent, retention/deletion guarantees, selective disclosure, contextual authorization, privacy-preserving embeddings, federated privacy, on-device execution, provider non-retention/non-training guarantees, or a raw-content escalation contract. The current architecture document instead proposes centralized persistence of calendar titles and original `raw_data`, JSON observations, context snapshots, recommendations, choices, outcomes, and personal-context values. It only states that a user may access their own data. That is identity scoping, not sufficient contextual access control.

The resulting Pass A position is:

1. Raw ambient or third-party content has no supported reason to leave the user's trust boundary by default.
2. Central persistence can be considered for the minimum structured claims and service state needed for the contracted core loop, but only after purpose, retention, correction, deletion, access, and provider-use rules are made explicit.
3. The LLM should receive a compact, decision-scoped evidence bundle, not a personal archive or raw connector payload.
4. Raw-content disclosure to an LLM requires a separate, explicit, task-specific escalation when a bounded semantic task cannot be completed from structured claims.
5. Embeddings and federated updates are transformed sensitive data, not automatic anonymization. Neither is required by the current MVP contract.
6. LLM fluency, schema validity, self-reported confidence, retrieval, and human presence do not establish truth or transfer responsibility. Deterministic policy and accountable product owners remain responsible for access, state transitions, consequential actions, and release thresholds.

## 2. Evidence method and hierarchy

### 2.1 Repository evidence

The audit treats the repository in this order:

1. Frozen product and interaction contracts: [PRODUCT.md](../../PRODUCT.md), [USER_FLOWS.md](../../USER_FLOWS.md), and [DOMAIN_CONTRACT.md](../../DOMAIN_CONTRACT.md).
2. MVP scope and current technical evidence: [MVP_SCOPE_UPDATED.md](../../MVP_SCOPE_UPDATED.md) and [ARCHITECTURE.md](../../ARCHITECTURE.md).
3. Recovered research evidence: [RECOVERED_SUBAGENT_EVIDENCE.md](../RECOVERED_SUBAGENT_EVIDENCE.md). Its citations and mechanisms are leads; claims were not accepted until checked against a primary source.
4. The prior deep report, [FUTURE_ME_DECISION_INTELLIGENCE_RESEARCH.md](../FUTURE_ME_DECISION_INTELLIGENCE_RESEARCH.md), is a **hypothesis and decision brief only**. It is not a product contract, privacy guarantee, architecture approval, or implementation fact.

Repository absence is recorded as non-support, not proof that an implementation lacks a control. This Pass A reviewed the product contracts and documented architecture; it did not certify deployed behavior.

### 2.2 External evidence

Preference was given to stable NIST publications, W3C Recommendations, and peer-reviewed primary research. NIST frameworks are voluntary risk-management guidance, not legal compliance determinations. W3C Verifiable Credentials guidance transfers at the level of minimization and disclosure boundaries; Future Me is not thereby required to become a credential system.

### 2.3 Ratings

- **Contract support — Supported:** directly required by a current product/domain/interaction contract.
- **Contract support — Partial:** compatible fragments exist, but the complete claim is not contracted.
- **Contract support — Not supported:** no current contract establishes the claim, or current evidence contradicts it.
- **Transfer confidence — High:** evidence and Future Me's use are closely aligned.
- **Transfer confidence — Medium:** the mechanism transfers, but the population, task, model, or threat assumptions differ.
- **Transfer confidence — Low:** useful warning or research lead only; not a design requirement without further evidence.

## 3. Confirmed repository baseline

| Repository fact | Status | Privacy/LLM significance |
|---|---|---|
| Recommendation is distinct from user choice; the user remains decision owner. | Confirmed | Supports an advisory boundary, but does not by itself prevent automation bias or transfer system-owner responsibility. |
| User silence is not confirmation; unknown is valid. | Confirmed | Consent and factual confirmation cannot be inferred from inactivity. |
| Calendar entries are plans, not observed behavior. | Confirmed | Raw calendar data and derived state must remain distinct. |
| Personal context includes goals, commitments, calendar events, deadlines, workload, preferences, decisions, outcomes, relationships, and energy/focus patterns. | Confirmed | The product handles a longitudinal, highly linkable personal profile even if individual fields are not conventionally classified as sensitive. |
| Important context carries source, confidence, observation time, validity, and expiry; user-confirmed and system-inferred claims are not equivalent. | Confirmed | Provenance and status can support minimization and access decisions, but provenance does not prove truth. |
| Structured data should use deterministic extraction when sufficient. | Confirmed | Supports local or non-LLM preprocessing and reduces unnecessary disclosure. It does not specify where that processing runs. |
| The LLM Context Analyst consumes evidence plus current context and emits hypotheses, candidate attributes, and questions; backend validates before persistence. | Confirmed | Supports a narrow semantic role. Validation of shape does not validate factual truth. |
| The LLM may not convert an inference into fact, silently overwrite confirmed information, execute calendar changes, or define recommendation/JITAI policy. | Confirmed | Strong responsibility boundary. It should be treated as a release invariant. |
| Calendar disconnect is required, but a complete privacy/data-management center is not. | Confirmed | Disconnect is not equivalent to revocation, deletion, derived-data deletion, or provider-side deletion. |
| Current documented schema stores calendar title and original `raw_data`, JSON observations, JSON personal-context values, decision questions and context snapshots, recommendations, choices, outcomes, and feedback. | Confirmed architecture evidence, not frozen domain semantics | This is counter-evidence to any claim that the documented MVP already minimizes raw content. |
| Authorization is documented only as “user can only access their own data.” | Confirmed architecture evidence | This is necessary tenant isolation, but it does not bind access to purpose, data sensitivity, action, model, provider, time, or decision context. |
| LLM provider can be swapped among Bedrock, OpenAI, and a local model. | Confirmed replaceability goal | Provider interchangeability does not make privacy properties interchangeable. Provider retention, training, geography, logging, subprocessors, and deletion must be evaluated per deployment. |

## 4. Unsupported privacy claims and release-blocking unknowns

The following statements must not be made about Future Me on current evidence:

- “Raw personal data stays on device.”
- “Only anonymized data is centralized.”
- “Embeddings cannot reveal the source text.”
- “Federated learning keeps user data private.”
- “Disconnecting Calendar deletes imported or derived data.”
- “Deleting a source deletes all copies, prompts, logs, embeddings, backups, and derived claims.”
- “The LLM provider does not retain or train on personal data.”
- “Only the user can access the data” when services, administrators, model providers, telemetry, backups, and support workflows have not been scoped.
- “The LLM is calibrated” or a displayed numeric confidence is a probability of correctness.
- “Human in the loop makes the recommendation safe.”
- “Selective disclosure is implemented.”
- “Future Me complies with privacy law.” This audit is not a jurisdiction-specific legal assessment.

Open decisions that block those claims include:

- purpose and lawful/authorized basis per source and processing step;
- field-level collection, retention, correction, export, deletion, and derived-data revocation;
- treatment of third-party information in calendars and user-entered narratives;
- connector scope and whether descriptions, attendees, locations, attachments, conference links, or original payloads are necessary;
- provider data-use, retention, training, regional processing, subprocessors, abuse monitoring, and deletion terms;
- whether prompts, completions, retrieval traces, and failure logs are persisted;
- whether embeddings exist, where they are generated/stored, and how they are deleted or re-derived;
- which actions are read-only, advisory, confirm-before-write, or prohibited; and
- what evaluation makes a confidence value, abstention rule, or automatic workflow admissible.

## 5. Data disposition constraints — not a final architecture

This section identifies privacy constraints for later design. “Local” means within a user-controlled or explicitly trusted local boundary. “Central” means any shared backend, hosted store, model provider, observability system, or support-accessible service. A transfer for transient inference still counts as disclosure even when nothing is intentionally persisted.

### 5.1 Should stay local or remain uncollected by default

| Data/content | Pass A disposition | Basis and caveat |
|---|---|---|
| Screen content, screenshots, keystrokes, browser history, continuous active-window telemetry, location trails, email bodies, files, and document bodies | **Remain uncollected for the current MVP; local preprocessing only if a later, separately approved feature needs them.** | Continuous screen surveillance is deferred; the recovered report's “do not collect” list is a hypothesis consistent with minimization, not an implemented guarantee. These sources are broad, incidental, and likely to contain third-party data. |
| Raw free-form notes and observations beyond the exact text the user intentionally submits for a current task | **Stay local by default.** | Prefer locally derived, typed claims. Escalate a selected excerpt only when the semantic task cannot be satisfied otherwise. |
| Full calendar descriptions, attendee lists, locations, conferencing URLs, attachments, and provider `raw_data` | **Stay local or at the connector boundary unless a field is demonstrably necessary.** | Current schema's original `raw_data` field is counter-evidence. Time intervals and status may be necessary; entire payloads are not thereby justified. Third-party attendee data increases disclosure risk. |
| Authentication secrets, OAuth refresh tokens, API keys, and recovery material | **Never enter prompts, embeddings, analytics, or general evidence stores.** | Their placement depends on the later integration design; Pass A does not claim they must be physically on-device. |
| Raw source text used only to create a deterministic category, count, time range, or redacted claim | **Process at the earliest trusted boundary and discard according to a declared rule.** | NIST's Privacy Framework supports processing that limits observability/linkability and selective collection; it does not prove a particular implementation is safe. |
| Embeddings of raw personal or third-party text | **Do not centralize by default; do not create for the current MVP without a demonstrated retrieval need.** | An embedding is not de-identified merely because it is not human-readable. See Claim CR-05. |

### 5.2 May be considered for central processing or persistence

Centralization is not approved merely because an item appears below. It may be justified only when the minimum fields are necessary for a contracted function and the missing lifecycle controls are resolved.

| Data/content | Potentially justified minimum | Exclusions |
|---|---|---|
| Account and connector state | User/account identifier, connector status, minimum sync cursor or opaque external reference, authorization scope metadata | No secret in analytics or LLM context; no silent expansion of connector scope |
| Calendar-derived schedule evidence | Start/end interval, busy/free status, cancellation/change state, coarse user-approved category, provenance pointer, freshness | No original payload, attendee identity, description, location, or title by default |
| Personal context | User-confirmed or clearly labeled inferred claims needed for the core loop, with source, validity, freshness, sensitivity, and purpose | No inferred claim serialized as confirmed fact; no unrelated life archive |
| Decision support state | Current user question, options, minimum relevant claims, conflicts, assumptions, user choice, and outcome when the user elects to record it | No full historical context snapshot merely for convenience; no unrelated raw source text |
| Operational/audit metadata | Event type, policy/model version, allow/deny result, error class, latency, and minimal correlation identifier | No default prompt/completion body logging; no stable cross-purpose identifier when a scoped identifier works |
| Aggregate learning signal | Explicitly defined, purpose-limited aggregate or feedback with a retention rule | No default reuse of personal context, prompts, outcomes, embeddings, or gradients for model training |

### 5.3 What the LLM may receive without raw-content escalation

The supported default is a **decision-scoped evidence bundle**, assembled by deterministic policy:

- the user's current, intentionally submitted question;
- the minimum option set needed for the task;
- only relevant structured claims, each carrying status such as confirmed/inferred/unknown/conflicted, source class, validity/freshness, and a scoped reference;
- bounded summaries or aggregates such as available-time range or workload band when the raw source is unnecessary;
- explicit assumptions and unresolved unknowns;
- the allowed output schema and responsibility boundary; and
- no tools or only capability-scoped read operations authorized outside the model.

The LLM should not receive by default:

- full calendar payloads or an unrestricted history window;
- unrelated goals, relationships, health/energy notes, past decisions, or outcomes;
- OAuth tokens, secrets, stable connector identifiers, or hidden policy text;
- attendee identities or third-party text unless necessary and explicitly disclosed;
- embeddings as a substitute for access control;
- raw telemetry, browser/screen/email/file contents;
- material from a source that is outside the current purpose or retention window; or
- authority to decide what it is allowed to retrieve.

### 5.4 Raw-content escalation gate

Explicit escalation is required before any raw or substantially reversible content is sent beyond its existing trust boundary when the content is not already the user's intentional current input. This includes:

- calendar title, description, attendee, location, attachment, or conferencing data;
- a verbatim excerpt from a note, file, email, message, browser page, screenshot, or observation;
- a longer historical timeline or complete decision/context snapshot;
- third-party personal data;
- an embedding generated from raw personal text when the destination can retain or query it; and
- prompt/completion storage for debugging, evaluation, fine-tuning, or model improvement.

The escalation cannot be inferred from OAuth connection, prior blanket consent, silence, or use of the product. Before disclosure, the user needs a concrete statement of:

1. the selected content or field classes;
2. the current purpose and expected benefit;
3. the recipient boundary, including an external model provider when applicable;
4. whether the content or output will be stored, logged, reused, or used for training, and for how long;
5. whether third-party data is present;
6. the one-time or persistent scope of permission; and
7. the reduced-functionality path if the user declines.

Escalation is justified only when deterministic extraction, a structured claim, a user-authored summary, or a smaller excerpt cannot perform the task. Approval for one item and purpose does not authorize unrelated history, future items, training reuse, or new recipients.

## 6. Contextual access control and selective disclosure

### 6.1 Current support

Current architecture evidence supports owner scoping: a user can access only their own data. It does not define access for backend jobs, connector workers, model providers, observability, support staff, or future collaborators. It does not bind access to purpose or distinguish read, derive, disclose, embed, train, export, correct, or delete operations.

NIST SP 800-162 defines ABAC decisions over attributes of the subject, object, requested operation, and sometimes environment conditions. For Future Me, this supports a later requirement that authorization be evaluated from at least:

- **subject:** user, service, connector, model/provider, support role;
- **object:** field/claim, source, user ownership, sensitivity, third-party presence, confirmation status;
- **operation:** read, derive, disclose to model, persist, log, train, export, correct, delete, mutate external service;
- **purpose:** the current user-visible decision or maintenance task;
- **environment:** session, time, connector state, raw-escalation grant, provider, and policy/model version.

This is a requirement boundary, not a selected ABAC product. The policy decision must remain outside the LLM. An LLM cannot grant itself broader retrieval because a prompt says the data would be useful.

### 6.2 Selective disclosure

W3C's Verifiable Credentials Data Model recommends requesting and receiving the absolute minimum information needed for a transaction and warns that signatures and metadata can enable correlation. The principle transfers strongly: Future Me should project only the claim fields needed for the current recipient and purpose.

The specific credential ecosystem transfers weakly. Future Me has not established issuer/holder/verifier roles, a need for verifiable presentations, or a requirement for BBS proofs. Cryptographic selective-disclosure mechanisms do not replace purpose enforcement, recipient policy, storage limits, or control of prompt/log copies. Even unlinkable proofs can remain linkable through revealed attributes and surrounding metadata.

## 7. Structured claim records

### CR-01 — Local preprocessing reduces disclosure but is not a complete privacy guarantee

- **Claim:** Raw, broad, or incidental sources should be reduced at the earliest trusted boundary into the smallest structured claims that satisfy the current purpose.
- **Contract support:** **Partial.** USER_FLOWS requires deterministic extraction for structured data when sufficient. It does not require on-device execution or define raw-data deletion.
- **External support:** NIST Privacy Framework v1.0 includes disassociated processing outcomes that limit observability/linkability, identification, and behavioral inference, and enable selective collection/disclosure ([NIST Privacy Framework v1.0](https://doi.org/10.6028/NIST.CSWP.01162020)).
- **Assumptions:** A bounded local or connector-side transform can produce a useful claim without retaining the source; the client boundary is itself adequately protected.
- **Counter-evidence:** The current architecture schema centralizes calendar title and original `raw_data`. Local processing can still leak through telemetry, crashes, backups, derived identifiers, or later uploads.
- **Limitations:** Minimization can reduce functionality and debuggability. A structured claim may still be sensitive or identifying, especially across a longitudinal record.
- **Failure conditions:** Raw payload copied to logs/backups; transform outputs preserve verbatim content; stable identifiers link purposes; discarded raw content can be reconstructed from a derived representation.
- **Future-Me transfer confidence:** **High** for “minimize before disclosure”; **low** for any claim that local execution alone makes processing private.

### CR-02 — Centralize only purpose-necessary structured state

- **Claim:** Central persistence may be justified for the minimum structured state needed for persistence, synchronization, decision support, and user-requested history; it is not justified for a universal raw personal archive.
- **Contract support:** **Partial.** Persistent context, relevant retrieval, outcome history, and provenance are required. Universal personal memory and continuous screen surveillance are deferred/non-goals. Retention and deletion are unspecified.
- **External support:** NIST Privacy Framework frames data processing around organizational purpose, risk, data manageability, and minimization ([NIST Privacy Framework v1.0](https://doi.org/10.6028/NIST.CSWP.01162020)).
- **Assumptions:** Central persistence is needed for the chosen product experience; equivalent local persistence has not been evaluated in this pass.
- **Counter-evidence:** The documented schema stores broad JSON values, original calendar payloads, and full context snapshots without a documented purpose or retention field.
- **Limitations:** “Structured” does not mean low risk. Goals, relationships, energy, routines, and outcomes can reveal intimate patterns when linked over time.
- **Failure conditions:** Collection expands because storage is convenient; the same record is reused for training or analytics; deletion does not reach copies and derivations; snapshots silently accumulate unrelated history.
- **Future-Me transfer confidence:** **High** for purpose limitation; **medium** for which exact fields need central persistence, which remains a product/architecture decision.

### CR-03 — Raw-content escalation must be explicit and task-specific

- **Claim:** Sending raw connector or ambient content to a hosted model requires an item/task-specific disclosure decision; connecting a source is not sufficient consent for every inference use.
- **Contract support:** **Not supported as an existing feature.** Silence is not confirmation and Calendar can be disconnected, but no raw-content escalation or provider disclosure contract exists.
- **External support:** W3C recommends minimizing what a verifier requests and receives for a particular transaction ([VC Data Model 2.0 §8.9](https://www.w3.org/TR/vc-data-model-2.0/#the-principle-of-data-minimization)); NIST Privacy Framework supports selective collection/disclosure ([NIST Privacy Framework v1.0](https://doi.org/10.6028/NIST.CSWP.01162020)).
- **Assumptions:** Some later semantic tasks may genuinely need a raw excerpt and may use a recipient outside the primary service boundary.
- **Counter-evidence:** The current architecture stores original calendar payloads; OAuth/setup documentation is operational, not evidence of informed content disclosure.
- **Limitations:** Consent can be fatigued or coerced by degraded functionality. A preview may itself expose third-party information. This record does not determine a legal consent basis.
- **Failure conditions:** Bundled or indefinite permission; recipient or retention hidden; denial blocks unrelated functions; scope silently grows; third-party data is disclosed without assessment.
- **Future-Me transfer confidence:** **High** for separate escalation; **medium** for the exact interaction, which requires product and legal validation.

### CR-04 — Owner checks are insufficient for contextual access control

- **Claim:** “Same user” is only one authorization attribute; each access/disclosure must also be constrained by object, operation, purpose, and current environment.
- **Contract support:** **Partial.** User-only data access is documented. Purpose-, sensitivity-, operation-, model-, and provider-aware enforcement is not.
- **External support:** NIST SP 800-162 defines ABAC using subject, object, requested operation, and environment attributes evaluated against policy ([NIST SP 800-162](https://doi.org/10.6028/NIST.SP.800-162)).
- **Assumptions:** Future Me will have multiple service identities and processing contexts even if it remains a single-user-facing product.
- **Counter-evidence:** There is no current evidence of support/admin access, model-provider scope, or collaboration, so a full enterprise ABAC system may be unnecessary.
- **Limitations:** Attribute systems introduce policy complexity, stale attributes, and provenance/integrity requirements. ABAC does not determine the correct privacy policy.
- **Failure conditions:** LLM selects its own retrieval scope; support or telemetry bypasses policy; purpose attributes are user-controlled free text; cached authorization outlives revocation; raw and derived objects are governed differently without lineage.
- **Future-Me transfer confidence:** **High** for contextual policy inputs and external authorization; **medium** for an ABAC implementation.

### CR-05 — Embeddings are sensitive representations, not anonymization

- **Claim:** A text embedding can retain enough information for reconstruction or personal-data inference and must inherit the source's access, retention, and deletion constraints.
- **Contract support:** **Not supported.** No current product contract requires embeddings, vector retrieval, or an embedding privacy claim.
- **External support:** Morris et al. reconstructed 92% of tested 32-token inputs exactly with a multi-step attack against two studied embedding models and recovered full names from clinical-note embeddings ([EMNLP 2023](https://doi.org/10.18653/v1/2023.emnlp-main.765)).
- **Assumptions:** A Future Me embedding system could expose embeddings, queries, or enough text/embedding pairs to an attacker or service operator.
- **Counter-evidence:** The 92% result is not universal: it depends on studied models, short inputs, attacker knowledge, and experimental conditions. Different embeddings and controls can change risk.
- **Limitations:** This paper establishes plausible inversion, not a quantitative breach probability for a future implementation. Encryption and access control reduce exposure but do not make an authorized query surface purpose-safe.
- **Failure conditions:** Shared vector namespace; cross-user search; raw text stored beside vectors; provider retention; deletion removes source but not vector/index/cache; stable vectors enable correlation; prompt output reveals retrieved text.
- **Future-Me transfer confidence:** **High** that embeddings must not be called anonymous; **medium** for the attack rate on an unselected Future Me model.

### CR-06 — Federated/on-device learning reduces raw-data movement but does not by itself provide privacy

- **Claim:** Federated learning can keep training examples local, but model updates can leak membership, properties, or reconstructed content; on-device/federated is a data-location pattern, not a complete privacy guarantee.
- **Contract support:** **Not supported and not currently needed.** The MVP does not contract federated learning or shared-model training.
- **External support:** FedAvg was proposed to aggregate locally computed updates while leaving training data distributed on devices ([McMahan et al., AISTATS 2017](https://proceedings.mlr.press/v54/mcmahan17a.html)). Later primary research demonstrated membership and property inference from collaborative model updates ([Melis et al., IEEE S&P 2019](https://doi.org/10.1109/SP.2019.00029)). NIST SP 800-226 explains that differential privacy quantifies privacy loss but warns of implementation hazards ([NIST SP 800-226](https://doi.org/10.6028/NIST.SP.800-226)).
- **Assumptions:** Future Me might later train a shared model from user histories; client devices can perform reliable local computation and updates leave the device.
- **Counter-evidence:** Secure aggregation and differential privacy can reduce particular threats, but neither has been scoped; local clients can still be compromised, and a global model can memorize information.
- **Limitations:** FL utility depends on population size, participation, device/network resources, non-IID data, update frequency, and threat model. Differential privacy introduces an explicit utility/privacy trade-off and cumulative budget.
- **Failure conditions:** Small cohorts; per-user updates visible; malicious server/participants; repeated rounds; weak clipping/noise; metadata identifies participants; debug logs capture examples; privacy budget is absent or reset incorrectly.
- **Future-Me transfer confidence:** **High** that FL/on-device is not synonymous with privacy; **low** that Future Me presently needs federated learning.

### CR-07 — Provenance supports auditability, not truth

- **Claim:** Source, time, derivation, and responsible agent allow assessment and correction, but do not establish that a claim is accurate or authorized for a new purpose.
- **Contract support:** **Supported** for provenance; **not supported** for any stronger truth guarantee.
- **External support:** W3C PROV-DM models entities, activities, derivations, and agents so users can assess quality, reliability, or trustworthiness; it is domain-agnostic and does not adjudicate truth ([W3C PROV-DM Recommendation](https://www.w3.org/TR/2013/REC-prov-dm-20130430/)).
- **Assumptions:** Future Me preserves lineage across raw evidence, derived claims, prompts, model outputs, corrections, and outcomes.
- **Counter-evidence:** Current conceptual fields are useful but do not yet show lineage for prompt inputs, model/provider version, validation, or deletion propagation.
- **Limitations:** Detailed lineage itself can be sensitive and can create linkability. Provenance from an untrusted source remains untrusted.
- **Failure conditions:** Derived claim loses parent references; copied evidence is counted as independent corroboration; correction updates display but not downstream caches; provenance is visible to unauthorized recipients.
- **Future-Me transfer confidence:** **High.**

### CR-08 — LLM output is a hypothesis until supported by admissible evidence

- **Claim:** An LLM may normalize ambiguous input, draft an explanation, or propose a question, but it cannot mint an observation, confirm user intent, resolve conflict, grant access, or establish a cause merely by generating fluent text.
- **Contract support:** **Supported.** USER_FLOWS expressly limits the LLM Context Analyst and requires backend validation before persistence.
- **External support:** NIST identifies confabulation as a core generative-AI risk and notes that it follows from how generative models produce statistically plausible output ([NIST AI 600-1](https://doi.org/10.6028/NIST.AI.600-1)). TruthfulQA showed studied models could reproduce popular misconceptions; its best tested model was truthful on 58% of that benchmark versus 94% for humans ([ACL 2022](https://doi.org/10.18653/v1/2022.acl-long.229)).
- **Assumptions:** Future Me uses a general-purpose generative model on personal context and may encounter missing, conflicting, stale, or adversarial text.
- **Counter-evidence:** TruthfulQA evaluated older models and a deliberately adversarial knowledge benchmark, not Future Me's task or a current provider. Retrieval and constrained prompts may improve performance.
- **Limitations:** Retrieval can supply evidence but does not guarantee faithful use. JSON/schema validation establishes syntax and types, not truth, authorization, or causal validity.
- **Failure conditions:** Model output is persisted as `USER_CONFIRMED`; citations do not support the sentence; retrieved event text contains prompt injection; validator checks only schema; explanation invents a driver; model silently resolves a conflict.
- **Future-Me transfer confidence:** **High** for the responsibility boundary; **low** for transferring the benchmark percentages to Future Me.

### CR-09 — LLM hallucination detection supports abstention for a subset, not truth certification

- **Claim:** Uncertainty methods may help route or abstain on some inconsistent generations, but a low uncertainty score does not certify factual correctness.
- **Contract support:** **Partial.** Unknown and abstention-like behavior are supported, but no hallucination detector or release threshold is contracted.
- **External support:** Farquhar et al. report semantic-entropy detection of a subset of hallucinations they call confabulations; across their 30 task/model combinations, mean AUROC was 0.790, not perfect separation ([Nature 2024](https://doi.org/10.1038/s41586-024-07421-0)).
- **Assumptions:** The later model/API permits repeated sampling or another validated uncertainty signal, and Future Me has labeled examples representative of use.
- **Counter-evidence:** Consistently repeated falsehoods can have low semantic uncertainty. The method studied particular QA, math, and biography settings and adds inference cost.
- **Limitations:** AUROC is a ranking statistic, not a per-answer probability or deployment threshold. It does not cover authorization errors, stale evidence, prompt injection, harmful advice, or omitted facts.
- **Failure conditions:** Detector and generator share the same blind spot; threshold chosen without decision costs; distribution/model changes; user sees “low risk” as “true”; fallback model repeats the same unsupported claim.
- **Future-Me transfer confidence:** **Medium** as an abstention research option; **high** that it cannot certify truth.

### CR-10 — Numeric confidence is inadmissible until calibrated for a defined Future Me event

- **Claim:** A displayed confidence number is meaningful only when it refers to a defined event and empirically matches observed frequencies on representative, versioned Future Me data.
- **Contract support:** **Partial.** Contracts require a confidence field and show example values, but confidence calculation is explicitly provisional. No calibration evidence exists in the reviewed material.
- **External support:** Guo et al. define calibration as predicted probabilities representing true correctness likelihood and find modern neural classifiers can be poorly calibrated ([ICML 2017](https://proceedings.mlr.press/v70/guo17a.html)).
- **Assumptions:** Future Me can define observable labels such as “claim confirmed without correction within a window” and can collect sufficient, consented evaluation data without feedback leakage.
- **Counter-evidence:** The study concerns classification models, not free-form LLM statements or personal-state truth. Temperature scaling can help studied classifiers but is not a blanket solution for generation.
- **Limitations:** Calibration is conditional on population, time, model/prompt, output class, and evaluation design. Self-reported LLM confidence and token probability are not automatically calibrated probabilities of factual truth.
- **Failure conditions:** Undefined denominator; tiny personal sample; confidence reused across claim types; evaluation includes post-outcome information; model/prompt changes without recalibration; heuristic score rendered as a percentage.
- **Future-Me transfer confidence:** **High** for withholding probabilistic language until evaluated; **medium** for transferring a particular calibration technique.

### CR-11 — Human choice does not neutralize automation bias or transfer accountability

- **Claim:** Keeping the user as final decision owner is necessary but insufficient; model confidence and presentation can change reliance, including reliance on wrong advice. The organization remains responsible for system scope, evaluation, access, and action boundaries.
- **Contract support:** **Supported** for user choice; **not supported** for a claim that human review alone manages risk.
- **External support:** NIST AI RMF calls for defined human-AI roles, oversight, testing, and organizational responsibility ([NIST AI RMF 1.0](https://doi.org/10.6028/NIST.AI.100-1)). In a peer-reviewed experiment with 184 participants solving logic puzzles, well-calibrated confidence improved accuracy, while miscalibrated confidence produced little gain and increased automation/conservatism bias ([Fregosi et al., AAAI 2026](https://doi.org/10.1609/aaai.v40i21.38798)).
- **Assumptions:** Future Me presents recommendations or confidence in a way that can influence a user's consequential personal decision.
- **Counter-evidence:** The experiment used logic puzzles, not longitudinal personal decisions; effects may differ by stakes, expertise, interface, and repeated use.
- **Limitations:** More explanation is not automatically better; persuasive rationale can increase over-reliance. User confirmation can become a rubber stamp under time pressure.
- **Failure conditions:** High-confidence styling without calibration; recommendation shown as default or completed action; user cannot inspect used evidence; decline path is costly; system labels acceptance as proof the advice was correct.
- **Future-Me transfer confidence:** **High** for retained organizational responsibility; **medium** for the magnitude of interface effects.

### CR-12 — LLM responsibility ends before policy enforcement and external action

- **Claim:** The LLM can propose semantic artifacts, but deterministic, auditable components must decide retrieval eligibility, persistence state, access, escalation, conflict status, external actions, and whether a recommendation is eligible to display.
- **Contract support:** **Supported** for no calendar mutation, no recommendation/JITAI policy, backend validation, provenance, and user decision ownership. Other action classes remain unspecified.
- **External support:** NIST AI RMF requires documented roles and responsibilities for human-AI configurations and oversight, plus scoped and evaluated use ([NIST AI RMF Core](https://airc.nist.gov/airmf-resources/airmf/5-sec-core/)); NIST AI 600-1 treats confabulation and other GAI risks as lifecycle risks rather than prompt-only problems ([NIST AI 600-1](https://doi.org/10.6028/NIST.AI.600-1)).
- **Assumptions:** Future Me will preserve a typed boundary between generation and policy/action even if both are served in one process.
- **Counter-evidence:** Current architecture mentions an LLM-backed decision engine and lacks a complete enforcement contract; replaceable interfaces alone do not prove separation at runtime.
- **Limitations:** Deterministic policy can itself be wrong or incomplete. Human owners still need monitoring, appeal/correction, incident handling, and reevaluation.
- **Failure conditions:** Model chooses its own tools or scope; free-form output directly drives persistence/action; fallback bypasses authorization; provider outage causes unsafe default; logs cannot reconstruct policy/model version and evidence used.
- **Future-Me transfer confidence:** **High.**

## 8. LLM responsibility boundary for Future Me

### Permitted, subject to evaluation and minimization

- Normalize an intentionally supplied ambiguous phrase into candidate structured attributes.
- Draft a plain-language explanation from an already authorized, structured evidence bundle.
- Propose clarification questions without deciding whether or when they may be asked.
- Identify possible contradictions for deterministic or user adjudication.
- Summarize model-conditional trade-offs while preserving assumptions and uncertainty.

### Prohibited as an authority

- Confirm user intent, behavior, preference, health/energy state, or relationship facts.
- Treat calendar plans or absence of evidence as observed behavior.
- Choose its own retrieval scope, override access policy, or request unrestricted history.
- Convert raw content into a durable confirmed claim without source/status and an admissible confirmation path.
- Assign a calibrated probability unless that exact output event has calibration evidence.
- Resolve conflicting evidence silently.
- Make causal claims from observational history.
- Modify calendars, accept invitations, cancel commitments, send messages, purchase, publish, or perform another consequential external action.
- Decide consent, retention, deletion, training reuse, or raw-content escalation.
- Serve as the only validator of its own output.

### Responsibility remains with people and deterministic systems

- Product owners define allowed purposes and unacceptable harms.
- Engineering enforces data and capability boundaries outside the model.
- Privacy/security owners approve sources, recipients, retention, deletion, logging, and incident response.
- Evaluators establish task-specific accuracy, unsupported-claim, calibration, privacy, and reliance evidence before claims or automation expand.
- The user owns the personal decision, but is not made responsible for hidden system behavior, provider practices, access failures, or misleading confidence.

## 9. Acceptance evidence required before later design claims

This is not an implementation plan. It is the minimum evidence that a later architecture decision would need to present:

- a field-level data inventory and purpose map from source through derived claims, LLM disclosure, logs, embeddings, backups, and deletion;
- a matrix showing what remains local, what crosses a trust boundary transiently, what persists centrally, and who/what can perform each operation;
- connector scopes and evidence that excluded fields never enter general logs or prompts;
- explicit raw-escalation semantics and a denial/fallback path;
- retention and deletion rules, including lineage-aware deletion or documented reasons to retain corrected history;
- provider-specific evidence for retention, training reuse, regions, subprocessors, abuse monitoring, and deletion;
- tests that unauthorized purposes, stale grants, unrelated context, prompt-injected source text, and model requests cannot widen retrieval;
- an embedding threat model if embeddings are proposed, including deletion and inversion/membership testing;
- a federated-learning threat model, secure aggregation/DP rationale, privacy accounting, and utility evidence if shared training is proposed;
- task-specific unsupported-claim and citation-faithfulness evaluation;
- calibration evidence for any numeric confidence and a reevaluation trigger for model/prompt/data changes; and
- human-reliance testing for how recommendations, defaults, explanations, and confidence are presented.

Until that evidence exists, Future Me can truthfully claim only the narrower contract: evidence-aware, revisable, user-owned decision support with a bounded LLM analyst—not privacy-preserving personal intelligence, calibrated AI, or safe automation.

## 10. Primary source register

| Source | What it supports here | Transfer limitation |
|---|---|---|
| [NIST Privacy Framework v1.0](https://doi.org/10.6028/NIST.CSWP.01162020) | Risk-based privacy management, data processing visibility, manageability, disassociated processing, selective collection/disclosure | Voluntary framework; not a control implementation or legal compliance verdict |
| [NIST SP 800-162](https://doi.org/10.6028/NIST.SP.800-162) | Subject/object/operation/environment attributes for authorization | Does not choose Future Me policy or mandate a specific ABAC engine |
| [NIST SP 800-226](https://doi.org/10.6028/NIST.SP.800-226) | Differential privacy definition, evaluation factors, implementation hazards | Relevant only if Future Me proposes private aggregate/shared learning |
| [NIST AI RMF 1.0](https://doi.org/10.6028/NIST.AI.100-1) | Organizational responsibility, human-AI roles, oversight, testing and evaluation | Voluntary and use-case agnostic |
| [NIST AI 600-1](https://doi.org/10.6028/NIST.AI.600-1) | Generative-AI confabulation and lifecycle risk management | Does not supply a product-specific threshold or control set |
| [W3C Verifiable Credentials Data Model 2.0](https://www.w3.org/TR/vc-data-model-2.0/) | Data minimization, selective disclosure principle, correlation warnings | Credential architecture is not established for Future Me; privacy sections cited are substantially guidance rather than a full authorization solution |
| [W3C PROV-DM Recommendation](https://www.w3.org/TR/2013/REC-prov-dm-20130430/) | Entities, activities, agents, derivation, responsibility, provenance | Provenance enables assessment; it does not adjudicate truth |
| [Morris et al., EMNLP 2023](https://doi.org/10.18653/v1/2023.emnlp-main.765) | Demonstrated text-embedding inversion and personal-information recovery | Attack rate is model/input/threat dependent |
| [McMahan et al., AISTATS 2017](https://proceedings.mlr.press/v54/mcmahan17a.html) | Federated averaging with local training data and centralized update aggregation | Does not establish an end-to-end privacy guarantee |
| [Melis et al., IEEE S&P 2019](https://doi.org/10.1109/SP.2019.00029) | Membership and unintended-property leakage from collaborative updates | Attack feasibility depends on task, participant, and threat model |
| [Lin et al., ACL 2022](https://doi.org/10.18653/v1/2022.acl-long.229) | Demonstrated imitative falsehoods on TruthfulQA | Older models and adversarial benchmark; percentages do not transfer to Future Me |
| [Farquhar et al., Nature 2024](https://doi.org/10.1038/s41586-024-07421-0) | Semantic uncertainty can detect a subset of confabulations | Not truth certification; studied tasks/models and sampling cost constrain transfer |
| [Guo et al., ICML 2017](https://proceedings.mlr.press/v70/guo17a.html) | Definition and empirical importance of calibration | Classifier evidence, not direct calibration of free-form LLM claims |
| [Fregosi et al., AAAI 2026](https://doi.org/10.1609/aaai.v40i21.38798) | Primary experiment on calibrated/miscalibrated confidence and human reliance | Logic-puzzle setting and participant population limit direct effect-size transfer |

## 11. Pass A conclusion

The prior privacy/local-processing recommendations are directionally supported, but they are not current Future Me guarantees and are incomplete without lifecycle and access controls. The strongest supported transfer is not “put everything on device” or “use a privacy technology.” It is a stricter set of boundaries:

- collect and disclose only what the current decision needs;
- keep broad raw sources outside the central/LLM path by default;
- preserve claim status and provenance without mistaking lineage for truth;
- authorize every retrieval and disclosure by subject, object, operation, purpose, and context;
- treat embeddings and federated updates as potentially revealing;
- require explicit raw-content escalation;
- keep LLM generation subordinate to deterministic policy, validation, and user confirmation; and
- make calibration and automation claims only after task-specific evidence exists.

Those boundaries are ready to inform a later design pass. They do not constitute that design.
