import { Response, Request, NextFunction } from "express";
import { ApiError } from "../utils/apiError";
import { generateTokens } from "../utils/jwt";
import jwt from 'jsonwebtoken';
import { UserModel } from "../models/user.model";
import config from "../config/config";

declare global {
    namespace Express {
        interface Request {
            userId: string,
            role: string
        }
    }
}
const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' as const : 'lax' as const,
    //domain: process.env.NODE_ENV === 'production' ? '.opal-social-mocha.vercel.app' : undefined,
    path: '/',
};

export const authenticate = async (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.log("=== AUTHENTICATE MIDDLEWARE ===");
    console.log("Request URL:", req.url);
    console.log("Request method:", req.method);
    console.log("Request headers:", req.headers);
    //console.log("Raw cookies:", req.headers.cookie);

    const accessToken = req.cookies.accessToken;
    const refreshToken = req.cookies.refreshToken;

    console.log("Parsed cookies:", req.cookies);
    console.log("Access Token:", accessToken ? `${accessToken.slice(0, 10)}...${accessToken.slice(-5)}` : 'NOT FOUND');
    console.log("Refresh Token:", refreshToken ? `${refreshToken.slice(0, 10)}...${refreshToken.slice(-5)}` : 'NOT FOUND');

    if (!accessToken && !refreshToken) {
        console.log("No tokens found, throwing 401");
        throw new ApiError(401, "Unauthorized (No tokens provided)");
    }

    try {
        if (accessToken) {
            const decodedJWT = jwt.verify(accessToken, config.jwt_secret) as jwt.JwtPayload;
            req.userId = decodedJWT.userId;
            req.role = decodedJWT.role;
            return next();
        }
    } catch (error) {
        if (!(error instanceof jwt.TokenExpiredError)) {
            throw new ApiError(401, "Invalid accessToken");
        }
        console.error(error)
    }

    if (!refreshToken) {
        throw new ApiError(401, "Session expired - No refresh token");
    }

    try {
        const decodedRefresh = jwt.verify(refreshToken, config.jwt_refresh_secret) as jwt.JwtPayload;
        const user = await UserModel.findById(decodedRefresh.userId).select('+refreshToken +_id +role').exec();

        if (!user || user.refreshToken !== refreshToken) {
            res.clearCookie('refreshToken', cookieOptions);
            throw new ApiError(401, "Invalid refresh token");
        }

        const { accessToken: newAccessToken } = generateTokens(user);

        res.cookie("accessToken", newAccessToken, {
            ...cookieOptions,
            maxAge: 15 * 60 * 1000,
        });

        req.userId = user._id;
        req.role = user.role; // FIX: Set role from user object
        next();
    } catch (error) {
        throw new ApiError(401, "Unauthorized (something went wrong)");
    }
}
export const refreshTokenValidation = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    const refreshToken = req.cookies.refreshToken;
    if (!refreshToken) throw new ApiError(401, "Invalid token (no token provided auth.mid.rtv)")
    try {
        const decodedJWT = jwt.verify(refreshToken, config.jwt_refresh_secret) as jwt.JwtPayload;
        console.log("rvt stuff")
        req.userId = decodedJWT.userId;
        next();
    } catch (error) {
        ApiError.handle(error, res);
    }
}
