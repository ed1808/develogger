import { password as p } from 'bun';
import * as crypto from 'node:crypto';

import { sign, verify } from 'hono/jwt';

import { JWTPayload, RefreshTokenPayload } from '../models/jwt-token';
import { config } from '../settings/settings';
import { Client } from '@libsql/client/.';
import { IJWTRepository } from '../interfaces/jwt-repository';
import { JWTRepository } from '../repositories/jwt-repository';
import { CreateJWT } from '../dtos/jwt/create';

export class Auth {
  private readonly config = config;
  private readonly jwtRepo: IJWTRepository;

  constructor(dbClient: Client) {
    this.jwtRepo = new JWTRepository(dbClient);
  }

  static async generatePassword(password: string): Promise<string> {
    return await p.hash(password);
  }

  async generateTokenPair(userId: number, email: string) {
    const accessToken = await this.generateAccessToken(userId, email);
    const refreshToken = await this.generateRefreshToken(userId);

    return {
      accessToken,
      refreshToken,
    };
  }

  async revokeRefreshToken(tokenId: string) {
    const result = await this.jwtRepo.revoke(tokenId);

    if (result instanceof Error) {
      return new Error('Something went wrong');
    }
  }

  static async verifyPassword(
    password: string,
    storedPassword: string
  ): Promise<boolean> {
    return await p.verify(password, storedPassword);
  }

  async verifyAccessToken(token: string): Promise<JWTPayload | null> {
    try {
      const payload = (await verify(
        token,
        this.config.jwtSecret,
        'HS512'
      )) as JWTPayload;
      return payload;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  async verifyRefreshToken(token: string): Promise<RefreshTokenPayload | null> {
    try {
      const payload = (await verify(
        token,
        this.config.refreshSecret,
        'HS512'
      )) as RefreshTokenPayload;
      const storedToken = await this.jwtRepo.get(payload.userId);

      if (storedToken instanceof Error) {
        throw storedToken;
      }

      if (
        !storedToken ||
        storedToken.isRevoked ||
        new Date(storedToken.expiresAt) < new Date()
      ) {
        return null;
      }

      return payload;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  private async generateAccessToken(
    userId: number,
    email: string
  ): Promise<string> {
    const payload: JWTPayload = {
      userId,
      email,
      exp: Math.floor(Date.now() / 1000) + this.config.accessTokenExpiry,
      iat: Math.floor(Date.now() / 1000),
    };

    return await sign(payload, this.config.jwtSecret, 'HS512');
  }

  private async generateRefreshToken(userId: number): Promise<string> {
    const tokenId = crypto.randomUUID();
    const expiresAt = new Date(
      Date.now() + this.config.refreshTokenExpiry * 1000
    );

    const refreshToken: CreateJWT = {
      userId,
      tokenId,
      expiresAt: expiresAt.toISOString(),
      isRevoked: false,
    };

    const result = await this.jwtRepo.create(refreshToken);

    if (result instanceof Error) {
      throw result;
    }

    const payload: RefreshTokenPayload = {
      userId,
      tokenId,
      exp: Math.floor(expiresAt.getTime() / 1000),
      iat: Math.floor(Date.now() / 1000),
    };

    return await sign(payload, this.config.refreshSecret, 'HS512');
  }
}
