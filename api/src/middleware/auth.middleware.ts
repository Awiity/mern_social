import { Response, Request, NextFunction } from "express";
import { ApiError } from "../utils/apiError";
import { generateTokens } from "../utils/jwt";
import jwt from 'jsonwebtoken';
import { UserModel } from "../models/user.model";
import { AuthController } from "../controllers/auth.controller";
import config from "../config/config";

export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.cookies.accessToken;
        if (!token) throw new ApiError(401, "Unuathorized (no token)");

        const decodedJWT = (jwt.verify(token, config.jwt_secret) as jwt.JwtPayload).userId;

        (req as any).userId = decodedJWT.userId;
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) { console.log("accessToken Expired"); return AuthController.refreshToken(req, res); }
        ApiError.handle(error, res);
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
        (req as any).userId = decodedJWT.userId;
        next();
    } catch (error) {
        ApiError.handle(error, res);
    }
}
