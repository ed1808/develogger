import { Hono } from 'hono';

import userController from './controllers/user-controller';

const app = new Hono().basePath('/api');

app.route('/users', userController);

export default app;
