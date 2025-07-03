import { useParams } from "react-router";
import { useAuth } from "../Context/auth.context";
import { Card, Container } from "react-bootstrap";
import useFetch from "../Hooks/useFetch";

type User = {
    _id: string;
    username: string;
    email: string;
    role: string;
    firstname: string;
    lastname?: string;
    // add other user properties as needed
};
type Post = {
    _id: string;
    title: string;
    body: string;
    user_id: string;
    createdAt: string;
    file?: string;
};

export function UserPage() {
    const { user: currentUser } = useAuth();
    const { id: user_id } = useParams();
    const { data, error, isLoading } = useFetch<User>(`http://localhost:4000/api/users/${user_id}`);
    const { data: posts, error: postsError, isLoading: postsLoading } = useFetch<Post[]>(`http://localhost:4000/api/posts/user/${data?._id}`);

    return (
        <Container className="w-50 main-container" style={{ minWidth: 875 }}>
            {data! &&
                <Card className="mt-5">
                    <Card.Body>
                        <Card.Text className="text-left">
                            Name: {data.firstname} {data.lastname || ""}
                            <br />
                            Email: {currentUser?.email}
                        </Card.Text>
                        <Card.Text className="text-muted text-end">
                            Role: {data.role === "admin" ? <span className="text-danger">Admin</span> : <span className="text-primary">User</span>}
                        </Card.Text>
                    </Card.Body>
                    <Card.Footer className="text-center text-muted">
                        This is <span className="text-success">{data.username}</span> profile page.
                    </Card.Footer>
                </Card>
            }
            {isLoading && <p className="text-center">Loading...</p>}
            {error && <Card.Text className="text-center text-danger"> {error.message}</Card.Text>}
            {posts! && (
                <Container className="mt-4">
                    {postsLoading && <p className="text-center text-secondary">Loading posts...</p>}
                    {postsError && <Card.Text className="text-center text-danger"> {postsError.message}</Card.Text>}
                    {posts.length > 0 ? (
                        posts.map((post) => (
                            <Card key={post._id} className="mb-3">
                                <Card.Header>
                                    <Card.Title>{post.title}</Card.Title>
                                </Card.Header>
                                <Card.Body>
                                    <Card.Text>{post.body}</Card.Text>
                                    {post.file && (
                                        <Card.Img variant="top" src={post.file} alt="Post file" />
                                    )}
                                </Card.Body>
                                <Card.Footer className="text-muted">
                                    Posted on: {new Date(post.createdAt).toLocaleDateString()}
                                </Card.Footer>
                            </Card>
                        ))
                    ) : (
                        <Container className="text-center mt-3">
                            <Card.Text className="text-secondary">No posts found for this user.</Card.Text>
                        </Container>
                    )}
                </Container>
            )}
            {postsError && <Card.Text className="text-center text-danger"> {postsError.message}</Card.Text>}
            {postsLoading && <p className="text-center">Loading posts...</p>}
        </Container>
    )
};