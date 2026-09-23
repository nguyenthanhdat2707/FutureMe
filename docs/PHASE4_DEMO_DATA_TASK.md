# Phase 4 Public Demo Personas and Evaluation Data Task Contract

> **Superseded identity model:** `docs/DEMO_MODE_WITHOUT_COGNITO_TASK.md` replaces the Cognito account/password and quick-login requirements below. The six-persona dataset and exact record-count contract remain authoritative, but personas now use deterministic public demo IDs, the seed CLI is DynamoDB-only, and the frontend switches personas without authentication.

## GOAL

Provide six isolated synthetic Cognito demo identities, deterministic DynamoDB datasets covering good and bad Phase 4 decision cases, and an optional quick-login chooser for public evaluation. The implementation must be safe to plan and test locally before any production mutation.

## CURRENT STATE

- Branch: `feat/phase4-demo-personas`, based on Phase 4 completion commit `60ca63044c023879e93f94a407e3d0cb23139f6f`.
- Phase 4 is 8/8 gates complete and `READY_FOR_USER_TEST`.
- The Product Owner selected public synthetic demo accounts with quick login.
- No production Cognito, DynamoDB, Amplify, infrastructure, or deployment mutation is currently authorized.

## SECURITY BOUNDARY

- Keep the existing Cognito password policy and JWT authentication unchanged.
- Backend identity remains the validated JWT `claims.sub`; request `userId` is never authoritative in Cognito mode.
- Each persona receives a separate Cognito user and separate `sub`.
- DynamoDB `user_id` and users-table `id` must equal that persona's actual Cognito `sub`.
- All data is synthetic. Never inspect, copy, modify, or delete real-user data.
- Never commit or log a password, access key, token, `.env`, or generated credential.
- The seed CLI reads the shared password only from `PUBLIC_DEMO_PASSWORD` at runtime.
- The frontend quick-login UI reads the intentionally public bundled password only from `VITE_PUBLIC_DEMO_PASSWORD`; it is disabled unless `VITE_ENABLE_PUBLIC_DEMO_LOGIN=true` and the password value is non-empty.
- Document clearly that `VITE_*` values are public browser configuration, not secrets.
- Public demo accounts are shared, mutable state. Document abuse/concurrency/cost limitations and the need for bounded monitoring/reset.

## DATASET VERSION AND IDENTIFIERS

- Seed version: `phase4-eval-v1`.
- Every non-users-table DynamoDB primary key begins with `phase4-eval-v1:` and is deterministic from persona slug, table kind, and record purpose. The users-table primary key is the persona's actual Cognito `sub`, as required by the JWT identity boundary.
- All seeded DynamoDB records include `seed_version`, `persona`, and `seeded_at` metadata.
- Relative timestamps are derived from one manifest `seededAt` value.
- Re-applying with the same manifest rewrites the exact same keys and must not create duplicates.
- Before writing any key, reject the operation if an existing record at that key does not have `seed_version=phase4-eval-v1`.
- Never scan-and-delete. Rollback may delete only exact manifest keys after verifying their seed tag and owner.

## SIX PERSONAS

The source-controlled persona metadata contains no passwords and may expose synthetic email addresses.

1. `focused-builder`
   - Display: Focused Builder
   - Expected flow: complete input -> `RECOMMEND/proceed`.
   - Demonstrates higher-authority user-confirmed evidence overriding newer inferred evidence.
   - Suggested decision input: time cost 4, available 20, workload 8, energy omitted.

2. `busy-balancer`
   - Display: Busy Balancer
   - Expected flow: `RECOMMEND/proceed-with-caution`.
   - Demonstrates a recent high workload increase and constrained remaining capacity.
   - Suggested decision input: time cost 4, available 20, workload 8, energy omitted.

3. `overloaded-lead`
   - Display: Overloaded Lead
   - Expected flow: `RECOMMEND/do-not-proceed`.
   - Demonstrates overloaded calendar/state plus consequential disruption; also contains expired evidence that must be ignored.
   - Suggested decision input: time cost 4, available 20, workload 8, energy omitted.

