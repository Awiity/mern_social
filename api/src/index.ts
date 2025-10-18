import express, { NextFunction, Request, Response } from 'express';
import config from './config/config';
import userRoutes from './routes/user.routes';
import { connectDB } from './config/db';
import cookieParser from 'cookie-parser';
import postRoutes from './routes/post.routes';
import roomRoutes from './routes/room.routes';
import messageRoutes from './routes/message.routes';
import likeRoutes from './routes/like.routes';
import commentRoutes from './routes/comment.routes';
import sseRoutes from './routes/sse.routes';

const cors = require('cors');

const app = express();

// Middleware
app.use(cors({
    credentials: true,
    origin: [
        'http://localhost:3000',
        'http://localhost:5173',
        'http://localhost:3001',
        'https://the-opal.vercel.app',
        config.client_url || 'https://the-opal.vercel.app'
    ],
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'Cookie', 'Cache-Control'],
    exposedHeaders: ['Set-Cookie'] // Important for Safari
}));

app.use(express.json());
app.use(cookieParser());

// Connect to database
connectDB();

// Routes
app.use('/api', userRoutes);
app.use('/api', postRoutes);
app.use('/api', roomRoutes);
app.use('/api', messageRoutes);
app.use('/api', likeRoutes);
app.use('/api', commentRoutes);
app.use('/api/sse', sseRoutes); // SSE routes

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
    res.json({
        success: true,
        message: 'Server is healthy',
        timestamp: new Date().toISOString()
    });
});

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({
        success: false,
        message: "Internal Server Error"
    });
});

// 404 handler
app.use(/(.*)/, (req: Request, res: Response) => {
    res.status(404).json({
        success: false,
        message: 'Endpoint not found'
    });
});

// Start server
const port = config.port || 4000;

if (config.node_env !== 'production') {
    app.listen(port, () => {
        console.log("Server started, listening to port", port);
        console.log("SSE endpoints available at /api/sse/");
    });
}

export default app;