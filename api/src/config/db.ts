import mongoose from 'mongoose';
import config from './config';

const mongodb_uri = process.env.MONGODB_URI || config.mongodb_uri;

export const connectDB = async () => {
    try {
        mongoose.connect(mongodb_uri);
        console.log("Successfuly connected to MongoDB", config.client_url);
    } catch (e) {
        console.log("MongoDB connection failed, Error: ", e);
        process.exit(1);
    }
};
//test git