import { Container, Row, Col } from 'react-bootstrap';
import { FaInbox } from 'react-icons/fa';

export default function NoData({
    title = "No Data Available",
    message = "There are no records to display at this time."
}) {
    return (
        <Container className="mt-5">
            <Row className="justify-content-center">
                <Col md={8} className="text-center">
                    <div className="mb-4">
                        <FaInbox size={80} className="text-muted" />
                    </div>
                    <h2 className="mb-3">{title}</h2>
                    <p className="lead mb-4 text-muted">{message}</p>
                </Col>
            </Row>
        </Container>
    );
} 