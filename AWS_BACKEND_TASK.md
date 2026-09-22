# Future Me AWS backend planning task contract

## HARD GATE

This is planning-only work. Never run `terraform apply`, never import an AWS resource, never deploy frontend/backend code, and never mutate AWS. AWS commands must be read-only. Stop with a real `terraform validate` and `terraform plan` plus artifacts for human approval.

## GOAL

Produce a reviewable, valid Terraform proposal and the smallest backend runtime adaptation needed for:

Browser -> existing Amplify frontend -> API Gateway HTTP API -> Lambda -> DynamoDB -> Bedrock

Browser -> Cognito User Pool -> JWT -> API Gateway JWT authorizer -> Lambda

API Gateway must reject missing/invalid JWT on protected routes before Lambda. Lambda/application code must derive the user identity from the validated JWT `sub` and must ignore client-supplied `userId` in Cognito mode.

## KNOWN FACTS (verified by Hermes on 2026-09-22)

- Worktree branch is `infra/aws-backend-plan`, based on `feat/phase2-live-intelligence-loop` at `07f13ef`.
- `PROJECT_STATUS.md` already has a pre-existing uncommitted roadmap rewrite. Preserve it; do not revert or overwrite unrelated content. If updating status, make only a narrow additive update.
- Repository had no `*.tf`, `.terraform.lock.hcl`, or Terraform state files before this task.
- Existing GitHub workflow: `.github/workflows/ci-cd.yml`; lint/test/Docker build/scan/push only. No AWS deployment job, no GitHub Actions secrets/variables/environments.
- Existing Amplify app is external and working: app ID `d6nuwvgegqhns`, name `FutureMe`, region `us-east-1`, repository `https://github.com/nguyenthanhdat2707/FutureMe`, branch `main`, stage `PRODUCTION`, auto-build enabled, last observed production status `SUCCEED`.
- Amplify build spec uses monorepo appRoot `frontend`, `npm install`, `npm run build`, artifact `dist`. Existing app env keys are only `AMPLIFY_DIFF_DEPLOY` and `AMPLIFY_MONOREPO_APP_ROOT`; branch env keys are empty. No Amplify backend environment exists.
- Do not create, replace, import, or modify the Amplify app.
- Frontend currently reads `VITE_API_BASE_URL`, defaults to local API, has no Cognito/auth library/config, no JWT acquisition, and sends no Authorization header. Do not implement or deploy frontend auth in this planning unit; document future variables/hand-off.
- Backend is Node/TypeScript/Express, currently started from `src/index.ts`; local persistence is `sql.js` SQLite; repository classes are synchronous and concrete.
- Current user-specific routes trust request body/query `userId` or default to `demo-user`; this is not acceptable in production Cognito mode.
- Current Bedrock provider uses `InvokeModelCommand`, model default `anthropic.claude-3-haiku-20240307-v1:0`, Anthropic messages payload, and SDK default credentials when explicit credentials are absent; service selection currently incorrectly requires static AWS key env vars.
- AWS account is `728033416182`; current CLI identity is IAM user `arn:aws:iam::728033416182:user/TDat_admin_CLi`; credentials come from the shared credentials file; no AWS env vars; default region is `ap-southeast-1`.
- Amplify is actually in `us-east-1`.
- Bedrock evidence:
  - `ap-southeast-1`: `anthropic.claude-3-haiku-20240307-v1:0` is ACTIVE and supports direct `ON_DEMAND`; account reports AUTHORIZED, entitlement AVAILABLE, region AVAILABLE.
  - `us-east-1`: the existing direct model is not listed for direct on-demand; an ACTIVE US inference profile `us.anthropic.claude-3-haiku-20240307-v1:0` routes to us-east-1/us-west-2. Same-region placement therefore requires an inference-profile config/IAM change and cross-region model routing.
- Proposed backend region for this plan: `ap-southeast-1`. Reasons: direct compatibility with the existing model ID/provider, likely lower browser latency for the current Vietnam-based MVP users, and existing CLI/account conventions. Amplify is static hosting, so this cross-region split has no service-to-service runtime dependency. Keep region configurable.
- Resource inventory:
  - us-east-1: no Cognito pools, HTTP APIs, REST APIs, or DynamoDB tables; one unrelated Lambda named `test`.
  - ap-southeast-1: no HTTP APIs, REST APIs, Lambdas, or DynamoDB tables; one unrelated empty Cognito pool `ap-southeast-1_YIMaakm7V` named `User pool - wk04iu`, deletion protection ACTIVE, one app client/domain, no tags. Leave it unmanaged; do not import/reuse.
  - Account has no IAM OIDC providers and no related Future Me/GitHub/Terraform/deployment roles or customer-managed policies.
  - One unrelated bucket `xbrain-tfstate-728033416182`; it is not referenced by this repo. Leave unmanaged.
