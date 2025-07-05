import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert } from 'react-bootstrap';
import '../styles/login.css';
import { useAuth } from '../Context/auth.context'
import { useNavigate } from 'react-router';

interface LoginFormData {
    email: string;
    password: string;
}

const LoginPage: React.FC = () => {
    const { login } = useAuth();
    const [formData, setFormData] = useState<LoginFormData>({
        email: '',
        password: ''
    });
    const [showAlert, setShowAlert] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        try {
            const response = await login(formData);
            if (response.status === 200) {
                setShowAlert(true);
            } else {
                console.error('Login failed:', response.statusText);
                setError('Login failed. Please check your credentials.');
            }
        } catch (error) {
            setError(error instanceof Error ? error.message : 'An unexpected error occurred');
            console.error('Error during login:', error);
        }
        setTimeout(() => { navigate('/news'); setShowAlert(false);}, 2000);
        
    };

    return (
        <div className="login-container">
            <Container fluid className=" d-flex align-items-center justify-content-center">
                <Row className="w-100">
                    <Col xs={12} sm={8} md={6} lg={4} xl={3} className="mx-auto w-100 d-flex align-items-center justify-content-center">
                        <Card className="login-card shadow-lg border-0">
                            <Card.Body className="p-5">
                                <div className="text-center mb-4">
                                    <h2 className="login-title mb-1">Welcome Back</h2>
                                    <p className="login-subtitle text-muted">Sign in to your account</p>
                                </div>

                                {showAlert && (
                                    <Alert variant="success" className="custom-alert mb-4">
                                        Login successful! Redirecting...
                                    </Alert>
                                )}
                                {error && (
                                    <Alert variant="danger" className="custom-alert mb-4">
                                        {error} 
                                    </Alert>
                                )}

                                <Form onSubmit={handleSubmit}>
                                    <Form.Group className="mb-3">
                                        <Form.Label className="form-label">Email Address</Form.Label>
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

                                    <Form.Group className="mb-4">
                                        <Form.Label className="form-label">Password</Form.Label>
                                        <Form.Control
                                            type="password"
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            placeholder="Enter your password"
                                            className="custom-input"
                                            required
                                        />
                                    </Form.Group>

                                    <Button
                                        type="submit"
                                        className="login-button w-100 mb-3"
                                        size="lg"
                                    >
                                        Sign In
                                    </Button>
                                </Form>

                                <div className="text-center">
                                    <a href="#" className="forgot-password">
                                        Forgot your password?
                                    </a>
                                </div>
                                <div className="text-center text-muted mt-3 not-registered">
                                    Don't have an account? <span><a href='/register' className="register-link">Register here</a></span>
                                </div>
                            </Card.Body>
                        </Card>
                    </Col>
                </Row>
            </Container>


        </div>
    );
};

export default LoginPage;