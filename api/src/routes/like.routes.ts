import { Router } from 'express';
import { LikeController } from '../controllers/like.controller';

const likeRoutes = Router();
const LikeContoroller = new LikeController();

import { Request, Response, NextFunction } from 'express';

likeRoutes.post(
    '/likes',
    (LikeContoroller.createLike.bind(LikeContoroller)) as (
        req: Request,
        res: Response,
        next: NextFunction
    ) => any
);

likeRoutes.get(
    '/likes/post/:postId',
    (LikeContoroller.getLikesByPostId.bind(LikeContoroller)) as (
        req: Request,
        res: Response,
        next: NextFunction
    ) => any
);

likeRoutes.delete(
    '/likes/:likeId',
    (LikeContoroller.deleteLike.bind(LikeContoroller)) as (
        req: Request,
        res: Response,
        next: NextFunction
    ) => any
);

export default likeRoutes;
