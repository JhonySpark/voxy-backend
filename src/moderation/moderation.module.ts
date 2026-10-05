import { Module } from '@nestjs/common';
import { ModerationService } from './moderation.service.js';
import { ModerationController } from './moderation.controller.js';
import { MODERATION_REPOSITORY } from '../core/ports/repositories/moderation.repository.port.js';
import { PrismaModerationRepository } from '../infrastructure/adapters/repositories/prisma-moderation.repository.js';
import { SECURITY_AUDIT_LOG_REPOSITORY } from '../core/ports/repositories/security-audit-log.repository.port.js';
import { PrismaSecurityAuditLogRepository } from '../infrastructure/adapters/repositories/prisma-security-audit-log.repository.js';
import { SecurityAuditService } from './security-audit.service.js';
import { LoggingModule } from '../infrastructure/logging/logging.module.js';

@Module({
  imports: [LoggingModule],
  providers: [
    ModerationService,
    SecurityAuditService,
    {
      provide: MODERATION_REPOSITORY,
      useClass: PrismaModerationRepository,
    },
    {
      provide: SECURITY_AUDIT_LOG_REPOSITORY,
      useClass: PrismaSecurityAuditLogRepository,
    },
  ],
  controllers: [ModerationController],
  exports: [
    ModerationService,
    SecurityAuditService,
    MODERATION_REPOSITORY,
    SECURITY_AUDIT_LOG_REPOSITORY,
  ],
})
export class ModerationModule {}
