import { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { Card, Button, Modal, Spinner, ListGroup, Dropdown, Row, Col } from 'react-bootstrap';
import LogoutButton from '../../components/common/LogoutButton';
import NoData from '../../components/common/NoData';
import { useAuth } from '../../contexts/AuthContext';

export default function Students() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [sortBy, setSortBy] = useState('name');
    const { userRole, userBranch } = useAuth();

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setLoading(true);
                const querySnapshot = await getDocs(collection(db, 'students'));
                let fetchedStudents = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                // Filter by branch for instructors
                if (userRole === 'instructor') {
                    fetchedStudents = fetchedStudents.filter(s => s.branch === userBranch);
                }
                setStudents(fetchedStudents);
            } catch (error) {
                console.error('Error fetching students:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStudents();
    }, [userRole, userBranch]);

    const handleShowDetails = (student) => {
        setSelectedStudent(student);
        setShowModal(true);
    };

    // Custom belt order (high to low)
    const beltOrder = [
        'Black 3', 'Black 2', 'Black 1', 'Black Stripe',
        'Red', 'Red Stripe',
        'Blue', 'Blue Stripe',
        'Green', 'Green Stripe',
        'Yellow', 'Yellow Stripe',
        'White'
    ];

    // Natural sort for names (handles numbers correctly)
    function naturalCompare(a, b) {
        return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    }

    const getSortedStudents = () => {
        let sorted = [...students];
        if (sortBy === 'name') {
            sorted.sort((a, b) => naturalCompare(a.name, b.name));
        } else if (sortBy === 'belt') {
            sorted.sort((a, b) => {
                const aIdx = beltOrder.findIndex(belt => belt.toLowerCase() === a.belt.toLowerCase());
                const bIdx = beltOrder.findIndex(belt => belt.toLowerCase() === b.belt.toLowerCase());
                return aIdx - bIdx;
            });
        } else if (sortBy === 'batch') {
            sorted.sort((a, b) => a.batch - b.batch);
        }
        return sorted;
    };

    // Map belt names to Bootstrap or custom color classes
    const getBeltColorClass = (belt) => {
        switch (belt.toLowerCase()) {
            case 'white': return 'bg-light text-dark border border-secondary';
            case 'yellow': return 'bg-warning text-dark';
            case 'yellow stripe': return 'bg-warning text-dark';
            case 'green': return 'bg-success';
            case 'green stripe': return 'bg-success';
            case 'blue': return 'bg-primary';
            case 'blue stripe': return 'bg-primary';
            case 'red': return 'bg-danger';
            case 'red stripe': return 'bg-danger';
            case 'black stripe': return 'bg-dark';
            case 'black 1': return 'bg-dark';
            case 'black 2': return 'bg-dark';
            case 'black 3': return 'bg-dark';
            default: return 'bg-secondary';
        }
    };

    // Map batch number to Roman numeral
    const getBatchRoman = (batch) => {
        switch (parseInt(batch, 10)) {
            case 1: return 'I';
            case 2: return 'II';
            case 3: return 'III';
            default: return batch;
        }
    };

    if (loading) {
        return (
            <div className="container mt-4 position-relative">
                <div className="text-center">
                    <Spinner animation="border" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </Spinner>
                </div>
            </div>
        );
    }

    if (students.length === 0) {
        return (
            <div className="position-relative">
                <NoData
                    title="No Students Found"
                    message="There are no students registered in the system yet."
                />
            </div>
        );
    }

    return (
        <div className="container mt-4 position-relative">
            <h1 className="mb-4">Students List</h1>

            <Row className="mb-3">
                <Col xs="auto" className="ms-auto">
                    <Dropdown onSelect={setSortBy}>
                        <Dropdown.Toggle variant="outline-primary" id="sort-dropdown">
                            Sort By: {sortBy === 'name' ? 'Name (A-Z)' : sortBy.charAt(0).toUpperCase() + sortBy.slice(1)}
                        </Dropdown.Toggle>
                        <Dropdown.Menu>
                            <Dropdown.Item eventKey="name">Name (A-Z)</Dropdown.Item>
                            <Dropdown.Item eventKey="belt">Belt</Dropdown.Item>
                            <Dropdown.Item eventKey="batch">Batch</Dropdown.Item>
                        </Dropdown.Menu>
                    </Dropdown>
                </Col>
            </Row>

            <Card className="shadow-sm">
                <Card.Body className="p-0">
                    <ListGroup variant="flush">
                        {getSortedStudents().map(student => (
                            <ListGroup.Item
                                key={student.id}
                                action
                                onClick={() => handleShowDetails(student)}
                                className="d-flex align-items-center justify-content-between py-3 px-4"
                                style={{ cursor: 'pointer' }}
                            >
                                <div>
                                    <span className="fw-bold">{student.name}</span>
                                    <span className="ms-3 badge bg-secondary">Batch {getBatchRoman(student.batch)}</span>
                                </div>
                                <span className={`badge ${getBeltColorClass(student.belt)} px-3 py-2`}>{student.belt}</span>
                            </ListGroup.Item>
                        ))}
                    </ListGroup>
                </Card.Body>
            </Card>

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Student Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedStudent && (
                        <div>
                            <p><strong>Name:</strong> {selectedStudent.name}</p>
                            <p><strong>Email:</strong> {selectedStudent.email}</p>
                            <p><strong>Branch:</strong> {selectedStudent.branch}</p>
                            <p><strong>Batch:</strong> {selectedStudent.batch}</p>
                            <p><strong>Belt:</strong> {selectedStudent.belt}</p>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
