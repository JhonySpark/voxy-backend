import { Entity } from '../../../../core/domain/entity.base.js';
import { Result } from '../../../../core/logic/result.js';
import { ChannelType } from '../value-objects/channel-type.vo.js';

export interface ChannelProps {
  name: string;
  type: ChannelType;
  serverId: string;
  createdAt?: Date;
}

export class Channel extends Entity<ChannelProps> {
  get name(): string {
    return this.props.name;
  }

  get type(): ChannelType {
    return this.props.type;
  }

  get serverId(): string {
    return this.props.serverId;
  }

  get createdAt(): Date {
    return this.props.createdAt || new Date();
  }

  private constructor(props: ChannelProps, id?: string) {
    super(props, id);
  }

  public static create(props: ChannelProps, id?: string): Result<Channel> {
    if (!props.name || props.name.trim().length === 0) {
      return Result.fail<Channel>('Nome do canal não pode ser vazio.');
    }

    if (!props.serverId) {
      return Result.fail<Channel>('O ID do servidor é obrigatório.');
    }

    const channel = new Channel({
      ...props,
      name: props.name.trim(),
      createdAt: props.createdAt || new Date(),
    }, id);

    return Result.ok<Channel>(channel);
  }
}
