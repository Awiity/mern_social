import { Request, Response } from 'express';
import { RoomModel, roomsSchema, IRoom } from '../models/room.model';
import { MessageModel } from '../models/message.model';
import mongoose from 'mongoose';

export class RoomController {
    // Create a new room
    async createRoom(req: Request, res: Response): Promise<void> {
        try {
            const validatedData = roomsSchema.parse(req.body);

            // Check if room already exists
            const existingRoom = await RoomModel.findOne({ name: validatedData.name });
            if (existingRoom) {
                res.status(409).json({ error: 'Room already exists' });
                return;
            }

            const room = new RoomModel({
                name: validatedData.name,
                users: validatedData.users || []
            });

            const savedRoom = await room.save();

            res.status(201).json({
                success: true,
                message: 'Room created successfully',
                data: savedRoom
            });
        } catch (error) {
            if (error instanceof Error) {
                res.status(400).json({
                    error: 'Failed to create room',
                    details: error.message
                });
            } else {
                res.status(500).json({ error: 'Internal server error' });
            }
        }
    }

    // Get all rooms
    async getAllRooms(req: Request, res: Response): Promise<void> {
        try {
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const skip = (page - 1) * limit;

            const rooms = await RoomModel.find()
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const totalRooms = await RoomModel.countDocuments();

            // Add user count and message count for each room
            const roomsWithStats = await Promise.all(
                rooms.map(async (room) => {
                    const messageCount = await MessageModel.countDocuments({ room_id: room._id });
                    return {
                        ...room.toObject(),
                        userCount: room.users ? room.users.length : 0,
                        messageCount
                    };
                })
            );

            res.json({
                success: true,
                data: {
                    rooms: roomsWithStats,
                    pagination: {
                        currentPage: page,
                        totalPages: Math.ceil(totalRooms / limit),
                        totalRooms,
                        hasMore: skip + rooms.length < totalRooms
                    }
                }
            });
        } catch (error) {
            console.error('Error getting rooms:', error);
            res.status(500).json({ error: 'Failed to retrieve rooms' });
        }
    }

    // Get a specific room by ID
    async getRoomById(req: Request, res: Response): Promise<void> {
        try {
            const { roomId } = req.params;

            if (!mongoose.Types.ObjectId.isValid(roomId)) {
                res.status(400).json({ error: 'Invalid room ID format' });
                return;
            }

            const room = await RoomModel.findById(roomId);
            if (!room) {
                res.status(404).json({ error: 'Room not found' });
                return;
            }

            // Get message count for this room
            const messageCount = await MessageModel.countDocuments({ room_id: roomId });

            res.json({
                success: true,
                data: {
                    ...room.toObject(),
                    userCount: room.users ? room.users.length : 0,
                    messageCount
                }
            });
        } catch (error) {
            console.error('Error getting room:', error);
            res.status(500).json({ error: 'Failed to retrieve room' });
        }
    }

    // Get room by name
    async getRoomByName(req: Request, res: Response): Promise<void> {
        try {
            const { roomName } = req.params;

            if (!roomName || roomName.trim().length === 0) {
                res.status(400).json({ error: 'Room name is required' });
                return;
            }

            const room = await RoomModel.findOne({ name: roomName.trim() });
            if (!room) {
                res.status(404).json({ error: 'Room not found' });
                return;
            }

            // Get message count for this room
            const messageCount = await MessageModel.countDocuments({ room_id: room._id });

            res.json({
                success: true,
                data: {
                    ...room.toObject(),
                    userCount: room.users ? room.users.length : 0,
                    messageCount
                }
            });
        } catch (error) {
            console.error('Error getting room by name:', error);
            res.status(500).json({ error: 'Failed to retrieve room' });
        }
    }

    // Update a room
    async updateRoom(req: Request, res: Response): Promise<void> {
        try {
            const { roomId } = req.params;
            const { name } = req.body;

            if (!mongoose.Types.ObjectId.isValid(roomId)) {
                res.status(400).json({ error: 'Invalid room ID format' });
                return;
            }

            if (!name || name.trim().length === 0) {
                res.status(400).json({ error: 'Room name is required' });
                return;
            }

            // Check if another room with this name exists
            const existingRoom = await RoomModel.findOne({
                name: name.trim(),
                _id: { $ne: roomId }
            });
            if (existingRoom) {
                res.status(409).json({ error: 'Room name already exists' });
                return;
            }

            const room = await RoomModel.findByIdAndUpdate(
                roomId,
                {
                    name: name.trim(),
                    updatedAt: new Date()
                },
                { new: true, runValidators: true }
            );

            if (!room) {
                res.status(404).json({ error: 'Room not found' });
                return;
            }

            res.json({
                success: true,
                message: 'Room updated successfully',
                data: room
            });
        } catch (error) {
            console.error('Error updating room:', error);
            res.status(500).json({ error: 'Failed to update room' });
        }
    }

