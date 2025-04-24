import { z } from 'zod';
import mongoose from 'mongoose';

export const postSchema = z.object({
    title: z.string().min(3),
    body: z.string().optional(),
    user_id: z.string(),
    
})