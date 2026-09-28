import { ValueObject } from '../../../../core/domain/value-object.base.js';
import { Result } from '../../../../core/logic/result.js';

export type ChannelTypeValue = 'TEXT' | 'VOICE';

interface ChannelTypeProps {
  value: ChannelTypeValue;
}

export class ChannelType extends ValueObject<ChannelTypeProps> {
  get value(): ChannelTypeValue {
    return this.props.value;
  }

  public isVoice(): boolean {
    return this.props.value === 'VOICE';
  }

  public isText(): boolean {
    return this.props.value === 'TEXT';
  }

  private constructor(props: ChannelTypeProps) {
    super(props);
  }

  public static create(type: string = 'TEXT'): Result<ChannelType> {
    const normalized = type?.toUpperCase();
    if (normalized !== 'TEXT' && normalized !== 'VOICE') {
      return Result.fail<ChannelType>('Tipo de canal inválido. Deve ser TEXT ou VOICE.');
    }

    return Result.ok<ChannelType>(new ChannelType({ value: normalized as ChannelTypeValue }));
  }

  public static text(): ChannelType {
    return new ChannelType({ value: 'TEXT' });
  }

  public static voice(): ChannelType {
    return new ChannelType({ value: 'VOICE' });
  }
}
