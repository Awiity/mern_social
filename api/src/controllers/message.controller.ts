import { Request, Response } from 'express';
import { MessageModel, messageSchema, IMessage } from '../models/message.model';
import { RoomModel } from '../models/room.model';
import mongoose from 'mongoose';
import { z } from 'zod';

export class MessageController {
    async createMessage(req: Request, res: Response) {
        try {
            const validatedData = messageSchema.parse(req.body);
            console.log('Message incoming: ', validatedData);

            const roomExists = await RoomModel.findById(validatedData.room_id);
            if (!roomExists) {
                return res.status(404).json({
                    success: false,
                    message: 'Room not found'
                });
            }

            const message = new MessageModel({
                content: validatedData.content,
                user_id: new mongoose.Types.ObjectId(validatedData.user_id),
                room_id: new mongoose.Types.ObjectId(validatedData.room_id)
            });

            const savedMessage = await message.save();
            await savedMessage.populate('user_id', 'username email');
            await savedMessage.populate('room_id', 'name');

            res.status(201).json({
                success: true,
                message: 'Message created successfully',
                data: savedMessage
            });
        } catch (error) {
            if (error instanceof z.ZodError) {
                return res.status(400).json({
                    success: false,
                    message: 'Validation error',
                    errors: error.errors
                });
            }

            console.error('Error creating message:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get messages for a specific room with pagination
    async getMessagesByRoom(req: Request, res: Response) {
        try {
            const { roomId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;
            const skip = (page - 1) * limit;

            // Validate ObjectId
            if (!mongoose.Types.ObjectId.isValid(roomId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid room ID format'
                });
            }

            // Check if room exists
            const roomExists = await RoomModel.findById(roomId);
            if (!roomExists) {
                return res.status(404).json({
                    success: false,
                    message: 'Room not found'
                });
            }

            const messages = await MessageModel.find({ room_id: roomId })
                .populate('user_id', 'username email')
                .populate('room_id', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const totalMessages = await MessageModel.countDocuments({ room_id: roomId });
            const totalPages = Math.ceil(totalMessages / limit);
            res.status(200).json({
                success: true,
                data: {
                    messages: messages.reverse(), // Reverse to show oldest first
                    pagination: {
                        currentPage: page,
                        totalPages,
                        totalMessages,
                        limit,
                        hasNext: page < totalPages,
                        hasPrev: page > 1
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching messages:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get a specific message by ID
    async getMessageById(req: Request, res: Response) {
        try {
            const { messageId } = req.params;

            // Validate ObjectId
            if (!mongoose.Types.ObjectId.isValid(messageId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid message ID format'
                });
            }

            const message = await MessageModel.findById(messageId)
                .populate('user_id', 'username email')
                .populate('room_id', 'name');

            if (!message) {
                return res.status(404).json({
                    success: false,
                    message: 'Message not found'
                });
            }

            res.status(200).json({
                success: true,
                data: message
            });
        } catch (error) {
            console.error('Error fetching message:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Update a message (only content can be updated)
    async updateMessage(req: Request, res: Response) {
        try {
            const { messageId } = req.params;
            const { content } = req.body;

            // Validate ObjectId
            if (!mongoose.Types.ObjectId.isValid(messageId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid message ID format'
                });
            }

            // Validate content
            if (!content || content.trim().length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Message content cannot be empty'
                });
            }

            const message = await MessageModel.findById(messageId);
            if (!message) {
                return res.status(404).json({
                    success: false,
                    message: 'Message not found'
                });
            }

            // Update message
            message.content = content.trim();
            message.updatedAt = new Date();
            await message.save();

            await message.populate('user_id', 'username email');
            await message.populate('room_id', 'name');

            res.status(200).json({
                success: true,
                message: 'Message updated successfully',
                data: message
            });
        } catch (error) {
            console.error('Error updating message:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Delete a message
    async deleteMessage(req: Request, res: Response) {
        try {
            const { messageId } = req.params;

            // Validate ObjectId
            if (!mongoose.Types.ObjectId.isValid(messageId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid message ID format'
                });
            }

            const message = await MessageModel.findById(messageId);
            if (!message) {
                return res.status(404).json({
                    success: false,
                    message: 'Message not found'
                });
            }

            await MessageModel.findByIdAndDelete(messageId);

            res.status(200).json({
                success: true,
                message: 'Message deleted successfully'
            });
        } catch (error) {
            console.error('Error deleting message:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Get messages by user
    async getMessagesByUser(req: Request, res: Response) {
        try {
            const { userId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;
            const skip = (page - 1) * limit;

            // Validate ObjectId
            if (!mongoose.Types.ObjectId.isValid(userId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid user ID format'
                });
            }

            const messages = await MessageModel.find({ user_id: userId })
                .populate('user_id', 'username email')
                .populate('room_id', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(limit);

            const totalMessages = await MessageModel.countDocuments({ user_id: userId });
            const totalPages = Math.ceil(totalMessages / limit);

            res.status(200).json({
                success: true,
                data: {
                    messages,
                    pagination: {
                        currentPage: page,
                        totalPages,
                        totalMessages,
                        limit,
                        hasNext: page < totalPages,
                        hasPrev: page > 1
                    }
                }
            });
        } catch (error) {
            console.error('Error fetching user messages:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }

    // Search messages in a room
    async searchMessages(req: Request, res: Response) {
        try {
            const { roomId } = req.params;
            const { query, page = 1, limit = 20 } = req.query;

            // Validate ObjectId
            if (!mongoose.Types.ObjectId.isValid(roomId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid room ID format'
                });
            }

            if (!query || typeof query !== 'string') {
                return res.status(400).json({
                    success: false,
                    message: 'Search query is required'
                });
            }

            const skip = (Number(page) - 1) * Number(limit);

            const messages = await MessageModel.find({
                room_id: roomId,
                content: { $regex: query, $options: 'i' }
            })
                .populate('user_id', 'username email')
                .populate('room_id', 'name')
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(Number(limit));

            const totalMessages = await MessageModel.countDocuments({
                room_id: roomId,
                content: { $regex: query, $options: 'i' }
            });

            const totalPages = Math.ceil(totalMessages / Number(limit));

            res.status(200).json({
                success: true,
                data: {
                    messages,
                    pagination: {
                        currentPage: Number(page),
                        totalPages,
                        totalMessages,
                        limit: Number(limit),
                        hasNext: Number(page) < totalPages,
                        hasPrev: Number(page) > 1
                    },
                    searchQuery: query
                }
            });
        } catch (error) {
            console.error('Error searching messages:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error'
            });
        }
    }
}