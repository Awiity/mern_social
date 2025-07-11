/* eslint-disable @typescript-eslint/no-explicit-any */
const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? process.env.BASE_URL || 'https://opalsocialbe.vercel.app'
    : process.env.DEV_API_URL || 'http://localhost:4000';

export class ChatService {
    private baseUrl = `${API_BASE_URL}/api`;

    async getRooms(userId: string) {
        const response = await fetch(`${this.baseUrl}/rooms/user/${userId}`);
        return response.json();
    }

    async createRoom(roomData: any) {
        console.log('Creating room with data:', roomData);
        const response = await fetch(`${this.baseUrl}/rooms`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(roomData)
        });
        return response.json();
    }

    async createPrivateRoom(userId1: string, userId2: string, username1: string, username2: string) {
        const response = await fetch(`${this.baseUrl}/rooms/private`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId1, userId2, username1, username2 })
        });
        return response.json();
    }

    async getMessages(roomId: string, page = 1, limit = 50) {
        const response = await fetch(`${this.baseUrl}/messages/room/${roomId}?page=${page}&limit=${limit}`);
        return response;
    }

    async sendMessage(messageData: any) {
        const response = await fetch(`${this.baseUrl}/messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(messageData)
        });
        return response.json();
    }

    async searchMessages(roomId: string, query: string) {
        const response = await fetch(`${this.baseUrl}/messages/room/${roomId}/search?query=${query}`);
        return response.json();
    }
}