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
            userId: string,
            role: string
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
            req.role = decodedJWT.role;
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
        const decodedRefresh = jwt.verify(refreshToken, config.jwt_refresh_secret) as jwt.JwtPayload;
        const user = await UserModel.findById(decodedRefresh.userId).select('+refreshToken +_id +role').exec();
        console.log(user?.refreshToken?.slice(user.refreshToken.length - 5, user.refreshToken.length - 1),
                    " ", refreshToken.slice(refreshToken.length - 5, refreshToken.length - 1));
        if (!user || user.refreshToken !== refreshToken) {
            res.clearCookie('refreshToken');
            throw new ApiError(401, "Invalid refresh token XDDDDD");
        }
        const { accessToken: newAccessToken } = generateTokens(user);

        res.cookie("accessToken", newAccessToken, {
            httpOnly: true,
            //secure: process.env.NODE_ENV === 'production',
            maxAge: 15 * 60 * 1000,
            sameSite: 'strict'
        });
        
        req.userId = user._id;
        next();
    } catch (error) {
        //res.clearCookie("accessToken");
        //res.clearCookie("refreshToken");
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
