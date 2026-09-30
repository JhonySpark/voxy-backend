import { AggregateRoot } from '../../../../core/domain/aggregate-root.base.js';
import { Result } from '../../../../core/logic/result.js';
import { Email } from '../value-objects/email.vo.js';
import { Username } from '../value-objects/username.vo.js';

export interface UserProps {
  username: Username;
  email: Email;
  password: string; // Hashed password
  avatarUrl?: string | null;
  avatarKey?: string | null;
  displayName?: string | null;
  bio?: string | null;
  bannerUrl?: string | null;
  bannerKey?: string | null;
  bannerColor?: string | null;
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

  get avatarUrl(): string | null | undefined {
    return this.props.avatarUrl;
  }

  get avatarKey(): string | null | undefined {
    return this.props.avatarKey;
  }

  get displayName(): string | null | undefined {
    return this.props.displayName;
  }

  get bio(): string | null | undefined {
    return this.props.bio;
  }

  get bannerUrl(): string | null | undefined {
    return this.props.bannerUrl;
  }

  get bannerKey(): string | null | undefined {
    return this.props.bannerKey;
  }

  get bannerColor(): string | null | undefined {
    return this.props.bannerColor;
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

  public updateProfile(props: {
    displayName?: string | null;
    bio?: string | null;
    bannerColor?: string | null;
  }): Result<void> {
    if (props.displayName !== undefined) {
      this.props.displayName = props.displayName ? props.displayName.trim() : null;
    }
    if (props.bio !== undefined) {
      this.props.bio = props.bio ? props.bio.trim() : null;
    }
    if (props.bannerColor !== undefined) {
      this.props.bannerColor = props.bannerColor || null;
    }
    this.props.updatedAt = new Date();
    return Result.ok<void>();
  }

  public updateAvatar(url: string, key: string): Result<void> {
    if (!url || !key) {
      return Result.fail<void>('Avatar URL e Key são obrigatórios.');
    }
    this.props.avatarUrl = url;
    this.props.avatarKey = key;
    this.props.updatedAt = new Date();
    return Result.ok<void>();
  }

  public removeAvatar(): Result<void> {
    this.props.avatarUrl = null;
    this.props.avatarKey = null;
    this.props.updatedAt = new Date();
    return Result.ok<void>();
  }

  public updateBanner(url: string, key: string): Result<void> {
    if (!url || !key) {
      return Result.fail<void>('Banner URL e Key são obrigatórios.');
    }
    this.props.bannerUrl = url;
    this.props.bannerKey = key;
    this.props.updatedAt = new Date();
    return Result.ok<void>();
  }

  public removeBanner(): Result<void> {
    this.props.bannerUrl = null;
    this.props.bannerKey = null;
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
