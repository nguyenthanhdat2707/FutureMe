# Temporal Intelligence, Trade-Off Reasoning & Demo Reset

State: IMPLEMENTING
Branch: `feat/temporal-tradeoff-reset`
Base: `origin/main` at `263aa67`
Working tree: `/home/tdat/Documents/Learn/Code/HackathonIdea-VKU-09-2026/Future-Me-temporal`

## Fixed completion gates

1. Existing semantics and minimal metadata — COMPLETE
2. Capacity and trade-off reasoning — COMPLETE
3. Six coherent temporal personas — IN PROGRESS
4. Deterministic persona-specific focus patterns — PENDING
5. Shared accepted/rejected runtime state — PENDING
6. Selected-persona canonical reset — PENDING
7. Full tests/lint/build/browser and high-risk review — PENDING
8. Incremental commits pushed and READY_FOR_USER_TEST handoff — PENDING

Progress: 2/8 (25%)

## Latest verification

- Work Unit 1 focused context tests: 11/11 PASS.
- Backend lint: PASS.
- Backend build: PASS.
- Frontend tests: 70/70 PASS.
- Frontend build: PASS; lint exits 0 with three pre-existing warnings.
- Full backend suite: 164/165 PASS. The sole failure is the pre-existing Friday-after-09:00 time-sensitive Phase 3 mock-calendar test; the same test fails on the untouched predecessor worktree because all current-week mock events have already elapsed.
- Work Unit 2 mechanism tests: 44/44 PASS across feasibility, context relevance, policy integration, displacement, impact horizon, double-count prevention, focus quality, explicit precedence, and uncertainty.
- Work Unit 2 regression repair: Phase 4 before/after integration 1/1 PASS.
- Work Unit 2 backend lint/build: PASS. Frontend types remain compatible with the previously verified 70/70 frontend tests and production build.
- Full backend suite after Work Unit 2: 179/180 PASS. Only the previously isolated time-sensitive mock-calendar test remains.
- Claude Opus 5 independent rereview: PASS with no blockers after Codex repaired long-horizon relevance, material-overlap, protected linked-work, explicit-precedence, and recommendation-order edge cases.

## Preflight decisions

- Work is isolated from the original dirty worktree on a fresh branch from the merged predecessor at `origin/main`.
- Preserve the current Decision Engine, Context Engine, policy evaluator, repositories, and JSON-backed metadata approach.
- Interpret `remainingEffortHours` as total outstanding work, including any part already allocated to linked future calendar blocks. When usable capacity already excludes calendar occupancy, only `max(0, remainingEffortHours - linkedScheduledHours)` is additionally charged.
- Explicit current impact fields override context-derived values field by field.
- Derive displacement candidates from explicit seeded event flexibility metadata; do not ask users to repeat known calendar structure.
- Fix demo display/interpretation to `Asia/Ho_Chi_Minh` without changing backend storage architecture.
- Canonical reset will reuse deterministic seed identity and restore one selected persona only.

## Specialist review

Claude Opus 5 completed a read-only capacity-mechanism review. Accepted: optional JSON metadata, deterministic impact horizon, explicit precedence, greedy explainable displacement, soft focus-quality signals, and mechanism-focused tests. Rejected/simplified: putting context-derived displacement candidates into user input, estimating remaining effort from priority, and treating a fixed 7-day horizon as sufficient for every decision.

## Difficulties Encountered

- Codegraph is unavailable because the isolated worktree has no `.codegraph` index. Repository inspection continued with targeted reads/searches; no indexing change was made.
- The existing seed uses namespaced attributes such as `goal:ship`, but `SimpleContextEngine` recognizes only exact `goal`/`commitment`/`preference` names. Work Unit 1 will repair this existing semantic disconnect.
- The existing `/api/demo/reset` is only a stub; repository interfaces currently lack persona-scoped deletion/restoration operations. Reset design remains bounded to Work Unit 6.
- Antigravity stalled twice during Work Unit 1. Its partial type/helper edits were preserved; Codex completed and verified the bounded unit. No out-of-scope worker artifacts remain.
- Antigravity also remained at its startup banner for Work Unit 2 and produced no source diff within the 90-second execution boundary. Codex stopped it, removed its dependency symlink artifact, implemented the bounded unit directly, and obtained an independent Claude Opus 5 review.
- The full backend gate currently has one pre-existing temporal failure: the mock adapter anchors all events Monday-Friday, so Friday's 09:00 event is already past when the Phase 3 sync test runs later Friday. This will be repaired in the temporal-data unit rather than hidden or treated as a Work Unit 1 regression.
