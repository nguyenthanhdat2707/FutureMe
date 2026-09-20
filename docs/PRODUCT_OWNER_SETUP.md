# Product Owner Setup Queue

This document tracks external setup tasks that only the Product Owner can complete. Engineering continues with mocks/stubs until these become available.

---

## Status Legend

- ⏳ **READY NOW** — Engineering needs this soon
- 🔜 **NOT NEEDED YET** — Required later in MVP
- ⏸️ **DEFERRED** — Post-MVP

---

## ⏳ Google Calendar OAuth Setup

**Needed for:** Real Calendar integration testing and live sync

**Engineering dependency:**
- CalendarAdapter interface: ✅ Can implement without credentials
- MockCalendarAdapter: ✅ Can implement without credentials
- Frontend Calendar UI: ✅ Can implement without credentials
- Real OAuth integration test: ❌ **BLOCKS HERE** — requires credentials

**When engineering actually needs it:** Day 3 (for integration testing)

**Setup steps:**

1. **Create or select Google Cloud Project**
   - Go to https://console.cloud.google.com
   - Create new project or select existing: "Future-Me-MVP" (or similar)

2. **Enable Google Calendar API**
   - Navigate to "APIs & Services" → "Library"
   - Search "Google Calendar API"
   - Click "Enable"

3. **Configure OAuth Consent Screen**
   - Go to "APIs & Services" → "OAuth consent screen"
   - Choose "External" (for testing) or "Internal" (if Google Workspace)
   - Fill required fields:
     - App name: "Future Me MVP"
     - User support email: your email
     - Developer contact: your email
   - Scopes: Add `https://www.googleapis.com/auth/calendar.readonly` (read-only for MVP)
   - Save

4. **Create OAuth 2.0 Client ID**
   - Go to "APIs & Services" → "Credentials"
   - Click "Create Credentials" → "OAuth client ID"
   - Application type: "Web application"
   - Name: "Future Me Web Client"
   - Authorized redirect URIs:
     - `http://localhost:3000/api/auth/google/callback` (local dev)
     - Add production URL later if deployed

5. **Save credentials**
   - Copy **Client ID** and **Client Secret**
   - Store in local `.env` file (see `.env.example`)
   - **DO NOT COMMIT** these to Git

6. **Add test users** (if using External consent screen)
   - Go to OAuth consent screen → "Test users"
   - Add your Google account email

**Required values:**

```bash
GOOGLE_CLIENT_ID=<your-client-id>.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=<your-client-secret>
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google/callback
```

**Where to store:** Add to `.env` file in project root (Git-ignored)

**How to verify:**
```bash
npm run dev
# Navigate to http://localhost:3000/api/auth/google
# Should redirect to Google login
# After login, should redirect back with auth code
```

**What engineering can continue without this:**
- ✅ All adapter interfaces
- ✅ MockCalendarAdapter implementation
- ✅ Frontend Calendar components with mock data
- ✅ Error handling and recovery UI
- ✅ Unit tests with mocked dependencies
- ✅ Demo Mode (uses fixtures, not real Calendar)

---

## ⏳ AWS Authentication & Bedrock Access

**Needed for:** LLM Context Analyst and Decision Engine

**Engineering dependency:**
- LLMProvider interface: ✅ Can implement without credentials
- BedrockLLMProvider: ✅ Can implement without credentials
- MockLLMProvider: ✅ Can implement without credentials
- Real Bedrock inference test: ❌ **BLOCKS HERE** — requires credentials

**When engineering actually needs it:** Day 2-3 (for Decision Engine testing)

**Setup steps:**

1. **AWS Account Setup**
   - Ensure AWS account is available
   - Select region with Bedrock support (recommend: `us-east-1` or `us-west-2`)

2. **Request Bedrock Model Access**
   - Go to AWS Console → Bedrock → Model access
   - Request access to desired models:
     - **Claude 3.5 Sonnet** (recommended for quality)
     - OR **Claude 3 Haiku** (faster, cheaper for MVP)
   - Wait for approval (usually instant for standard models)

3. **Create IAM User or Role**
   - Go to IAM → Users → Create user
   - User name: `future-me-dev`
   - Attach policy: `AmazonBedrockFullAccess` (or create custom policy with minimal permissions)
   - Save Access Key ID and Secret Access Key

   **OR** use existing AWS credentials if available

