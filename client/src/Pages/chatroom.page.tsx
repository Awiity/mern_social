import React, { useState, useEffect, useRef } from 'react';
import { Container, Row, Col, Button, Form, Modal, ListGroup, Badge, InputGroup, Dropdown } from 'react-bootstrap';
import { Send, Users, Plus, Search, Phone, Video, MoreVertical, Smile, Paperclip } from 'lucide-react';
import io, { Socket } from 'socket.io-client';
import { ChatService } from '../Services/chat.service';
import { useAuth } from '../Context/auth.context';

// Types aligned with your models
interface User {
    _id: string;
    username: string;
    firstname: string;
    lastname?: string;
    email: string;
    role: 'user' | 'admin';
    isOnline?: boolean;
    socketId?: string;
}

interface RoomUser {
    id: string;
    username: string;
    socketId: string;
}

interface Message {
    _id: string;
    content: string;
    user_id: User;
    room_id: string;
    sender?: {
        _id: string;
        username: string;
        firstname: string;
    };
    createdAt: Date;
    updatedAt: Date;
}

interface Room {
    _id: string;
    name: string;
    type: 'general' | 'private' | 'group';
    users?: RoomUser[];
    userCount?: number;
    messageCount?: number;
    lastActivity?: Date;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

interface RoomsResponse {
    success: boolean;
    data: Room[];
}

interface MessagesResponse {
    success: boolean;
    data: {
        messages: Message[];
        pagination: {
            currentPage: number;
            totalPages: number;
            totalMessages: number;
            limit: number;
            hasNext: boolean;
            hasPrev: boolean;
        }
    }
}

const ChatRoomPage: React.FC = () => {
    const { user: currentUser, isAuthenticated } = useAuth();
    const chatService = new ChatService();

    // State
    const [socket, setSocket] = useState<Socket | null>(null);
    const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [onlineUsers, setOnlineUsers] = useState<RoomUser[]>([]);
    const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
    const [showUserListModal, setShowUserListModal] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [typingUsers, setTypingUsers] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [roomType, setRoomType] = useState<'group' | 'private'>('group');
    const [loading, setLoading] = useState(true);
    const [messageSearchQuery, setMessageSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);

    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // Initialize socket connection
    useEffect(() => {
        loadAllUsers();
        if (isAuthenticated && currentUser) {
            // Connect to your backend socket server
            const newSocket = io(`${process.env.NODE_ENV == 'production' ? process.env.BASE_URL : 'http://localhost:4000'}`);
            setSocket(newSocket);
            console.log('Socket connected:', newSocket.id);
            // Socket event listeners
            newSocket.on('connect', () => {
                console.log('Connected to server with socket ID:', newSocket.id);
            });

            // Listen for incoming messages
            newSocket.on('receive-message', (chatMessage: any) => {
                console.log('Received message:', chatMessage);

                // Convert the backend message format to frontend format
                const message: Message = {
                    _id: chatMessage.id,
                    content: chatMessage.message,
                    user_id: {
                        _id: chatMessage.userId,
                        username: chatMessage.username,
                        firstname: chatMessage.username,
                        email: '',
                        role: 'user'
                    },
                    room_id: chatMessage.roomName,
                    createdAt: new Date(chatMessage.timestamp),
                    updatedAt: new Date(chatMessage.timestamp)
                };

                setMessages(prev => [...prev, message]);
            });

            // Listen for user events
            newSocket.on('user-joined', (data: any) => {
                console.log(`${data.username} joined room`);
                loadRooms(); // Refresh rooms when user joins
            });

            newSocket.on('user-left', (data: any) => {
                console.log(`${data.username} left room`);
                loadRooms(); // Refresh rooms when user leaves
            });

            // Listen for room users updates
            newSocket.on('room-users', (data: { users: RoomUser[] }) => {
                console.log('Room users updated:', data.users);
                setOnlineUsers(data.users);
            });

            // Listen for typing indicators
            newSocket.on('user-typing', (data: { username: string; roomName: string; isTyping: boolean }) => {
                if (data.username !== currentUser.username) {
                    if (data.isTyping) {
                        setTypingUsers(prev => [...prev.filter(u => u !== data.username), data.username]);
                    } else {
                        setTypingUsers(prev => prev.filter(u => u !== data.username));
                    }
                }
            });

            // Listen for errors
            newSocket.on('error', (error: string) => {
                console.error('Socket error:', error);
                alert('Socket error: ' + error);
            });

            return () => {
                newSocket.disconnect();
            };
        }
    }, [isAuthenticated, currentUser]);

    // Load user's rooms
    const loadRooms = async () => {
        if (!currentUser) return;

        try {
            const userRooms: RoomsResponse = await chatService.getRooms(currentUser._id);
            setRooms(userRooms.data || []);
            setLoading(false);
        } catch (error) {
            console.error('Error loading rooms:', error);
            setLoading(false);
        }
    };

    // Load rooms on component mount
    useEffect(() => {
        if (isAuthenticated && currentUser) {
            loadRooms();
        }
    }, [isAuthenticated, currentUser]);

    // Load messages for current room
    const loadMessages = async (roomId: string, page = 1) => {
        try {
            const response: MessagesResponse = await (await chatService.getMessages(roomId, page)).json();

            if (page === 1) {
                setMessages(response.data.messages || []);
            } else {
                setMessages(prev => [...(response.data.messages || []), ...prev]);
            }

            setHasMoreMessages(response.data.pagination.hasNext || false);
            setCurrentPage(page);
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    };

    const loadAllUsers = async () => {
        try {
            const response = await fetch(`${process.env.NODE_ENV == 'production' ? process.env.BASE_URL : 'http://localhost:4000'}/api/users`);
            const users = await response.json();
            setAllUsers(users);
        } catch (error) {
            console.error('Error loading users:', error);
        }
    };

    // Auto scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Handle room change
    const handleRoomChange = async (room: Room) => {
        if (socket && currentUser) {
            // Leave current room if any
            if (currentRoom) {
                console.log('Leaving room:', currentRoom.name);
                socket.emit('leave-room', currentRoom.name);
            }

            // Join new room - using room name as per your backend
            console.log('Joining room:', room.name);
            socket.emit('join-room', {
                roomName: room.name,
                username: currentUser.username
            });

            setCurrentRoom(room);
            await loadMessages(room._id);
        }
    };

    // Handle message send
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newMessage.trim() && currentUser && currentRoom && socket) {
            try {
                // Send message via socket (real-time)
                socket.emit('send-message', {
                    roomName: currentRoom.name,
                    message: newMessage.trim(),
                    user_id: currentUser._id,
                    user_socket_id: socket.id,
                    username: currentUser.username
                });

                // Also save to database via API
                const messageData = {
                    content: newMessage.trim(),
                    user_id: currentUser._id,
                    room_id: currentRoom._id
                };

                await chatService.sendMessage(messageData);

                setNewMessage('');
                setIsTyping(false);
            } catch (error) {
                console.error('Error sending message:', error);
            }
        }
    };

