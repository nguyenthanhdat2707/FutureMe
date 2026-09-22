# AWS Terraform Pre-Apply Report

## Current AWS State

- Account and principal: account `728033416182`, IAM user `arn:aws:iam::728033416182:user/TDat_admin_CLi`.
- Credential/profile mechanism: shared credentials file; no profile override; configured default region `ap-southeast-1`.
- Existing hosting: Amplify app `d6nuwvgegqhns` (`FutureMe`) in `us-east-1`, repository `nguyenthanhdat2707/FutureMe`, production branch `main`; latest observed production status `SUCCEED`.
- Existing relevant resources: the approved bootstrap has created state bucket `future-me-tfstate-728033416182`, the GitHub OIDC provider, and scoped `future-me-github-plan` / `future-me-github-apply` roles. No Future-Me application DynamoDB tables, Lambda function, HTTP API, Cognito pool, or application log groups are deployed. The unrelated Cognito pool and unrelated `xbrain` state bucket remain unmanaged.
- Bedrock: direct model `anthropic.claude-3-haiku-20240307-v1:0` is currently `ACTIVE` in `ap-southeast-1`.
- Post-bootstrap readback confirms `11 added / 0 changed / 0 destroyed`; the state bucket is private, versioned, AES256-encrypted, lifecycle-managed, and non-public. No application resource has been created, imported, deployed, changed, or deleted.

## Current Repository State

- Branch: `infra/aws-backend-plan`; working tree is intentionally dirty with the uncommitted AWS backend planning implementation and pre-existing project changes.
- Terraform is split into `infra/bootstrap` and `infra/terraform`. Bootstrap uses local state; application remote-backend files remain examples until bootstrap is approved and applied.
- Existing Amplify hosting and deployment ownership remain external to Terraform.
- Backend runtime: TypeScript/Express Lambda adapter, Node.js 24.x, deterministic ZIP package at `infra/terraform/lambda.zip`.
- Persistence: SQLite remains for local/test; Lambda selects DynamoDB through explicit repository interfaces.
- LLM: Lambda selects Bedrock through the AWS SDK default credential chain and execution role; no static AWS keys are configured.
- Frontend: still consumes `VITE_API_BASE_URL`; Cognito/JWT client integration and Amplify environment handoff remain future work and were not deployed here.

## Ownership Model

| Resource/configuration | Owner | Status | Rationale |
|---|---|---|---|
| Existing Amplify app `d6nuwvgegqhns` | Existing unmanaged | Leave unchanged | Avoid duplicate hosting/deployment ownership |
| Unrelated Cognito pool and `xbrain` state bucket | Existing unmanaged | Leave unchanged | Not Future-Me dependencies |
| Future-Me state bucket, S3 security controls, GitHub OIDC provider and roles | Bootstrap Terraform root | Applied and verified | One-time bootstrap using local state |
| Cognito, seven DynamoDB tables, Lambda/IAM/logs, HTTP API/JWT routes | Application Terraform root | Proposed create | Cohesive backend stack |
| Amplify frontend environment values | Manual handoff after approved apply | Pending | Terraform outputs values but does not mutate Amplify |
| Imports | None | Not proposed | Inventory found no matching Future-Me resources |

## Proposed Runtime Architecture

```text
Browser
  -> existing external Amplify hosting (us-east-1)
  -> Cognito public app client
  -> API Gateway HTTP API (ap-southeast-1)
       GET /api/health -> public
       $default        -> JWT authorizer
  -> Lambda nodejs24.x / dist/lambda.handler
  -> seven PAY_PER_REQUEST DynamoDB tables
  -> Bedrock Claude 3 Haiku direct model
```

API Gateway validates JWT issuer and audience before protected requests reach Lambda. The Lambda adapter reads `requestContext.authorizer.jwt.claims.sub`, stores it in a private symbol-carried request field, and Cognito mode ignores client body/query/header `userId` values.

