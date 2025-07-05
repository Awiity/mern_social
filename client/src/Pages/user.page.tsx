import { useParams } from "react-router";
import { useAuth } from "../Context/auth.context";
import { Alert, Card, Container, Spinner } from "react-bootstrap";
import useFetch from "../Hooks/useFetch";
import { Post } from "../Components/post";
import { IPostData } from "../Network/post.api";

type User = {
    _id: string;
    username: string;
    email: string;
    role: string;
    firstname: string;
    lastname?: string;
    // add other user properties as needed
};


export function UserPage() {
    const { user: currentUser } = useAuth();
    const { id: user_id } = useParams();
    const { data, error, isLoading } = useFetch<User>(`http://localhost:4000/api/users/${user_id}`);
    const { data: posts, error: postsError, isLoading: postsLoading } = useFetch<IPostData[]>(`http://localhost:4000/api/posts/user/${data?._id}`);

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
            {posts instanceof Array && posts.length > 0 ? posts.map((post: IPostData) => (
                <Post key={post._id} post={post} />
            )) : (isLoading ? (error instanceof Error ? <Alert variant="danger">{error.message}</Alert>
                : <Spinner />) : <p className="text-center mt-3">News feed is empty</p>)}
            {postsError && <Card.Text className="text-center text-danger"> {postsError.message}</Card.Text>}
            {postsLoading && <p className="text-center">Loading posts...</p>}
        </Container>
    )
};