    // Handle typing
    const handleTyping = (value: string) => {
        setNewMessage(value);

        if (socket && currentUser && currentRoom) {
            if (!isTyping && value.trim()) {
                setIsTyping(true);
                socket.emit('typing', {
                    roomName: currentRoom.name,
                    username: currentUser.username
                });
            }

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            typingTimeoutRef.current = setTimeout(() => {
                setIsTyping(false);
                socket.emit('stop-typing', {
                    roomName: currentRoom.name,
                    username: currentUser.username
                });
            }, 1000);
        }
    };

    // Handle create room
    const handleCreateRoom = async () => {

        if (newRoomName.trim() && currentUser) {
            try {
                const roomData = {
                    name: newRoomName.trim(),
                    type: roomType,
                    users: selectedUsers.map(userId => {
                        const user = allUsers.find(u => u._id === userId);
                        return {
                            id: userId,
                            username: user?.username || 'Unknown',
                            socketId: '' // Will be populated when user joins
                        };
                    }),
                    isActive: true
                };
                roomData.users.push({
                    id: currentUser._id,
                    username: currentUser.username,
                    socketId: '' // Will be populated when user joins"
                });
                const newRoom = await chatService.createRoom(roomData);
                setRooms(prev => [...prev, newRoom]);
                setNewRoomName('');
                setSelectedUsers([]);
                setShowCreateRoomModal(false);

                // Join the newly created room
                handleRoomChange(newRoom);
            } catch (error) {
                console.error('Error creating room:', error);
            }
        }
    };

