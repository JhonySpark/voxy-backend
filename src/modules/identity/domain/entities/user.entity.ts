import { AggregateRoot } from '../../../../core/domain/aggregate-root.base.js';
import { Result } from '../../../../core/logic/result.js';
import { Email } from '../value-objects/email.vo.js';
import { Username } from '../value-objects/username.vo.js';
import { BirthDate } from '../value-objects/birth-date.vo.js';
import { AgeClassificationEnum, AgeSignalSourceEnum } from '../../../../core/enums/index.js';

export type AgeClassificationType = AgeClassificationEnum;
export type AgeSignalSourceType = AgeSignalSourceEnum;

export interface UserProps {
  username: Username;
  email: Email;
  password: string; // Hashed password
  birthDate?: BirthDate | null;
  isEmailVerified?: boolean;
  emailVerifiedAt?: Date | null;
  ageClassification?: AgeClassificationEnum;
  ageSignalSource?: AgeSignalSourceEnum;
  ageSignalCheckedAt?: Date | null;
  isSuspended?: boolean;
  suspendedReason?: string | null;
  suspendedAt?: Date | null;
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

  get isSuspended(): boolean {
    return this.props.isSuspended ?? false;
  }

  get suspendedReason(): string | null | undefined {
    return this.props.suspendedReason;
  }

  get suspendedAt(): Date | null | undefined {
    return this.props.suspendedAt;
  }

  public suspend(reason: string): Result<void> {
    if (!reason || reason.trim().length === 0) {
      return Result.fail<void>('O motivo da suspensão é obrigatório.');
    }
    this.props.isSuspended = true;
    this.props.suspendedReason = reason.trim();
    this.props.suspendedAt = new Date();
    this.props.updatedAt = new Date();
    return Result.ok<void>();
  }

  public unsuspend(): Result<void> {
    this.props.isSuspended = false;
    this.props.suspendedReason = null;
    this.props.suspendedAt = null;
    this.props.updatedAt = new Date();
    return Result.ok<void>();
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

  get birthDate(): BirthDate | null | undefined {
    return this.props.birthDate;
  }

  get isEmailVerified(): boolean {
    return this.props.isEmailVerified ?? false;
  }

  get emailVerifiedAt(): Date | null | undefined {
    return this.props.emailVerifiedAt;
  }

  get ageClassification(): AgeClassificationEnum {
    return this.props.ageClassification || AgeClassificationEnum.UNKNOWN;
  }

  get ageSignalSource(): AgeSignalSourceEnum {
    return this.props.ageSignalSource || AgeSignalSourceEnum.NONE;
  }

  get ageSignalCheckedAt(): Date | null | undefined {
    return this.props.ageSignalCheckedAt;
  }

  public verifyEmail(): void {
    this.props.isEmailVerified = true;
    this.props.emailVerifiedAt = new Date();
    this.props.updatedAt = new Date();
  }

  public updateAgeClassification(classification: AgeClassificationEnum, source: AgeSignalSourceEnum): void {
    this.props.ageClassification = classification;
    this.props.ageSignalSource = source;
    this.props.ageSignalCheckedAt = new Date();
    this.props.updatedAt = new Date();
  }

  public canUseApp(): boolean {
    return !this.isSuspended && this.ageClassification !== AgeClassificationEnum.CHILD;
  }

  public canShareScreen(): boolean {
    return this.ageClassification === AgeClassificationEnum.ADULT;
  }

  public canStreamGames(): boolean {
    return this.ageClassification === AgeClassificationEnum.ADULT || this.ageClassification === AgeClassificationEnum.TEEN;
  }

  public canAccess18Plus(): boolean {
    return this.ageClassification === AgeClassificationEnum.ADULT;
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
