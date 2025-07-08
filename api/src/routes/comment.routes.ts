import { Router } from 'express';
import { CommentController } from '../controllers/comment.controller';

const commentRoutes = Router();
const commentController = new CommentController();

import { Request, Response, NextFunction } from 'express';

commentRoutes.post(
    '/comments',
    (commentController.createComment.bind(commentController)) as (
        req: Request,
        res: Response,
        next: NextFunction
    ) => any
);
commentRoutes.delete(
    '/comments/:commentId',
    (commentController.deleteComment.bind(commentController)) as (
        req: Request,
        res: Response,
        next: NextFunction
    ) => any
);
commentRoutes.get(
    '/comments/post/:postId',
    (commentController.getCommentsByPostId.bind(commentController)) as (
        req: Request,
        res: Response,
        next: NextFunction
    ) => any
);
commentRoutes.get(
    '/comments/count/post/:postId',
    (commentController.getCommentCountByPostId.bind(commentController)) as (
        req: Request,
        res: Response,
        next: NextFunction
    ) => any
);
export default commentRoutes;