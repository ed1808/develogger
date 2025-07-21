import { z } from 'zod';

export const CreateUserDto = z.object({
  firstName: z.string().nonempty().min(3),
  lastName: z.string().optional(),
  username: z.string().nonempty().min(3),
  password: z.string().min(8),
  email: z.email().toLowerCase(),
});

export type CreateUser = z.infer<typeof CreateUserDto>;
