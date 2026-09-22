import { render, waitFor, screen, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useState } from 'react';
import { AuthProvider } from './AuthProvider';
import { useAuth } from './AuthContext';
import * as CognitoModule from './cognito';
import { CognitoUserPool, CognitoUserSession } from 'amazon-cognito-identity-js';

const TestComponent = () => {
  const { isLoading, isAuthenticated, refreshSession } = useAuth();
  const [errorMsg, setErrorMsg] = useState('');
  return (
    <div>
      <div data-testid="loading">{isLoading ? 'loading' : 'done'}</div>
      <div data-testid="auth">{isAuthenticated ? 'yes' : 'no'}</div>
      <button onClick={() => refreshSession().catch(e => setErrorMsg(e.message))}>
        Refresh
      </button>
      <div data-testid="error">{errorMsg}</div>
    </div>
  );
};

describe('AuthProvider', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('captures initial user once and avoids race condition', async () => {
    vi.spyOn(CognitoModule, 'isCognitoMode', 'get').mockReturnValue(true);

    let sessionCallback: ((err: Error | null, session: CognitoUserSession | null) => void) | null = null;
    const mockUser = {
      getSession: vi.fn((cb) => {
        sessionCallback = cb;
      })
    };
    const mockUserPool = {
      getCurrentUser: vi.fn().mockReturnValue(mockUser)
    } as unknown as CognitoUserPool;
    vi.spyOn(CognitoModule, 'userPool', 'get').mockReturnValue(mockUserPool);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    // Should start loading
    expect(screen.getByTestId('loading').textContent).toBe('loading');

    // We expect the lazy initializer to capture the user exactly once.
    expect(mockUserPool.getCurrentUser).toHaveBeenCalledTimes(1);

    // Simulate async session resolution
    act(() => {
      sessionCallback!(null, { isValid: () => true } as unknown as CognitoUserSession);
    });

    await waitFor(() => {
      expect(screen.getByTestId('loading').textContent).toBe('done');
      expect(screen.getByTestId('auth').textContent).toBe('yes');
    });
  });

  it('refreshSession rejects if no current user', async () => {
    vi.spyOn(CognitoModule, 'isCognitoMode', 'get').mockReturnValue(true);
    const mockUserPool = {
      getCurrentUser: vi.fn().mockReturnValue(null)
    } as unknown as CognitoUserPool;
    vi.spyOn(CognitoModule, 'userPool', 'get').mockReturnValue(mockUserPool);

    render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await act(async () => {
      screen.getByText('Refresh').click();
    });

    await waitFor(() => {
      expect(screen.getByTestId('error').textContent).toBe('No current session');
    });
  });
});
