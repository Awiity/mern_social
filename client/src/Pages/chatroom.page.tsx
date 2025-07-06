import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, ListGroup, Badge, InputGroup } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../styles/chatroom.css';

interface ChatMessage {
    id: number;
    username: string;
    message: string;
    timestamp: string;
    isOwn?: boolean;
}

interface User {
    id: number;
    username: string;
    status: 'online' | 'away' | 'offline';
}
interface Room {
    id: number;
    name: string;
    users: {
        id: number;
        username: string;
        socketId: string;
    }[];
};


const ChatRoom: React.FC = () => {
    // Sample data for demonstration
    const [rooms, setRooms] = useState<Room[]>();
    const [messages, setMessages] = useState<ChatMessage[]>()
    const [users, setUsers] = useState<User[]>()


    const getStatusColor = (status: string) => {
        switch (status) {
            case 'online': return 'success';
            case 'away': return 'warning';
            case 'offline': return 'secondary';
            default: return 'secondary';
        }
    };

    return (
        <div className="chat-room-container">


            <Container fluid>
                <Row className="h-100">
                    { /* Rooms */}
                    <Col lg={3} md={4} className="mb-4">
                        <Card className="rooms-card">
                            <Card.Header className="rooms-header">
                                <h4 className="mb-0">Rooms</h4>
                            </Card.Header>
                            <Card.Body className="rooms-list">
                            </Card.Body>
                        </Card>
                    </Col>
                    {/* Chat Area */}
                    <Col lg={6} md={8} className="mb-4">
                        <Card className="chat-card">
                            <Card.Header className="chat-header">
                                <h4 className="mb-0">CHAT</h4>
                                <small>Chat with ?</small>
                            </Card.Header>

                            <ListGroup className="chat-messages">
                                {messages && messages.length > 0 && messages.map((msg) => (
                                    <ListGroup.Item
                                        key={msg.id}
                                        className={`message-item ${msg.isOwn ? 'message-own' : 'message-other'}`}
                                    >
                                        <div className={`message-username ${msg.isOwn ? 'own' : ''}`}>
                                            {msg.username}
                                        </div>
                                        <div className="message-text">{msg.message}</div>
                                        <div className="message-time">{msg.timestamp}</div>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>

                            <div className="input-area">
                                <InputGroup>
                                    <Form.Control
                                        type="text"
                                        placeholder="Type your message..."
                                        className="chat-input"
                                    />
                                    <Button className="send-button">
                                        Send 🚀
                                    </Button>
                                </InputGroup>
                            </div>
                        </Card>
                    </Col>

                    {/* Users Sidebar */}
                    <Col lg={3} md={4}>
                        <Card className="users-card">
                            <div className="users-header">
                                <h4>Online Users {users && users.filter(u => u.status === 'online').length} </h4>
                            </div>

                            <ListGroup className="users-sidebar">
                                {users && users.map((user) => (
                                    <ListGroup.Item key={user.id} className="user-item">
                                        <span>{user.username}</span>
                                        <Badge bg={getStatusColor(user.status)} className="ms-2">
                                            {user.status}
                                        </Badge>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </div>
    );
};

export default ChatRoom;