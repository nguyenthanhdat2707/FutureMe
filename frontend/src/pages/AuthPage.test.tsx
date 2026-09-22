
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom';
import AuthPage from './AuthPage';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import * as AuthProviderModule from '../auth/AuthContext';
import * as CognitoModule from '../auth/cognito';

// Component to observe current location
const LocationObserver = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
};

// Mock cognito user pool for sign in test
const mockAuthenticateUser = vi.fn();
vi.mock('amazon-cognito-identity-js', () => {
  class CognitoUser {
    authenticateUser = mockAuthenticateUser;
  }
  return {
    CognitoUser,
    AuthenticationDetails: vi.fn(),
    CognitoUserAttribute: vi.fn(),
  };
});

describe('AuthPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('redirects to location.state.from when authenticated', () => {
    vi.spyOn(AuthProviderModule, 'useAuth').mockReturnValue({
      isAuthenticated: true,
      isLoading: false,
      user: null,
      getToken: vi.fn(),
      signOut: vi.fn(),
      refreshSession: vi.fn(),
    });
    vi.spyOn(CognitoModule, 'isCognitoMode', 'get').mockReturnValue(true);

    render(
      <MemoryRouter initialEntries={[{ pathname: '/auth', state: { from: { pathname: '/context' } } }]}>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/context" element={<LocationObserver />} />
          <Route path="/" element={<LocationObserver />} />
        </Routes>
      </MemoryRouter>
    );

    // If it redirects to /context, the LocationObserver will render /context
    // Currently it redirects to / which will render / in the DOM
    expect(screen.getByTestId('location').textContent).toBe('/context');
  });

  it('shows error and stops loading if refreshSession fails after onSuccess', async () => {
    const refreshSessionMock = vi.fn().mockRejectedValue(new Error('Session rejected'));
    vi.spyOn(AuthProviderModule, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      getToken: vi.fn(),
      signOut: vi.fn(),
      refreshSession: refreshSessionMock,
    });
    vi.spyOn(CognitoModule, 'isCognitoMode', 'get').mockReturnValue(true);
    vi.spyOn(CognitoModule, 'userPool', 'get').mockReturnValue({} as any);

    mockAuthenticateUser.mockImplementation((_details, callbacks) => {
      callbacks.onSuccess();
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/auth']}>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
      </MemoryRouter>
    );

    // Fill form and submit
    fireEvent.change(container.querySelector('input[type="email"]')!, { target: { value: 'test@example.com' } });
    fireEvent.change(container.querySelector('input[type="password"]')!, { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    // Expect error to be shown
    await waitFor(() => {
      expect(screen.getByText('Session rejected')).toBeTruthy();
    });
    // Loading should be stopped (button should say 'Sign In' not 'Signing in...')
    expect(screen.getByRole('button', { name: 'Sign In' }).hasAttribute('disabled')).toBeFalsy();
  });
});

  it('stops loading if refreshSession succeeds', async () => {
    const refreshSessionMock = vi.fn().mockResolvedValue(undefined);
    vi.spyOn(AuthProviderModule, 'useAuth').mockReturnValue({
      isAuthenticated: false,
      isLoading: false,
      user: null,
      getToken: vi.fn(),
      signOut: vi.fn(),
      refreshSession: refreshSessionMock,
    });
    vi.spyOn(CognitoModule, 'isCognitoMode', 'get').mockReturnValue(true);
    vi.spyOn(CognitoModule, 'userPool', 'get').mockReturnValue({} as any);

    mockAuthenticateUser.mockImplementation((_details, callbacks) => {
      callbacks.onSuccess();
    });

    const { container } = render(
      <MemoryRouter initialEntries={['/auth']}>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(container.querySelector('input[type="email"]')!, { target: { value: 'test@example.com' } });
    fireEvent.change(container.querySelector('input[type="password"]')!, { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Sign In' }).hasAttribute('disabled')).toBeFalsy();
    });
  });