4. `needs-clarity`
   - Display: Needs Clarity
   - Expected flow: omit availability/deadline -> `ASK`; answer canonical `availableHoursBeforeDeadline` -> `RECOMMEND`.
   - Suggested decision input: time cost 4 and workload 8, without availability/deadline.

5. `uncertain-skipper`
   - Display: Uncertain Skipper
   - Expected flow: omit availability/deadline -> `ASK`; continue without resolving -> `ABSTAIN`.
   - Suggested decision input: time cost 4 and workload 8, without availability/deadline.

6. `conflict-check`
   - Display: Conflict Check
   - Expected flow: complete input plus a relevant equal-authority/equal-freshness stable-entity conflict -> `ASK`; unresolved retry -> `ABSTAIN`.
   - Contains two `USER_CONFIRMED` goal records with the same parsed goal ID and identical `observed_at`, but materially different canonical values.
   - Also contains an unrelated goal that must not enter the conflict group.

Synthetic usernames use the deterministic form `phase4-eval-v1-<slug>@example.com` unless a deployment-specific non-real test domain is explicitly configured. Cognito users are created administratively with messages suppressed and `email_verified=true`.

## EXACT DYNAMODB COUNTS

| Persona | users | personal-context | observations | calendar-events | decisions | Total |
|---|---:|---:|---:|---:|---:|---:|
| focused-builder | 1 | 6 | 1 | 2 | 1 | 11 |
| busy-balancer | 1 | 5 | 2 | 4 | 1 | 13 |
| overloaded-lead | 1 | 5 | 2 | 6 | 1 | 15 |
| needs-clarity | 1 | 3 | 1 | 1 | 1 | 7 |
| uncertain-skipper | 1 | 3 | 1 | 1 | 1 | 7 |
| conflict-check | 1 | 6 | 1 | 2 | 1 | 11 |
| **Total** | **6** | **28** | **8** | **16** | **6** | **64** |

The manifest records these expected counts and every exact table/key pair.

## RECORD SHAPES

Generate raw DynamoDB document items compatible with current repository mappers.

### users

Required: `id` (Cognito `sub`), `email`, `display_name`, `created_at`, `updated_at`, plus seed metadata. Never store password or tokens.

### personal-context

Required: `id`, `user_id`, `attribute`, `value` (JSON string except `setup_completed` may be JSON boolean text), `confidence`, `source`, `observed_at`, `created_at`; optional `valid_until`; plus seed metadata.

Context rows implement the exact per-persona counts using:

- `setup_completed` and `calendar_last_sync` markers where allocated;
- goals/preferences/commitments with stable parsed entity IDs;
- authority/freshness/expiry/conflict variants described above.

### observations

Required: `id`, `user_id`, `type`, `data` (JSON string), `source`, `timestamp`, `confidence`, `created_at`, plus seed metadata.

### calendar-events

Required: `id`, `user_id`, `external_id`, `title`, `start_time`, `end_time`, `status`, `raw_data` (JSON string), `synced_at`, `created_at`, plus seed metadata. Events are future-relative to `seededAt` and do not overlap unless deliberately testing capacity.

### decisions

Required: `id`, `user_id`, `question`, `context_snapshot` (JSON string), `recommendation` (JSON string), `user_choice=null`, `status=PENDING`, `created_at`, plus seed metadata. These are display/history fixtures only and must not impersonate a stored user choice.

## CLI CONTRACT

Implement a TypeScript CLI with commands:

- `plan`: generate and validate persona definitions/counts without AWS calls or requiring a password.
- `apply`: create/read the six Cognito users, set the runtime password permanently, capture actual `sub` values, preflight exact DynamoDB keys, write only safe tagged keys, and write a non-secret manifest.
- `verify`: read every exact manifest identity/key and assert exact counts, ownership, and seed tags.
- `rollback`: verify tags/ownership, delete exact DynamoDB keys, then delete only manifest-listed Cognito usernames.

Required runtime configuration for mutation commands:

- `AWS_REGION`
- `COGNITO_USER_POOL_ID`
- `USERS_TABLE`
- `CONTEXT_TABLE`
- `OBS_TABLE`
- `CALENDAR_TABLE`
- `DECISIONS_TABLE`
- `PUBLIC_DEMO_PASSWORD` for `apply` only
- explicit confirmation argument exactly equal to `phase4-eval-v1`

