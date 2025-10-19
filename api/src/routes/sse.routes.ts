import { Router } from 'express';
import SSEController from '../controllers/sse.controller';

const sseRoutes = Router();
const sseController = new SSEController();

sseRoutes.get('/connect', sseController.connect);

sseRoutes.post('/join-room', sseController.joinRoom);
sseRoutes.post('/leave-room', sseController.leaveRoom);

sseRoutes.post('/typing', sseController.sendTyping);

sseRoutes.get('/room/:roomId', sseController.getRoomInfo);
sseRoutes.get('/rooms', sseController.getAllRooms);

sseRoutes.get('/stats', sseController.getStats);
sseRoutes.get('/clients', sseController.getClients);

export default sseRoutes;