import { Router } from "express";
import { UserController } from "../controllers/user.controller";

const userRoutes = Router();

userRoutes.get('/users', UserController.getAll);
userRoutes.get('/users/:id', UserController.getById);
userRoutes.post('/users', UserController.create);
userRoutes.put('/users/:id', UserController.update);
userRoutes.delete('/users/:id', UserController.delete);

import { AuthController } from "../controllers/auth.controller";
import { authMiddleware } from "../middleware/auth.middleware";

userRoutes.post('/auth/login', AuthController.login);
userRoutes.post('/auth/logout', authMiddleware(), AuthController.logout);
userRoutes.post('/auth/refresh', AuthController.refreshToken);


export default userRoutes;