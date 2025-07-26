type Config = {
  jwtSecret: string;
  refreshSecret: string;
  accessTokenExpiry: number;
  refreshTokenExpiry: number;
};

export const config: Config = {
  jwtSecret: process.env.JWT_SECRET ?? 'development',
  refreshSecret: process.env.REFRES_TOKEN_SECRET ?? 'development',
  accessTokenExpiry: process.env.ACCESS_TOKEN_EXPIRY
    ? Number(process.env.ACCESS_TOKEN_EXPIRY)
    : 15 * 60,
  refreshTokenExpiry: process.env.REFRESH_TOKEN_EXPIRY
    ? Number(process.env.REFRESH_TOKEN_EXPIRY)
    : 7 * 24 * 60 * 60,
};
