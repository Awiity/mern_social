// WEbsockets are unsupported by vercel, i'll leave this code here for future reference
import { useState, useEffect, useRef, useCallback } from 'react';

interface ChatMessage {
    id: string;
    message: string;
    username: string;
    userId: string;
    roomName: string;
    timestamp: Date;
    type: 'message' | 'user-joined' | 'user-left' | 'typing' | 'stop-typing';
}

interface RoomUser {
    username: string;
    userId: string;
    lastSeen: Date;
}

interface ChatState {
    messages: ChatMessage[];
    users: RoomUser[];
    currentRoom: string | null;
    isConnected: boolean;
    typingUsers: string[];
}

export const useVercelChat = (apiUrl: string = '/api/chat/messages') => {
    const [state, setState] = useState<ChatState>({
        messages: [],
        users: [],
        currentRoom: null,
        isConnected: false,
        typingUsers: []
    });

    const sessionId = useRef<string>(crypto.randomUUID());
    const pollInterval = useRef<NodeJS.Timeout | null>(null);
    const lastMessageId = useRef<string | null>(null);
    const typingTimeout = useRef<NodeJS.Timeout | null>(null);

    // API call helper
    const apiCall = useCallback(async (action: string, data: any) => {
        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-ID': sessionId.current
                },
                body: JSON.stringify({ action, data })
            });

            if (!response.ok) {
                throw new Error(`API call failed: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API call error:', error);
            throw error;
        }
    }, [apiUrl]);

    // Start polling for updates
    const startPolling = useCallback(() => {
        if (pollInterval.current) return;

        pollInterval.current = setInterval(async () => {
            if (!state.currentRoom) return;

            try {
                const response = await apiCall('poll-updates', {
                    roomName: state.currentRoom,
                    lastMessageId: lastMessageId.current
                });

                if (response.messages && response.messages.length > 0) {
                    setState(prev => {
                        const newMessages = response.messages.map((msg: any) => ({
                            ...msg,
                            timestamp: new Date(msg.timestamp)
                        }));

                        // Handle typing indicators
                        const typingMessages = newMessages.filter((msg: ChatMessage) =>
                            msg.type === 'typing' || msg.type === 'stop-typing'
                        );

                        let newTypingUsers = [...prev.typingUsers];
                        typingMessages.forEach((msg: ChatMessage) => {
                            if (msg.type === 'typing') {
                                if (!newTypingUsers.includes(msg.username)) {
                                    newTypingUsers.push(msg.username);
                                }
                            } else if (msg.type === 'stop-typing') {
                                newTypingUsers = newTypingUsers.filter(u => u !== msg.username);
                            }
                        });

                        // Only include actual chat messages and system messages
                        const chatMessages = newMessages.filter((msg: ChatMessage) =>
                            msg.type === 'message' || msg.type === 'user-joined' || msg.type === 'user-left'
                        );

                        return {
                            ...prev,
                            messages: [...prev.messages, ...chatMessages],
                            users: response.users || prev.users,
                            typingUsers: newTypingUsers
                        };
                    });

                    // Update last message ID
                    if (response.messages.length > 0) {
                        lastMessageId.current = response.messages[response.messages.length - 1].id;
                    }
                }

                // Update users list
                if (response.users) {
                    setState(prev => ({
                        ...prev,
                        users: response.users
                    }));
                }
            } catch (error) {
                console.error('Polling error:', error);
            }
        }, 1000); // Poll every second
    }, [state.currentRoom, apiCall]);

    // Stop polling
    const stopPolling = useCallback(() => {
        if (pollInterval.current) {
            clearInterval(pollInterval.current);
            pollInterval.current = null;
        }
    }, []);

    // Join room
    const joinRoom = useCallback(async (roomName: string, username: string, userId: string) => {
        try {
            const response = await apiCall('join-room', {
                roomName,
                username,
                userId
            });

            if (response.success) {
                setState(prev => ({
                    ...prev,
                    currentRoom: roomName,
                    isConnected: true,
                    messages: response.messages?.map((msg: any) => ({
                        ...msg,
                        timestamp: new Date(msg.timestamp)
                    })) || [],
                    users: response.users || [],
                    typingUsers: []
                }));

                // Update session ID if provided
                if (response.sessionId) {
                    sessionId.current = response.sessionId;
                }

                // Set initial last message ID
                if (response.messages && response.messages.length > 0) {
                    lastMessageId.current = response.messages[response.messages.length - 1].id;
                }

                startPolling();
            }

            return response;
        } catch (error) {
            console.error('Join room error:', error);
            throw error;
        }
    }, [apiCall, startPolling]);

    // Leave room
    const leaveRoom = useCallback(async () => {
        try {
            stopPolling();

            await apiCall('leave-room', {});

            setState(prev => ({
                ...prev,
                currentRoom: null,
                isConnected: false,
                messages: [],
                users: [],
                typingUsers: []
            }));

            lastMessageId.current = null;
        } catch (error) {
            console.error('Leave room error:', error);
            throw error;
        }
    }, [apiCall, stopPolling]);

    // Send message
    const sendMessage = useCallback(async (message: string, username: string, userId: string) => {
        if (!state.currentRoom) {
            throw new Error('Not in a room');
        }

        try {
            const response = await apiCall('send-message', {
                roomName: state.currentRoom,
                message,
                username,
                userId
            });

            return response;
        } catch (error) {
            console.error('Send message error:', error);
            throw error;
        }
    }, [state.currentRoom, apiCall]);

    // Handle typing
    const handleTyping = useCallback(async (username: string, userId: string, isTyping: boolean) => {
        if (!state.currentRoom) return;

        try {
            await apiCall('typing', {
                roomName: state.currentRoom,
                username,
                userId,
                isTyping
            });
        } catch (error) {
            console.error('Typing error:', error);
        }
    }, [state.currentRoom, apiCall]);

    // Start typing
    const startTyping = useCallback((username: string, userId: string) => {
        handleTyping(username, userId, true);

        // Clear existing timeout
        if (typingTimeout.current) {
            clearTimeout(typingTimeout.current);
        }

        // Set timeout to stop typing
        typingTimeout.current = setTimeout(() => {
            handleTyping(username, userId, false);
        }, 3000);
    }, [handleTyping]);

    // Stop typing
    const stopTyping = useCallback((username: string, userId: string) => {
        if (typingTimeout.current) {
            clearTimeout(typingTimeout.current);
            typingTimeout.current = null;
        }
        handleTyping(username, userId, false);
    }, [handleTyping]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            stopPolling();
            if (typingTimeout.current) {
                clearTimeout(typingTimeout.current);
            }
        };
    }, [stopPolling]);

    return {
        ...state,
        joinRoom,
        leaveRoom,
        sendMessage,
        startTyping,
        stopTyping
    };
};