import type { SecurityAuditLog } from '../../../modules/moderation/domain/entities/security-audit-log.entity.js';
import type { AuditLogActionEnum } from '../../enums/index.js';

export interface AuditLogFilter {
  serverId?: string;
  actorId?: string;
  targetId?: string;
  action?: AuditLogActionEnum;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
}

export interface SecurityAuditLogWithActor {
  id: string;
  action: AuditLogActionEnum;
  actorId: string;
  actor?: {
    id: string;
    username: string;
    displayName?: string | null;
    avatarUrl?: string | null;
  };
  targetType: string;
  targetId?: string | null;
  targetUser?: {
    id: string;
    username: string;
    displayName?: string | null;
  } | null;
  serverId?: string | null;
  serverName?: string | null;
  reason?: string | null;
  metadata?: Record<string, any> | null;
  ipAddress?: string | null;
  userAgent?: string | null;
  createdAt: Date;
}

export interface ISecurityAuditLogRepository {
  save(auditLog: SecurityAuditLog): Promise<SecurityAuditLog>;
  findWithDetails(filter: AuditLogFilter): Promise<{ logs: SecurityAuditLogWithActor[]; total: number }>;
}

export const SECURITY_AUDIT_LOG_REPOSITORY = Symbol('SECURITY_AUDIT_LOG_REPOSITORY');
