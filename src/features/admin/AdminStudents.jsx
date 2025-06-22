import React, { useEffect, useState } from 'react';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Card, Button, Form, Alert, Table, Row, Col, Toast, ToastContainer, Tabs, Tab, Badge } from 'react-bootstrap';
import { FaUserPlus, FaCheck, FaTimes } from 'react-icons/fa';

const BELT_OPTIONS = [
    'White', 'Yellow', 'Yellow Stripe', 'Green', 'Green Stripe', 'Blue', 'Blue Stripe', 'Red', 'Red Stripe', 'Black Stripe', 'Black 1', 'Black 2', 'Black 3'
];

const BATCH_OPTIONS = [1, 2, 3];

export default function AdminStudents() {
    const [students, setStudents] = useState([]);
    const [branches, setBranches] = useState([]);
    const [form, setForm] = useState({
        name: '',
        email: '',
        branch: '',
        belt: '',
        batch: '',
        address: '',
        contactNumber: '',
        dateOfBirth: ''
    });
    const [errors, setErrors] = useState({});
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastVariant, setToastVariant] = useState('success');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState({
        name: '',
        address: '',
        handledBy: '',
        numBatches: '',
        timings: '',
        operationalDays: ''
    });
    const [editError, setEditError] = useState('');
    const [editSuccess, setEditSuccess] = useState('');

    // Fetch students and branches
    useEffect(() => {
        const fetchData = async () => {
            const studentsSnapshot = await getDocs(collection(db, 'students'));
            setStudents(studentsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            const branchSnapshot = await getDocs(collection(db, 'branches'));
            setBranches(branchSnapshot.docs.map(doc => doc.data().name));
        };
        fetchData();
    }, [showToast]);

    const validateForm = () => {
        const newErrors = {};
        if (!form.name.trim()) newErrors.name = 'Name is required';
        if (!form.email.trim()) newErrors.email = 'Email is required';
        else if (!/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Please enter a valid email address';
        if (!form.branch) newErrors.branch = 'Branch is required';
        if (!form.belt) newErrors.belt = 'Belt is required';
        if (!form.batch) newErrors.batch = 'Batch is required';
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (errors[name]) setErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!validateForm()) {
            setToastMessage('Please fix the errors in the form ❌');
            setToastVariant('danger');
            setShowToast(true);
            return;
        }
        setIsSubmitting(true);
        try {
            await addDoc(collection(db, 'students'), {
                ...form,
                batch: parseInt(form.batch, 10),
                status: 'active',
                createdAt: new Date().toISOString()
            });
            setToastMessage('Student Added Successfully ✅');
            setToastVariant('success');
            setShowToast(true);
            setForm({ name: '', email: '', branch: '', belt: '', batch: '', address: '', contactNumber: '', dateOfBirth: '' });
        } catch (err) {
            setToastMessage('Error Adding Student ❌');
            setToastVariant('danger');
            setShowToast(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Group students by status and branch
    const organizeStudents = () => {
        const activeStudents = students.filter(s => s.status !== 'derolled');
        const derolledStudents = students.filter(s => s.status === 'derolled');

        const activeByBranch = branches.reduce((acc, branch) => {
            acc[branch] = activeStudents.filter(s => s.branch === branch);
            return acc;
        }, {});

        return { activeByBranch, derolledStudents };
    };

    const getBeltColor = (belt) => {
        const beltMap = { 'White': 'secondary', 'Yellow': 'warning', 'Yellow Stripe': 'warning', 'Green': 'success', 'Green Stripe': 'success', 'Blue': 'primary', 'Blue Stripe': 'primary', 'Red': 'danger', 'Red Stripe': 'danger', 'Black': 'dark', 'Black 1': 'dark', 'Black 2': 'dark', 'Black 3': 'dark', 'Black Stripe': 'dark' };
        return beltMap[belt] || 'secondary';
    };

    const { activeByBranch, derolledStudents } = organizeStudents();

    const handleRowClick = (branch) => {
        setSelectedBranch(branch);
        setShowModal(true);
        setEditMode(false);
        setEditForm({
            name: branch.name || "",
            address: branch.address || "",
            handledBy: branch.handledBy || "",
            numBatches: branch.numBatches || "",
            timings: branch.timings || "",
            operationalDays: branch.operationalDays || ""
        });
        setEditError('');
        setEditSuccess('');
    };

    return (
        <div className="container-fluid px-3 py-4 position-relative">
            <Card className="shadow-sm overflow-auto mx-auto" style={{ maxWidth: 900 }}>
                <Card.Header className="bg-primary text-white">
                    <h1 className="h4 mb-0"><FaUserPlus className="me-2" />Add New Student</h1>
                </Card.Header>
                <Card.Body className="overflow-auto" style={{ maxHeight: '80vh' }}>
                    <Form className="d-flex flex-column gap-4" onSubmit={handleSave}>
                        <Row>
                            <Col md={6} xs={12}>
                                <Form.Group controlId="name">
                                    <Form.Label>Full Name</Form.Label>
                                    <Form.Control type="text" name="name" value={form.name} onChange={handleChange} isInvalid={!!errors.name} placeholder="Enter student's full name" />
                                    <Form.Control.Feedback type="invalid">{errors.name}</Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6} xs={12}>
                                <Form.Group controlId="email">
                                    <Form.Label>Email Address</Form.Label>
                                    <Form.Control type="email" name="email" value={form.email} onChange={handleChange} isInvalid={!!errors.email} placeholder="Enter student's email" />
                                    <Form.Control.Feedback type="invalid">{errors.email}</Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={4} xs={12}>
                                <Form.Group controlId="branch">
                                    <Form.Label>Branch</Form.Label>
                                    <Form.Select name="branch" value={form.branch} onChange={handleChange} isInvalid={!!errors.branch}>
                                        <option value="">Select Branch</option>
                                        {branches.map(branch => (
                                            <option key={branch} value={branch}>{branch}</option>
                                        ))}
                                    </Form.Select>
                                    <Form.Control.Feedback type="invalid">{errors.branch}</Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={4} xs={12}>
                                <Form.Group controlId="belt">
                                    <Form.Label>Belt</Form.Label>
                                    <Form.Select name="belt" value={form.belt} onChange={handleChange} isInvalid={!!errors.belt}>
                                        <option value="">Select Belt</option>
                                        {BELT_OPTIONS.map(belt => (
                                            <option key={belt} value={belt}>{belt}</option>
                                        ))}
                                    </Form.Select>
                                    <Form.Control.Feedback type="invalid">{errors.belt}</Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={4} xs={12}>
                                <Form.Group controlId="batch">
                                    <Form.Label>Batch</Form.Label>
                                    <Form.Select name="batch" value={form.batch} onChange={handleChange} isInvalid={!!errors.batch}>
                                        <option value="">Select Batch</option>
                                        {BATCH_OPTIONS.map(batch => (
                                            <option key={batch} value={batch}>Batch {batch}</option>
                                        ))}
                                    </Form.Select>
                                    <Form.Control.Feedback type="invalid">{errors.batch}</Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>
                        <Row>
                            <Col md={4} xs={12}>
                                <Form.Group controlId="address">
                                    <Form.Label>Address</Form.Label>
                                    <Form.Control type="text" name="address" value={form.address} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                            <Col md={4} xs={12}>
                                <Form.Group controlId="contactNumber">
                                    <Form.Label>Contact Number</Form.Label>
                                    <Form.Control type="tel" name="contactNumber" value={form.contactNumber} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                            <Col md={4} xs={12}>
                                <Form.Group controlId="dateOfBirth">
                                    <Form.Label>Date of Birth</Form.Label>
                                    <Form.Control type="date" name="dateOfBirth" value={form.dateOfBirth} onChange={handleChange} />
                                </Form.Group>
                            </Col>
                        </Row>
                        <div className="d-flex justify-content-end gap-2">
                            <Button variant="primary" type="submit" disabled={isSubmitting}>
                                <FaCheck className="me-2" />{isSubmitting ? 'Saving...' : 'Save Student'}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>
            <div className="mt-4">
                <Tabs defaultActiveKey="active" className="mb-4">
                    <Tab eventKey="active" title="Active Students">
                        {branches.map(branch => (
                            <div key={branch} className="mb-5">
                                <h5 className="fw-bold mb-3">{branch} Branch <Badge bg="primary" className="ms-2">{activeByBranch[branch]?.length || 0} students</Badge></h5>
                                <div className="table-responsive">
                                    <Table striped bordered hover size="sm">
                                        <thead>
                                            <tr><th>Name</th><th>Email</th><th>Belt</th><th>Batch</th><th>Contact</th><th>Actions</th></tr>
                                        </thead>
                                        <tbody>
                                            {activeByBranch[branch] && activeByBranch[branch].length > 0 ? (
                                                activeByBranch[branch].map(student => (
                                                    <tr key={student.id}>
                                                        <td>{student.name}</td>
                                                        <td>{student.email}</td>
                                                        <td><Badge bg={getBeltColor(student.belt)}>{student.belt}</Badge></td>
                                                        <td>{student.batch}</td>
                                                        <td>{student.contactNumber}</td>
                                                        <td><Button as="a" href={`/admin/student/${student.id}`} variant="outline-primary" size="sm">View Details</Button></td>
                                                    </tr>
                                                ))
                                            ) : (
                                                <tr><td colSpan={6} className="text-center text-muted">No students in this branch.</td></tr>
                                            )}
                                        </tbody>
                                    </Table>
                                </div>
                            </div>
                        ))}
                    </Tab>

                    <Tab eventKey="derolled" title="Derolled Students">
                        <Card className="shadow-sm">
                            <Card.Body>
                                <h5 className="fw-bold mb-3">Derolled Students <Badge bg="danger" className="ms-2">{derolledStudents.length} students</Badge></h5>
                                {derolledStudents.length > 0 ? (
                                    <div className="table-responsive">
                                        <Table striped bordered hover size="sm">
                                            <thead>
                                                <tr><th>Name</th><th>Email</th><th>Belt</th><th>Ex-Branch</th><th>Ex-Batch</th><th>Contact</th><th>Actions</th></tr>
                                            </thead>
                                            <tbody>
                                                {derolledStudents.map(student => (
                                                    <tr key={student.id}>
                                                        <td>{student.name}</td>
                                                        <td>{student.email}</td>
                                                        <td><Badge bg={getBeltColor(student.belt)}>{student.belt}</Badge></td>
                                                        <td>{student.exBranch || student.branch || '-'}</td>
                                                        <td>{student.exBatch || student.batch || '-'}</td>
                                                        <td>{student.contactNumber || '-'}</td>
                                                        <td><Button as="a" href={`/admin/student/${student.id}`} variant="outline-primary" size="sm">View Details</Button></td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </Table>
                                    </div>
                                ) : (
                                    <p className="text-muted text-center">No derolled students found.</p>
                                )}
                            </Card.Body>
                        </Card>
                    </Tab>
                </Tabs>
            </div>
            <ToastContainer position="bottom-center" className="mb-4">
                <Toast bg={toastVariant} show={showToast} onClose={() => setShowToast(false)} delay={3000} autohide>
                    <Toast.Body className="text-white text-center fw-bold">{toastMessage}</Toast.Body>
                </Toast>
            </ToastContainer>
        </div>
    );
} 