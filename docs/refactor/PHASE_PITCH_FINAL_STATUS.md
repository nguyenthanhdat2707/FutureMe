# Future Me — Final Pitch Demo

## Phase

Future Me — Final Pitch Demo

## Branch

- Working branch: `demo/pitch-final`
- Isolated worktree: `/home/tdat/Documents/Learn/Code/HackathonIdea-VKU-09-2026/Future-Me-demo-pitch-final`
- Base / latest relevant commit: `0cec6f0` (`origin/main` at phase start)
- Repository state: implementation has begun; contract and checkpoint are currently untracked; no feature implementation has yet been independently verified.

## Goal

Implement a locally working, deterministic, presentation-grade frontend demo in which Dashboard, Calendar, Tasks, Understanding, Ask Future Me, and History/Reflection consume one coherent Persona A world for the fixed October 5–18, 2026 period.

## Contract

Authoritative product behavior: `FUTURE_ME_DEMO_GOAL.md`.

## Completed

### Implemented

- Created an isolated `demo/pitch-final` worktree from clean `origin/main` without modifying divergent local `main` or its unrelated untracked files.
- Copied the authoritative contract into the isolated worktree.
- Inspected the frontend routes, API-driven Dashboard, Understanding, Ask Future Me, layout/navigation, tests, and existing persistence/reset paths.
- Defined the first bounded Codex task contract for shared demo state in `CODEX_DEMO_WORLD_TASK.md`.
- Implemented the shared contract-specific demo world in `frontend/src/demo-world/`: typed baseline, stable IDs, fixed Oct 5–18 calendar/tasks/goals/opportunities, deterministic selectors, exact Scenario A transitions, pure plan preview, explicit apply, Scenario B reasoning/action, corrections, reflection, persistence, and reset.
- Installed `DemoWorldProvider` at the application root and rewired the TopBar presenter control to the frontend-only `Reset Demo` action. The visible pitch profile is now Persona A rather than the prior six-persona selector.

### Integrated

- Shared provider is integrated into `frontend/src/App.tsx`; pitch pages are not yet rewired to consume it.

### Tested

- Shared demo-world focused suite: 11/11 tests pass.
- Frontend production build passes after the foundation integration.
- Frontend lint exits 0 with four warnings (one new Fast Refresh warning in the provider plus three pre-existing warnings in API-driven pages that are scheduled for replacement).

### Manually verified

- None yet.

## Current State

- State: IMPLEMENTING. Gate 1 foundation is implemented and supervisor-tested; cross-page integration is still pending.
- Architecture decision: use a small React Context + reducer/store in `frontend/src/demo-world/` (exact filenames may adapt) as the only authoritative demo state.
- State must use stable IDs, an immutable canonical baseline, deterministic selectors/transitions, and versioned `localStorage` persistence.
- Plan preview must be pure and reversible; explicit apply is the only transition that mutates calendar/tasks/capacity/opportunity/history.
- Plan apply and mentoring completion/reflection are separate transitions.
- One frontend Reset Demo action must restore calendar, tasks, context, opportunities, decisions, outcomes, learned signals, active decision/plan, transient UI state, and persisted storage.
- Existing pages currently depend heavily on backend APIs and runtime dates; the pitch surfaces will be rewired to the shared frontend store rather than altering the backend.
- Infrastructure is frozen. Do not touch AWS, Amplify, IAM, Route 53, CloudFront, S3 hosting, API Gateway, Lambda, DynamoDB, Cognito, OAuth/Google Calendar, Terraform, deployment workflows, DNS, secrets, environments, or any backend hosting/deployment configuration.
- Local frontend build is allowed; external deployment is out of scope.

## Fixed Completion Gates

1. [x] Shared Persona A baseline, fixed Oct 5–18 world, selectors, persistence, reset
2. [ ] Scenario A decision flow: prompt, High priority, exactly two clarifications, three alternatives
3. [ ] Scenario A execution flow: Use this plan, availability, reversible Before/After, apply
4. [ ] Cross-page Dashboard / Calendar / Tasks consistency after apply
5. [ ] Scenario B proactive insight and usable-capacity reasoning
6. [ ] Understanding / History / editability / provenance / continuous-learning reflection
7. [ ] Automated tests, lint, and production build
8. [ ] Integrated browser canonical-flow verification and final contract audit

Verified progress: 1/8 gates (12.5%).

## Verification

Phase verification run so far:

- RED: `npm run test -- --run src/demo-world/demo-world.test.ts` initially failed because `./index` did not exist.
- GREEN: `npm run test -- --run src/demo-world/demo-world.test.ts` → 1 file passed, 11 tests passed.
- `npm run build` → pass; 662 modules transformed and `dist/` produced. Vite reports a non-blocking chunk-size warning.
- `npm run lint` → exit 0 with four warnings: provider Fast Refresh; Dashboard set-state-in-effect; Context purity/Date.now; Context set-state-in-effect.

Repository-start evidence:

- `git fetch origin --prune` succeeded.
- Original local `main` was `ahead 3, behind 1` with 16 unrelated untracked files.
- New worktree branch was created from `origin/main` commit `0cec6f0075780855abca1ef561574d7777d709bc`.
- Codegraph could not inspect this worktree because no `.codegraph/` index exists; normal repository file inspection is being used.

## Remaining Work

- Implement and independently verify shared demo-world types, baseline, selectors, transitions, persistence, provider, and Reset Demo.
- Rewire Dashboard and add Calendar/Tasks surfaces to the shared world.
- Implement exact Scenario A Ask Future Me decision and execution flow.
- Implement Before/After plan preview and explicit apply semantics.
- Implement Scenario B proactive Dashboard insight and detailed reasoning.
- Rebuild Understanding around four summary cards, 14-day capacity, structured Personal Direction, provenance, and editability rules.
- Implement History/Reflection and deterministic mentoring-completion learning signal.
- Add/adapt automated tests for every minimum behavior in the contract.
- Run full frontend tests, lint, and production build.
- Run integrated local browser verification of Scenario A, Scenario B, persistence, reflection, and reset.
- Re-read the contract and complete a final requirement audit.

## Current Blockers

None.

## Difficulties Encountered

- The original local `main` is divergent and dirty with unrelated untracked work. Resolution: preserve it and perform all phase work in the isolated sibling worktree.
- Repository graph indexing is unavailable. Resolution: inspect with repository read/search tools.
- Codex produced the RED test but repeatedly stalled before production edits; Antigravity remained at its startup banner for over two minutes. Both were stopped under the worker-stall policy. Hermes implemented the bounded shared-store foundation directly and verified it. Page work will be delegated again with smaller, non-overlapping file ownership.

## Exact Next Step

Next: delegate the exact Scenario A Ask Future Me page to Codex and the Dashboard/Calendar/Tasks/History presentation surfaces to Anti with non-overlapping file ownership, then inspect both diffs and run their focused tests.
