import { UsersService } from './users.service.js';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(req: any): Promise<{
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
