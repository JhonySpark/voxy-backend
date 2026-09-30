import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service.js';
import { IUserRepository } from '../../../core/ports/repositories/user.repository.port.js';
import { User } from '../../../modules/identity/domain/entities/user.entity.js';
import { Email } from '../../../modules/identity/domain/value-objects/email.vo.js';
import { Username } from '../../../modules/identity/domain/value-objects/username.vo.js';

@Injectable()
export class PrismaUserRepository implements IUserRepository {
  constructor(private readonly prisma: PrismaService) {}

  private toDomain(raw: any): User | null {
    if (!raw) return null;
    const email = Email.create(raw.email).getValue();
    const username = Username.create(raw.username).getValue();

    return User.create(
      {
        email,
        username,
        password: raw.password,
        avatarUrl: raw.avatarUrl,
        avatarKey: raw.avatarKey,
        displayName: raw.displayName,
        bio: raw.bio,
        bannerUrl: raw.bannerUrl,
        bannerKey: raw.bannerKey,
        bannerColor: raw.bannerColor,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      raw.id
    ).getValue();
  }

  async create(user: User): Promise<User> {
    const raw = await this.prisma.user.create({
      data: {
        id: user.id,
        username: user.username.value,
        email: user.email.value,
        password: user.password,
        avatarUrl: user.avatarUrl,
        avatarKey: user.avatarKey,
        displayName: user.displayName,
        bio: user.bio,
        bannerUrl: user.bannerUrl,
        bannerKey: user.bannerKey,
        bannerColor: user.bannerColor,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    });

    return this.toDomain(raw)!;
  }

  async update(user: User): Promise<User> {
    const raw = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        username: user.username.value,
        email: user.email.value,
        password: user.password,
        avatarUrl: user.avatarUrl,
        avatarKey: user.avatarKey,
        displayName: user.displayName,
        bio: user.bio,
        bannerUrl: user.bannerUrl,
        bannerKey: user.bannerKey,
        bannerColor: user.bannerColor,
        updatedAt: user.updatedAt,
      },
    });

    return this.toDomain(raw)!;
  }

  async findByUsername(username: string): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({
      where: { username },
    });
    return this.toDomain(raw);
  }

  async findByEmail(email: string): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({
      where: { email },
    });
    return this.toDomain(raw);
  }

  async findById(id: string): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({
      where: { id },
    });
    return this.toDomain(raw);
  }
}
