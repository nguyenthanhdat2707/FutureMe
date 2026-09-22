import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import AuthPage from './AuthPage';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { CognitoUserPool } from 'amazon-cognito-identity-js';
import * as CognitoModule from '../auth/cognito';
import * as AuthProviderModule from '../auth/AuthContext';
import '@testing-library/jest-dom';

const mockAuthenticateUser = vi.fn();
const mockResendConfirmationCode = vi.fn();
const mockConfirmRegistration = vi.fn();
const mockSignUp = vi.fn();

const mockAuthenticationDetails = vi.fn();
const mockCognitoUser = vi.fn();

vi.mock('amazon-cognito-identity-js', () => {
  class CognitoUser {
    authenticateUser = mockAuthenticateUser;
    resendConfirmationCode = mockResendConfirmationCode;
    confirmRegistration = mockConfirmRegistration;
    constructor(data: { Username: string; Pool: CognitoUserPool }) {
      mockCognitoUser(data);
    }
  }
  class CognitoUserPool {
    constructor() {}
    signUp = mockSignUp;
    getCurrentUser() { return null; }
  }
  class AuthenticationDetails {
    constructor(data: { Username: string; Password?: string }) {
      mockAuthenticationDetails(data);
    }
  }
  return {
    CognitoUser,
    CognitoUserPool,
    AuthenticationDetails,
    CognitoUserAttribute: class {
      Name: string;
      Value: string;
      constructor({ Name, Value }: { Name: string, Value: string }) {
        this.Name = Name;
        this.Value = Value;
      }
    },
  };
});

function LocationObserver() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function setupAuthPage(initialRoute = '/auth') {
  const refreshSessionMock = vi.fn().mockResolvedValue(undefined);
  vi.spyOn(AuthProviderModule, 'useAuth').mockReturnValue({
    isAuthenticated: false,
    isLoading: false,
    user: null,
    getToken: vi.fn(),
    signOut: vi.fn(),
    refreshSession: refreshSessionMock,
  });

  const utils = render(
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/context" element={<LocationObserver />} />
        <Route path="/" element={<LocationObserver />} />
      </Routes>
    </MemoryRouter>
  );

  return {
    ...utils,
    refreshSessionMock,
  };
}

