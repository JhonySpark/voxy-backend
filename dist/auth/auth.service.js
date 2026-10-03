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
import { Injectable, BadRequestException, Inject } from '@nestjs/common';
import { UsersService } from '../users/users.service.js';
import { PASSWORD_HASHER_PORT } from '../core/ports/security/password-hasher.port.js';
import { TOKEN_SERVICE_PORT } from '../core/ports/security/token-service.port.js';
import { Email } from '../modules/identity/domain/value-objects/email.vo.js';
import { Username } from '../modules/identity/domain/value-objects/username.vo.js';
import { Password } from '../modules/identity/domain/value-objects/password.vo.js';
export const AuthErrorCodes = {
    INVALID_EMAIL: 'AUTH_INVALID_EMAIL',
    INVALID_USERNAME: 'AUTH_INVALID_USERNAME',
    WEAK_PASSWORD: 'AUTH_WEAK_PASSWORD',
    EMAIL_ALREADY_EXISTS: 'AUTH_EMAIL_ALREADY_EXISTS',
    USERNAME_ALREADY_EXISTS: 'AUTH_USERNAME_ALREADY_EXISTS',
    USERNAME_AVAILABLE: 'AUTH_USERNAME_AVAILABLE',
    INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
};
let AuthService = class AuthService {
    usersService;
    tokenService;
    passwordHasher;
    constructor(usersService, tokenService, passwordHasher) {
        this.usersService = usersService;
        this.tokenService = tokenService;
        this.passwordHasher = passwordHasher;
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
        const payload = { username: user.username, sub: user.id };
        return {
            access_token: this.tokenService.sign(payload),
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
        });
        const { password, ...result } = user;
        return result;
    }
};
AuthService = __decorate([
    Injectable(),
    __param(1, Inject(TOKEN_SERVICE_PORT)),
    __param(2, Inject(PASSWORD_HASHER_PORT)),
    __metadata("design:paramtypes", [UsersService, Object, Object])
], AuthService);
export { AuthService };
//# sourceMappingURL=auth.service.js.map