import { z } from 'zod';

export const UserIdDto = z.object({
	id: z.coerce.number().positive(),
});

export const GetUserByEmailOrUsernameDto = z.object({
	param: z.email().or(z.string().nonempty()),
});
