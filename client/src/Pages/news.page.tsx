// gonna be latest posted posts
import { Alert, Button, Container, Spinner } from "react-bootstrap";
import useFetch from "../Hooks/useFetch";
import AddPostModal from "../Components/add.post.modal";
import { useState } from "react";
//import { deletePost } from "../Network/post.api";
import '../styles/news.css';
import add_svg from '../Static/SVGs/add.svg';
import { Post } from "../Components/post";

interface IPostData {
    title: string,
    body: string | null,
    user_id: { username: string, _id: string },
    file: string,
    createdAt: Date,
    _id?: string
}

export function NewsPage() {
    const { data, setData, error, isLoading } = useFetch("http://localhost:4000/api/posts");
    const [showModal, setShowModal] = useState<boolean>(false);
    /*
    async function handleItemRemove(_id: string) {
        try {
            const response = await deletePost(_id);
            if (response?.statusText == "OK") console.log("post deleted")
            setData((l: Array<IPostData>) => l.filter(item => item._id !== _id));
        } catch (error) {
            console.error(error);
        }
    }*/

    return (
        <Container className="w-50 main-container" style={{ minWidth: 875 }}>
            <div className="w-100 d-flex justify-content-center">
                <Button className="mt-5 add-btn" size="lg" variant="success" onClick={() => setShowModal(true)}>
                    <img src={add_svg} width="35px" /> Create new Post</Button>
            </div>
            <AddPostModal show={showModal} onClose={() => setShowModal(false)} posts={data} setPosts={setData} />
            {data instanceof Array && data.length > 0 ? data.map((post: IPostData) => (
                <Post key={post._id} post={post}  />
            )) : (isLoading ? (error instanceof Error ? <Alert variant="danger">{error.message}</Alert>
                : <Spinner />) : <p className="text-center mt-3">News feed is empty</p>)}
        </Container>
    );

}