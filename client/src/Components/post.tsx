import { Button, Card, Col, Image, Row, Modal } from "react-bootstrap";
import { Link } from "react-router-dom";
import { useState } from "react";
import { timeSince } from "../Static/date.methods";
import { IPostData } from "../Network/post.api";
import useFetch from "../Hooks/useFetch";
import { useAuth } from "../Context/auth.context";
import '../styles/post.css'; // Import the separated CSS

const API_BASE_URL = process.env.NODE_ENV === 'production'
    ? process.env.BASE_URL || 'https://opalsocialbe.vercel.app'
    : process.env.DEV_API_URL || 'http://localhost:4000';

interface Like {
    _id: string;
    user_id: string;
    post_id: string;
}

export function Post({ post }: { post: IPostData }) {
    const [showImageModal, setShowImageModal] = useState(false);

    const { data: likes, setData: setLikes } = useFetch<Like[]>(
        `${API_BASE_URL}/api/likes/post/${post._id}`
    );

    const { data: commentsAmount } = useFetch<number>(
        `${API_BASE_URL}/api/comments/count/post/${post._id}`
    );

    const { user: currentUser } = useAuth();
    const userLike = (likes ?? []).find(like => like.user_id === currentUser?._id);
    const likeCount = likes?.length || 0;

    const handleImageClick = () => {
        setShowImageModal(true);
    };

    const handleCloseModal = () => {
        setShowImageModal(false);
    };

    async function handleLike() {
        const previousLikes = likes ?? [];
        const previousLikeId = userLike?._id;

        try {
            // Optimistic update
            if (userLike) {
                // Remove like
                setLikes(previousLikes.filter(like => like._id !== previousLikeId));
            } else {
                // Add like
                const tempLikeId = `temp-${Date.now()}`;
                setLikes([
                    ...(likes ?? []),
                    {
                        _id: tempLikeId,
                        user_id: currentUser?._id ?? "",
                        post_id: post._id ?? ""
                    }
                ]);
            }

            // Server request
            if (userLike) {
                await fetch(`${API_BASE_URL}/api/likes/${previousLikeId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
            } else {
                const response = await fetch(`${API_BASE_URL}/api/likes`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        user_id: currentUser?._id,
                        post_id: post._id,
                    }),
                });

                const newLike = await response.json();

                // Replace temporary like with server-generated like
                setLikes(prev => [
                    ...prev!.filter(like => !like._id.startsWith('temp-')),
                    newLike
                ]);
            }
        } catch (error) {
            console.error('Error updating like:', error);
            // Revert to previous state if request fails
            setLikes(previousLikes);
        }
    }

    return (
        <>
            <Card className="post-card mb-4 border-0 shadow-lg">
                <Card.Header className="post-header bg-transparent border-0 pb-0">
                    <Row className="align-items-center">
                        <Col>
                            <div className="user-details">
                                <Card.Subtitle className="handle text-muted">
                                    <a href={`/user/${post.user_id!._id}`}>@{post.user_id!.username}</a>
                                </Card.Subtitle>
                            </div>
                        </Col>
                        <Col xs="auto">
                            <Card.Text className="post-time text-muted mb-0">
                                {timeSince(new Date(post.createdAt!))}
                            </Card.Text>
                        </Col>
                    </Row>
                </Card.Header>

                <Card.Body className="post-content">
                    <Card.Title className="post-title">
                        <Link to={`/post/${post._id}`} className="text-decoration-none" style={{ color: 'inherit' }}>
                            {post.title}
                        </Link>
                    </Card.Title>
                    {post.body && (
                        <Card.Text className="post-body">{post.body}</Card.Text>
                    )}

                    {post.file && (
                        <div className="post-image-container" onClick={handleImageClick}>
                            <Image
                                src={post.file ?? undefined}
                                alt={post.title}
                                className="post-image clickable-image"
                            />
                        </div>
                    )}
                </Card.Body>

                <Card.Footer className="post-footer bg-transparent border-0 pt-0">
                    <Row className="justify-content-between align-items-center">
                        <Col xs="auto">
                            <Button
                                variant="link"
                                className="action-button like-button p-2"
                                onClick={handleLike}
                                disabled={!currentUser}
                                style={{ color: userLike ? "red" : "currentColor" }}
                            >
                                <svg
                                    width="20"
                                    height="20"
                                    viewBox="0 0 24 24"
                                    fill={userLike ? "red" : "none"}
                                    stroke={userLike ? "red" : "currentColor"}
                                    strokeWidth="2"
                                >
                                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                                </svg>
                                <span className="ms-2 d-none d-md-inline">{likeCount}</span>
                            </Button>
                        </Col>
                        <Col xs="auto">
                            <Link to={`/post/${post._id}`} className="text-decoration-none">
                                <Button variant="link" className="action-button comment-button p-2">
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                                    </svg>
                                    <span className="ms-2 d-none d-md-inline">{commentsAmount}</span>
                                </Button>
                            </Link>
                        </Col>
                    </Row>
                </Card.Footer>
            </Card>

            {/* Image Modal */}
            <Modal
                show={showImageModal}
                onHide={handleCloseModal}
                size="xl"
                centered
                className="image-modal"
            >
                <Modal.Header closeButton className="image-modal-header">
                    <Modal.Title className="image-modal-title">{post.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="image-modal-body">
                    <div className="modal-image-container">
                        <Image
                            src={post.file ?? undefined}
                            alt={post.title}
                            className="modal-image"
                        />
                    </div>
                </Modal.Body>
            </Modal>
        </>
    );
}