import mongoose, { Document } from "mongoose";
import { z } from "zod";

export const messageSchema = z.object({
    content: z.string().min(1, "Message cannot be empty"),
    user_id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid user ID format"
    }),
    room_id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid room ID format"
    })
});

export type IMessage = z.infer<typeof messageSchema>;

export interface IMessageWithUserId {
    content: string;
    user_id: mongoose.Types.ObjectId;
    room_id: mongoose.Types.ObjectId;
}

export interface IMessageDocument extends IMessageWithUserId, Document {
    createdAt: Date;
    updatedAt: Date;
}

const messageMongooseSchema = new mongoose.Schema<IMessageDocument>({
    content: { type: String, required: true },
    user_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true, 
        ref: "User" 
    },
    room_id: { 
        type: mongoose.Schema.Types.ObjectId, 
        required: true, 
        ref: "Room" 
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export const MessageModel = mongoose.model<IMessageDocument>('Message', messageMongooseSchema);