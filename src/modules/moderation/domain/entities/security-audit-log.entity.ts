import { AggregateRoot } from '../../../../core/domain/aggregate-root.base.js';
import { Result } from '../../../../core/logic/result.js';
import { AuditLogActionEnum } from '../../../../core/enums/index.js';

export interface SecurityAuditLogProps {
  action: AuditLogActionEnum;
  actorId: string;
  targetType: string;
  targetId?: string | null;
  serverId?: string | null;
  reason?: string | null;
  metadata?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt?: Date;
}

export class SecurityAuditLog extends AggregateRoot<SecurityAuditLogProps> {
  get action(): AuditLogActionEnum {
    return this.props.action;
  }

  get actorId(): string {
    return this.props.actorId;
  }

  get targetType(): string {
    return this.props.targetType;
  }

  get targetId(): string | null | undefined {
    return this.props.targetId;
  }

  get serverId(): string | null | undefined {
    return this.props.serverId;
  }

  get reason(): string | null | undefined {
    return this.props.reason;
  }

  get metadata(): Record<string, any> | null | undefined {
    return this.props.metadata;
  }

  get ipAddress(): string | null | undefined {
    return this.props.ipAddress;
  }

  get userAgent(): string | null | undefined {
    return this.props.userAgent;
  }

  get createdAt(): Date {
    return this.props.createdAt || new Date();
  }

  private constructor(props: SecurityAuditLogProps, id?: string) {
    super(props, id);
  }

  public static create(props: SecurityAuditLogProps, id?: string): Result<SecurityAuditLog> {
    if (!props.action) {
      return Result.fail<SecurityAuditLog>('A ação do log de auditoria é obrigatória.');
    }
    if (!props.actorId) {
      return Result.fail<SecurityAuditLog>('O identificador do autor da ação é obrigatório.');
    }
    if (!props.targetType) {
      return Result.fail<SecurityAuditLog>('O tipo de alvo é obrigatório.');
    }

    const log = new SecurityAuditLog(
      {
        ...props,
        reason: props.reason?.trim() || null,
        metadata: props.metadata || null,
        createdAt: props.createdAt || new Date(),
      },
      id,
    );

    return Result.ok<SecurityAuditLog>(log);
  }
}