## Proposed Terraform Resource Graph

Bootstrap:

```text
S3 state bucket
  -> versioning
  -> AES256 server-side encryption
  -> public-access block
  -> TLS-only bucket policy
  -> noncurrent-version lifecycle
GitHub OIDC provider
  -> pull-request plan role + state-read/native-lock policy
  -> main-branch apply role + scoped stack-management policy
```

Application:

```text
Cognito pool -> public app client -> JWT authorizer -> protected API route
DynamoDB tables -> Lambda execution policy -> Lambda -> API integration/routes/stage
Lambda/API -> dedicated CloudWatch log groups with 14-day retention
```

Exact managed addresses are recorded in `planning-artifacts/plan-summary.json` and the machine-readable plan JSON files.

## Data Model and Access Patterns

All tables use PK `id`, PAY_PER_REQUEST billing, and `ALL` projection for listed GSIs.

| Table | GSIs | Repository operations served |
|---|---|---|
| users | `email-index` (`email`); `googleId-index` (`google_id`) | by ID, email, Google ID |
| personal context | `userId-observedAt-index`; `userId-attribute-index` | by user/time and user/attribute |
| decisions | `userId-createdAt-index` | by ID and user chronology |
| observations | `userId-timestamp-index` | by ID, user, and recent time window |
| calendar events | `userId-startTime-index`; `userId-externalId-index` | user time range and external-ID upsert |
| outcomes | `decisionId-observedAt-index`; `userId-observedAt-index` | by decision and by user chronology |
| feedback | `targetId-createdAt-index`; `userId-createdAt-index` | by target and by user chronology |

The final plan JSON confirms the exact GSI key schemas, including the two users-table indexes required by `DynamoUserRepository`.

## Region Decision

- Existing hosting region: `us-east-1`.
- Proposed backend region: `ap-southeast-1`.
- Model: direct on-demand `anthropic.claude-3-haiku-20240307-v1:0`; IAM is scoped to its exact `ap-southeast-1` foundation-model ARN.
- Reason: direct compatibility with current code/model ID and lower expected latency for Vietnam-based MVP users. Amplify serves static assets, so the cross-region hosting split does not create a server-to-server runtime dependency.

## Resource-Conflict Classification

| Existing/proposed resource | Classification | Evidence/action |
|---|---|---|
| Existing Amplify app | EXISTING / LEAVE UNMANAGED | No `aws_amplify_*` resources in source or plans |
| Unrelated Cognito pool | EXISTING / LEAVE UNMANAGED | Different name/ownership; no import or reuse |
| Unrelated `xbrain` state bucket | EXISTING / LEAVE UNMANAGED | Not referenced by this repository |
| Future-Me state bucket/OIDC/roles | CREATED / TERRAFORM MANAGED | Applied from the reviewed create-only bootstrap plan and verified by AWS readback |
| Future-Me app resources | SAFE TO CREATE | No matching Future-Me API, Lambda, tables, pool, or log groups found |

## Terraform Plan Summary

- Terraform CLI: `1.15.9`.
- Bootstrap provider: `hashicorp/aws 5.100.0`.
- Application provider: `hashicorp/aws 6.66.0` with `~> 6.0` constraints across root/modules.
- Bootstrap result: reviewed plan `11 create / 0 update / 0 delete / 0 replace / 0 import`; apply completed `11 added / 0 changed / 0 destroyed`.
- Application plan: `21 create / 0 update / 0 delete / 0 replace / 0 import`.
- Imported resources: none.
- Existing working resources touched: none.
- Amplify resources: none.
- Planning method: new stateless proposal with `-refresh=false`; AWS identity/provider configuration still used real account credentials and the application provider restricts `allowed_account_ids` to `728033416182`.
- Artifacts (ignored by Git):
  - `planning-artifacts/bootstrap-final.tfplan`
  - `planning-artifacts/bootstrap-final.txt`
  - `planning-artifacts/bootstrap-final.json`
  - `planning-artifacts/application-final.tfplan`
  - `planning-artifacts/application-final.txt`
  - `planning-artifacts/application-final.json`
  - `planning-artifacts/plan-summary.json`

