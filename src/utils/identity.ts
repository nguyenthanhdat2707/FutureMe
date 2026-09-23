import { Request } from 'express';
import { isDemoPersonaId } from '../demo/personas';

const COGNITO_SUB_SYMBOL = Symbol('cognito_sub');

export interface AuthenticatedRequest extends Request {
  [COGNITO_SUB_SYMBOL]?: string;
}

export function setCognitoSub(req: Request, sub: string) {
  (req as AuthenticatedRequest)[COGNITO_SUB_SYMBOL] = sub;
}

export class UnauthorizedError extends Error {
  constructor(message = 'Unauthorized') {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export function getUserId(req: Request): string {
  if (process.env.AUTH_MODE === 'cognito') {
    const sub = (req as AuthenticatedRequest)[COGNITO_SUB_SYMBOL];
    if (typeof sub === 'string' && sub.trim().length > 0) {
      return sub.trim();
    }
    throw new UnauthorizedError('Unauthorized: missing or invalid sub claim');
  }

  if (process.env.AUTH_MODE === 'demo') {
    const header = req.headers?.['x-demo-user'];
    const demoUserId = (Array.isArray(header) ? header[0] : header)?.trim();
    if (demoUserId && isDemoPersonaId(demoUserId)) {
      return demoUserId;
    }
    throw new UnauthorizedError('Unauthorized: missing or invalid demo persona');
  }

  // Fallback for local testing if not using cognito
  const header = req.headers?.['x-demo-user'];
  const demoUserId = (Array.isArray(header) ? header[0] : header)?.trim();
  const body = req.body as Record<string, unknown> | undefined;
  const query = req.query as Record<string, unknown> | undefined;
  
  const bodyUserId = typeof body?.userId === 'string' ? body.userId : undefined;
  const queryUserId = typeof query?.userId === 'string' ? query.userId : undefined;
  
  return demoUserId || bodyUserId || queryUserId || 'demo-user';
}

