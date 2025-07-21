import { Hono } from 'hono';

import userController from './controllers/user-controller';

const app = new Hono();

app.route('/api/users', userController);

export default app;
