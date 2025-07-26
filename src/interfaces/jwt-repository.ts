import { CreateJWT } from "../dtos/jwt/create";
import { JWT } from "../models/jwt-token";

export interface IJWTRepository {
    create(token: CreateJWT): Promise<undefined | Error>;
    get(userId: number): Promise<JWT | null | Error>;
    revoke(tokenId: string): Promise<undefined | Error>;
}