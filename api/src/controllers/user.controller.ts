import { Request, Response } from "express";
import { userSchema, IUserDocument, IUser, UserModel } from "../models/user.model";
import { ApiError } from "../utils/apiError";
import bcrypt, { genSalt } from 'bcrypt';
import { parse } from "path";
import { register } from "module";

const SALT_FACTOR = 12;

export const UserController = {
    async getAll(req: Request, res: Response) {
        try {
            const users = await UserModel.find();
            res.status(200).json(users)
        } catch (error) {
            ApiError.handle(error, res);
        }
    },

    async register(req: Request, res: Response) {
        try {
            const newUserData: IUser = req.body;
            const existingUser = await UserModel.find({email: newUserData.email}).select('+email').exec();
            
            if (existingUser) throw new ApiError(403, "User with that E-mail already exists, please login");

            const user = await UserModel.create(newUserData);
            
        } catch (error) {
            console.log(error);
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

Include last login tracking

Implement session management

Add logging for security events

Add request validation middleware

*/