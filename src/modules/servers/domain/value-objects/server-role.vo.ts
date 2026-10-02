import { ValueObject } from '../../../../core/domain/value-object.base.js';
import { Result } from '../../../../core/logic/result.js';

export type ServerRoleType = 'OWNER' | 'ADMIN' | 'MODERATOR' | 'MEMBER';

interface ServerRoleProps {
  value: ServerRoleType;
}

export class ServerRole extends ValueObject<ServerRoleProps> {
  get value(): ServerRoleType {
    return this.props.value;
  }

  public isOwner(): boolean {
    return this.props.value === 'OWNER';
  }

  public isAdmin(): boolean {
    return this.props.value === 'ADMIN';
  }

  public isModerator(): boolean {
    return this.props.value === 'MODERATOR';
  }

  public isMember(): boolean {
    return this.props.value === 'MEMBER';
  }

  private constructor(props: ServerRoleProps) {
    super(props);
  }

  public static create(role: string): Result<ServerRole> {
    const normalized = role?.toUpperCase();
    const validRoles: ServerRoleType[] = ['OWNER', 'ADMIN', 'MODERATOR', 'MEMBER'];
    if (!validRoles.includes(normalized as ServerRoleType)) {
      return Result.fail<ServerRole>('Papel de servidor inválido. Deve ser OWNER, ADMIN, MODERATOR ou MEMBER.');
    }

    return Result.ok<ServerRole>(new ServerRole({ value: normalized as ServerRoleType }));
  }

  public static owner(): ServerRole {
    return new ServerRole({ value: 'OWNER' });
  }

  public static admin(): ServerRole {
    return new ServerRole({ value: 'ADMIN' });
  }

  public static moderator(): ServerRole {
    return new ServerRole({ value: 'MODERATOR' });
  }

  public static member(): ServerRole {
    return new ServerRole({ value: 'MEMBER' });
  }
}
