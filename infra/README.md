# Future Me Infrastructure Plan

## Ownership Model & Amplify Exclusion
This infrastructure code manages the AWS backend for the Future Me application (Cognito, API Gateway, Lambda, DynamoDB). It explicitly **excludes** the management of the existing Amplify frontend application. The Amplify app (`d6nuwvgegqhns`) is unmanaged by Terraform to avoid disruption of the existing auto-build pipeline.

## Region Selection & Bedrock Trade-offs
- **Proposed Region**: `ap-southeast-1`
- **Reasoning**: The existing foundation model `anthropic.claude-3-haiku-20240307-v1:0` is directly available in `ap-southeast-1` as an on-demand resource. Hosting the API closer to the expected user base (Vietnam) in `ap-southeast-1` will reduce latency without introducing service-to-service latency issues between the frontend and backend.

## Architecture and Module Layout
The backend infrastructure is split into a bootstrap component and four application modules:
- **`bootstrap/`**: S3 state bucket with native S3 lockfiles and GitHub OIDC integration. No DynamoDB lock table is used.
- **`terraform/modules/identity/`**: Cognito User Pool (email-only) and Client.
- **`terraform/modules/storage/`**: Seven DynamoDB tables (`PAY_PER_REQUEST`).
- **`terraform/modules/runtime/`**: Node.js 24.x Lambda function, execution role with strict IAM scoping, and Bedrock invocation policies.
- **`terraform/modules/http-api/`**: API Gateway HTTP API v2 with JWT authorizer and parameterized logging.

## Planning Instructions (Strict No-Apply Gate)
This repository is currently under a **HARD GATE** for planning only. Do NOT run `terraform apply`. The infrastructure is NOT YET DEPLOYED OR APPLIED.

### Packaging
To prepare the artifact before planning:
```bash
npm run package:lambda
```
This isolates dependencies in `dist_lambda/` and creates a deterministic `lambda.zip` meeting the 50MB limit.

### Bootstrap (Local State)
The bootstrap configures the remote state bucket and OIDC roles using local state.
```bash
cd infra/bootstrap
terraform init
terraform plan
```
*(Do not apply without explicit approval)*

### Application Stack (Remote State Pending)
Before bootstrap is approved and applied, the S3 backend block remains a non-loaded example so a local pre-bootstrap plan can run safely:
```bash
cd infra/terraform
terraform init -backend=false
terraform validate
terraform plan -refresh=false -var="aws_region=ap-southeast-1" -var="expected_account_id=728033416182" -var="artifact_path=lambda.zip"
```

After an approved bootstrap apply creates the state bucket, activate and initialize the remote backend:
```bash
cd infra/terraform
cp backend.tf.example backend.tf
terraform init -reconfigure -backend-config=backend.hcl.example
```
The backend config uses Terraform 1.15 native S3 locking with `use_lockfile = true`; do not add a DynamoDB lock table. State migration and every apply remain separately approval-gated.

### Manual GitHub Actions deployment

The one-time bootstrap is applied. Application plans and applies run through `.github/workflows/terraform-application.yml` without long-lived AWS keys:

1. Open **Actions → Terraform Application → Run workflow**.
2. Select branch `main` and operation `plan` to review the remote-state plan artifact.
3. To deploy, run the workflow again with operation `apply` and confirmation `APPLY_APPLICATION`.

Every run rebuilds and tests the backend, creates a fresh Terraform plan, uploads the plan text/JSON/binary, and rejects any delete or replacement action. An apply uses the exact plan produced in the same job and verifies the public health endpoint afterward.

## Frontend Environment Handoff
Once approved and applied, the infrastructure will output values needed by the frontend. These should be manually added to the frontend environment without mutating the Amplify app via Terraform:
- `VITE_API_BASE_URL`: The API Gateway endpoint URL (e.g., `https://<id>.execute-api.ap-southeast-1.amazonaws.com/api`)
- `VITE_COGNITO_USER_POOL_ID`: The Cognito User Pool ID
- `VITE_COGNITO_USER_POOL_CLIENT_ID`: The Cognito App Client ID
- `VITE_COGNITO_REGION`: `ap-southeast-1`

## Route Auth Model
- **Public Routes**: `GET /api/health`
- **Protected Routes**: `$default` route uses a JWT authorizer. API Gateway validates the JWT token against the Cognito User Pool.
- **Identity Context**: The backend Lambda extracts the verified user identity (`sub`) directly from the API Gateway event (`requestContext.authorizer.jwt.claims.sub`). It passes this securely via a private symbol to ignore any client-supplied `userId` to ensure secure data access in production mode.
