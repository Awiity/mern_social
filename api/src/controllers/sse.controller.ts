import { Request, Response } from 'express';
import { EventEmitter } from 'events';

// SSE Event types
export interface SSEMessage {
    type: 'message' | 'user-joined' | 'user-left' | 'typing' | 'room-users' | 'error' | 'connection' | 'heartbeat';
    data: any;
    roomId?: string;
    userId?: string;
    timestamp?: Date;
}

// Client connection interface
interface SSEClient {
    id: string;
    userId: string;
    username: string;
    response: Response;
    roomId?: string;
    lastSeen: Date;
    heartbeatInterval?: NodeJS.Timeout;
}

// Room management
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

    constructor() {
        // Cleanup inactive connections every 2 minutes
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

    // Add client connection
    addClient(clientId: string, userId: string, username: string, response: Response): void {
        // Remove existing client with same userId to prevent duplicates

        const client: SSEClient = {
            id: clientId,
            userId,
            username,
            response,
            lastSeen: new Date()
        };

        this.clients.set(clientId, client);

        // Setup SSE headers
        response.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            'Connection': 'keep-alive',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Cache-Control',
            'X-Accel-Buffering': 'no' // Disable nginx buffering
        });

        // Send initial connection message
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

        // Setup heartbeat
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
        }, 30000); // Send heartbeat every 30 seconds

        // Handle client disconnect
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

    // Remove client by userId (for preventing duplicates)
    private removeClientByUserId(userId: string): void {
        for (const [clientId, client] of this.clients) {
            if (client.userId === userId) {
                this.removeClient(clientId);
                break;
            }
        }
    }

    // Remove client connection
    removeClient(clientId: string): void {
        const client = this.clients.get(clientId);
        if (client) {
            // Clear heartbeat
            if (client.heartbeatInterval) {
                clearInterval(client.heartbeatInterval);
            }

            // Leave room if user was in one
            if (client.roomId) {
                this.leaveRoom(clientId, client.roomId);
            }

            // Close response if still open
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

    // Join room
    joinRoom(clientId: string, roomId: string, roomName: string): boolean {
        const client = this.clients.get(clientId);
        if (!client) {
            console.error(`Client ${clientId} not found when joining room`);
            return false;
        }

        // Leave current room if any
        if (client.roomId && client.roomId !== roomId) {
            this.leaveRoom(clientId, client.roomId);
        }

        // Create room if it doesn't exist
        if (!this.rooms.has(roomId)) {
            this.rooms.set(roomId, {
                id: roomId,
                name: roomName,
                users: new Map(),
                createdAt: new Date()
            });
        }

        const room = this.rooms.get(roomId)!;

        // Check if user is already in room
        if (room.users.has(client.userId)) {
            console.log(`User ${client.username} already in room ${roomName}`);
            return true;
        }

        // Add user to room
        room.users.set(client.userId, {
            userId: client.userId,
            username: client.username,
            socketId: clientId,
            joinedAt: new Date()
        });

        // Update client room
        client.roomId = roomId;
        this.clients.set(clientId, client);

        // Notify room about new user
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
        }, clientId); // Exclude the user who joined

        // Send updated user list to room
        this.broadcastRoomUsers(roomId);

        console.log(`User ${client.username} joined room ${roomName}`);
        return true;
    }

    // Leave room
    leaveRoom(clientId: string, roomId: string): boolean {
        const client = this.clients.get(clientId);
        const room = this.rooms.get(roomId);

        if (!client || !room) return false;

        // Remove user from room
        const wasInRoom = room.users.delete(client.userId);
        if (!wasInRoom) return false;

        client.roomId = undefined;

        // Send updated user list to room
        this.broadcastRoomUsers(roomId);

        // Remove room if empty
        if (room.users.size === 0) {
            this.rooms.delete(roomId);
            console.log(`Room ${roomId} deleted (empty)`);
        }

        console.log(`User ${client.username} left room ${roomId}`);
        return true;
    }

    // Send message to specific client
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

    // Broadcast message to all clients in a room
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

    // Broadcast room users to all clients in room
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

    // Send typing indicator
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
        }, clientId); // Exclude sender

        return sentCount > 0;
    }

    // Send new message to room
    sendMessageToRoom(roomId: string, messageData: any): number {
        return this.broadcastToRoom(roomId, {
            type: 'message',
            data: messageData,
            timestamp: new Date()
        });
    }

    // Get room info
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

    // Get all rooms
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

    // Get client info
    getClientInfo(clientId: string) {
        return this.clients.get(clientId);
    }

    // Get all clients
    getAllClients() {
        return Array.from(this.clients.values()).map(client => ({
            id: client.id,
            userId: client.userId,
            username: client.username,
            roomId: client.roomId,
            lastSeen: client.lastSeen
        }));
    }

    // Get statistics
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

    // Cleanup inactive connections
    cleanup(): void {
        const now = new Date();
        const timeout = 10 * 60 * 1000; // 10 minutes

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

    // Shutdown cleanup
    shutdown(): void {
        if (this.cleanupInterval) {
            clearInterval(this.cleanupInterval);
        }

        // Close all client connections
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

    // SSE connection endpoint
    connect = (req: Request, res: Response): void => {
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

    // Join room endpoint
    joinRoom = (req: Request, res: Response): void => {
        try {
            const { userId, roomId, roomName } = req.body;

            if (!userId || !roomId || !roomName) {
                res.status(400).json({
                    success: false,
                    message: 'userId, roomId, and roomName are required'
                });
            }

            // Find client by userId
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

    // Leave room endpoint
    leaveRoom = (req: Request, res: Response): void => {
        try {
            const { userId, roomId } = req.body;

            if (!userId || !roomId) {
                res.status(400).json({
                    success: false,
                    message: 'userId and roomId are required'
                });
            }

            // Find client by userId
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

    // Send typing indicator
    sendTyping = (req: Request, res: Response): void => {
        try {
            const { userId, roomId, isTyping } = req.body;

            if (!userId || !roomId || typeof isTyping !== 'boolean') {
                res.status(400).json({
                    success: false,
                    message: 'userId, roomId, and isTyping are required'
                });
            }

            // Find client by userId
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

    // Send message to room (called after message is saved to DB)
    sendMessageToRoom = (roomId: string, messageData: any): number => {
        return this.sseManager.sendMessageToRoom(roomId, messageData);
    }

    // Get room info
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

    // Get all active rooms
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

    // Get SSE statistics
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

    // Get all connected clients
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