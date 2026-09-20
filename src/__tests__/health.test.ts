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
