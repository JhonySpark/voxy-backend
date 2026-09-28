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
    async register(data) {
        const userExists = await this.usersService.findByEmail(data.email);
        if (userExists) {
            throw new BadRequestException('User already exists');
        }
        const hashedPassword = await this.passwordHasher.hash(data.password || '');
        const user = await this.usersService.create({
            ...data,
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