import { UserRole, ReportStatus, ReportTargetType, ReportReason } from '@prisma/client';

export class UpdateUserDto {
  role?: UserRole;
  isSuspended?: boolean;
  suspendedReason?: string | null;
}

export class UpdateSystemConfigDto {
  allowRegistrations?: boolean;
  maxBetaUsers?: number;
  allowScreenShare?: boolean;
  maxVoiceParticipantsPerRoom?: number;
  maxScreenShareBitrateKbps?: number;
  maintenanceNotice?: string | null;
}

export class AdminResolveReportDto {
  status: ReportStatus; // RESOLVED | DISMISSED
  resolutionNotes?: string;
  suspendTarget?: boolean;
  suspensionReason?: string;
}

export class QueryUsersDto {
  search?: string;
  role?: UserRole;
  isSuspended?: string; // 'true' | 'false'
  isOnline?: string;    // 'true' | 'false'
  page?: string;
  limit?: string;
}

export class QueryReportsDto {
  status?: ReportStatus;
  targetType?: ReportTargetType;
  reason?: ReportReason;
  page?: string;
  limit?: string;
}
