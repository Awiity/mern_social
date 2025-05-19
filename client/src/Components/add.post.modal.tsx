/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { ChangeEvent, Dispatch, useState } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../Context/auth.context';
import { postNew } from '../Network/post.api';
import { sleep } from '../Static/static.methods';
import '../styles/addpost.css';
import check_svg from "../Static/SVGs/check.svg";
import close_svg from "../Static/SVGs/close.svg";
import { AxiosError } from 'axios';

interface ModalComponentProps {
    show: boolean;
    title?: string;
    body?: React.ReactNode;
    footer?: React.ReactNode;
    onClose?: () => void;
    posts?: unknown;
    setPosts: Dispatch<unknown>;
}
interface IPostData {
    title: string;
    body: string;
    user_id?: string;
    createdAt?: string;
    file?: File | null;
}

const AddPostModal: React.FC<ModalComponentProps> = ({ show, onClose, posts, setPosts }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>();
    const [resMsg, setResMsg] = useState<string>();
    const [post, setPost] = useState<IPostData>({
        title: "",
        body: "",
        file: null
    });

    function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
        if (e.target.files) {
            setPost({ ...post, file: e.target.files[0] });

        }
    }


    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            if (!user) { throw new Error("Unknown authentication error"); }
            const formData = new FormData();
            formData.append('title', post.title);
            formData.append('body', post.body);
            formData.append('user_id', user._id);
            if (post.file) formData.append('post_file', post.file);
            const response = await postNew(formData);
            console.log(response);
            if (response?.statusText === "OK") {
                console.log("post crceated ", response);
                setResMsg("Post has been successfully created");
            };
            if (posts instanceof Array) setPosts([response.data, ...posts]);
            setLoading(false);

            await sleep(3000);
            onClose?.();
            setPost({ title: "", body: "" })

        } catch (error) {
            if (error instanceof AxiosError) {
                console.log(error);
                setError(error);
            }
        } finally {
            setLoading(false);
            setResMsg("");
        }
    }
    return (
        <Modal show={show} onHide={onClose} size='lg'>
            <Modal.Body>
                <Form onSubmit={handleSubmit} id='post-form'>
                    <Form.Group className='mb-3' >
                        <Form.Label>Title</Form.Label>
                        <Form.Control
                            id='title'
                            value={post?.title || ""}
                            onChange={(e) => { setPost({ ...post, title: e.target.value }) }}
                            minLength={3}
                            maxLength={40}
                        ></Form.Control>
                    </Form.Group>
                    <Form.Group className='mb-3'>
                        <Form.Label>Body</Form.Label>
                        <Form.Control
                            id='body'
                            as='textarea'
                            rows={10}
                            value={post?.body || ""}
                            onChange={e => setPost({ ...post, body: e.target.value })}
                        ></Form.Control>
                    </Form.Group>
                    <Form.Group className='mb-3'>
                        <Form.Label>Photo</Form.Label>
                        <Form.Control
                            id='file'
                            type='file'
                            name='post_file'
                            onChange={handleFileChange}
                        ></Form.Control>
                        {post.file &&
                            <div className='mt-3'>
                                <p>{post.file.name}</p>
                                <p>{post.file.type}</p>
                                <p>{Math.floor(post.file.size / 1024)} KB</p>
                            </div>
                        }
                    </Form.Group>

                </Form>
                {error && <Alert variant='danger'>{error.message}</Alert>}
                {resMsg && <><Alert variant='success'>
                    <div className="progress mb-3">
                        <div className="progress-value"></div>
                    </div>
                    <p className='mb-3'>{resMsg}</p></Alert></>}
            </Modal.Body>
            <Modal.Footer className='d-flex justify-content-between'>
                <Button variant='success' type='submit' form='post-form' disabled={loading}><Spinner size='sm' hidden={!loading } ></Spinner>
                    <img src={check_svg} width="25px" /> Submit
                </Button>
                <Button variant='danger' onClick={onClose}>
                    <img src={close_svg} width="25px" /> Cancel</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default AddPostModal;