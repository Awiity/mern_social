import React, { useState } from 'react';
import { Button, Card, Col, Row, Form, Alert, Spinner } from 'react-bootstrap';
import { useParams } from 'react-router-dom';
import { timeSince } from '../Static/date.methods';
import { IPostData } from '../Network/post.api';
import useFetch from '../Hooks/useFetch';
import { useAuth } from '../Context/auth.context';
import { Post } from '../Components/post';

interface Comment {
    _id: string;
    user_id: {
        _id: string;
        username: string;
    };
    post_id: string;
    content: string;
    createdAt: string;
}

export function PostPage() {
    const { id } = useParams<{ id: string }>();
    const { user: currentUser } = useAuth();
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);

    // Fetch post data
    const { data: post, isLoading: postLoading, error: postError } = useFetch<IPostData>(
        `http://localhost:4000/api/posts/${id}`
    );


    // Fetch comments
    const { data: comments, setData: setComments, reload: reloadComments } = useFetch<Comment[]>(
        `http://localhost:4000/api/comments/post/${id}`
    );


    async function handleSubmitComment(e: React.FormEvent) {
        e.preventDefault();
        if (!currentUser || !post || !newComment.trim()) return;

        setIsSubmitting(true);
        setSubmitError(null);

        try {
            const response = await fetch(`http://localhost:4000/api/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    user_id: currentUser._id,
                    post_id: post._id,
                    content: newComment.trim(),
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to submit comment');
            }

            const newCommentData = await response.json();
            
            // Add the new comment to the comments list
            setComments(prev => [...(prev || []), newCommentData]);
            setNewComment('');
        } catch (error) {
            console.error('Error submitting comment:', error);
            setSubmitError('Failed to submit comment. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    }

    if (postLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center min-vh-100">
                <Spinner animation="border" variant="success" />
            </div>
        );
    }

    if (postError || !post) {
        return (
            <div className="container mt-5">
                <Alert variant="danger">
                    {postError?.message || 'Post not found'}
                </Alert>
            </div>
        );
    }

    return (
        <div className="container mt-4">
            <div className="row justify-content-center">
                <div className="col-lg-8">
                    {/* Main Post */}
                    <Post post={post}></Post>

                    {/* Comment Form */}
                    {currentUser && (
                        <Card className="comment-form-card mb-4">
                            <Card.Body>
                                <Form onSubmit={handleSubmitComment}>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="comment-form-label">Add a comment</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            value={newComment}
                                            onChange={(e) => setNewComment(e.target.value)}
                                            placeholder="Write your comment..."
                                            className="comment-textarea"
                                            disabled={isSubmitting}
                                        />
                                    </Form.Group>
                                    {submitError && (
                                        <Alert variant="danger" className="mb-3">
                                            {submitError}
                                        </Alert>
                                    )}
                                    <div className="d-flex justify-content-end">
                                        <Button
                                            type="submit"
                                            className="comment-submit-btn"
                                            disabled={!newComment.trim() || isSubmitting}
                                        >
                                            {isSubmitting ? (
                                                <>
                                                    <Spinner
                                                        as="span"
                                                        animation="border"
                                                        size="sm"
                                                        role="status"
                                                        aria-hidden="true"
                                                        className="me-2"
                                                    />
                                                    Posting...
                                                </>
                                            ) : (
                                                'Post Comment'
                                            )}
                                        </Button>
                                    </div>
                                </Form>
                            </Card.Body>
                        </Card>
                    )}

                    {/* Comments Section */}
                    <Card className="comments-section">
                        <Card.Header className="comments-header">
                            <h5 className="mb-0">Comments ({comments?.length || 0})</h5>
                        </Card.Header>
                        <Card.Body className="comments-body">
                            {comments && comments.length > 0 ? (
                                comments.map((comment) => (
                                    <div key={comment._id} className="comment-item">
                                        <div className="comment-header">
                                            <div className="comment-user">
                                                <a href={`/user/${comment.user_id._id}`} className="comment-username">
                                                    @{comment.user_id.username}
                                                </a>
                                                <span className="comment-time">
                                                    {timeSince(new Date(comment.createdAt))}
                                                </span>
                                            </div>
                                        </div>
                                        <div className="comment-content">
                                            {comment.content}
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="no-comments">
                                    <p className="text-muted">No comments yet. Be the first to comment!</p>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </div>
            </div>
        </div>
    );
}