import { Request, Response } from 'express';
import { EventEmitter } from 'events';

export interface SSEMessage {
    type: 'message' | 'user-joined' | 'user-left' | 'typing' | 'room-users' | 'error' | 'connection' | 'heartbeat';
    data: any;
    roomId?: string;
    userId?: string;
    timestamp?: Date;
}

interface SSEClient {
    id: string;
    userId: string;
    username: string;
    response: Response;
    roomId?: string;
    lastSeen: Date;
    heartbeatInterval?: NodeJS.Timeout;
}

interface RoomData {
    id: string;
    name: string;
    users: Map<string, { userId: string; username: string; socketId: string; joinedAt: Date }>;
    createdAt: Date;
}

class SSEManager {
    private static instance: SSEManager;
    private clients: Map<string, SSEClient> = new Map();
    private rooms: Map<string, RoomData> = new Map();
    private eventEmitter: EventEmitter = new EventEmitter();
    private cleanupInterval: NodeJS.Timeout;
    private connectionAttempts: Map<string, number> = new Map();

    constructor() {
        this.cleanupInterval = setInterval(() => {
            this.cleanup();
        }, 2 * 60 * 1000);
    }

    static getInstance(): SSEManager {
        if (!SSEManager.instance) {
            SSEManager.instance = new SSEManager();
        }
        return SSEManager.instance;
    }

