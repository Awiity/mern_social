import { Request, Response } from "express";
import { ApiError } from "../utils/apiError";
import { PostModel, postSchema } from "../models/post.model";
import { handleUpload } from "../utils/cloudinary";
import { MulterRequest } from "../middleware/multer.shabim";

declare global {
    namespace Express {
        interface Request {
            userId: string,
            role: string
        }
    }
}
/*
    export interface UploadApiResponse {
        public_id: string;
        version: number;
        signature: string;
        width: number;
        height: number;
        format: string;
        resource_type: "image" | "video" | "raw" | "auto";
        created_at: string;
        tags: Array<string>;
        pages: number;
        bytes: number;
        type: string;
        etag: string;
        placeholder: boolean;
        url: string;
        secure_url: string;
        access_mode: string;
        original_filename: string;
        moderation: Array<string>;
        access_control: Array<string>;
        context: object; //won't change since it's response, we need to discuss documentation team about it before implementing.
        metadata: object; //won't change since it's response, we need to discuss documentation team about it before implementing.
        colors?: [string, number][];

        [futureKey: string]: any;
    } */
export const PostController = {

    async create(req: Request, res: Response) {
        try {
            const parsedData = postSchema.parse(req.body);
            if (req.file) {
                const b64 = Buffer.from(req.file!.buffer).toString('base64');
                let dataURI = 'data:' + req.file!.mimetype + ';base64,' + b64;
                const cldRes = await handleUpload(dataURI);
                parsedData.file = cldRes.secure_url;
            }

            const newPost = await PostModel.create(parsedData);
            res.status(200).json(newPost);
        } catch (error) {
            ApiError.handle(error, res);
        }
    },

    async getAll(req: Request, res: Response) {
        try {
            const posts = await PostModel.find().sort({ createdAt: -1 }); // [0...n] 0 - latest post
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