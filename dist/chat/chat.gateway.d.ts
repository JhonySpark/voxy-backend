import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service.js';
import { ChannelsService } from '../channels/channels.service.js';
import { JwtService } from '@nestjs/jwt';
export declare class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private chatService;
    private channelsService;
    private jwtService;
    server: Server;
    private connectedUsers;
    constructor(chatService: ChatService, channelsService: ChannelsService, jwtService: JwtService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleMessage(data: {
        receiverId: string;
        content: string;
    }, client: Socket): Promise<{
        sender: {
            id: string;
            username: string;
            email: string;
            password: string;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        content: string;
        receiverId: string;
        senderId: string;
    }>;
    handleJoinChannel(data: {
        channelId: string;
    }, client: Socket): void;
    handleLeaveChannel(data: {
        channelId: string;
    }, client: Socket): void;
    handleChannelMessage(data: {
        channelId: string;
        content: string;
    }, client: Socket): Promise<({
        sender: {
            id: string;
            username: string;
            email: string;
            password: string;
            createdAt: Date;
            updatedAt: Date;
        };
    } & {
        id: string;
        createdAt: Date;
        content: string;
        senderId: string;
        channelId: string;
    }) | {
        error: string;
    }>;
    private voiceStates;
    handleJoinServer(data: {
        serverId: string;
    }, client: Socket): void;
    handleLeaveServer(data: {
        serverId: string;
    }, client: Socket): void;
    handleFriendAction(data: {
        targetId: string;
    }, client: Socket): void;
    handleJoinVoice(data: {
        serverId: string;
        channelId: string;
    }, client: Socket): void;
    handleLeaveVoice(data: {
        serverId: string;
        channelId: string;
    }, client: Socket): void;
    handleWebrtcSignal(data: {
        to: string;
        signal: any;
    }, client: Socket): void;
}
