// gonna be latest posted posts
import { Alert, Button, Card, Container, Image, Spinner } from "react-bootstrap";
import useFetch from "../Hooks/useFetch";
import AddPostModal from "../Components/add.post.modal";
import { useState } from "react";
import { timeSince } from "../Static/date.methods";
import { useAuth } from "../Context/auth.context";
import { deletePost } from "../Network/post.api";
import '../styles/news.css';
import add_svg from '../Static/SVGs/add.svg';

interface IPostData {
    title: string,
    body: string | null,
    user_id: { username: string, _id: string },
    file: string,
    createdAt: Date,
    _id?: string
}

export function NewsPage() {
    const { user: currentUser } = useAuth();
    const { data, setData, error, isLoading } = useFetch("http://localhost:4000/api/posts");
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
        <Container className="w-50 main-container" style={{ minWidth: 875 }}>
            <div className="w-100 d-flex justify-content-center">
                <Button className="mt-5" size="lg" variant="success" onClick={() => setShowModal(true)}>
                    <img src={add_svg} width="35px" /> Create new Post</Button>
            </div>
            <AddPostModal show={showModal} onClose={() => setShowModal(false)} posts={data} setPosts={setData} />
            {data instanceof Array && data.length > 0 ? data.map((item: IPostData) => (
                <Card className="mt-3" key={item._id} >
                    <Card.Header>
                        <Card.Title><a href={`/user/${item.user_id._id}`} className="d-flex" style={{color:"#90ee91", textDecoration: 'none'}}>@{item.user_id.username} <p className="text-muted ms-1"> posted:</p></a> <p>{item.title}</p></Card.Title>
                    </Card.Header> 
                    <Card.Body>{item.body}</Card.Body>
                    <Image src={item.file} className="d-flex justify-center border rounded" style={{objectFit: "cover", maxHeight:500}}></Image>
                    <Card.Footer className="d-flex justify-content-between align-items-center">
                        {(currentUser && (currentUser.role === 'admin'))
                            ?
                            <>
                                <Button variant="danger" onClick={() => handleItemRemove(item._id!)}>Delete</Button>

                            </>
                            : <Card.Text className="text-muted"></Card.Text>}
                        <Card.Text className="text-muted"><small>{timeSince(new Date(item.createdAt))} ago</small></Card.Text>

                    </Card.Footer>
                </Card>
            )) : (isLoading ? (error instanceof Error ? <Alert variant="danger">{error.message}</Alert>
                : <Spinner />) : <p className="text-center mt-3">News feed is empty</p>)}
        </Container>
    );

}