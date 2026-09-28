import { Injectable, Inject } from '@nestjs/common';
import { USER_REPOSITORY } from '../core/ports/repositories/user.repository.port.js';
import type { IUserRepository } from '../core/ports/repositories/user.repository.port.js';
import { User } from '../modules/identity/domain/entities/user.entity.js';
import { Email } from '../modules/identity/domain/value-objects/email.vo.js';
import { Username } from '../modules/identity/domain/value-objects/username.vo.js';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: IUserRepository,
  ) {}

  async create(data: { username: string; email: string; password?: string }) {
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

  async findByUsername(username: string) {
    const user = await this.userRepo.findByUsername(username);
    if (!user) return null;
    return {
      id: user.id,
      username: user.username.value,
      email: user.email.value,
      password: user.password,
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
    };
  }
}