    // Handle private chat
    const handlePrivateChat = async (user: User) => {
        if (!currentUser) return;

        const existingPrivateRoom = rooms.find(room =>
            room.type === 'private' &&
            room.users?.some(u => u.id === user._id)
        );

        if (existingPrivateRoom) {
            handleRoomChange(existingPrivateRoom);
        } else {
            try {
                const privateRoom = await chatService.createPrivateRoom(
                    currentUser._id,
                    user._id,
                    currentUser.username,
                    user.username
                );
                setRooms(prev => [...prev, privateRoom.data]);
                handleRoomChange(privateRoom.data);
            } catch (error) {
                console.error('Error creating private room:', error);
            }
        }
    };

    // Handle message search
    const handleMessageSearch = async () => {
        if (messageSearchQuery.trim() && currentRoom) {
            try {
                const searchResults = await chatService.searchMessages(currentRoom._id, messageSearchQuery);
                setMessages(searchResults.messages || []);
            } catch (error) {
                console.error('Error searching messages:', error);
            }
        } else if (currentRoom) {
            // Reset to normal messages if search is cleared
            loadMessages(currentRoom._id);
        }
    };

    // Load more messages (pagination)
    const loadMoreMessages = () => {
        if (currentRoom && hasMoreMessages) {
            loadMessages(currentRoom._id, currentPage + 1);
        }
    };

