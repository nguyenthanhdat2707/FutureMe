# Phase 4 Demo Personas / Evaluation Data — Codex Account Handoff

> **Historical handoff:** the Product Owner subsequently approved `docs/DEMO_MODE_WITHOUT_COGNITO_TASK.md`. Its public demo-mode identity boundary supersedes this handoff's Cognito/password requirements and stop conditions.

Snapshot: `2026-09-23T13:33:03+07:00`

## Resume Location

- Repository: `/home/tdat/Documents/Learn/Code/HackathonIdea-VKU-09-2026/Future-Me`
- Branch: `feat/phase4-demo-personas`
- Local HEAD: `26584a9f356dd1f7623c9c291705888506e05ead`
- Upstream: `origin/feat/phase4-demo-personas`
- Upstream HEAD at snapshot: `26584a9f356dd1f7623c9c291705888506e05ead`
- Local and upstream HEAD match; all implementation work below is uncommitted.

Do not run `git reset --hard`, `git clean`, checkout over files, or stash blindly. Inspect and preserve the existing dirty worktree.

## Required Reading Order

1. `docs/PHASE4_DEMO_DATA_HANDOFF.md`
2. `docs/PHASE4_DEMO_DATA_TASK.md`
3. `PHASE4_TASK.md`
4. `PROJECT_STATUS.md`
5. `docs/DECISION_POLICY.md`
6. The complete current diff and every untracked file listed below

## Product Status

- Core Phase 4 decision journey is already complete: 8/8 gates, 100%, `READY_FOR_USER_TEST`.
- Phase 4 completion is delivered on `feat/phase4-decision-journey` and is not part of this dirty implementation unit.
- This branch is a separate Product Owner-requested evaluation-data extension:
  - six public synthetic demo personas;
  - deterministic `phase4-eval-v1` data;
  - safe plan/apply/verify/rollback tooling;
  - quick-login UI as a later unit.
- No production AWS mutation is authorized.

## Current Working Tree

Tracked modifications:

- `.gitignore`
- `PROJECT_STATUS.md`
- `docs/PHASE4_DEMO_DATA_TASK.md`
- `package.json`
- `package-lock.json`

Untracked implementation files:

- `scripts/phase4-evaluation-data.ts`
- `src/demo/phase4-evaluation-dataset.ts`
- `src/__tests__/phase4-demo-data.test.ts`
- `docs/PHASE4_DEMO_DATA_HANDOFF.md` (this handoff)

Worker scratch files and generated JS/declaration artifacts were removed. Do not recreate or commit `.orig`, patch scratch, generated JS, generated declarations, or generated source maps.

Snapshot hashes before this handoff file was written:

- Tracked diff Git object hash: `a3ac9b7de7822deadbb69340bca3ddcfa5f2ee01`
- `scripts/phase4-evaluation-data.ts` SHA-256: `d7a5df857413f09a44a241f77259d9271d0c9d7f93ebab592d79bf8b035b93b3`
- `src/demo/phase4-evaluation-dataset.ts` SHA-256: `d4f6c2692d9d5e2136cfa8b353a6db8a79f4d4bf0099dd9af29dd295702e5b1d`
- `src/__tests__/phase4-demo-data.test.ts` SHA-256: `22348466d2021e956c205865c2a5271223d35a7722b7cc76514307987cc418be`

## Frozen Security and Scope Invariants

- Keep Cognito password policy and JWT auth unchanged.
- Backend identity remains validated JWT `claims.sub`; never trust request `userId` in Cognito mode.
- Each persona has a separate Cognito user and actual `sub`.
- Users-table `id` and all non-user records' `user_id` equal that actual `sub`.
- Every non-users-table key begins `phase4-eval-v1:`. Users-table keys are actual Cognito subjects.
- All data is synthetic and isolated from real users.
- Never inspect, mutate, or delete real-user data.
- Password is runtime-only through `PUBLIC_DEMO_PASSWORD`; never print, persist, commit, or include it in errors.
- No scans. Preflight exact keys. Rollback exact manifest keys only after tag/persona/owner verification.
- Reapply uses the same manifest `seededAt`, subjects, and exact keys.
- No Terraform, auth middleware, policy, Phase 5/6/7, real Google Calendar, production deployment, or AWS mutation in this local unit.
- Do not modify `docs/DECISION_POLICY.md`.

## Exact Dataset Contract

