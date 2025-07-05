export interface User {
    id: string;
    username: string;
    socketId: string;
}

export interface Room {
    name: string;
    users: Set<User>;
    createdAt: Date;
}

export interface ChatMessage {
    id: string;
    message: string;
    username: string;
    userId: string;
    roomName: string;
    timestamp: Date;
}

export interface JoinRoomData {
    roomName: string;
    username: string;
}

export interface SendMessageData {
    roomName: string;
    message: string;
    username: string;
}

export interface TypingData {
    roomName: string;
    username: string;
    isTyping: boolean;
}

export interface UserJoinedData {
    message: string;
    username: string;
    userId: string;
    timestamp: Date;
}

export interface UserLeftData {
    message: string;
    username: string;
    userId: string;
    timestamp: Date;
}

export interface RoomUsersData {
    users: User[];
}

// Socket.io server-to-client events
export interface ServerToClientEvents {
    'receive-message': (data: ChatMessage) => void;
    'user-joined': (data: UserJoinedData) => void;
    'user-left': (data: UserLeftData) => void;
    'user-typing': (data: TypingData) => void;
    'room-users': (data: RoomUsersData) => void;
    'error': (message: string) => void;
}

// Socket.io client-to-server events
export interface ClientToServerEvents {
    'join-room': (data: JoinRoomData) => void;
    'leave-room': (roomName: string) => void;
    'send-message': (data: SendMessageData) => void;
    'typing': (data: Omit<TypingData, 'isTyping'>) => void;
    'stop-typing': (data: Omit<TypingData, 'isTyping'>) => void;
}

// Socket.io inter-server events
export interface InterServerEvents {
    ping: () => void;
}

// Socket data
export interface SocketData {
    userId: string;
    username: string;
    currentRoom?: string;
}