import { z } from 'zod';

export const UserResponseDto = z.object({
	id: z.number(),
	firstName: z.string(),
	lastName: z.string().nullable(),
	username: z.string(),
	email: z.email(),
	createdAt: z.string(),
});
