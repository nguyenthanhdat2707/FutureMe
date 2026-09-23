import request from 'supertest';
import { createApp } from '../app';

const app = createApp();

describe('CORS Preflight', () => {
  it('should return CORS headers for allowed origin and x-demo-user', async () => {
    const origin = 'https://main.d6nuwvgegqhns.amplifyapp.com';
    const res = await request(app)
      .options('/api/decisions')
      .set('Origin', origin)
      .set('Access-Control-Request-Method', 'POST')
      .set('Access-Control-Request-Headers', 'content-type,x-demo-user');

    expect(res.status).toBe(204);
    expect(res.headers['access-control-allow-origin']).toBe(origin);
    expect(res.headers['access-control-allow-headers']).toContain('x-demo-user');
    expect(res.headers['access-control-allow-headers']).toContain('content-type');
    expect(res.headers['access-control-allow-headers']).toContain('authorization');
  });
});
