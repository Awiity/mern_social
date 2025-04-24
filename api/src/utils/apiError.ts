import { Response } from "express";
import { z } from "zod"
import mongoose from "mongoose";

//deepseek did this
export class ApiError extends Error {
    constructor(public statusCode: number, message: string) {
        super(message);
    }

    static handle(error: any, res: Response) {
        if (error instanceof ApiError) {
            return res.status(error.statusCode).json({ message: error.message });
        }
        if (error instanceof z.ZodError) {
            return res.status(400).json({
                message: "Validation error",
                errors: error.errors
            });
        }
        if (error instanceof mongoose.Error.ValidationError) {
            return res.status(400).json({
                message: "Validation error",
                errors: Object.values(error.errors).map(err => err.message)
            });
        }

        if (error.code && error.code === 11000) {
            const field = Object.keys(error.keyPattern)[0];
            return res.status(409).json({
                message: `${field} already exists`
            });
        }
        console.error(error);
        res.status(500).json({ message: "Internal server error" });
    }
}