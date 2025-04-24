import mongoose from 'mongoose';
import config from './config';

const mongodb_uri = config.mongodb_uri;

export const connectDB = async () => {
    try {
        mongoose.connect(mongodb_uri);
        console.log("Successfuly connected to MongoDB");
    } catch (e) {
        console.log("MongoDB connection failed, Error: ", e);
        process.exit(1);
    }
};