describe('AuthPage', () => {
  let mockPool: CognitoUserPool;

  beforeEach(() => {
    vi.clearAllMocks();
    mockPool = new CognitoUserPool({ UserPoolId: 'us-east-1_123', ClientId: '123' });
    vi.spyOn(CognitoModule, 'isCognitoMode', 'get').mockReturnValue(true);
    vi.spyOn(CognitoModule, 'userPool', 'get').mockReturnValue(mockPool);
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
    render(
      <MemoryRouter initialEntries={[{ pathname: '/auth', state: { from: { pathname: '/context' } } }]}>
        <Routes>
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/context" element={<LocationObserver />} />
          <Route path="/" element={<LocationObserver />} />
        </Routes>
      </MemoryRouter>
    );
    expect(screen.getByTestId('location').textContent).toBe('/context');
  });

  it('normalizes email for sign-in before constructing CognitoUser/AuthenticationDetails', async () => {
    const { container } = setupAuthPage();
    fireEvent.change(container.querySelector('input[type="email"]')!, { target: { value: '  TeSt@ExAmple.com  ' } });
    fireEvent.change(container.querySelector('input[type="password"]')!, { target: { value: 'password123' } });

    mockAuthenticateUser.mockImplementation((_details, callbacks) => {
      callbacks.onSuccess();
    });

    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(mockAuthenticationDetails).toHaveBeenCalledWith(expect.objectContaining({
        Username: 'test@example.com',
        Password: 'password123'
      }));
      expect(mockCognitoUser).toHaveBeenCalledWith(expect.objectContaining({
        Username: 'test@example.com'
      }));
    });
  });

  it('shows error and stops loading if refreshSession fails after onSuccess', async () => {
    const { container, refreshSessionMock } = setupAuthPage();
    refreshSessionMock.mockRejectedValue(new Error('Session rejected'));

    mockAuthenticateUser.mockImplementation((_details, callbacks) => {
      callbacks.onSuccess();
    });

    fireEvent.change(container.querySelector('input[type="email"]')!, { target: { value: 'test@example.com' } });
    fireEvent.change(container.querySelector('input[type="password"]')!, { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(screen.getByText('Session rejected')).toBeTruthy();
    });
    expect(screen.getByRole('button', { name: 'Sign In' })).not.toBeDisabled();
  });

  it('blocks signup if password lacks length, uppercase, lowercase, number, or symbol', async () => {
    const { container } = setupAuthPage();
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));

    const passwordInput = container.querySelector('input[type="password"]')!;
    expect(passwordInput).toHaveAttribute('minLength', '8');
    expect(passwordInput).toHaveAttribute('autoComplete', 'new-password');

    const emailInput = container.querySelector('input[type="email"]')!;
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    // Test length
    fireEvent.change(passwordInput, { target: { value: 'Ab1!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/at least 8 characters/i);
    });
    expect(mockSignUp).not.toHaveBeenCalled();

    // Test missing uppercase
    fireEvent.change(passwordInput, { target: { value: 'abcde123!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/uppercase/i);
    });
    expect(mockSignUp).not.toHaveBeenCalled();

    // Test missing lowercase
    fireEvent.change(passwordInput, { target: { value: 'ABCDE123!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/lowercase/i);
    });
    expect(mockSignUp).not.toHaveBeenCalled();

    // Test missing number
    fireEvent.change(passwordInput, { target: { value: 'Abcdefgh!' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/number/i);
    });
    expect(mockSignUp).not.toHaveBeenCalled();

    // Test missing symbol (using space which is not valid symbol for this policy)
    fireEvent.change(passwordInput, { target: { value: 'Abcdef123 ' } });
    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));
    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/symbol/i);
    });
    expect(mockSignUp).not.toHaveBeenCalled();
  });

  it('handles UsernameExistsException on sign up', async () => {
    const { container } = setupAuthPage();
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));

    fireEvent.change(container.querySelector('input[type="email"]')!, { target: { value: 'test@example.com' } });
    fireEvent.change(container.querySelector('input[type="password"]')!, { target: { value: 'Valid123!' } });

    mockSignUp.mockImplementation((_email, _password, _attrs, _validation, callback) => {
      const err = new Error('User exists');
      err.name = 'UsernameExistsException';
      callback(err, null);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Account already exists/i);
    });
    expect(screen.getByRole('button', { name: 'Sign Up' })).not.toBeDisabled();
  });

  it('handles generic sign up error', async () => {
    const { container } = setupAuthPage();
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));
    fireEvent.change(container.querySelector('input[type="email"]')!, { target: { value: 'test@example.com' } });
    fireEvent.change(container.querySelector('input[type="password"]')!, { target: { value: 'Valid123!' } });

    mockSignUp.mockImplementation((_email, _password, _attrs, _validation, callback) => {
      callback(new Error('Network error'), null);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Network error/i);
    });
    expect(screen.getByRole('button', { name: 'Sign Up' })).not.toBeDisabled();
  });

  it('prevents entering CONFIRM with blank email', async () => {
    const { container } = setupAuthPage();
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));

    // Blank email
    fireEvent.change(container.querySelector('input[type="email"]')!, { target: { value: '   ' } });
    fireEvent.click(screen.getByRole('button', { name: /Already have a confirmation code\?/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Please enter your email/i);
      expect(screen.getByRole('heading', { name: /Create an Account/i })).toBeTruthy();
    });
  });

  it('normalizes email, signs up successfully, and handles success-without-user error', async () => {
    const { container } = setupAuthPage();
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));

    const emailInput = container.querySelector('input[type="email"]')!;
    const passwordInput = container.querySelector('input[type="password"]')!;

    fireEvent.change(emailInput, { target: { value: '  TEST@example.com  ' } });
    fireEvent.change(passwordInput, { target: { value: 'Valid123!' } });

    mockSignUp.mockImplementation((_email, _password, _attributeList, _validationData, callback) => {
      callback(null, { user: {} });
    });

    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    await waitFor(() => {
      expect(mockSignUp).toHaveBeenCalledWith(
        'test@example.com',
        'Valid123!',
        expect.arrayContaining([
          expect.objectContaining({ Name: 'email', Value: 'test@example.com' })
        ]),
        [],
        expect.any(Function)
      );
      expect(screen.getByRole('heading', { name: /Confirm Email/i })).toBeTruthy();
    });
  });

  it('handles success-without-user as an error', async () => {
    const { container } = setupAuthPage();
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));

    fireEvent.change(container.querySelector('input[type="email"]')!, { target: { value: 'test@example.com' } });
    fireEvent.change(container.querySelector('input[type="password"]')!, { target: { value: 'Valid123!' } });

    mockSignUp.mockImplementation((_email, _password, _attributeList, _validationData, callback) => {
      callback(null, {}); // No user in result
    });

    fireEvent.click(screen.getByRole('button', { name: 'Sign Up' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Unexpected response/i);
    });
    expect(screen.getByRole('button', { name: 'Sign Up' })).not.toBeDisabled();
  });

  it('allows navigation from Sign Up to Confirm and back, preserving normalized email', async () => {
    const { container } = setupAuthPage();
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));
    fireEvent.change(container.querySelector('input[type="email"]')!, { target: { value: '  MY@email.com  ' } });

    fireEvent.click(screen.getByRole('button', { name: /Already have a confirmation code\?/i }));
    expect(screen.getByRole('heading', { name: /Confirm Email/i })).toBeTruthy();

    expect(screen.getByDisplayValue('my@email.com')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: /Back to Sign Up/i }));
    expect(screen.getByRole('heading', { name: /Create an Account/i })).toBeTruthy();
    expect(container.querySelector('input[type="email"]')!).toHaveValue('my@email.com');
  });

  it('resends confirmation code and shows success message', async () => {
    const { container } = setupAuthPage();
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));
    fireEvent.change(container.querySelector('input[type="email"]')!, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Already have a confirmation code\?/i }));

    mockResendConfirmationCode.mockImplementation((callback) => callback(null));

    fireEvent.click(screen.getByRole('button', { name: /Resend code/i }));

    await waitFor(() => {
      expect(mockResendConfirmationCode).toHaveBeenCalled();
      const statusElement = screen.getByRole('status');
      expect(statusElement).toHaveTextContent(/Code resent/i);
    });
  });

  it('handles resend confirmation code error', async () => {
    const { container } = setupAuthPage();
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));
    fireEvent.change(container.querySelector('input[type="email"]')!, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Already have a confirmation code\?/i }));

    mockResendConfirmationCode.mockImplementation((callback) => callback(new Error('Resend failed')));

    fireEvent.click(screen.getByRole('button', { name: /Resend code/i }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Resend failed/i);
    });
    expect(screen.getByRole('button', { name: /Resend code/i })).not.toBeDisabled();
  });

  it('confirms registration successfully, shows positive status, and clears password/code', async () => {
    const { container } = setupAuthPage();

    // Fill in sign up first to set a password
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));
    const emailInput = container.querySelector('input[type="email"]')!;
    const passwordInput = container.querySelector('input[type="password"]')!;

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'Valid123!' } });

    // Go to confirm
    fireEvent.click(screen.getByRole('button', { name: /Already have a confirmation code\?/i }));

    const codeInput = screen.getByLabelText(/Confirmation Code/i);
    fireEvent.change(codeInput, { target: { value: ' 123456 ' } });

    mockConfirmRegistration.mockImplementation((_code, _force, callback) => {
      callback(null);
    });

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => {
      expect(mockConfirmRegistration).toHaveBeenCalledWith('123456', true, expect.any(Function));
    });

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: /Sign In/i })).toBeTruthy();

      const statusElement = screen.getByRole('status');
      expect(statusElement).toHaveTextContent(/Registration confirmed/i);
      expect(statusElement).not.toHaveClass('bg-red-50');

      // Ensure email is preserved and password/code are cleared
      const signInEmailInput = container.querySelector('input[type="email"]')!;
      const signInPasswordInput = container.querySelector('input[type="password"]')!;

      expect(signInEmailInput).toHaveValue('test@example.com');
      expect(signInPasswordInput).toHaveValue('');
    });
  });

  it('handles confirm registration error', async () => {
    const { container } = setupAuthPage();
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));
    fireEvent.change(container.querySelector('input[type="email"]')!, { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /Already have a confirmation code\?/i }));

    fireEvent.change(screen.getByLabelText(/Confirmation Code/i), { target: { value: '123456' } });

    mockConfirmRegistration.mockImplementation((_code, _force, callback) => {
      callback(new Error('Invalid code'));
    });

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }));

    await waitFor(() => {
      expect(screen.getByRole('alert')).toHaveTextContent(/Invalid code/i);
    });
    expect(screen.getByRole('button', { name: 'Confirm' })).not.toBeDisabled();
  });
});
