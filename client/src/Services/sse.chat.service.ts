/* eslint-disable @typescript-eslint/no-explicit-any */
// types/sse.types.ts
export interface SSEMessage {
    type: 'message' | 'user-joined' | 'user-left' | 'typing' | 'room-users' | 'error' | 'connection' | 'heartbeat';
    data: any;
    roomId?: string;
    userId?: string;
    timestamp?: Date;
}

export interface RoomUser {
    userId: string;
    username: string;
    joinedAt: Date;
}

export interface RoomInfo {
    id: string;
    name: string;
    users: RoomUser[];
    userCount: number;
    createdAt: Date;
}

export interface SSEConnectionOptions {
    userId: string;
    username: string;
    baseUrl?: string;
}

export interface EventHandlers {
    onMessage?: (data: any) => void;
    onUserJoined?: (data: any) => void;
    onUserLeft?: (data: any) => void;
    onTyping?: (data: any) => void;
    onRoomUsers?: (data: any) => void;
    onConnection?: (data: any) => void;
    onError?: (error: any) => void;
    onHeartbeat?: (data: any) => void;
}



// services/sse.service.ts
export class SSEService {
    private eventSource: EventSource | null = null;
    private userId: string;
    private username: string;
    private baseUrl: string;
    private currentRoomId: string | null = null;
    private eventHandlers: EventHandlers = {};
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 3;
    private reconnectDelay = 1000;
    private isConnected = false;

    constructor(options: SSEConnectionOptions) {
        this.userId = options.userId;
        this.username = options.username;
        this.baseUrl = options.baseUrl || '/api/sse';
    }

    // Connect to SSE stream
    async connect(): Promise<boolean> {
        try {
            const url = `${this.baseUrl}/connect?userId=${encodeURIComponent(this.userId)}&username=${encodeURIComponent(this.username)}`;
            //console.log(`Connecting to SSE at ${url}`);

            this.eventSource = new EventSource(url);

            this.setupEventListeners();

            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Connection timeout'));
                }, 10000);

                this.eventSource!.addEventListener('connection', () => {
                    clearTimeout(timeout);
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    //console.log('SSE connected successfully');
                    resolve(true);
                });

