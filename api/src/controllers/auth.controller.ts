import { Request, Response } from "express";
import { UserModel, userSchema } from "../models/user.model";
import { ApiError } from "../utils/apiError";
import { generateTokens, verifyToken } from "../utils/jwt";
import { strict } from "assert";
import bcrypt, { genSalt } from "bcrypt";
import { register } from "module";

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
            const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
            if (!refreshToken) throw new ApiError(401, "Refresh token required");

            const decoded = verifyToken(refreshToken);
            const user = await UserModel.findOne(decoded.userId);

            if (!user || refreshToken !== user.refreshToken) throw new ApiError(401, "Invalid refresh token");

            const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);

            user.refreshToken = newRefreshToken;
            await user.save();

            res.json({ accessToken, refreshToken: newRefreshToken });
        } catch (error) {
            ApiError.handle(error, res);
        };
    },
    async logout(req: Request, res: Response) {
        try {
            const userId = req.body.user?.userId;
            await UserModel.findOneAndUpdate(userId, { refreshToken: null });

            res.clearCookie('accessToken');
            res.clearCookie('refreshToken');
            res.status(204).send()
        } catch (error) {
            ApiError.handle(error, res);
        }
    }
};  