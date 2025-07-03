import { Router } from "express";
import { PostController } from "../controllers/post.controller";
import { authenticate } from "../middleware/auth.middleware";
import upload from "../middleware/multer.shabim";

const postRoutes = Router();

postRoutes.get('/posts', PostController.getAll);
postRoutes.get('/posts/:id', authenticate, PostController.getById);
postRoutes.get('/posts/user/:user_id', PostController.getByUserId);
postRoutes.post('/posts', authenticate, upload.single('post_file'), PostController.create);
postRoutes.delete('/posts/:_id', authenticate, PostController.delete);
postRoutes.patch('/posts/:id', authenticate, PostController.update)

export default postRoutes;