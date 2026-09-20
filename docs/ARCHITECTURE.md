# Future Me — Architecture Overview

> **Status:** Initial architecture for 5-day MVP  
> **Updated:** 2024-09-20  
> **Principle:** Modular monolith with replaceable intelligence components

---

## 1. Architecture Principles

### 5-Day Constraints
- ✅ Modular monolith (single Node.js application)
- ✅ Contract-first development (stable interfaces, replaceable implementations)
- ✅ Local-first (works without cloud dependencies)
- ✅ Demo Mode (deterministic, offline-capable)
- ❌ No microservices
- ❌ No Kubernetes
- ❌ No premature AWS infrastructure

### Replaceability
Intelligence components (forecasting, state estimation, intervention policy) must remain replaceable without rewriting the application.

### Dependency Direction
```
Frontend → Backend API → Application Services → Intelligence Interfaces → Adapters
                                                                        ↓
                                                                   Persistence
                                                                   External APIs
```

---

## 2. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND (React + TypeScript)                │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ App Shell    │  │ Decision UX  │  │ Context Management  │  │
│  │ (3-column)   │  │              │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │ Calendar UI  │  │ Intervention │  │ Demo Mode UI         │  │
│  │              │  │ Cards        │  │                      │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└────────────────────────┬────────────────────────────────────────┘
                         │ REST API (JSON)
┌────────────────────────┴────────────────────────────────────────┐
│                  BACKEND (Node.js + Express + TypeScript)        │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │                    API Routes Layer                        │ │
│  │  /api/auth  /api/context  /api/decisions                  │ │
│  │  /api/calendar  /api/observations  /api/demo              │ │
│  └──────────────────────┬─────────────────────────────────────┘ │
│                         │                                        │
│  ┌──────────────────────┴─────────────────────────────────────┐ │
│  │              Application Services Layer                    │ │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │ │
│  │  │ Context     │  │ Decision     │  │ Calendar        │  │ │
│  │  │ Service     │  │ Service      │  │ Service         │  │ │
│  │  └─────────────┘  └──────────────┘  └─────────────────┘  │ │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │ │
│  │  │ Observation │  │ Intervention │  │ Demo            │  │ │
│  │  │ Service     │  │ Service      │  │ Service         │  │ │
│  │  └─────────────┘  └──────────────┘  └─────────────────┘  │ │
│  └──────────────────────┬─────────────────────────────────────┘ │
│                         │                                        │
│  ┌──────────────────────┴─────────────────────────────────────┐ │
│  │         Intelligence Layer (Replaceable Components)        │ │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │ │
│  │  │ Context     │  │ State        │  │ Forecast        │  │ │
│  │  │ Engine      │  │ Estimator    │  │ Engine          │  │ │
│  │  │ (IContext   │  │ (IState      │  │ (IForecast      │  │ │
│  │  │  Engine)    │  │  Estimator)  │  │  Engine)        │  │ │
│  │  └─────────────┘  └──────────────┘  └─────────────────┘  │ │
│  │  ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐  │ │
│  │  │ Decision    │  │ Intervention │  │ LLM Context     │  │ │
│  │  │ Engine      │  │ Policy       │  │ Analyst         │  │ │
│  │  │ (IDecision  │  │ (IInter-     │  │ (ILLM           │  │ │
│  │  │  Engine)    │  │  vention)    │  │  Analyst)       │  │ │
│  │  └─────────────┘  └──────────────┘  └─────────────────┘  │ │
│  └──────────────────────┬─────────────────────────────────────┘ │
│                         │                                        │
│  ┌──────────────────────┴─────────────────────────────────────┐ │
│  │           Data Access Layer (Repositories)                 │ │
│  │  PersonalContextRepository  DecisionRepository             │ │
│  │  ObservationRepository      CalendarEventRepository        │ │
│  │  OutcomeRepository          FeedbackRepository             │ │
│  └──────────────────────┬─────────────────────────────────────┘ │
│                         │                                        │
│  ┌──────────────────────┴─────────────────────────────────────┐ │
│  │         Persistence (SQLite for MVP, PostgreSQL later)     │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │              External Integrations (Adapters)              │ │
│  │  ┌──────────────────────┐  ┌───────────────────────────┐  │ │
│  │  │ CalendarAdapter      │  │ LLMProvider               │  │ │
│  │  │ ├─ Google (real)     │  │ ├─ Bedrock (real)         │  │ │
│  │  │ └─ Mock (dev/demo)   │  │ └─ Mock (dev/demo)        │  │ │
│  │  └──────────────────────┘  └───────────────────────────┘  │ │
│  └────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

