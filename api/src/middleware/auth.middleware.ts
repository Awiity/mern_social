import { Response, Request, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';
import { verifyToken } from '../utils/jwt';

export const authMiddleware = () => {
    return async (req: Request, res: Response, next: NextFunction) => {
        try {
            const token = req.cookies?.accessToken || req.headers.authorization?.split(' ')[1];

            if(!token) throw new ApiError(401, 'Authorization required to proceed');

            const decoded = verifyToken(token);

            next();

        } catch (error) {
            ApiError.handle(error, res);
        };
    };
};