var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
import { Injectable, BadRequestException, ForbiddenException, Inject } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { PASSWORD_HASHER_PORT } from '../core/ports/security/password-hasher.port.js';
import { TOKEN_SERVICE_PORT } from '../core/ports/security/token-service.port.js';
import { EMAIL_SERVICE_PORT } from '../core/ports/communication/email-service.port.js';
import { Email } from '../modules/identity/domain/value-objects/email.vo.js';
import { Username } from '../modules/identity/domain/value-objects/username.vo.js';
import { Password } from '../modules/identity/domain/value-objects/password.vo.js';
import { BirthDate } from '../modules/identity/domain/value-objects/birth-date.vo.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { AgeClassification, AgeSignalSource } from '@prisma/client';
import crypto from 'node:crypto';
export const AuthErrorCodes = {
    INVALID_EMAIL: 'AUTH_INVALID_EMAIL',
    INVALID_USERNAME: 'AUTH_INVALID_USERNAME',
    WEAK_PASSWORD: 'AUTH_WEAK_PASSWORD',
    INVALID_BIRTHDATE: 'AUTH_INVALID_BIRTHDATE',
    AGE_RESTRICTED: 'AUTH_AGE_RESTRICTED',
    EMAIL_ALREADY_EXISTS: 'AUTH_EMAIL_ALREADY_EXISTS',
    USERNAME_ALREADY_EXISTS: 'AUTH_USERNAME_ALREADY_EXISTS',
    USERNAME_AVAILABLE: 'AUTH_USERNAME_AVAILABLE',
    INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
    EMAIL_NOT_VERIFIED: 'AUTH_EMAIL_NOT_VERIFIED',
    INVALID_VERIFICATION_CODE: 'AUTH_INVALID_VERIFICATION_CODE',
    VERIFICATION_CODE_EXPIRED: 'AUTH_VERIFICATION_CODE_EXPIRED',
    ACCOUNT_CHILD_RESTRICTED: 'AUTH_ACCOUNT_CHILD_RESTRICTED',
};
let AuthService = class AuthService {
    usersService;
    prisma;
    tokenService;
    passwordHasher;
    emailService;
    constructor(usersService, prisma, tokenService, passwordHasher, emailService) {
        this.usersService = usersService;
        this.prisma = prisma;
        this.tokenService = tokenService;
        this.passwordHasher = passwordHasher;
        this.emailService = emailService;
    }
    async validateUser(email, pass) {
        const user = await this.usersService.findByEmail(email);
        if (user && (await this.passwordHasher.compare(pass, user.password))) {
            const { password, ...result } = user;
            return result;
        }
        return null;
    }
    async login(user) {
        if (user.ageClassification === AgeClassification.CHILD) {
            throw new ForbiddenException({
                code: AuthErrorCodes.ACCOUNT_CHILD_RESTRICTED,
                message: 'O acesso a esta conta não é permitido para menores de 13 anos (CHILD).',
            });
        }
        if (!user.isEmailVerified) {
            await this.generateAndSendCode(user.email, user.username).catch(() => { });
            return {
                requireEmailVerification: true,
                email: user.email,
                message: 'Por favor, confirme seu endereço de e-mail para continuar.',
            };
        }
        const payload = { username: user.username, sub: user.id };
        return {
            access_token: this.tokenService.sign(payload),
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                isEmailVerified: user.isEmailVerified,
                ageClassification: user.ageClassification,
                ageSignalSource: user.ageSignalSource,
                canShareScreen: user.ageClassification === AgeClassification.ADULT,
                canStreamGames: user.ageClassification === AgeClassification.ADULT || user.ageClassification === AgeClassification.TEEN,
                canAccess18Plus: user.ageClassification === AgeClassification.ADULT,
                canUseApp: user.ageClassification !== AgeClassification.CHILD,
            },
        };
    }
    async checkUsername(username) {
        if (!username || username.trim().length === 0) {
            return {
                available: false,
                code: AuthErrorCodes.INVALID_USERNAME,
                message: 'Nome de usuário não informado.',
            };
        }
        const usernameOrError = Username.create(username);
        if (usernameOrError.isFailure) {
            return {
                available: false,
                code: AuthErrorCodes.INVALID_USERNAME,
                message: usernameOrError.error ?? 'Nome de usuário inválido.',
            };
        }
        const cleanUsername = usernameOrError.getValue().value;
        const existing = await this.usersService.findByUsername(cleanUsername);
        if (existing) {
            return {
                available: false,
                code: AuthErrorCodes.USERNAME_ALREADY_EXISTS,
                message: 'Este nome de usuário já está em uso.',
            };
        }
        return {
            available: true,
            code: AuthErrorCodes.USERNAME_AVAILABLE,
            message: 'Nome de usuário disponível!',
        };
    }
    async generateAndSendCode(email, username) {
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
        await this.prisma.emailVerification.create({
            data: {
                email,
                code,
                expiresAt,
            },
        });
        await this.emailService.sendVerificationEmail({
            to: email,
            username,
            code,
        });
        return code;
    }
    async register(data) {
        const emailOrError = Email.create(data.email || '');
        if (emailOrError.isFailure) {
            throw new BadRequestException({
                code: AuthErrorCodes.INVALID_EMAIL,
                message: emailOrError.error,
            });
        }
        const usernameOrError = Username.create(data.username || '');
        if (usernameOrError.isFailure) {
            throw new BadRequestException({
                code: AuthErrorCodes.INVALID_USERNAME,
                message: usernameOrError.error,
            });
        }
        const passwordOrError = Password.create(data.password || '');
        if (passwordOrError.isFailure) {
            throw new BadRequestException({
                code: AuthErrorCodes.WEAK_PASSWORD,
                message: passwordOrError.error,
            });
        }
        const birthDateOrError = BirthDate.create(data.birthDate);
        if (birthDateOrError.isFailure) {
            throw new BadRequestException({
                code: AuthErrorCodes.INVALID_BIRTHDATE,
                message: birthDateOrError.error,
            });
        }
        const birthDateVO = birthDateOrError.getValue();
        if (birthDateVO.isUnder13()) {
            throw new BadRequestException({
                code: AuthErrorCodes.AGE_RESTRICTED,
                message: 'Você precisa ter pelo menos 13 anos para criar uma conta no Voxy.',
            });
        }
        const emailExists = await this.usersService.findByEmail(emailOrError.getValue().value);
        if (emailExists) {
            throw new BadRequestException({
                code: AuthErrorCodes.EMAIL_ALREADY_EXISTS,
                message: 'Este endereço de e-mail já está cadastrado.',
            });
        }
        const usernameExists = await this.usersService.findByUsername(usernameOrError.getValue().value);
        if (usernameExists) {
            throw new BadRequestException({
                code: AuthErrorCodes.USERNAME_ALREADY_EXISTS,
                message: 'Este nome de usuário já está em uso.',
            });
        }
        const hashedPassword = await this.passwordHasher.hash(passwordOrError.getValue().value);
        const user = await this.usersService.create({
            email: emailOrError.getValue().value,
            username: usernameOrError.getValue().value,
            password: hashedPassword,
            birthDate: birthDateVO.value,
        });
        await this.generateAndSendCode(user.email, user.username);
        return {
            id: user.id,
            username: user.username,
            email: user.email,
            requireEmailVerification: true,
            message: 'Cadastro realizado com sucesso! Enviamos um código de verificação para o seu e-mail.',
        };
    }
    async verifyEmail(email, code) {
        if (!email || !code) {
            throw new BadRequestException({
                code: AuthErrorCodes.INVALID_VERIFICATION_CODE,
                message: 'E-mail e código de verificação são obrigatórios.',
            });
        }
        const cleanEmail = email.trim().toLowerCase();
        const cleanCode = code.trim();
        const latest = await this.prisma.emailVerification.findFirst({
            where: { email: cleanEmail },
            orderBy: { createdAt: 'desc' },
        });
        if (!latest) {
            throw new BadRequestException({
                code: AuthErrorCodes.INVALID_VERIFICATION_CODE,
                message: 'Nenhum código de verificação pendente encontrado.',
            });
        }
        if (new Date() > latest.expiresAt) {
            throw new BadRequestException({
                code: AuthErrorCodes.VERIFICATION_CODE_EXPIRED,
                message: 'Código de verificação expirado. Solicite um novo código.',
            });
        }
        if (latest.attempts >= 5) {
            throw new BadRequestException({
                code: AuthErrorCodes.INVALID_VERIFICATION_CODE,
                message: 'Número excessivo de tentativas. Solicite um novo código.',
            });
        }
        if (latest.code !== cleanCode) {
            await this.prisma.emailVerification.update({
                where: { id: latest.id },
                data: { attempts: { increment: 1 } },
            });
            throw new BadRequestException({
                code: AuthErrorCodes.INVALID_VERIFICATION_CODE,
                message: 'Código de verificação incorreto.',
            });
        }
        const user = await this.prisma.user.update({
            where: { email: cleanEmail },
            data: {
                isEmailVerified: true,
                emailVerifiedAt: new Date(),
            },
        });
        await this.prisma.emailVerification.deleteMany({
            where: { email: cleanEmail },
        }).catch(() => { });
        const payload = { username: user.username, sub: user.id };
        const access_token = this.tokenService.sign(payload);
        return {
            success: true,
            access_token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                isEmailVerified: true,
                ageClassification: user.ageClassification,
                ageSignalSource: user.ageSignalSource,
                canShareScreen: user.ageClassification === AgeClassification.ADULT,
                canStreamGames: user.ageClassification === AgeClassification.ADULT || user.ageClassification === AgeClassification.TEEN,
                canAccess18Plus: user.ageClassification === AgeClassification.ADULT,
                canUseApp: user.ageClassification !== AgeClassification.CHILD,
            },
        };
    }
    async resendCode(email) {
        if (!email) {
            throw new BadRequestException('E-mail é obrigatório.');
        }
        const cleanEmail = email.trim().toLowerCase();
        const user = await this.usersService.findByEmail(cleanEmail);
        if (!user) {
            throw new BadRequestException('Usuário não encontrado.');
        }
        if (user.isEmailVerified) {
            throw new BadRequestException('Este e-mail já foi verificado.');
        }
        const recent = await this.prisma.emailVerification.findFirst({
            where: { email: cleanEmail },
            orderBy: { createdAt: 'desc' },
        });
        if (recent && (Date.now() - new Date(recent.createdAt).getTime()) < 60000) {
            const waitSeconds = Math.ceil((60000 - (Date.now() - new Date(recent.createdAt).getTime())) / 1000);
            throw new BadRequestException(`Aguarde ${waitSeconds} segundos antes de solicitar um novo código.`);
        }
        await this.generateAndSendCode(user.email, user.username);
        return { success: true, message: 'Código reenviado com sucesso.' };
    }
    processedNonces = new Map();
    validateAndConsumeNonce(nonce) {
        const now = Date.now();
        for (const [n, ts] of this.processedNonces.entries()) {
            if (now - ts > 10 * 60 * 1000) {
                this.processedNonces.delete(n);
            }
        }
        if (this.processedNonces.has(nonce)) {
            return false;
        }
        this.processedNonces.set(nonce, now);
        return true;
    }
    async syncAgeSignal(userId, signal) {
        let classification = AgeClassification.UNKNOWN;
        let source = AgeSignalSource.NONE;
        if (signal.available && typeof signal.lower === 'number') {
            const secret = process.env.VOXY_AGE_SIGNAL_SECRET || 'v0xy_4g3_s1gn4l_s3cur1ty_pr0t0c0l_2026_k3y';
            let isCryptographicallyVerified = false;
            if (signal.signature && signal.nonce && signal.timestamp) {
                const now = Date.now();
                const ageDiff = Math.abs(now - signal.timestamp);
                if (ageDiff <= 5 * 60 * 1000) {
                    if (this.validateAndConsumeNonce(signal.nonce)) {
                        const canonicalData = `${signal.available ? 'true' : 'false'}:${signal.lower}:${signal.upper}:${signal.status}:${signal.timestamp}:${signal.nonce}`;
                        const expectedSig = crypto.createHmac('sha256', secret).update(canonicalData).digest('hex');
                        if (expectedSig.length === signal.signature.length &&
                            crypto.timingSafeEqual(Buffer.from(expectedSig), Buffer.from(signal.signature))) {
                            isCryptographicallyVerified = true;
                        }
                        else {
                            console.warn(`[Security Alert] Assinatura HMAC inválida para o sinal de idade do usuário ${userId}!`);
                        }
                    }
                    else {
                        console.warn(`[Security Alert] Replay Attack detectado para o nonce ${signal.nonce} do usuário ${userId}!`);
                    }
                }
                else {
                    console.warn(`[Security Alert] Timestamp expirado para o sinal de idade do usuário ${userId}: diff=${ageDiff}ms`);
                }
            }
            else {
                console.warn(`[Security Alert] Sinal de idade recebido sem assinatura criptográfica para o usuário ${userId}!`);
            }
            if (isCryptographicallyVerified) {
                source = AgeSignalSource.WINDOWS_OS;
                if (signal.lower >= 18) {
                    classification = AgeClassification.ADULT;
                }
                else if (signal.lower >= 13 || (signal.upper !== undefined && signal.upper <= 17)) {
                    classification = AgeClassification.TEEN;
                }
                else {
                    classification = AgeClassification.CHILD;
                }
            }
            else {
                classification = AgeClassification.UNKNOWN;
                source = AgeSignalSource.NONE;
            }
        }
        else {
            classification = AgeClassification.UNKNOWN;
            source = AgeSignalSource.NONE;
        }
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: {
                ageClassification: classification,
                ageSignalSource: source,
                ageSignalCheckedAt: new Date(),
            },
            select: {
                id: true,
                username: true,
                email: true,
                birthDate: true,
                isEmailVerified: true,
                ageClassification: true,
                ageSignalSource: true,
                ageSignalCheckedAt: true,
            },
        });
        return {
            success: true,
            user: {
                ...updated,
                canShareScreen: updated.ageClassification === AgeClassification.ADULT,
                canStreamGames: updated.ageClassification === AgeClassification.ADULT || updated.ageClassification === AgeClassification.TEEN,
                canAccess18Plus: updated.ageClassification === AgeClassification.ADULT,
                canUseApp: updated.ageClassification !== AgeClassification.CHILD,
            },
            changed: true,
        };
    }
};
AuthService = __decorate([
    Injectable(),
    __param(2, Inject(TOKEN_SERVICE_PORT)),
    __param(3, Inject(PASSWORD_HASHER_PORT)),
    __param(4, Inject(EMAIL_SERVICE_PORT)),
    __metadata("design:paramtypes", [UsersService,
        PrismaService, Object, Object, Object])
], AuthService);
export { AuthService };
//# sourceMappingURL=auth.service.js.map