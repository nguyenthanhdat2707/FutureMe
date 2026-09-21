# Repository Audit Task

You are auditing the current Future Me repository.

Your job is to determine the true implementation state of the project and whether the current phase is complete enough to move forward.

Do NOT implement anything.
Do NOT modify files.
Do NOT commit or push.

Treat the repository as the source of truth.

Do not trust:
* PROJECT_STATUS.md
* previous agent summaries
* comments claiming something is implemented
* interfaces without runtime behavior
* mocks presented as production capability

Verify claims against actual code, tests, runtime paths, and product contracts.

## GOAL

Determine:

1. What is actually implemented.
2. What is partially implemented.
3. What only exists in documentation or interfaces.
4. What is missing.
5. Which missing items are genuine blockers.
6. Whether the current implementation forms a coherent completed phase.
7. What the next coherent phase should be, based on repository evidence rather than assumptions.

Do not assume in advance what the next phase is.

Infer it from:
* product requirements
* architecture contracts
* dependency relationships
* current runtime behavior
* unfinished boundaries
* tests

## ARCHITECTURAL INVARIANTS TO VERIFY

Future Me should preserve a clear separation between deterministic system authority and LLM capabilities.

Verify whether the implementation actually respects that separation.

### Deterministic system authority

Where structured evidence is sufficient, deterministic code should own authoritative decisions such as:
* feasibility calculations
* capacity calculations
* deadline-related calculations
* policy constraints
* validation
* persistence rules
* recommendation authority where explicitly defined by product contracts

### LLM responsibilities

LLMs may assist with tasks where semantic reasoning is useful, such as:
* interpreting ambiguous information
* generating hypotheses
* proposing clarification questions
* explaining trade-offs
* generating natural-language explanations

### LLM restrictions

Verify that an LLM cannot silently:
* create confirmed user facts
* persist unvalidated context
* override deterministic policy
* convert weak evidence into confirmed facts
* treat scheduled intent as observed real-world behavior
* bypass validation or evidence provenance

Do not assume these rules are correctly implemented merely because interfaces or documentation say so.

## AUDIT METHOD

Inspect the repository broadly enough to understand the important runtime architecture.

Trace important flows end-to-end rather than reviewing isolated files.

For each capability, distinguish:
* IMPLEMENTED
* PARTIAL
* DOCUMENTED ONLY
* INTERFACE ONLY
* MOCK ONLY
* NOT IMPLEMENTED

Where relevant, verify:
* actual callers
* runtime wiring
* persistence
* validation
* error handling
* fallback behavior
* tests
* API exposure
* frontend integration

Pay particular attention to boundaries where structured data becomes derived information or user context.

Check whether provenance, assumptions, uncertainty, and validation are preserved correctly.

Do not classify raw data retrieval as intelligence merely because the data is available.

Do not classify an LLM proposal as system knowledge unless it passes the required validation/persistence flow.

## PRODUCT CONTRACT CHECK

Read the relevant product/domain documentation and compare it against implementation.

Identify cases where:
* implementation contradicts the contract
* implementation is weaker than the contract
* documentation describes capability that does not exist
* runtime behavior has evolved beyond outdated documentation

Repository behavior is the implementation truth, but product contracts define intended behavior.

Report important discrepancies explicitly.

## VERIFICATION

Run the relevant verification available in the repository, including where appropriate:
* tests
* integration tests
* build
* typecheck
* targeted lint
* runtime smoke checks

Do not allow unrelated historical lint debt to automatically block progress.

A failing test/build that affects the current architecture or runtime should be treated seriously.

Do not repair failures during this audit.

## PHASE BOUNDARY ANALYSIS

After understanding the implementation, infer the project's current phase boundary.

Do NOT start from a predefined next task.

Answer:
* What coherent capability has the project just completed, if any?
* Is that capability actually complete end-to-end?
* What dependency naturally comes next?
* Which remaining work belongs to the current unfinished phase?
* Which remaining work belongs to a genuinely new phase?

Avoid recommending scope expansion unless repository evidence requires it.

Do not introduce architecture such as:
* multi-agent systems
* RAG
* custom ML
* forecasting
* additional infrastructure
* additional connectors

unless a concrete product requirement or dependency clearly justifies it.

## ANTI-BIAS CHECK

Before finalizing the verdict, actively try to falsify your current conclusion.

Ask:
* What evidence would make this verdict wrong?
* Is an apparently implemented capability only mocked or partially wired?
* Is there an important runtime path I have not checked?
* Am I treating documentation as implementation?
* Am I treating a passing test as stronger evidence than it actually is?

If you find contradictory evidence, update the verdict.

## STOP CONDITION

Stop the audit when additional investigation is unlikely to materially change:
* the readiness verdict
* the major implementation map
* the architectural boundary assessment
* the inferred phase boundary

Do not continue inspecting merely for completeness.

If an important uncertainty cannot be resolved from the repository, report it explicitly instead of guessing.

## READINESS VERDICT

Return one verdict:

### READY
The current phase is coherent, its foundational behavior works, relevant verification passes, and remaining work naturally belongs to a new phase.

### PARTIAL
The architecture is directionally correct, but one or more unfinished foundational capabilities still belong to the current phase.

### BLOCKED
A fundamental runtime, architecture, contract, or verification problem prevents meaningful progression.

Judge readiness based on evidence, not percentage completion.

## OUTPUT FORMAT

### Verdict
READY / PARTIAL / BLOCKED

Give a concise reason.

### Implementation Map

For each major subsystem discovered in the repository:
* status
* what actually works
* what does not
* exact file paths / relevant symbols as evidence

Do not invent subsystem categories merely to fit this prompt.

### End-to-End Runtime Flows

Describe the important flows that currently exist and where each one stops.

### Architecture Contract Findings

State whether the deterministic/LLM boundary is actually enforced.

List any violations or weak points.

### Documentation vs Reality

List important mismatches.

### Verification Results

Show commands run and exact outcomes.

### Current-Phase Blockers

Only genuine blockers that must be resolved before declaring the current phase complete.

If none, explicitly say none.

### Deferred / Non-Blocking Work

Work that exists but should not prevent progression.

### Inferred Phase Boundary

Explain what phase the repository is currently finishing.

Then infer the next coherent phase from evidence.

Explain why.

Do not give implementation instructions yet.

Do not name specific files to edit or produce a task list.

## IMPORTANT DISTINCTIONS

Be strict about:

documented != implemented
interface != runtime behavior
mock != live integration
data retrieval != derived intelligence
LLM output != validated system knowledge
test existence != correct coverage
endpoint existence != end-to-end product flow
planned intent != observed behavior
inference != confirmed fact

Do not optimize the answer to agree with previous reports.

If repository evidence contradicts previous assumptions, trust the repository and explain the contradiction.
