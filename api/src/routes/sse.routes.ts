import { Router } from 'express';
import SSEController from '../controllers/sse.controller';

const sseRoutes = Router();
const sseController = new SSEController();

// SSE connection endpoint
sseRoutes.get('/connect', sseController.connect);

// Room management
sseRoutes.post('/join-room', sseController.joinRoom);
sseRoutes.post('/leave-room', sseController.leaveRoom);

// Typing indicators
sseRoutes.post('/typing', sseController.sendTyping);

// Room information
sseRoutes.get('/room/:roomId', sseController.getRoomInfo);
sseRoutes.get('/rooms', sseController.getAllRooms);

// Statistics and monitoring
sseRoutes.get('/stats', sseController.getStats);
sseRoutes.get('/clients', sseController.getClients);

export default sseRoutes;