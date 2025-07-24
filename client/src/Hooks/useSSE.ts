/* eslint-disable @typescript-eslint/no-explicit-any */
import { useState, useEffect, useRef, useCallback } from 'react';
import { SSEService, EventHandlers, RoomInfo } from '../Services/sse.chat.service';

export interface UseSSEOptions {
    userId: string;
    username: string;
    baseUrl?: string;
    autoConnect?: boolean;
}

export interface UseSSEReturn {
    // Connection state
    isConnected: boolean;
    isConnecting: boolean;
    error: string | null;

    // Current room state
    currentRoomId: string | null;
    roomUsers: any[];
    roomInfo: RoomInfo | null;

    // Typing indicators
    typingUsers: string[];

    // Messages
    messages: any[];

    // Actions
    connect: () => Promise<boolean>;
    disconnect: () => void;
    joinRoom: (roomId: string, roomName: string) => Promise<boolean>;
    leaveRoom: () => Promise<boolean>;
    sendTyping: (isTyping: boolean) => Promise<boolean>;
    clearMessages: () => void;

    // Service instance (for advanced usage)
    sseService: SSEService | null;
}

export const useSSE = (options: UseSSEOptions): UseSSEReturn => {
    const { userId, username, baseUrl, autoConnect = true } = options;

    // Service instance
    const [sseService] = useState(() => new SSEService({ userId, username, baseUrl }));

    // Connection state
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Room state
    const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
    const [roomUsers, setRoomUsers] = useState<any[]>([]);
    const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);

    // Typing state
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const typingTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());

    // Messages
    const [messages, setMessages] = useState<any[]>([]);

    // Setup event handlers
    useEffect(() => {
        const handlers: EventHandlers = {
            onConnection: (data) => {
                console.log('SSE Connected:', data);
                setIsConnected(true);
                setIsConnecting(false);
                setError(null);
            },

            onMessage: (data) => {
                console.log('New message received:', data.data);
                setMessages(prev => [...prev, {
                    ...data.data,
                    id: Date.now() + Math.random(),
                    timestamp: new Date(data.timestamp)
                }]);
            },

            onUserJoined: (data) => {
                console.log('User joined:', data);
                // Add a system message
                setMessages(prev => [...prev, {
                    id: Date.now() + Math.random(),
                    type: 'system',
                    content: `${data.username} joined the room`,
                    timestamp: new Date(data.timestamp),
                    username: 'System'
                }]);
            },

            onUserLeft: (data) => {
                console.log('User left:', data);
                // Add a system message
                setMessages(prev => [...prev, {
                    id: Date.now() + Math.random(),
                    type: 'system',
                    content: `${data.username} left the room`,
                    timestamp: new Date(data.timestamp),
                    username: 'System'
                }]);
            },

            onRoomUsers: (data) => {
                console.log('Room users updated:', data);
                setRoomUsers(data.users || []);
                setRoomInfo(prev => prev ? { ...prev, users: data.users, userCount: data.userCount } : null);
            },

            onTyping: (data) => {
                const { username, userId: typingUserId, isTyping } = data;

                if (typingUserId === userId) return; // Ignore own typing

                if (isTyping) {
                    setTypingUsers(prev => {
                        if (!prev.includes(username)) {
                            return [...prev, username];
                        }
                        return prev;
                    });

                    // Clear existing timeout for this user
                    const existingTimeout = typingTimeouts.current.get(username);
                    if (existingTimeout) {
                        clearTimeout(existingTimeout);
                    }

                    // Set new timeout to remove typing indicator
                    const timeout = setTimeout(() => {
                        setTypingUsers(prev => prev.filter(u => u !== username));
                        typingTimeouts.current.delete(username);
                    }, 3000);

                    typingTimeouts.current.set(username, timeout);
                } else {
                    setTypingUsers(prev => prev.filter(u => u !== username));
                    const timeout = typingTimeouts.current.get(username);
                    if (timeout) {
                        clearTimeout(timeout);
                        typingTimeouts.current.delete(username);
                    }
                }
            },

            onError: (error) => {
                console.error('SSE Error:', error);
                setError(error.message || 'Connection error');
                setIsConnected(false);
                setIsConnecting(false);
            },

            onHeartbeat: () => {
                // Update last seen time or connection status
                setIsConnected(true);
            }
        };

        sseService.setEventHandlers(handlers);

        return () => {
            // Clear all typing timeouts on cleanup
            typingTimeouts.current.forEach(timeout => clearTimeout(timeout));
            typingTimeouts.current.clear();
        };
    }, [sseService, userId]);

    // Connect function
    const connect = useCallback(async (): Promise<boolean> => {
        if (isConnected || isConnecting) return true;

        setIsConnecting(true);
        setError(null);

        try {
            const success = await sseService.connect();
            if (success) {
                setIsConnected(true);
            }
            setIsConnecting(false);
            return success;
        } catch (error) {
            console.error('Connection failed:', error);
            setError(error instanceof Error ? error.message : 'Connection failed');
            setIsConnecting(false);
            setIsConnected(false);
            return false;
        }
    }, [sseService, isConnected, isConnecting]);

    // Disconnect function
    const disconnect = useCallback(() => {
        sseService.disconnect();
        setIsConnected(false);
        setIsConnecting(false);
        setCurrentRoomId(null);
        setRoomUsers([]);
        setRoomInfo(null);
        setTypingUsers([]);
        setMessages([]);
        setError(null);
    }, [sseService]);

    // Join room function
    const joinRoom = useCallback(async (roomId: string, roomName: string): Promise<boolean> => {
        if (!isConnected) {
            setError('Not connected to SSE');
            return false;
        }

        try {
            const success = await sseService.joinRoom(roomId, roomName);
            if (success) {
                setCurrentRoomId(roomId);
                setMessages([]); // Clear messages when joining new room
                setTypingUsers([]);

                // Fetch room info
                const info = await sseService.getRoomInfo(roomId);
                setRoomInfo(info);
            }
            return success;
        } catch (error) {
            console.error('Failed to join room:', error);
            setError(error instanceof Error ? error.message : 'Failed to join room');
            return false;
        }
    }, [sseService, isConnected]);

    // Leave room function
    const leaveRoom = useCallback(async (): Promise<boolean> => {
        if (!currentRoomId) return true;

        try {
            const success = await sseService.leaveRoom();
            if (success) {
                setCurrentRoomId(null);
                setRoomUsers([]);
                setRoomInfo(null);
                setTypingUsers([]);
                setMessages([]);
            }
            return success;
        } catch (error) {
            console.error('Failed to leave room:', error);
            setError(error instanceof Error ? error.message : 'Failed to leave room');
            return false;
        }
    }, [sseService, currentRoomId]);

    // Send typing function
    const sendTyping = useCallback(async (isTyping: boolean): Promise<boolean> => {
        if (!isConnected || !currentRoomId) return false;

        try {
            return await sseService.sendTyping(isTyping);
        } catch (error) {
            console.error('Failed to send typing indicator:', error);
            return false;
        }
    }, [sseService, isConnected, currentRoomId]);

    // Clear messages function
    const clearMessages = useCallback(() => {
        setMessages([]);
    }, []);

    // Auto-connect on mount
    useEffect(() => {
        if (autoConnect && !isConnected && !isConnecting) {
            connect();
        }

        return () => {
            if (autoConnect) {
                disconnect();
            }
        };
    }, [autoConnect]); // Only run on mount/unmount

    // Update current room ID from service
    useEffect(() => {
        const roomId = sseService.getCurrentRoomId();
        setCurrentRoomId(roomId);
    }, [sseService]);

    return {
        // Connection state
        isConnected,
        isConnecting,
        error,

        // Room state
        currentRoomId,
        roomUsers,
        roomInfo,

        // Typing state
        typingUsers,

        // Messages
        messages,

        // Actions
        connect,
        disconnect,
        joinRoom,
        leaveRoom,
        sendTyping,
        clearMessages,

        // Service instance
        sseService
    };
};

export default useSSE;