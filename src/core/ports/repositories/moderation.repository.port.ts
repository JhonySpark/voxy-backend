import { ModerationReport } from '../../../modules/moderation/domain/entities/moderation-report.entity.js';

export const MODERATION_REPOSITORY = Symbol('MODERATION_REPOSITORY');

export interface ModerationReportFilter {
  status?: string;
  targetType?: string;
  targetUserId?: string;
  targetServerId?: string;
}

export interface IModerationRepository {
  create(report: ModerationReport): Promise<ModerationReport>;
  findById(id: string): Promise<ModerationReport | null>;
  findAll(filter?: ModerationReportFilter): Promise<any[]>;
  update(report: ModerationReport): Promise<ModerationReport>;
  countPending(): Promise<number>;
}
