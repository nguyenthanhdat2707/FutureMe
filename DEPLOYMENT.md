# Deployment

The infrastructure is provisioned using Terraform, and the backend is deployed as an AWS Lambda function.

## Packaging

Before planning or deploying, build and package the Lambda application:

```sh
npm run package:lambda
```

This script compiles TypeScript, isolates production dependencies, and deterministically creates `infra/terraform/lambda.zip`.

## Infrastructure provisioning

Use Terraform to plan and apply changes in `infra/terraform`. The configuration will automatically consume the generated `lambda.zip`.

```sh
cd infra/terraform
terraform init
terraform plan
terraform apply
```