Seed version: `phase4-eval-v1`.

Six personas:

1. `focused-builder` — RECOMMEND/proceed; user-confirmed authority beats newer inferred evidence.
2. `busy-balancer` — RECOMMEND/proceed-with-caution; constrained capacity/workload.
3. `overloaded-lead` — RECOMMEND/do-not-proceed; overloaded state and expired evidence ignored.
4. `needs-clarity` — ASK, then canonical `availableHoursBeforeDeadline` resolves to RECOMMEND.
5. `uncertain-skipper` — ASK, unresolved continuation gives ABSTAIN.
6. `conflict-check` — stable-entity equal-authority/equal-freshness conflict gives ASK, then ABSTAIN if unresolved.

Exact DynamoDB totals:

- users: 6
- personal context: 28
- observations: 8
- calendar events: 16
- decisions: 6
- total: 64

## What Is Implemented So Far

The partial implementation currently includes:

- deterministic six-persona dataset and exact 64-record plan;
- Cognito SDK dependency and package scripts;
- plan/apply/verify/rollback CLI skeleton;
- typed manifest with persona identity state and 64 entries;
- strict manifest-validation attempt;
- atomic manifest write attempt;
- all-keys Dynamo preflight attempt;
- batch write retry attempt;
- partial-failure identity state saved before password setup;
- verify and rollback attempts;
- a large focused test suite.

Treat all of this as proposed partial work, not accepted code. Read and repair it rather than starting over unless a test demonstrates that replacement is safer.

## Current Verified Evidence

Passing:

- `npm run demo:phase4:plan` exits 0.
- Plan prints exactly six personas.
- Plan prints table counts `6 / 28 / 8 / 16 / 6` and total `64`.
- Plan requires no AWS credentials and made no AWS call during verification.
- `git diff --check` exits 0 at the snapshot.
- Branch local/remote HEADs match at `26584a9f356dd1f7623c9c291705888506e05ead`.

Failing:

- `npx jest --runInBand --coverage=false src/__tests__/phase4-demo-data.test.ts`
  - test suite does not compile;
  - 0 tests executed;
  - TypeScript errors at test lines 203, 239, 257, 291, 529, 551, and 659.
- `npm run build`
  - exits 2 with the same TypeScript test errors.
- `npm run lint`
  - exits 1 with 15 errors, 0 warnings;
  - errors are in the focused test and dataset module.

The current unit is therefore not accepted and must not be committed, pushed, applied, or deployed.

## Current Compile/Lint Defects

Observed TypeScript failures:

- Direct `ManifestState` / `ManifestEntry` / `ManifestPersona` / `Error` casts to `Record<string, unknown>` must go through `unknown` or, preferably, use typed clone/test helpers.
- Test line around 659 accesses `.input` while it remains `unknown`; use a real type guard or command-class inspection.

Observed lint failures:

- unused `generatePhase4Id` import;
- unsafe assignments/member access caused by untyped `JSON.parse` test values;
- unused `tmpManifestPath` and callback arguments;
- unsafe assignment from `JSON.parse(JSON.stringify(manifest))` in production code;
- unnecessary non-null assertions around manifest callback state.

Do not silence these with broad `any` or eslint-disable comments.

## Safety Gaps to Re-check After Compilation

Compilation success is not sufficient. Confirm with tests and source inspection:

1. Exact expected counts are constants, not merely a sum that can accept the wrong per-table distribution.
2. Manifest sorting is deterministic by a total tuple and happens before validation/write without mutating caller input unexpectedly.
3. Username and email equal the deterministic persona values, not only a prefix check.
4. Non-planned identity states require manifest-proven ownership (`createdBySeed=true`).
5. Creation remains recoverable if AdminCreate succeeds but a later sub lookup/password action fails.
6. Initial apply checks all six names are absent before creating any user.
7. Resume only accepts manifest-proven users and verifies exact Cognito `sub`.
8. Existing Dynamo records require exact seed tag, persona, and owner; missing `user_id` is a mismatch, not success.
9. All 64 exact keys are preflighted before the first BatchWrite.
10. Every dataset item maps to exactly one manifest entry; missing/duplicate mappings fail.
11. BatchWrite retries only unprocessed items, uses maximum 25 requests, and fails after a finite limit.
12. Verify requires all 64 completed entries and checks exact tag/persona/owner plus Cognito subject drift.
13. Rollback verifies exact tag/persona/owner and deletes only completed entries.
14. Rollback uses bounded BatchWrite DeleteRequests with retry, not unbounded or scan-based deletion.
15. Completed flags switch to false only after an entire delete batch succeeds; partial failure keeps recoverable state.
16. Manifest retains all 64 entries until complete cleanup, then is removed.
17. Rollback deletes only manifest-proven `createdBySeed` deterministic Cognito users.
18. Cleanup resets identity and owner fields consistently before removing the manifest.
19. CLI fails nonzero on all failures and redacts the actual runtime password from error output.
20. Tests import the real script/redaction helper; they must not reimplement redaction and call that a test.
21. Importing the script must actually occur in the import-safety test and must not execute `main`.
22. Tests use realistic AWS command inspection and do not pass only because mocks do not model command order/shape.

