import React from 'react';
import { Container, Card, Row, Col, Button, Badge } from 'react-bootstrap';
import '../styles/home.css'; // Assuming you have a CSS file for additional styles

const HomePage: React.FC = () => {
  return (
    <div className="min-vh-100" style={{ backgroundColor: '#212529' }}>

      {/* Hero Section */}
      <Container className="py-5">
        <Row className="align-items-center min-vh-75">
          <Col lg={6} className="text-center text-lg-start">
            <div className="mb-4">
              <Badge bg="success" className="mb-3 px-3 py-2">
                React • TypeScript • Bootstrap • Tailwind • MongoDB • Express • Node.js
              </Badge>
              <h1 className="display-4 fw-bold text-light mb-3">
                Welcome to
                <span className="text-success"> OPAL</span>
                <span className="text-danger"> Social</span>
              </h1>
              <p className="lead text-light mb-4 opacity-75">
                Showcasing web development skills with React, TypeScript, and responsive design. 
                Built with React-Bootstrap and styled with a sleek dark theme.
              </p>
              <div className="d-flex gap-3 justify-content-center justify-content-lg-start flex-wrap">
                <Button 
                  variant="success" 
                  size="lg" 
                  href="/chatroom"
                  className="px-4 py-2 fw-semibold chat-button"
                >
                  Enter Chatroom
                </Button>
                <Button 
                  variant="outline-light" 
                  size="lg" 
                  href="/news"
                  className="px-4 py-2 fw-semibold"
                >
                  View News
                </Button>
              </div>
            </div>
          </Col>
          <Col lg={6} className="text-center">
            <div className="p-4">
              <div 
                className="rounded-3 shadow-lg border border-success border-opacity-25 p-5"
                style={{ backgroundColor: '#1a1f2e' }}
              >
                <div className="mb-4">
                  <div className="d-flex justify-content-center mb-3">
                    {/* </> symbol in cirlce */}
                    <div 
                      className="rounded-circle bg-success d-flex align-items-center justify-content-center"
                      style={{ width: '80px', height: '80px' }}
                    >
                      <span className="text-dark fs-2 fw-bold">{'</>'}</span>
                    </div>

                  </div>
                  <h3 className="text-success mb-3">Tech Stack</h3>
                  <div className="d-flex flex-wrap gap-2 justify-content-center">
                    <small> Frontend </small>
                    <Badge bg="outline-success" className="px-3 py-2 text-success border border-success">TypeScript</Badge>
                    <Badge bg="outline-success" className="px-3 py-2 text-success border border-success">React</Badge>
                    <Badge bg="outline-success" className="px-3 py-2 text-success border border-success">Bootstrap</Badge>
                    <Badge bg="outline-success" className="px-3 py-2 text-success border border-success">CSS</Badge>
                    <Badge bg="outline-success" className="px-3 py-2 text-success border border-success">Tailwind</Badge>
                    <small> Backend </small>
                    <Badge bg="outline-success" className="px-3 py-2 text-success border border-success">MongoDB</Badge>
                    <Badge bg="outline-success" className="px-3 py-2 text-success border border-success">Express</Badge>
                    <Badge bg="outline-success" className="px-3 py-2 text-success border border-success">Node.ts</Badge>
                    <Badge bg="outline-success" className="px-3 py-2 text-success border border-success">Socket.io</Badge>

                  </div>
                </div>
              </div>
            </div>
          </Col>
        </Row>
      </Container>

      {/* Features Section */}
      <Container className="py-5">
        <Row className="g-4">
          <Col md={6}>
            <Card className="h-100 bg-dark border-success border-opacity-25 shadow">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center mb-3">
                  <div 
                    className="rounded-circle bg-success bg-opacity-20 d-flex align-items-center justify-content-center me-3"
                    style={{ width: '50px', height: '50px' }}
                  >
                    <span className="text-success fs-5">💬</span>
                  </div>
                  <h4 className="text-success mb-0">Interactive Chatroom</h4>
                </div>
                <p className="text-light opacity-75 mb-3">
                  Real-time messaging interface built with modern React patterns and responsive design.
                </p>
                <Button variant="outline-success" href="/chatroom" className="fw-semibold">
                  Explore Chatroom →
                </Button>
              </Card.Body>
            </Card>
          </Col>
          <Col md={6}>
            <Card className="h-100 bg-dark border-success border-opacity-25 shadow">
              <Card.Body className="p-4">
                <div className="d-flex align-items-center mb-3">
                  <div 
                    className="rounded-circle bg-success bg-opacity-20 d-flex align-items-center justify-content-center me-3"
                    style={{ width: '50px', height: '50px' }}
                  >
                    <span className="text-success fs-5">📰</span>
                  </div>
                  <h4 className="text-success mb-0">News Dashboard</h4>
                </div>
                <p className="text-light opacity-75 mb-3">
                  Stay updated with the latest news through a clean, organized interface.
                </p>
                <Button variant="outline-success" href="/news" className="fw-semibold">
                  View News →
                </Button>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>

      {/* Footer with Developer Info */}
      <footer className="py-4 mt-5 border-top border-success border-opacity-25">
        <Container>
          <Row className="align-items-center">
            <Col md={8} className="text-center text-md-start">
              <p className="text-light mb-2">
                <span className="text-success fw-semibold">Created by Ruslan Kildibekov</span>
              </p>
              <p className="text-light opacity-75 mb-0 small">
                Built with React, TypeScript, React-Bootstrap, and Tailwind CSS. 
                <span className="text-danger ms-2">♥</span> Made with passion for web development.
              </p>
            </Col>
            <Col md={4} className="text-center text-md-end">
            </Col>
          </Row>
        </Container>
      </footer>
    </div>
  );
};

export default HomePage;