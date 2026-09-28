import { AggregateRoot } from '../../../../core/domain/aggregate-root.base.js';
import { Result } from '../../../../core/logic/result.js';
import { Email } from '../value-objects/email.vo.js';
import { Username } from '../value-objects/username.vo.js';

export interface UserProps {
  username: Username;
  email: Email;
  password: string; // Hashed password
  createdAt?: Date;
  updatedAt?: Date;
}

export class User extends AggregateRoot<UserProps> {
  get username(): Username {
    return this.props.username;
  }

  get email(): Email {
    return this.props.email;
  }

  get password(): string {
    return this.props.password;
  }

  get createdAt(): Date {
    return this.props.createdAt || new Date();
  }

  get updatedAt(): Date {
    return this.props.updatedAt || new Date();
  }

  private constructor(props: UserProps, id?: string) {
    super(props, id);
  }

  public changePassword(newHashedPassword: string): Result<void> {
    if (!newHashedPassword || newHashedPassword.trim().length === 0) {
      return Result.fail<void>('Senha hash não pode ser vazia.');
    }
    this.props.password = newHashedPassword;
    this.props.updatedAt = new Date();
    return Result.ok<void>();
  }

  public static create(props: UserProps, id?: string): Result<User> {
    if (!props.password || props.password.length === 0) {
      return Result.fail<User>('A senha é obrigatória.');
    }

    const user = new User({
      ...props,
      createdAt: props.createdAt || new Date(),
      updatedAt: props.updatedAt || new Date(),
    }, id);

    return Result.ok<User>(user);
  }
}
