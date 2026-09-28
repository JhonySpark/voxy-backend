import { AggregateRoot } from '../../../../core/domain/aggregate-root.base.js';
import { Result } from '../../../../core/logic/result.js';

export interface ChannelMessageProps {
  channelId: string;
  senderId: string;
  content: string;
  createdAt?: Date;
  sender?: { id: string; username: string };
}

export class ChannelMessage extends AggregateRoot<ChannelMessageProps> {
  get channelId(): string {
    return this.props.channelId;
  }

  get senderId(): string {
    return this.props.senderId;
  }

  get content(): string {
    return this.props.content;
  }

  get createdAt(): Date {
    return this.props.createdAt || new Date();
  }

  get sender(): { id: string; username: string } | undefined {
    return this.props.sender;
  }

  private constructor(props: ChannelMessageProps, id?: string) {
    super(props, id);
  }

  public static create(props: ChannelMessageProps, id?: string): Result<ChannelMessage> {
    if (!props.channelId || !props.senderId) {
      return Result.fail<ChannelMessage>('ChannelId e SenderId são obrigatórios.');
    }

    if (!props.content || props.content.trim().length === 0) {
      return Result.fail<ChannelMessage>('O conteúdo da mensagem não pode ser vazio.');
    }

    const message = new ChannelMessage({
      ...props,
      content: props.content.trim(),
      createdAt: props.createdAt || new Date(),
    }, id);

    return Result.ok<ChannelMessage>(message);
  }
}
