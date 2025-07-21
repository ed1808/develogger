import { Client, createClient } from '@libsql/client';
import { IDatabase } from '../../interfaces/database';

export class SQLiteClient implements IDatabase {
  connect(): Client {
    const client = createClient({
      url: 'file:development.db',
    });

    return client;
  }
}
