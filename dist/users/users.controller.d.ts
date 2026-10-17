import { UsersService } from './users.service.js';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(req: any): Promise<{
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
    getUserProfile(req: any, id: string): Promise<{
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
    updateProfile(req: any, body: {
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
    changePassword(req: any, body: {
        currentPassword: string;
        newPassword: string;
    }): Promise<{
        message: string;
    }>;
}
