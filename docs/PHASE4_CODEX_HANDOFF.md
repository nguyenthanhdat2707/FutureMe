# Phase 4 Codex Account Handoff

Snapshot: 2026-09-23T10:20:00+07:00

Status update: a valid independent Antigravity/Gemini review inspected an exact temporary copy of the eight-file code/test diff. Actual and reviewed binary diffs shared SHA-256 `381da3027b5c790a01fde4b847e6fc6871c2a121c382bf8f4fcc418b76a8df72`; the reviewer reported `NO BLOCKING FINDINGS` and `SHIP`. Commit `f593a365a808d8ef2e6a7f9a7283160acdaeb6b9` was pushed with matching local/remote SHAs. Gate 8 browser proof subsequently passed RECOMMEND, canonical ASK, unresolved ABSTAIN, clarification-to-RECOMMEND, stale-context signaling, and context-change before/after reassessment. Phase 4 is 8/8 (100%) and READY_FOR_USER_TEST. The remaining active work is the separate local demo-persona/evaluation-data unit; production mutation is still unauthorized.

This file preserves the complete Phase 4 execution handoff after switching the Codex account. The new account uses the same local filesystem and Git working tree. Phase 4 itself is now technically complete; sections describing the unstaged Gate 7 diff are historical snapshot evidence. Do not restart or rewrite that completed unit. Continue only from the current status update and the demo-persona/evaluation-data section.

## Required Reading Order

1. `docs/PHASE4_CODEX_HANDOFF.md` (this file)
2. `docs/PHASE4_PROGRESS.md`
3. `PROJECT_STATUS.md`
4. `PHASE4_TASK.md`
5. `docs/DECISION_POLICY.md`
6. Inspect `git status --short --branch`, `git diff --name-status`, and the full `git diff` in the actual repository.

Repository path:

`/home/tdat/Documents/Learn/Code/HackathonIdea-VKU-09-2026/Future-Me`

## Human Intent

Complete the Phase 4 user-invoked decision journey with evidence, then prepare a rich set of synthetic DynamoDB evaluation cases and six public demo personas with quick login.

The immediate implementation worker should be Codex after the account switch. Codex must inspect and continue the current working tree rather than reconstructing work from chat history.

The Product Owner has approved the product direction of six public synthetic demo accounts with quick login. This approval is not authorization to mutate production AWS. Creating Cognito users, writing DynamoDB, deploying, changing Amplify variables, or modifying infrastructure still requires an explicit production-write authorization at the execution boundary.

## Frozen Product and Security Invariants

- `docs/DECISION_POLICY.md` is frozen. Do not change it merely to make tests pass.
- Deterministic feasibility logic owns `RECOMMEND`, `ASK`, and `ABSTAIN`.
- Feasibility mapping remains:
  - `feasible` -> `RECOMMEND/proceed`
  - `at-risk` -> `RECOMMEND/proceed-with-caution`
  - `not-feasible` -> `RECOMMEND/do-not-proceed`
- `ASK` and `ABSTAIN` must not call the LLM and must return `tradeoffs: []`.
- Energy and goal relevance are optional. Omitted energy fields must not block a recommendation; invalid negative energy values remain invalid inputs.
- First unresolved material missing fact or conflict -> `ASK`.
- If clarification was attempted and the same material fact/conflict remains unresolved -> `ABSTAIN`.
- Context conflicts require a stable entity identity from the parsed evidence plus the attribute kind. Do not infer identity from text similarity and do not use repository row IDs as entity identity.
- Ignore expired evidence.
- Resolve by frozen source authority first; within equal authority, newer `observedAt` wins.
- Only equal-authority, equal-freshness finalists with materially different canonical values form an unresolved conflict.
- Production identity must continue to come from the Cognito JWT `claims.sub`. Never trust request `userId` in Cognito mode.
- Synthetic demo identities must contain only fake data and remain isolated from real accounts.
- Do not weaken the Cognito policy for real users.
- Do not place any password, token, credential, `.env` value, or real user identifier in source control or logs.
- Choice persistence is Phase 6, not Phase 4.
- Do not expand into Phase 5, Phase 6, Phase 7, unrelated infrastructure, or dependency changes without evidence that Phase 4 requires the minimum change.

