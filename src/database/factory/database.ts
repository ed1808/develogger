import { SQLiteClient, TursoClient } from '../clients';
import { IDatabase } from '../../interfaces/database';

export class DatabaseFactory {
  static create(): IDatabase {
    if (process.env.NODE_ENV === 'production') return new TursoClient();
    return new SQLiteClient();
  }
}
