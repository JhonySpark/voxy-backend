import { UsersService } from '../users/users.service.js';
import type { IPasswordHasherPort } from '../core/ports/security/password-hasher.port.js';
import type { ITokenServicePort } from '../core/ports/security/token-service.port.js';
export declare class AuthService {
    private usersService;
    private tokenService;
    private passwordHasher;
    constructor(usersService: UsersService, tokenService: ITokenServicePort, passwordHasher: IPasswordHasherPort);
    validateUser(email: string, pass: string): Promise<any>;
    login(user: any): Promise<{
        access_token: string;
    }>;
    register(data: {
        email: string;
        username: string;
        password?: string;
    }): Promise<{
        id: string;
        username: string;
        email: string;
    }>;
}
