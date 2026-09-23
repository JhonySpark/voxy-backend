import { PrismaService } from '../prisma/prisma.service.js';
export declare class ServersService {
    private prisma;
    constructor(prisma: PrismaService);
    createServer(ownerId: string, name: string): Promise<{
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
    getUserServers(userId: string): Promise<({
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
    getServerById(serverId: string, userId: string): Promise<({
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
    joinServer(serverId: string, userId: string): Promise<({
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