---

## 3. Technology Stack

### Frontend
- **Framework:** React 18
- **Language:** TypeScript
- **Styling:** TailwindCSS (warm palette, custom design tokens)
- **State:** React Context + hooks (Redux if needed later)
- **HTTP Client:** Fetch API or Axios
- **Build Tool:** Vite

### Backend
- **Runtime:** Node.js 20+
- **Framework:** Express
- **Language:** TypeScript
- **Authentication:** Passport.js + Google OAuth2
- **Validation:** Zod
- **ORM/Query:** Kysely or Drizzle (lightweight, type-safe)

### Database
- **MVP:** SQLite (local-first, simple setup)
- **Production:** PostgreSQL (migration path available)

### External Services
- **LLM:** Amazon Bedrock (Claude 3.5 Sonnet or Haiku)
- **Calendar:** Google Calendar API (OAuth 2.0, read-only)

### DevOps
- **Containerization:** Docker + Docker Compose
- **CI:** GitHub Actions
- **Security Scanning:** Trivy (vulnerabilities, secrets, misconfig)
- **Testing:** Jest, React Testing Library
- **Linting:** ESLint + Prettier

---

## 4. Domain Object Model

### Core Domain Types

```typescript
// PersonalContext — accumulated knowledge about the user
interface PersonalContext {
  userId: string;
  goals: Goal[];
  commitments: Commitment[];
  preferences: Preference[];
  calendar: CalendarSummary;
  recentDecisions: Decision[];
  lastUpdated: Date;
}

// PersonalState — temporary current interpretation
enum PersonalState {
  FLOW = 'FLOW',
  UNCERTAIN = 'UNCERTAIN',
  DRIFTING = 'DRIFTING',
  DISRUPTED = 'DISRUPTED',
  OVERLOADED = 'OVERLOADED'
}

interface StateEstimate {
  state: PersonalState;
  confidence: number;
  evidence: string[];
  timestamp: Date;
}

// Observation — something that happened
interface Observation {
  id: string;
  userId: string;
  type: ObservationType;
  data: Record<string, unknown>;
  source: ObservationSource;
  confidence: number;
  timestamp: Date;
}

// Forecast — probabilistic future belief (optional for MVP)
interface Forecast {
  id: string;
  target: string;
  prediction: string;
  probability?: number;
  horizon: number; // hours
  drivers: string[];
  generatedAt: Date;
}

// Decision — first-class domain object
interface Decision {
  id: string;
  userId: string;
  question: string;
  options: DecisionOption[];
  relevantContext: ContextSnapshot;
  tradeoffs: Tradeoff[];
  recommendation: Recommendation;
  reasoning: string;
  confidence: number;
  userChoice?: string;
  status: DecisionStatus;
  createdAt: Date;
}

// Intervention — proactive system action
interface Intervention {
  id: string;
  userId: string;
  level: InterventionLevel; // NONE | AMBIENT | SUGGESTION | PROACTIVE
  reason: string;
  prompt?: string;
  suggestedAction?: string;
  createdAt: Date;
}

// Outcome — what actually happened
interface Outcome {
  id: string;
  decisionId: string;
  userId: string;
  description: string;
  observedAt: Date;
}

// Feedback — user evaluation of system behavior
interface Feedback {
  id: string;
  userId: string;
  targetType: 'decision' | 'intervention' | 'forecast';
  targetId: string;
  feedbackText: string;
  createdAt: Date;
}
```

---

## 5. Intelligence Component Interfaces

### IContextEngine
```typescript
interface IContextEngine {
  getCurrentContext(userId: string): Promise<PersonalContext>;
  updateContext(userId: string, observation: Observation): Promise<PersonalContext>;
  getRelevantContext(userId: string, decision: DecisionQuery): Promise<RelevantContext>;
  confirmContextAttribute(userId: string, attributeId: string): Promise<void>;
  correctContext(userId: string, correction: ContextCorrection): Promise<PersonalContext>;
}
```

**MVP Implementation:** Simple key-value storage with recency-based retrieval

---

### IStateEstimator
```typescript
interface IStateEstimator {
  estimateCurrentState(
    context: PersonalContext,
    observations: Observation[]
  ): Promise<StateEstimate>;
}
```

**MVP Implementation:** Deterministic rules
- No observations in 30min → UNCERTAIN
- Commitments > capacity → OVERLOADED
- Large schedule disruption → DISRUPTED

