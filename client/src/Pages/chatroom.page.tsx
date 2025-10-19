/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Container, Row, Col, Button, Form, Modal, ListGroup, Badge, InputGroup, Dropdown } from 'react-bootstrap';
import { Send, Users, Plus, Search, Phone, Video, MoreVertical, Smile, Paperclip } from 'lucide-react';
import { ChatService } from '../Services/chat.service';
import { useAuth, User } from '../Context/auth.context';
import '../styles/chatroom.css';
import { useSSE } from '../Hooks/useSSE';

interface UserC extends User {
    _id: string;
    username: string;
    email: string;
    role: string;
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
    user_id: UserC;
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

    const {
        isConnected,
        isConnecting,
        error: sseError,
        currentRoomId,
        roomUsers,
        typingUsers,
        messages: sseMessages,
        joinRoom,
        leaveRoom,
        sendTyping,
        clearMessages
    } = useSSE({
        userId: currentUser?._id || '',
        username: currentUser?.username || '',
        autoConnect: true,
        baseUrl: process.env.NODE_ENV === 'production'
            ? process.env.BASE_URL || 'https://mern-social-two-gamma.vercel.app' :
            process.env.DEV_API_URL || 'http://localhost:4000'
    });

    const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
    const [rooms, setRooms] = useState<Room[]>([]);
    const [messages, setMessages] = useState<Message[]>([]);
    const [newMessage, setNewMessage] = useState('');
    const [showCreateRoomModal, setShowCreateRoomModal] = useState(false);
    const [showUserListModal, setShowUserListModal] = useState(false);
    const [newRoomName, setNewRoomName] = useState('');
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [isTyping, setIsTyping] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [allUsers, setAllUsers] = useState<UserC[]>([]);
    const [roomType, setRoomType] = useState<'group' | 'private'>('group');
    const [loading, setLoading] = useState(true);
    const [messageSearchQuery, setMessageSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [hasMoreMessages, setHasMoreMessages] = useState(true);

    const API_BASE_URL = process.env.NODE_ENV === 'production'
        ? process.env.BASE_URL || 'https://mern-social-two-gamma.vercel.app'
        : process.env.DEV_API_URL || 'http://localhost:4000';

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);



    useEffect(() => {
        loadAllUsers();
    }, []);

    
    const loadRooms = useCallback(async () => {
        if (!currentUser) return;

        try {
            const userRooms: RoomsResponse = await chatService.getRooms(currentUser._id);
            setRooms(userRooms.data || []);
            setLoading(false);
        } catch (error) {
            console.error('Error loading rooms:', error);
            setLoading(false);
        }
    }, [currentUser]);

    useEffect(() => {
        if (isAuthenticated && currentUser) {
            loadRooms();
        }
    }, [isAuthenticated, currentUser, loadRooms]);

    const loadMessages = useCallback(async (roomId: string, page = 1) => {
        try {
            const response: MessagesResponse = await (await chatService.getMessages(roomId, page)).json();

            if (page === 1) {
                setMessages(response.data.messages || []);
                clearMessages();
            } else {
                setMessages(prev => [...(response.data.messages || []), ...prev]);
            }

            setHasMoreMessages(response.data.pagination.hasNext || false);
            setCurrentPage(page);
        } catch (error) {
            console.error('Error loading messages:', error);
        }
    }, [clearMessages]);

