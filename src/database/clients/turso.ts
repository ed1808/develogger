import { Client, createClient } from '@libsql/client';
import { IDatabase } from '../../interfaces/database';

export class TursoClient implements IDatabase {
  connect(): Client {
    const url: string | undefined = process.env.TURSO_DATABASE_URL;
    const authToken: string | undefined = process.env.TURSO_AUTH_TOKEN;

    if (!url || !authToken) throw new Error('Missing database connection info');

    const client = createClient({
      url,
      authToken,
    });

    return client;
  }
}
