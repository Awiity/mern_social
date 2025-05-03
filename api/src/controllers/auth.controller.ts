import { Request, Response } from "express";
import { UserModel, userSchema } from "../models/user.model";
import { ApiError } from "../utils/apiError";
import { generateTokens }  from "../utils/jwt";
import bcrypt, { genSalt } from "bcrypt";
import jwt from "jsonwebtoken";
import config from "../config/config";

const SALT_FACTOR: number = 12;

export const AuthController = {
    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            if (!email || !password) throw new ApiError(400, 'Email and password required');

            const user = await UserModel.findOne({ email }).select('+password');
            if (!user) throw new ApiError(401, "Invalid credentials");
            const isValid = await user.comparePassword(password);
            if (!isValid) throw new ApiError(401, "Invalid credentials");
            const { accessToken, refreshToken } = generateTokens(user);
            user.refreshToken = refreshToken;
            console.log("tokens are being set", accessToken, refreshToken)
            res.cookie("accessToken", accessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 15 * 60 * 1000,                         // 15min
                sameSite: 'strict'
            });
            res.cookie("refreshToken", refreshToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                maxAge: 24 * 60 * 60 * 1000,                         // 24 hours
                sameSite: 'strict'
            });

            res.json({
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            })
        } catch (error) {
            ApiError.handle(error, res);
        };
    },

    async register(req: Request, res: Response) {
        try {
            const parsedData = userSchema.parse(req.body);
            const existingUser = await UserModel.findOne({ email: parsedData.email });
            if (existingUser) throw new ApiError(409, "Email already exists")
            // password hashiong
            const salt = await genSalt(SALT_FACTOR);
            const hashedPassword = await bcrypt.hash(parsedData.password, salt);
            parsedData.password = hashedPassword;

            const newUser = await UserModel.create(parsedData);
            res.status(201).json(newUser);
        } catch (error) {
            ApiError.handle(error, res);
        }

    },

    async refreshToken(req: Request, res: Response) {
        try {
            const userId = (req as any).userId;
            const refreshToken = req.cookies.refreshToken;

            const user = await UserModel.findById(userId);

            if (!user || !refreshToken) {
                throw new ApiError(401, "Unauthorized")
            }

            if (user.refreshToken !== refreshToken) throw new ApiError(401, "Unauthorized")
            const newAccessToken = jwt.sign(
                { userId: user.id },
                config.jwt_secret,
                { expiresIn: config.access_token_expiry as any },
            );
            res.cookie('accessToken', newAccessToken, {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                maxAge: 15 * 60 * 1000,
                sameSite: 'strict'
            });

            res.status(200).json("token refreshed successfully");
            console.log("refreshed token");
        } catch (error) {
            ApiError.handle(error, res);
        };
    },
    async logout(req: Request, res: Response) {
        try {
            const userId = (req as any).userId;
            await UserModel.findOneAndUpdate({ _id: userId }, { refreshToken: null });

            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
            res.status(204).send()
        } catch (error) {
            ApiError.handle(error, res);
        }
    },
    async authme(req: Request, res: Response) {
        //console.log("hit");
        try {
            const token = await req.cookies.accessToken;
            if (!token) AuthController.refreshToken(req, res)
            const userId = (jwt.verify(token, config.jwt_secret) as jwt.JwtPayload).userId;
            const user = await UserModel.findOne({ _id: userId }).select(
                "-password -__v -lastname -description -address -createAt -updatedAt -refreshToken" //query
                    ).exec();
            //console.log("mememem: ",user);
            if (!user) throw new ApiError(404, "User was not found");
            res.status(200).json(user);
        } catch (error) {
            if (error instanceof jwt.TokenExpiredError) AuthController.refreshToken(req, res);
            ApiError.handle(error, res);
        }
    }
};  