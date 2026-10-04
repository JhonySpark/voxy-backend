import { UsersService } from '../users/users.service.js';
import type { IPasswordHasherPort } from '../core/ports/security/password-hasher.port.js';
import type { ITokenServicePort } from '../core/ports/security/token-service.port.js';
import type { IEmailServicePort } from '../core/ports/communication/email-service.port.js';
import { PrismaService } from '../prisma/prisma.service.js';
export declare const AuthErrorCodes: {
    readonly INVALID_EMAIL: "AUTH_INVALID_EMAIL";
    readonly INVALID_USERNAME: "AUTH_INVALID_USERNAME";
    readonly WEAK_PASSWORD: "AUTH_WEAK_PASSWORD";
    readonly INVALID_BIRTHDATE: "AUTH_INVALID_BIRTHDATE";
    readonly AGE_RESTRICTED: "AUTH_AGE_RESTRICTED";
    readonly EMAIL_ALREADY_EXISTS: "AUTH_EMAIL_ALREADY_EXISTS";
    readonly USERNAME_ALREADY_EXISTS: "AUTH_USERNAME_ALREADY_EXISTS";
    readonly USERNAME_AVAILABLE: "AUTH_USERNAME_AVAILABLE";
    readonly INVALID_CREDENTIALS: "AUTH_INVALID_CREDENTIALS";
    readonly EMAIL_NOT_VERIFIED: "AUTH_EMAIL_NOT_VERIFIED";
    readonly INVALID_VERIFICATION_CODE: "AUTH_INVALID_VERIFICATION_CODE";
    readonly VERIFICATION_CODE_EXPIRED: "AUTH_VERIFICATION_CODE_EXPIRED";
    readonly ACCOUNT_CHILD_RESTRICTED: "AUTH_ACCOUNT_CHILD_RESTRICTED";
};
export declare class AuthService {
    private usersService;
    private prisma;
    private tokenService;
    private passwordHasher;
    private emailService;
    constructor(usersService: UsersService, prisma: PrismaService, tokenService: ITokenServicePort, passwordHasher: IPasswordHasherPort, emailService: IEmailServicePort);
    validateUser(emailOrUsername: string, pass: string): Promise<any>;
    login(user: any): Promise<{
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
    checkUsername(username: string): Promise<{
        available: boolean;
        code: string;
        message: string;
    }>;
    private generateAndSendCode;
    register(data: {
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
    verifyEmail(email: string, code: string): Promise<{
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
    resendCode(email: string): Promise<{
        success: boolean;
        message: string;
    }>;
    private readonly processedNonces;
    private validateAndConsumeNonce;
    syncAgeSignal(userId: string, signal: {
        available: boolean;
        lower?: number;
        upper?: number;
        status?: string;
        nonce?: string;
        timestamp?: number;
        signature?: string;
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
}
