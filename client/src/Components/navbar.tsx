import { Button, Container, Nav, Navbar, NavbarText} from "react-bootstrap"
import '../styles/navbar.css'
import { useAuth } from "../Context/auth.context"
import { useNavigate } from "react-router";
const NavbarC = () => {
    const { user, authFetch, logout } = useAuth();
    const navigate = useNavigate();

    if (!user) navigate('/login');

    return (
        <Navbar collapseOnSelect expand="lg" className="bg-body-tertiary" data-bs-theme='dark'>
            <Container>
                <Navbar.Brand href="/">OPAL</Navbar.Brand>
                <Navbar.Toggle aria-controls="responsive-navbar-nav" />
                <Navbar.Collapse id="responsive-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link href="/news">News</Nav.Link>
                        <Nav.Link href="/friends">Friends</Nav.Link>
                    </Nav>
                    <Nav>
                        {user ? (<p>Hello, {user.username}</p>) : (<NavbarText>Not Logged-In</NavbarText>) }
                        <Button variant="secondary" href="/login" className="ms-5">Log-In</Button>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    )
}

export default NavbarC;