## Current Git State

Branch:

`feat/phase4-decision-journey`

Current local HEAD and upstream at snapshot time:

`2140a7aaef9ea765e3d4ffafce16ea3d20ba0d28`

The branch is synchronized with its upstream but has an intentional unstaged Phase 4 repair diff. Do not reset, checkout, clean, stash, or overwrite it.

Modified files at snapshot time:

- `src/__tests__/decision-feasibility.test.ts`
- `src/__tests__/decision.routes.test.ts`
- `src/__tests__/mock-decision-engine.test.ts`
- `src/__tests__/simple-context-engine-relevance.test.ts`
- `src/domain/types.ts`
- `src/intelligence/deterministic-feasibility-assessment.ts`
- `src/intelligence/mock-decision-engine.ts`
- `src/intelligence/simple-context-engine.ts`

Snapshot diff size: 8 files, 326 insertions, 20 deletions.

This handoff file and tracker edits are documentation additions made after that snapshot and will also appear in the working tree.

## What the Current Diff Implements

### 1. Canonical clarification field

`deterministic-feasibility-assessment.ts` emits `availableHoursBeforeDeadline` when neither explicit availability nor a valid deadline can provide capacity. It no longer emits the composite UI-inapplicable key `availableHoursBeforeDeadline or deadline`.

`mock-decision-engine.ts` accepts the canonical key when rendering a clarification question. The legacy composite case is retained defensively only; do not treat that compatibility branch as current backend output.

### 2. Optional energy semantics

Omitted `energyCost` and `availableEnergy` no longer enter `missingData`. Negative supplied energy values still enter invalid-input handling. A regression test proves complete time/workload inputs can produce `RECOMMEND/proceed` without energy fields.

### 3. Evidence precedence and expiry

`SimpleContextEngine.getCurrentContext` now selects entity versions by:

1. non-expired evidence only;
2. source authority;
3. `observedAt` freshness;
4. deterministic `createdAt` and row-ID tie breakers.

### 4. Stable conflict detection

`SimpleContextEngine` groups conflict candidates only by parsed entity `id` and attribute kind (`goal`, `commitment`, or `preference`). It intentionally skips evidence without a stable parsed entity ID.

For a relevant entity group, it keeps the highest-authority evidence, then the freshest evidence in that authority tier, then compares every finalist using key-order-independent canonical JSON. More than two tied finalists are handled.

The result is exposed as `RelevantContext.unresolvedConflicts` and threaded by `MockDecisionEngine` into `evaluateDecisionPolicy`.

### 5. End-to-end policy behavior

Tests cover:

- source authority over freshness;
- expired evidence ignored;
- equal-authority/equal-freshness material tie;
- fresher evidence resolving a tie;
- unrelated stable entity IDs not grouped together;
- first conflict yielding `ASK`;
- attempted unresolved conflict yielding `ABSTAIN`;
- zero LLM calls and empty trade-offs for both states;
- a real repository -> context engine -> decision engine -> route conflict path.

## Fresh Verification Evidence

The following commands were rerun against the exact current working tree at this handoff snapshot.

Backend tests:

`npm test -- --runInBand`

Result: PASS — 18 suites, 122 tests. Coverage: 77.93% statements, 60.55% branches, 79.07% functions, 79.45% lines.

Backend lint:

`npm run lint`

Result: PASS, exit code 0.

Backend build and whitespace check:

`npm run build && git diff --check`

Result: PASS, exit code 0.

Frontend tests:

`cd frontend && npm test`

Result: PASS — 8 files, 48 tests.

Frontend lint:

