export interface CreateJWT {
  userId: number;
  tokenId: string;
  expiresAt: string;
  isRevoked: boolean;
}
