import { useState, useEffect } from 'react';
import { collection, getDocs, setDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { db, auth } from '../../firebase';
import { Card, Button, Form, Alert, Table, InputGroup, Row, Col, Spinner, Tooltip, OverlayTrigger } from 'react-bootstrap';
import { FaEye, FaEyeSlash, FaInfoCircle, FaTrash, FaEdit, FaSave, FaTimes } from 'react-icons/fa';

const BELT_OPTIONS = [
    'White', 'Yellow', 'Yellow Stripe', 'Green', 'Green Stripe', 'Blue', 'Blue Stripe', 'Red', 'Red Stripe', 'Black Stripe', 'Black 1', 'Black 2', 'Black 3'
];
const BATCH_OPTIONS = [1, 2, 3];

const validateEmail = (email) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};

const validatePhone = (phone) => {
    return /^\+?[\d\s-]{10,}$/.test(phone);
};

const validateDate = (date) => {
    if (!date) return true;
    const selectedDate = new Date(date);
    const today = new Date();
    return selectedDate <= today;
};

export default function AdminInstructors() {
    const [instructors, setInstructors] = useState([]);
    const [branches, setBranches] = useState([]);
    const [form, setForm] = useState({
        fullName: '',
        email: '',
        password: '',
        branch: '',
        belt: '',
        address: '',
        contactNumber: '',
        dateOfBirth: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [editRowId, setEditRowId] = useState(null);
    const [editRowData, setEditRowData] = useState({});
    const [editError, setEditError] = useState('');
    const [editLoading, setEditLoading] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [formErrors, setFormErrors] = useState({});
    const [isSubmitting, setIsSubmitting] = useState(false);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const usersSnapshot = await getDocs(collection(db, 'users'));
            setInstructors(usersSnapshot.docs.filter(docSnap => docSnap.data().role === 'instructor').map(docSnap => ({ id: docSnap.id, ...docSnap.data() })));
            const branchSnapshot = await getDocs(collection(db, 'branches'));
            setBranches(branchSnapshot.docs.map(doc => doc.data().name));
        } catch (err) {
            setError('Failed to fetch data: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, []);

    const validateForm = () => {
        const errors = {};
        if (!form.fullName.trim()) errors.fullName = 'Full name is required';
        if (!form.email.trim()) errors.email = 'Email is required';
        else if (!validateEmail(form.email)) errors.email = 'Please enter a valid email address';
        if (!form.password) errors.password = 'Password is required';
        else if (form.password.length < 6) errors.password = 'Password must be at least 6 characters';
        if (!form.branch) errors.branch = 'Branch is required';
        if (!form.belt) errors.belt = 'Belt is required';
        if (form.contactNumber && !validatePhone(form.contactNumber)) errors.contactNumber = 'Please enter a valid phone number';
        if (form.dateOfBirth && !validateDate(form.dateOfBirth)) errors.dateOfBirth = 'Date of birth cannot be in the future';
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setForm(prev => ({ ...prev, [name]: value }));
        if (formErrors[name]) {
            setFormErrors(prev => ({ ...prev, [name]: '' }));
        }
    };

    const handleAddInstructor = async (e) => {
        e.preventDefault();
        if (!validateForm()) return;

        setError('');
        setSuccess('');
        setIsSubmitting(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
            const user = userCredential.user;
            await setDoc(doc(db, 'users', user.uid), {
                email: form.email,
                role: 'instructor',
                fullName: form.fullName,
                branch: form.branch,
                belt: form.belt,
                address: form.address,
                contactNumber: form.contactNumber,
                dateOfBirth: form.dateOfBirth,
                createdAt: new Date().toISOString()
            });
            setSuccess('Instructor created successfully!');
            setForm({ fullName: '', email: '', password: '', branch: '', belt: '', address: '', contactNumber: '', dateOfBirth: '' });
            await fetchData();
        } catch (err) {
            setError(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditClick = (inst) => {
        setEditRowId(inst.id);
        setEditRowData({ ...inst });
        setEditError('');
    };

    const handleEditChange = (e) => {
        setEditRowData({ ...editRowData, [e.target.name]: e.target.value });
    };

    const handleEditCancel = () => {
        setEditRowId(null);
        setEditRowData({});
        setEditError('');
    };

    const handleEditSave = async () => {
        setEditLoading(true);
        setEditError('');
        try {
            const docRef = doc(db, 'users', editRowId);
            await updateDoc(docRef, {
                fullName: editRowData.fullName,
                email: editRowData.email,
                branch: editRowData.branch,
                belt: editRowData.belt,
                address: editRowData.address,
                contactNumber: editRowData.contactNumber,
                dateOfBirth: editRowData.dateOfBirth,
                updatedAt: new Date().toISOString()
            });
            setSuccess('Instructor updated successfully!');
            setEditRowId(null);
            setEditRowData({});
            await fetchData();
        } catch (err) {
            setEditError('Failed to update: ' + (err.message || err));
        } finally {
            setEditLoading(false);
        }
    };

    const handleDeleteInstructor = async (id) => {
        if (!window.confirm('Are you sure you want to delete this instructor? This action cannot be undone.')) return;

        try {
            setIsLoading(true);
            await deleteDoc(doc(db, 'users', id));
            setSuccess('Instructor deleted successfully!');
            await fetchData();
        } catch (err) {
            setError('Failed to delete instructor: ' + err.message);
        } finally {
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '200px' }}>
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    return (
        <Card className="shadow-sm">
            <Card.Body className="p-3 p-md-4">
                <h3 className="mb-4">Instructors</h3>
                {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
                {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
                <Form onSubmit={handleAddInstructor} className="mb-4">
                    <Row className="g-3">
                        <Col md={6} xs={12}>
                            <Form.Group>
                                <Form.Label>Full Name <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    name="fullName"
                                    value={form.fullName}
                                    onChange={handleChange}
                                    isInvalid={!!formErrors.fullName}
                                    placeholder="Enter full name"
                                />
                                <Form.Control.Feedback type="invalid">{formErrors.fullName}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6} xs={12}>
                            <Form.Group>
                                <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                                <Form.Control
                                    name="email"
                                    value={form.email}
                                    onChange={handleChange}
                                    isInvalid={!!formErrors.email}
                                    placeholder="Enter email address"
                                    autoComplete="off"
                                />
                                <Form.Control.Feedback type="invalid">{formErrors.email}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="g-3 mt-2">
                        <Col md={6} xs={12}>
                            <Form.Group>
                                <Form.Label>Password <span className="text-danger">*</span></Form.Label>
                                <InputGroup>
                                    <Form.Control
                                        name="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={form.password}
                                        onChange={handleChange}
                                        isInvalid={!!formErrors.password}
                                        placeholder="Enter password"
                                        autoComplete="new-password"
                                    />
                                    <Button
                                        variant="outline-secondary"
                                        type="button"
                                        onClick={() => setShowPassword(v => !v)}
                                        tabIndex={-1}
                                        style={{ borderLeft: 0 }}
                                    >
                                        {showPassword ? <FaEyeSlash /> : <FaEye />}
                                    </Button>
                                </InputGroup>
                                <Form.Control.Feedback type="invalid">{formErrors.password}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6} xs={12}>
                            <Form.Group>
                                <Form.Label>Branch <span className="text-danger">*</span></Form.Label>
                                <Form.Select
                                    name="branch"
                                    value={form.branch}
                                    onChange={handleChange}
                                    isInvalid={!!formErrors.branch}
                                >
                                    <option value="">Select Branch</option>
                                    {branches.map(branch => (
                                        <option key={branch} value={branch}>{branch}</option>
                                    ))}
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">{formErrors.branch}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="g-3 mt-2">
                        <Col md={4} xs={12}>
                            <Form.Group>
                                <Form.Label>Belt <span className="text-danger">*</span></Form.Label>
                                <Form.Select
                                    name="belt"
                                    value={form.belt}
                                    onChange={handleChange}
                                    isInvalid={!!formErrors.belt}
                                >
                                    <option value="">Select Belt</option>
                                    {BELT_OPTIONS.map(belt => (
                                        <option key={belt} value={belt}>{belt}</option>
                                    ))}
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">{formErrors.belt}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={4} xs={12}>
                            <Form.Group>
                                <Form.Label>Address</Form.Label>
                                <Form.Control
                                    name="address"
                                    value={form.address}
                                    onChange={handleChange}
                                    placeholder="Enter address"
                                />
                            </Form.Group>
                        </Col>
                        <Col md={4} xs={12}>
                            <Form.Group>
                                <Form.Label>Contact Number</Form.Label>
                                <Form.Control
                                    name="contactNumber"
                                    value={form.contactNumber}
                                    onChange={handleChange}
                                    isInvalid={!!formErrors.contactNumber}
                                    placeholder="Enter contact number"
                                />
                                <Form.Control.Feedback type="invalid">{formErrors.contactNumber}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row className="g-3 mt-2">
                        <Col md={6} xs={12}>
                            <Form.Group>
                                <Form.Label>Date of Birth</Form.Label>
                                <Form.Control
                                    name="dateOfBirth"
                                    type="date"
                                    value={form.dateOfBirth}
                                    onChange={handleChange}
                                    isInvalid={!!formErrors.dateOfBirth}
                                />
                                <Form.Control.Feedback type="invalid">{formErrors.dateOfBirth}</Form.Control.Feedback>
                            </Form.Group>
                        </Col>
                        <Col md={6} xs={12} className="d-flex align-items-end">
                            <Button
                                variant="primary"
                                type="submit"
                                className="w-100"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <>
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        Adding Instructor...
                                    </>
                                ) : (
                                    'Add Instructor'
                                )}
                            </Button>
                        </Col>
                    </Row>
                </Form>
                <div className="table-responsive">
                    <Table striped bordered hover size="sm" className="mb-0">
                        <thead className="table-light">
                            <tr>
                                <th>Full Name</th>
                                <th>Email</th>
                                <th>Branch</th>
                                <th>Belt</th>
                                <th className="d-none d-md-table-cell">Address</th>
                                <th className="d-none d-md-table-cell">Contact</th>
                                <th className="d-none d-md-table-cell">Date of Birth</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {instructors.map(inst => (
                                <tr key={inst.id} className={editRowId === inst.id ? 'table-warning' : ''}>
                                    {editRowId === inst.id ? (
                                        <>
                                            <td><Form.Control name="fullName" value={editRowData.fullName || ''} onChange={handleEditChange} size="sm" /></td>
                                            <td><Form.Control name="email" value={editRowData.email || ''} onChange={handleEditChange} size="sm" /></td>
                                            <td>
                                                <Form.Select name="branch" value={editRowData.branch || ''} onChange={handleEditChange} size="sm">
                                                    <option value="">Select Branch</option>
                                                    {branches.map(branch => (
                                                        <option key={branch} value={branch}>{branch}</option>
                                                    ))}
                                                </Form.Select>
                                            </td>
                                            <td>
                                                <Form.Select name="belt" value={editRowData.belt || ''} onChange={handleEditChange} size="sm">
                                                    <option value="">Select Belt</option>
                                                    {BELT_OPTIONS.map(belt => (
                                                        <option key={belt} value={belt}>{belt}</option>
                                                    ))}
                                                </Form.Select>
                                            </td>
                                            <td className="d-none d-md-table-cell"><Form.Control name="address" value={editRowData.address || ''} onChange={handleEditChange} size="sm" /></td>
                                            <td className="d-none d-md-table-cell"><Form.Control name="contactNumber" value={editRowData.contactNumber || ''} onChange={handleEditChange} size="sm" /></td>
                                            <td className="d-none d-md-table-cell"><Form.Control name="dateOfBirth" type="date" value={editRowData.dateOfBirth || ''} onChange={handleEditChange} size="sm" /></td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <Button
                                                        variant="success"
                                                        size="sm"
                                                        onClick={handleEditSave}
                                                        disabled={editLoading}
                                                    >
                                                        {editLoading ? (
                                                            <>
                                                                <Spinner animation="border" size="sm" className="me-1" />
                                                                Saving...
                                                            </>
                                                        ) : (
                                                            <>
                                                                <FaSave className="me-1" />
                                                                Save
                                                            </>
                                                        )}
                                                    </Button>
                                                    <Button
                                                        variant="secondary"
                                                        size="sm"
                                                        onClick={handleEditCancel}
                                                        disabled={editLoading}
                                                    >
                                                        <FaTimes className="me-1" />
                                                        Cancel
                                                    </Button>
                                                </div>
                                            </td>
                                        </>
                                    ) : (
                                        <>
                                            <td>{inst.fullName}</td>
                                            <td>{inst.email}</td>
                                            <td>{inst.branch}</td>
                                            <td>{inst.belt}</td>
                                            <td className="d-none d-md-table-cell">{inst.address}</td>
                                            <td className="d-none d-md-table-cell">{inst.contactNumber}</td>
                                            <td className="d-none d-md-table-cell">{inst.dateOfBirth}</td>
                                            <td>
                                                <div className="d-flex gap-2">
                                                    <OverlayTrigger
                                                        placement="top"
                                                        overlay={<Tooltip>Edit Instructor</Tooltip>}
                                                    >
                                                        <Button
                                                            variant="outline-primary"
                                                            size="sm"
                                                            onClick={() => handleEditClick(inst)}
                                                        >
                                                            <FaEdit />
                                                        </Button>
                                                    </OverlayTrigger>
                                                    <OverlayTrigger
                                                        placement="top"
                                                        overlay={<Tooltip>Delete Instructor</Tooltip>}
                                                    >
                                                        <Button
                                                            variant="outline-danger"
                                                            size="sm"
                                                            onClick={() => handleDeleteInstructor(inst.id)}
                                                        >
                                                            <FaTrash />
                                                        </Button>
                                                    </OverlayTrigger>
                                                </div>
                                            </td>
                                        </>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
                {editError && <Alert variant="danger" className="mt-2" onClose={() => setEditError('')} dismissible>{editError}</Alert>}
            </Card.Body>
        </Card>
    );
} 
