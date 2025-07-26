import { Hono } from 'hono';
import { setCookie, deleteCookie, getCookie } from 'hono/cookie';
import { zValidator } from '@hono/zod-validator';

import { LoginDto } from '../dtos/user/login';
import { Auth, HttpStatusCode } from '../utils';
import { DatabaseFactory } from '../database';
import { UserRepository } from '../repositories/user-repository';
import { config } from '../settings/settings';
import { CreateUserDto } from '../dtos/user';
import { authMiddleware } from '../middlewares/auth-middleware';

const authController = new Hono();
const dbInstance = DatabaseFactory.create();
const dbClient = dbInstance.connect();

const userRepository = new UserRepository(dbClient);

authController.post('/login', zValidator('form', LoginDto), async c => {
  const { param: usernameOrEmail, password } = c.req.valid('form');

  const result = await userRepository.getByEmailOrUsername(usernameOrEmail);

  if (result instanceof Error) {
    return c.json(
      { message: 'Internal server error' },
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }

  if (!result) {
    return c.json(
      { message: 'Invalid credentials' },
      HttpStatusCode.BAD_REQUEST
    );
  }

  const validPassword = await Auth.verifyPassword(password, result.password);

  if (!validPassword) {
    return c.json(
      { message: 'Invalid credentials' },
      HttpStatusCode.BAD_REQUEST
    );
  }

  const auth = new Auth(dbClient);
  const tokens = await auth.generateTokenPair(result.id, result.email);

  setCookie(c, 'access_token', tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: config.accessTokenExpiry,
  });

  setCookie(c, 'refresh_token', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: config.refreshTokenExpiry,
    path: '/auth/refresh',
  });

  return c.json(tokens, HttpStatusCode.OK);
});

authController.post('/logout', authMiddleware, async c => {
  const refreshToken = getCookie(c, 'refresh_token');

  if (refreshToken) {
    const auth = new Auth(dbClient);
    const payload = await auth.verifyRefreshToken(refreshToken);

    if (payload) {
      const result = await auth.revokeRefreshToken(payload.tokenId);

      if (result instanceof Error) {
        return c.json(
          { message: result.message },
          HttpStatusCode.INTERNAL_SERVER_ERROR
        );
      }
    }
  }

  deleteCookie(c, 'access_token');
  deleteCookie(c, 'refresh_token', { path: '/auth/refresh' });

  return c.json({ message: 'Logged out' }, HttpStatusCode.OK);
});

authController.post('/refresh', async c => {
  const authHeader = c.req.header('Authorization');
  const cookieToken = getCookie(c, 'refresh_token');

  let refreshToken = '';

  if (authHeader?.startsWith('Bearer ')) {
    refreshToken = authHeader.replace('Bearer ', '');
  } else if (cookieToken) {
    refreshToken = cookieToken;
  }

  if (!refreshToken) {
    return c.json(
      { message: 'Refresh token required' },
      HttpStatusCode.UNAUTHORIZED
    );
  }

  const auth = new Auth(dbClient);
  const payload = await auth.verifyRefreshToken(refreshToken);

  if (!payload) {
    return c.json(
      { message: 'Invalid or expired refresh token' },
      HttpStatusCode.UNAUTHORIZED
    );
  }

  const user = await userRepository.getById(payload.userId);

  if (user instanceof Error) {
    return c.json(
      { message: 'Internal server error' },
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }

  if (!user) {
    return c.json({ message: 'User not found' }, HttpStatusCode.NOT_FOUND);
  }

  const result = await auth.revokeRefreshToken(payload.tokenId);

  if (result instanceof Error) {
    return c.json(
      { message: 'Internal server error' },
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }

  const tokens = await auth.generateTokenPair(user.id, user.email);

  setCookie(c, 'access_token', tokens.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: config.accessTokenExpiry,
  });

  setCookie(c, 'refresh_token', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'Strict',
    maxAge: config.refreshTokenExpiry,
    path: '/auth/refresh',
  });

  return c.json(tokens, HttpStatusCode.OK);
});

authController.post('/register', zValidator('form', CreateUserDto), async c => {
  const validatedData = c.req.valid('form');
  validatedData.password = await Auth.generatePassword(validatedData.password);

  const emailExists = await userRepository.getByEmailOrUsername(
    validatedData.email
  );

  if (emailExists instanceof Error) {
    return c.json(
      { message: 'Internal server error' },
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }

  if (emailExists) {
    return c.json(
      { message: 'Email already exists' },
      HttpStatusCode.BAD_REQUEST
    );
  }

  const usernameExists = await userRepository.getByEmailOrUsername(
    validatedData.username
  );

  if (usernameExists instanceof Error) {
    return c.json(
      { message: 'Internal server error' },
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }

  if (usernameExists) {
    return c.json(
      { message: 'Username already exists' },
      HttpStatusCode.BAD_REQUEST
    );
  }

  const result = await userRepository.create(validatedData);

  if (result instanceof Error) {
    return c.json(
      { message: 'Internal server error' },
      HttpStatusCode.INTERNAL_SERVER_ERROR
    );
  }

  return c.json({ message: 'User created' }, HttpStatusCode.CREATED);
});

export default authController;
