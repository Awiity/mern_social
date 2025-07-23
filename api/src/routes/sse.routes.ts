import { Router } from 'express';
import SSEController from '../controllers/sse.controller';

const router = Router();
const sseController = new SSEController();

// SSE connection endpoint
router.get('/connect', sseController.connect);

// Room management
router.post('/join-room', sseController.joinRoom);
router.post('/leave-room', sseController.leaveRoom);

// Typing indicators
router.post('/typing', sseController.sendTyping);

// Room information
router.get('/room/:roomId', sseController.getRoomInfo);
router.get('/rooms', sseController.getAllRooms);

// Statistics and monitoring
router.get('/stats', sseController.getStats);
router.get('/clients', sseController.getClients);

export default router;