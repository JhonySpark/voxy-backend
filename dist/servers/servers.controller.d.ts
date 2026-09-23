import { ServersService } from './servers.service.js';
export declare class ServersController {
    private readonly serversService;
    constructor(serversService: ServersService);
    createServer(req: any, name: string): Promise<{
        channels: {
            id: string;
            createdAt: Date;
            name: string;
            serverId: string;
            type: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        ownerId: string;
    }>;
    getUserServers(req: any): Promise<({
        channels: {
            id: string;
            createdAt: Date;
            name: string;
            serverId: string;
            type: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        ownerId: string;
    })[]>;
    getServerById(req: any, id: string): Promise<({
        members: ({
            user: {
                id: string;
                username: string;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            role: string;
            serverId: string;
        })[];
        channels: {
            id: string;
            createdAt: Date;
            name: string;
            serverId: string;
            type: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        ownerId: string;
    }) | null>;
    joinServer(req: any, inviteCode: string): Promise<({
        members: ({
            user: {
                id: string;
                username: string;
            };
        } & {
            id: string;
            createdAt: Date;
            userId: string;
            role: string;
            serverId: string;
        })[];
        channels: {
            id: string;
            createdAt: Date;
            name: string;
            serverId: string;
            type: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        name: string;
        ownerId: string;
    }) | null>;
}
