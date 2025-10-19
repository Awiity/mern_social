import { Request, Response } from 'express';
import { LikeModel } from '../models/likes.model';

export class LikeController {

    async createLike(req: Request, res: Response) {
        try {
            const { user_id, post_id } = req.body;
            const existingLike = await LikeModel.findOne({ user_id, post_id });

            if (existingLike) {
                return res.status(400).send({ error: "Like already exists" });
            }

            const newLike = new LikeModel({
                user_id,
                post_id
            });
            await newLike.save();

            res.status(201).json(newLike);
        } catch (error) {
            console.error("Error creating like:", error);
            res.status(500).send({ error: "Failed to create like" });
            
        }
    }
    async deleteLike(req: Request, res: Response) {
        try {
            const { likeId } = req.params;
            const like = await LikeModel.findOneAndDelete({_id: likeId});
            if (!like) {
                return res.status(404).send({ error: "Like not found" });
            }
            res.status(200).send({ message: "Like deleted" });
        } catch (error) {
            console.error("Error deleting like:", error);
            res.status(500).send({ error: "Failed to delete like" });
        }
    }
    async getLikesByPostId(req: Request, res: Response) {
        try {
            const { postId: post_id } = req.params;
            if (!post_id) {
                return res.status(400).send({ error: "Post ID is required" });
            }

            const likes = await LikeModel.find({ post_id });
            res.status(200).send(likes);
        } catch (error) {
            console.error("Error fetching likes:", error);
            res.status(500).send({ error: "Failed to fetch likes" });
        }
    }
}