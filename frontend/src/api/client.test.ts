import { describe, it, expect, vi, beforeEach } from 'vitest';
import api from './client';
import type { DecisionApiRequest } from '../types/domain';

// Mock the cognito module so we can control isCognitoMode
vi.mock('../auth/cognito', () => {
  let isCognitoMode = false;
  return {
    get isCognitoMode() { return isCognitoMode; },
    setIsCognitoMode: (val: boolean) => { isCognitoMode = val; },
    getAuthToken: vi.fn().mockResolvedValue('mock-token'),
    userPool: null,
  };
});

describe('api/client', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const cognitoModule = await import('../auth/cognito') as unknown as { setIsCognitoMode: (val: boolean) => void };
    cognitoModule.setIsCognitoMode(false);
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({}),
      status: 200,
    } as Response);
  });

  describe('decisionsApi', () => {
    it('retains userId in request body in local mode', async () => {
      const { setIsCognitoMode } = await import('../auth/cognito') as unknown as { setIsCognitoMode: (val: boolean) => void };
      setIsCognitoMode(false);

      const req: DecisionApiRequest = { userId: 'demo-user', query: { question: 'test' } };
      await api.decisions.query(req);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/decisions'),
        expect.objectContaining({
          body: JSON.stringify({ userId: 'demo-user', query: { question: 'test' } })
        })
      );
    });

    it('strips userId from request body in cognito mode and adds token', async () => {
      const { setIsCognitoMode } = await import('../auth/cognito') as unknown as { setIsCognitoMode: (val: boolean) => void };
      setIsCognitoMode(true);

      const req: DecisionApiRequest = { userId: 'demo-user', query: { question: 'test' } };
      await api.decisions.query(req);

      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/decisions'),
        expect.objectContaining({
          body: JSON.stringify({ query: { question: 'test' } }),
          headers: expect.any(Headers)
        })
      );

      const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
      const headers = fetchCall[1]?.headers as Headers;
      expect(headers.get('Authorization')).toBe('Bearer mock-token');
    });
  });
});