4. **Configure local AWS credentials**
   - Option A: AWS CLI
     ```bash
     aws configure
     # AWS Access Key ID: <your-key>
     # AWS Secret Access Key: <your-secret>
     # Default region: us-east-1
     # Default output format: json
     ```
   - Option B: Environment variables in `.env`
     ```bash
     AWS_ACCESS_KEY_ID=<your-key>
     AWS_SECRET_ACCESS_KEY=<your-secret>
     AWS_REGION=us-east-1
     ```

**Required values:**

```bash
AWS_REGION=us-east-1
BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20240620-v1:0
# OR
BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0

# If using .env (not AWS CLI):
AWS_ACCESS_KEY_ID=<your-access-key>
AWS_SECRET_ACCESS_KEY=<your-secret-key>
```

**Where to store:** Either `~/.aws/credentials` (AWS CLI) or `.env` file

**How to verify:**
```bash
npm run test:bedrock-connection
# Should successfully call Bedrock API and receive response
```

**What engineering can continue without this:**
- ✅ LLMProvider interface
- ✅ MockLLMProvider (returns deterministic responses)
- ✅ Request/response type definitions
- ✅ Error handling
- ✅ Retry logic
- ✅ Unit tests with mocked LLM
- ✅ Frontend Decision UI with mock responses
- ✅ Demo Mode (uses pre-generated mock responses)

---

## 🔜 Production Database (PostgreSQL)

**Needed for:** Production deployment (NOT MVP local development)

**Current state:** Using SQLite for local MVP development

**When engineering actually needs it:** Post-MVP or when deploying to staging/production

**Setup steps:**

1. **Choose database approach:**
   - Option A: Amazon RDS PostgreSQL
   - Option B: Local PostgreSQL in Docker (for development)
   - Option C: Continue with SQLite (acceptable for MVP demo)

2. **If using RDS:**
   - Create RDS PostgreSQL instance
   - Configure security group
   - Save connection string

3. **If using Docker:**
   - Already included in `docker-compose.yml`
   - No additional setup required

**Required values:**
```bash
DATABASE_PROVIDER=postgresql
DATABASE_URL=postgresql://user:password@host:5432/futureme
```

**Decision required:** SQLite (current) vs PostgreSQL for MVP?

**What engineering can continue without this:**
- ✅ All application code (uses repository interfaces)
- ✅ Local development with SQLite
- ✅ All tests
- ✅ Demo Mode
- ✅ Migration scripts (database-agnostic)

---

## 🔜 Deployment Infrastructure

**Needed for:** Live deployment (NOT required for local MVP demo)

**When engineering actually needs it:** Day 5 or post-MVP

**Setup steps:**
1. Choose deployment target (AWS ECS, App Runner, EC2, Lambda, etc.)
2. Configure CI/CD pipeline
3. Set up production secrets management
4. Configure DNS if needed

**Decision required:** Deployment approach and timeline

**What engineering can continue without this:**
- ✅ All local development
- ✅ Containerized application (Docker)
- ✅ CI pipeline (validation, test, build)
- ✅ Demo Mode for hackathon presentation

---

## ⏸️ Production Monitoring & Observability

**Status:** DEFERRED — Post-MVP

**When needed:** After production deployment

**Potential tools:**
- AWS CloudWatch
- Application logs
- Error tracking (Sentry, etc.)

---

## ⏸️ Production Secrets Management

**Status:** DEFERRED — Post-MVP

**When needed:** Before production deployment

**Potential approach:**
- AWS Secrets Manager
- Environment-specific configuration
- Secure credential rotation

---

## Summary Table

| Setup Item | Status | Blocks | Engineering Can Continue |
|------------|--------|--------|--------------------------|
| Google Calendar OAuth | ⏳ READY NOW | Live Calendar integration test | All adapters, UI, mocks, Demo Mode |
| AWS Bedrock Access | ⏳ READY NOW | Live LLM inference test | All interfaces, mocks, UI, Demo Mode |
| PostgreSQL | 🔜 NOT NEEDED YET | Production deployment | SQLite works for MVP |
| Deployment Infra | 🔜 NOT NEEDED YET | Live deployment | Local demo is sufficient |
| Monitoring | ⏸️ DEFERRED | N/A | All MVP work |
| Secrets Management | ⏸️ DEFERRED | N/A | All MVP work |

---

## Quick Start for Product Owner

**Minimum setup for Day 1-2 parallel work:**

1. ✅ Review this document
2. ⏳ Set up Google Calendar OAuth (30-45 minutes)
3. ⏳ Set up AWS Bedrock access (20-30 minutes)
4. ✅ Create `.env` file (copy from `.env.example`)
5. ✅ Add credentials to `.env`
6. ✅ Verify setup with provided test commands

**Engineering will continue with mocks until credentials are available.**
