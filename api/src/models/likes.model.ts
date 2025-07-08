import mongoose from "mongoose";
import { z } from "zod";

export const likeSchema = z.object({
    user_id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid user ID format"
    }),
    post_id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid message ID format"
    })
});

export type ILike = z.infer<typeof likeSchema>;

export interface ILikeWithUserId {
    user_id: mongoose.Types.ObjectId;
    post_id: mongoose.Types.ObjectId;
}

export interface ILikeDocument extends ILikeWithUserId, mongoose.Document {
    createdAt: Date;
    updatedAt: Date;
}

const likeMongooseSchema = new mongoose.Schema<ILikeDocument>({
    user_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "User"
    },
    post_id: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: "Post"
    },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

export const LikeModel = mongoose.model<ILikeDocument>('Like', likeMongooseSchema);