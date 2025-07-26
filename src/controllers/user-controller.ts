import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';

import { UserRepository } from '../repositories/user-repository';
import { DatabaseFactory } from '../database';
import { GetUserByEmailOrUsernameDto, UserIdDto } from '../dtos/user';
import { HttpStatusCode, Auth } from '../utils';
import { userSerializer } from '../serializers/user-serializer';
import { UpdateUserDto } from '../dtos/user/update';
import { authMiddleware } from '../middlewares/auth-middleware';
import { JWTPayload } from '../models/jwt-token';

const userController = new Hono();
const dbInstance = DatabaseFactory.create();
const dbClient = dbInstance.connect();
const userRepository = new UserRepository(dbClient);

userController.get(
  '/me',
  authMiddleware,
  async c => {
    const payload: JWTPayload = c.get('jwtPayload');
    const result = await userRepository.getById(payload.userId);

    if (result instanceof Error) {
      return c.json(
        { message: 'Internal server error' },
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }

    if (!result) {
      return c.json({ message: 'User not found' }, HttpStatusCode.NOT_FOUND);
    }

    return c.json({ message: userSerializer(result) }, HttpStatusCode.OK);
  }
);

userController.get(
  '/search',
  authMiddleware,
  zValidator('query', GetUserByEmailOrUsernameDto),
  async c => {
    const { param } = c.req.valid('query');
    const result = await userRepository.getByEmailOrUsername(param);

    if (result instanceof Error) {
      return c.json(
        { message: 'Internal server error' },
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }

    if (!result) {
      return c.json({ message: 'User not found' }, HttpStatusCode.NOT_FOUND);
    }

    return c.json({ message: userSerializer(result) }, HttpStatusCode.OK);
  }
);

userController.put(
  '/',
  authMiddleware,
  zValidator('form', UpdateUserDto),
  async c => {
    const payload: JWTPayload = c.get('jwtPayload');
    const updateData = c.req.valid('form');

    if ('password' in updateData) {
      updateData.password = await Auth.generatePassword(updateData.password!);
    }

    const result = await userRepository.update(payload.userId, updateData);

    if (result instanceof Error) {
      return c.json(
        { message: 'Internal server error' },
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }

    return c.json({ message: 'User updated' }, HttpStatusCode.OK);
  }
);

userController.delete(
  '/',
  authMiddleware,
  async c => {
    const payload: JWTPayload = c.get('jwtPayload');
    const result = await userRepository.delete(payload.userId);

    if (result instanceof Error) {
      return c.json(
        { message: 'Internal server error' },
        HttpStatusCode.INTERNAL_SERVER_ERROR
      );
    }

    return c.json({ message: 'User deleted' }, HttpStatusCode.OK);
  }
);

export default userController;
