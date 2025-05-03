// gonna be latest posted posts
import { Button, Card, Container } from "react-bootstrap";
import useFetch from "../Hooks/useFetch";

export function NewsPage() {
    const { data, error, isLoading, reloadCount } = useFetch("http://localhost:4000/api/posts");
    return (
        <Container className="w-50 mt-5">
            {data instanceof Array ? data.map((item) => (
                <Card className="mt-3" key={item._id}>
                    <Card.Header>
                        <Card.Title>{item.title}</Card.Title>
                    </Card.Header>
                    <Card.Body>{item.body}</Card.Body>
                    <Card.Footer className="justify-content-end">
                        <Card.Text >asd</Card.Text>
                    </Card.Footer>
                </Card>
            )) : (<p>Hui sosi</p>)}
        </Container>
    );

}