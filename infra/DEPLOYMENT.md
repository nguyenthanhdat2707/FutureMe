# Future-Me Deployment Plan

## AWS Backend Architecture
The backend is structured into four main Terraform modules:
1. `identity`: Manages Amazon Cognito User Pools and User Pool Clients for authenticating API requests.
2. `storage`: Configures 7 DynamoDB tables using on-demand billing (`PAY_PER_REQUEST`). Includes Global Secondary Indexes configured for query access patterns.
3. `runtime`: Proposes the main Lambda function on **Node.js 24.x** to serve the Express API along with IAM roles allowing DynamoDB access and Bedrock `InvokeModel`.
4. `http-api`: Sets up an API Gateway HTTP API (v2) with a JWT Authorizer pointing to the Cognito User Pool, and creates proxy integration with the Lambda function.

## Status
**NOT DEPLOYED**. This repository is under a strict no-apply gate. The instructions below outline the required steps for human execution when approved.

## Prerequisites
- AWS CLI configured with administrator permissions for the target account `728033416182`.
- Target region: `ap-southeast-1`.
- A Node.js version supported by the repository toolchain; the proposed Lambda runtime is Node.js 24.x.

## Deployment Steps
1. **Package Backend:** 
   - Run `npm run package:lambda` from the root to produce `infra/terraform/lambda.zip`. This installs production dependencies with `npm ci --omit=dev` inside the isolated `dist_lambda/` staging directory, normalizes timestamps and entry order, and leaves root `node_modules` unchanged.
2. **Bootstrap (One-Time Execution):** 
   - Execute `terraform init` and `terraform plan` in `infra/bootstrap` using local state.
   - Upon approval, apply to deploy the S3 state bucket `future-me-tfstate-728033416182` and GitHub OIDC roles.
3. **Application Stack:**
   - Before bootstrap is applied, keep `backend.tf.example` inactive and execute `terraform init -backend=false`, `terraform validate`, and `terraform plan -refresh=false` in `infra/terraform`.
   - After a separately approved bootstrap apply, copy `backend.tf.example` to `backend.tf` and run `terraform init -reconfigure -backend-config=backend.hcl.example`. The backend uses native S3 lockfiles; no DynamoDB lock table is used.
   - State migration and application apply require separate explicit approval.
4. **Environment Handoff:**
   - Consume the outputs produced by Terraform (`api_base_url`, `cognito_user_pool_id`, `cognito_user_pool_client_id`) in the existing, externally managed Amplify Frontend application via environment variables.

## Rollback Planning
No rollback action is authorized in this planning unit. Cognito deletion protection and the state bucket's `prevent_destroy` intentionally block casual destruction. Any future rollback or destroy requires a reviewed plan, data-retention decision, and explicit approval.
