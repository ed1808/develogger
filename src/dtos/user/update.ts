import { z } from 'zod';

export const UpdateUserDto = z.object({
	firstName: z.string().optional(),
	lastName: z.string().optional(),
	password: z.string().optional(),
});

export type UpdateUser = z.infer<typeof UpdateUserDto>;
