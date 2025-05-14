// gonna be latest posted posts
import { Button, Card, Container, Spinner } from "react-bootstrap";
import useFetch from "../Hooks/useFetch";
import AddPostModal from "../Components/add.post.modal";
import { useState } from "react";
import { timeSince } from "../Static/date.methods";
import { useAuth } from "../Context/auth.context";
import { deletePost, IPostData } from "../Network/post.api";
import '../styles/news.css'
/*
interface IPostData {
    title: string,
    body: string | null,
    user_id: string,
    createdAt: Date
}
    */
export function NewsPage() {
    const { user: currentUser } = useAuth();
    const { data, setData, error, isLoading, reloadCount } = useFetch("http://localhost:4000/api/posts");
    const [showModal, setShowModal] = useState<boolean>(false);

    async function handleItemRemove(_id: string) {
        try {
            const response = await deletePost(_id);
            if (response?.statusText == "OK") console.log("post deleted")
            setData((l: Array<IPostData>) => l.filter(item => item._id !== _id));
        } catch (error) {
            console.error(error);
        }
    }

    return (
        <Container className="w-50 main-container" style={{ minWidth: 576 }}>
            <div className="w-100 d-flex justify-content-center">
                <Button className="mt-5" size="lg" variant="success" onClick={() => setShowModal(true)}>Create new Post</Button>
            </div>
            <AddPostModal show={showModal} onClose={() => setShowModal(false)} posts={data} setPosts={setData} />
            {data instanceof Array ? data.map((item) => (
                <Card className="mt-3" key={item._id} >
                    <Card.Header>
                        <Card.Title>{item.title}</Card.Title>
                    </Card.Header>
                    <Card.Body>{item.body}</Card.Body>
                    <Card.Footer className="d-flex justify-content-between align-items-center">
                        {(currentUser && (currentUser == item.user_id || currentUser.role == 'admin'))
                            ? <Button variant="danger" onClick={() => handleItemRemove(item._id)}>Delete</Button>
                            : <Button variant="secondary">idk</Button>}
                        <Card.Text className="text-muted"><small>{timeSince(new Date(item.createdAt))} ago</small></Card.Text>

                    </Card.Footer>
                </Card>
            )) : (<Spinner />)}
        </Container>
    );

}