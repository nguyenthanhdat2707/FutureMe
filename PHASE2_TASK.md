# Phase 2 Implementation Task — Live Intelligence Loop

## GOAL

Prove the core product loop end-to-end at real runtime:

  context change → detect uncertainty → generate targeted clarification questions
  → user confirms or corrects → validated context persisted with provenance
  → decision support reflects updated context

The architectural boundary must hold: LLM proposes, deterministic logic validates,
only USER_CONFIRMED answers are persisted to context, and no LLM output can bypass
validation or corrupt confirmed state.

---

## KNOWN FACTS (verified from repo inspection)

- Branch: feat/phase2-live-intelligence-loop (already created)
- 39/39 tests pass on this branch (Jest, 6 suites)
- `BoundedLLMContextAnalyst` exists at `src/intelligence/bounded-llm-context-analyst.ts`:
  - validates request schema (zod), calls ILLMProvider, validates response schema and
    reference integrity, returns only `proposed` status — never confirmed
  - rejects: invalid-request, invalid-json, invalid-schema, unknown-reference
- `DeterministicFeasibilityAssessment` at `src/intelligence/deterministic-feasibility-assessment.ts`
  is the source of truth for feasibility — LLM cannot override it
- `SimpleContextEngine` has `correctContext(userId, correction)` which sets
  source=USER_CONFIRMED, confidence=1.0 — this is the only legal persistence path
- `ILLMProvider` interface is at `src/adapters/llm-provider.interface.ts`
- `MockLLMProvider` is at `src/adapters/mock-llm-provider.ts`
- Service container at `src/services/service-container.ts` always uses MockLLMProvider;
  `getLLMProvider()` has a TODO for Bedrock
- No `@aws-sdk/client-bedrock-runtime` is installed; no AWS env vars in .env
- Existing routes: context.routes.ts, decision.routes.ts — no /analyze or /clarify endpoint
- Domain types for the analyst loop exist: `ContextAnalystRequest`, `ContextAnalystResult`,
  `CandidateClarificationQuestion`, `ProposedContextHypothesis` all in `src/domain/types.ts`
- `.env.example` already has commented-out AWS_REGION, AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACCESS_KEY, BEDROCK_MODEL_ID stubs

## UNKNOWN

- Whether AWS Bedrock credentials are present in the runtime environment
  (the service-container comment says "TODO: Check for real AWS Bedrock credentials")
- Whether a specific Bedrock model ID is configured

---

## IMPLEMENTATION INTENT

### Slice 1 — Real Bedrock LLM Provider (backend only)

Create `src/adapters/bedrock-llm-provider.ts` implementing `ILLMProvider`:

- Install `@aws-sdk/client-bedrock-runtime` (latest stable)
- Use `BedrockRuntimeClient` + `InvokeModelCommand`
- Model ID from `process.env.BEDROCK_MODEL_ID`, default to `anthropic.claude-3-haiku-20240307-v1:0`
  (cheapest fast Claude model on Bedrock)
- Message format: Anthropic Messages API (claude-3 models)
  - Request body: `{ anthropic_version: "bedrock-2023-05-31", max_tokens, temperature, messages }`
  - System prompt extracted from messages array (role === 'system' → system field)
  - User/assistant turns passed as messages
  - Response: `content[0].text`
- Handle failures gracefully: on any error (network, auth, malformed response, timeout),
  throw a typed error with message; the caller (BoundedLLMContextAnalyst) already handles
  LLM failures by returning rejected result — do NOT swallow errors silently
- Export class `BedrockLLMProvider`

Wire into service-container `getLLMProvider()`:
- If `process.env.AWS_REGION` and `process.env.AWS_ACCESS_KEY_ID` and
  `process.env.AWS_SECRET_ACCESS_KEY` are all non-empty strings, construct and return
  `BedrockLLMProvider`
- Otherwise fall back to `MockLLMProvider`
- Log which provider is being used at startup (not every call)

### Slice 2 — /api/context/analyze endpoint