---

### IForecastEngine
```typescript
interface IForecastEngine {
  forecastDisruption(
    context: PersonalContext,
    horizon: number
  ): Promise<Forecast | null>;
}
```

**MVP Implementation:** Optional simple heuristics (may return null initially)

---

### IDecisionEngine
```typescript
interface IDecisionEngine {
  supportDecision(
    userId: string,
    query: DecisionQuery
  ): Promise<DecisionSupport>;
}
```

**MVP Implementation:** LLM (Bedrock) with retrieved context + structured output

---

### IInterventionPolicy
```typescript
interface IInterventionPolicy {
  shouldIntervene(
    state: StateEstimate,
    context: PersonalContext
  ): Promise<InterventionDecision>;
}
```

**MVP Implementation:** Simple threshold rules
- UNCERTAIN + important decision pending → SUGGESTION

---

### ILLMContextAnalyst
```typescript
interface ILLMContextAnalyst {
  analyzeCalendarEvents(events: CalendarEvent[]): Promise<ContextHypotheses>;
  generateClarificationQuestions(
    context: PersonalContext,
    decision?: DecisionQuery
  ): Promise<ClarificationQuestion[]>;
}
```

**MVP Implementation:** Bedrock with structured prompts + JSON schema validation

---

## 6. API Contract

### Authentication
```
POST   /api/auth/google              # Initiate OAuth
GET    /api/auth/google/callback     # OAuth callback
POST   /api/auth/logout              # Logout
GET    /api/auth/status              # Current user
```

### Context Management
```
GET    /api/context                  # Get current context
POST   /api/context/update           # Update context (manual or observation)
POST   /api/context/confirm          # Confirm inferred attribute
POST   /api/context/correct          # Correct wrong context
```

### Decision Support
```
POST   /api/decisions                # Ask a decision
GET    /api/decisions/:id            # Get decision details
POST   /api/decisions/:id/choice     # Record user choice
GET    /api/decisions                # List user decisions
```

### Calendar
```
GET    /api/calendar/events          # List calendar events
POST   /api/calendar/sync            # Trigger sync
GET    /api/calendar/status          # Sync status
```

### Observations & Outcomes
```
POST   /api/observations             # Create observation (manual)
POST   /api/outcomes                 # Record decision outcome
POST   /api/feedback                 # Submit feedback
```

### Demo Mode
```
POST   /api/demo/reset               # Reset to initial demo state
GET    /api/demo/state               # Get current demo scenario
POST   /api/demo/seed                # Seed specific scenario
```

---

## 7. Data Model (Database Schema)

### users
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  google_id TEXT UNIQUE,
  display_name TEXT,
  tokens TEXT, -- JSON encrypted OAuth tokens
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### personal_context
```sql
CREATE TABLE personal_context (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  attribute TEXT NOT NULL, -- 'goal', 'commitment', 'preference', etc.
  value TEXT NOT NULL, -- JSON
  source TEXT NOT NULL, -- 'USER_CONFIRMED', 'CALENDAR', 'SYSTEM_INFERRED'
  confidence REAL DEFAULT 1.0,
  observed_at TIMESTAMP NOT NULL,
  valid_until TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_personal_context_user ON personal_context(user_id);
CREATE INDEX idx_personal_context_source ON personal_context(source);
```

### decisions
```sql
CREATE TABLE decisions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  question TEXT NOT NULL,
  context_snapshot TEXT NOT NULL, -- JSON
  recommendation TEXT, -- JSON
  user_choice TEXT, -- JSON
  status TEXT DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_decisions_user ON decisions(user_id);
```

### observations
```sql
CREATE TABLE observations (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  type TEXT NOT NULL,
  data TEXT NOT NULL, -- JSON
  source TEXT NOT NULL,
  confidence REAL DEFAULT 1.0,
  timestamp TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_observations_user_time ON observations(user_id, timestamp DESC);
```

### calendar_events
```sql
CREATE TABLE calendar_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  external_id TEXT NOT NULL,
  title TEXT NOT NULL,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  status TEXT,
  raw_data TEXT, -- JSON original event data
  synced_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX idx_calendar_events_user_time ON calendar_events(user_id, start_time);
CREATE UNIQUE INDEX idx_calendar_events_external ON calendar_events(user_id, external_id);
```

