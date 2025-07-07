import mongoose, { Document } from "mongoose";
import { z } from "zod";

export const roomsSchema = z.object({
    name: z.string().min(1, "Room name is required"),
    type: z.enum(['general', 'private', 'group']).default('group'),
    users: z.array(z.object({
        id: z.string(),
        username: z.string(),
        socketId: z.string().optional()
    })).optional(),
    isActive: z.boolean().default(true),
    lastActivity: z.date().optional()
});

export type IRoom = z.infer<typeof roomsSchema>;

export interface IRoomWithUsers {
    name: string;
    type: 'general' | 'private' | 'group';
    isActive?: boolean;
    lastActivity?: Date;
    users?: { id: string; username: string; socketId: string }[];
}

export interface IRoomDocument extends IRoomWithUsers, Document {
    createdAt: Date;
    updatedAt: Date;
}

const roomSchema = new mongoose.Schema<IRoomDocument>({
    name: { type: String, required: true },
    type: { type: String, enum: ['general', 'private', 'group'], default: 'group' },
    users: [{
        _id: false,
        id: { type: String, required: true },
        username: { type: String, required: true },
        socketId: { type: String, required: false }
    }],
    isActive: { type: Boolean, default: true },
    lastActivity: { type: Date, default: Date.now },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export const RoomModel = mongoose.model<IRoomDocument>('Room', roomSchema);
// This code defines the Room model for a chat application using Mongoose and Zod for validation.