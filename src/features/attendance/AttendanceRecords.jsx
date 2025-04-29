import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../../firebase';
import { Table, Card, Accordion, Dropdown, Row, Col, Form, Spinner } from 'react-bootstrap';
import { FaChevronDown, FaChevronUp } from 'react-icons/fa';
import NoData from '../../components/common/NoData';
import { useAuth } from '../../contexts/AuthContext';

export default function AttendanceRecords() {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedBatches, setExpandedBatches] = useState({});
    const [sortOptions, setSortOptions] = useState({});
    const [allStudentsByBatch, setAllStudentsByBatch] = useState({});
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState('All');
    const [selectedBelt, setSelectedBelt] = useState('All');
    const { userRole, userBranch } = useAuth();

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

    useEffect(() => {
        const fetchRecords = async () => {
            try {
                setLoading(true);
                const q = query(collection(db, 'attendance_records'), orderBy('date', 'desc'));
                const querySnapshot = await getDocs(q);

                // Fetch all students to create the map
                const studentsSnapshot = await getDocs(collection(db, 'students'));
                const studentMap = {};
                const studentsByBatch = {};
                const branchSet = new Set();
                studentsSnapshot.docs.forEach(doc => {
                    const data = doc.data();
                    studentMap[doc.id] = data;
                    if (!studentsByBatch[data.batch]) studentsByBatch[data.batch] = [];
                    studentsByBatch[data.batch].push({ id: doc.id, ...data });
                    if (data.branch) branchSet.add(data.branch);
                });
                setAllStudentsByBatch(studentsByBatch);
                setBranches(['All', ...Array.from(branchSet)]);

                // Group records by date
                const groupedRecords = {};
                querySnapshot.docs.forEach(doc => {
                    const data = doc.data();
                    const date = data.date || new Date().toISOString().split('T')[0];

                    if (!groupedRecords[date]) {
                        groupedRecords[date] = {
                            id: doc.id,
                            date,
                            batches: {}
                        };
                    }

                    // For each batch, build attendance list for all students in that batch
                    Object.entries(studentsByBatch).forEach(([batch, studentsInBatch]) => {
                        if (!groupedRecords[date].batches[batch]) {
                            groupedRecords[date].batches[batch] = {
                                total: studentsInBatch.length,
                                present: 0,
                                students: []
                            };
                        }
                        // Map studentId to attendance status
                        const attendanceMap = {};
                        data.students.forEach(s => {
                            attendanceMap[s.studentId || s.id] = s.present;
                        });
                        studentsInBatch.forEach(student => {
                            // Branch/belt filtering for instructors and admin
                            if (userRole === 'instructor' && student.branch !== userBranch) return;
                            if (userRole === 'admin') {
                                if (selectedBranch !== 'All' && student.branch !== selectedBranch) return;
                                if (selectedBelt !== 'All' && student.belt !== selectedBelt) return;
                            }
                            const present = attendanceMap[student.id];
                            if (present === true) groupedRecords[date].batches[batch].present++;
                            groupedRecords[date].batches[batch].students.push({
                                studentId: student.id,
                                name: student.name,
                                belt: student.belt,
                                branch: student.branch,
                                batch: student.batch,
                                present: present,
                            });
                        });
                    });
                });

                setRecords(Object.values(groupedRecords));
            } catch (error) {
                console.error('Error fetching records:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecords();
    }, [userRole, userBranch, selectedBranch, selectedBelt]);

    const toggleBatch = (date, batch) => {
        setExpandedBatches(prev => ({
            ...prev,
            [`${date}-${batch}`]: !prev[`${date}-${batch}`]
        }));
    };

    const handleSort = (date, batch, option) => {
        setSortOptions(prev => ({ ...prev, [`${date}-${batch}`]: option }));
    };

    if (loading) {
        return (
            <div className="min-vh-100 bg-light">
                <div className="container-fluid px-3 py-4 position-relative">
                    <div className="text-center">
                        <Spinner animation="border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </Spinner>
                    </div>
                </div>
            </div>
        );
    }

    if (records.length === 0) {
        return (
            <div className="min-vh-100 bg-light">
                <div className="container-fluid px-3 py-4 position-relative">
                    <NoData
                        title="No Attendance Records Found"
                        message="There are no attendance records in the system yet."
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-vh-100 bg-light">
            <div className="container-fluid px-3 py-4 position-relative">
                <h1 className="mb-4">Attendance Records</h1>
                {userRole === 'admin' && (
                    <Row className="mb-3">
                        <Col md={4} sm={6} xs={12} className="mb-2">
                            <Form.Select value={selectedBranch} onChange={e => setSelectedBranch(e.target.value)}>
                                {branches.map(branch => (
                                    <option key={branch} value={branch}>{branch}</option>
                                ))}
                            </Form.Select>
                        </Col>
                        <Col md={4} sm={6} xs={12} className="mb-2">
                            <Form.Select value={selectedBelt} onChange={e => setSelectedBelt(e.target.value)}>
                                <option value="All">All Belts</option>
                                {beltOrder.map(belt => (
                                    <option key={belt} value={belt}>{belt}</option>
                                ))}
                            </Form.Select>
                        </Col>
                    </Row>
                )}
                <h2 className="mt-5 mb-4">Detailed Records</h2>
                <Accordion>
                    {records.map(record => (
                        <Accordion.Item key={record.id || record.date} eventKey={record.id || record.date}>
                            <Accordion.Header>
                                {record.date}
                            </Accordion.Header>
                            <Accordion.Body>
                                {Object.entries(record.batches).map(([batch, data]) => (
                                    <Card key={`${record.date}-${batch}`} className="mb-3 border-0 shadow-sm">
                                        <Card.Header
                                            className="d-flex justify-content-between align-items-center bg-light"
                                            style={{ cursor: 'pointer', borderBottom: '1px solid #e9ecef' }}
                                            onClick={() => toggleBatch(record.date, batch)}
                                        >
                                            <div>
                                                <span className="fw-semibold">Batch {batch}</span>
                                                <span className="ms-3 text-muted">{data.present}/{data.total}</span>
                                            </div>
                                            <div className="d-flex align-items-center">
                                                {expandedBatches[`${record.date}-${batch}`] ?
                                                    <FaChevronUp /> : <FaChevronDown />
                                                }
                                            </div>
                                        </Card.Header>
                                        {expandedBatches[`${record.date}-${batch}`] && (
                                            <Card.Body className="bg-white">
                                                <div className="d-flex justify-content-end mb-2">
                                                    <Dropdown onClick={e => e.stopPropagation()} onSelect={option => handleSort(record.date, batch, option)}>
                                                        <Dropdown.Toggle variant="outline-secondary" size="sm">
                                                            Sort By
                                                        </Dropdown.Toggle>
                                                        <Dropdown.Menu>
                                                            <Dropdown.Item eventKey="name-asc">Name (A-Z)</Dropdown.Item>
                                                            <Dropdown.Item eventKey="present-first">Present First</Dropdown.Item>
                                                            <Dropdown.Item eventKey="absent-first">Absent First</Dropdown.Item>
                                                        </Dropdown.Menu>
                                                    </Dropdown>
                                                </div>
                                                <Table striped bordered hover responsive>
                                                    <thead>
                                                        <tr>
                                                            <th>Name</th>
                                                            <th>Belt</th>
                                                            <th>Branch</th>
                                                            <th>Status</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {(() => {
                                                            let students = data.students;
                                                            // Sorting
                                                            const sortKey = sortOptions[`${record.date}-${batch}`];
                                                            if (sortKey === 'name-asc') {
                                                                students = [...students].sort((a, b) => naturalCompare(a.name, b.name));
                                                            } else if (sortKey === 'present-first') {
                                                                students = [...students].sort((a, b) => (b.present === true) - (a.present === true));
                                                            } else if (sortKey === 'absent-first') {
                                                                students = [...students].sort((a, b) => (a.present === true) - (b.present === true));
                                                            }
                                                            return students.map(student => (
                                                                <tr key={student.studentId}>
                                                                    <td>{student.name}</td>
                                                                    <td>{student.belt}</td>
                                                                    <td>{student.branch}</td>
                                                                    <td>
                                                                        {student.present === true ? (
                                                                            <span className="badge bg-success">Present</span>
                                                                        ) : student.present === false ? (
                                                                            <span className="badge bg-danger">Absent</span>
                                                                        ) : (
                                                                            <span className="badge bg-secondary">-</span>
                                                                        )}
                                                                    </td>
                                                                </tr>
                                                            ));
                                                        })()}
                                                    </tbody>
                                                </Table>
                                            </Card.Body>
                                        )}
                                    </Card>
                                ))}
                            </Accordion.Body>
                        </Accordion.Item>
                    ))}
                </Accordion>
            </div>
        </div>
    );
} 