## Worker Failures / Why the Account Switch Is Needed

Antigravity attempts:

- Initial implementation produced a real diff but no focused tests and unsafe manifest/ownership behavior.
- Repair pass added tests and logic but timed out before verification.
- Final repair with Claude Opus was cut off by Antigravity quota after writing partial source/tests.

Antigravity quota error:

`Individual quota reached. Please upgrade your subscription to increase your limits.`

Codex retry after the user requested continuation failed before editing because the old Codex account is still quota-blocked:

`ERROR: You’ve hit your usage limit. Upgrade to Pro, visit Codex usage settings to purchase more credits or try again at Sep 28th, 2026 6:49 AM.`

No new Codex edit was made by that failed run.

## Next Ordered Units

### Unit A1 — Finish Backend Dataset/CLI

Allowed files:

- `.gitignore`
- `package.json`
- `package-lock.json`
- `src/demo/phase4-evaluation-dataset.ts`
- `scripts/phase4-evaluation-data.ts`
- `src/__tests__/phase4-demo-data.test.ts`
- status/task/handoff docs only when recording verified evidence

Required local gates:

1. Focused test passes with real executed test count.
2. Plan passes with exact `6 / 28 / 8 / 16 / 6 = 64` output.
3. Full backend tests pass.
4. Backend lint has zero errors/warnings.
5. Backend build passes.
6. `git diff --check` passes.
7. Independent read-only review examines the exact real diff.
8. Supervisor verifies and only then commits/pushes Unit A1.

### Unit A2 — Quick Login UI

Only after A1 is delivered:

- add source-controlled public persona metadata without a password;
- render six cards only when `VITE_ENABLE_PUBLIC_DEMO_LOGIN=true` and `VITE_PUBLIC_DEMO_PASSWORD` is non-empty;
- use the existing Cognito sign-in path;
- never render/log/store/include password in URL;
- run focused auth tests, full frontend tests/lint/build, and browser proofs for disabled/enabled modes;
- independently review, then commit/push.

### Production Mutation

Stop before production mutation. Product Owner authorization is required before:

- Cognito user creation;
- DynamoDB writes;
- Amplify environment/config changes;
- deploy/apply;
- production rollback.

## Exact Resume Prompt for the New Codex Account

```text
Work in /home/tdat/Documents/Learn/Code/HackathonIdea-VKU-09-2026/Future-Me on branch feat/phase4-demo-personas. First read docs/PHASE4_DEMO_DATA_HANDOFF.md, docs/PHASE4_DEMO_DATA_TASK.md, PHASE4_TASK.md, PROJECT_STATUS.md, and docs/DECISION_POLICY.md. Then run git status --short --branch, inspect the complete diff and all untracked files, and preserve the dirty worktree. Do not reset, clean, stash, call AWS, read credentials/.env, touch frontend/Terraform/auth/policy, commit, push, deploy, or mutate production. Finish Unit A1 only. Start by fixing the documented TypeScript/lint failures without any/blanket suppressions, then run the focused tests. Repair every safety gap in the handoff with realistic tests. Required gates: focused tests, exact 6/28/8/16/6=64 plan, full backend tests, zero-warning lint, build, git diff --check, exact diff/status report. Do not claim completion from partial/background checks. Stop before quick-login UI or AWS mutation.
```

## Stop Boundary

The worktree is safely preserved. The correct next action is to switch the Codex account, resume with the prompt above, and finish local Unit A1. Do not mutate AWS or start quick-login UI until Unit A1 is independently verified and delivered.