### outcomes
```sql
CREATE TABLE outcomes (
  id TEXT PRIMARY KEY,
  decision_id TEXT NOT NULL REFERENCES decisions(id),
  user_id TEXT NOT NULL REFERENCES users(id),
  description TEXT NOT NULL,
  observed_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### feedback
```sql
CREATE TABLE feedback (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  target_type TEXT NOT NULL, -- 'decision', 'intervention', 'forecast'
  target_id TEXT NOT NULL,
  feedback_text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 8. Deployment Model

### MVP (Local Development)
```
Docker Compose:
- frontend (Vite dev server, port 5173)
- backend (Express, port 3000)
- database (SQLite file-based, or PostgreSQL container)
```

### Production (Future)
```
AWS Architecture (TBD by Product Owner):
- Option A: ECS Fargate + RDS
- Option B: App Runner + RDS
- Option C: Lambda + API Gateway + DynamoDB
- Decision pending after MVP validation
```

---

## 9. Security Boundaries

### Authentication
- Google OAuth 2.0 only (no password storage)
- Session-based auth with secure HTTP-only cookies
- CSRF protection

### Authorization
- User can only access their own data
- No admin/multi-tenant concerns for MVP

### Secrets Management
- Local: `.env` file (Git-ignored)
- Production: AWS Secrets Manager or equivalent (TBD)

### Data Privacy
- Calendar data: read-only, stored temporarily
- Personal context: user-scoped, no cross-user sharing
- No analytics/tracking in MVP

---

## 10. Testing Strategy

### Unit Tests
- Domain logic (state estimation, context ranking)
- Utility functions
- Validation schemas

### Integration Tests
- API endpoints (with mocked adapters)
- Repository layer
- Service orchestration

### End-to-End Tests
- Critical user flows with Demo Mode
- OAuth flow (mocked)
- Decision support flow

### Manual Testing
- Real Google Calendar integration (when credentials available)
- Real Bedrock integration (when credentials available)
- Browser compatibility
- Responsive behavior

---

## 11. Monitoring & Observability (Future)

**Deferred to post-MVP:**
- Application logs (structured JSON)
- Error tracking (Sentry or CloudWatch)
- Performance monitoring
- User analytics (privacy-respecting)

---

## 12. Migration Paths

### Database Migration
```
SQLite (MVP) → PostgreSQL (Production)
- Repository pattern allows transparent swap
- Migration script to export/import data
- Schema remains compatible
```

### LLM Provider Migration
```
Bedrock → OpenAI → Local model
- LLMProvider interface remains stable
- Swap implementation without changing application code
```

### Intelligence Upgrade
```
Simple rules → Probabilistic models → ML-based
- Interfaces frozen
- Implementations replaceable
- A/B testing possible
```

---

## 13. Known Limitations & Technical Debt

### MVP Scope Limitations
- No real-time sync (polling-based refresh)
- No mobile app (responsive web only)
- No offline mode (requires internet for LLM)
- No multi-device sync
- Read-only Calendar integration (no write-back)
- Simple intelligence logic (deterministic rules)

### Technical Debt Accepted for 5-Day MVP
- No comprehensive error recovery
- Basic logging only
- No performance optimization
- No caching layer
- No rate limiting
- SQLite may not scale to production
- No automated database migrations

### Post-MVP Improvements
- Real-time context updates
- Advanced forecasting models
- Calendar write-back with confirmation
- Mobile native apps
- Offline-capable progressive web app
- Advanced JITAI policy with receptivity modeling
- Multi-device state synchronization

---

## 14. Decision Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2024-09-20 | Modular monolith architecture | Faster MVP delivery, simpler ops, can extract services later |
| 2024-09-20 | SQLite for MVP | Local-first, no infra setup, sufficient for demo |
| 2024-09-20 | Amazon Bedrock for LLM | Product Owner's AWS preference, structured output support |
| 2024-09-20 | Contract-first development | Enables parallel frontend/backend work |
| 2024-09-20 | Demo Mode as first-class feature | Reduces external dependency risk for hackathon |
| 2024-09-20 | Mock adapters for all external services | Engineering continues without credentials |

---

## 15. Open Questions for Product Owner

1. **Database choice:** SQLite acceptable for MVP demo, or prefer PostgreSQL from start?
2. **AWS deployment:** Should we plan for AWS deployment during MVP, or focus on local demo?
3. **Calendar write-back:** Implement in MVP or defer to post-MVP?
4. **Bedrock model:** Claude 3.5 Sonnet (quality) or Haiku (speed/cost)?

---

**Last Updated:** 2024-09-20  
**Next Review:** After Day 1 foundation work complete
