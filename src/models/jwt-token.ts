export interface JWT {
  id: number;
  userId: number;
  tokenId: string;
  expiresAt: string;
  isRevoked: boolean;
}

export interface JWTPayload {
  userId: number;
  email: string;
  exp: number;
  iat: number;
  [key: string]: any;
}

export interface RefreshTokenPayload {
  userId: number;
  tokenId: string;
  exp: number;
  iat: number;
  [key: string]: any;
}
