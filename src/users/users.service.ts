import { Injectable, Inject, NotFoundException, BadRequestException } from '@nestjs/common';
import { USER_REPOSITORY } from '../core/ports/repositories/user.repository.port.js';
import type { IUserRepository } from '../core/ports/repositories/user.repository.port.js';
import { User } from '../modules/identity/domain/entities/user.entity.js';
import { Email } from '../modules/identity/domain/value-objects/email.vo.js';
import { Username } from '../modules/identity/domain/value-objects/username.vo.js';
import { BirthDate } from '../modules/identity/domain/value-objects/birth-date.vo.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { PASSWORD_HASHER_PORT } from '../core/ports/security/password-hasher.port.js';
import type { IPasswordHasherPort } from '../core/ports/security/password-hasher.port.js';
import { AgeClassificationEnum, AgeSignalSourceEnum } from '../core/enums/index.js';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
    private readonly prisma: PrismaService,
    @Inject(PASSWORD_HASHER_PORT) private readonly hasher: IPasswordHasherPort,
  ) {}

  async create(data: { username: string; email: string; password?: string; birthDate?: string | Date }) {
    const birthDateVO = data.birthDate ? BirthDate.create(data.birthDate).getValue() : null;
    const userOrError = User.create({
      username: Username.create(data.username).getValue(),
      email: Email.create(data.email).getValue(),
      password: data.password || '',
      birthDate: birthDateVO,
      isEmailVerified: false,
      ageClassification: AgeClassificationEnum.UNKNOWN,
      ageSignalSource: AgeSignalSourceEnum.NONE,
    });

    const user = userOrError.getValue();
    const created = await this.userRepo.create(user);
    return {
      id: created.id,
      username: created.username.value,
      email: created.email.value,
      password: created.password,
      birthDate: created.birthDate?.value || null,
      isEmailVerified: created.isEmailVerified,
      ageClassification: created.ageClassification,
      ageSignalSource: created.ageSignalSource,
    };
  }

  async findByUsername(username: string) {
    const user = await this.userRepo.findByUsername(username);
    if (!user) return null;
    return {
      id: user.id,
      username: user.username.value,
      email: user.email.value,
      password: user.password,
      birthDate: user.birthDate?.value || null,
      isEmailVerified: user.isEmailVerified,
      ageClassification: user.ageClassification,
      ageSignalSource: user.ageSignalSource,
      isSuspended: user.isSuspended,
      suspendedReason: user.suspendedReason,
    };
  }

  async findByEmail(email: string) {
    const user = await this.userRepo.findByEmail(email);
    if (!user) return null;
    return {
      id: user.id,
      username: user.username.value,
      email: user.email.value,
      password: user.password,
      birthDate: user.birthDate?.value || null,
      isEmailVerified: user.isEmailVerified,
      ageClassification: user.ageClassification,
      ageSignalSource: user.ageSignalSource,
      isSuspended: user.isSuspended,
      suspendedReason: user.suspendedReason,
    };
  }

  async findById(id: string) {
    const user = await this.userRepo.findById(id);
    if (!user) return null;
    return {
      id: user.id,
      username: user.username.value,
      email: user.email.value,
      password: user.password,
      birthDate: user.birthDate?.value || null,
      isEmailVerified: user.isEmailVerified,
      ageClassification: user.ageClassification,
      ageSignalSource: user.ageSignalSource,
      isSuspended: user.isSuspended,
      suspendedReason: user.suspendedReason,
    };
  }

  async getProfile(userId: string, requestingUserId?: string) {
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
        birthDate: true,
        isEmailVerified: true,
        ageClassification: true,
        ageSignalSource: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado.');
    }

    const version = user.updatedAt ? `?v=${new Date(user.updatedAt).getTime()}` : '';
    const isSelf = !requestingUserId || requestingUserId === userId;

    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      bio: user.bio,
      avatarUrl: user.avatarUrl ? `${user.avatarUrl.split('?')[0]}${version}` : null,
      bannerUrl: user.bannerUrl ? `${user.bannerUrl.split('?')[0]}${version}` : null,
      bannerColor: user.bannerColor,
      createdAt: user.createdAt,
      email: isSelf ? user.email : undefined,
      birthDate: isSelf ? user.birthDate : undefined,
      isEmailVerified: user.isEmailVerified,
      ageClassification: user.ageClassification,
      ageSignalSource: user.ageSignalSource,
      canShareScreen: user.ageClassification === AgeClassificationEnum.ADULT,
      canStreamGames: user.ageClassification === AgeClassificationEnum.ADULT || user.ageClassification === AgeClassificationEnum.TEEN,
      canAccess18Plus: user.ageClassification === AgeClassificationEnum.ADULT,
      canUseApp: user.ageClassification !== AgeClassificationEnum.CHILD,
    };
  }

  async updateProfile(
    userId: string,
    data: { displayName?: string; bio?: string; bannerColor?: string },
  ) {
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

  async changePassword(userId: string, currentPass: string, newPass: string) {
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
}
