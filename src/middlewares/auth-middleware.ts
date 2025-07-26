import { createMiddleware } from 'hono/factory';
import { getCookie } from 'hono/cookie';
import { Auth, HttpStatusCode } from '../utils';
import { DatabaseFactory } from '../database';

const dbInstance = DatabaseFactory.create();
const dbClient = dbInstance.connect();

export const authMiddleware = createMiddleware(async (c, next) => {
  const authHeader = c.req.header('Authorization');
  const cookieToken = getCookie(c, 'access_token');

  let token = '';

  if (authHeader?.startsWith('Bearer ')) {
    token = authHeader.replace('Bearer ', '');
  } else if (cookieToken) {
    token = cookieToken;
  }

  if (!token) {
    return c.json(
      { message: 'Invalid access token' },
      HttpStatusCode.UNAUTHORIZED
    );
  }

  const auth = new Auth(dbClient);
  const payload = await auth.verifyAccessToken(token);

  if (!payload) {
    return c.json(
      { message: 'Invalid or expired access token' },
      HttpStatusCode.UNAUTHORIZED
    );
  }

  c.set('jwtPayload', payload);

  await next();
});