    const loadAllUsers = useCallback(async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/users`);
            const users = await response.json();
            setAllUsers(users);
        } catch (error) {
            console.error('Error loading users:', error);
        }
    }, [API_BASE_URL]);

    const getAllMessages = useCallback(() => {
        const combinedMessages = [...messages];

        sseMessages.forEach((sseMsg: any) => {
            if (sseMsg.type !== 'system' && !combinedMessages.find(msg => msg._id === sseMsg.id)) {
                const convertedMessage: Message = {
                    _id: sseMsg.id?.toString() || Date.now().toString(),
                    content: sseMsg.content,
                    user_id: {
                        _id: sseMsg.userId || sseMsg.user_id,
                        username: sseMsg.username,
                        email: '',
                        role: 'user'
                    },
                    room_id: currentRoom?._id || '',
                    createdAt: sseMsg.timestamp || new Date(),
                    updatedAt: sseMsg.timestamp || new Date()
                };
                combinedMessages.push(convertedMessage);
            }
        });

        return combinedMessages.sort((a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
    }, [messages, sseMessages, currentRoom]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, sseMessages]);

    const handleRoomChange = useCallback(async (room: Room) => {
        console.log("ROOM:", room);
        if (currentUser) {
            if (currentRoom && currentRoomId) {
                await leaveRoom();
            }

            const joinSuccess = await joinRoom(room._id, room.name);

            if (joinSuccess) {
                setCurrentRoom(room);
                await loadMessages(room._id);
            } else {
                console.error('Failed to join room via SSE');
                setCurrentRoom(room);
                await loadMessages(room._id);
            }
        }
    }, [currentUser, currentRoom, currentRoomId, leaveRoom, joinRoom, loadMessages]);

    const handleSendMessage = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();

        if (newMessage.trim() && currentUser && currentRoom) {
            try {
                const messageData = {
                    content: newMessage.trim(),
                    user_id: currentUser._id,
                    room_id: currentRoom._id
                };

                await chatService.sendMessage(messageData);

                setNewMessage('');
                setIsTyping(false);

                if (isConnected) {
                    sendTyping(false);
                }
            } catch (error) {
                console.error('Error sending message:', error);
            }
        }
    }, [newMessage, currentUser, currentRoom, isConnected, sendTyping]);

    const handleTyping = useCallback((value: string) => {
        setNewMessage(value);

        if (isConnected && currentUser && currentRoom) {
            if (!isTyping && value.trim()) {
                setIsTyping(true);
                sendTyping(true);
            }

            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }

            typingTimeoutRef.current = setTimeout(() => {
                setIsTyping(false);
                sendTyping(false);
            }, 1000);
        }
    }, [isConnected, currentUser, currentRoom, isTyping, sendTyping]);

    const handleCreateRoom = useCallback(async () => {
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
                            socketId: ''
                        };
                    }),
                    isActive: true
                };

                roomData.users.push({
                    id: currentUser._id,
                    username: currentUser.username,
                    socketId: ''
                });

                const newRoom = await chatService.createRoom(roomData);
                setRooms(prev => [...prev, newRoom]);
                setNewRoomName('');
                setSelectedUsers([]);
                setShowCreateRoomModal(false);

                handleRoomChange(newRoom);
            } catch (error) {
                console.error('Error creating room:', error);
            }
        }
    }, [newRoomName, currentUser, roomType, selectedUsers, allUsers, handleRoomChange]);

    const handlePrivateChat = useCallback(async (user: UserC) => {
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
    }, [currentUser, rooms, handleRoomChange]);

    const handleMessageSearch = async () => {
        if (messageSearchQuery.trim() && currentRoom) {
            try {
                const searchResults = await chatService.searchMessages(currentRoom._id, messageSearchQuery);
                setMessages(searchResults.messages || []);
            } catch (error) {
                console.error('Error searching messages:', error);
            }
        } else if (currentRoom) {
            loadMessages(currentRoom._id);
        }
    };

    const loadMoreMessages = () => {
        if (currentRoom && hasMoreMessages) {
            loadMessages(currentRoom._id, currentPage + 1);
        }
    };

    const filteredRooms = useMemo(() =>
        rooms.filter(room =>
            room.name.toLowerCase().includes(searchTerm.toLowerCase())
        ),
        [rooms, searchTerm]
    );

    const filteredUsers = useMemo(() =>
        allUsers.filter(user =>
            user.username.toLowerCase().includes(searchTerm.toLowerCase())
        ),
        [allUsers, searchTerm]
    );

    const getDisplayName = (user: UserC): string => {
        return user.username;
    };

    const getSenderDisplayName = (message: Message): string => {
        if (message.user_id) return message.user_id.username;
        return "Unknown Sender";
    };

    const getConnectionStatus = () => {
        if (isConnecting) return { text: 'Connecting...', color: 'warning' };
        if (isConnected) return { text: 'Connected', color: 'success' };
        if (sseError) return { text: `Error: ${sseError}`, color: 'danger' };
        return { text: 'Disconnected', color: 'secondary' };
    };

    const connectionStatus = getConnectionStatus();

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
        <Container fluid className="bg-gray-100 chat-room-container">
            <Row className="h-100">
                {/* Sidebar */}
                <Col md={3} className="bg-dark border-end p-0 h-100">
                    <div className="d-flex flex-column h-100">
                        {/* Header */}
                        <div className="p-3 border-bottom header-section bg-dark text-white">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="mb-0 text-white">Chat Rooms</h5>
                                <Button
                                    className='create-room-button'
                                    variant="outline-light"
                                    size="sm"
                                    onClick={() => setShowCreateRoomModal(true)}
                                >
                                    <Plus size={16} />
                                </Button>
                            </div>

                            {/* Connection Status */}
                            <div className="mb-3">
                                <Badge bg={connectionStatus.color} className="d-block w-100 py-2">
                                    {connectionStatus.text}
                                </Badge>
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
                        <div className="flex-grow-1 overflow-auto rooms-list">
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
                                                <strong className="text-truncate">
                                                    {room.type !== 'private' ? room.name :
                                                        room.users && room.users.length > 0 ?
                                                            (currentUser?.username === room.users[0].username ?
                                                                (room.users.length > 1 ? room.users[1].username : 'No Chat Partner')
                                                                : room.users[0].username)
                                                            : 'Private Room'}
                                                </strong>
                                                <small className="text-muted last-activity">
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
                                <small className="text-muted">Room Users ({roomUsers.length})</small>
                                <Button
                                    variant="link"
                                    size="sm"
                                    onClick={() => setShowUserListModal(true)}
                                >
                                    <Users size={16} />
                                </Button>
                            </div>
                            <div className="d-flex flex-wrap gap-1">
                                {roomUsers.slice(0, 5).map((user: any) => (
                                    <Badge
                                        key={user.userId}
                                        bg="success"
                                        pill
                                        className="cursor-pointer"
                                        onClick={() => {
                                            const fullUser = allUsers.find(u => u._id === user.userId);
                                            if (fullUser && fullUser._id !== currentUser?._id) {
                                                handlePrivateChat(fullUser);
                                            }
                                        }}
                                    >
                                        {user.username}
                                    </Badge>
                                ))}
                                {roomUsers.length > 5 && (
                                    <Badge bg="secondary" pill>
                                        +{roomUsers.length - 5}
                                    </Badge>
                                )}
                            </div>
                        </div>
                    </div>
                </Col>

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
                                                    `${roomUsers.length} members online`}
                                        </small>
                                    </div>
                                    <div className="d-flex gap-2">
                                        {currentRoom.type === 'private' && (
                                            <>
                                                <Button disabled variant="outline-light" size="sm">
                                                    <Phone size={16} />
                                                </Button>
                                                <Button disabled variant="outline-light" size="sm">
                                                    <Video size={16} />
                                                </Button>
                                            </>
                                        )}
                                        <Dropdown>
                                            <Dropdown.Toggle variant="outline-light" size="sm">
                                                <MoreVertical size={16} />
                                            </Dropdown.Toggle>
                                            <Dropdown.Menu>
                                                <Dropdown.Item disabled>Room Settings</Dropdown.Item>
                                                <Dropdown.Item disabled>View Members</Dropdown.Item>
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
                                                <Dropdown.Item disabled className="text-danger">Leave Room</Dropdown.Item>
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

                                <div className="space-y-4 overflow-auto p-3" style={{ height: 'calc(100vh - 210px - 60px)' }}>
                                    {getAllMessages().map(message => (
                                        <div
                                            key={message._id}
                                            className={`d-flex ${message.user_id._id === currentUser?._id ? 'justify-content-end' : 'justify-content-start'}`}
                                        >
                                            <div className={`max-w-75 message-box ${message.user_id._id === currentUser?._id ? 'bg-success text-white' : 'bg-dark border'} p-3 rounded-lg shadow-sm rounded mt-1`} style={{ minWidth: '200px' }}>
                                                {message.user_id._id !== currentUser?._id && (
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

                                    {/* System messages from SSE */}
                                    {sseMessages.filter((msg: any) => msg.type === 'system').map((msg: any) => (
                                        <div key={msg.id} className="d-flex justify-content-center">
                                            <div className="bg-light border p-2 rounded-lg shadow-sm">
                                                <small className="text-muted">
                                                    {msg.content}
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
                                        <Button disabled variant="outline-secondary">
                                            <Paperclip size={16} />
                                        </Button>
                                        <Form.Control
                                            type="text"
                                            placeholder={!isConnected ? 'Connecting to chat...' : 'Type your message...'}
                                            value={newMessage}
                                            onChange={(e) => handleTyping(e.target.value)}
                                            disabled={!isConnected}
                                        />
                                        <Button disabled variant="outline-secondary">
                                            <Smile size={20} />
                                        </Button>
                                        <Button
                                            type="submit"
                                            variant="primary"
                                            className='send-button'
                                            disabled={!isConnected || !newMessage.trim()}
                                        >
                                            <Send size={20} />
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
                                {!isConnected && (
                                    <div className="text-warning mt-2">
                                        <h6>Establishing connection...</h6>
                                    </div>
                                )}
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