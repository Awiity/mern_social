import { z } from 'zod';
import mongoose, { Document } from "mongoose";
import bcrypt from 'bcrypt';

const SALT_FACTOR: number = 7;

export const userSchema = z.object({
    password: z.string().min(8).max(60).regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
        message: "Password must contain at least one uppercase, one lowercase, and one number"
      }),
    username: z.string().min(3).max(15),
    firstname: z.string().max(15),
    lastname: z.string().max(15).optional(),
    email: z.string().min(5).max(20),
    description: z.string().optional(),
    address: z.string().optional(),
    avatar: z.string().optional(),
    role: z.enum(['user', 'admin']).default('user'),
    createdAt: z.date().default(new Date()),
    updatedAt: z.date().default(new Date())
});

export type IUser = z.infer<typeof userSchema>;

export interface IUserDocument extends IUser {
    _id: string,
    comparePassword(candidatePassword: string): Promise<boolean>,
    refreshToken?: string
};

const userMongooseSchema = new mongoose.Schema<IUserDocument>({
    password: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    firstname: { type: String, required: false },
    lastname: { type: String, required: false },
    email: { type: String, required: true, unique: true },
    description: { type: String, required: false },
    address: { type: String, required: false },
    avatar: { type: String, required: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now },
    refreshToken: { type: String }

});

userMongooseSchema.methods.comparePassword = async function (candidatePassword: string) : Promise<boolean> {
    const salt = await bcrypt.genSalt(SALT_FACTOR);

    const a = await bcrypt.hash(candidatePassword, salt);
    //console.log(a, this.password);
    return bcrypt.compare(candidatePassword, this.password);
};

export const UserModel = mongoose.model<IUserDocument>('User', userMongooseSchema);