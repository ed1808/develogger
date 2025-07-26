import { z } from 'zod';

export const LoginDto = z.object({
  param: z.email().or(z.string().nonempty()),
  password: z.string().nonempty(),
});
