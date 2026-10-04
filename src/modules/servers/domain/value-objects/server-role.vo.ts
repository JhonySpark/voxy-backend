import { ValueObject } from '../../../../core/domain/value-object.base.js';
import { Result } from '../../../../core/logic/result.js';
import { ServerRoleEnum } from '../../../../core/enums/index.js';

export type ServerRoleType = ServerRoleEnum;

interface ServerRoleProps {
  value: ServerRoleEnum;
}

export class ServerRole extends ValueObject<ServerRoleProps> {
  get value(): ServerRoleEnum {
    return this.props.value;
  }

  public isOwner(): boolean {
    return this.props.value === ServerRoleEnum.OWNER;
  }

  public isAdmin(): boolean {
    return this.props.value === ServerRoleEnum.ADMIN;
  }

  public isModerator(): boolean {
    return this.props.value === ServerRoleEnum.MODERATOR;
  }

  public isMember(): boolean {
    return this.props.value === ServerRoleEnum.MEMBER;
  }

  private constructor(props: ServerRoleProps) {
    super(props);
  }

  public static create(role: string): Result<ServerRole> {
    const normalized = role?.toUpperCase();
    const validRoles = Object.values(ServerRoleEnum);
    if (!validRoles.includes(normalized as ServerRoleEnum)) {
      return Result.fail<ServerRole>('Papel de servidor inválido. Deve ser OWNER, ADMIN, MODERATOR ou MEMBER.');
    }

    return Result.ok<ServerRole>(new ServerRole({ value: normalized as ServerRoleEnum }));
  }

  public static owner(): ServerRole {
    return new ServerRole({ value: ServerRoleEnum.OWNER });
  }

  public static admin(): ServerRole {
    return new ServerRole({ value: ServerRoleEnum.ADMIN });
  }

  public static moderator(): ServerRole {
    return new ServerRole({ value: ServerRoleEnum.MODERATOR });
  }

  public static member(): ServerRole {
    return new ServerRole({ value: ServerRoleEnum.MEMBER });
  }
}
