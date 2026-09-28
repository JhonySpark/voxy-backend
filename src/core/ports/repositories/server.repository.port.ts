import { Server } from '../../../modules/servers/domain/entities/server.entity.js';

export interface IServerRepository {
  create(server: Server): Promise<Server>;
  findUserServers(userId: string): Promise<Server[]>;
  findById(id: string): Promise<Server | null>;
  isMember(serverId: string, userId: string): Promise<boolean>;
  getMemberRole(serverId: string, userId: string): Promise<string | null>;
  addMember(serverId: string, userId: string, role?: string): Promise<void>;
}

export const SERVER_REPOSITORY = Symbol('SERVER_REPOSITORY');
