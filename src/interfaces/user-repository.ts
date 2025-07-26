import { CreateUser } from "../dtos/user/create";
import { UpdateUser } from "../dtos/user/update";
import { User } from "../models/user";

export interface IUserRepository {
    create(newUser: CreateUser): Promise<User | Error>;
    getById(id: number): Promise<User | null | Error>;
    getByEmailOrUsername(emailOrUsername: string): Promise<User | null | Error>;
    delete(id: number): Promise<undefined | Error>;
    update(id: number, data: UpdateUser): Promise<undefined | Error>;
}