import dotenv from 'dotenv';

dotenv.config();

interface Config {
    port: number,
    mongodb_uri: string
};

const config: Config = {
    port: Number(process.env.PORT),
    mongodb_uri: process.env.MONGODB_URI!
};

export default config;
