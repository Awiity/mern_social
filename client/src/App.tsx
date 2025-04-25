import { Container, Row } from 'react-bootstrap'
import './App.css'
import NavbarC from './Components/navbar'

function App() {
    return (
        <Container>
            <Row data-bs-theme="dark">
                <NavbarC></NavbarC>
            </Row>
        </Container>
    )
}

export default App
