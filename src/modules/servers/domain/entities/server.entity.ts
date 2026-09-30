import { AggregateRoot } from '../../../../core/domain/aggregate-root.base.js';
import { Result } from '../../../../core/logic/result.js';
import { ServerMember } from './server-member.entity.js';
import { Channel } from './channel.entity.js';
import { ServerRole } from '../value-objects/server-role.vo.js';
import { ChannelType } from '../value-objects/channel-type.vo.js';

export interface ServerProps {
  name: string;
  ownerId: string;
  iconUrl?: string | null;
  iconKey?: string | null;
  createdAt?: Date;
  updatedAt?: Date;
  members: ServerMember[];
  channels: Channel[];
}

export class Server extends AggregateRoot<ServerProps> {
  get name(): string {
    return this.props.name;
  }

  get ownerId(): string {
    return this.props.ownerId;
  }

  get iconUrl(): string | null | undefined {
    return this.props.iconUrl;
  }

  get iconKey(): string | null | undefined {
    return this.props.iconKey;
  }

  get members(): ServerMember[] {
    return this.props.members;
  }

  get channels(): Channel[] {
    return this.props.channels;
  }

  get createdAt(): Date {
    return this.props.createdAt || new Date();
  }

  get updatedAt(): Date {
    return this.props.updatedAt || new Date();
  }

  private constructor(props: ServerProps, id?: string) {
    super(props, id);
  }

  public isMember(userId: string): boolean {
    return this.props.members.some(m => m.userId === userId);
  }

  public isOwner(userId: string): boolean {
    return this.props.ownerId === userId;
  }

  public getMember(userId: string): ServerMember | undefined {
    return this.props.members.find(m => m.userId === userId);
  }

  public addMember(userId: string, role: ServerRole = ServerRole.member()): Result<ServerMember> {
    if (this.isMember(userId)) {
      return Result.fail<ServerMember>('Usuário já é membro deste servidor.');
    }

    const memberOrError = ServerMember.create({
      serverId: this.id,
      userId,
      role,
    });

    if (memberOrError.isFailure) {
      return Result.fail<ServerMember>(memberOrError.error!);
    }

    const member = memberOrError.getValue();
    this.props.members.push(member);
    this.props.updatedAt = new Date();
    return Result.ok<ServerMember>(member);
  }

  public createChannel(name: string, type: ChannelType, requesterUserId: string): Result<Channel> {
    const member = this.getMember(requesterUserId);
    if (!member || !member.isOwner()) {
      return Result.fail<Channel>('Apenas o dono do servidor pode criar canais.');
    }

    const channelOrError = Channel.create({
      name,
      type,
      serverId: this.id,
    });

    if (channelOrError.isFailure) {
      return Result.fail<Channel>(channelOrError.error!);
    }

    const channel = channelOrError.getValue();
    this.props.channels.push(channel);
    this.props.updatedAt = new Date();
    return Result.ok<Channel>(channel);
  }

  public updateName(newName: string, requesterUserId: string): Result<void> {
    if (!this.isOwner(requesterUserId)) {
      return Result.fail<void>('Apenas o dono do servidor pode alterar o nome.');
    }
    if (!newName || newName.trim().length === 0) {
      return Result.fail<void>('Nome do servidor não pode ser vazio.');
    }
    this.props.name = newName.trim();
    this.props.updatedAt = new Date();
    return Result.ok<void>();
  }

  public updateIcon(iconUrl: string, iconKey: string, requesterUserId: string): Result<void> {
    if (!this.isOwner(requesterUserId)) {
      return Result.fail<void>('Apenas o dono do servidor pode alterar o ícone.');
    }
    if (!iconUrl || !iconKey) {
      return Result.fail<void>('Icon URL e Key são obrigatórios.');
    }
    this.props.iconUrl = iconUrl;
    this.props.iconKey = iconKey;
    this.props.updatedAt = new Date();
    return Result.ok<void>();
  }

  public removeIcon(requesterUserId: string): Result<void> {
    if (!this.isOwner(requesterUserId)) {
      return Result.fail<void>('Apenas o dono do servidor pode remover o ícone.');
    }
    this.props.iconUrl = null;
    this.props.iconKey = null;
    this.props.updatedAt = new Date();
    return Result.ok<void>();
  }

  public static create(
    name: string,
    ownerId: string,
    id?: string,
    existingMembers?: ServerMember[],
    existingChannels?: Channel[],
    iconUrl?: string | null,
    iconKey?: string | null
  ): Result<Server> {
    if (!name || name.trim().length === 0) {
      return Result.fail<Server>('Nome do servidor não pode ser vazio.');
    }

    if (!ownerId) {
      return Result.fail<Server>('OwnerId é obrigatório para criar um servidor.');
    }

    const serverId = id || crypto.randomUUID();

    // Se é criação nova, inicializa membro OWNER e canais padrão
    let members = existingMembers || [];
    let channels = existingChannels || [];

    if (!existingMembers || existingMembers.length === 0) {
      const ownerMember = ServerMember.create({
        serverId,
        userId: ownerId,
        role: ServerRole.owner(),
      }).getValue();
      members = [ownerMember];
    }

    if (!existingChannels || existingChannels.length === 0) {
      const defaultText = Channel.create({
        name: 'geral',
        type: ChannelType.text(),
        serverId,
      }).getValue();

      const defaultVoice = Channel.create({
        name: 'Voz Geral',
        type: ChannelType.voice(),
        serverId,
      }).getValue();

      channels = [defaultText, defaultVoice];
    }

    const server = new Server(
      {
        name: name.trim(),
        ownerId,
        iconUrl: iconUrl || null,
        iconKey: iconKey || null,
        members,
        channels,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      serverId
    );

    return Result.ok<Server>(server);
  }
}
