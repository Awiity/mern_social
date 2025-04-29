import { Request, Response } from "express";
import { UserModel } from "../models/user.model";
import { ApiError } from "../utils/apiError";
import { generateToken, verifyToken } from "../utils/jwt";
import { strict } from "assert";

export const AuthController = {
    async login(req: Request, res: Response) {
        try {
            const { email, password } = req.body;
            if (!email || !password) throw new ApiError(400, 'Email and password required');

            const user = await UserModel.findOne({ email }).select('+password');
            if (!user) throw new ApiError(401, "Invalid credentials");
            const isValid = await user.comparePassword(password);
            if (!isValid) throw new ApiError(401, "Invalid credentials");
            console.log("fuck off")
            const { accessToken, refreshToken } = generateToken(user);

            user.refreshToken = refreshToken;

            await user.save();

            res.cookie('accessToken', accessToken, {
                httpOnly: true,
                sameSite: 'strict',
                maxAge: 900000
            });

            res.cookie('refreshToken', refreshToken, {
                httpOnly: true,
                sameSite: 'strict',
                maxAge: 604800000
            });

            res.json({
                accessToken,
                refreshToken,
                user: {
                    _id: user._id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
        } catch (error) {
            ApiError.handle(error, res);
        };
    },

    async refreshToken(req: Request, res: Response) {
        try {
            const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
            if (!refreshToken) throw new ApiError(401, "Refresh token required");

            const decoded = verifyToken(refreshToken);
            const user = await UserModel.findOne(decoded.userId);

            if (!user || refreshToken !== user.refreshToken) throw new ApiError(401, "Invalid refresh token");

            const { accessToken, refreshToken: newRefreshToken } = generateToken(user);

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