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
import { Injectable, Inject } from '@nestjs/common';
import { USER_REPOSITORY } from '../core/ports/repositories/user.repository.port.js';
import { User } from '../modules/identity/domain/entities/user.entity.js';
import { Email } from '../modules/identity/domain/value-objects/email.vo.js';
import { Username } from '../modules/identity/domain/value-objects/username.vo.js';
let UsersService = class UsersService {
    userRepo;
    constructor(userRepo) {
        this.userRepo = userRepo;
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
};
UsersService = __decorate([
    Injectable(),
    __param(0, Inject(USER_REPOSITORY)),
    __metadata("design:paramtypes", [Object])
], UsersService);
export { UsersService };
//# sourceMappingURL=users.service.js.map