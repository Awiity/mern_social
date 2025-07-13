import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authenticate, refreshTokenValidation } from "../middleware/auth.middleware";
const userRoutes = Router();
import upload from "../middleware/multer.shabim";

// User routes
userRoutes.get('/users', UserController.getAll);
userRoutes.get('/users/:id', UserController.getById);
userRoutes.patch('/users/:id', authenticate, upload.single('avatar'), UserController.update);
userRoutes.delete('/users/:id', authenticate, UserController.delete);

import { AuthController } from "../controllers/auth.controller";

// Authentication routes
// Note: The authenticate middleware is used to protect routes that require authentication
userRoutes.get('/auth/me', authenticate, AuthController.authme);
userRoutes.post('/auth/login', AuthController.login);
userRoutes.post('/auth/register', upload.single('avatar'), AuthController.register);
userRoutes.post('/auth/refresh', refreshTokenValidation, AuthController.refreshToken);
userRoutes.post('/auth/logout', authenticate, AuthController.logout);


export default userRoutes;