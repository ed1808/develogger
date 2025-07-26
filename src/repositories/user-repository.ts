import { Client } from '@libsql/client/.';
import { type CreateUser } from '../dtos/user';
import { IUserRepository } from '../interfaces/user-repository';
import { User } from '../models/user';
import { UpdateUser } from '../dtos/user/update';

export class UserRepository implements IUserRepository {
  private readonly database: Client;

  constructor(dbClient: Client) {
    this.database = dbClient;
  }

  async create(newUser: CreateUser): Promise<undefined | Error> {
    try {
      const tx = await this.database.transaction('write');
      const result = await tx.execute({
        sql: `INSERT INTO users(
                firstName, 
                lastName, 
                username, 
                email, 
                password
            ) VALUES (
                @firstName,
                @lastName,
                @username,
                @email,
                @password
            )`,
        args: {
          firstName: newUser.firstName,
          lastName: newUser.lastName ? newUser.lastName : null,
          username: newUser.username,
          email: newUser.email,
          password: newUser.password,
        },
      });

      if (result.rowsAffected === 0) {
        await tx.rollback();
        return;
      }

      await tx.commit();
    } catch (error) {
      return error as Error;
    }
  }

  async delete(id: number): Promise<undefined | Error> {
    try {
      const tx = await this.database.transaction('write');
      const result = await tx.execute({
        sql: 'UPDATE users SET isActive = 0 WHERE id = @id',
        args: { id },
      });

      if (result.rowsAffected === 0) {
        await tx.rollback();
        return new Error('Error deleting the user');
      }

      await tx.commit();
    } catch (error) {
      return error as Error;
    }
  }

  async getById(id: number): Promise<User | null | Error> {
    try {
      const tx = await this.database.transaction('read');
      const result = await tx.execute({
        sql: `SELECT
                id,
                firstName,
                lastName,
                username,
                email,
                password,
                isActive,
                createdAt
              FROM
                users
              WHERE
                id = @id`,
        args: { id },
      });

      tx.close();

      if (!result.rows[0]) {
        return null;
      }

      return result.rows[0] as unknown as User;
    } catch (error) {
      return error as Error;
    }
  }

  async getByEmailOrUsername(
    emailOrUsername: string
  ): Promise<User | null | Error> {
    try {
      const tx = await this.database.transaction('read');
      const result = await tx.execute({
        sql: `SELECT
                    id,
                    firstName,
                    lastName,
                    username,
                    email,
                    password,
                    isActive,
                    createdAt
                FROM
                    users
                WHERE
                    email = @searchParam
                    OR username = @searchParam`,
        args: { searchParam: emailOrUsername },
      });

      tx.close();

      if (!result.rows[0]) {
        return null;
      }

      return result.rows[0] as unknown as User;
    } catch (error) {
      return error as Error;
    }
  }

  async update(id: number, data: UpdateUser): Promise<undefined | Error> {
    try {
      const cols = Object.keys(data).map(col => `${col} = @${col}`).join(',');
      const args: { [key: string]: string | number } = {};

      Object.entries(data).forEach(([key, value]) => {
        args[key] = value;
      });
      
      args['id'] = id;

      const sql = `UPDATE users SET ${cols} WHERE id = @id`;
      
      const tx = await this.database.transaction('write');
      const result = await tx.execute({
        sql,
        args,
      });

      if (result.rowsAffected === 0) {
        await tx.rollback();
        return;
      }

      await tx.commit();
    } catch (error) {
      return error as Error;
    }
  }
}
