import { Button, Container, Nav, Navbar} from "react-bootstrap"
import '../styles/navbar.css'
const NavbarC = () => {
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
                        <Nav.Link disabled>Login info</Nav.Link>
                        <Button variant="secondary" href="/login">Log-In</Button>
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    )
}

export default NavbarC;