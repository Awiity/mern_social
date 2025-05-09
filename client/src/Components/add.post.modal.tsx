/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState } from 'react';
import { Modal, Button, Form, Alert, Spinner } from 'react-bootstrap';
import { useAuth } from '../Context/auth.context';
import { postNew, IPostData } from '../Network/post.api';


interface ModalComponentProps {
    show: boolean;
    title?: string;
    body?: React.ReactNode;
    footer?: React.ReactNode;
    onClose?: () => void;
}


const AddPostModal: React.FC<ModalComponentProps> = ({ show, onClose }) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<Error | null>();
    const [resMsg, setResMsg] = useState<string>();
    const [post, setPost] = useState<IPostData>({
        title: "",
        body: "",
        user_id: user ? user._id : "",
    });


    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setLoading(true);
        setError(null);
        console.log("sending ", post)
        try {
            const response = await postNew(post);
            if (response?.statusText == "OK") { console.log("post created"); setResMsg("Post has been successfully created"); }

        } catch (error) {
            if (error instanceof Error)
                setError(error);
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
                        ></Form.Control>
                    </Form.Group>
                    <Form.Group className='mb-3'>
                        <Form.Label>Body</Form.Label>
                        <Form.Control
                            id='body'
                            as='textarea'
                            rows={10}
                            value={post?.body || ""}
                            onChange={ e => setPost({...post, body: e.target.value})}
                            ></Form.Control>
                    </Form.Group>

                </Form>
                {error && <Alert variant='danger'>{error.message}</Alert>}
                {resMsg && <Alert variant='success'>{resMsg}</Alert>}
            </Modal.Body>
            <Modal.Footer>
                <Button variant='success' type='submit' form='post-form'><Spinner size='sm' hidden={!loading} ></Spinner>Submit</Button>
                <Button variant='danger' onClick={onClose}>Cancel</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default AddPostModal;