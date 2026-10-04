import { ValueObject } from '../../../../core/domain/value-object.base.js';
import { Result } from '../../../../core/logic/result.js';
import { ChannelTypeEnum } from '../../../../core/enums/index.js';

export type ChannelTypeValue = ChannelTypeEnum;

interface ChannelTypeProps {
  value: ChannelTypeEnum;
}

export class ChannelType extends ValueObject<ChannelTypeProps> {
  get value(): ChannelTypeEnum {
    return this.props.value;
  }

  public isVoice(): boolean {
    return this.props.value === ChannelTypeEnum.VOICE;
  }

  public isText(): boolean {
    return this.props.value === ChannelTypeEnum.TEXT;
  }

  private constructor(props: ChannelTypeProps) {
    super(props);
  }

  public static create(type: string = ChannelTypeEnum.TEXT): Result<ChannelType> {
    const normalized = type?.toUpperCase();
    const validTypes = Object.values(ChannelTypeEnum);
    if (!validTypes.includes(normalized as ChannelTypeEnum)) {
      return Result.fail<ChannelType>('Tipo de canal inválido. Deve ser TEXT ou VOICE.');
    }

    return Result.ok<ChannelType>(new ChannelType({ value: normalized as ChannelTypeEnum }));
  }

  public static text(): ChannelType {
    return new ChannelType({ value: ChannelTypeEnum.TEXT });
  }

  public static voice(): ChannelType {
    return new ChannelType({ value: ChannelTypeEnum.VOICE });
  }
}
