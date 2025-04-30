import { Response, Request, NextFunction } from "express";
import { ApiError } from "../utils/apiError";
import { generateTokens, verifyToken } from "../utils/jwt";
import jwt from 'jsonwebtoken';
import { UserModel } from "../models/user.model";
import { AuthController } from "../controllers/auth.controller";

export const authenticate = (
    req: Request,
    res: Response,
    next: NextFunction
) => {
    try {
        const token = req.cookies.accessToken;
        if (!token) throw new ApiError(401, "Unuathorized (no token)");

        const decodedJWT = verifyToken(token);

        (req as any).userId = decodedJWT.userId;
        next();
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) return AuthController.refreshToken(req, res);
        ApiError.handle(error, res);
    }
}
