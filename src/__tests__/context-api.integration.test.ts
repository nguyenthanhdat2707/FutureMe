/**
 * Context API Integration Tests
 */

import request from 'supertest';
import { createApp } from '../app';
import { PersonalContextRepository } from '../repositories/personal-context.repository';
import { ObservationSource } from '../domain/types';
import { initDatabase, closeDatabase } from '../database/connection';

describe('Context API Integration', () => {
  let app: ReturnType<typeof createApp>;
  let contextRepo: PersonalContextRepository;

  beforeAll(async () => {
    await initDatabase();
  });

  afterAll(async () => {
    closeDatabase();
  });

  beforeEach(() => {
    app = createApp();
    contextRepo = new PersonalContextRepository();
  });

  describe('GET /api/context', () => {
    it('should return personal context for a user', async () => {
      const response = await request(app)
        .get('/api/context?userId=test-user')
        .expect(200);

      expect(response.body).toHaveProperty('userId', 'test-user');
      expect(response.body).toHaveProperty('goals');
      expect(response.body).toHaveProperty('commitments');
      expect(response.body).toHaveProperty('preferences');
      expect(response.body).toHaveProperty('calendar');
      expect(response.body).toHaveProperty('recentDecisions');
      expect(response.body).toHaveProperty('lastUpdated');
    });

    it('should return empty arrays for a new user', async () => {
      const response = await request(app)
        .get('/api/context?userId=brand-new-user')
        .expect(200);

      expect(response.body.goals).toEqual([]);
      expect(response.body.commitments).toEqual([]);
      expect(response.body.preferences).toEqual([]);
    });
  });

  describe('POST /api/context/update', () => {
    it('should update context with observation', async () => {
      const observation = {
        type: 'USER_REPORTED',
        data: { preference: 'morning-work' },
        source: ObservationSource.USER_CONFIRMED,
        confidence: 1.0
      };

      const response = await request(app)
        .post('/api/context/update')
        .send({
          userId: 'test-user-2',
          observation
        })
        .expect(200);

      expect(response.body).toHaveProperty('userId', 'test-user-2');
      expect(response.body).toHaveProperty('lastUpdated');
    });
  });

  describe('POST /api/context/confirm', () => {
    it('should confirm an inferred attribute', async () => {
      // Create an inferred attribute
      const attr = contextRepo.create({
        userId: 'test-user-3',
        attribute: 'preference',
        value: JSON.stringify({ category: 'work', value: 'focus-time' }),
        source: ObservationSource.SYSTEM_INFERRED,
        confidence: 0.7,
        observedAt: new Date()
      });

      const response = await request(app)
        .post('/api/context/confirm')
        .send({
          userId: 'test-user-3',
          attributeId: attr.id
        })
        .expect(200);

      expect(response.body).toHaveProperty('success', true);

      // Verify the attribute was updated
      const updated = contextRepo.findById(attr.id);
      expect(updated?.source).toBe(ObservationSource.USER_CONFIRMED);
      expect(updated?.confidence).toBe(1.0);
    });

    it('should not confirm attribute from different user', async () => {
      const attr = contextRepo.create({
        userId: 'user-a',
        attribute: 'goal',
        value: JSON.stringify({ description: 'Test goal' }),
        source: ObservationSource.SYSTEM_INFERRED,
        confidence: 0.6,
        observedAt: new Date()
      });

      await request(app)
        .post('/api/context/confirm')
        .send({
          userId: 'user-b',
          attributeId: attr.id
        })
        .expect(200);

      // Attribute should remain unchanged
      const unchanged = contextRepo.findById(attr.id);
      expect(unchanged?.source).toBe(ObservationSource.SYSTEM_INFERRED);
    });
  });

  describe('POST /api/context/correct', () => {
    it('should correct wrong context attribute', async () => {
      const attr = contextRepo.create({
        userId: 'test-user-4',
        attribute: 'preference',
        value: JSON.stringify({ category: 'work', value: 'evening' }),
        source: ObservationSource.SYSTEM_INFERRED,
        confidence: 0.8,
        observedAt: new Date()
      });

      const correction = {
        attributeId: attr.id,
        correctedValue: JSON.stringify({ category: 'work', value: 'morning' }),
        reason: 'I prefer mornings, not evenings'
      };

      const response = await request(app)
        .post('/api/context/correct')
        .send({
          userId: 'test-user-4',
          correction
        })
        .expect(200);

      expect(response.body).toHaveProperty('userId', 'test-user-4');

      // Verify the attribute was corrected
      const corrected = contextRepo.findById(attr.id);
      expect(corrected?.value).toBe(correction.correctedValue);
      expect(corrected?.source).toBe(ObservationSource.USER_CONFIRMED);
      expect(corrected?.confidence).toBe(1.0);
    });
  });
});
