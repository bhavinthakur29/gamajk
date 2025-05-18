import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Card, Badge, Button, Container, Row, Col } from 'react-bootstrap';
import { FaArrowLeft, FaUser, FaPhone, FaEnvelope, FaMapMarkerAlt, FaCalendarAlt, FaIdCard, FaChevronLeft, FaEdit } from 'react-icons/fa';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorDisplay from '../../components/common/ErrorDisplay';
import '../pages/Dashboard.css'; // Import Dashboard CSS for consistent styling

export default function StudentDetail() {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const [student, setStudent] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Determine if we're in admin route or regular route
    const isAdminRoute = location.pathname.includes('/admin/');
    const backPath = isAdminRoute ? '/admin/students' : '/students';

    useEffect(() => {
        fetchStudentDetails();
    }, [studentId]);

    const fetchStudentDetails = async () => {
        try {
            setLoading(true);
            setError(null);

            const studentRef = doc(db, 'students', studentId);
            const studentDoc = await getDoc(studentRef);

            if (!studentDoc.exists()) {
                setError({ message: 'Student not found' });
                return;
            }

            setStudent({
                id: studentDoc.id,
                ...studentDoc.data()
            });
        } catch (err) {
            console.error('Error fetching student details:', err);
            setError({ message: err.message || 'Failed to load student details' });
        } finally {
            setLoading(false);
        }
    };

    const getBeltColor = (belt) => {
        const beltMap = {
            'White': 'secondary',
            'Yellow': 'warning',
            'Yellow Stripe': 'warning',
            'Green': 'success',
            'Green Stripe': 'success',
            'Blue': 'primary',
            'Blue Stripe': 'primary',
            'Red': 'danger',
            'Red Stripe': 'danger',
            'Black': 'dark',
            'Black 1': 'dark',
            'Black 2': 'dark',
            'Black 3': 'dark',
            'Black Stripe': 'dark'
        };
        return beltMap[belt] || 'secondary';
    };

    if (loading) {
        return <LoadingSpinner text="Loading student data..." />;
    }

    if (error) {
        return <ErrorDisplay error={error} onRetry={fetchStudentDetails} />;
    }

    return (
        <Container className="py-4">
            <button
                className="back-to-dashboard-btn"
                onClick={() => navigate(backPath)}
            >
                <FaChevronLeft className="back-icon" />
                <span>Back to Students</span>
            </button>

            <div className="d-flex justify-content-between align-items-center mb-4">
                <h4 className="mb-0">Student Profile</h4>
                <Link to={isAdminRoute ? `/admin/edit-student/${studentId}` : `/edit-student/${studentId}`}>
                    <Button variant="primary" className="d-flex align-items-center gap-2">
                        <FaEdit />
                        <span>Edit Student</span>
                    </Button>
                </Link>
            </div>

            <Card className="shadow-sm border-0 rounded-lg">
                <Card.Body className="p-4">
                    <div className="d-flex flex-column flex-md-row justify-content-between mb-4">
                        <div>
                            <h3 className="mb-1">{student.name || `Student ${student.studentId}`}</h3>
                            <div className="d-flex align-items-center">
                                <FaIdCard className="text-muted me-2" />
                                <span className="text-muted">ID: {student.studentId}</span>
                            </div>
                        </div>
                        <Badge
                            bg={getBeltColor(student.belt)}
                            className="align-self-start mt-2 mt-md-0 px-3 py-2"
                            style={{ fontSize: '0.9rem' }}
                        >
                            {student.belt || 'No Belt'}
                        </Badge>
                    </div>

                    <Row className="g-4">
                        <Col xs={12} md={6}>
                            <Card className="border-0 bg-light h-100">
                                <Card.Body>
                                    <h5 className="card-title border-bottom pb-2 mb-3">Personal Information</h5>

                                    <div className="mb-3">
                                        <div className="d-flex align-items-center mb-2">
                                            <FaUser className="text-primary me-2" />
                                            <strong>Full Name</strong>
                                        </div>
                                        <p className="ms-4 mb-0">{student.name || 'Not provided'}</p>
                                    </div>

                                    {student.dateOfBirth && (
                                        <div className="mb-3">
                                            <div className="d-flex align-items-center mb-2">
                                                <FaCalendarAlt className="text-primary me-2" />
                                                <strong>Date of Birth</strong>
                                            </div>
                                            <p className="ms-4 mb-0">{student.dateOfBirth}</p>
                                        </div>
                                    )}

                                    <div className="mb-3">
                                        <div className="d-flex align-items-center mb-2">
                                            <FaPhone className="text-primary me-2" />
                                            <strong>Contact Number</strong>
                                        </div>
                                        <p className="ms-4 mb-0">{student.contactNumber || 'Not provided'}</p>
                                    </div>

                                    {student.email && (
                                        <div className="mb-3">
                                            <div className="d-flex align-items-center mb-2">
                                                <FaEnvelope className="text-primary me-2" />
                                                <strong>Email</strong>
                                            </div>
                                            <p className="ms-4 mb-0">{student.email}</p>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>

                        <Col xs={12} md={6}>
                            <Card className="border-0 bg-light h-100">
                                <Card.Body>
                                    <h5 className="card-title border-bottom pb-2 mb-3">Training Information</h5>

                                    <div className="mb-3">
                                        <div className="d-flex align-items-center mb-2">
                                            <FaMapMarkerAlt className="text-primary me-2" />
                                            <strong>Branch</strong>
                                        </div>
                                        <p className="ms-4 mb-0">{student.branch || 'Not assigned'}</p>
                                    </div>

                                    {student.batch && (
                                        <div className="mb-3">
                                            <div className="d-flex align-items-center mb-2">
                                                <strong className="d-flex align-items-center">
                                                    <span className="material-icons me-2 text-primary">group</span>
                                                    Batch
                                                </strong>
                                            </div>
                                            <p className="ms-4 mb-0">Batch {student.batch}</p>
                                        </div>
                                    )}

                                    {student.joinDate && (
                                        <div className="mb-3">
                                            <div className="d-flex align-items-center mb-2">
                                                <strong className="d-flex align-items-center">
                                                    <span className="material-icons me-2 text-primary">calendar_today</span>
                                                    Join Date
                                                </strong>
                                            </div>
                                            <p className="ms-4 mb-0">{student.joinDate}</p>
                                        </div>
                                    )}

                                    {student.address && (
                                        <div className="mb-3">
                                            <div className="d-flex align-items-center mb-2">
                                                <FaMapMarkerAlt className="text-primary me-2" />
                                                <strong>Address</strong>
                                            </div>
                                            <p className="ms-4 mb-0">{student.address}</p>
                                        </div>
                                    )}
                                </Card.Body>
                            </Card>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        </Container>
    );
} 