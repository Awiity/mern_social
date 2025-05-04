import jwt from 'jsonwebtoken';
import { ApiError } from './apiError';
import { IUser, IUserDocument } from '../models/user.model';
import config from '../config/config';

const JWT_SECRET: string = config.jwt_secret || 'secret-or-smth-idk';
const JWT_REFRESH_SECRET: string = config.jwt_refresh_secret || 'we-secreting-and-shieeet';
const ACCESS_TOKEN_EXPIRY: string = config.access_token_expiry;
const REFRESH_TOKEN_EXPIRY: string = config.refresh_token_expiry;

export const generateTokens = (user: IUserDocument) => {
    const accessToken = jwt.sign(
        { userId: user._id, role: user.role },
        JWT_SECRET,
        { expiresIn: "15 min" }
    );

    const refreshToken = jwt.sign(
        { userId: user._id, role: user.role },
        JWT_REFRESH_SECRET,
        { expiresIn: "1 day" }
    );
    return { accessToken, refreshToken };
};
