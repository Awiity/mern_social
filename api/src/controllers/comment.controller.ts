import { Request, Response } from 'express';
import { CommentModel } from '../models/comment.model';

export class CommentController {
    async createComment(req: Request, res: Response) {
        try {
            const { user_id, post_id, content } = req.body;
            if (!user_id || !post_id || !content) {
                return res.status(400).send({ error: "Missing required fields" });
            }

            const newComment = new CommentModel({
                user_id,
                post_id,
                content
            });

            await newComment.save();

            res.status(201).json(newComment);
        } catch (error) {
            console.error("Error creating comment:", error);
            res.status(500).send({ error: "Failed to create comment" });
        }
    }

    async deleteComment(req: Request, res: Response) {
        try {
            const { commentId } = req.params;
            const comment = await CommentModel.findOneAndDelete({ _id: commentId });
            if (!comment) {
                return res.status(404).send({ error: "Comment not found" });
            }
            res.status(200).send({ message: "Comment deleted" });
        } catch (error) {
            console.error("Error deleting comment:", error);
            res.status(500).send({ error: "Failed to delete comment" });
        }
    }

    async getCommentsByPostId(req: Request, res: Response) {
        try {
            const { postId: post_id } = req.params;
            if (!post_id) {
                return res.status(400).send({ error: "Post ID is required" });
            }

            const comments = await CommentModel.find({ post_id }).populate('user_id', 'username');
            res.status(200).send(comments);
        } catch (error) {
            console.error("Error fetching comments:", error);
            res.status(500).send({ error: "Failed to fetch comments" });
        }
    }
    async getCommentCountByPostId(req: Request, res: Response) {
        try {
            // console.log("Fetching comment count for post ID:", req.params);

            const { postId: post_id } = req.params;
            if (!post_id) {
                return res.status(400).send({ error: "Post ID is required" });
            }

            const count = await CommentModel.countDocuments({ post_id });
            // console.log("Comment count for post ID:", post_id, "is", count);
            res.status(200).send(count);
        } catch (error) {
            console.error("Error fetching comment count:", error);
            res.status(500).send({ error: "Failed to fetch comment count" });
        }
    }
}