import { Router } from "express";
import { PostController } from "../controllers/post.controller";
import { authenticate } from "../middleware/auth.middleware";

const postRoutes = Router();

postRoutes.get('/posts', PostController.getAll);
postRoutes.get('/posts/:id', authenticate, PostController.getById);
postRoutes.post('/posts', PostController.create);
postRoutes.delete('/posts/:id', PostController.delete);
postRoutes.put('/posts/:id', authenticate, PostController.update)

export default postRoutes;