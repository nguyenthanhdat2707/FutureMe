# Deployment

The CI/CD workflow builds and publishes the backend image as
`ghcr.io/<owner>/<repository>:<commit-sha>`. The image listens on port `3000`
and exposes `GET /api/health` for readiness and smoke checks.

## Required configuration

Configure these GitHub settings before enabling deployments:

- **Packages**: allow GitHub Actions to write packages for the repository. The
  workflow uses `GITHUB_TOKEN` to publish to GHCR.
- **Staging environment**: create an environment named `staging`, add the
  deployment credentials/secrets used by the selected platform, and set
  `STAGING_URL` to the externally reachable base URL when it differs from the
  workflow default.
- **Production environment**: create an environment named `production`, add
  the production deployment credentials, and set `PROD_URL` when it differs
  from `https://future-me.example.com`.
- **Deployment command**: replace the placeholder commands in
  `.github/workflows/ci-cd.yml` with the command for the hosting platform
  (Kubernetes, Docker Compose, ECS, or another managed service). The command
  must deploy the image identified by `${{ github.sha }}`.

## Runtime settings

Set the following environment variables in the service configuration:

- `PORT` — optional; defaults to `3000`.
- `NODE_ENV` — set to `production`.
- `DEMO_MODE` — set to `true` only when demo behavior is desired.

The application initializes its SQL.js database on startup. Provide a
persistent volume only if the chosen deployment adds durable database storage;
the container itself remains stateless from the image's point of view.

## Manual verification

After deployment, verify the service from a network that can reach it:

```sh
curl --fail "$STAGING_URL/api/health"
```

The workflow's smoke test performs the same health check and also requests
`/api/context`.
