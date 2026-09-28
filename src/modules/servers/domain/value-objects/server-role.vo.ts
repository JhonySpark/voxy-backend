import { ValueObject } from '../../../../core/domain/value-object.base.js';
import { Result } from '../../../../core/logic/result.js';

export type ServerRoleType = 'OWNER' | 'MEMBER';

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

  private constructor(props: ServerRoleProps) {
    super(props);
  }

  public static create(role: string): Result<ServerRole> {
    const normalized = role?.toUpperCase();
    if (normalized !== 'OWNER' && normalized !== 'MEMBER') {
      return Result.fail<ServerRole>('Papel de servidor inválido. Deve ser OWNER ou MEMBER.');
    }

    return Result.ok<ServerRole>(new ServerRole({ value: normalized as ServerRoleType }));
  }

  public static owner(): ServerRole {
    return new ServerRole({ value: 'OWNER' });
  }

  public static member(): ServerRole {
    return new ServerRole({ value: 'MEMBER' });
  }
}
