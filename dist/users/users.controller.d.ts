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
        status: string;
        customStatus: string | null;
        createdAt: Date;
        email: string | undefined;
    }>;
    getUserProfile(req: any, id: string): Promise<{
        id: string;
        username: string;
        displayName: string | null;
        bio: string | null;
        avatarUrl: string | null;
        bannerUrl: string | null;
        bannerColor: string | null;
        status: string;
        customStatus: string | null;
        createdAt: Date;
        email: string | undefined;
    }>;
    updateProfile(req: any, body: {
        displayName?: string;
        bio?: string;
        bannerColor?: string;
        status?: string;
        customStatus?: string;
    }): Promise<{
        avatarUrl: string | null;
        bannerUrl: string | null;
        id: string;
        username: string;
        email: string;
        displayName: string | null;
        bio: string | null;
        bannerColor: string | null;
        status: string | null;
        customStatus: string | null;
        updatedAt: Date;
    }>;
    changePassword(req: any, body: {
        currentPassword: string;
        newPassword: string;
    }): Promise<{
        message: string;
    }>;
}
