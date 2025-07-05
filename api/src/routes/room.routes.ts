import { Router } from 'express';
import { RoomController } from '../controllers/room.controller';

const router = Router();
const roomController = new RoomController();

// Create a new room
router.post('/rooms', roomController.createRoom.bind(roomController));

// Get all rooms with pagination
router.get('/rooms', roomController.getAllRooms.bind(roomController));

// Search rooms
router.get('/rooms/search', roomController.searchRooms.bind(roomController));

// Get a specific room by ID
router.get('/rooms/:roomId', roomController.getRoomById.bind(roomController));

// Get room by name
router.get('/rooms/name/:roomName', roomController.getRoomByName.bind(roomController));

// Update a room
router.put('/rooms/:roomId', roomController.updateRoom.bind(roomController));

// Delete a room
router.delete('/rooms/:roomId', roomController.deleteRoom.bind(roomController));

// Add user to room
router.post('/rooms/:roomId/users', roomController.addUserToRoom.bind(roomController));

// Remove user from room
router.delete('/rooms/:roomId/users/:userId', roomController.removeUserFromRoom.bind(roomController));

// Get room statistics
router.get('/rooms/:roomId/stats', roomController.getRoomStats.bind(roomController));

export default router;