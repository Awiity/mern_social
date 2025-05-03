import { Router } from "express";
import { UserController } from "../controllers/user.controller";

const userRoutes = Router();

userRoutes.get('/users', UserController.getAll);
userRoutes.get('/users/:id', UserController.getById);
userRoutes.put('/users/:id', UserController.update);
userRoutes.delete('/users/:id', UserController.delete);

import { AuthController } from "../controllers/auth.controller";
import { authenticate, refreshTokenValidation } from "../middleware/auth.middleware";

userRoutes.get('/auth/me', authenticate, AuthController.authme);
userRoutes.post('/auth/login', AuthController.login);
userRoutes.post('/auth/register', AuthController.register);
userRoutes.post('/auth/refresh', refreshTokenValidation, AuthController.refreshToken);
userRoutes.post('/auth/logout', authenticate, AuthController.logout);


export default userRoutes;