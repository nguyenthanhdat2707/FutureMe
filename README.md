# Future Me MVP - Backend Foundation

A backend service built with TypeScript, Express, and AWS Lambda, using DynamoDB for storage.

## Building and Packaging

```sh
npm install
npm run build
npm run package:lambda
```

The `package:lambda` command packages the application into `infra/terraform/lambda.zip` with deterministic timestamps and isolated production dependencies.

## Deployment

Refer to [DEPLOYMENT.md](DEPLOYMENT.md) for detailed deployment instructions.
