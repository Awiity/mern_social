import { Router } from 'express';
import { RoomController } from '../controllers/room.controller';

const roomRoutes = Router();
const roomController = new RoomController();

// Create a new room
roomRoutes.post('/rooms', roomController.createRoom.bind(roomController));

// Get all rooms with pagination
roomRoutes.get('/rooms', roomController.getAllRooms.bind(roomController));

// Search rooms
roomRoutes.get('/rooms/search', roomController.searchRooms.bind(roomController));

// Get a specific room by ID
roomRoutes.get('/rooms/:roomId', roomController.getRoomById.bind(roomController));

// Get room by name
roomRoutes.get('/rooms/name/:roomName', roomController.getRoomByName.bind(roomController));

// Update a room
roomRoutes.put('/rooms/:roomId', roomController.updateRoom.bind(roomController));

// Delete a room
roomRoutes.delete('/rooms/:roomId', roomController.deleteRoom.bind(roomController));

// Add user to room
roomRoutes.post('/rooms/:roomId/users', roomController.addUserToRoom.bind(roomController));

// Remove user from room
roomRoutes.delete('/rooms/:roomId/users/:userId', roomController.removeUserFromRoom.bind(roomController));

// Get room statistics
roomRoutes.get('/rooms/:roomId/stats', roomController.getRoomStats.bind(roomController));

// Create a private room
roomRoutes.post('/rooms/private', roomController.createPrivateRoom.bind(roomController));

// Get rooms for a specific user
roomRoutes.get('/rooms/user/:userId', roomController.getUserRooms.bind(roomController));

export default roomRoutes;