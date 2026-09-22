import React, { useState } from 'react';
import { AuthenticationDetails, CognitoUser, CognitoUserAttribute } from 'amazon-cognito-identity-js';
import { userPool, isCognitoMode } from '../auth/cognito';
import { useAuth } from '../auth/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';

type AuthState = 'SIGN_IN' | 'SIGN_UP' | 'CONFIRM';

export default function AuthPage() {
  const { isAuthenticated, refreshSession } = useAuth();
  const [authState, setAuthState] = useState<AuthState>('SIGN_IN');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const location = useLocation();
  const from = location.state?.from?.pathname || '/';

  if (isAuthenticated || !isCognitoMode) {
    return <Navigate to={from} replace />;
  }

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userPool) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    const normalizedEmail = email.trim().toLowerCase();
    setEmail(normalizedEmail);

    const authenticationDetails = new AuthenticationDetails({
      Username: normalizedEmail,
      Password: password,
    });

    const cognitoUser = new CognitoUser({
      Username: normalizedEmail,
      Pool: userPool,
    });

    cognitoUser.authenticateUser(authenticationDetails, {
      onSuccess: () => {
        refreshSession().then(() => {
          setLoading(false);
        }).catch((err: unknown) => {
          setError(err instanceof Error ? err.message : 'Failed to sign in');
          setLoading(false);
        });
      },
      onFailure: (err) => {
        setError(err.message || 'Failed to sign in');
        setLoading(false);
      },
    });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!userPool) return;

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }
    if (!/[A-Z]/.test(password)) {
      setError('Password must contain at least one uppercase letter');
      return;
    }
    if (!/[a-z]/.test(password)) {
      setError('Password must contain at least one lowercase letter');
      return;
    }
    if (!/[0-9]/.test(password)) {
      setError('Password must contain at least one number');
      return;
    }
    if (!/[!"#$%&'()*+,\-./:;<=>?@[\\\]^_`{|}~]/.test(password)) {
      setError('Password must contain at least one symbol');
      return;
    }

    setLoading(true);

    const normalizedEmail = email.trim().toLowerCase();
    setEmail(normalizedEmail);

    const attributeList = [
      new CognitoUserAttribute({ Name: 'email', Value: normalizedEmail }),
    ];

    userPool.signUp(normalizedEmail, password, attributeList, [], (err, result) => {
      setLoading(false);
      if (err) {
        if (err.name === 'UsernameExistsException') {
          setError('Account already exists. Please Sign In if confirmed, or use "Already have a confirmation code?" if not.');
        } else {
          setError(err.message || 'Failed to sign up');
        }
        return;
      }
      if (result?.user) {
        setAuthState('CONFIRM');
      } else {
        setError('Unexpected response from signup. Please try again.');
      }
    });
  };

  const handleResendCode = async () => {
    if (!userPool) return;
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      setError('Please enter your email to resend the code.');
      return;
    }
    setLoading(true);
    setError(null);
    setSuccess(null);

    const cognitoUser = new CognitoUser({
      Username: normalizedEmail,
      Pool: userPool,
    });

    cognitoUser.resendConfirmationCode((err) => {
      setLoading(false);
      if (err) {
        setError(err.message || 'Failed to resend confirmation code');
        return;
      }
      setSuccess('Code resent successfully!');
    });
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userPool) return;
    setLoading(true);
    setError(null);
    setSuccess(null);

    const normalizedEmail = email.trim().toLowerCase();
    setEmail(normalizedEmail);
    const trimmedCode = code.trim();

    const cognitoUser = new CognitoUser({
      Username: normalizedEmail,
      Pool: userPool,
    });

    cognitoUser.confirmRegistration(trimmedCode, true, (err) => {
      setLoading(false);
      if (err) {
        setError(err.message || 'Failed to confirm registration');
        return;
      }
      setAuthState('SIGN_IN');
      setPassword('');
      setCode('');
      setSuccess('Registration confirmed! Please sign in.');
    });
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-sm border border-slate-200">
        <h1 className="text-2xl font-semibold mb-6 text-slate-900 text-center">
          {authState === 'SIGN_IN' && 'Sign In to Future Me'}
          {authState === 'SIGN_UP' && 'Create an Account'}
          {authState === 'CONFIRM' && 'Confirm Email'}
        </h1>

        {success && (
          <div role="status" className="mb-4 p-3 bg-green-50 text-green-700 rounded text-sm">
            {success}
          </div>
        )}
        {error && (
          <div role="alert" className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        {authState === 'SIGN_IN' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label htmlFor="signin-email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                id="signin-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label htmlFor="signin-password" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                id="signin-password"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
            <div className="text-center text-sm text-slate-600 mt-4">
              Don't have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthState('SIGN_UP');
                  setError(null);
                  setSuccess(null);
                }}
                className="text-blue-600 hover:underline"
              >
                Sign Up
              </button>
            </div>
          </form>
        )}

        {authState === 'SIGN_UP' && (
          <form onSubmit={handleSignUp} className="space-y-4">
            <div>
              <label htmlFor="signup-email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                id="signup-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label htmlFor="signup-password" className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                id="signup-password"
                type="password"
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
              <p className="text-xs text-slate-500 mt-1">Minimum 8 characters with uppercase, lowercase, number, and symbol.</p>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
            <div className="text-center text-sm text-slate-600 mt-4">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => {
                  setAuthState('SIGN_IN');
                  setError(null);
                  setSuccess(null);
                }}
                className="text-blue-600 hover:underline"
              >
                Sign In
              </button>
            </div>
            <div className="text-center text-sm mt-2">
              <button
                type="button"
                onClick={() => {
                  const normalizedEmail = email.trim().toLowerCase();
                  if (!normalizedEmail) {
                    setError('Please enter your email address to confirm.');
                    return;
                  }
                  setEmail(normalizedEmail);
                  setAuthState('CONFIRM');
                  setError(null);
                  setSuccess(null);
                }}
                className="text-slate-500 hover:text-slate-700 underline"
              >
                Already have a confirmation code?
              </button>
            </div>
          </form>
        )}

        {authState === 'CONFIRM' && (
          <form onSubmit={handleConfirm} className="space-y-4">
            <p className="text-sm text-slate-600 mb-4">
              Please enter your email and the confirmation code.
            </p>
            <div>
              <label htmlFor="confirm-email" className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                id="confirm-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label htmlFor="confirm-code" className="block text-sm font-medium text-slate-700 mb-1">Confirmation Code</label>
              <input
                id="confirm-code"
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700 disabled:opacity-50"
            >
              {loading ? 'Confirming...' : 'Confirm'}
            </button>
            <div className="text-center text-sm text-slate-600 mt-4 flex flex-col space-y-2">
              <button
                type="button"
                disabled={loading}
                onClick={handleResendCode}
                className="text-blue-600 hover:underline disabled:opacity-50"
              >
                Resend code
              </button>
              <div>
                <button
                  type="button"
                  onClick={() => {
                    setAuthState('SIGN_UP');
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-slate-500 hover:underline mx-2"
                >
                  Back to Sign Up
                </button>
                <span className="text-slate-300">|</span>
                <button
                  type="button"
                  onClick={() => {
                    setAuthState('SIGN_IN');
                    setError(null);
                    setSuccess(null);
                  }}
                  className="text-slate-500 hover:underline mx-2"
                >
                  Back to Sign In
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
