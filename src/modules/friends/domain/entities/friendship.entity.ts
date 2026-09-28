import { AggregateRoot } from '../../../../core/domain/aggregate-root.base.js';
import { Result } from '../../../../core/logic/result.js';

export type FriendshipStatusType = 'PENDING' | 'ACCEPTED';

export interface FriendshipProps {
  userId: string;
  friendId: string;
  status: FriendshipStatusType;
  createdAt?: Date;
}

export class Friendship extends AggregateRoot<FriendshipProps> {
  get userId(): string {
    return this.props.userId;
  }

  get friendId(): string {
    return this.props.friendId;
  }

  get status(): FriendshipStatusType {
    return this.props.status;
  }

  get createdAt(): Date {
    return this.props.createdAt || new Date();
  }

  public isPending(): boolean {
    return this.props.status === 'PENDING';
  }

  public isAccepted(): boolean {
    return this.props.status === 'ACCEPTED';
  }

  public accept(): Result<void> {
    if (this.props.status === 'ACCEPTED') {
      return Result.fail<void>('Esta amizade já foi aceita.');
    }
    this.props.status = 'ACCEPTED';
    return Result.ok<void>();
  }

  private constructor(props: FriendshipProps, id?: string) {
    super(props, id);
  }

  public static create(props: FriendshipProps, id?: string): Result<Friendship> {
    if (!props.userId || !props.friendId) {
      return Result.fail<Friendship>('UserId e FriendId são obrigatórios.');
    }

    if (props.userId === props.friendId) {
      return Result.fail<Friendship>('Não é possível adicionar a si mesmo como amigo.');
    }

    const friendship = new Friendship({
      ...props,
      status: props.status || 'PENDING',
      createdAt: props.createdAt || new Date(),
    }, id);

    return Result.ok<Friendship>(friendship);
  }
}
