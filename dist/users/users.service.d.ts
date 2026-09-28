import type { IUserRepository } from '../core/ports/repositories/user.repository.port.js';
export declare class UsersService {
    private readonly userRepo;
    constructor(userRepo: IUserRepository);
    create(data: {
        username: string;
        email: string;
        password?: string;
    }): Promise<{
        id: string;
        username: string;
        email: string;
        password: string;
    }>;
    findByUsername(username: string): Promise<{
        id: string;
        username: string;
        email: string;
        password: string;
    } | null>;
    findByEmail(email: string): Promise<{
        id: string;
        username: string;
        email: string;
        password: string;
    } | null>;
    findById(id: string): Promise<{
        id: string;
        username: string;
        email: string;
        password: string;
    } | null>;
}
