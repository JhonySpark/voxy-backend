import { UsersService } from './users.service.js';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(req: any): Promise<{
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
    getUserProfile(req: any, id: string): Promise<{
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
        updatedAt: Date;
    }>;
    changePassword(req: any, body: {
        currentPassword: string;
        newPassword: string;
    }): Promise<{
        message: string;
    }>;
}
