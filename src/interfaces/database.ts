import { type Client } from '@libsql/client';

export interface IDatabase {
  connect(): Client;
}
