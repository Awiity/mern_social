import { Response, Request, NextFunction } from "express";
import { ApiError } from "../utils/apiError";
import { generateTokens } from "../utils/jwt";
import jwt, { JsonWebTokenError } from 'jsonwebtoken';
import { UserModel } from "../models/user.model";
import { AuthController } from "../controllers/auth.controller";
import config from "../config/config";

declare global {
    namespace Express {
        interface Request {
            userId: string
        }
    }
}

export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    if (!accessToken && !refreshToken) throw new ApiError(401, "Unauthorized (No tokens provided)");

    try {
        if (accessToken) {
            const decodedJWT = jwt.verify(accessToken, config.jwt_secret) as jwt.JwtPayload;
            req.userId = decodedJWT.userId;
            return next();
        }
    } catch (error) {
        if (!(error instanceof jwt.TokenExpiredError)) {
            throw new ApiError(401, "Invalid accessToken");
        }

    }
    if (!refreshToken) {
        throw new ApiError(401, "Session expired - No refresh token");
    }
    try {
        const decodedRefresh = jwt.verify(refreshToken, config.jwt_secret) as jwt.JwtPayload;
        const user = await UserModel.findById(decodedRefresh.userId).select('+refreshToken');
        if (!user || user.refreshToken !== refreshToken) {
            res.clearCookie('refreshToken');
            throw new ApiError(401, "Invalid refresh token");
        }
        const newAccessToken = jwt.sign(
            { userId: user._id },
            config.jwt_secret,
            { expiresIn: "15 min" }
        );

        const newRefreshToken = jwt.sign(
            { userId: user._id },
            config.jwt_secret,
            { expiresIn: "1 day" }
        );

        user.refreshToken = newRefreshToken;
        await user.save();

        res.cookie("accessToken", newAccessToken, {
            httpOnly: true,
            //secure: process.env.NODE_ENV === 'production',
            maxAge: 15 * 60 * 1000,
            sameSite: 'strict'
        });
        res.cookie("refreshToken", newRefreshToken, {
            httpOnly: true,
            //secure: process.env.NODE_ENV === 'production',
            maxAge: 24 * 60 * 60 * 1000,
            sameSite: 'strict'
        });
        console.log('here sets req.userId');
        req.userId = user.id;
        next();
    } catch (error) {
        res.clearCookie("accessToken");
        res.clearCookie("refreshToken");
        throw new ApiError(401, "Unauthorized (something went wrong");
    }
}
export const refreshTokenValidation = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) throw new ApiError(401, "Invalid token (auth.controller.RTV)")
    try {
        const decodedJWT = (jwt.verify(refreshToken, config.jwt_secret) as jwt.JwtPayload).userId;
        req.userId = decodedJWT.userId;
        next();
    } catch (error) {
        ApiError.handle(error, res);
    }
}
