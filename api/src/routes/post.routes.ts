import { Router } from "express";
import { PostController } from "../controllers/post.controller";

const postRoutes = Router();

postRoutes.get('/posts', PostController.getAll);
postRoutes.get('/posts/:id', PostController.getById);
postRoutes.post('/posts', PostController.create);
postRoutes.delete('/posts/:id', PostController.delete);
postRoutes.put('/posts/:id', PostController.update)

export default postRoutes;