import React from 'react';
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

const ChatRoom: React.FC = () => {
  // Sample data for demonstration
  const messages: ChatMessage[] = [
    { id: 1, username: 'Alice', message: 'Hey everyone! How\'s it going?', timestamp: '10:30 AM', isOwn: false },
    { id: 2, username: 'Bob', message: 'All good here! Working on some new features', timestamp: '10:32 AM', isOwn: false },
    { id: 3, username: 'You', message: 'Just joined the conversation!', timestamp: '10:35 AM', isOwn: true },
    { id: 4, username: 'Charlie', message: 'Welcome to the chat!', timestamp: '10:36 AM', isOwn: false },
  ];

  const users: User[] = [
    { id: 1, username: 'Alice', status: 'online' },
    { id: 2, username: 'Bob', status: 'online' },
    { id: 3, username: 'Charlie', status: 'away' },
    { id: 4, username: 'David', status: 'offline' },
  ];

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
          {/* Chat Area */}
          <Col lg={9} md={8} className="mb-4">
            <Card className="chat-card">
              <Card.Header className="chat-header">
                <h4 className="mb-0">💬 General Chat</h4>
                <small>Welcome to the community discussion</small>
              </Card.Header>
              
              <ListGroup className="chat-messages">
                {messages.map((msg) => (
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
                👥 Online Users ({users.filter(u => u.status === 'online').length})
              </div>
              
              <ListGroup className="users-sidebar">
                {users.map((user) => (
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