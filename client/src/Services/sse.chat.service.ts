/* eslint-disable @typescript-eslint/no-explicit-any */
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



export class SSEService {
    private eventSource: EventSource | null = null;
    private userId: string;
    private username: string;
    private baseUrl: string;
    private currentRoomId: string | null = null;
    private eventHandlers: EventHandlers = {};
    private reconnectAttempts = 0;
    private maxReconnectAttempts = process.env.NODE_ENV === 'production' ? 1 : 3;
    private reconnectDelay = 1000;
    private isConnected = false;
    private reconnectTimeout: NodeJS.Timeout | null = null;



    constructor(options: SSEConnectionOptions) {
        this.userId = options.userId;
        this.username = options.username;
        this.baseUrl = options.baseUrl + '/api/sse';
    }
    async connect(): Promise<boolean> {
        if (this.isConnected || this.isConnectionOpen()) {
            return true;
        }

        try {
            const url = `${this.baseUrl}/connect?userId=${encodeURIComponent(this.userId)}&username=${encodeURIComponent(this.username)}&t=${Date.now()}`;

            this.eventSource = new EventSource(url);
            this.setupEventListeners();

            return new Promise((resolve) => {
                const onConnection = () => {
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    console.log('SSE connected successfully');
                    resolve(true);
                };

                this.eventSource?.addEventListener('connection', onConnection, { once: true });

                if (this.eventSource) {
                    this.eventSource.onerror = () => {
                        this.handleConnectionError();
                    };
                }
            });
        } catch (error) {
            console.error('Failed to initialize SSE connection:', error);
            this.handleConnectionError();
            return false;
        }
    }

    private setupEventListeners(): void {
        if (!this.eventSource) return;

        this.eventSource.addEventListener('connection', (event) => {
            const data = JSON.parse(event.data);
            console.log('Connected to SSE:', data);
            this.eventHandlers.onConnection?.(data);
        });

        this.eventSource.addEventListener('message', (event) => {
            console.log('Message event received:', event);
            const data = JSON.parse(event.data);
            console.log('New message:', data);
            this.eventHandlers.onMessage?.(data);
        });

        this.eventSource.addEventListener('user-joined', (event) => {
            console.log('User joined event received:', event);
            const data = JSON.parse(event.data);
            console.log('User joined:', data);
            this.eventHandlers.onUserJoined?.(data);
        });

        this.eventSource.addEventListener('user-left', (event) => {
            console.log('User left event received:', event);
            const data = JSON.parse(event.data);
            console.log('User left:', data);
            this.eventHandlers.onUserLeft?.(data);
        });

        this.eventSource.addEventListener('typing', (event) => {
            console.log('Typing event received:', event);
            const data = JSON.parse(event.data);
            this.eventHandlers.onTyping?.(data);
        });

        this.eventSource.addEventListener('room-users', (event) => {
            console.log('Room users update event received:', event);
            const data = JSON.parse(event.data);
            console.log('Room users updated:', data);
            this.eventHandlers.onRoomUsers?.(data);
        });

        this.eventSource.addEventListener('error', (event: MessageEvent) => {
            console.error('SSE error event received:', event);
            const data = JSON.parse(event.data);
            console.error('SSE error:', data);
            this.eventHandlers.onError?.(data);
        });

        this.eventSource.addEventListener('heartbeat', (event) => {
            console.log('Heartbeat received', event);
            const data = JSON.parse(event.data);
            this.eventHandlers.onHeartbeat?.(data);
        });

        this.eventSource.onerror = (error) => {
            console.error('EventSource error:', error);
            this.handleConnectionError();
        };

    }

    private handleConnectionError(): void {
        this.isConnected = false;

        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }

        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            const baseDelay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts - 1);
            const jitter = Math.random() * 1000; // up to 1s extra
            const delay = Math.min(baseDelay + jitter, 30000); // cap at 30s

            console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts}) in ${Math.round(delay)}ms...`);

            this.reconnectTimeout = setTimeout(() => {
                this.connect().catch(error => {
                    console.error('Reconnection attempt failed:', error);
                });
            }, delay);
        } else {
            console.error('Max reconnection attempts reached. Giving up.');
            this.eventHandlers.onError?.({ message: 'Connection lost and unable to reconnect' });
            this.reconnectAttempts = 0;
        }
    }

    setEventHandlers(handlers: EventHandlers): void {
        this.eventHandlers = { ...this.eventHandlers, ...handlers };
    }

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
                console.log(`Successfully joined room: ${roomName}`);
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
                console.log('Successfully left room');
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

    disconnect(): void {
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
        if (this.eventSource) {
            this.eventSource.close();
            this.eventSource = null;
        }
        this.isConnected = false;
        this.currentRoomId = null;
        this.reconnectAttempts = 0;
    }

    isConnectionOpen(): boolean {
        return this.isConnected && this.eventSource?.readyState === EventSource.OPEN;
    }

    getCurrentRoomId(): string | null {
        return this.currentRoomId;
    }

    getUserInfo() {
        return {
            userId: this.userId,
            username: this.username
        };
    }
}

export class SSEManager {
    private static instances: Map<string, SSEService> = new Map();

    static createConnection(userId: string, username: string, baseUrl?: string): SSEService {
        const key = `${userId}_${username}`;

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