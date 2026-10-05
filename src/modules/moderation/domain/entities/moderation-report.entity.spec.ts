import { describe, it, expect } from 'vitest';
import { ModerationReport } from './moderation-report.entity.js';
import {
  ReportTargetTypeEnum,
  ReportReasonEnum,
  ReportStatusEnum,
} from '../../../../core/enums/index.js';

describe('ModerationReport Entity', () => {
  it('should successfully create a valid report for user', () => {
    const reportOrError = ModerationReport.create({
      reporterId: 'user-1',
      targetType: ReportTargetTypeEnum.USER,
      targetUserId: 'user-2',
      reason: ReportReasonEnum.CHILD_SAFETY_EXPLOITATION,
      description: 'Usuário enviando mensagens suspeitas para menores de idade.',
    });

    expect(reportOrError.isSuccess).toBe(true);
    const report = reportOrError.getValue();
    expect(report.reporterId).toBe('user-1');
    expect(report.targetType).toBe(ReportTargetTypeEnum.USER);
    expect(report.targetUserId).toBe('user-2');
    expect(report.status).toBe(ReportStatusEnum.PENDING);
    expect(report.isChildSafety()).toBe(true);
  });

  it('should fail if description is too short', () => {
    const reportOrError = ModerationReport.create({
      reporterId: 'user-1',
      targetType: ReportTargetTypeEnum.SERVER,
      targetServerId: 'server-1',
      reason: ReportReasonEnum.HARASSMENT_BULLYING,
      description: 'bad',
    });

    expect(reportOrError.isFailure).toBe(true);
    expect(reportOrError.error).toContain('pelo menos 5 caracteres');
  });

  it('should resolve report with moderator notes', () => {
    const report = ModerationReport.create({
      reporterId: 'user-1',
      targetType: ReportTargetTypeEnum.SERVER,
      targetServerId: 'server-1',
      reason: ReportReasonEnum.CHILD_SAFETY_EXPLOITATION,
      description: 'Servidor permitindo conteúdo impróprio para crianças.',
    }).getValue();

    const resolveRes = report.resolve('mod-admin', 'Servidor suspenso preventivamente e membros notificados.');
    expect(resolveRes.isSuccess).toBe(true);
    expect(report.status).toBe(ReportStatusEnum.RESOLVED);
    expect(report.resolvedBy).toBe('mod-admin');
    expect(report.resolutionNotes).toBe('Servidor suspenso preventivamente e membros notificados.');
  });
});