No destroy, replacement, import, or existing-resource change appears in either plan.

## Security Model

- Cognito client is public (`generate_secret = false`) with SRP and refresh-token flows.
- API Gateway route `GET /api/health` is public; `$default` requires JWT.
- Authorizer issuer comes from the created User Pool and audience from the created app client.
- Application identity is derived from validated JWT `sub`; spoofed client identity cannot override it in Cognito mode.
- Lambda role grants log stream/events, DynamoDB item/query actions on only the seven table/index ARNs, and `bedrock:InvokeModel` on the exact model ARN.
- Lambda uses execution-role credentials; no static keys exist in Terraform or Lambda environment values.
- GitHub OIDC trust is restricted to repository `nguyenthanhdat2707/FutureMe`: pull requests for plan and `refs/heads/main` for apply.
- `iam:PassRole` is limited to the exact Lambda role and `lambda.amazonaws.com`.
- Plan role may read state and write/delete only the `.tflock` object; it cannot write/delete the state object.
- State proposal includes versioning, AES256 encryption, public-access blocking, TLS-only access, `prevent_destroy`, and Terraform native S3 lockfiles. No DynamoDB lock table is used.

## Cost-Relevant Resources

- Primarily request-driven: Lambda requests/duration, HTTP API requests, DynamoDB on-demand traffic/storage, Cognito MAU, and Bedrock tokens.
- CloudWatch logs have 14-day retention.
- S3 state storage/versioning has small ongoing storage/request cost.
- Intentionally absent: VPC, NAT Gateway, ALB, EC2, ECS/EKS, RDS, Redis, WAF, and provisioned DynamoDB capacity.

## Verification Evidence

- Backend lint, TypeScript no-emit check, and build: PASS.
- Backend tests: 11/11 suites and 72/72 tests PASS; coverage 76.97% statements, 57.55% branches, 78.04% functions, 78.66% lines.
- Frontend lint/build: exit 0 and production build PASS; one existing `react(set-state-in-effect)` warning remains at `frontend/src/pages/ContextPage.tsx:30`; no frontend test suite is configured.
- Lambda package: two consecutive final builds produced SHA-256 `7ee70f35c1c4824e1275e23f5993d39a9eac88e65c2e8c42912e5f99268672fb`; 14,667,392 compressed bytes and 39,503,005 uncompressed bytes; ZIP integrity and `dist/lambda.js` verified.
- Terraform recursive fmt and both root validations: PASS with no warnings.
- Machine-parsed plans: exactly 11 and 21 creates; zero update/delete/replace/import; declared counts match enumerated addresses.
- Repository hygiene: `git diff --check` PASS; no root `:memory:` scratch file after the full test run.

## Risks / Decisions Needed

- The existing frontend does not yet acquire Cognito tokens or attach Authorization headers. Applying infrastructure alone will not produce a complete authenticated browser flow; frontend auth/config is a later scoped unit.
- Bootstrap must occur first. After an approved bootstrap apply, activate `backend.tf.example`, initialize/migrate remote state, regenerate the application plan against that backend, and obtain separate approval before application apply.
- The frontend lint warning and absence of frontend tests remain visible verification debt but do not alter this infrastructure plan.
- Cognito deletion protection and state-bucket `prevent_destroy` intentionally make rollback a separately planned action.

## Final Pre-Apply Verdict

`SAFE TO APPLY`

The bootstrap is applied and verified. The reviewed application plan meets the acceptance criteria and contains create-only changes with no Amplify ownership conflict. Application execution remains gated behind the manual GitHub Actions workflow, a fresh remote-state plan, destructive-action guard, and exact `APPLY_APPLICATION` confirmation.
