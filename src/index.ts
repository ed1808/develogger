import { Hono } from 'hono';
import { cors } from 'hono/cors';

import { userController, authController } from './controllers';

const app = new Hono().basePath('/api');

app.use(
  '*',
  cors({
    origin: 'http://localhost:3000',
    credentials: true,
  })
);

app.route('/users', userController);
app.route('/auth', authController);

export default app;
