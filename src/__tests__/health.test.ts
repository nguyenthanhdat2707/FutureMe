/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/**
 * Health Check Tests
 */

import request from 'supertest';
import { createApp } from '../app';

describe('Health Check', () => {
  const app = createApp();

  it('should return 200 on health endpoint', async () => {
    const response = await request(app).get('/api/health');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('status', 'ok');
    expect(response.body).toHaveProperty('timestamp');
    expect(response.body).toHaveProperty('service', 'future-me-backend');
  });

  it('should have required health check fields', async () => {
    const response = await request(app).get('/api/health');

    expect(response.body).toMatchObject({
      status: 'ok',
      service: 'future-me-backend',
    });
  });
});

describe('Health Check in Dynamo Mode', () => {
  it('does not invoke sqlite database connection', async () => {
    // Setup
    process.env.PERSISTENCE_PROVIDER = 'dynamodb';
    const mockGetDatabase = jest.fn();
    jest.mock('../database/connection', () => ({
      getDatabase: mockGetDatabase
    }));

    // Create new app with mocked env
    const { createApp: createTestApp } = await import('../app');
    const testApp = createTestApp();

    const response = await request(testApp).get('/api/health');
    expect(response.status).toBe(200);
    expect(response.body.database).toBe('dynamodb');

    // Assert
    const { getDatabase } = await import('../database/connection');
    expect(getDatabase).not.toHaveBeenCalled();

    // Cleanup
    delete process.env.PERSISTENCE_PROVIDER;
    jest.resetModules();
  });
});
