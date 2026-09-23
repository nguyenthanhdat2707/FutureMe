# Public Demo Mode Without Cognito — Task Contract

## GOAL

Make the deployed Future-Me demo usable without Cognito sign-up/sign-in while retaining the existing Amplify -> API Gateway HTTP API -> Lambda -> DynamoDB/Bedrock topology. Visitors choose one of six synthetic personas and can exercise the product immediately.

## KNOWN FACTS

- API Gateway does not require an authorizer; the current `$default` route explicitly enables a Cognito JWT authorizer.
- Lambda currently runs with `AUTH_MODE=cognito`.
- The frontend already bypasses `RequireAuth` and omits Cognito tokens whenever `VITE_AUTH_MODE` is not `cognito`.
- Local-mode API calls currently trust body/query `userId`; this is too broad for a public production demo.
- Six synthetic Phase 4 personas and deterministic data are being implemented on this branch, but that partial work currently fails focused compile/lint/build gates.
- The Product Owner explicitly selected a public, authentication-free demo and accepted that synthetic personas have no privacy isolation.
- No AWS apply, deployment, Amplify mutation, Cognito deletion, or production data mutation is authorized by this implementation task.

## IMPLEMENTATION INTENT

- Add an explicit `demo` auth mode rather than overloading unrestricted local mode.
- In demo mode, derive identity only from `X-Demo-User`; accept exactly six deterministic persona IDs and reject missing/unknown values with 401. Ignore body/query identity in this mode.
- Make the frontend attach the selected persona ID to every API request and persist only the non-secret persona selection locally.
- Replace the obsolete Cognito-dependent Phase 4 seed identity with deterministic demo persona IDs and DynamoDB-only plan/apply/verify/rollback tooling.
- Make API Gateway's default route public and configure Lambda `AUTH_MODE=demo`; retain the existing Cognito resources in Terraform for reversible post-demo restoration and to avoid a destructive plan.
- Keep Cognito-mode code and tests working but unused by the demo deployment.

## SCOPE

- Backend identity utility and focused auth tests.
- Shared deterministic demo-persona metadata/IDs.
- Phase 4 dataset and seed CLI/tests, removing Cognito runtime requirements.
- Frontend persona configuration, selection UI, request header integration, and focused tests.
- Terraform HTTP API/runtime wiring and frontend environment output.
- Documentation/status updates required to reflect the changed security boundary.

## OUT OF SCOPE

- EC2 migration.
- Implementing a replacement real-user authentication provider.
- Destroying Cognito resources.
- AWS apply/deploy, production DynamoDB writes, Amplify environment changes, or production browser verification.
- Real user data, private data, or claims of tenant isolation.
- Unrelated product behavior or styling refactors.

## ACCEPTANCE CRITERIA

1. API Gateway `$default` route has `authorization_type = "NONE"` and no authorizer dependency.
2. Lambda production configuration uses `AUTH_MODE=demo`.
3. Demo mode rejects missing/unknown persona headers and accepts exactly the six source-controlled persona IDs.
4. Cognito mode still trusts only the validated JWT subject; local development behavior remains available.
5. Frontend in demo mode shows six persona choices, persists the selected non-secret ID, and sends `X-Demo-User` on every API request without a Cognito token.
6. Switching persona clears persona-specific decision session state and reloads product data.
7. Dataset generation uses deterministic demo IDs, produces exactly `6/28/8/16/6 = 64` records, and no longer creates or manages Cognito users/passwords.
8. Seed apply/verify/rollback remains exact-key, tagged, bounded, idempotent, and scan-free.
9. Cognito resources remain declared in Terraform but are unused by API/frontend demo configuration.
10. Backend/frontend focused and full tests, lint, builds, Terraform format/validate, plan command, and `git diff --check` pass.

## VERIFICATION

- Focused backend identity and demo-data tests.
- Focused frontend API/persona UI tests.
- Full backend `npm test`, `npm run lint`, `npm run build`.
- Full frontend `npm test`, `npm run lint`, `npm run build`.
- `npm run demo:phase4:plan` with exact counts.
- `terraform fmt -check -recursive` and `terraform validate` under `infra/terraform` without applying.
- Browser verification in local demo configuration if the app can be started without production mutation.
- Independent read-only code review after tests pass.

## STOP CONDITIONS

- Any path would expose or mutate real-user data.
- Terraform plan requires destroying Cognito or unrelated resources.
- Production mutation/deployment is needed to continue verification.
- Persona selection is treated as secure authentication or tenant isolation.
- A secret/password/token would be embedded in the browser bundle, logs, source, URL, or manifest.