                this.eventSource!.onerror = (error) => {
                    clearTimeout(timeout);
                    console.error('SSE connection error:', error);
                    this.handleConnectionError();
                    reject(error);
                };
            });
        } catch (error) {
            console.error('Failed to connect to SSE:', error);
            throw error;
        }
    }

    // Setup event listeners for different message types
    private setupEventListeners(): void {
        if (!this.eventSource) return;

        // Connection events
        this.eventSource.addEventListener('connection', (event) => {
            //console.log("WWWWWWWWWWWWWWWWWWWWWWWWWWWW", JSON.parse(event.data))
            const data = JSON.parse(event.data);
            //console.log('Connected to SSE:', data);
            this.eventHandlers.onConnection?.(data);
        });

        // Message events
        this.eventSource.addEventListener('message', (event) => {
            //console.log('Message event received:', event);
            const data = JSON.parse(event.data);
            //console.log('New message:', data);
            this.eventHandlers.onMessage?.(data);
        });

        // User joined events
        this.eventSource.addEventListener('user-joined', (event) => {
            //console.log('User joined event received:', event);
            const data = JSON.parse(event.data);
            //console.log('User joined:', data);
            this.eventHandlers.onUserJoined?.(data);
        });

        // User left events
        this.eventSource.addEventListener('user-left', (event) => {
            //console.log('User left event received:', event);
            const data = JSON.parse(event.data);
            //console.log('User left:', data);
            this.eventHandlers.onUserLeft?.(data);
        });

        // Typing events
        this.eventSource.addEventListener('typing', (event) => {
            //console.log('Typing event received:', event);
            const data = JSON.parse(event.data);
            this.eventHandlers.onTyping?.(data);
        });

        // Room users update events
        this.eventSource.addEventListener('room-users', (event) => {
            //console.log('Room users update event received:', event);
            const data = JSON.parse(event.data);
            //console.log('Room users updated:', data);
            this.eventHandlers.onRoomUsers?.(data);
        });

        // Error events
        this.eventSource.addEventListener('error', (event: MessageEvent) => {
            console.error('SSE error event received:', event);
            const data = JSON.parse(event.data);
            console.error('SSE error:', data);
            this.eventHandlers.onError?.(data);
        });

        // Heartbeat events
        this.eventSource.addEventListener('heartbeat', (event) => {
            //console.log('Heartbeat received', event);
            const data = JSON.parse(event.data);
            this.eventHandlers.onHeartbeat?.(data);
        });

        // Handle connection errors and reconnection
        this.eventSource.onerror = (error) => {
            console.error('EventSource error:', error);
            this.handleConnectionError();
        };
    }

    // Handle connection errors and implement reconnection logic
    private handleConnectionError(): void {
        this.isConnected = false;

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);

            //console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${delay}ms...`);

            setTimeout(() => {
                this.disconnect();
                this.connect().catch(error => {
                    console.error('Reconnection failed:', error);
                });
            }, delay);
        } else {
            console.error('Max reconnection attempts reached');
            this.eventHandlers.onError?.({ message: 'Connection lost and unable to reconnect' });
        }
    }

    // Set event handlers
    setEventHandlers(handlers: EventHandlers): void {
        this.eventHandlers = { ...this.eventHandlers, ...handlers };
    }

    // Join a room
    async joinRoom(roomId: string, roomName: string): Promise<boolean> {
        try {
            const response = await fetch(`${this.baseUrl}/join-room`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: this.userId,
                    roomId,
                    roomName
                })
            });

            const result = await response.json();

            if (result.success) {
                this.currentRoomId = roomId;
                //console.log(`Successfully joined room: ${roomName}`);
                return true;
            } else {
                console.error('Failed to join room:', result.message);
                return false;
            }
        } catch (error) {
            console.error('Error joining room:', error);
            return false;
        }
    }

    // Leave current room
    async leaveRoom(): Promise<boolean> {
        if (!this.currentRoomId) {
            console.warn('No room to leave');
            return true;
        }

        try {
            const response = await fetch(`${this.baseUrl}/leave-room`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: this.userId,
                    roomId: this.currentRoomId
                })
            });

            const result = await response.json();

            if (result.success) {
                //console.log('Successfully left room');
                this.currentRoomId = null;
                return true;
            } else {
                console.error('Failed to leave room:', result.message);
                return false;
            }
        } catch (error) {
            console.error('Error leaving room:', error);
            return false;
        }
    }

    // Send typing indicator
    async sendTyping(isTyping: boolean): Promise<boolean> {
        if (!this.currentRoomId) {
            console.warn('Not in a room, cannot send typing indicator');
            return false;
        }

        try {
            const response = await fetch(`${this.baseUrl}/typing`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId: this.userId,
                    roomId: this.currentRoomId,
                    isTyping
                })
            });

            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Error sending typing indicator:', error);
            return false;
        }
    }

    // Get room information
    async getRoomInfo(roomId: string): Promise<RoomInfo | null> {
        try {
            const response = await fetch(`${this.baseUrl}/room/${roomId}`);
            const result = await response.json();

            if (result.success) {
                return result.data;
            } else {
                console.error('Failed to get room info:', result.message);
                return null;
            }
        } catch (error) {
            console.error('Error getting room info:', error);
            return null;
        }
    }

    // Get all active rooms
    async getAllRooms(): Promise<RoomInfo[]> {
        try {
            const response = await fetch(`${this.baseUrl}/rooms`);
            const result = await response.json();

            if (result.success) {
                return result.data;
            } else {
                console.error('Failed to get rooms:', result.message);
                return [];
            }
        } catch (error) {
            console.error('Error getting rooms:', error);
            return [];
        }
    }

    // Get SSE statistics
    async getStats(): Promise<any> {
        try {
            const response = await fetch(`${this.baseUrl}/stats`);
            const result = await response.json();

            if (result.success) {
                return result.data;
            } else {
                console.error('Failed to get stats:', result.message);
                return null;
            }
        } catch (error) {
            console.error('Error getting stats:', error);
            return null;
        }
    }

    // Disconnect from SSE
    disconnect(): void {
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
            this.isConnected = false;
            this.currentRoomId = null;
            //console.log('SSE connection closed ...');
        }
    }

    // Get connection status
    isConnectionOpen(): boolean {
        return this.isConnected && this.eventSource?.readyState === EventSource.OPEN;
    }

    // Get current room ID
    getCurrentRoomId(): string | null {
        return this.currentRoomId;
    }

    // Get user info
    getUserInfo() {
        return {
            userId: this.userId,
            username: this.username
        };
    }
}

// Utility functions for managing multiple SSE connections or creating singletons
export class SSEManager {
    private static instances: Map<string, SSEService> = new Map();

    static createConnection(userId: string, username: string, baseUrl?: string): SSEService {
        const key = `${userId}_${username}`;

        // Close existing connection for this user
        if (this.instances.has(key)) {
            this.instances.get(key)?.disconnect();
        }

        const service = new SSEService({ userId, username, baseUrl });
        this.instances.set(key, service);

        return service;
    }

    static getConnection(userId: string, username: string): SSEService | null {
        const key = `${userId}_${username}`;
        return this.instances.get(key) || null;
    }

    static disconnectAll(): void {
        this.instances.forEach(service => service.disconnect());
        this.instances.clear();
    }

    static getActiveConnections(): string[] {
        return Array.from(this.instances.keys());
    }
}

export default SSEService;