    // Delete a room
    async deleteRoom(req: Request, res: Response): Promise<void> {
        try {
            const { roomId } = req.params;

            if (!mongoose.Types.ObjectId.isValid(roomId)) {
                res.status(400).json({ error: 'Invalid room ID format' });
                return;
            }

            const room = await RoomModel.findByIdAndDelete(roomId);
            if (!room) {
                res.status(404).json({ error: 'Room not found' });
                return;
            }

            // Also delete all messages in this room
            await MessageModel.deleteMany({ room_id: roomId });

            res.json({
                success: true,
                message: 'Room and all its messages deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting room:', error);
            res.status(500).json({ error: 'Failed to delete room' });
        }
    }

    // Add user to room
    async addUserToRoom(req: Request, res: Response): Promise<void> {
        try {
            const { roomId } = req.params;
            const { user } = req.body;

            if (!mongoose.Types.ObjectId.isValid(roomId)) {
                res.status(400).json({ error: 'Invalid room ID format' });
                return;
            }

            if (!user || !user.id || !user.username || !user.socketId) {
                res.status(400).json({ error: 'User data is required (id, username, socketId)' });
                return;
            }

            const room = await RoomModel.findById(roomId);
            if (!room) {
                res.status(404).json({ error: 'Room not found' });
                return;
            }

            // Check if user is already in the room
            const userExists = room.users?.some(u => u.id === user.id);
            if (userExists) {
                res.status(409).json({ error: 'User already in room' });
                return;
            }

            // Add user to room
            room.users = room.users || [];
            room.users.push(user);
            room.updatedAt = new Date();

            await room.save();

            res.json({
                success: true,
                message: 'User added to room successfully',
                data: room
            });
        } catch (error) {
            console.error('Error adding user to room:', error);
            res.status(500).json({ error: 'Failed to add user to room' });
        }
    }

    // Remove user from room
    async removeUserFromRoom(req: Request, res: Response): Promise<void> {
        try {
            const { roomId, userId } = req.params;

            if (!mongoose.Types.ObjectId.isValid(roomId)) {
                res.status(400).json({ error: 'Invalid room ID format' });
                return;
            }

            const room = await RoomModel.findById(roomId);
            if (!room) {
                res.status(404).json({ error: 'Room not found' });
                return;
            }

            if (!room.users || room.users.length === 0) {
                res.status(404).json({ error: 'User not found in room' });
                return;
            }

            // Remove user from room
            const initialUserCount = room.users.length;
            room.users = room.users.filter(u => u.id !== userId);

            if (room.users.length === initialUserCount) {
                res.status(404).json({ error: 'User not found in room' });
                return;
            }

            room.updatedAt = new Date();
            await room.save();

            res.json({
                success: true,
                message: 'User removed from room successfully',
                data: room
            });
        } catch (error) {
            console.error('Error removing user from room:', error);
            res.status(500).json({ error: 'Failed to remove user from room' });
        }
    }

    // Get room statistics
    async getRoomStats(req: Request, res: Response): Promise<void> {
        try {
            const { roomId } = req.params;

            if (!mongoose.Types.ObjectId.isValid(roomId)) {
                res.status(400).json({ error: 'Invalid room ID format' });
                return;
            }

            const room = await RoomModel.findById(roomId);
            if (!room) {
                res.status(404).json({ error: 'Room not found' });
                return;
            }

            // Get message statistics
            const messageCount = await MessageModel.countDocuments({ room_id: roomId });
            const lastMessage = await MessageModel.findOne({ room_id: roomId })
                .sort({ createdAt: -1 })
                .populate('user_id', 'username');

            // Get messages per day for the last week
            const lastWeek = new Date();
            lastWeek.setDate(lastWeek.getDate() - 7);

            const messagesPerDay = await MessageModel.aggregate([
                {
                    $match: {
                        room_id: new mongoose.Types.ObjectId(roomId),
                        createdAt: { $gte: lastWeek }
                    }
                },
                {
                    $group: {
                        _id: {
                            $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                        },
                        count: { $sum: 1 }
                    }
                },
                { $sort: { _id: 1 } }
            ]);

            res.json({
                success: true,
                data: {
                    room: {
                        id: room._id,
                        name: room.name,
                        createdAt: room.createdAt,
                        userCount: room.users ? room.users.length : 0,
                        users: room.users || []
                    },
                    stats: {
                        totalMessages: messageCount,
                        lastMessage,
                        messagesPerDay
                    }
                }
            });
        } catch (error) {
            console.error('Error getting room stats:', error);
            res.status(500).json({ error: 'Failed to retrieve room statistics' });
        }
    }

    // Search rooms
    async searchRooms(req: Request, res: Response): Promise<void> {
        try {
            const { query } = req.query;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 20;
            const skip = (page - 1) * limit;

            if (!query || typeof query !== 'string') {
                res.status(400).json({ error: 'Search query is required' });
                return;
            }

            const rooms = await RoomModel.find({
                name: { $regex: query, $options: 'i' }
            })
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const totalRooms = await RoomModel.countDocuments({
                name: { $regex: query, $options: 'i' }
            });

            // Add user count and message count for each room
            const roomsWithStats = await Promise.all(
                rooms.map(async (room) => {
                    const messageCount = await MessageModel.countDocuments({ room_id: room._id });
                    return {
                        ...room.toObject(),
                        userCount: room.users ? room.users.length : 0,
                        messageCount
                    };
                })
            );

            res.json({
                success: true,
                data: {
                    rooms: roomsWithStats,
                    searchQuery: query,
                    pagination: {
                        currentPage: page,
                        totalPages: Math.ceil(totalRooms / limit),
                        totalRooms,
                        hasMore: skip + rooms.length < totalRooms
                    }
                }
            });
        } catch (error) {
            console.error('Error searching rooms:', error);
            res.status(500).json({ error: 'Failed to search rooms' });
        }
    }
}