import type { IUserRepository } from '../core/ports/repositories/user.repository.port.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { IPasswordHasherPort } from '../core/ports/security/password-hasher.port.js';
export declare class UsersService {
    private readonly userRepo;
    private readonly prisma;
    private readonly hasher;
    constructor(userRepo: IUserRepository, prisma: PrismaService, hasher: IPasswordHasherPort);
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
    getProfile(userId: string): Promise<{
        avatarUrl: string | null;
        bannerUrl: string | null;
        id: string;
        username: string;
        email: string;
        avatarKey: string | null;
        displayName: string | null;
        bio: string | null;
        bannerKey: string | null;
        bannerColor: string | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateProfile(userId: string, data: {
        displayName?: string;
        bio?: string;
        bannerColor?: string;
    }): Promise<{
        avatarUrl: string | null;
        bannerUrl: string | null;
        id: string;
        username: string;
        email: string;
        displayName: string | null;
        bio: string | null;
        bannerColor: string | null;
        updatedAt: Date;
    }>;
    changePassword(userId: string, currentPass: string, newPass: string): Promise<{
        message: string;
    }>;
}
