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

    const authenticationDetails = new AuthenticationDetails({
      Username: email,
      Password: password,
    });

    const cognitoUser = new CognitoUser({
      Username: email,
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
    if (!userPool) return;
    setLoading(true);
    setError(null);

    const attributeList = [
      new CognitoUserAttribute({ Name: 'email', Value: email }),
    ];

    userPool.signUp(email, password, attributeList, [], (err, result) => {
      setLoading(false);
      if (err) {
        setError(err.message || 'Failed to sign up');
        return;
      }
      if (result?.user) {
        setAuthState('CONFIRM');
      }
    });
  };

  const handleConfirm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userPool) return;
    setLoading(true);
    setError(null);

    const cognitoUser = new CognitoUser({
      Username: email,
      Pool: userPool,
    });

    cognitoUser.confirmRegistration(code, true, (err) => {
      setLoading(false);
      if (err) {
        setError(err.message || 'Failed to confirm registration');
        return;
      }
      setAuthState('SIGN_IN');
      setPassword('');
      setCode('');
      setError('Registration confirmed! Please sign in.');
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

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded text-sm">
            {error}
          </div>
        )}

        {authState === 'SIGN_IN' && (
          <form onSubmit={handleSignIn} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
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
                onClick={() => { setAuthState('SIGN_UP'); setError(null); }}
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
              <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-2 border border-slate-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
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
              {loading ? 'Creating account...' : 'Sign Up'}
            </button>
            <div className="text-center text-sm text-slate-600 mt-4">
              Already have an account?{' '}
              <button
                type="button"
                onClick={() => { setAuthState('SIGN_IN'); setError(null); }}
                className="text-blue-600 hover:underline"
              >
                Sign In
              </button>
            </div>
          </form>
        )}

        {authState === 'CONFIRM' && (
          <form onSubmit={handleConfirm} className="space-y-4">
            <p className="text-sm text-slate-600 mb-4">
              We sent a confirmation code to {email}.
            </p>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Confirmation Code</label>
              <input
                type="text"
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
            <div className="text-center text-sm text-slate-600 mt-4">
              <button
                type="button"
                onClick={() => { setAuthState('SIGN_IN'); setError(null); }}
                className="text-blue-600 hover:underline"
              >
                Back to Sign In
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