Add to `src/routes/context.routes.ts`:

`POST /api/context/analyze`

Request body:
```json
{
  "userId": "demo-user"
}
```

Behavior:
1. Get current context and recent observations for userId
2. Identify UNCERTAIN context attributes: those with `source !== USER_CONFIRMED`
   and `confidence < 1.0` from contextRepo, limited to 10 most recent
3. Get recent observations from observationRepo (last 24h), limit 20
4. Build ContextAnalystRequest:
   - signals: map each observation to a signal (id=obs.id, description=`${obs.type}: ${JSON.stringify(obs.data)}`, evidenceIds=[obs.id])
   - evidence: same observations as evidence items (id=obs.id, description=same text)
   - contextAttributes: uncertain attributes mapped to (id=attr.id, value=attr.value)
   - If no signals or no contextAttributes, return 200 with empty result:
     `{ proposedHypotheses: [], candidateClarificationQuestions: [], validation: { status: 'accepted' }, skipped: true, reason: 'no-signals-or-attributes' }`
5. Call `BoundedLLMContextAnalyst.analyze(request)` — inject analyst via service container
6. Return the raw `ContextAnalystResult` — do NOT persist anything from this call
7. Never return 500 due to LLM failure — if analyst returns rejected result, return 200
   with the rejected result (caller can handle)

Wire `getLLMContextAnalyst()` into service-container:
```typescript
import { BoundedLLMContextAnalyst } from '../intelligence/bounded-llm-context-analyst';
import { ILLMContextAnalyst } from '../intelligence/interfaces';

let llmContextAnalyst: ILLMContextAnalyst | null = null;

export function getLLMContextAnalyst(): ILLMContextAnalyst {
  if (!llmContextAnalyst) {
    llmContextAnalyst = new BoundedLLMContextAnalyst(getLLMProvider());
  }
  return llmContextAnalyst;
}
```

### Slice 3 — /api/context/clarify endpoint

Add to `src/routes/context.routes.ts`:

`POST /api/context/clarify`

Request body:
```json
{
  "userId": "demo-user",
  "attributeId": "attr-uuid",
  "answer": "morning",
  "questionText": "When do you prefer to do focused work?"
}
```

Behavior:
1. Validate: userId string, attributeId string (non-empty), answer string (non-empty, max 500 chars)
2. Verify the attributeId exists in contextRepo and belongs to userId — return 404 if not found
3. Build ContextCorrection: `{ attributeId, correctedValue: answer.trim(), reason: questionText }`
4. Call `contextEngine.correctContext(userId, correction)` — this persists with
   source=USER_CONFIRMED, confidence=1.0
5. Return updated context

Provenance guarantee: this is the ONLY path that persists a clarification answer.
The analyst endpoint (/analyze) must never persist.

### Slice 4 — End-to-end integration test

Create `src/__tests__/phase2-loop.integration.test.ts`

This test must exercise the FULL RUNTIME PATH end-to-end:

```
context change (POST /api/context/update with an observation)
  → analyze (POST /api/context/analyze)
  → returns clarification question with attributeId
  → user answers (POST /api/context/clarify)
  → verified: attribute in DB has source=USER_CONFIRMED, confidence=1.0
  → decision (POST /api/decisions)
  → verified: decision recommendation reflects updated context
```

Use a controlled LLM provider (NOT MockLLMProvider) for the test — inject a fake that:
- Returns a valid ContextAnalystResult pointing to the observation and attribute IDs
  that were actually inserted during the test setup
- This avoids real Bedrock credentials while still exercising the full wiring

The test must:
- Start a real in-memory SQLite database (same as existing integration tests)
- Not mock the HTTP layer — use supertest against a real Express app
- Verify that source=USER_CONFIRMED and confidence=1.0 after clarify
- Verify decision assessment uses the updated context (at minimum: the same decision
  evaluated before and after clarify must return different or updated context snapshot)

### Slice 5 — Update .env.example

