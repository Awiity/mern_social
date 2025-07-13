import { Request, Response } from "express";
import { userSchema, IUserDocument, IUser, UserModel } from "../models/user.model";
import { ApiError } from "../utils/apiError";
import bcrypt, { genSalt } from 'bcrypt';
import { parse } from "path";
import { register } from "module";
import { handleUploadUserAvatar } from "../utils/cloudinary";

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
            if (req.file) {
                const b64 = Buffer.from(req.file!.buffer).toString('base64');
                let dataURI = 'data:' + req.file!.mimetype + ';base64,' + b64;
                const cldRes = await handleUploadUserAvatar(dataURI);
                newUserData.avatar = cldRes.secure_url;
            }
            const existingUser = await UserModel.find({ email: newUserData.email }).select('+email').exec();

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
            console.log("Updating and shiiiiet")
            const parsedData = userSchema.partial().parse(req.body);
            const user = await UserModel.findById(req.params.id);
            var newData: Object = {};
            
            if (!user) {
                throw new ApiError(404, "User not found");
            }
            if (parsedData.username !== user.username) {
                newData = { ...newData, username: parsedData.username };
                console.log("Username changed to: ", parsedData.username);
            }

            if (parsedData.password && user) { newData = { ...newData, password: parsedData.password }; console.log("Password changed to: ", parsedData.password); }

            if (user && parsedData.email && parsedData.email !== user.email) {
                const existingUser = await UserModel.findOne({ email: parsedData.email });
                if (existingUser) throw new ApiError(409, "User with that email alredy exists");
                newData = { ...newData, email: parsedData.email };
                console.log("Email changed to: ", parsedData.email);
            }
            if (req.file) {
                const b64 = Buffer.from(req.file!.buffer).toString('base64');
                let dataURI = 'data:' + req.file!.mimetype + ';base64,' + b64;
                const cldRes = await handleUploadUserAvatar(dataURI);
                newData = { ...newData, avatar: cldRes.secure_url }
                console.log("Avatar changed to: ", cldRes.secure_url);
            }
            console.log("User data after sign: ", user, newData);

            Object.assign(user, newData);
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