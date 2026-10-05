import { AggregateRoot } from '../../../../core/domain/aggregate-root.base.js';
import { Result } from '../../../../core/logic/result.js';
import {
  ReportTargetTypeEnum,
  ReportReasonEnum,
  ReportStatusEnum,
} from '../../../../core/enums/index.js';

export interface ModerationReportProps {
  reporterId: string;
  targetType: ReportTargetTypeEnum;
  targetUserId?: string | null;
  targetServerId?: string | null;
  targetChannelId?: string | null;
  reason: ReportReasonEnum;
  description: string;
  status?: ReportStatusEnum;
  resolutionNotes?: string | null;
  resolvedBy?: string | null;
  resolvedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

export class ModerationReport extends AggregateRoot<ModerationReportProps> {
  get reporterId(): string {
    return this.props.reporterId;
  }

  get targetType(): ReportTargetTypeEnum {
    return this.props.targetType;
  }

  get targetUserId(): string | null | undefined {
    return this.props.targetUserId;
  }

  get targetServerId(): string | null | undefined {
    return this.props.targetServerId;
  }

  get targetChannelId(): string | null | undefined {
    return this.props.targetChannelId;
  }

  get reason(): ReportReasonEnum {
    return this.props.reason;
  }

  get description(): string {
    return this.props.description;
  }

  get status(): ReportStatusEnum {
    return this.props.status || ReportStatusEnum.PENDING;
  }

  get resolutionNotes(): string | null | undefined {
    return this.props.resolutionNotes;
  }

  get resolvedBy(): string | null | undefined {
    return this.props.resolvedBy;
  }

  get resolvedAt(): Date | null | undefined {
    return this.props.resolvedAt;
  }

  get createdAt(): Date {
    return this.props.createdAt || new Date();
  }

  get updatedAt(): Date {
    return this.props.updatedAt || new Date();
  }

  public isChildSafety(): boolean {
    return this.props.reason === ReportReasonEnum.CHILD_SAFETY_EXPLOITATION;
  }

  public resolve(resolvedBy: string, notes?: string): Result<void> {
    if (!resolvedBy) {
      return Result.fail<void>('Identificador do moderador é obrigatório para resolver a denúncia.');
    }
    this.props.status = ReportStatusEnum.RESOLVED;
    this.props.resolvedBy = resolvedBy;
    this.props.resolutionNotes = notes?.trim() || null;
    this.props.resolvedAt = new Date();
    this.props.updatedAt = new Date();
    return Result.ok<void>();
  }

  public dismiss(resolvedBy: string, notes?: string): Result<void> {
    if (!resolvedBy) {
      return Result.fail<void>('Identificador do moderador é obrigatório para arquivar a denúncia.');
    }
    this.props.status = ReportStatusEnum.DISMISSED;
    this.props.resolvedBy = resolvedBy;
    this.props.resolutionNotes = notes?.trim() || null;
    this.props.resolvedAt = new Date();
    this.props.updatedAt = new Date();
    return Result.ok<void>();
  }

  public setInvestigating(): Result<void> {
    this.props.status = ReportStatusEnum.INVESTIGATING;
    this.props.updatedAt = new Date();
    return Result.ok<void>();
  }

  private constructor(props: ModerationReportProps, id?: string) {
    super(props, id);
  }

  public static create(
    props: ModerationReportProps,
    id?: string,
  ): Result<ModerationReport> {
    if (!props.reporterId) {
      return Result.fail<ModerationReport>('O identificador do denunciante é obrigatório.');
    }

    if (!props.reason) {
      return Result.fail<ModerationReport>('O motivo da denúncia é obrigatório.');
    }

    if (!props.description || props.description.trim().length < 5) {
      return Result.fail<ModerationReport>('A descrição da denúncia deve conter pelo menos 5 caracteres.');
    }

    if (props.targetType === ReportTargetTypeEnum.USER && !props.targetUserId) {
      return Result.fail<ModerationReport>('Para denúncia de usuário, o targetUserId é obrigatório.');
    }

    if (props.targetType === ReportTargetTypeEnum.SERVER && !props.targetServerId) {
      return Result.fail<ModerationReport>('Para denúncia de servidor, o targetServerId é obrigatório.');
    }

    if (props.targetType === ReportTargetTypeEnum.STREAM && (!props.targetUserId && !props.targetChannelId)) {
      return Result.fail<ModerationReport>('Para denúncia de transmissão, o participante ou canal é obrigatório.');
    }

    const report = new ModerationReport(
      {
        ...props,
        description: props.description.trim(),
        status: props.status || ReportStatusEnum.PENDING,
        createdAt: props.createdAt || new Date(),
        updatedAt: props.updatedAt || new Date(),
      },
      id,
    );

    return Result.ok<ModerationReport>(report);
  }
}
