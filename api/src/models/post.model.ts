import { string, z } from 'zod';
import mongoose, { Document } from "mongoose";

// fixed date snapshotting. cause: calling Date.now() or new Date made it so createdAt and updatedAt
// were stuck with snapshotted value - fix: pass Date.now function as default for these properties
export const postSchema = z.object({
    title: z.string().min(3),
    body: z.string().optional(),
    user_id: z.string(),
    file: z.string().optional()
});

export type IPost = z.infer<typeof postSchema>;

export interface IPostDocument extends IPost {
    _id: string,
    createdAt: Date,
    updatedAt: Date,
    file: string
};

const postMongooseSchema = new mongoose.Schema<IPostDocument>({
    title: { type: String, required: true },
    body: { type: String, required: false },
    user_id: { type: String, required: true },
    file: { type: String, required: false },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export const PostModel = mongoose.model<IPostDocument>('Post', postMongooseSchema);