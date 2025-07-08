import mongoose from "mongoose";
import { z } from "zod";

export const commentSchema = z.object({
    content: z.string().min(1, "Comment cannot be empty"),
    user_id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid user ID format"
    }),
    post_id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid post ID format"
    })
})

export type IComment = z.infer<typeof commentSchema>;

export interface ICommentWithUserId {
    content: string;
    user_id: mongoose.Types.ObjectId;
    post_id: mongoose.Types.ObjectId;
}

export interface ICommentDocument extends ICommentWithUserId, mongoose.Document {
    createdAt: Date;
    updatedAt: Date;
}

const commentMongooseSchema = new mongoose.Schema<ICommentDocument>({
    content: { type: String, required: true },
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

export const CommentModel = mongoose.model<ICommentDocument>('Comment', commentMongooseSchema);

export const commentWithUserSchema = z.object({
    content: z.string().min(1, "Comment cannot be empty"),
    user_id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid user ID format"
    }),
    post_id: z.string().refine((val) => mongoose.Types.ObjectId.isValid(val), {
        message: "Invalid post ID format"
    }),
});