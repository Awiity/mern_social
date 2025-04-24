import { Router } from "express";
import { UserController } from "../controllers/user.controller";

const router = Router();

router.get('/api/users', UserController.getAll);
router.get('/api/users/:id', UserController.getById);
router.post('/api/users', UserController.create);
router.put('/api/users/:id', UserController.update);
router.delete('/api/users/:id', UserController.delete);

export default router;