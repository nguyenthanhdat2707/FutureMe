import { describe, it, expect, vi, beforeEach } from 'vitest';
import api, { resolveApiBaseUrl } from './client';
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

vi.mock('../config/demo-personas', () => {
  let isDemoMode = false;
  return {
    get isDemoMode() { return isDemoMode; },
    setIsDemoMode: (value: boolean) => { isDemoMode = value; },
    getSelectedDemoPersonaId: () => 'phase4-eval-v3:focused-builder',
  };
});

describe('api/client', () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    const cognitoModule = await import('../auth/cognito') as unknown as { setIsCognitoMode: (val: boolean) => void };
    cognitoModule.setIsCognitoMode(false);
    const demoModule = await import('../config/demo-personas') as unknown as { setIsDemoMode: (val: boolean) => void };
    demoModule.setIsDemoMode(false);
    globalThis.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ policy: {} }),
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

    it('uses the selected persona header and strips body userId in demo mode', async () => {
      const { setIsDemoMode } = await import('../config/demo-personas') as unknown as { setIsDemoMode: (val: boolean) => void };
      setIsDemoMode(true);

      await api.decisions.query({ userId: 'spoofed-user', query: { question: 'test' } });

      const fetchCall = vi.mocked(globalThis.fetch).mock.calls[0];
      const options = fetchCall[1] as RequestInit;
      expect(options.body).toBe(JSON.stringify({ query: { question: 'test' } }));
      expect((options.headers as Headers).get('X-Demo-User')).toBe('phase4-eval-v3:focused-builder');
      expect((options.headers as Headers).get('Authorization')).toBeNull();
    });

    it('throws contract violation error if policy is missing from response', async () => {
      vi.mocked(globalThis.fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => ({ decision: {}, assessment: {} }) // Missing policy
      } as Response);

      const req: DecisionApiRequest = { query: { question: 'test' } };
      
      await expect(api.decisions.query(req)).rejects.toThrow('API contract violation: missing policy in decision response');
    });
  });

  describe('contextApi', () => {
    it('setup retains userId in local mode', async () => {
      const { setIsCognitoMode } = await import('../auth/cognito') as unknown as { setIsCognitoMode: (val: boolean) => void };
      setIsCognitoMode(false);
      await api.context.setup({ priorities: 'sleep' }, 'test-user');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/context/setup'),
        expect.objectContaining({
          body: JSON.stringify({ answers: [{ questionId: 'priorities', text: 'sleep' }], userId: 'test-user' })
        })
      );
    });

    it('setup strips userId and adds token in cognito mode', async () => {
      const { setIsCognitoMode } = await import('../auth/cognito') as unknown as { setIsCognitoMode: (val: boolean) => void };
      setIsCognitoMode(true);
      await api.context.setup({ priorities: 'sleep' }, 'test-user');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/context/setup'),
        expect.objectContaining({
          body: JSON.stringify({ answers: [{ questionId: 'priorities', text: 'sleep' }] })
        })
      );
    });
  });

  describe('calendarApi', () => {
    it('sync sends empty body in cognito mode', async () => {
      const { setIsCognitoMode } = await import('../auth/cognito') as unknown as { setIsCognitoMode: (val: boolean) => void };
      setIsCognitoMode(true);
      await api.calendar.sync('test-user');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/calendar/sync'),
        expect.objectContaining({
          body: JSON.stringify({})
        })
      );
    });

    it('getStatus omits userId from query string in cognito mode', async () => {
      const { setIsCognitoMode } = await import('../auth/cognito') as unknown as { setIsCognitoMode: (val: boolean) => void };
      setIsCognitoMode(true);
      await api.calendar.getStatus('test-user');
      expect(globalThis.fetch).toHaveBeenCalledWith(
        expect.not.stringContaining('userId=test-user'),
        expect.any(Object)
      );
    });
  });

  describe('resolveApiBaseUrl', () => {
    it('should use provided URL and trim trailing slash', () => {
      expect(resolveApiBaseUrl('https://api.example.com/', 'production')).toBe('https://api.example.com');
      expect(resolveApiBaseUrl('https://api.example.com//', 'development')).toBe('https://api.example.com');
    });

    it('should fall back to localhost in development if env is missing', () => {
      expect(resolveApiBaseUrl(undefined, 'development')).toBe('http://localhost:3001/api');
    });

    it('should throw an error in production if env is missing', () => {
      expect(() => resolveApiBaseUrl(undefined, 'production')).toThrow(
        'VITE_API_BASE_URL is not configured. The application cannot reach the backend API.'
      );
    });
  });
});
