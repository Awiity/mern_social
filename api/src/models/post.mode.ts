import { z } from 'zod';
import mongoose, { Document } from "mongoose";
import bcrypt from 'bcrypt';

export const postSchema = z.object({
    title: z.string().min(3),
    body: z.string().optional(),
    user_id: z.string(),
    file_attached: z.string(),
    createdAt: z.date().default(new Date()),
    updatedAt: z.date().default(new Date())  
});

export type IPost = z.infer<typeof postSchema>;

export interface IPostDocument extends IPost {
    _id: string
};

const postMongooseSchema = new mongoose.Schema<IPostDocument>({
    title: { type: String, required: true },
    body: { type: String, required: false },
    user_id: { type: String, required: true },
    file_attached: { type: String, required: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export const PostModel = mongoose.model<IPostDocument>('Post', postMongooseSchema);