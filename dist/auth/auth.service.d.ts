import { UsersService } from '../users/users.service.js';
import type { IPasswordHasherPort } from '../core/ports/security/password-hasher.port.js';
import type { ITokenServicePort } from '../core/ports/security/token-service.port.js';
export declare const AuthErrorCodes: {
    readonly INVALID_EMAIL: "AUTH_INVALID_EMAIL";
    readonly INVALID_USERNAME: "AUTH_INVALID_USERNAME";
    readonly WEAK_PASSWORD: "AUTH_WEAK_PASSWORD";
    readonly EMAIL_ALREADY_EXISTS: "AUTH_EMAIL_ALREADY_EXISTS";
    readonly USERNAME_ALREADY_EXISTS: "AUTH_USERNAME_ALREADY_EXISTS";
    readonly USERNAME_AVAILABLE: "AUTH_USERNAME_AVAILABLE";
    readonly INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS";
};
export declare class AuthService {
    private usersService;
    private tokenService;
    private passwordHasher;
    constructor(usersService: UsersService, tokenService: ITokenServicePort, passwordHasher: IPasswordHasherPort);
    validateUser(email: string, pass: string): Promise<any>;
    login(user: any): Promise<{
        access_token: string;
    }>;
    checkUsername(username: string): Promise<{
        available: boolean;
        code: string;
        message: string;
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
