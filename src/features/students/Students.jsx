import { useState, useEffect } from 'react';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { Card, Button, Row, Col, Badge, Nav, Tab } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaUserPlus, FaEye, FaUserTie, FaMapMarkerAlt, FaPhone } from 'react-icons/fa';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorDisplay from '../../components/common/ErrorDisplay';
import { useAuth } from '../../contexts/AuthContext';

export default function Students() {
    const [students, setStudents] = useState([]);
    const [branchConfigs, setBranchConfigs] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const { userBranch, userRole } = useAuth();

    useEffect(() => {
        fetchStudents();
    }, [userBranch, userRole]);

    const fetchStudents = async () => {
        try {
            setLoading(true);
            setError(null);

            // Fetch branches first to get batch configurations
            const branchesQuery = collection(db, 'branches');
            const branchesSnapshot = await getDocs(branchesQuery);
            const branchConfigsData = {};

            branchesSnapshot.docs.forEach(doc => {
                const branchData = doc.data();
                branchConfigsData[branchData.name] = {
                    numBatches: parseInt(branchData.numBatches) || 2,
                    ...branchData
                };
            });

            setBranchConfigs(branchConfigsData);

            // Fetch students
            let studentsQuery;
            if (userRole === 'admin') {
                studentsQuery = collection(db, 'students');
            } else {
                studentsQuery = query(
                    collection(db, 'students'),
                    where('branch', '==', userBranch)
                );
            }

            const snapshot = await getDocs(studentsQuery);
            const studentList = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setStudents(studentList);
        } catch (err) {
            console.error('Error fetching students:', err);
            setError({ message: err.message || 'Failed to load students' });
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

    // Function to organize students by batch
    const organizeStudentsByBatch = () => {
        const byBranch = {};

        // For instructors, we only care about their branch
        const relevantBranches = userRole === 'instructor' ? [userBranch] : Object.keys(branchConfigs);

        // Initialize the structure for each branch
        relevantBranches.forEach(branch => {
            byBranch[branch] = {
                batches: {},
                unallocated: []
            };

            // Create array for each batch
            const numBatches = branchConfigs[branch]?.numBatches || 2;
            for (let i = 1; i <= numBatches; i++) {
                byBranch[branch].batches[i] = [];
            }
        });

        // Organize students
        students.forEach(student => {
            const branch = student.branch;
            const batch = student.batch;

            // Skip if student is not in a branch we're showing
            if (!byBranch[branch]) return;

            if (batch === 'unallocated' || !batch) {
                // Handle unallocated students
                byBranch[branch].unallocated.push(student);
            } else if (typeof batch === 'number' || !isNaN(parseInt(batch))) {
                const batchNum = typeof batch === 'number' ? batch : parseInt(batch);

                // If batch exists in this branch, add the student there
                if (byBranch[branch].batches[batchNum]) {
                    byBranch[branch].batches[batchNum].push(student);
                } else {
                    // If batch is out of range for this branch, add to unallocated
                    byBranch[branch].unallocated.push(student);
                }
            } else {
                // Handle any other unexpected values
                byBranch[branch].unallocated.push(student);
            }
        });

        return byBranch;
    };

    const renderStudentCard = (student) => (
        <Col key={student.id} xs={12} sm={6} lg={4} xl={3}>
            <Card className="h-100 shadow-sm border-0 student-card hover-effect">
                <Card.Body className="d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-3">
                        <div>
                            <h5 className="mb-1 student-name">{student.name || `Student ${student.studentId}`}</h5>
                            <p className="text-muted small mb-0">ID: {student.studentId}</p>
                        </div>
                        <Badge bg={getBeltColor(student.belt)}
                            className="py-2 px-3 rounded-pill">
                            {student.belt || 'No Belt'}
                        </Badge>
                    </div>

                    <div className="student-details">
                        <div className="d-flex align-items-center mb-2 text-muted">
                            <FaMapMarkerAlt className="me-2" size={14} />
                            <span className="small">{student.branch || 'Unknown Branch'}</span>
                        </div>

                        {student.contactNumber && (
                            <div className="d-flex align-items-center mb-2 text-muted">
                                <FaPhone className="me-2" size={14} />
                                <span className="small">{student.contactNumber}</span>
                            </div>
                        )}
                    </div>

                    <div className="mt-auto pt-3">
                        <Link
                            to={userRole === 'admin' ? `/admin/student/${student.id}` : `/student/${student.id}`}
                            className="btn btn-sm btn-outline-primary d-flex align-items-center justify-content-center gap-2 w-100"
                        >
                            <FaEye size={14} />
                            <span>View Details</span>
                        </Link>
                    </div>
                </Card.Body>
            </Card>
        </Col>
    );

    if (loading) {
        return <LoadingSpinner text="Loading student data..." />;
    }

    if (error) {
        return <ErrorDisplay error={error} onRetry={fetchStudents} />;
    }

    const organizedStudents = organizeStudentsByBatch();
    const branchNames = Object.keys(organizedStudents);

    return (
        <div className="container-fluid px-0 py-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <h4 className="mb-3 mb-md-0"><strong>Students</strong></h4>
                <Link to="/add-student">
                    <Button variant="primary" className="d-flex align-items-center gap-2">
                        <FaUserPlus />
                        <span className="d-none d-md-inline">Add Student</span>
                        <span className="d-inline d-md-none">Add</span>
                    </Button>
                </Link>
            </div>

            {students.length === 0 ? (
                <Card className="text-center py-5 shadow-sm border-0">
                    <Card.Body>
                        <div className="py-4">
                            <FaUserTie size={48} className="text-muted mb-3" />
                            <h5>No students found</h5>
                            <p className="text-muted">Start by adding your first student</p>
                            <Link to="/add-student">
                                <Button variant="outline-primary" className="mt-2">
                                    <FaUserPlus className="me-2" />
                                    Add Student
                                </Button>
                            </Link>
                        </div>
                    </Card.Body>
                </Card>
            ) : (
                branchNames.length > 0 ? (
                    <Tab.Container defaultActiveKey={branchNames[0]}>
                        {branchNames.length > 1 && (
                            <Nav variant="tabs" className="mb-4 flex-row">
                                {branchNames.map(branch => (
                                    <Nav.Item key={branch}>
                                        <Nav.Link eventKey={branch}>{branch}</Nav.Link>
                                    </Nav.Item>
                                ))}
                            </Nav>
                        )}

                        <Tab.Content>
                            {branchNames.map(branch => (
                                <Tab.Pane key={branch} eventKey={branch}>
                                    <div className="mb-4">
                                        {/* Display batches */}
                                        {Object.entries(organizedStudents[branch].batches).map(([batchNum, batchStudents]) => (
                                            <div key={`${branch}-batch-${batchNum}`} className="mb-4">
                                                <h5 className="mb-3 border-bottom pb-2">Batch {batchNum}</h5>
                                                {batchStudents.length > 0 ? (
                                                    <Row className="g-3">
                                                        {batchStudents.map(student => renderStudentCard(student))}
                                                    </Row>
                                                ) : (
                                                    <p className="text-muted text-center">No students in this batch</p>
                                                )}
                                            </div>
                                        ))}

                                        {/* Display unallocated students */}
                                        {organizedStudents[branch].unallocated.length > 0 && (
                                            <div>
                                                <h5 className="mb-3 border-bottom pb-2 text-danger">Unallocated Students</h5>
                                                <Row className="g-3">
                                                    {organizedStudents[branch].unallocated.map(student => renderStudentCard(student))}
                                                </Row>
                                            </div>
                                        )}
                                    </div>
                                </Tab.Pane>
                            ))}
                        </Tab.Content>
                    </Tab.Container>
                ) : (
                    <Row className="g-3">
                        {students.map(student => renderStudentCard(student))}
                    </Row>
                )
            )}

            {/* Add some styles for the student cards */}
            <style jsx="true">{`
                .student-card {
                    transition: all 0.3s ease;
                    border-radius: 12px;
                    overflow: hidden;
                }
                .hover-effect:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
                }
                .student-name {
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    max-width: 160px;
                }
                @media (max-width: 576px) {
                    .student-name {
                        max-width: 200px;
                    }
                }
            `}</style>
        </div>
    );
}
