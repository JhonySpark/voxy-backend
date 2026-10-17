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
        role: import("../core/enums/user-role.enum.js").UserRoleEnum;
        birthDate: Date | null;
        isEmailVerified: boolean;
        ageClassification: AgeClassificationEnum;
        ageSignalSource: AgeSignalSourceEnum;
        isSuspended: boolean;
        suspendedReason: string | null | undefined;
    } | null>;
    findByEmail(email: string): Promise<{
        id: string;
        username: string;
        email: string;
        password: string;
        role: import("../core/enums/user-role.enum.js").UserRoleEnum;
        birthDate: Date | null;
        isEmailVerified: boolean;
        ageClassification: AgeClassificationEnum;
        ageSignalSource: AgeSignalSourceEnum;
        isSuspended: boolean;
        suspendedReason: string | null | undefined;
    } | null>;
    findById(id: string): Promise<{
        id: string;
        username: string;
        email: string;
        password: string;
        role: import("../core/enums/user-role.enum.js").UserRoleEnum;
        birthDate: Date | null;
        isEmailVerified: boolean;
        ageClassification: AgeClassificationEnum;
        ageSignalSource: AgeSignalSourceEnum;
        isSuspended: boolean;
        suspendedReason: string | null | undefined;
    } | null>;
    getProfile(userId: string, requestingUserId?: string): Promise<{
        id: string;
        username: string;
        role: import("@prisma/client").$Enums.UserRole;
        displayName: string | null;
        bio: string | null;
        avatarUrl: string | null;
        bannerUrl: string | null;
        bannerColor: string | null;
        equippedFrameSlug: string | null;
        createdAt: Date;
        email: string | undefined;
        birthDate: Date | null | undefined;
        isEmailVerified: boolean;
        ageClassification: import("@prisma/client").$Enums.AgeClassification | undefined;
        ageSignalSource: import("@prisma/client").$Enums.AgeSignalSource | undefined;
        canJoinVoice: boolean | undefined;
        canShareScreen: boolean | undefined;
        canStreamGames: boolean | undefined;
        canAccess18Plus: boolean | undefined;
        canUseApp: boolean | undefined;
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
        equippedFrameSlug: string | null;
        updatedAt: Date;
    }>;
    changePassword(userId: string, currentPass: string, newPass: string): Promise<{
        message: string;
    }>;
}
