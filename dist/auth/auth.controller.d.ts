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
            role: any;
            isEmailVerified: any;
            ageClassification: any;
            ageSignalSource: any;
            canJoinVoice: boolean;
            canShareScreen: boolean;
            canStreamGames: boolean;
            canAccess18Plus: boolean;
            canUseApp: boolean;
        };
        requireEmailVerification?: undefined;
        email?: undefined;
        message?: undefined;
    }>;
    refresh(req: any): Promise<{
        access_token: string;
        user: {
            id: string;
            username: string;
            email: string;
            role: import("../core/enums/user-role.enum.js").UserRoleEnum;
            isEmailVerified: boolean;
            ageClassification: import("../core/enums/age-classification.enum.js").AgeClassificationEnum;
            ageSignalSource: import("../core/enums/age-signal-source.enum.js").AgeSignalSourceEnum;
            canJoinVoice: boolean;
            canShareScreen: boolean;
            canStreamGames: boolean;
            canAccess18Plus: boolean;
            canUseApp: boolean;
        };
    }>;
    getBetaStatus(): Promise<{
        isOpen: boolean;
        currentUsers: number;
        maxUsers: number;
        remainingSlots: number;
    }>;
    register(body: {
        email: string;
        username: string;
        password?: string;
        birthDate: string;
        acceptTerms?: boolean;
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
            canJoinVoice: boolean;
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
    syncAgeSignal(req: any, body: any): Promise<{
        success: boolean;
        user: {
            canJoinVoice: boolean;
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
            isSuspended: boolean;
        };
        changed: boolean;
    }>;
    checkUsername(username: string): Promise<{
        available: boolean;
        code: string;
        message: string;
    }>;
}