    addClient(clientId: string, userId: string, username: string, response: Response): void {

        const attempts = this.connectionAttempts.get(userId) || 0;
        if (attempts > 25) {
            response.status(429).json({ error: "Too many connection attempts." });
            return;
        }
        this.connectionAttempts.set(userId, attempts + 1);
        setTimeout(() => this.connectionAttempts.delete(userId), 60000);

        this.removeClientByUserId(userId);

        const client: SSEClient = {
            id: clientId,
            userId,
            username,
            response,
            lastSeen: new Date()
        };

        this.clients.set(clientId, client);

        response.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control',
            'X-Accel-Buffering': 'no' 
        });

        this.sendToClient(clientId, {
            type: 'connection',
            data: {
                message: 'Connected to SSE stream',
                clientId,
                userId,
                username
            },
            timestamp: new Date()
        });

        client.heartbeatInterval = setInterval(() => {
            if (this.clients.has(clientId)) {
                try {
                    client.lastSeen = new Date();
                    response.write(`event: heartbeat\ndata: ${JSON.stringify({ timestamp: new Date() })}\n\n`);
                } catch (error) {
                    console.error('Heartbeat error:', error);
                    this.removeClient(clientId);
                }
            }
        }, 60000); 

        response.on('close', () => {
            console.log(`Client ${clientId} disconnected`);
            this.removeClient(clientId);
        });

        response.on('error', (error) => {
            console.error(`SSE error for client ${clientId}:`, error);
            this.removeClient(clientId);
        });

        console.log(`Client ${clientId} (${username}) connected`);
    }

    private removeClientByUserId(userId: string): void {
        for (const [clientId, client] of this.clients) {
            if (client.userId === userId) {
                this.removeClient(clientId);
                break;
            }
        }
    }

    removeClient(clientId: string): void {
        const client = this.clients.get(clientId);
        if (client) {
            if (client.heartbeatInterval) {
                clearInterval(client.heartbeatInterval);
            }

            if (client.roomId) {
                this.leaveRoom(clientId, client.roomId);
            }

            try {
                if (!client.response.destroyed) {
                    client.response.end();
                }
            } catch (error) {
                console.error('Error closing response:', error);
            }

            this.clients.delete(clientId);
            console.log(`Client ${clientId} removed`);
        }
    }

    joinRoom(clientId: string, roomId: string, roomName: string): boolean {
        const client = this.clients.get(clientId);
        if (!client) {
            console.error(`Client ${clientId} not found when joining room`);
            return false;
        }

        if (client.roomId && client.roomId !== roomId) {
            this.leaveRoom(clientId, client.roomId);
        }

        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, {
                id: roomId,
                name: roomName,
                users: new Map(),
                createdAt: new Date()
            });
        }

        const room = this.rooms.get(roomId)!;

        if (room.users.has(client.userId)) {
            console.log(`User ${client.username} already in room ${roomName}`);
            return true;
        }

        room.users.set(client.userId, {
            userId: client.userId,
            username: client.username,
            socketId: clientId,
            joinedAt: new Date()
        });

        client.roomId = roomId;
        this.clients.set(clientId, client);

        this.broadcastToRoom(roomId, {
            type: 'user-joined',
            data: {
                message: `${client.username} joined the room`,
                username: client.username,
                userId: client.userId,
                roomId: roomId,
                roomName: roomName
            },
            timestamp: new Date()
        }, clientId); 

        this.broadcastRoomUsers(roomId);

        console.log(`User ${client.username} joined room ${roomName}`);
        return true;
    }

    leaveRoom(clientId: string, roomId: string): boolean {
        const client = this.clients.get(clientId);
        const room = this.rooms.get(roomId);

        if (!client || !room) return false;

        const wasInRoom = room.users.delete(client.userId);
        if (!wasInRoom) return false;

        client.roomId = undefined;

        this.broadcastRoomUsers(roomId);

        if (room.users.size === 0) {
            this.rooms.delete(roomId);
            console.log(`Room ${roomId} deleted (empty)`);
        }

        console.log(`User ${client.username} left room ${roomId}`);
        return true;
    }

    sendToClient(clientId: string, message: SSEMessage): boolean {
        const client = this.clients.get(clientId);
        if (!client) return false;

        try {
            const eventData = {
                ...message,
                timestamp: message.timestamp || new Date()
            };

            const data = `event: ${message.type}\ndata: ${JSON.stringify(eventData)}\n\n`;
            client.response.write(data);
            client.lastSeen = new Date();
            return true;
        } catch (error) {
            console.error('Error sending to client:', error);
            this.removeClient(clientId);
            return false;
        }
    }

    broadcastToRoom(roomId: string, message: SSEMessage, excludeClientId?: string): number {
        const room = this.rooms.get(roomId);
        if (!room) return 0;

        let sentCount = 0;
        room.users.forEach((user) => {
            if (excludeClientId && user.socketId === excludeClientId) return;
            if (this.sendToClient(user.socketId, message)) {
                sentCount++;
            }
        });

        return sentCount;
    }

    broadcastRoomUsers(roomId: string): void {
        const room = this.rooms.get(roomId);
        if (!room) return;

        const users = Array.from(room.users.values()).map(user => ({
            userId: user.userId,
            username: user.username,
            joinedAt: user.joinedAt
        }));

        this.broadcastToRoom(roomId, {
            type: 'room-users',
            data: {
                roomId,
                users,
                userCount: users.length
            },
            timestamp: new Date()
        });
    }

    sendTyping(clientId: string, roomId: string, isTyping: boolean): boolean {
        const client = this.clients.get(clientId);
        if (!client || client.roomId !== roomId) return false;

        const sentCount = this.broadcastToRoom(roomId, {
            type: 'typing',
            data: {
                username: client.username,
                userId: client.userId,
                roomId,
                isTyping
            },
            timestamp: new Date()
        }, clientId); 

        return sentCount > 0;
    }

    sendMessageToRoom(roomId: string, messageData: any): number {
        return this.broadcastToRoom(roomId, {
            type: 'message',
            data: messageData,
            timestamp: new Date()
        });
    }

    getRoomInfo(roomId: string) {
        const room = this.rooms.get(roomId);
        if (!room) return null;

        return {
            id: room.id,
            name: room.name,
            users: Array.from(room.users.values()).map(user => ({
                userId: user.userId,
                username: user.username,
                joinedAt: user.joinedAt
            })),
            userCount: room.users.size,
            createdAt: room.createdAt
        };
    }

    getAllRooms() {
        return Array.from(this.rooms.values()).map(room => ({
            id: room.id,
            name: room.name,
            userCount: room.users.size,
            users: Array.from(room.users.values()).map(user => ({
                userId: user.userId,
                username: user.username,
                joinedAt: user.joinedAt
            })),
            createdAt: room.createdAt
        }));
    }

    getClientInfo(clientId: string) {
        return this.clients.get(clientId);
    }

    getAllClients() {
        return Array.from(this.clients.values()).map(client => ({
            id: client.id,
            userId: client.userId,
            username: client.username,
            roomId: client.roomId,
            lastSeen: client.lastSeen
        }));
    }

    getStats() {
        return {
            totalClients: this.clients.size,
            totalRooms: this.rooms.size,
            clientsPerRoom: Array.from(this.rooms.values()).map(room => ({
                roomId: room.id,
                roomName: room.name,
                userCount: room.users.size
            }))
        };
    }

    cleanup(): void {
        const now = new Date();
        const timeout = 10 * 60 * 1000; 

        const clientsToRemove: string[] = [];

        this.clients.forEach((client, clientId) => {
            if (now.getTime() - client.lastSeen.getTime() > timeout) {
                clientsToRemove.push(clientId);
            }
        });

        clientsToRemove.forEach(clientId => {
            console.log(`Cleaning up inactive client: ${clientId}`);
            this.removeClient(clientId);
        });

        if (clientsToRemove.length > 0) {
            console.log(`Cleaned up ${clientsToRemove.length} inactive connections`);
        }
    }

    shutdown(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }

        this.clients.forEach((client, clientId) => {
            this.removeClient(clientId);
        });

        console.log('SSE Manager shutdown complete');
    }
}

