import { Entity } from '../../../../core/domain/entity.base.js';
import { Result } from '../../../../core/logic/result.js';
import { ServerRole } from '../value-objects/server-role.vo.js';

export interface ServerMemberProps {
  serverId: string;
  userId: string;
  role: ServerRole;
  isMuted?: boolean;
  mutedReason?: string | null;
  mutedUntil?: Date | null;
  createdAt?: Date;
  username?: string;
}

export class ServerMember extends Entity<ServerMemberProps> {
  get serverId(): string {
    return this.props.serverId;
  }

  get userId(): string {
    return this.props.userId;
  }

  get role(): ServerRole {
    return this.props.role;
  }

  get isMuted(): boolean {
    if (!this.props.isMuted) return false;
    if (this.props.mutedUntil && new Date() > this.props.mutedUntil) {
      return false;
    }
    return true;
  }

  get mutedReason(): string | null | undefined {
    return this.props.mutedReason;
  }

  get mutedUntil(): Date | null | undefined {
    return this.props.mutedUntil;
  }

  get createdAt(): Date {
    return this.props.createdAt || new Date();
  }

  get username(): string | undefined {
    return this.props.username;
  }

  public isOwner(): boolean {
    return this.props.role.isOwner();
  }

  public isAdmin(): boolean {
    return this.props.role.isAdmin();
  }

  public isModerator(): boolean {
    return this.props.role.isModerator();
  }

  public changeRole(role: ServerRole): void {
    this.props.role = role;
  }

  public mute(reason?: string, until?: Date): void {
    this.props.isMuted = true;
    this.props.mutedReason = reason?.trim() || null;
    this.props.mutedUntil = until || null;
  }

  public unmute(): void {
    this.props.isMuted = false;
    this.props.mutedReason = null;
    this.props.mutedUntil = null;
  }

  private constructor(props: ServerMemberProps, id?: string) {
    super(props, id);
  }

  public static create(props: ServerMemberProps, id?: string): Result<ServerMember> {
    if (!props.serverId || !props.userId) {
      return Result.fail<ServerMember>('ServerId e UserId são obrigatórios para um membro.');
    }

    const member = new ServerMember({
      ...props,
      isMuted: props.isMuted ?? false,
      mutedReason: props.mutedReason ?? null,
      mutedUntil: props.mutedUntil ?? null,
      createdAt: props.createdAt || new Date(),
    }, id);

    return Result.ok<ServerMember>(member);
  }
}
