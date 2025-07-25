import { Button, Container, Nav, Navbar, NavbarText } from "react-bootstrap"
import '../styles/navbar.css'
import { useAuth } from "../Context/auth.context"
import { useNavigate } from "react-router";
import logout_svg from '../Static/SVGs/logout.svg';
//import { logout } from "../Network/user.api";

const NavbarC = () => {
    const { user: currentUser, logout } = useAuth();
    //console.log("user: ", user);
    const navigate = useNavigate();
    const handleLogout = async () => {
        try {
            logout();
            navigate("/login");
        } catch (error) {
            console.log(error);
        }
    }
    return (
        <Navbar collapseOnSelect expand="lg" className="bg-body-tertiary rounded-bottom navbar-container" data-bs-theme='dark'>
            <Container>
                <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" width="44px" height="44px"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"><path d="M5 7L12 3L19 7L21 12L19 17L12 21L5 17L3 12L5 7Z" stroke="#90ee91" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 7L7 12L12 17L17 12L12 7Z" stroke="#90ee91" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 3V7" stroke="#fefefe" stroke-linecap="round" stroke-linejoin="round"></path><path d="M3 12H7" stroke="#fefefe" stroke-linecap="round" stroke-linejoin="round"></path><path d="M17 12H21" stroke="#fefefe" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 21V17" stroke="#fefefe" stroke-linecap="round" stroke-linejoin="round"></path></g></svg>
                <Navbar.Brand href="/">
                    OPAL</Navbar.Brand>
                <Navbar.Toggle aria-controls="responsive-navbar-nav" />
                <Navbar.Collapse id="responsive-navbar-nav">
                    <Nav className="me-auto">
                        <Nav.Link href="/chatroom" className="hover-underline">Chat</Nav.Link>
                        <Nav.Link href="/news" className="hover-underline">News</Nav.Link>
                    </Nav>
                    <Nav className="text-center">
                        {currentUser ? (
                            <>
                                <NavbarText ><a className="authed-user-link" href={`/user/${currentUser._id}`}>@{currentUser.username}</a></NavbarText>
                                <Button variant="danger" className="ms-3 logout-button" onClick={handleLogout}>
                                    <img src={logout_svg} alt="logout" width="23px" /> Logout
                                </Button>
                            </>) : (
                            <>
                                <Button variant="primary" href="/login" className="ms-3 login-nb-button">Log-In</Button>
                                <Button variant="secondary" href="/register" className="ms-3 register-nb-button">Register</Button></>

                        )}
                    </Nav>
                </Navbar.Collapse>
            </Container>
        </Navbar>
    )
}

export default NavbarC;