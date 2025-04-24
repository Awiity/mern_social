import dotenv from 'dotenv';

dotenv.config();

interface Config {
    port: number,
    mongodb_uri: string,
    jwt_secret: string,
    access_token_expiry: string,
    refresh_token_expiry: string
};

const config: Config = {
    port: Number(process.env.PORT),
    mongodb_uri: process.env.MONGODB_URI!,
    jwt_secret: process.env.JWT_SECRET!,
    access_token_expiry: process.env.ACCESS_TOKEN_EXPIRY!,
    refresh_token_expiry: process.env.REFRESH_TOKEN_EXPIRY!
};

export default config;
