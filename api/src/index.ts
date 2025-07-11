import express, { NextFunction, Request, Response } from 'express';
import config from './config/config';
import userRoutes from './routes/user.routes';
import { connectDB } from './config/db';
import cookieParser from 'cookie-parser';
import postRoutes from './routes/post.routes';
import roomRoutes from './routes/room.routes';
import { RoomManager } from './controllers/room.manager';
import {
    ServerToClientEvents,
    ClientToServerEvents,
    InterServerEvents,
    SocketData,
    User,
    ChatMessage,
    JoinRoomData,
    SendMessageData,
    TypingData
} from './types/socket.types';
import { Server } from 'socket.io';
import { Types } from 'mongoose';
import messageRoutes from './routes/message.routes';
import likeRoutes from './routes/like.routes';
import commentRoutes from './routes/comment.routes';
import rateLimit from 'express-rate-limit';

const cors = require('cors');
const http = require('http');

const app = express();

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: 'Too many requests from this IP, please try again later',
});

const server = http.createServer(app);
const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
>(server, {
    cors: {
        origin: [
            "http://localhost:3000",
            "http://localhost:5173",
            "http://localhost:3001",
            "https://opal-social-mocha.vercel.app",
            config.client_url || 'https://opal-social-mocha.vercel.app'
        ],
        methods: ["GET", "POST"],
        credentials: true,
        allowedHeaders: ["Content-Type", "Authorization"]
    }
});

const roomManager = new RoomManager();

// Socket.io connection
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    // Join a chat room
    socket.on('join-room', ({ roomName, username }: JoinRoomData) => {
        try {
            // Leave current room if any
            const currentRoom = socket.data.currentRoom;
            if (currentRoom) {
                socket.leave(currentRoom);
                roomManager.removeUserFromRoom(currentRoom, socket.data.userId || socket.id);

                // Notify the room that user left
                socket.to(currentRoom).emit('user-left', {
                    message: `${username} left the room`,
                    username,
                    userId: socket.data.userId || socket.id,
                    timestamp: new Date()
                });
            }

            // Join new room
            socket.join(roomName);

            // Update socket data
            socket.data.userId = socket.data.userId || socket.id;
            socket.data.username = username;
            socket.data.currentRoom = roomName;

            // Create user object
            const user: User = {
                id: socket.data.userId,
                username,
                socketId: socket.id
            };

            // Add user to room
            roomManager.addUserToRoom(roomName, user);

            // Send updated user list to room
            const roomUsers = roomManager.getRoomUsers(roomName);
            io.to(roomName).emit('room-users', { users: roomUsers });

            // Notify others in room that user joined
            socket.to(roomName).emit('user-joined', {
                message: `${username} joined the room`,
                username,
                userId: socket.data.userId,
                timestamp: new Date()
            });

            console.log(`${username} joined room: ${roomName}`);
        } catch (error) {
            console.error('Error joining room:', error);
            socket.emit('error', 'Failed to join room');
        }
    });

    // Leave a chat room
    socket.on('leave-room', (roomName: string) => {
        try {
            socket.leave(roomName);

            if (socket.data.userId && socket.data.username) {
                roomManager.removeUserFromRoom(roomName, socket.data.userId);

                // Send updated user list
                const roomUsers = roomManager.getRoomUsers(roomName);
                io.to(roomName).emit('room-users', { users: roomUsers });

                // Notify others in room
                socket.to(roomName).emit('user-left', {
                    message: `${socket.data.username} left the room`,
                    username: socket.data.username,
                    userId: socket.data.userId,
                    timestamp: new Date()
                });

                console.log(`${socket.data.username} left room: ${roomName}`);
            }

            // Clear current room
            socket.data.currentRoom = undefined;
        } catch (error) {
            console.error('Error leaving room:', error);
            socket.emit('error', 'Failed to leave room');
        }
    });

    // Handle chat messages
    socket.on('send-message', ({ roomName, message, username, user_id, user_socket_id }: SendMessageData) => {
        try {
            if (!socket.data.userId || !socket.data.username) {
                socket.emit('error', 'User not authenticated');
                return;
            }

            // Validate message
            if (!message || message.trim().length === 0 || message.length > 1000) {
                socket.emit('error', 'Invalid message');
                return;
            }

            const chatMessage: ChatMessage = {
                id: new Types.ObjectId().toString(),
                message: message.trim(),
                username,
                userId: user_id,
                userSocketId: user_socket_id || socket.id,
                roomName,
                timestamp: new Date()
            };
            // Broadcast message to all users in the room (including sender)
            io.to(roomName).emit('receive-message', chatMessage);

            console.log(`Message in ${roomName} from ${username}: ${message}`);
        } catch (error) {
            console.error('Error sending message:', error);
            socket.emit('error', 'Failed to send message');
        }
    });

    // Handle typing indicators
    socket.on('typing', ({ roomName, username }: Omit<TypingData, 'isTyping'>) => {
        try {
            // Only send typing indicator to others in the room (not to sender)
            socket.to(roomName).emit('user-typing', {
                username,
                roomName,
                isTyping: true
            });
        } catch (error) {
            console.error('Error handling typing:', error);
        }
    });

    socket.on('stop-typing', ({ roomName, username }: Omit<TypingData, 'isTyping'>) => {
        try {
            // Only send stop typing indicator to others in the room (not to sender)
            socket.to(roomName).emit('user-typing', {
                username,
                roomName,
                isTyping: false
            });
        } catch (error) {
            console.error('Error handling stop typing:', error);
        }
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
        console.log('User disconnected:', socket.id, 'Reason:', reason);

        if (socket.data.userId && socket.data.username && socket.data.currentRoom) {
            // Remove user from current room
            roomManager.removeUserFromRoom(socket.data.currentRoom, socket.data.userId);

            // Send updated user list to the room
            const roomUsers = roomManager.getRoomUsers(socket.data.currentRoom);
            io.to(socket.data.currentRoom).emit('room-users', { users: roomUsers });

            // Notify the room that user disconnected
            socket.to(socket.data.currentRoom).emit('user-left', {
                message: `${socket.data.username} disconnected`,
                username: socket.data.username,
                userId: socket.data.userId,
                timestamp: new Date()
            });
        }

        // Also remove user from all rooms (fallback)
        if (socket.data.userId && socket.data.username) {
            const roomsLeft = roomManager.removeUserFromAllRooms(socket.data.userId);

            roomsLeft.forEach(roomName => {
                const roomUsers = roomManager.getRoomUsers(roomName);
                io.to(roomName).emit('room-users', { users: roomUsers });
            });
        }
    });

    // Handle connection errors

    // Handle socket errors
    socket.on('error', (error) => {
        console.error('Socket error:', error);
    });
});

// Error handling for Socket.IO engine
io.engine.on("connection_error", (err) => {
    console.log('Connection error:', err.req, err.code, err.message, err.context);
});

// Middleware
app.use(cors({
    credentials: true,
    origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:3001',
        'https://opal-social-mocha.vercel.app',
        config.client_url || 'https://opal-social-mocha.vercel.app'
    ],
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));
app.set('trust proxy', true);
app.use(express.json());
app.use(limiter);
app.use(cookieParser());
connectDB();

// Routes
app.use('/api', userRoutes);
app.use('/api', postRoutes);
app.use('/api', roomRoutes);
app.use('/api', messageRoutes);
app.use('/api', likeRoutes);
app.use('/api', commentRoutes)

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ message: "Internal Server Error!!!" });
});

module.exports = server;

// Start server
if (config.node_env !== 'production') {
    server.listen(config.port, () => {
        console.log("Server started, listening to port", config.port);
    });
}