export class SSEController {

    private sseManager: SSEManager;

    constructor() {
        this.sseManager = SSEManager.getInstance();
    }

    connect = (req: Request, res: Response): void => {
        console.log('GET /api/connect');
        const { userId, username } = req.query;
        console.log(`SSE connection request from userId: ${userId}, username: ${username}`);

        if (!userId || !username) {
            res.status(400).json({
                success: false,
                message: 'userId and username are required'
            });
        }

        const clientId = `${userId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

        try {
            this.sseManager.addClient(
                clientId,
                userId as string,
                username as string,
                res
            );
        } catch (error) {
            console.error('Error connecting SSE client:', error);
            res.status(500).json({
                success: false,
                message: 'Failed to establish SSE connection'
            });
        }
    }

    joinRoom = (req: Request, res: Response): void => {
        try {
            const { userId, roomId, roomName } = req.body;

            if (!userId || !roomId || !roomName) {
                res.status(400).json({
                    success: false,
                    message: 'userId, roomId, and roomName are required'
                });
            }

            const client = Array.from(this.sseManager.getAllClients()).find(c => c.userId === userId);
            if (!client) {
                res.status(404).json({
                    success: false,
                    message: 'Client not connected'
                });
                return;
            }

            const success = this.sseManager.joinRoom(client.id, roomId, roomName);

            if (success) {
                res.json({
                    success: true,
                    message: 'Successfully joined room',
                    data: {
                        clientId: client.id,
                        roomId,
                        roomName
                    }
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to join room'
                });
            }
        } catch (error) {
            console.error('Error joining room:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    leaveRoom = (req: Request, res: Response): void => {
        try {
            const { userId, roomId } = req.body;

            if (!userId || !roomId) {
                res.status(400).json({
                    success: false,
                    message: 'userId and roomId are required'
                });
            }

            const client = Array.from(this.sseManager.getAllClients()).find(c => c.userId === userId);
            if (!client) {
                res.status(404).json({
                    success: false,
                    message: 'Client not connected'
                });
                return;
            }

            const success = this.sseManager.leaveRoom(client.id, roomId);

            if (success) {
                res.json({
                    success: true,
                    message: 'Successfully left room'
                });
            } else {
                res.status(500).json({
                    success: false,
                    message: 'Failed to leave room'
                });
            }
        } catch (error) {
            console.error('Error leaving room:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    sendTyping = (req: Request, res: Response): void => {
        try {
            const { userId, roomId, isTyping } = req.body;

            if (!userId || !roomId || typeof isTyping !== 'boolean') {
                res.status(400).json({
                    success: false,
                    message: 'userId, roomId, and isTyping are required'
                });
            }

            const client = Array.from(this.sseManager.getAllClients()).find(c => c.userId === userId);
            if (!client) {
                res.status(404).json({
                    success: false,
                    message: 'Client not connected'
                });
                return;
            }

            const success = this.sseManager.sendTyping(client.id, roomId, isTyping);

            res.json({
                success: true,
                message: 'Typing indicator sent',
                sent: success
            });
        } catch (error) {
            console.error('Error sending typing indicator:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    sendMessageToRoom = (roomId: string, messageData: any): number => {
        return this.sseManager.sendMessageToRoom(roomId, messageData);
    }

    getRoomInfo = (req: Request, res: Response): void => {
        try {
            const { roomId } = req.params;
            const roomInfo = this.sseManager.getRoomInfo(roomId);

            if (!roomInfo) {
                res.status(404).json({
                    success: false,
                    message: 'Room not found'
                });
                return;
            }

            res.json({
                success: true,
                data: roomInfo
            });
        } catch (error) {
            console.error('Error getting room info:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    getAllRooms = async (req: Request, res: Response) => {
        try {
            const rooms = this.sseManager.getAllRooms();
            res.json({
                success: true,
                data: rooms
            });
        } catch (error) {
            console.error('Error getting all rooms:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    getStats = async (req: Request, res: Response) => {
        try {
            const stats = this.sseManager.getStats();
            res.json({
                success: true,
                data: stats
            });
        } catch (error) {
            console.error('Error getting stats:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    getClients = async (req: Request, res: Response) => {
        try {
            const clients = this.sseManager.getAllClients();
            res.json({
                success: true,
                data: clients
            });
        } catch (error) {
            console.error('Error getting clients:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}

export default SSEController;