Default manifest path: `.phase4-eval/manifest.json`; add `.phase4-eval/` to `.gitignore`.

The CLI must:

- never print the password;
- fail closed on missing configuration, mismatched version, malformed manifest, wrong owner, wrong tag, unexpected counts, or Cognito `sub` drift;
- use bounded batch sizes and retry unprocessed DynamoDB writes;
- produce deterministic sorted manifest entries;
- avoid table scans;
- leave enough manifest state for exact rollback after partial failure;
- never delete a pre-existing Cognito user unless the manifest proves it belongs to this seed version and the username matches the deterministic prefix.

## QUICK-LOGIN UX

- Keep normal Sign In/Sign Up/Confirm unchanged.
- On the Cognito sign-in view only, and only when explicitly enabled, render a separate `Public demo personas` section with six persona buttons/cards.
- Each card shows display name, short scenario, and expected policy journey; it contains no password.
- Clicking a persona performs the same Cognito sign-in path using that persona's synthetic email and the runtime `VITE_PUBLIC_DEMO_PASSWORD`.
- Loading/error state is shared with normal sign-in and prevents duplicate submissions.
- The selected persona email may be shown; the password must not be rendered, logged, persisted to storage, URL parameters, or error messages.
- If the feature is disabled or misconfigured, no demo UI is rendered and normal auth behavior is unaffected.

## EXPECTED FILE SCOPE

The implementation worker may add or modify only files needed for this unit, expected to include:

- `.gitignore`
- `package.json` and lockfile only for the official Cognito Identity Provider SDK dependency and CLI scripts
- `src/demo/phase4-evaluation-dataset.ts`
- `scripts/phase4-evaluation-data.ts`
- focused backend/unit tests for generator, validation, manifest safety, and dry-run behavior
- `frontend/src/config/demo-personas.ts`
- `frontend/src/pages/AuthPage.tsx`
- `frontend/src/pages/AuthPage.test.tsx`
- `frontend/src/vite-env.d.ts`
- this task/status documentation

Do not modify Terraform, JWT middleware, Cognito pool policy, API routes, frozen decision policy, production environment files, or unrelated UI.

## ACCEPTANCE CRITERIA

- Pure dataset generation yields exactly six personas and 64 DynamoDB records with the table counts above.
- All IDs, usernames, emails, timestamps, seed tags, and manifest entries satisfy the deterministic contract.
- Tests prove idempotent key generation, count validation, conflict fixture identity/tie semantics, expired evidence, authority/freshness fixtures, manifest serialization without credentials, overwrite rejection, and exact rollback selection.
- Quick-login UI is absent by default, displays six personas only when correctly enabled, authenticates through the existing Cognito flow, and never renders/persists/logs the password.
- Existing auth tests still pass.
- Backend and frontend test/lint/build gates pass.
- `npm run demo:phase4:plan` succeeds locally without AWS credentials and prints only non-secret counts/metadata.
- No AWS call, production mutation, deployment, commit, or push occurs during worker implementation.

## VERIFICATION

Required local evidence:

- focused dataset/CLI tests;
- focused AuthPage tests;
- full backend tests, lint, build;
- full frontend tests, lint, build;
- `git diff --check`;
- local `plan` command with exact six-persona/64-record summary;
- browser proof that disabled configuration hides quick login and enabled non-production test configuration renders six cards without exposing the password in visible text, storage, or URL.

Production verification is deferred until explicit authorization and must include exact Cognito/DynamoDB readback, count assertions, per-persona authenticated API checks, quick-login browser checks, and rollback safety proof.

## STOP CONDITIONS

Stop and report rather than guessing if:

- implementation requires weakening real-account auth or trusting request identity;
- a password/credential would enter source control, logs, manifest, URL, or browser storage;
- exact table names or Cognito pool are unavailable for a requested mutation;
- any deterministic key is occupied by an untagged/non-matching record;
- a Cognito username exists with a mismatched seed ownership contract;
- production mutation, Amplify configuration, deployment, or infrastructure change is required without explicit authorization;
- scope expands into Phase 5/6/7 product behavior or real Google Calendar integration.
