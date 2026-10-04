import type { IUserRepository } from '../core/ports/repositories/user.repository.port.js';
import { PrismaService } from '../prisma/prisma.service.js';
import type { IPasswordHasherPort } from '../core/ports/security/password-hasher.port.js';
import { AgeClassificationEnum, AgeSignalSourceEnum } from '../core/enums/index.js';
export declare class UsersService {
    private readonly userRepo;
    private readonly prisma;
    private readonly hasher;
    constructor(userRepo: IUserRepository, prisma: PrismaService, hasher: IPasswordHasherPort);
    create(data: {
        username: string;
        email: string;
        password?: string;
        birthDate?: string | Date;
    }): Promise<{
        id: string;
        username: string;
        email: string;
        password: string;
        birthDate: Date | null;
        isEmailVerified: boolean;
        ageClassification: AgeClassificationEnum;
        ageSignalSource: AgeSignalSourceEnum;
    }>;
    findByUsername(username: string): Promise<{
        id: string;
        username: string;
        email: string;
        password: string;
        birthDate: Date | null;
        isEmailVerified: boolean;
        ageClassification: AgeClassificationEnum;
        ageSignalSource: AgeSignalSourceEnum;
    } | null>;
    findByEmail(email: string): Promise<{
        id: string;
        username: string;
        email: string;
        password: string;
        birthDate: Date | null;
        isEmailVerified: boolean;
        ageClassification: AgeClassificationEnum;
        ageSignalSource: AgeSignalSourceEnum;
    } | null>;
    findById(id: string): Promise<{
        id: string;
        username: string;
        email: string;
        password: string;
        birthDate: Date | null;
        isEmailVerified: boolean;
        ageClassification: AgeClassificationEnum;
        ageSignalSource: AgeSignalSourceEnum;
    } | null>;
    getProfile(userId: string, requestingUserId?: string): Promise<{
        id: string;
        username: string;
        displayName: string | null;
        bio: string | null;
        avatarUrl: string | null;
        bannerUrl: string | null;
        bannerColor: string | null;
        createdAt: Date;
        email: string | undefined;
        birthDate: Date | null | undefined;
        isEmailVerified: boolean;
        ageClassification: import("@prisma/client").$Enums.AgeClassification;
        ageSignalSource: import("@prisma/client").$Enums.AgeSignalSource;
        canShareScreen: boolean;
        canStreamGames: boolean;
        canAccess18Plus: boolean;
        canUseApp: boolean;
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
