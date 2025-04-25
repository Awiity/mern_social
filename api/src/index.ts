import express, { NextFunction, Request, Response } from 'express';
import config from './config/config';
import userRoutes from './routes/user.routes';
import { connectDB } from './config/db';
import cookieParser from 'cookie-parser';
import { json } from 'stream/consumers';
import postRoutes from './routes/post.routes';

const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors(
    {
        credentials: true,
        origin: 'http://localhost:5173'
    }
));

app.use(cookieParser());
connectDB();

app.use('/api', userRoutes);
app.use('/api', postRoutes)

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(err.stack);
    res.status(500).json({ message: "Internal Sever Error" });
});

app.listen(config.port, () => {
    console.log("Server started, listening to port", config.port);
});