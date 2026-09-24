import { getUserId, setCognitoSub, UnauthorizedError } from '../utils/identity';
import { Request } from 'express';

describe('Identity Utils', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Cognito Mode', () => {
    beforeEach(() => {
      process.env.AUTH_MODE = 'cognito';
    });

    it('should ignore body userId and use JWT sub claim', () => {
      const req = {
        body: { userId: 'sneaky-user' },
        query: { userId: 'sneaky-user-2' }
      } as unknown as Request;

      setCognitoSub(req, 'real-user-id');
      const userId = getUserId(req);
      expect(userId).toBe('real-user-id');
    });

    it('should throw Unauthorized if sub claim is missing', () => {
      const req = {
        body: { userId: 'sneaky-user' }
      } as unknown as Request;

      expect(() => getUserId(req)).toThrow(UnauthorizedError);
      expect(() => getUserId(req)).toThrow('Unauthorized: missing or invalid sub claim');
    });

    it('should throw Unauthorized if sub claim is blank', () => {
      const req = {
        body: { userId: 'sneaky-user' }
      } as unknown as Request;

      setCognitoSub(req, '');
      expect(() => getUserId(req)).toThrow(UnauthorizedError);
    });
  });

  describe('Local Mode', () => {
    beforeEach(() => {
      delete process.env.AUTH_MODE;
      delete process.env.AWS_EXECUTION_ENV;
    });

    it('should use body userId if provided', () => {
      const req = {
        body: { userId: 'test-user' }
      } as unknown as Request;

      const userId = getUserId(req);
      expect(userId).toBe('test-user');
    });

    it('should use query userId if provided', () => {
      const req = {
        body: {},
        query: { userId: 'query-user' }
      } as unknown as Request;

      const userId = getUserId(req);
      expect(userId).toBe('query-user');
    });

    it('should fallback to demo-user if no userId is provided', () => {
      const req = {
        body: {},
        query: {}
      } as unknown as Request;

      const userId = getUserId(req);
      expect(userId).toBe('demo-user');
    });
  });

  describe('Demo Mode', () => {
    beforeEach(() => {
      process.env.AUTH_MODE = 'demo';
    });

    it('accepts an allowlisted demo persona header and ignores body/query identity', () => {
      const req = {
        headers: { 'x-demo-user': 'phase4-eval-v3:focused-builder' },
        body: { userId: 'spoofed-body' },
        query: { userId: 'spoofed-query' },
      } as unknown as Request;

      expect(getUserId(req)).toBe('phase4-eval-v3:focused-builder');
    });

    it('rejects missing and unknown demo persona headers', () => {
      const missing = { headers: {}, body: { userId: 'phase4-eval-v1:focused-builder' } } as unknown as Request;
      const unknown = { headers: { 'x-demo-user': 'arbitrary-user' } } as unknown as Request;

      expect(() => getUserId(missing)).toThrow('Unauthorized: missing or invalid demo persona');
      expect(() => getUserId(unknown)).toThrow(UnauthorizedError);
    });
  });
});
