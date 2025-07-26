import { Client } from '@libsql/client/.';

import { CreateJWT } from '../dtos/jwt/create';
import { IJWTRepository } from '../interfaces/jwt-repository';
import { JWT } from '../models/jwt-token';

export class JWTRepository implements IJWTRepository {
  private readonly dbClient: Client;

  constructor(dbClient: Client) {
    this.dbClient = dbClient;
  }

  async create(token: CreateJWT): Promise<undefined | Error> {
    try {
      const tx = await this.dbClient.transaction('write');
      const result = await tx.execute({
        sql: `INSERT INTO tokens (
                    userId,
                    tokenId,
                    expiresAt,
                    isRevoked
                ) VALUES (
                    @userId,
                    @tokenId,
                    @expiresAt,
                    @isRevoked
                )`,
        args: {
          userId: token.userId,
          tokenId: token.tokenId,
          expiresAt: token.expiresAt,
          isRevoked: token.isRevoked,
        },
      });

      if (result.rowsAffected === 0) {
        await tx.rollback();
        return new Error('An error has occurred during token insertion');
      }

      await tx.commit();
    } catch (error) {
      return error as Error;
    }
  }

  async get(userId: number): Promise<JWT | null | Error> {
    try {
      const tx = await this.dbClient.transaction('read');
      const result = await tx.execute({
        sql: `SELECT 
                id, 
                userId,
                tokenId,
                expiresAt, 
                isRevoked 
              FROM 
                tokens 
              WHERE 
                userId = @userId
              ORDER BY
                id DESC
              LIMIT 1`,
        args: {
          userId,
        },
      });

      tx.close();

      if (!result.rows[0]) {
        return null;
      }

      return result.rows[0] as unknown as JWT;
    } catch (error) {
      return error as Error;
    }
  }

  async revoke(tokenId: string): Promise<undefined | Error> {
    try {
      const tx = await this.dbClient.transaction('write');
      const result = await tx.execute({
        sql: `UPDATE tokens SET isRevoked = 1 WHERE tokenId = @tokenId`,
        args: {
          tokenId,
        },
      });

      if (result.rowsAffected === 0) {
        await tx.rollback();
        return new Error('An error has occurred during token update');
      }

      await tx.commit();
    } catch (error) {
      return error as Error;
    }
  }
}
