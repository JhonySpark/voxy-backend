import { AuthService } from './auth.service.js';
import { Prisma } from '@prisma/client';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(body: any): Promise<{
        access_token: string;
    }>;
    register(body: Prisma.UserCreateInput): Promise<{
        id: string;
        username: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
