import { createContext, useContext } from 'react';
import { CognitoUser } from 'amazon-cognito-identity-js';

export interface AuthContextType {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: CognitoUser | null;
  getToken: () => Promise<string | null>;
  signOut: () => void;
  refreshSession: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
