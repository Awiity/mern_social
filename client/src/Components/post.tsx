import { Button, Card, Col, Image, Row } from "react-bootstrap";
import { timeSince } from "../Static/date.methods";
import { IPostData } from "../Network/post.api";

export function Post({ post }: { post: IPostData }) {

    return (
        <Card className="post-card mb-4 border-0 shadow-lg">
            <Card.Header className="post-header bg-transparent border-0 pb-0">
                <Row className="align-items-center">
                    <Col>
                        <div className="user-details">
                            <Card.Subtitle className="handle text-muted"><a href={`/user/${post.user_id!._id}`}>@{post.user_id!.username}</a></Card.Subtitle>
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
                <Card.Title className="post-title">{post.title}</Card.Title>
                {post.body && (
                    <Card.Text className="post-body">{post.body}</Card.Text>
                )}

                {post.file && (
                    <div className="post-image-container">
                        <Image
                            src={post.file}
                            alt={post.title}
                            fluid
                            className="post-image"
                        />
                    </div>
                )}
            </Card.Body>

            <Card.Footer className="post-footer bg-transparent border-0 pt-0">
                <Row className="justify-content-between align-items-center">
                    <Col xs="auto">
                        <Button variant="link" className="action-button like-button p-2">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                            </svg>
                            <span className="ms-2 d-none d-md-inline">Like</span>
                        </Button>
                    </Col>
                    <Col xs="auto">
                        <Button variant="link" className="action-button comment-button p-2">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
                            </svg>
                            <span className="ms-2 d-none d-md-inline">Comment</span>
                        </Button>
                    </Col>

                </Row>
            </Card.Footer>
        </Card>
    );
}