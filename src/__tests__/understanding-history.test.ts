/**
 * Understanding History & Persona Differentiation Tests
 * Strict TDD test suite for Future Me Phase 3
 */

import request from 'supertest';
import { createApp } from '../app';
import { initDatabase, closeDatabase } from '../database/connection';
import {
  deriveUnderstandingHistory,
  UnderstandingHistoryResponse,
} from '../services/understanding-history';
import {
  ContextAttribute,
  Decision,
  DecisionStatus,
  ObservationSource,
  ContextSnapshot,
  Recommendation,
} from '../domain/types';
import {
  generatePhase4Dataset,
  PERSONA_SLUGS
} from '../demo/phase4-evaluation-dataset';
import { SimpleContextEngine } from '../intelligence/simple-context-engine';

describe('Understanding Evolution History Derivation (Pure Helper)', () => {
  const baseNow = new Date('2026-09-25T12:00:00.000Z');

  describe('1. Derivation boundaries', () => {
    it('generates daily points for exactly 7, 30, and 90 days with YYYY-MM-DD chronological format', () => {
      for (const days of [7, 30, 90] as const) {
        const result = deriveUnderstandingHistory([], [], { days, now: baseNow });
        expect(result.days).toBe(days);
        expect(result.points).toHaveLength(days);

        // Check chronological order
        for (let i = 0; i < result.points.length; i++) {
          const pt = result.points[i];
          expect(pt.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
          if (i > 0) {
            expect(pt.date > result.points[i - 1].date).toBe(true);
          }
        }

        // Last point is today's date
        expect(result.points[result.points.length - 1].date).toBe('2026-09-25');
        // First point matches days - 1 days ago
        if (days === 7) {
          expect(result.points[0].date).toBe('2026-09-19');
        }
      }
    });

    it('samples at timestamp D: includes observedAt <= D, excludes observedAt > D, handles validUntil boundary', () => {
      // Create attributes around boundary of 2026-09-20 (D is 2026-09-20T23:59:59.999Z)
      const attr1: ContextAttribute = {
        id: 'attr-1',
        userId: 'u1',
        attribute: 'goal',
        value: JSON.stringify({ description: 'Included on 20th' }),
        source: ObservationSource.USER_CONFIRMED,
        confidence: 1,
        observedAt: new Date('2026-09-20T10:00:00.000Z'),
        createdAt: new Date('2026-09-20T10:00:00.000Z'),
      };
      const attr2: ContextAttribute = {
        id: 'attr-2',
        userId: 'u1',
        attribute: 'goal',
        value: JSON.stringify({ description: 'Observed after 20th' }),
        source: ObservationSource.USER_CONFIRMED,
        confidence: 1,
        observedAt: new Date('2026-09-21T01:00:00.000Z'),
        createdAt: new Date('2026-09-21T01:00:00.000Z'),
      };
      const attr3: ContextAttribute = {
        id: 'attr-3',
        userId: 'u1',
        attribute: 'goal',
        value: JSON.stringify({ description: 'Expires on 20th at 15:00' }),
        source: ObservationSource.USER_CONFIRMED,
        confidence: 1,
        observedAt: new Date('2026-09-19T10:00:00.000Z'),
        validUntil: new Date('2026-09-20T15:00:00.000Z'),
        createdAt: new Date('2026-09-19T10:00:00.000Z'),
      };

      const result = deriveUnderstandingHistory([attr1, attr2, attr3], [], { days: 7, now: baseNow });
      const pt19 = result.points.find((p) => p.date === '2026-09-19')!;
      const pt20 = result.points.find((p) => p.date === '2026-09-20')!;
      const pt21 = result.points.find((p) => p.date === '2026-09-21')!;

      // On 19th: only attr3 is observed
      expect(pt19.goals).toBe(1);
      // On 20th at EOD: attr3 is expired (validUntil 15:00 < 23:59:59.999), attr1 is observed, attr2 not yet
      expect(pt20.goals).toBe(1);
      // On 21st at EOD: attr1 and attr2 are active, attr3 expired
      expect(pt21.goals).toBe(2);
    });

    it('recognizes exact semantic attribute names and legacy prefix names for backward compatibility', () => {
      const attrs: ContextAttribute[] = [
        {
          id: 'exact-goal',
          userId: 'u1',
          attribute: 'goal',
          value: JSON.stringify({ description: 'Exact goal' }),
          source: ObservationSource.USER_CONFIRMED,
          confidence: 1,
          observedAt: new Date('2026-09-20T10:00:00.000Z'),
          createdAt: new Date('2026-09-20T10:00:00.000Z'),
        },
        {
          id: 'legacy-goal',
          userId: 'u1',
          attribute: 'goal:ship',
          value: JSON.stringify({ description: 'Legacy goal' }),
          source: ObservationSource.USER_CONFIRMED,
          confidence: 1,
          observedAt: new Date('2026-09-20T10:00:00.000Z'),
          createdAt: new Date('2026-09-20T10:00:00.000Z'),
        },
        {
          id: 'exact-comm',
          userId: 'u1',
          attribute: 'commitment',
          value: JSON.stringify({ description: 'Exact commitment' }),
          source: ObservationSource.USER_CONFIRMED,
          confidence: 1,
          observedAt: new Date('2026-09-20T10:00:00.000Z'),
          createdAt: new Date('2026-09-20T10:00:00.000Z'),
        },
        {
          id: 'legacy-comm',
          userId: 'u1',
          attribute: 'commitment:launch',
          value: JSON.stringify({ description: 'Legacy commitment' }),
          source: ObservationSource.USER_CONFIRMED,
          confidence: 1,
          observedAt: new Date('2026-09-20T10:00:00.000Z'),
          createdAt: new Date('2026-09-20T10:00:00.000Z'),
        },
        {
          id: 'exact-pref',
          userId: 'u1',
          attribute: 'preference',
          value: JSON.stringify({ description: 'Exact preference' }),
          source: ObservationSource.USER_CONFIRMED,
          confidence: 1,
          observedAt: new Date('2026-09-20T10:00:00.000Z'),
          createdAt: new Date('2026-09-20T10:00:00.000Z'),
        },
        {
          id: 'legacy-pref',
          userId: 'u1',
          attribute: 'preference:work',
          value: JSON.stringify({ description: 'Legacy preference' }),
          source: ObservationSource.USER_CONFIRMED,
          confidence: 1,
          observedAt: new Date('2026-09-20T10:00:00.000Z'),
          createdAt: new Date('2026-09-20T10:00:00.000Z'),
        },
        {
          id: 'unrelated',
          userId: 'u1',
          attribute: 'setup_completed',
          value: 'true',
          source: ObservationSource.USER_CONFIRMED,
          confidence: 1,
          observedAt: new Date('2026-09-20T10:00:00.000Z'),
          createdAt: new Date('2026-09-20T10:00:00.000Z'),
        },
      ];

      const result = deriveUnderstandingHistory(attrs, [], { days: 7, now: baseNow });
      const pt20 = result.points.find((p) => p.date === '2026-09-20')!;
      expect(pt20.goals).toBe(2);
      expect(pt20.commitments).toBe(2);
      expect(pt20.preferences).toBe(2);
      expect(pt20.decisions).toBe(0);
    });

    it('counts one active entity across confirm and correct versions without false additions or expirations', () => {
      const original: ContextAttribute = {
        id: 'goal-version-1',
        userId: 'u1',
        attribute: 'goal',
        value: JSON.stringify({ id: 'ship-demo', description: 'Ship the first demo' }),
        source: ObservationSource.SYSTEM_INFERRED,
        confidence: 0.72,
        observedAt: new Date('2026-09-20T10:00:00.000Z'),
        validUntil: new Date('2026-09-23T09:00:00.000Z'),
        createdAt: new Date('2026-09-20T10:00:00.000Z'),
      };
      const corrected: ContextAttribute = {
        id: 'goal-version-2',
        userId: 'u1',
        attribute: 'goal',
        value: JSON.stringify({ id: 'ship-demo', description: 'Ship the polished demo' }),
        source: ObservationSource.USER_CONFIRMED,
        confidence: 1,
        observedAt: new Date('2026-09-22T10:00:00.000Z'),
        createdAt: new Date('2026-09-22T10:00:00.000Z'),
      };

      const result = deriveUnderstandingHistory([original, corrected], [], { days: 7, now: baseNow });

      expect(result.points.find((point) => point.date === '2026-09-21')?.goals).toBe(1);
      expect(result.points.find((point) => point.date === '2026-09-22')?.goals).toBe(1);
      expect(result.points.find((point) => point.date === '2026-09-23')?.goals).toBe(1);
      expect(result.points.find((point) => point.date === '2026-09-20')?.changes).toEqual([
        expect.objectContaining({ id: 'goal-version-1', direction: 'added' }),
      ]);
      expect(result.points.find((point) => point.date === '2026-09-22')?.changes).toEqual([]);
      expect(result.points.find((point) => point.date === '2026-09-23')?.changes).toEqual([]);
    });
  });

  describe('2. Expiration dip', () => {
    it('produces a count decrease when a commitment expires and includes explaining expired change', () => {
      const expiringCommitment: ContextAttribute = {
        id: 'comm-expiring',
        userId: 'u1',
        attribute: 'commitment',
        value: JSON.stringify({ description: 'Sprint 1 Launch Commitment' }),
        source: ObservationSource.USER_CONFIRMED,
        confidence: 1,
        observedAt: new Date('2026-09-19T09:00:00.000Z'),
        validUntil: new Date('2026-09-22T17:00:00.000Z'),
        createdAt: new Date('2026-09-19T09:00:00.000Z'),
      };

      const result = deriveUnderstandingHistory([expiringCommitment], [], { days: 7, now: baseNow });
      const pt21 = result.points.find((p) => p.date === '2026-09-21')!;
      const pt22 = result.points.find((p) => p.date === '2026-09-22')!;
      const pt23 = result.points.find((p) => p.date === '2026-09-23')!;

      // Active on 21st
      expect(pt21.commitments).toBe(1);
      // On 22nd at 23:59:59.999Z, validUntil (17:00) has passed -> dip to 0
      expect(pt22.commitments).toBe(0);
      expect(pt23.commitments).toBe(0);

      // 22nd explains the dip in changes with direction: "expired"
      const expiryChange = pt22.changes.find((c) => c.id === 'comm-expiring');
      expect(expiryChange).toBeDefined();
      expect(expiryChange).toEqual({
        id: 'comm-expiring',
        category: 'commitments',
        direction: 'expired',
        label: 'Sprint 1 Launch Commitment',
        source: ObservationSource.USER_CONFIRMED,
      });

      // 19th recorded the addition
      const pt19 = result.points.find((p) => p.date === '2026-09-19')!;
      const addChange = pt19.changes.find((c) => c.id === 'comm-expiring');
      expect(addChange).toBeDefined();
      expect(addChange?.direction).toBe('added');
    });
  });

  describe('3. Decisions series', () => {
    it('counts decisions with createdAt <= D and records them as added changes', () => {
      const decisions: Decision[] = [
        {
          id: 'dec-1',
          userId: 'u1',
          question: 'Should we launch early?',
          options: [{ id: 'yes', label: 'Yes' }],
          relevantContext: { capturedAt: new Date(), goals: [], commitments: [], constraints: [], relevantHistory: [] },
          tradeoffs: [],
          recommendation: { option: 'yes', confidence: 0.9, reasoning: 'Fast iteration' },
          reasoning: 'Fast iteration',
          confidence: 0.9,
          status: DecisionStatus.CHOSEN,
          userChoice: 'yes',
          createdAt: new Date('2026-09-20T14:00:00.000Z'),
        },
        {
          id: 'dec-2',
          userId: 'u1',
          question: 'Should we refactor database?',
          options: [{ id: 'yes', label: 'Yes' }],
          relevantContext: { capturedAt: new Date(), goals: [], commitments: [], constraints: [], relevantHistory: [] },
          tradeoffs: [],
          recommendation: { option: 'yes', confidence: 0.8, reasoning: 'Tech debt reduction' },
          reasoning: 'Tech debt reduction',
          confidence: 0.8,
          status: DecisionStatus.PENDING,
          createdAt: new Date('2026-09-23T11:00:00.000Z'),
        },
      ];

      const result = deriveUnderstandingHistory([], decisions, { days: 7, now: baseNow });
      const pt19 = result.points.find((p) => p.date === '2026-09-19')!;
      const pt20 = result.points.find((p) => p.date === '2026-09-20')!;
      const pt22 = result.points.find((p) => p.date === '2026-09-22')!;
      const pt23 = result.points.find((p) => p.date === '2026-09-23')!;

      expect(pt19.decisions).toBe(0);
      expect(pt20.decisions).toBe(1);
      expect(pt22.decisions).toBe(1);
      expect(pt23.decisions).toBe(2);

      const change20 = pt20.changes.find((c) => c.id === 'dec-1')!;
      expect(change20).toEqual({
        id: 'dec-1',
        category: 'decisions',
        direction: 'added',
        label: 'Should we launch early?',
        source: 'decision',
      });
    });
  });

  describe('4. Empty history', () => {
    it('sets hasHistory = false when no records exist', () => {
      const result = deriveUnderstandingHistory([], [], { days: 30, now: baseNow });
      expect(result.hasHistory).toBe(false);
      expect(result.points.every((p) => p.goals === 0 && p.commitments === 0 && p.preferences === 0 && p.decisions === 0)).toBe(true);
      expect(result.points.every((p) => p.changes.length === 0)).toBe(true);
    });

    it('sets hasHistory = false when records exist but had no additions/expirations/decisions in requested window', () => {
      // Attribute added 60 days ago, never expires
      const oldAttr: ContextAttribute = {
        id: 'old-attr',
        userId: 'u1',
        attribute: 'goal',
        value: JSON.stringify({ description: 'Ancient goal' }),
        source: ObservationSource.USER_CONFIRMED,
        confidence: 1,
        observedAt: new Date('2026-07-01T00:00:00.000Z'),
        createdAt: new Date('2026-07-01T00:00:00.000Z'),
      };

      const result = deriveUnderstandingHistory([oldAttr], [], { days: 7, now: baseNow });
      // Point counts reflect that the goal is valid
      expect(result.points.every((p) => p.goals === 1)).toBe(true);
      // But no change happened in these 7 days, so hasHistory is false and no synthesized changes exist
      expect(result.points.every((p) => p.changes.length === 0)).toBe(true);
      expect(result.hasHistory).toBe(false);
    });

    it('sets hasHistory = true when at least one addition, expiry, or decision occurred in window', () => {
      const attr: ContextAttribute = {
        id: 'recent-attr',
        userId: 'u1',
        attribute: 'preference',
        value: JSON.stringify({ description: 'Recent preference' }),
        source: ObservationSource.USER_CONFIRMED,
        confidence: 1,
        observedAt: new Date('2026-09-23T00:00:00.000Z'),
        createdAt: new Date('2026-09-23T00:00:00.000Z'),
      };
      const result = deriveUnderstandingHistory([attr], [], { days: 7, now: baseNow });
      expect(result.hasHistory).toBe(true);
    });
  });
});

describe('GET /api/context/history API Route', () => {
  let app: ReturnType<typeof createApp>;

  beforeAll(async () => {
    await initDatabase();
  });

  afterAll(() => {
    closeDatabase();
  });

  beforeEach(() => {
    app = createApp();
  });

  it('rejects invalid days parameter with 400', async () => {
    for (const invalid of ['15', 'abc', '-1', '100', '0']) {
      const res = await request(app)
        .get(`/api/context/history?days=${invalid}&userId=test-user`)
        .expect(400);
      expect(res.body).toHaveProperty('error');
    }
  });

  it('defaults to 30 days when query parameter is omitted', async () => {
    const res = await request(app)
      .get('/api/context/history?userId=test-user')
      .expect(200);

    const body = res.body as UnderstandingHistoryResponse;
    expect(body.days).toBe(30);
    expect(body.points).toHaveLength(30);
    expect(typeof body.hasHistory).toBe('boolean');
  });

  it('accepts 7, 30, and 90 days', async () => {
    for (const days of [7, 30, 90] as const) {
      const res = await request(app)
        .get(`/api/context/history?days=${days}&userId=test-user`)
        .expect(200);

      const body = res.body as UnderstandingHistoryResponse;
      expect(body.days).toBe(days);
      expect(body.points).toHaveLength(days);
    }
  });
});

describe('Enriched Six-Persona Dataset Differentiation & Contract', () => {
  const seededAt = new Date('2026-01-02T03:04:05.000Z');

  it('provides visibly distinct current category signatures across all six personas', async () => {
    const dataset = generatePhase4Dataset(seededAt);
    const signatures = new Map<string, { goals: number; commitments: number; preferences: number; decisions: number }>();

    for (const persona of dataset.personas) {
      const pcRecords = dataset.records.personalContext.filter((r) => r.persona === persona.slug);
      const decRecords = dataset.records.decisions.filter((r) => r.persona === persona.slug);

      // Convert dynamo-like records to ContextAttribute & Decision for engine test
      const attrs: ContextAttribute[] = pcRecords.map((r) => ({
        id: r.id,
        userId: persona.userId,
        attribute: r.attribute as string,
        value: typeof r.value === 'string' ? r.value : JSON.stringify(r.value),
        source: r.source as ObservationSource,
        confidence: Number(r.confidence),
        observedAt: new Date(r.observed_at as string),
        createdAt: new Date(r.created_at as string),
        ...(r.valid_until ? { validUntil: new Date(r.valid_until as string) } : {}),
      }));

      const decisions: Decision[] = decRecords.map((r) => ({
        id: r.id,
        userId: persona.userId,
        question: r.question as string,
        options: [],
        relevantContext: JSON.parse(r.context_snapshot as string) as ContextSnapshot,
        tradeoffs: [],
        recommendation: JSON.parse(r.recommendation as string) as Recommendation,
        reasoning: 'Synthetic',
        confidence: 0.8,
        status: r.status as DecisionStatus,
        createdAt: new Date(r.created_at as string),
      }));

      // Mock repos to evaluate through SimpleContextEngine
      const mockContextRepo = {
        findByUserId: jest.fn().mockReturnValue(attrs),
        findByUserIdAndAttribute: jest.fn(),
        findById: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      };
      const mockDecRepo = {
        findByUserId: jest.fn().mockReturnValue(decisions),
        findById: jest.fn(),
        create: jest.fn(),
        updateChoice: jest.fn(),
        updateStatus: jest.fn(),
      };
      const mockCalRepo = {
        findByUserId: jest.fn(),
        findUpcoming: jest.fn().mockReturnValue([]),
        findByRange: jest.fn(),
        findByExternalId: jest.fn(),
        create: jest.fn(),
        upsert: jest.fn(),
        findById: jest.fn(),
      };
      const mockObsRepo = {
        findByUserId: jest.fn(),
        findRecent: jest.fn().mockReturnValue([]),
        create: jest.fn(),
        findById: jest.fn(),
      };
      const mockStateEstimator = {
        estimateCurrentState: jest.fn(),
      };

      const engine = new SimpleContextEngine(
        mockContextRepo,
        mockDecRepo,
        mockCalRepo,
        mockObsRepo,
        mockStateEstimator
      );

      const currentContext = await engine.getCurrentContext(persona.userId);
      const signature = {
        goals: currentContext.goals.length,
        commitments: currentContext.commitments.length,
        preferences: currentContext.preferences.length,
        decisions: currentContext.recentDecisions.length,
      };

      signatures.set(persona.slug, signature);

      // Verify each card has description
      for (const g of currentContext.goals) {
        expect(typeof g.description).toBe('string');
        expect(g.description.length).toBeGreaterThan(0);
      }
      for (const c of currentContext.commitments) {
        expect(typeof c.description).toBe('string');
        expect(c.description.length).toBeGreaterThan(0);
      }
      for (const p of currentContext.preferences) {
        expect(typeof p.description).toBe('string');
        expect(p.description.length).toBeGreaterThan(0);
      }
    }

    // Every persona must have a unique signature string
    const signatureStrings = Array.from(signatures.entries()).map(
      ([slug, s]) => `${slug}:${s.goals},${s.commitments},${s.preferences},${s.decisions}`
    );
    const uniqueSignatures = new Set(signatureStrings.map((s) => s.split(':')[1]));
    expect(uniqueSignatures.size).toBe(PERSONA_SLUGS.length);
  });

  it('ensures every persona has visibly different history series', () => {
    const dataset = generatePhase4Dataset(seededAt);
    const historySummaries = new Set<string>();

    for (const persona of dataset.personas) {
      const pcRecords = dataset.records.personalContext.filter((r) => r.persona === persona.slug);
      const decRecords = dataset.records.decisions.filter((r) => r.persona === persona.slug);

      const attrs: ContextAttribute[] = pcRecords.map((r) => ({
        id: r.id,
        userId: persona.userId,
        attribute: r.attribute as string,
        value: typeof r.value === 'string' ? r.value : JSON.stringify(r.value),
        source: r.source as ObservationSource,
        confidence: Number(r.confidence),
        observedAt: new Date(r.observed_at as string),
        createdAt: new Date(r.created_at as string),
        ...(r.valid_until ? { validUntil: new Date(r.valid_until as string) } : {}),
      }));

      const decisions: Decision[] = decRecords.map((r) => ({
        id: r.id,
        userId: persona.userId,
        question: r.question as string,
        options: [],
        relevantContext: JSON.parse(r.context_snapshot as string) as ContextSnapshot,
        tradeoffs: [],
        recommendation: JSON.parse(r.recommendation as string) as Recommendation,
        reasoning: 'Synthetic',
        confidence: 0.8,
        status: r.status as DecisionStatus,
        createdAt: new Date(r.created_at as string),
      }));

      const history = deriveUnderstandingHistory(attrs, decisions, { days: 30, now: seededAt });
      expect(history.hasHistory).toBe(true);

      const pointsSummary = history.points
        .map((p) => `${p.goals}-${p.commitments}-${p.preferences}-${p.decisions}`)
        .join('|');
      historySummaries.add(pointsSummary);
    }

    expect(historySummaries.size).toBe(PERSONA_SLUGS.length);
  });

  it('includes at least one actionable SYSTEM_INFERRED active item with confidence < 1.0', () => {
    const dataset = generatePhase4Dataset(seededAt);
    const inferredItems = dataset.records.personalContext.filter(
      (r) =>
        r.source === ObservationSource.SYSTEM_INFERRED &&
        Number(r.confidence) < 1.0 &&
        (!r.valid_until || new Date(r.valid_until as string).getTime() > seededAt.getTime()) &&
        ['goal', 'commitment', 'preference'].includes(r.attribute as string)
    );

    expect(inferredItems.length).toBeGreaterThanOrEqual(1);
    const first = inferredItems[0];
    const parsed = JSON.parse(first.value as string) as { description?: unknown };
    expect(typeof parsed.description).toBe('string');
    expect((parsed.description as string).length).toBeGreaterThan(0);
  });
});
