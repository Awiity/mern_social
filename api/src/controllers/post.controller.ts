import { Request, Response } from "express";
import mongoose from "mongoose";
import { ApiError } from "../utils/apiError";
import { generateTokens} from "../utils/jwt";
import { PostModel, postSchema } from "../models/post.model";
declare global {
    namespace Express {
        interface Request {
            userId: string,
            role: string
        }
    }
}
export const PostController = {

    async create(req: Request, res: Response) {
        try {
            const parsedData = postSchema.parse(req.body);

            const newPost = await PostModel.create(parsedData);
            res.status(200).json(newPost);
        } catch (error) {
            ApiError.handle(error, res);
        }
    },

    async getAll(req: Request, res: Response) {
        try {
            const posts = await PostModel.find().sort({createdAt: -1}); // [0...n] 0 - latest post
            res.status(200).json(posts);
        } catch (error) {
            ApiError.handle(error, res);
        }
    },

    async delete(req: Request, res: Response) {
        try {
            const tbdPost = await PostModel.findByIdAndDelete(req.params.id);
            if (!tbdPost) throw new ApiError(404, "Post not found.");
            res.status(200).send();
        } catch (error) {
            ApiError.handle(error, res);
        }
    },

    async update(req: Request, res: Response) {
        try {
            const parsedData = postSchema.parse(req.body);
            const updatedPost = postSchema.partial();

            const post = await PostModel.findById(req.params.id);
            if (!post) throw new ApiError(404, "Post not found.");

            // Implement permission check.
            if (req.userId !== parsedData.user_id || req.role !== 'admin') throw new ApiError(403, "Not enough permissions.");

            Object.assign(post, parsedData);
            const updatePost = post.save();
            res.status(200).json(updatePost);
        } catch (error) {
            ApiError.handle(error, res);
        }
    },

    async getById(req: Request, res: Response) {
        try {
            const post = await PostModel.findById(req.params.id);
            if (!post) throw new ApiError(404, "Post not found");

            res.status(200).json(post);
        } catch (error) {
            ApiError.handle(error, res);
        }
    }

}