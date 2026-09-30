import { UsersService } from './users.service.js';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    getProfile(req: any): Promise<{
        id: string;
        username: string;
        email: string;
        avatarUrl: string | null;
        avatarKey: string | null;
        displayName: string | null;
        bio: string | null;
        bannerUrl: string | null;
        bannerKey: string | null;
        bannerColor: string | null;
        createdAt: Date;
    }>;
    updateProfile(req: any, body: {
        displayName?: string;
        bio?: string;
        bannerColor?: string;
    }): Promise<{
        id: string;
        username: string;
        email: string;
        avatarUrl: string | null;
        displayName: string | null;
        bio: string | null;
        bannerUrl: string | null;
        bannerColor: string | null;
    }>;
    changePassword(req: any, body: {
        currentPassword: string;
        newPassword: string;
    }): Promise<{
        message: string;
    }>;
}
