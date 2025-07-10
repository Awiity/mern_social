import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import '../styles/register.css'; 
import { register } from '../Network/user.api';
import { useNavigate } from 'react-router';

interface RegisterFormData {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
    firstname: string;
    lastname: string;
    description: string;
    address: string;
    role: 'user'; // Default role
}

export const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState<RegisterFormData>({
        username: '',
        email: '',
        password: '',
        confirmPassword: '',
        firstname: '',
        lastname: '',
        description: '',
        address: '',
        role: 'user' // Default role
    });
    const [showAlert, setShowAlert] = useState<boolean>(false);
    const [passwordMatch, setPasswordMatch] = useState<boolean>(true);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Check password match
        if (name === 'password' || name === 'confirmPassword') {
            if (name === 'password') {
                setPasswordMatch(value === formData.confirmPassword || formData.confirmPassword === '');
            } else {
                setPasswordMatch(value === formData.password);
            }
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();

        if (!passwordMatch) {
            return;
        }
        try {
            const response = await register(formData);
            if (response.status === 200) {
                setShowAlert(true);
            }
        } catch (error) {
            console.error('Error during registration:', error);
        }
        setShowAlert(true);
        setTimeout(() => {setShowAlert(false); navigate('/login')}, 3000);
    };

    return (
        <div className="register-container">
            <Container fluid className="min-vh-100 d-flex align-items-center justify-content-center py-5">
                <Row className="w-100">
                    <Col xs={12} sm={10} md={8} lg={6} xl={5} className="mx-auto">
                        <Card className="register-card shadow-lg border-0">
                            <Card.Body className="p-5">
                                <div className="text-center mb-5">
                                    <h2 className="register-title mb-2">Create Account</h2>
                                    <p className="register-subtitle text-muted">Join us today and get started</p>
                                </div>

                                {showAlert && (
                                    <Alert variant="success" className="custom-alert mb-4">
                                        Registration successful! Redirecting to login...
                                    </Alert>
                                )}

                                <Form onSubmit={handleSubmit}>
                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-4">
                                                <Form.Label className="form-label">Username *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="username"
                                                    value={formData.username}
                                                    onChange={handleInputChange}
                                                    placeholder="Choose a username"
                                                    className="custom-input"
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-4">
                                                <Form.Label className="form-label">Email Address *</Form.Label>
                                                <Form.Control
                                                    type="email"
                                                    name="email"
                                                    value={formData.email}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter your email"
                                                    className="custom-input"
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-4">
                                                <Form.Label className="form-label">First Name *</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="firstname"
                                                    value={formData.firstname}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter your first name"
                                                    className="custom-input"
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-4">
                                                <Form.Label className="form-label">Last Name</Form.Label>
                                                <Form.Control
                                                    type="text"
                                                    name="lastname"
                                                    value={formData.lastname}
                                                    onChange={handleInputChange}
                                                    placeholder="Enter your last name"
                                                    className="custom-input"
                                                />
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Row>
                                        <Col md={6}>
                                            <Form.Group className="mb-4">
                                                <Form.Label className="form-label">Password *</Form.Label>
                                                <Form.Control
                                                    type="password"
                                                    name="password"
                                                    value={formData.password}
                                                    onChange={handleInputChange}
                                                    placeholder="Create a password"
                                                    className="custom-input"
                                                    required
                                                />
                                            </Form.Group>
                                        </Col>
                                        <Col md={6}>
                                            <Form.Group className="mb-4">
                                                <Form.Label className="form-label">Confirm Password *</Form.Label>
                                                <Form.Control
                                                    type="password"
                                                    name="confirmPassword"
                                                    value={formData.confirmPassword}
                                                    onChange={handleInputChange}
                                                    placeholder="Confirm your password"
                                                    className={`custom-input ${!passwordMatch ? 'is-invalid' : ''}`}
                                                    required
                                                />
                                                {!passwordMatch && (
                                                    <div className="invalid-feedback">
                                                        Passwords do not match
                                                    </div>
                                                )}
                                            </Form.Group>
                                        </Col>
                                    </Row>

                                    <Form.Group className="mb-4">
                                        <Form.Label className="form-label">Description</Form.Label>
                                        <Form.Control
                                            as="textarea"
                                            rows={3}
                                            name="description"
                                            value={formData.description}
                                            onChange={handleInputChange}
                                            placeholder="Tell us about yourself (optional)"
                                            className="custom-input"
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-4">
                                        <Form.Label className="form-label">Address</Form.Label>
                                        <Form.Control
                                            type="text"
                                            name="address"
                                            value={formData.address}
                                            onChange={handleInputChange}
                                            placeholder="Enter your address (optional)"
                                            className="custom-input"
                                        />
                                    </Form.Group>

                                    <Button
                                        type="submit"
                                        className="register-button w-100 mb-3"
                                        size="lg"
                                        disabled={!passwordMatch}
                                    >
                                        Create Account
                                    </Button>
                                </Form>

                                <div className="text-center">
                                    <span className="text-muted">Already have an account? </span>
                                    <a href="#" className="login-link">
                                        Sign in here
                                    </a>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>

        </div>
    );
};