    // Filter rooms based on search
    const filteredRooms = rooms.filter(room =>
        room.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Filter users based on search
    const filteredUsers = allUsers.filter(user =>
        user.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Get display name for user
    const getDisplayName = (user: User): string => {
        return user.lastname ? `${user.firstname} ${user.lastname}` : user.firstname;
    };

    // Get sender display name for message
    const getSenderDisplayName = (message: Message): string => {
        if (message.user_id) return message.user_id.username;
        return "Unknown Sender";
    };

    if (!isAuthenticated) {
        return (
            <Container className="d-flex justify-content-center align-items-center vh-100">
                <div className="text-center">
                    <h4>Please log in to access the chat</h4>
                </div>
            </Container>
        );
    }

    if (loading) {
        return (
            <Container className="d-flex justify-content-center align-items-center vh-100">
                <div className="text-center">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                    <p className="mt-2">Loading chat rooms...</p>
                </div>
            </Container>
        );
    }

    return (
        <Container fluid className="h-screen bg-gray-100">
            <Row className="h-100">
                {/* Sidebar */}
                <Col md={3} className="bg-dark border-end p-0 h-100">
                    <div className="d-flex flex-column h-100">
                        {/* Header */}
                        <div className="p-3 border-bottom">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="mb-0 text-white">Chat Rooms</h5>
                                <Button
                                    variant="outline-light"
                                    size="sm"
                                    onClick={() => setShowCreateRoomModal(true)}
                                >
                                    <Plus size={16} />
                                </Button>
                            </div>

                            {/* Search */}
                            <InputGroup>
                                <InputGroup.Text>
                                    <Search size={16} />
                                </InputGroup.Text>
                                <Form.Control
                                    type="text"
                                    placeholder="Search rooms..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </InputGroup>
                        </div>

                        {/* Rooms List */}
                        <div className="flex-grow-1 overflow-auto">
                            <ListGroup variant="flush">
                                {filteredRooms.map(room => (
                                    <ListGroup.Item
                                        key={room._id}
                                        action
                                        active={currentRoom?._id === room._id}
                                        onClick={() => handleRoomChange(room)}
                                        className="d-flex justify-content-between align-items-center"
                                    >
                                        <div className="flex-grow-1">
                                            <div className="d-flex justify-content-between align-items-center">
                                                <strong className="text-truncate">{room.type !== 'private' ? room.name : room.users![0].username == currentUser?.username ? room.users![1].username : room.users![0].username}</strong>
                                                <small className="text-muted">
                                                    {room.lastActivity && new Date(room.lastActivity).toLocaleTimeString()}
                                                </small>
                                            </div>
                                            <div className="d-flex justify-content-between align-items-center">
                                                <small className="text-muted">
                                                    {room.type === 'private' ? 'Private' :
                                                        room.type === 'general' ? 'General' :
                                                            `${room.users?.length || 0} users`}
                                                </small>
                                                {room.messageCount && room.messageCount > 0 && (
                                                    <Badge bg="primary" pill>
                                                        {room.messageCount}
                                                    </Badge>
                                                )}
                                            </div>
                                        </div>
                                    </ListGroup.Item>
                                ))}
                            </ListGroup>
                        </div>

                        {/* Online Users */}
                        <div className="p-3 border-top bg-dark">
                            <div className="d-flex justify-content-between align-items-center mb-2">
                                <small className="text-muted">Online Users</small>
                                <Button
                                    variant="link"
                                    size="sm"
                                    onClick={() => setShowUserListModal(true)}
                                >
                                    <Users size={16} />
                                </Button>
                            </div>
                            <div className="d-flex flex-wrap gap-1">
                                {onlineUsers.slice(0, 5).map(user => (
                                    <Badge
                                        key={user.id}
                                        bg="success"
                                        pill
                                        className="cursor-pointer"
                                        onClick={() => {
                                            const fullUser = allUsers.find(u => u._id === user.id);
                                            if (fullUser) handlePrivateChat(fullUser);
                                        }}
                                    >
                                        {user.username}
                                    </Badge>
                                ))}
                                {onlineUsers.length > 5 && (
                                    <Badge bg="secondary" pill>
                                        +{onlineUsers.length - 5}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </Col>

                {/* Main Chat Area */}
                {/* Main Chat Area */}
                <Col md={9} className="p-0 chat-main-column">
                    {currentRoom ? (
                        <>
                            {/* Chat Header */}
                            <div className="chat-header-section bg-dark p-3 border-bottom">
                                <div className="d-flex justify-content-between align-items-center">
                                    <div>
                                        <h5 className="mb-0 text-white">{currentRoom.name}</h5>
                                        <small className="text-muted">
                                            {currentRoom.type === 'private' ? 'Private conversation' :
                                                currentRoom.type === 'general' ? 'General room' :
                                                    `${currentRoom.users?.length || 0} members`}
                                        </small>
                                    </div>
                                    <div className="d-flex gap-2">
                                        {currentRoom.type === 'private' && (
                                            <>
                                                <Button variant="outline-light" size="sm">
                                                    <Phone size={16} />
                                                </Button>
                                                <Button variant="outline-light" size="sm">
                                                    <Video size={16} />
                                                </Button>
                                            </>
                                        )}
                                        <Dropdown>
                                            <Dropdown.Toggle variant="outline-light" size="sm">
                                                <MoreVertical size={16} />
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu>
                                                <Dropdown.Item>Room Settings</Dropdown.Item>
                                                <Dropdown.Item>View Members</Dropdown.Item>
                                                <Dropdown.Item onClick={() => {
                                                    const query = prompt('Search messages:');
                                                    if (query) {
                                                        setMessageSearchQuery(query);
                                                        handleMessageSearch();
                                                    }
                                                }}>
                                                    Search Messages
                                                </Dropdown.Item>
                                                <Dropdown.Divider />
                                                <Dropdown.Item className="text-danger">Leave Room</Dropdown.Item>
                                            </Dropdown.Menu>
                                        </Dropdown>
                                    </div>
                                </div>
                            </div>

                            {/* Messages Area */}
                            <div className="chat-area">
                                {hasMoreMessages && (
                                    <div className="text-center mb-3">
                                        <Button variant="outline-primary" size="sm" onClick={loadMoreMessages}>
                                            Load More Messages
                                        </Button>
                                    </div>
                                )}

                                <div className="space-y-4 overflow-auto p-3" style={{ height: 'calc(100vh - 210px)' }}>
                                    {messages.map(message => (
                                        <div
                                            key={message._id}
                                            className={`d-flex message-box ${message.user_id._id == currentUser?._id ? 'justify-content-end' : 'justify-content-start'}`}
                                        >
                                            <div className={`max-w-75 ${message.user_id._id === currentUser?._id ? 'bg-primary text-white' : 'bg-dark border'} p-3 rounded-lg shadow-sm rounded mt-1`} style={{ minWidth: '200px' }}>
                                                {message.sender?._id !== currentUser?._id && (
                                                    <small className="text-muted d-block">
                                                        {getSenderDisplayName(message)}
                                                    </small>
                                                )}
                                                <div>{message.content}</div>
                                                <small className={`d-block mt-1 text-end ${message.user_id._id === currentUser?._id ? 'text-white-50' : 'text-muted'}`}>
                                                    {new Date(message.createdAt).toLocaleTimeString()}
                                                </small>
                                            </div>
                                        </div>
                                    ))}

                                    {/* Typing indicator */}
                                    {typingUsers.length > 0 && (
                                        <div className="d-flex justify-content-start">
                                            <div className="bg-dark p-2 rounded-lg shadow-sm">
                                                <small className="text-muted">
                                                    {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                                                </small>
                                            </div>
                                        </div>
                                    )}

                                    <div ref={messagesEndRef} />
                                </div>
                            </div>

                            {/* Message Input */}
                            <div className="chat-input-section p-3">
                                <Form onSubmit={handleSendMessage}>
                                    <InputGroup>
                                        <Button variant="outline-secondary">
                                            <Paperclip size={16} />
                                        </Button>
                                        <Form.Control
                                            type="text"
                                            placeholder="Type a message..."
                                            value={newMessage}
                                            onChange={(e) => handleTyping(e.target.value)}
                                        />
                                        <Button variant="outline-secondary">
                                            <Smile size={16} />
                                        </Button>
                                        <Button type="submit" variant="primary">
                                            <Send size={16} />
                                        </Button>
                                    </InputGroup>
                                </Form>
                            </div>
                        </>
                    ) : (
                        <div className="d-flex justify-content-center align-items-center h-100 text-muted">
                            <div className="text-center">
                                <Users size={48} className="mb-3" />
                                <h5>Select a room to start chatting</h5>
                            </div>
                        </div>
                    )}
                </Col>
            </Row>

            {/* Create Room Modal */}
            <Modal show={showCreateRoomModal} onHide={() => setShowCreateRoomModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Create New Room</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Room Name</Form.Label>
                            <Form.Control
                                type="text"
                                value={newRoomName}
                                onChange={(e) => setNewRoomName(e.target.value)}
                                placeholder="Enter room name"
                            />
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Room Type</Form.Label>
                            <Form.Select value={roomType} onChange={(e) => setRoomType(e.target.value as 'group' | 'private')}>
                                <option value="group">Group Room</option>
                                <option value="private">Private Room</option>
                            </Form.Select>
                        </Form.Group>

                        <Form.Group className="mb-3">
                            <Form.Label>Add Users</Form.Label>
                            <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                                {allUsers.filter(user => user._id !== currentUser?._id).map(user => (
                                    <Form.Check
                                        key={user._id}
                                        type="checkbox"
                                        label={`${getDisplayName(user)} (${user.username}) ${user.isOnline ? '(Online)' : '(Offline)'}`}
                                        checked={selectedUsers.includes(user._id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedUsers([...selectedUsers, user._id]);
                                            } else {
                                                setSelectedUsers(selectedUsers.filter(id => id !== user._id));
                                            }
                                        }}
                                    />
                                ))}
                            </div>
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowCreateRoomModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleCreateRoom}>
                        Create Room
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* User List Modal */}
            <Modal show={showUserListModal} onHide={() => setShowUserListModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>All Users</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form.Group className="mb-3">
                        <Form.Control
                            type="text"
                            placeholder="Search users..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </Form.Group>
                    <ListGroup style={{ maxHeight: '400px', overflowY: 'auto' }}>
                        {filteredUsers.filter(user => user._id !== currentUser?._id).map(user => (
                            <ListGroup.Item
                                key={user._id}
                                className="d-flex justify-content-between align-items-center"
                            >
                                <div className="d-flex align-items-center">
                                    <div className={`rounded-circle me-2 ${user.isOnline ? 'bg-success' : 'bg-secondary'}`}
                                        style={{ width: '10px', height: '10px' }}></div>
                                    <div>
                                        <div className="fw-bold">{getDisplayName(user)}</div>
                                        <small className="text-muted">@{user.username}</small>
                                    </div>
                                </div>
                                <Button
                                    variant="outline-primary"
                                    size="sm"
                                    onClick={() => {
                                        handlePrivateChat(user);
                                        setShowUserListModal(false);
                                    }}
                                >
                                    Chat
                                </Button>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                </Modal.Body>
            </Modal>
        </Container>
    );
};

export default ChatRoomPage;