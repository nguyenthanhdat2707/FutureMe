import React, { useEffect, useState, ReactNode } from 'react';
import { CognitoUserSession, CognitoUser } from 'amazon-cognito-identity-js';
import { userPool, isCognitoMode } from './cognito';
import { AuthContext } from './AuthContext';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [initialUser] = useState(() => {
    if (!isCognitoMode || !userPool) return null;
    return userPool.getCurrentUser();
  });
  const [isAuthenticated, setIsAuthenticated] = useState(!isCognitoMode);
  const [isLoading, setIsLoading] = useState(() => !!initialUser);
  const [user, setUser] = useState<CognitoUser | null>(null);

  useEffect(() => {
    if (!initialUser) {
      return;
    }

    initialUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
      if (err || !session || !session.isValid()) {
        setIsAuthenticated(false);
        setUser(null);
      } else {
        setIsAuthenticated(true);
        setUser(initialUser);
      }
      setIsLoading(false);
    });
  }, [initialUser]);

  const getToken = async (): Promise<string | null> => {
    if (!isCognitoMode || !userPool) return null;
    const currentUser = userPool.getCurrentUser();
    if (!currentUser) return null;

    return new Promise((resolve, reject) => {
      currentUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
        if (err) {
          reject(err);
        } else if (!session || !session.isValid()) {
          resolve(null);
        } else {
          resolve(session.getIdToken().getJwtToken());
        }
      });
    });
  };

  const refreshSession = async () => {
    if (!isCognitoMode || !userPool) return;
    const currentUser = userPool.getCurrentUser();
    if (currentUser) {
      return new Promise<void>((resolve, reject) => {
        currentUser.getSession((err: Error | null, session: CognitoUserSession | null) => {
          if (err || !session || !session.isValid()) {
            setIsAuthenticated(false);
            setUser(null);
            reject(err || new Error('Invalid session'));
          } else {
            setIsAuthenticated(true);
            setUser(currentUser);
            resolve();
          }
        });
      });
    }
    return Promise.reject(new Error('No current session'));
  };

  const signOut = () => {
    if (!isCognitoMode || !userPool) return;
    const currentUser = userPool.getCurrentUser();
    if (currentUser) {
      currentUser.signOut();
    }
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        getToken,
        signOut,
        refreshSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