- Baseline: backend tests 40/40 pass, backend build passes, frontend lint/build pass. Backend lint fails with 34 existing errors in Phase 2 test/Bedrock/context files. Do not broaden into unrelated lint cleanup, but new/modified production code must be clean and do not increase the count.
- Terraform CLI is 1.15.9. AWS CLI is 2.32.33. Lambda `nodejs24.x` is demonstrably supported in this account (existing unrelated function), while local app compiles to ES2022.

## IMPLEMENTATION INTENT

### Ownership and layout

Create two clearly separated Terraform roots:

1. `infra/bootstrap/` — one-time local bootstrap proposal for a dedicated Future Me S3 remote-state bucket and GitHub OIDC/roles. It must use local state and must not depend on the bucket it creates. Include S3 versioning, server-side encryption, public-access blocking, TLS-only access, lifecycle protection, and Terraform 1.15 native S3 lockfile support in the documented backend config. No DynamoDB lock table is needed.
2. `infra/terraform/` — backend application stack. Include an S3 backend block/config example, but run planning safely with `terraform init -backend=false` until the bootstrap is explicitly approved/applied. Never point at or reuse the unrelated xbrain state bucket.

Do not create any `aws_amplify_*` resource.

### Core Terraform graph

- Cognito User Pool with email sign-in/verification and deletion protection appropriate for production data.
- Public app client with no secret and browser-suitable SRP + refresh token flows.
- Seven simple PAY_PER_REQUEST DynamoDB tables matching existing repositories rather than a complex single-table abstraction:
  - users: PK `id`; indexes for email and googleId as needed by current repository methods.
  - personal context: PK `id`; index for userId + observedAt and a user+attribute access path.
  - decisions: PK `id`; index for userId + createdAt.
  - observations: PK `id`; index for userId + timestamp.
  - calendar events: PK `id`; indexes for userId + startTime and user+externalId.
  - outcomes: PK `id`; indexes for decisionId + observedAt and userId + observedAt.
  - feedback: PK `id`; indexes for targetId + createdAt and userId + createdAt.
  Use simple names and least attributes necessary. No provisioned capacity, VPC, NAT, ALB, EC2, ECS, EKS, RDS, Redis, WAF, custom networking, streams, or PITR unless code/evidence proves it is required now.
- Lambda Node.js 24 runtime, deterministic ZIP artifact built locally before plan, explicit timeout/memory appropriate for a small Express+Bedrock MVP, no VPC.
- Lambda execution role/policy limited to CloudWatch logs, the seven table/index ARNs, and `bedrock:InvokeModel` on the exact `ap-southeast-1` Claude 3 Haiku foundation-model ARN. No static credentials.
- Dedicated Lambda and API access log groups with finite retention.
- API Gateway HTTP API with CORS restricted to the verified Amplify production origin plus explicitly documented localhost development origins; Authorization and Content-Type headers only as needed.
- Lambda proxy integration payload v2.0.
- `GET /api/health` public.
- A protected `$default` route (or an equally small explicit protected route set) using a JWT authorizer so every other application route requires JWT before Lambda.
- Authorizer issuer exactly from the created User Pool and audience exactly the app client ID.
- Default auto-deploy stage with MVP throttling and JSON access logging.
- Lambda invoke permission scoped to this API.
- Outputs: API base URL including `/api`, Cognito User Pool ID, app client ID, Cognito region, Lambda name, DynamoDB table names, and frontend variable mapping. Use the existing `VITE_API_BASE_URL` and introduce explicit `VITE_COGNITO_USER_POOL_ID`, `VITE_COGNITO_USER_POOL_CLIENT_ID`, and `VITE_COGNITO_REGION` only in docs/example declarations. Do not mutate Amplify.

### GitHub OIDC/bootstrap model

- No GitHub Actions workflow in this unit.
- Bootstrap may define GitHub OIDC provider plus narrowly trusted roles:
  - plan role for this exact repository and pull-request subject, read-only infrastructure discovery plus state read/lock access;
  - apply role for this exact repository and `refs/heads/main`, with service actions/resources needed for this named stack and state access.
- Do not attach `AdministratorAccess` or create long-lived access keys.
- Document that the first approved bootstrap/apply is local; after state migration and role creation a later approved unit can add the workflow.

**Operator-Approved Deviation (2026-09-22):** By explicit operator decision, the `future-me-github-apply` role was granted AWS managed `AdministratorAccess`. The trust relationship remains strictly scoped to the exact immutable repository ID and `refs/heads/main`.

### Runtime adaptation

