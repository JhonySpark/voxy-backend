import { User } from '../../../modules/identity/domain/entities/user.entity.js';

export interface IUserRepository {
  create(user: User): Promise<User>;
  findByUsername(username: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
}

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');
