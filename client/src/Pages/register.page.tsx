import { useState } from "react";
import { Form, Button, Container, Row, Col, Alert, Spinner } from "react-bootstrap";
import { IRegisterCred, register } from "../Network/user.api";
import { AxiosResponse } from "axios";

export function RegisterPage() {
    const [user, setUser] = useState<IRegisterCred>({
        username: '',
        password: '',
        email: '',
        firstname: '',
        role: 'user',
        lastname: '',
        address: '',
        description: ''
    });
    /* TODO: move all this crap to useRegister hook */
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>(null)
    const [resMsg, setResMsg] = useState<AxiosResponse>();
    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const response = await register(user);
            setResMsg(response);
        }
        catch (error) { if (error instanceof Error) setError(error); }
        finally { setLoading(false) }
        //navigate("/login")
    };
    console.log("HERERERERER ERROR: ", error);

    return (
        <Container className="mt-3 fluid w-25" style={{ minWidth: 576 }}>
            <Form onSubmit={handleSubmit}>
                {/* USERNAME */}
                <Form.Group className="mb-3">
                    <Form.Label>Username</Form.Label>
                    <Form.Control
                        id="username"
                        placeholder="Your pseudoname..."
                        value={user.username || ""}
                        onChange={(e) => setUser({ ...user, username: e.target.value })}></Form.Control>
                    <Form.Text className="text-muted">Required</Form.Text>
                </Form.Group>

                {/* EMAIL */}
                <Form.Group className="mb-3">
                    <Form.Label>E-mail</Form.Label>
                    <Form.Control
                        id="email"
                        type="email"
                        placeholder="email@example.org"
                        value={user.email || ""}
                        onChange={(e) => setUser({ ...user, email: e.target.value })}></Form.Control>
                    <Form.Text className="text-muted ms-10">Required</Form.Text>
                </Form.Group>

                {/* PASSWORD */}
                <Form.Group className="mb-3">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                        id="password"
                        type="password"
                        placeholder="Secure password..."
                        value={user.password || ""}
                        onChange={(e) => setUser({ ...user, password: e.target.value })}></Form.Control>
                    <Form.Text className="">Minumum 8 symbols with at least 1 uppercase, 1 lowercase and 1 special character.</Form.Text>
                </Form.Group>

                <Row>

                    <Col>
                        {/* FIRSTNAME */}

                        <Form.Group className="mb-3">
                            <Form.Label>Firstname</Form.Label>
                            <Form.Control
                                id="firstname"
                                value={user.firstname || ""}
                                onChange={(e) => setUser({ ...user, firstname: e.target.value })}></Form.Control>
                            <Form.Text className="text-muted">Required</Form.Text>
                        </Form.Group>
                    </Col>

                    <Col>
                        {/* LASTNAME */}

                        <Form.Group className="mb-3">
                            <Form.Label>Lastname</Form.Label>
                            <Form.Control
                                id="lastname"
                                value={user.lastname || ""}
                                onChange={(e) => setUser({ ...user, lastname: e.target.value })}></Form.Control>
                            <Form.Text className="text-muted">Optional</Form.Text>
                        </Form.Group>
                    </Col>

                </Row>
                {/* ADDRESS */}

                <Form.Group className="mb-3">
                    <Form.Label>Address</Form.Label>
                    <Form.Control
                        id="address"
                        value={user.address || ""}
                        onChange={(e) => setUser({ ...user, address: e.target.value })}></Form.Control>

                    <Form.Text className="text-muted">Optional</Form.Text>
                </Form.Group>
                <Form.Group className="mb-3">
                    <Form.Label>Choose your avatar (2 MB max)</Form.Label>
                    <Form.Control
                        type="file"
                    >
                        
                    </Form.Control>
                    <Form.Text className="text-muted">Optional</Form.Text>
                </Form.Group>

                <Button className="me-auto" variant="primary" type="submit" disabled={loading}><Spinner size="sm" hidden={!loading} /> Register</Button>
                {error && <Alert variant="danger" className="mt-3">{error.message}</Alert>}
                {resMsg && <Alert variant="success" className="mt-3">{resMsg.statusText}</Alert>}
            </Form>
        </Container>
    );
}