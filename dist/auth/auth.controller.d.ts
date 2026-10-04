import { AuthService } from './auth.service.js';
export declare class AuthController {
    private authService;
    constructor(authService: AuthService);
    login(body: any): Promise<{
        requireEmailVerification: boolean;
        email: any;
        message: string;
        access_token?: undefined;
        user?: undefined;
    } | {
        access_token: string;
        user: {
            id: any;
            username: any;
            email: any;
            isEmailVerified: any;
            ageClassification: any;
            ageSignalSource: any;
            canShareScreen: boolean;
            canStreamGames: boolean;
            canAccess18Plus: boolean;
            canUseApp: boolean;
        };
        requireEmailVerification?: undefined;
        email?: undefined;
        message?: undefined;
    }>;
    register(body: {
        email: string;
        username: string;
        password?: string;
        birthDate: string;
    }): Promise<{
        id: string;
        username: string;
        email: string;
        requireEmailVerification: boolean;
        message: string;
    }>;
    verifyEmail(body: {
        email: string;
        code: string;
    }): Promise<{
        success: boolean;
        access_token: string;
        user: {
            id: string;
            username: string;
            email: string;
            isEmailVerified: boolean;
            ageClassification: import("@prisma/client").$Enums.AgeClassification;
            ageSignalSource: import("@prisma/client").$Enums.AgeSignalSource;
            canShareScreen: boolean;
            canStreamGames: boolean;
            canAccess18Plus: boolean;
            canUseApp: boolean;
        };
    }>;
    resendCode(body: {
        email: string;
    }): Promise<{
        success: boolean;
        message: string;
    }>;
    syncAgeSignal(req: any, body: {
        available: boolean;
        lower?: number;
        upper?: number;
        status?: string;
    }): Promise<{
        success: boolean;
        user: {
            canShareScreen: boolean;
            canStreamGames: boolean;
            canAccess18Plus: boolean;
            canUseApp: boolean;
            id: string;
            username: string;
            email: string;
            birthDate: Date | null;
            isEmailVerified: boolean;
            ageClassification: import("@prisma/client").$Enums.AgeClassification;
            ageSignalSource: import("@prisma/client").$Enums.AgeSignalSource;
            ageSignalCheckedAt: Date | null;
        };
        changed: boolean;
    }>;
    checkUsername(username: string): Promise<{
        available: boolean;
        code: string;
        message: string;
    }>;
}
