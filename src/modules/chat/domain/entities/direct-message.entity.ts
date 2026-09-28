import { AggregateRoot } from '../../../../core/domain/aggregate-root.base.js';
import { Result } from '../../../../core/logic/result.js';

export interface DirectMessageProps {
  senderId: string;
  receiverId: string;
  content: string;
  createdAt?: Date;
  sender?: { id: string; username: string };
}

export class DirectMessage extends AggregateRoot<DirectMessageProps> {
  get senderId(): string {
    return this.props.senderId;
  }

  get receiverId(): string {
    return this.props.receiverId;
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

  private constructor(props: DirectMessageProps, id?: string) {
    super(props, id);
  }

  public static create(props: DirectMessageProps, id?: string): Result<DirectMessage> {
    if (!props.senderId || !props.receiverId) {
      return Result.fail<DirectMessage>('SenderId e ReceiverId são obrigatórios.');
    }

    if (!props.content || props.content.trim().length === 0) {
      return Result.fail<DirectMessage>('O conteúdo da mensagem não pode ser vazio.');
    }

    const message = new DirectMessage({
      ...props,
      content: props.content.trim(),
      createdAt: props.createdAt || new Date(),
    }, id);

    return Result.ok<DirectMessage>(message);
  }
}
