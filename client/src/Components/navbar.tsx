import { Button, Container, Nav, Navbar, NavbarText } from "react-bootstrap"
import '../styles/navbar.css'
import { useAuth } from "../Context/auth.context"
import { useNavigate } from "react-router";
//import { logout } from "../Network/user.api";

const NavbarC = () => {
    const { user, logout } = useAuth();
    console.log("user: ", user);
    const navigate = useNavigate();
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const handleLogout = async (e: React.MouseEvent<HTMLElement>) => {
        try {
            logout();
            navigate("/login");
        } catch (error) {
            console.log(error);
        }
    }
    return (
        <Navbar collapseOnSelect expand="lg" className="bg-body-tertiary" data-bs-theme='dark'>
            <Container>
                <Navbar.Brand href="/">OPAL</Navbar.Brand>
                <Navbar.Toggle aria-controls="responsive-navbar-nav" />
                <Navbar.Collapse id="responsive-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link href="/news" className="hover-underline">News</Nav.Link>
                        <Nav.Link href="/friends" className="hover-underline">Friends</Nav.Link>
                    </Nav>
                    <Nav className="text-center">
                        {user ? (
                            <>
                                <NavbarText style={{color: "#90EE91"}}>{user.username}</NavbarText>
                                <Button variant="danger" className="ms-3" onClick={handleLogout}>Log-Out</Button>
                            </>) : (
                            <>
                                <Button variant="primary" href="/login" className="ms-3">Log-In</Button>
                                <Button variant="secondary" href="/register" className="ms-3">Register</Button></>

                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    )
}

export default NavbarC;