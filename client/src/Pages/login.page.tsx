/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from "react";
import { Alert, Button, Container, Form, Spinner } from "react-bootstrap";
import { login, ILoginCred } from "../Network/user.api";



function LoginPage() {
    const [user, setUser] = useState<ILoginCred>({ email: null, password: null });
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<Error | null>()
    const [response, setResponse] = useState<string | null>(null);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const response = await login(user);
         }
        catch (error) { if (error instanceof Error) setError(error); }
        finally { setLoading(false) }
    };
    return (
        <Container className="border rounded w-25 mt-5" style={{minWidth: 576}}>
            <Form data-bs-theme="dark" className="mb-3 mt-3" onSubmit={handleSubmit}>
                <Form.Group controlId="formEmail" className="mb-3 w-100">
                    <Form.Label>E-Mail</Form.Label>
                    <Form.Control
                        type="email"
                        placeholder="Your email..."
                        onChange={e => { setUser({ ...user, email: e.target.value }) }}
                        value={user.email || ""} />
                </Form.Group>

                <Form.Group controlId="formPassword" className="mb-3 w-100">
                    <Form.Label>Password</Form.Label>
                    <Form.Control
                        type="password"
                        placeholder="Your password..."
                        onChange={e => { setUser({ ...user, password: e.target.value }) }}
                        value={user.password || ""} />
                </Form.Group>

                <Button disabled={loading} type="submit" variant="primary" className="mb-3"><Spinner hidden={!loading} animation="grow" size="sm" />Submit</Button>
                {error && <Alert variant="danger">{error.message}</Alert>}
                {response && <Alert variant="primary">{response}</Alert>}
            </Form>
        </Container>
    );
}

export default LoginPage;