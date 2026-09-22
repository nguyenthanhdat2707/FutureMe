import { CognitoUserPool, CognitoUserSession } from 'amazon-cognito-identity-js';

export const isCognitoMode = import.meta.env.VITE_AUTH_MODE === 'cognito';

let pool: CognitoUserPool | null = null;

if (isCognitoMode) {
  const UserPoolId = import.meta.env.VITE_COGNITO_USER_POOL_ID;
  const ClientId = import.meta.env.VITE_COGNITO_USER_POOL_CLIENT_ID;

  if (!UserPoolId || !ClientId) {
    throw new Error('Cognito auth mode requires VITE_COGNITO_USER_POOL_ID and VITE_COGNITO_USER_POOL_CLIENT_ID');
  }

  pool = new CognitoUserPool({
    UserPoolId,
    ClientId,
  });
}

export const userPool = pool;

export async function getAuthToken(): Promise<string | null> {
  if (!isCognitoMode || !pool) return null;
  const currentUser = pool.getCurrentUser();
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
}
