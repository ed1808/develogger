import { CreateUser } from "../dtos/user/create";
import { User } from "../models/user";

export interface IUserRepository {
    create(newUser: CreateUser): Promise<User | Error>;
    getById(id: number): Promise<User | null | Error>;
    getByEmailOrUsername(emailOrUsername: string): Promise<User | null | Error>;
    delete(id: number): Promise<undefined | Error>;
}