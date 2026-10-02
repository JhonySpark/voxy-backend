import { Server } from '../../../modules/servers/domain/entities/server.entity.js';

export interface IServerRepository {
  create(server: Server): Promise<Server>;
  update(server: Server): Promise<Server>;
  findUserServers(userId: string): Promise<Server[]>;
  findById(id: string): Promise<Server | null>;
  isMember(serverId: string, userId: string): Promise<boolean>;
  getMemberRole(serverId: string, userId: string): Promise<string | null>;
  addMember(serverId: string, userId: string, role?: string): Promise<void>;
  removeMember(serverId: string, userId: string): Promise<void>;
  updateMemberRole(serverId: string, userId: string, role: string): Promise<void>;
  softDelete(serverId: string): Promise<void>;
  isBanned(serverId: string, userId: string): Promise<boolean>;
  banMember(serverId: string, userId: string, reason?: string): Promise<void>;
  unbanMember(serverId: string, userId: string): Promise<void>;
  getServerBans(serverId: string): Promise<any[]>;
  getServerMembers(serverId: string): Promise<any[]>;
  getRolePermissions(serverId: string): Promise<any[]>;
  upsertRolePermissions(serverId: string, role: string, permissions: any): Promise<any>;
}

export const SERVER_REPOSITORY = Symbol('SERVER_REPOSITORY');
