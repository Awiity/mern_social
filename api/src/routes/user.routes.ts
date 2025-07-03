import { Router } from "express";
import { UserController } from "../controllers/user.controller";
import { authenticate, refreshTokenValidation } from "../middleware/auth.middleware";
const userRoutes = Router();

// User routes
userRoutes.get('/users', UserController.getAll);
userRoutes.get('/users/:id', UserController.getById);
userRoutes.put('/users/:id', authenticate, UserController.update);
userRoutes.delete('/users/:id', authenticate, UserController.delete);

import { AuthController } from "../controllers/auth.controller";

// Authentication routes
// Note: The authenticate middleware is used to protect routes that require authentication
userRoutes.get('/auth/me', authenticate, AuthController.authme);
userRoutes.post('/auth/login', AuthController.login);
userRoutes.post('/auth/register', AuthController.register);
userRoutes.post('/auth/refresh', refreshTokenValidation, AuthController.refreshToken);
userRoutes.post('/auth/logout', authenticate, AuthController.logout);


export default userRoutes;