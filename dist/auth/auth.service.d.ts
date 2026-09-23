import { UsersService } from '../users/users.service.js';
import { JwtService } from '@nestjs/jwt';
import { Prisma } from '@prisma/client';
export declare class AuthService {
    private usersService;
    private jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    validateUser(email: string, pass: string): Promise<any>;
    login(user: any): Promise<{
        access_token: string;
    }>;
    register(data: Prisma.UserCreateInput): Promise<{
        id: string;
        username: string;
        email: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
