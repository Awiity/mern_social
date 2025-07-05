import express, { NextFunction, Request, Response } from 'express';
import config from './config/config';
import userRoutes from './routes/user.routes';
import { connectDB } from './config/db';
import cookieParser from 'cookie-parser';
import postRoutes from './routes/post.routes';
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


const cors = require('cors');
const http = require('http');


const app = express();
const server = http.createServer(app);
const io = new Server<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
>(server, {
    cors: {
        origin: process.env.CLIENT_URL || "http://localhost:3000",
        methods: ["GET", "POST"]
    }
});

const roomManager = new RoomManager();

app.get('/api/rooms', (req, res) => {
    const rooms = roomManager.getAllRooms().map(room => ({
        name: room.name,
        userCount: room.users.size,
        createdAt: room.createdAt
    }));
    res.json(rooms);
});

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

            // Notify others in room
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
    socket.on('send-message', ({ roomName, message, username }: SendMessageData) => {
        try {
            if (!socket.data.userId || !socket.data.username) {
                socket.emit('error', 'User not authenticated');
                return;
            }

            const chatMessage: ChatMessage = {
                id: Types.ObjectId.toString(),
                message: message.trim(),
                username,
                userId: socket.data.userId,
                roomName,
                timestamp: new Date()
            };

            // Validate message
            if (!chatMessage.message || chatMessage.message.length > 1000) {
                socket.emit('error', 'Invalid message');
                return;
            }

            // Broadcast message to all users in the room
            io.to(roomName).emit('receive-message', chatMessage);

            console.log(`Message in ${roomName} from ${username}: ${message}`);
        } catch (error) {
            console.error('Error sending message:', error);
            socket.emit('error', 'Failed to send message');
        }
    });

    // Handle typing indicators
    socket.on('typing', ({ roomName, username }: Omit<TypingData, 'isTyping'>) => {
        socket.to(roomName).emit('user-typing', {
            username,
            roomName,
            isTyping: true
        });
    });

    socket.on('stop-typing', ({ roomName, username }: Omit<TypingData, 'isTyping'>) => {
        socket.to(roomName).emit('user-typing', {
            username,
            roomName,
            isTyping: false
        });
    });

    // Handle disconnection
    socket.on('disconnect', (reason) => {
        console.log('User disconnected:', socket.id, 'Reason:', reason);

        if (socket.data.userId && socket.data.username) {
            // Remove user from all rooms
            const roomsLeft = roomManager.removeUserFromAllRooms(socket.data.userId);

            // Notify all rooms the user left
            roomsLeft.forEach(roomName => {
                const roomUsers = roomManager.getRoomUsers(roomName);
                io.to(roomName).emit('room-users', { users: roomUsers });

                io.to(roomName).emit('user-left', {
                    message: `${socket.data.username} disconnected`,
                    username: socket.data.username!,
                    userId: socket.data.userId!,
                    timestamp: new Date()
                });
            });
        }
    });
});

// Error handling
io.engine.on("connection_error", (err) => {
    console.log('Connection error:', err.req, err.code, err.message, err.context);
});

//Middleware
app.use(express.json());
app.use(cors(
    {
        credentials: true,
        origin: 'http://localhost:5173'
    }
));

app.use(cookieParser());
connectDB();

// Routes
app.use('/api', userRoutes);
app.use('/api', postRoutes)

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ message: "Internal Sever Error" });
});




app.listen(config.port, () => {
    console.log("Server started, listening to port", config.port);
});