Preserve local SQLite and tests. Add the smallest explicit persistence abstractions/adapters needed so local/test use SQLite and Lambda production uses DynamoDB. Do not emulate SQLite by storing a database blob in DynamoDB. Prefer repository interfaces with awaitable methods or a clean factory/container; update route/service call sites to await both local and Dynamo implementations. Avoid rewriting stable intelligence/domain logic.

Add DynamoDB implementations for the existing access methods and tables above. Preserve dates/domain mappings and ownership checks. Add focused tests with a fake/mocked DynamoDB document client; tests must not call AWS.

Add a Lambda adapter (a standard small Express adapter dependency is acceptable). In production Cognito mode:

- Read identity only from API Gateway HTTP API v2 JWT claims in `requestContext.authorizer.jwt.claims`.
- Require a non-empty `sub` for protected requests.
- Pass the trusted subject into Express through an internal mechanism that the wrapper overwrites; do not trust a client-supplied internal header.
- All user-specific routes must call one identity helper that ignores body/query `userId` when `AUTH_MODE=cognito`.
- Verify ownership for ID-based reads/mutations such as decisions and context attributes.
- Local/test mode may retain body/query userId and `demo-user` fallback so current workflows remain usable.

Change Bedrock selection to an explicit production-safe setting such as `LLM_PROVIDER=bedrock`; use the AWS SDK default credential chain/execution role. Do not require `AWS_ACCESS_KEY_ID`/`AWS_SECRET_ACCESS_KEY` in Lambda. Keep mock provider for local/test. Parse Bedrock JSON safely enough not to add lint/type errors.

Health must work without initializing SQLite in Lambda and should report DynamoDB configuration without forcing a write. Do not make a Bedrock call during tests/planning.

Create a repeatable Lambda packaging command/script. Generated ZIP/staging output and `.terraform`/plan/state files must be ignored, while `.terraform.lock.hcl` should remain committable.

### Documentation/status

Create a concise deployment planning README under `infra/` with:

- ownership model and explicit Amplify exclusion;
- actual/proposed regions and Bedrock evidence/trade-offs;
- bootstrap -> backend init/plan commands;
- strict no-apply gate;
- frontend output/env handoff without mutating Amplify;
- route auth model;
- table/index access-pattern map;
- current resource-conflict classifications;
- cost/risks and the later approval/apply/verification sequence.

## SCOPE

May modify backend source/tests/package manifests/env examples/gitignore and add `infra/**`. May narrowly update `PROJECT_STATUS.md` without replacing its pre-existing roadmap rewrite.

## OUT OF SCOPE

- Terraform apply/import/state migration
- Any AWS write
- Amplify resources/config mutation
- Frontend auth/client implementation or deployment
- GitHub workflow implementation
- Bedrock inference calls
- UI/product features
- broad unrelated lint cleanup
- commit/push

## ACCEPTANCE CRITERIA

- Existing Amplify has zero Terraform resources and zero attempted changes.
- Core plan is valid in account `728033416182`, region `ap-southeast-1`, and proposes only creates; no change/destroy/import.
- Bootstrap plan is valid and separate; it does not depend on its own S3 backend.
- Protected API route graph uses API Gateway JWT authorization before Lambda; only health is public.
- Application identity comes from JWT `sub` in Cognito mode and client `userId` cannot override it.
- Local SQLite remains working.
- Dynamo repositories cover the real access patterns with focused tests and no live AWS calls.
- Lambda artifact is built and its compressed/uncompressed sizes are reported.
- Bedrock uses execution-role credentials and the exact direct model/IAM resource compatible with ap-southeast-1.
- `npm test`, `npm run build`, frontend lint/build, Terraform fmt/validate, and both Terraform plans are run. Backend lint must not regress from the 34-error baseline; ideally changed production files lint clean.
- Save plan binaries outside tracked files and render human-readable plan text plus machine-readable JSON summaries under an ignored planning-artifact path for Hermes review.

## VERIFICATION

Run and report exact results for:

- `npm test -- --runInBand`
- `npm run build`
- `npm run lint` (compare exact count to 34 baseline)
- focused Lambda/auth/Dynamo tests
- frontend `npm run lint && npm run build`
- Lambda package build and size inspection
- `terraform fmt -check -recursive infra`
- `terraform init -backend=false`, `terraform validate`, and `terraform plan -refresh=false` for bootstrap and application roots; use explicit `-var=aws_region=ap-southeast-1` if required
- `terraform show -json` parsed programmatically for add/change/destroy counts and resource addresses
- exact `git diff --check`, `git status`, and diff inspection

## STOP CONDITIONS

Stop and report instead of guessing if a plan requires AWS mutation/import, proposes any destroy/replace/change to an existing resource, tries to manage Amplify, needs a static AWS key, cannot preserve JWT-derived ownership, cannot preserve local SQLite tests, or cannot generate a real plan without a human-only credential/decision.