Add to `.env.example` (uncomment and document):
```
# AWS Bedrock (real LLM — set all three to enable; otherwise MockLLMProvider is used)
# AWS_REGION=us-east-1
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
```

---

## SCOPE

Files you MAY modify or create:
- src/adapters/bedrock-llm-provider.ts (new)
- src/adapters/mock-llm-provider.ts (only if needed for test injection shape)
- src/routes/context.routes.ts (add /analyze and /clarify endpoints)
- src/services/service-container.ts (add getLLMContextAnalyst, wire Bedrock)
- src/__tests__/phase2-loop.integration.test.ts (new)
- .env.example (documentation update only, no secrets)
- package.json (only to add @aws-sdk/client-bedrock-runtime)
- package-lock.json

Files you must NOT touch:
- src/domain/types.ts (domain contract is stable)
- src/intelligence/bounded-llm-context-analyst.ts (boundary is correct)
- src/intelligence/deterministic-feasibility-assessment.ts
- src/intelligence/interfaces.ts
- Any existing passing test
- Any frontend file
- .env (secrets file, do not read or write)

---

## ACCEPTANCE CRITERIA

1. `npm install` succeeds — @aws-sdk/client-bedrock-runtime is added cleanly
2. `npm run build` succeeds with no new TypeScript errors
3. `npm test` shows all 39 existing tests still pass PLUS the new phase2 integration test passes
4. `GET /api/health` returns 200 with `{ status: 'ok' }` on a running server
5. `POST /api/context/analyze` returns a valid ContextAnalystResult (accepted or rejected, never 500 from LLM failure)
6. `POST /api/context/clarify` with a valid attributeId + answer returns the updated context with the attribute persisted as USER_CONFIRMED / confidence 1.0
7. The phase2 integration test demonstrates the full loop:
   - observation persisted
   - analyze returns candidate question pointing to real attribute IDs
   - clarify persists with USER_CONFIRMED provenance
   - decision support reflects updated context
8. The BedrockLLMProvider falls back to MockLLMProvider when AWS env vars are absent (verified by test behavior without credentials)

---

## VERIFICATION

After implementation, run:

```
npm install           # no errors
npm run build         # no TypeScript errors
npm test              # all tests pass including new phase2 test
```

Then do a manual smoke test:
1. Start the server: `npm run dev` or `node dist/index.js`
2. POST /api/context/update with an observation
3. POST /api/context/analyze — inspect the response for proposedHypotheses and candidateClarificationQuestions
4. POST /api/context/clarify with the attributeId from step 3 and an answer
5. GET /api/context?userId=demo-user — verify the attribute source is USER_CONFIRMED
6. POST /api/decisions with an impactProfile — verify recommendation in response

---

## STOP CONDITIONS

Stop and output what you have if:
- The @aws-sdk install breaks other packages or produces peer-dep errors that cannot be resolved without major version changes
- TypeScript compiler errors in existing files that you did not touch
- The phase2 integration test cannot be made to pass without real Bedrock credentials
  (in that case: use a controlled fake provider for the test, document the gap)
- Any existing test begins failing and you cannot identify a root cause within 2 attempts

In all stop conditions: output the current state of each changed file and the exact error.

---

## ARCHITECTURAL BOUNDARY CHECK

After implementation, verify these hold:

- [ ] `POST /api/context/analyze` returns proposals but writes NOTHING to the database
- [ ] `POST /api/context/clarify` is the only write path for clarification answers
- [ ] `BoundedLLMContextAnalyst` never receives raw DB objects — only caller-assembled signals/evidence/attributes
- [ ] LLM provider is behind `ILLMProvider` — no direct Bedrock SDK calls outside bedrock-llm-provider.ts
- [ ] Bedrock failures do not propagate as 500 from /analyze — analyst returns rejected, route returns 200 with rejected result
- [ ] `assessDecisionFeasibility` is the sole authority for recommendation — LLM tradeoffs are additive, never replacing

If any of these do not hold, fix them before completing.
