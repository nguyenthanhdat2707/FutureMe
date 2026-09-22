import { describe, it, expect } from 'vitest';
import config from './vite.config';

describe('Vite Config', () => {
  it('should define a safe global alias for amazon-cognito-identity-js in browser', () => {
    expect(config).toMatchObject({
      define: {
        global: 'globalThis'
      }
    });
  });
});