`cd frontend && npm run lint`

Result: PASS, exit code 0.

Frontend production build:

`cd frontend && npm run build`

Result: PASS — Vite production bundle created successfully.

These are local automated gates only. They do not complete Gate 7 or Gate 8 by themselves.

## Review Evidence and Caveats

- A delegated read-only Codex review failed before reading the repository because the old account/config requested unsupported model name `gpt-terra-high` and returned HTTP 400. This is tooling failure, not review evidence.
- A fallback Antigravity/Claude review timed out and inspected Antigravity's scratch repository path instead of the actual repository path. Its final recommendation said SHIP/no blocking findings, but that run is not accepted as an independent review of this worktree.
- That stale review raised two issues already absent from the actual diff: only comparing two finalists and key-order-sensitive `JSON.stringify`. The actual worktree compares all finalists and uses `canonicalJson`.
- Its entity-ID fallback concern conflicts with the approved invariant: conflict identity must be a stable parsed domain entity ID; falling back to a row ID would hide genuine versions rather than group them.
- It correctly noticed that `getRelevantContext` currently calls `findByUserId` after `getCurrentContext` already fetched the same attributes. Treat this as a bounded performance/cleanliness observation. Repair it only if the refactor preserves behavior and is covered by tests; do not broaden the unit.

Historical result: the valid independent review was completed against an exact temporary copy of the actual diff, as recorded in the status update above.

## Completed Gate 7 Task Contract (Historical)

### GOAL

Finish the current Gate 7 repair as one bounded, verified unit without losing existing work.

### KNOWN FACTS

- The eight-file code/test diff described above exists locally.
- All current backend and frontend automated gates pass.
- The frozen policy is authoritative.
- Gate 7 remains `REVIEWING`; Gate 8 remains `PENDING`.
- Production auth/CORS and calendar persistence blockers are already resolved and are not this unit.

### FIRST ACTIONS

1. Read the five documents in the required reading order.
2. Confirm the exact repository path, branch, HEAD/upstream, worktree status, and full diff.
3. Inspect the changed call path and tests; do not trust this handoff blindly.
4. Independently classify any finding against the frozen policy.
5. Preserve correct existing changes. Do not rewrite the unit wholesale.

### ALLOWED SCOPE

- The eight modified code/test files listed above.
- `docs/PHASE4_PROGRESS.md`, `PROJECT_STATUS.md`, and this handoff document for evidence/status updates.
- A narrowly necessary regression test or implementation change for a demonstrated defect in the current unit.

### OUT OF SCOPE

- Changing `docs/DECISION_POLICY.md`.
- Demo-account implementation or production seeding during this immediate Gate 7 repair unit.
- Cognito policy changes, JWT semantics, infrastructure, deployment, calendar provider work, choice/outcome persistence, Phase 5/6/7 behavior, package upgrades, broad refactors, or formatting unrelated files.

### ACCEPTANCE CRITERIA

- Canonical clarification is usable by the UI.
- Optional omitted energy does not block a recommendation; invalid values remain invalid.
- Relevant stable-identity conflicts flow from repository evidence into policy.
- Authority, freshness, expiry, materiality, and unrelated-entity isolation match the frozen contract.
- First unresolved conflict -> `ASK`; unresolved after attempted clarification -> `ABSTAIN`.
- `ASK`/`ABSTAIN` skip LLM generation and return no trade-offs.
- Full backend and frontend test/lint/build gates pass.
- `git diff --check` passes.
- A valid read-only reviewer inspects the actual diff, and all blocking findings are resolved or explicitly rejected with evidence.
- No secrets, scratch files, generated build artifacts, unrelated files, AWS writes, deploys, or policy changes enter the unit.

### STOP CONDITIONS

Stop and report evidence rather than guessing if:

