import serverless from 'serverless-http';
import { createApp } from './app';
import { setCognitoSub } from './utils/identity';
import { Request } from 'express';

const app = createApp();

interface APIGatewayRequestContext {
  authorizer?: {
    jwt?: {
      claims?: {
        sub?: string;
      };
    };
  };
}

interface APIGatewayEvent {
  requestContext?: APIGatewayRequestContext;
}

export const handler = serverless(app, {
  request: (request: Request, event: APIGatewayEvent) => {
    const sub = event.requestContext?.authorizer?.jwt?.claims?.sub;
    if (sub && typeof sub === 'string' && sub.trim().length > 0) {
      setCognitoSub(request, sub.trim());
    }
  }
});
