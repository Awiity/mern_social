import { Request, Response } from 'express';
import { MessageModel, messageSchema, IMessage } from '../models/message.model';
import { RoomModel } from '../models/room.model';
import mongoose from 'mongoose';
import { z } from 'zod';
import SSEController from './sse.controller';

export class MessageController {
    private sseController: SSEController;

    constructor() {
        this.sseController = new SSEController();
    }

    async createMessage(req: Request, res: Response) {
        try {
            console.log('Creating message with data:', req.body);
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

            const messageData = {
                id: savedMessage._id,
                content: savedMessage.content,
                username: (savedMessage.user_id as any).username,
                userId: (savedMessage.user_id as any)._id,
                roomId: (savedMessage.room_id as any)._id,
                roomName: (savedMessage.room_id as any).name,
                timestamp: savedMessage.createdAt
            };

            this.sseController.sendMessageToRoom(validatedData.room_id, messageData);

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

    async getMessagesByRoom(req: Request, res: Response) {
        try {
            const { roomId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;
            const skip = (page - 1) * limit;

            if (!mongoose.Types.ObjectId.isValid(roomId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid room ID format'
                });
            }

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
                    messages: messages.reverse(), 
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

    async getMessageById(req: Request, res: Response) {
        try {
            const { messageId } = req.params;

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

    async updateMessage(req: Request, res: Response) {
        try {
            const { messageId } = req.params;
            const { content } = req.body;

            if (!mongoose.Types.ObjectId.isValid(messageId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid message ID format'
                });
            }

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

    async deleteMessage(req: Request, res: Response) {
        try {
            const { messageId } = req.params;

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

    async getMessagesByUser(req: Request, res: Response) {
        try {
            const { userId } = req.params;
            const page = parseInt(req.query.page as string) || 1;
            const limit = parseInt(req.query.limit as string) || 50;
            const skip = (page - 1) * limit;

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

    async searchMessages(req: Request, res: Response) {
        try {
            const { roomId } = req.params;
            const { query, page = 1, limit = 20 } = req.query;

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