- the worktree or branch differs from this handoff;
- a proposed repair changes frozen policy semantics;
- the required change crosses authentication, infrastructure, production data, or deployment boundaries;
- a failing test is unrelated/pre-existing and fixing it would expand scope;
- production mutation is required;
- the same root failure survives three evidence-based repair attempts.

## Demo Personas and DynamoDB Evaluation Dataset — Approved Direction, Not Yet Executed

After the current Gate 7 unit is independently reviewed and delivered, prepare the separate demo-data unit.

Required design:

- exactly six synthetic public demo personas;
- one distinct Cognito user/`sub` per persona;
- no real-user data and no overlap with real identities;
- quick-login persona chooser using an intentionally public demo credential supplied through deployment/environment controls, never committed to the repository;
- preserve Cognito/JWT security for real users;
- deterministic, idempotent seed version such as `phase4-eval-v1`;
- deterministic domain record IDs and timestamps relative to a recorded `seededAt`;
- a generated manifest containing only non-secret identity/record references needed for exact readback and rollback;
- rollback deletes exact manifest keys only; never scan-and-delete and never touch pre-existing rows;
- verify every expected Cognito identity and exact DynamoDB item count after seeding;
- no AWS write or deployment until the Product Owner explicitly authorizes that production mutation.

The six personas must jointly cover:

1. clean feasible -> `RECOMMEND/proceed`;
2. high workload/pressure -> `RECOMMEND/proceed-with-caution`;
3. not feasible -> `RECOMMEND/do-not-proceed`;
4. missing availability/deadline -> `ASK`, then canonical clarification resolves it;
5. skipped/unresolved material input -> `ABSTAIN` after an attempted clarification;
6. genuine relevant context conflict -> `ASK`, then `ABSTAIN` if still unresolved.

Across the dataset also cover:

- higher-authority evidence resolving a conflict;
- fresher same-authority evidence resolving a conflict;
- expired evidence ignored;
- unrelated entities not conflicting;
- before/after decision explanation after a context change.

Implementation must first define exact persona names, record schemas/counts, IDs, expected outcomes, seed/rollback commands, readback assertions, files, tests, browser steps, and security limitations. Do not invent or record the shared password in this file.

## Remaining Phase Sequence

1. COMPLETE — valid independent review of the exact Gate 7 diff.
2. COMPLETE — no blocking findings remained.
3. COMPLETE — focused/full test, lint, and build gates.
4. COMPLETE — Phase 4 trackers updated with exact evidence.
5. COMPLETE — Gate 7 commit `f593a365a808d8ef2e6a7f9a7283160acdaeb6b9` pushed with matching local/remote SHAs.
6. COMPLETE — Gate 8 local browser/delivery evidence; Phase 4 is 8/8 and READY_FOR_USER_TEST.
7. ACTIVE — implement and locally verify the six-persona seed/rollback and quick-login unit without touching production.
8. PENDING HUMAN AUTHORIZATION — production Cognito/DynamoDB/deployment mutation.
9. If authorized, perform exact production readback, rollback safety proof, and browser verification.

## Suggested First Prompt After Codex Account Switch

Use the following prompt from the repository root for the remaining evaluation-data unit:

`Read docs/PHASE4_CODEX_HANDOFF.md, docs/PHASE4_PROGRESS.md, PROJECT_STATUS.md, PHASE4_TASK.md, and docs/DECISION_POLICY.md in that order. Confirm Phase 4 is 8/8 and inspect the current branch/worktree at /home/tdat/Documents/Learn/Code/HackathonIdea-VKU-09-2026/Future-Me. Work only on the separate six-persona quick-login and deterministic phase4-eval-v1 seed/manifest/rollback unit described in the handoff. Preserve JWT claims.sub isolation and the real Cognito policy; do not embed credentials or touch real-user data. Implement and test locally only. Do not create Cognito users, write DynamoDB, change Amplify, deploy, commit, or push unless explicitly authorized.`

After that worker exits, the supervising agent must inspect the worktree and rerun verification before accepting any claim.
