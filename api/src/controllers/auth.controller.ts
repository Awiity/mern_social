import { Request, Response } from "express";
import { UserModel, userSchema } from "../models/user.model";
import { ApiError } from "../utils/apiError";
import { generateTokens } from "../utils/jwt";
import bcrypt, { genSalt } from "bcrypt";
interface RequestM extends Request {
    userId: string
}
const SALT_FACTOR: number = 12;

const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
    domain: process.env.NODE_ENV === 'production' ? '.opal-social-mocha.vercel.app' : undefined,
    path: '/',
};

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

            // IMPORTANT: Save refresh token to database before setting cookies
            user.refreshToken = refreshToken;
            await user.save(); // This was missing - save BEFORE setting cookies

            console.log("login called with email: ", email, "Funny tokens: ", accessToken.slice(-5), refreshToken.slice(-5));

            res.cookie("accessToken", accessToken, {
                ...cookieOptions,
                maxAge: 15 * 60 * 1000,
            });
            res.cookie("refreshToken", refreshToken, {
                ...cookieOptions,
                maxAge: 1 * 24 * 60 * 60 * 1000,
            });

            req.userId = user.id;
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
        }
    },

    async register(req: Request, res: Response) {
        console.log("register called")
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
            const userId = req.userId;

            const refreshToken = req.cookies.refreshToken;
            const user = await UserModel.findById(userId);

            if (!user || !refreshToken) {
                throw new ApiError(401, "Unauthorized")
            }

            if (user.refreshToken !== refreshToken) throw new ApiError(401, "Unauthorized (invalidRefreshToken)")

            const { accessToken: newAccessToken, refreshToken: newRefreshToken } = generateTokens(user);
            user.refreshToken = newRefreshToken;
            await user.save();

            res.cookie('accessToken', newAccessToken, {
                ...cookieOptions,
                maxAge: 15 * 60 * 1000,


            });
            res.cookie('refreshToken', newRefreshToken, {
                ...cookieOptions,
                maxAge: 24 * 60 * 60 * 1000,


            })
            res.status(200).json("token refreshed successfully");
            console.log("refreshed token");

        } catch (error) {

            ApiError.handle(error, res);
        };
    },
    async logout(req: Request, res: Response) {
        try {
            const userId = req.userId;
            await UserModel.findOneAndUpdate({ _id: userId }, { refreshToken: null });

            res.clearCookie('accessToken', {
                domain: process.env.NODE_ENV === 'production' ? '.opal-social-mocha.vercel.app' : undefined,
                path: '/',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                secure: process.env.NODE_ENV === 'production'
            });

            res.clearCookie('refreshToken', {
                domain: process.env.NODE_ENV === 'production' ? '.opal-social-mocha.vercel.app' : undefined,
                path: '/',
                sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
                secure: process.env.NODE_ENV === 'production'
            });

            res.status(204).send();
        } catch (error) {
            ApiError.handle(error, res);
        }
    },
    async authme(req: Request, res: Response) {
        try {
            const user = await UserModel.findById(req.userId).select(
                "_id username email role" // Explicit safe field selection
            ).exec();

            if (!user) {
                res.clearCookie('accessToken');
                res.clearCookie('refreshToken');
                throw new ApiError(404, "User not found");
            }

            // 3. Return sanitized user data
            res.status(200).json(user);
        } catch (error) {
            ApiError.handle(error, res);
        }
    }
};  