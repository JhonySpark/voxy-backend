import { Entity } from '../../../../core/domain/entity.base.js';
import { Result } from '../../../../core/logic/result.js';
import { ChannelType } from '../value-objects/channel-type.vo.js';

export interface ChannelProps {
  name: string;
  type: ChannelType;
  serverId: string;
  icon?: string | null;
  isRestricted?: boolean;
  allowedRoles?: string[];
  createdAt?: Date;
}

export class Channel extends Entity<ChannelProps> {
  get name(): string {
    return this.props.name;
  }

  get type(): ChannelType {
    return this.props.type;
  }

  get serverId(): string {
    return this.props.serverId;
  }

  get icon(): string | null {
    return this.props.icon ?? 'hash';
  }

  get isRestricted(): boolean {
    return Boolean(this.props.isRestricted);
  }

  get allowedRoles(): string[] {
    return this.props.allowedRoles ?? [];
  }

  get createdAt(): Date {
    return this.props.createdAt || new Date();
  }

  public rename(name: string): Result<void> {
    if (!name || !name.trim()) {
      return Result.fail<void>('Nome do canal não pode ser vazio.');
    }
    this.props.name = name.trim();
    return Result.ok<void>();
  }

  public updateSettings(settings: {
    name?: string;
    icon?: string | null;
    isRestricted?: boolean;
    allowedRoles?: string[];
  }): Result<void> {
    if (settings.name !== undefined) {
      const renameRes = this.rename(settings.name);
      if (renameRes.isFailure) return renameRes;
    }

    if (settings.icon !== undefined && this.props.type.isText()) {
      this.props.icon = settings.icon ? settings.icon.trim() : 'hash';
    }

    if (settings.isRestricted !== undefined) {
      this.props.isRestricted = Boolean(settings.isRestricted);
    }

    if (settings.allowedRoles !== undefined) {
      const validRoles = ['ADMIN', 'MODERATOR', 'MEMBER'];
      this.props.allowedRoles = Array.from(
        new Set((settings.allowedRoles || []).filter((r) => validRoles.includes(r)))
      );
    }

    return Result.ok<void>();
  }

  public canUserWrite(role?: string | null): boolean {
    if (!role) return false;
    if (role === 'OWNER') return true;
    if (!this.isRestricted) return true;
    return this.allowedRoles.includes(role);
  }

  private constructor(props: ChannelProps, id?: string) {
    super(props, id);
  }

  public static create(props: ChannelProps, id?: string): Result<Channel> {
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail<Channel>('Nome do canal não pode ser vazio.');
    }

    if (!props.serverId) {
      return Result.fail<Channel>('O ID do servidor é obrigatório.');
    }

    const channel = new Channel({
      ...props,
      name: props.name.trim(),
      icon: props.icon ?? 'hash',
      isRestricted: Boolean(props.isRestricted),
      allowedRoles: Array.isArray(props.allowedRoles) ? props.allowedRoles : [],
      createdAt: props.createdAt || new Date(),
    }, id);

    return Result.ok<Channel>(channel);
  }
}
