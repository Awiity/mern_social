import { User, Room } from '../types/socket.types';

export class RoomManager {
    private rooms: Map<string, Room> = new Map();

    createRoom(roomName: string): Room {
        if (!this.rooms.has(roomName)) {
            const room: Room = {
                name: roomName,
                users: new Set(),
                createdAt: new Date()
            };
            this.rooms.set(roomName, room);
        }
        return this.rooms.get(roomName)!;
    }

    addUserToRoom(roomName: string, user: User): void {
        const room = this.createRoom(roomName);
        room.users.add(user);
    }

    removeUserFromRoom(roomName: string, userId: string): void {
        const room = this.rooms.get(roomName);
        if (room) {
            room.users.forEach(user => {
                if (user.id === userId) {
                    room.users.delete(user);
                }
            });

            // Remove empty rooms
            if (room.users.size === 0) {
                this.rooms.delete(roomName);
            }
        }
    }

    getRoomUsers(roomName: string): User[] {
        const room = this.rooms.get(roomName);
        return room ? Array.from(room.users) : [];
    }

    getUserCurrentRoom(userId: string): string | null {
        for (const [roomName, room] of this.rooms) {
            for (const user of room.users) {
                if (user.id === userId) {
                    return roomName;
                }
            }
        }
        return null;
    }

    removeUserFromAllRooms(userId: string): string[] {
        const roomsLeft: string[] = [];

        for (const [roomName, room] of this.rooms) {
            room.users.forEach(user => {
                if (user.id === userId) {
                    room.users.delete(user);
                    roomsLeft.push(roomName);
                }
            });

            // Remove empty rooms
            if (room.users.size === 0) {
                this.rooms.delete(roomName);
            }
        }

        return roomsLeft;
    }

    getAllRooms(): Room[] {
        return Array.from(this.rooms.values());
    }
}