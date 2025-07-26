import { Hono } from 'hono';
import { UserRepository } from '../repositories/user-repository';
import { DatabaseFactory } from '../database';
import { zValidator } from '@hono/zod-validator';
import {
	CreateUserDto,
	GetUserByEmailOrUsernameDto,
	UserIdDto,
} from '../dtos/user';
import { HttpStatusCode, makePassword } from '../utils';
import { userSerializer } from '../serializers/user-serializer';
import { UpdateUserDto } from '../dtos/user/update';

const userController = new Hono();
const dbInstance = DatabaseFactory.create();
const dbClient = dbInstance.connect();
const userRepository = new UserRepository(dbClient);

userController.post('/', zValidator('form', CreateUserDto), async (c) => {
	const validatedData = c.req.valid('form');
	validatedData.password = await makePassword(validatedData.password);

	const result = await userRepository.create(validatedData);

	if (result instanceof Error) {
		return c.json(
			{ message: result.message },
			HttpStatusCode.INTERNAL_SERVER_ERROR
		);
	}

	return c.json({ message: userSerializer(result) }, HttpStatusCode.CREATED);
});

userController.get('/by/id/:id', zValidator('param', UserIdDto), async (c) => {
	const { id } = c.req.valid('param');
	const result = await userRepository.getById(id);

	if (result instanceof Error) {
		return c.json(
			{ message: result.message },
			HttpStatusCode.INTERNAL_SERVER_ERROR
		);
	}

	if (!result) {
		return c.json({ message: 'User not found' }, HttpStatusCode.NOT_FOUND);
	}

	return c.json({ message: userSerializer(result) }, HttpStatusCode.OK);
});

userController.get(
	'/by/email-or-username/:param',
	zValidator('param', GetUserByEmailOrUsernameDto),
	async (c) => {
		const { param } = c.req.valid('param');
		const result = await userRepository.getByEmailOrUsername(param);

		if (result instanceof Error) {
			return c.json(
				{ message: result.message },
				HttpStatusCode.INTERNAL_SERVER_ERROR
			);
		}

		if (!result) {
			return c.json(
				{ message: 'User not found' },
				HttpStatusCode.NOT_FOUND
			);
		}

		return c.json({ message: userSerializer(result) }, HttpStatusCode.OK);
	}
);

userController.put(
	'/:id',
	zValidator('param', UserIdDto),
	zValidator('form', UpdateUserDto),
	async (c) => {
		const { id } = c.req.valid('param');
		const updateData = c.req.valid('form');

    if ('password' in updateData) {
      updateData.password = await makePassword(updateData.password!);
    }

		const result = await userRepository.update(id, updateData);

		if (result instanceof Error) {
			return c.json(
				{ message: 'Something went wrong' },
				HttpStatusCode.INTERNAL_SERVER_ERROR
			);
		}

		return c.json({ message: 'User updated' }, HttpStatusCode.OK);
	}
);

userController.delete('/:id', zValidator('param', UserIdDto), async (c) => {
	const { id } = c.req.valid('param');
	const result = await userRepository.delete(id);

	if (result instanceof Error) {
		return c.json(
			{ message: result.message },
			HttpStatusCode.INTERNAL_SERVER_ERROR
		);
	}

	return c.json({ message: 'User deleted' }, HttpStatusCode.OK);
});

export default userController;
