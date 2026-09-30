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
import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { USER_REPOSITORY } from '../core/ports/repositories/user.repository.port.js';
import { User } from '../modules/identity/domain/entities/user.entity.js';
import { Email } from '../modules/identity/domain/value-objects/email.vo.js';
import { Username } from '../modules/identity/domain/value-objects/username.vo.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PASSWORD_HASHER_PORT } from '../core/ports/security/password-hasher.port.js';
let UsersService = class UsersService {
    userRepo;
    prisma;
    hasher;
    constructor(userRepo, prisma, hasher) {
        this.userRepo = userRepo;
        this.prisma = prisma;
        this.hasher = hasher;
    }
    async create(data) {
        const userOrError = User.create({
            username: Username.create(data.username).getValue(),
            email: Email.create(data.email).getValue(),
            password: data.password || '',
        });
        const user = userOrError.getValue();
        const created = await this.userRepo.create(user);
        return {
            id: created.id,
            username: created.username.value,
            email: created.email.value,
            password: created.password,
        };
    }
    async findByUsername(username) {
        const user = await this.userRepo.findByUsername(username);
        if (!user)
            return null;
        return {
            id: user.id,
            username: user.username.value,
            email: user.email.value,
            password: user.password,
        };
    }
    async findByEmail(email) {
        const user = await this.userRepo.findByEmail(email);
        if (!user)
            return null;
        return {
            id: user.id,
            username: user.username.value,
            email: user.email.value,
            password: user.password,
        };
    }
    async findById(id) {
        const user = await this.userRepo.findById(id);
        if (!user)
            return null;
        return {
            id: user.id,
            username: user.username.value,
            email: user.email.value,
            password: user.password,
        };
    }
    async getProfile(userId) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                username: true,
                email: true,
                displayName: true,
                bio: true,
                avatarUrl: true,
                avatarKey: true,
                bannerUrl: true,
                bannerKey: true,
                bannerColor: true,
                createdAt: true,
                updatedAt: true,
            },
        });
        if (!user) {
            throw new NotFoundException('Usuário não encontrado.');
        }
        const version = user.updatedAt ? `?v=${new Date(user.updatedAt).getTime()}` : '';
        return {
            ...user,
            avatarUrl: user.avatarUrl ? `${user.avatarUrl.split('?')[0]}${version}` : null,
            bannerUrl: user.bannerUrl ? `${user.bannerUrl.split('?')[0]}${version}` : null,
        };
    }
    async updateProfile(userId, data) {
        const updated = await this.prisma.user.update({
            where: { id: userId },
            data: {
                ...(data.displayName !== undefined ? { displayName: data.displayName.trim() || null } : {}),
                ...(data.bio !== undefined ? { bio: data.bio.trim() || null } : {}),
                ...(data.bannerColor !== undefined ? { bannerColor: data.bannerColor.trim() || null } : {}),
            },
            select: {
                id: true,
                username: true,
                email: true,
                displayName: true,
                bio: true,
                avatarUrl: true,
                bannerUrl: true,
                bannerColor: true,
                updatedAt: true,
            },
        });
        const version = updated.updatedAt ? `?v=${new Date(updated.updatedAt).getTime()}` : '';
        return {
            ...updated,
            avatarUrl: updated.avatarUrl ? `${updated.avatarUrl.split('?')[0]}${version}` : null,
            bannerUrl: updated.bannerUrl ? `${updated.bannerUrl.split('?')[0]}${version}` : null,
        };
    }
    async changePassword(userId, currentPass, newPass) {
        if (!currentPass || !newPass) {
            throw new BadRequestException('Senha atual e nova senha são obrigatórias.');
        }
        if (newPass.length < 6) {
            throw new BadRequestException('A nova senha deve ter no mínimo 6 caracteres.');
        }
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new NotFoundException('Usuário não encontrado.');
        }
        const isMatch = await this.hasher.compare(currentPass, user.password);
        if (!isMatch) {
            throw new BadRequestException('Senha atual incorreta.');
        }
        const hashed = await this.hasher.hash(newPass);
        await this.prisma.user.update({
            where: { id: userId },
            data: { password: hashed },
        });
        return { message: 'Senha atualizada com sucesso.' };
    }
};
UsersService = __decorate([
    Injectable(),
    __param(0, Inject(USER_REPOSITORY)),
    __param(2, Inject(PASSWORD_HASHER_PORT)),
    __metadata("design:paramtypes", [Object, PrismaService, Object])
], UsersService);
export { UsersService };
//# sourceMappingURL=users.service.js.map