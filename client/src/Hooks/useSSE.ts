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
    isConnected: boolean;
    isConnecting: boolean;
    error: string | null;
    currentRoomId: string | null;
    roomUsers: any[];
    roomInfo: RoomInfo | null;
    typingUsers: string[];
    messages: any[];
    connect: () => Promise<boolean>;
    disconnect: () => void;
    joinRoom: (roomId: string, roomName: string) => Promise<boolean>;
    leaveRoom: () => Promise<boolean>;
    sendTyping: (isTyping: boolean) => Promise<boolean>;
    clearMessages: () => void;
    sseService: SSEService | null;
}

export const useSSE = (options: UseSSEOptions): UseSSEReturn => {
    const { userId, username, baseUrl, autoConnect = true } = options;

    // Use ref to persist service instance across renders
    const sseServiceRef = useRef<SSEService | null>(null);

    // Initialize service only once
    if (!sseServiceRef.current) {
        sseServiceRef.current = new SSEService({ userId, username, baseUrl });
    }

    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [currentRoomId, setCurrentRoomId] = useState<string | null>(null);
    const [roomUsers, setRoomUsers] = useState<any[]>([]);
    const [roomInfo, setRoomInfo] = useState<RoomInfo | null>(null);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [messages, setMessages] = useState<any[]>([]);

    const typingTimeouts = useRef<Map<string, NodeJS.Timeout>>(new Map());
    const hasConnectedRef = useRef(false); // Track if we've ever connected

    const handlersRef = useRef<EventHandlers>({});

    // Initialize handlers once
    useEffect(() => {
        handlersRef.current = {
            onConnection: () => {
                setIsConnected(true);
                setIsConnecting(false);
                setError(null);
                hasConnectedRef.current = true;
            },
            onMessage: (data) => {
                setMessages(prev => [...prev, {
                    ...data.data,
                    id: Date.now() + Math.random(),
                    timestamp: new Date(data.timestamp)
                }]);
            },
            onRoomUsers: (data) => {
                setRoomUsers(data.users || []);
                setRoomInfo(prev => prev ? { ...prev, users: data.users, userCount: data.userCount } : null);
            },
            onTyping: (data) => {
                const { username: typingUsername, userId: typingUserId, isTyping } = data;

                // Use ref for current userId to avoid stale closure
                if (typingUserId === userIdRef.current) return;

                if (isTyping) {
                    setTypingUsers(prev => {
                        if (!prev.includes(typingUsername)) {
                            return [...prev, typingUsername];
                        }
                        return prev;
                    });

                    const existingTimeout = typingTimeouts.current.get(typingUsername);
                    if (existingTimeout) {
                        clearTimeout(existingTimeout);
                    }

                    const timeout = setTimeout(() => {
                        setTypingUsers(prev => prev.filter(u => u !== typingUsername));
                        typingTimeouts.current.delete(typingUsername);
                    }, 3000);

                    typingTimeouts.current.set(typingUsername, timeout);
                } else {
                    setTypingUsers(prev => prev.filter(u => u !== typingUsername));
                    const timeout = typingTimeouts.current.get(typingUsername);
                    if (timeout) {
                        clearTimeout(timeout);
                        typingTimeouts.current.delete(typingUsername);
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
                setIsConnected(true);
            }
        };

        sseServiceRef.current?.setEventHandlers(handlersRef.current);
    }, []); // Empty dependencies - setup once

    const userIdRef = useRef(userId);
    useEffect(() => {
        userIdRef.current = userId;
    }, [userId]);

    // Connect function - stable reference
    const connect = useCallback(async (): Promise<boolean> => {
        if (!sseServiceRef.current) return false;

        // Prevent multiple simultaneous connection attempts
        if (isConnecting || isConnected || sseServiceRef.current.isConnectionOpen()) {
            return isConnected;
        }

        setIsConnecting(true);
        setError(null);

        try {
            const success = await sseServiceRef.current.connect();
            if (success) {
                setIsConnected(true);
            } else {
                setIsConnecting(false);
            }
            return success;
        } catch (error) {
            console.error('Connection failed:', error);
            setError(error instanceof Error ? error.message : 'Connection failed');
            setIsConnecting(false);
            setIsConnected(false);
            return false;
        }
    }, [isConnecting, isConnected]);

    // Disconnect function - stable reference
    const disconnect = useCallback(() => {
        if (!sseServiceRef.current) return;

        sseServiceRef.current.disconnect();
        setIsConnected(false);
        setIsConnecting(false);
        setCurrentRoomId(null);
        setRoomUsers([]);
        setRoomInfo(null);
        setTypingUsers([]);
        setMessages([]);
        setError(null);
    }, []);

    const joinRoom = useCallback(async (roomId: string, roomName: string): Promise<boolean> => {
        if (!sseServiceRef.current || !isConnected) {
            setError('Not connected to SSE');
            return false;
        }

        try {
            const success = await sseServiceRef.current.joinRoom(roomId, roomName);
            if (success) {
                setCurrentRoomId(roomId);
                setMessages([]);
                setTypingUsers([]);

                const info = await sseServiceRef.current.getRoomInfo(roomId);
                setRoomInfo(info);
            }
            return success;
        } catch (error) {
            console.error('Failed to join room:', error);
            setError(error instanceof Error ? error.message : 'Failed to join room');
            return false;
        }
    }, [isConnected]);

    const leaveRoom = useCallback(async (): Promise<boolean> => {
        if (!sseServiceRef.current || !currentRoomId) return true;

        try {
            const success = await sseServiceRef.current.leaveRoom();
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
    }, [currentRoomId]);

    const sendTyping = useCallback(async (isTyping: boolean): Promise<boolean> => {
        if (!sseServiceRef.current || !isConnected || !currentRoomId) return false;

        try {
            return await sseServiceRef.current.sendTyping(isTyping);
        } catch (error) {
            console.error('Failed to send typing indicator:', error);
            return false;
        }
    }, [isConnected, currentRoomId]);

    const clearMessages = useCallback(() => {
        setMessages([]);
    }, []);

    useEffect(() => {
        let mounted = true;
        const initConnection = async () => {
            if (autoConnect && !hasConnectedRef.current && mounted) {
                await connect();
            }
        };
        initConnection();

        return () => {
            mounted = false;
            if (sseServiceRef.current) {
                disconnect();
            }
        };
    }, [autoConnect, connect, disconnect]);

    // Update current room ID from service
    useEffect(() => {
        if (sseServiceRef.current) {
            const roomId = sseServiceRef.current.getCurrentRoomId();
            setCurrentRoomId(roomId);
        }
    }, []);

    return {
        isConnected,
        isConnecting,
        error,
        currentRoomId,
        roomUsers,
        roomInfo,
        typingUsers,
        messages,
        connect,
        disconnect,
        joinRoom,
        leaveRoom,
        sendTyping,
        clearMessages,
        sseService: sseServiceRef.current
    };
};

export default useSSE;