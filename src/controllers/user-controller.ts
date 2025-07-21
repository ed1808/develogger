import { Hono } from 'hono';
import { UserRepository } from '../repositories/user-repository';
import { DatabaseFactory } from '../database';
import { zValidator } from '@hono/zod-validator';
import { CreateUserDto } from '../dtos/user/create';

const userController = new Hono();
const dbInstance = DatabaseFactory.create();
const dbClient = dbInstance.connect();
const userRepository = new UserRepository(dbClient);

userController.post('/', zValidator('form', CreateUserDto), async c => {
  const validatedData = c.req.valid('form');
  const result = await userRepository.create(validatedData);

  if (result instanceof Error) {
    return c.json({ message: result.message }, 400); 
  }

  return c.json({ message: 'User created' }, 201);
});

export default userController;
