import { useState, useEffect } from 'react';
import { collection, getDocs, query, where, updateDoc, doc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Card, Table, Button, Form, Row, Col, Alert, Spinner, Modal, Badge, Tabs, Tab } from 'react-bootstrap';
import { FaUserPlus, FaUserMinus } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import ErrorDisplay from '../../components/common/ErrorDisplay';

export default function InstructorStudentManagement() {
    const { userBranch, userRole } = useAuth();
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [branchConfig, setBranchConfig] = useState(null);
    const [availableBatches, setAvailableBatches] = useState([]);
    const [showAddModal, setShowAddModal] = useState(false);
    const [showRemoveModal, setShowRemoveModal] = useState(false);
    const [selectedStudent, setSelectedStudent] = useState(null);
    const [actionLoading, setActionLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [showTransferOptions, setShowTransferOptions] = useState(false);

    const [addForm, setAddForm] = useState({
        targetBranch: '',
        targetBatch: '',
        reason: ''
    });

    const [removeForm, setRemoveForm] = useState({
        reason: '',
        newBranch: '',
        newBatch: ''
    });

    useEffect(() => {
        fetchStudentsAndConfig();
    }, [userBranch]);

    const fetchStudentsAndConfig = async () => {
        try {
            setLoading(true);
            setError(null);

            const branchQuery = query(
                collection(db, 'branches'),
                where('name', '==', userBranch)
            );
            const branchSnapshot = await getDocs(branchQuery);

            if (!branchSnapshot.empty) {
                const branchData = branchSnapshot.docs[0].data();
                setBranchConfig(branchData);

                const numBatches = parseInt(branchData.numBatches) || 2;
                setAvailableBatches(Array.from({ length: numBatches }, (_, i) => i + 1));
            }

            const studentsQuery = collection(db, 'students');
            const studentsSnapshot = await getDocs(studentsQuery);
            const studentList = studentsSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setStudents(studentList);
        } catch (err) {
            console.error('Error fetching data:', err);
            setError({ message: err.message || 'Failed to load data' });
        } finally {
            setLoading(false);
        }
    };

    const organizeStudents = () => {
        const organized = {
            active: {
                batches: {},
                unallocated: []
            },
        };

        availableBatches.forEach(batch => {
            organized.active.batches[batch] = [];
        });

        students.forEach(student => {
            if (student.status === 'derolled') {
                return;
            }

            if (student.branch === userBranch) {
                if (student.batch && student.batch !== 'unallocated') {
                    const batchNum = parseInt(student.batch);
                    if (organized.active.batches[batchNum]) {
                        organized.active.batches[batchNum].push(student);
                    } else {
                        organized.active.unallocated.push(student);
                    }
                } else {
                    organized.active.unallocated.push(student);
                }
            }
        });

        return organized;
    };

    const handleAddStudent = async () => {
        if (!addForm.targetBranch || !addForm.targetBatch || !addForm.reason) {
            setError({ message: 'Please fill in all required fields' });
            return;
        }

        setActionLoading(true);
        try {
            const studentRef = doc(db, 'students', selectedStudent.id);
            await updateDoc(studentRef, {
                branch: addForm.targetBranch,
                batch: parseInt(addForm.targetBatch),
                status: 'active',
                lastUpdated: serverTimestamp()
            });

            await addDoc(collection(db, 'studentHistory'), {
                studentId: selectedStudent.id,
                action: 'added',
                fromBranch: selectedStudent.branch || 'N/A',
                fromBatch: selectedStudent.batch || 'N/A',
                toBranch: addForm.targetBranch,
                toBatch: parseInt(addForm.targetBatch),
                reason: addForm.reason,
                performedBy: userRole,
                performedAt: serverTimestamp()
            });

            setSuccess(`Student ${selectedStudent.name} has been added to ${addForm.targetBranch} - Batch ${addForm.targetBatch}`);
            setShowAddModal(false);
            setSelectedStudent(null);
            setAddForm({ targetBranch: '', targetBatch: '', reason: '' });
            await fetchStudentsAndConfig();
        } catch (err) {
            setError({ message: 'Failed to add student: ' + err.message });
        } finally {
            setActionLoading(false);
        }
    };

    const handleRemoveStudent = async () => {
        if (!removeForm.reason) {
            setError({ message: 'Please provide a reason for removal' });
            return;
        }

        setActionLoading(true);
        try {
            const studentRef = doc(db, 'students', selectedStudent.id);
            const updateData = {
                status: 'derolled',
                exBranch: selectedStudent.branch,
                exBatch: selectedStudent.batch,
                derolledAt: serverTimestamp(),
                lastUpdated: serverTimestamp()
            };

            if (showTransferOptions && removeForm.newBranch && removeForm.newBatch) {
                updateData.branch = removeForm.newBranch;
                updateData.batch = parseInt(removeForm.newBatch);
                updateData.status = 'active';
            }

            await updateDoc(studentRef, updateData);

            await addDoc(collection(db, 'studentHistory'), {
                studentId: selectedStudent.id,
                action: showTransferOptions && removeForm.newBranch ? 'transferred' : 'derolled',
                fromBranch: selectedStudent.branch,
                fromBatch: selectedStudent.batch,
                toBranch: showTransferOptions && removeForm.newBranch ? removeForm.newBranch : 'N/A',
                toBatch: showTransferOptions && removeForm.newBatch ? parseInt(removeForm.newBatch) : 'N/A',
                reason: removeForm.reason,
                performedBy: userRole,
                performedAt: serverTimestamp()
            });

            const actionText = showTransferOptions && removeForm.newBranch ? 'transferred' : 'derolled';
            setSuccess(`Student ${selectedStudent.name} has been ${actionText}`);
            setShowRemoveModal(false);
            setSelectedStudent(null);
            setRemoveForm({ reason: '', newBranch: '', newBatch: '' });
            setShowTransferOptions(false);
            await fetchStudentsAndConfig();
        } catch (err) {
            setError({ message: 'Failed to remove student: ' + err.message });
        } finally {
            setActionLoading(false);
        }
    };

    const getBeltColor = (belt) => {
        const beltMap = { 'White': 'secondary', 'Yellow': 'warning', 'Yellow Stripe': 'warning', 'Green': 'success', 'Green Stripe': 'success', 'Blue': 'primary', 'Blue Stripe': 'primary', 'Red': 'danger', 'Red Stripe': 'danger', 'Black': 'dark', 'Black 1': 'dark', 'Black 2': 'dark', 'Black 3': 'dark', 'Black Stripe': 'dark' };
        return beltMap[belt] || 'secondary';
    };

    const openAddModal = (student) => {
        setSelectedStudent(student);
        setAddForm({ targetBranch: userBranch, targetBatch: '', reason: '' });
        setShowAddModal(true);
    };

    const openRemoveModal = (student) => {
        setSelectedStudent(student);
        setRemoveForm({ reason: '', newBranch: '', newBatch: '' });
        setShowTransferOptions(false);
        setShowRemoveModal(true);
    };

    if (loading) return <LoadingSpinner text="Loading student data..." />;
    if (error) return <ErrorDisplay error={error} onRetry={fetchStudentsAndConfig} />;

    const organizedStudents = organizeStudents();

    return (
        <div className="container-fluid px-0 py-4">
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center mb-4">
                <h4 className="mb-3 mb-md-0"><strong>Student Management</strong><small className="text-muted ms-2">- {userBranch} Branch</small></h4>
            </div>

            {success && (<Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>)}

            <Tabs defaultActiveKey="active" className="mb-4">
                <Tab eventKey="active" title="Active Students">
                    <Card className="shadow-sm">
                        <Card.Body>
                            {availableBatches.map(batch => (
                                <div key={batch} className="mb-4">
                                    <h5 className="mb-3 border-bottom pb-2">Batch {batch} <Badge bg="primary" className="ms-2">{organizedStudents.active.batches[batch]?.length || 0} students</Badge></h5>
                                    {organizedStudents.active.batches[batch]?.length > 0 ? (
                                        <div className="table-responsive">
                                            <Table striped bordered hover size="sm">
                                                <thead><tr><th>Name</th><th>Belt</th><th>Contact</th><th>Actions</th></tr></thead>
                                                <tbody>
                                                    {organizedStudents.active.batches[batch].map(student => (
                                                        <tr key={student.id}>
                                                            <td>{student.name}</td>
                                                            <td><Badge bg={getBeltColor(student.belt)}>{student.belt}</Badge></td>
                                                            <td>{student.contactNumber || '-'}</td>
                                                            <td><div className="d-flex gap-1"><Button variant="outline-danger" size="sm" onClick={() => openRemoveModal(student)} title="Remove from batch"><FaUserMinus /></Button></div></td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </Table>
                                        </div>
                                    ) : (<p className="text-muted text-center">No students in this batch</p>)}
                                </div>
                            ))}

                            {organizedStudents.active.unallocated.length > 0 && (
                                <div className="mb-4">
                                    <h5 className="mb-3 border-bottom pb-2">Unallocated Students <Badge bg="warning" className="ms-2">{organizedStudents.active.unallocated.length} students</Badge></h5>
                                    <div className="table-responsive">
                                        <Table striped bordered hover size="sm">
                                            <thead><tr><th>Name</th><th>Belt</th><th>Contact</th><th>Actions</th></tr></thead>
                                            <tbody>
                                                {organizedStudents.active.unallocated.map(student => (
                                                    <tr key={student.id}>
                                                        <td>{student.name}</td>
                                                        <td><Badge bg={getBeltColor(student.belt)}>{student.belt}</Badge></td>
                                                        <td>{student.contactNumber || '-'}</td>
                                                        <td>
                                                            <div className="d-flex gap-1">
                                                                <Button variant="outline-primary" size="sm" onClick={() => openAddModal(student)} title="Add to batch"><FaUserPlus /></Button>
                                                                <Button variant="outline-danger" size="sm" onClick={() => openRemoveModal(student)} title="Remove from branch"><FaUserMinus /></Button>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                </div>
                            )}
                        </Card.Body>
                    </Card>
                </Tab>
            </Tabs>

            <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
                <Modal.Header closeButton><Modal.Title>Add Student to Batch</Modal.Title></Modal.Header>
                <Modal.Body>
                    {selectedStudent && (<div className="mb-3"><strong>Student:</strong> {selectedStudent.name} ({selectedStudent.belt})</div>)}
                    <Form>
                        <Row>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Target Branch</Form.Label>
                                    <Form.Control type="text" value={addForm.targetBranch} onChange={(e) => setAddForm({ ...addForm, targetBranch: e.target.value })} placeholder="Enter target branch" />
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Target Batch</Form.Label>
                                    <Form.Select value={addForm.targetBatch} onChange={(e) => setAddForm({ ...addForm, targetBatch: e.target.value })}>
                                        <option value="">Select Batch</option>
                                        {availableBatches.map(batch => (<option key={batch} value={batch}>Batch {batch}</option>))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Form.Group className="mb-3">
                            <Form.Label>Reason</Form.Label>
                            <Form.Control as="textarea" rows={3} value={addForm.reason} onChange={(e) => setAddForm({ ...addForm, reason: e.target.value })} placeholder="Enter reason for adding student to this batch" />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowAddModal(false)}>Cancel</Button>
                    <Button variant="primary" onClick={handleAddStudent} disabled={actionLoading}>{actionLoading ? (<><Spinner as="span" animation="border" size="sm" className="me-2" />Adding...</>) : 'Add Student'}</Button>
                </Modal.Footer>
            </Modal>

            <Modal show={showRemoveModal} onHide={() => setShowRemoveModal(false)} size="lg">
                <Modal.Header closeButton><Modal.Title>Remove Student</Modal.Title></Modal.Header>
                <Modal.Body>
                    {selectedStudent && (<div className="mb-3"><strong>Student:</strong> {selectedStudent.name} ({selectedStudent.belt})<br /><strong>Current:</strong> {selectedStudent.branch} - Batch {selectedStudent.batch}</div>)}
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Reason for Removal</Form.Label>
                            <Form.Control as="textarea" rows={3} value={removeForm.reason} onChange={(e) => setRemoveForm({ ...removeForm, reason: e.target.value })} placeholder="Enter reason for removing student" />
                        </Form.Group>
                        <div className="mb-3">
                            <Form.Check type="checkbox" id="transferOption" label="Transfer to another branch/batch instead of derolling" checked={showTransferOptions} onChange={(e) => { setShowTransferOptions(e.target.checked); if (!e.target.checked) { setRemoveForm({ ...removeForm, newBranch: '', newBatch: '' }); } }} />
                        </div>
                        {showTransferOptions && (
                            <Row>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>New Branch</Form.Label>
                                        <Form.Control type="text" value={removeForm.newBranch} onChange={(e) => setRemoveForm({ ...removeForm, newBranch: e.target.value })} placeholder="Enter new branch" />
                                    </Form.Group>
                                </Col>
                                <Col md={6}>
                                    <Form.Group className="mb-3">
                                        <Form.Label>New Batch</Form.Label>
                                        <Form.Select value={removeForm.newBatch} onChange={(e) => setRemoveForm({ ...removeForm, newBatch: e.target.value })}>
                                            <option value="">Select Batch</option>
                                            {availableBatches.map(batch => (<option key={batch} value={batch}>Batch {batch}</option>))}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                            </Row>
                        )}
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowRemoveModal(false)}>Cancel</Button>
                    <Button variant="danger" onClick={handleRemoveStudent} disabled={actionLoading}>{actionLoading ? (<><Spinner as="span" animation="border" size="sm" className="me-2" />Removing...</>) : (showTransferOptions ? 'Transfer Student' : 'Remove Student')}</Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
} 