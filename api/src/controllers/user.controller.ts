import { Request, Response } from "express";
import { userSchema, IUserDocument, IUser, UserModel } from "../models/user.model";
import mongoose from "mongoose";
import { ApiError } from "../utils/apiError";
import { generateToken, verifyToken } from "../utils/jwt";

export const UserController = {

    async create(req: Request, res: Response) {
        try {
            const parsedData = userSchema.parse(req.body);
            const existingUser = await UserModel.findOne({ email: parsedData.email });
            if (existingUser) throw new ApiError(409, "Email already exists")

            const newUser = await UserModel.create(parsedData);
            res.status(201).json(newUser);
        } catch (error) {
            ApiError.handle(error, res);
        }

    },

    async getAll(req: Request, res: Response) {
        try {
            const users = await UserModel.find();
            res.status(200).json(users)
        } catch (error) {
            ApiError.handle(error, res);
        }
    },

    async delete(req: Request, res: Response) {
        try {
            const user = await UserModel.findByIdAndDelete(req.params.id);
            if (!user) throw new ApiError(404, "User not found");
            res.status(204).send()
        } catch (error) {
            ApiError.handle(error, res);
        }
    },

    async update(req: Request, res: Response) {
        try {
            const updateSchema = userSchema.partial();
            const parsedData = userSchema.parse(req.body);

            const user = await UserModel.findById(req.params.id);

            if (!user) {
                throw new ApiError(404, "User not found");
            }

            if (parsedData.password && user) user.password = parsedData.password;

            if (user && parsedData.email && parsedData.email !== user.email) {
                const existingUser = await UserModel.findOne({ email: parsedData.email });
                if (existingUser) throw new ApiError(409, "User with that email alredy exists");
                user.email = parsedData.email;
            }

            Object.assign(user, parsedData);
            const updateUser = user.save();

            res.status(200).json(updateUser);
        } catch (error) {
            ApiError.handle(error, res)
        }
    },

    async getById(req: Request, res: Response) {
        try {
            const user = await UserModel.findById(req.params.id).select('-password');

            if (!user) throw new ApiError(404, "User not found");

            res.status(200).json(user);
        } catch (error) {
            ApiError.handle(error, res);
        }
    }
}

/* TODO:

Implement JWT authentication middleware

Include last login tracking

Implement session management

Add logging for security events

Add request validation middleware

*/