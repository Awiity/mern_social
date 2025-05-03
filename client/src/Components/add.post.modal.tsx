import React from 'react';
import { Modal, Button, Form } from 'react-bootstrap';

interface ModalComponentProps {
    show: boolean;
    title?: string;
    body?: React.ReactNode;
    footer?: React.ReactNode;
    onClose?: () => void;
}

const AddPostModal: React.FC<ModalComponentProps> = ({ show, title, body, footer, onClose }) => {
    return (
        <Modal show={show} onHide={onClose}>
            <Modal.Body>
                <Form>
                    <Form.Group controlId='title' className='mb-3' >
                        <Form.Label>Title</Form.Label>
                        <Form.Control></Form.Control>
                    </Form.Group>
                    <Form.Group controlId='body' className='mb-3'>
                        <Form.Label>Body</Form.Label>
                        <Form.Control></Form.Control>
                    </Form.Group>
                    
                </Form>
            </Modal.Body>
            <Modal.Footer>
                <Button variant='danger' onClick={onClose}>Cancel</Button>
            </Modal.Footer>
        </Modal>
    );
};

export default AddPostModal;