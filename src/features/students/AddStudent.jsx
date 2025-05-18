import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toast, ToastContainer, Button, Form, Card, Row, Col, Spinner } from 'react-bootstrap';
import { FaUserPlus, FaCheck, FaTimes, FaChevronLeft } from 'react-icons/fa';
import { collection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { BELT_OPTIONS, BRANCH_OPTIONS } from '../../utils/constants';
import './AddStudent.css';
import '../pages/Dashboard.css';
import { useAuth } from '../../contexts/AuthContext';

export default function AddStudent() {
    const navigate = useNavigate();
    const { userRole, userBranch } = useAuth();
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastVariant, setToastVariant] = useState('success');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [loading, setLoading] = useState(true);
    const [availableBatches, setAvailableBatches] = useState([]);
    const [branchConfig, setBranchConfig] = useState(null);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        address: '',
        contactNumber: '',
        dateOfBirth: '',
        branch: userRole === 'instructor' ? userBranch : '',
        belt: '',
        batch: '',
        guardianName: '',
        guardianContact: '',
        joinDate: new Date().toISOString().split('T')[0]
    });

    const [errors, setErrors] = useState({});

    // Fetch branch configuration
    useEffect(() => {
        const fetchBranchConfig = async () => {
            try {
                setLoading(true);
                if (!userBranch && userRole !== 'admin') {
                    setLoading(false);
                    return;
                }

                // Get branch configuration from the database
                const branchQuery = query(
                    collection(db, 'branches'),
                    where('name', '==', userRole === 'instructor' ? userBranch : formData.branch)
                );

                const branchSnapshot = await getDocs(branchQuery);
                if (!branchSnapshot.empty) {
                    const branchData = branchSnapshot.docs[0].data();
                    setBranchConfig(branchData);

                    // Get number of batches
                    const numBatches = parseInt(branchData.numBatches) || 2;
                    const batchArray = Array.from({ length: numBatches }, (_, i) => i + 1);
                    setAvailableBatches(batchArray);
                } else {
                    // Default to 2 batches if branch config not found
                    setAvailableBatches([1, 2]);
                }
            } catch (error) {
                console.error('Error fetching branch config:', error);
                // Default to 2 batches if error
                setAvailableBatches([1, 2]);
            } finally {
                setLoading(false);
            }
        };

        fetchBranchConfig();
    }, [userBranch, userRole, formData.branch]);

    // For admin, update available batches when branch changes
    useEffect(() => {
        if (userRole === 'admin' && formData.branch) {
            const fetchBranchBatches = async () => {
                try {
                    const branchQuery = query(
                        collection(db, 'branches'),
                        where('name', '==', formData.branch)
                    );

                    const branchSnapshot = await getDocs(branchQuery);
                    if (!branchSnapshot.empty) {
                        const branchData = branchSnapshot.docs[0].data();

                        // Get number of batches
                        const numBatches = parseInt(branchData.numBatches) || 2;
                        const batchArray = Array.from({ length: numBatches }, (_, i) => i + 1);
                        setAvailableBatches(batchArray);

                        // Reset batch selection if current selection is invalid
                        if (formData.batch && parseInt(formData.batch) > numBatches) {
                            setFormData(prev => ({
                                ...prev,
                                batch: ''
                            }));
                        }
                    }
                } catch (error) {
                    console.error('Error fetching branch batches:', error);
                }
            };

            fetchBranchBatches();
        }
    }, [formData.branch, userRole]);

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        // Only validate branch selection for admins
        if (userRole !== 'instructor' && !formData.branch) {
            newErrors.branch = 'Branch is required';
        }

        if (!formData.belt) {
            newErrors.belt = 'Belt is required';
        }

        if (!formData.batch) {
            newErrors.batch = 'Batch is required';
        }

        if (formData.contactNumber && !/^\+?[\d\s-]{10,}$/.test(formData.contactNumber)) {
            newErrors.contactNumber = 'Please enter a valid phone number';
        }

        if (formData.dateOfBirth) {
            const today = new Date();
            const birthDate = new Date(formData.dateOfBirth);
            if (birthDate > today) {
                newErrors.dateOfBirth = 'Date of birth cannot be in the future';
            }
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));

        // Clear error when user starts typing
        if (errors[name]) {
            setErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSave = async () => {
        if (!validateForm()) {
            setToastMessage('Please fix the errors in the form');
            setToastVariant('danger');
            setShowToast(true);
            return;
        }

        setIsSubmitting(true);
        try {
            // For instructors, ensure the branch is set to their assigned branch
            const branch = userRole === 'instructor' ? userBranch : formData.branch;

            const newStudent = {
                ...formData,
                branch,
                batch: parseInt(formData.batch, 10),
                createdAt: new Date().toISOString()
            };

            // Save to Firebase
            const docRef = await addDoc(collection(db, 'students'), newStudent);
            console.log('Student added with ID:', docRef.id);

            setToastMessage('Student Added Successfully');
            setToastVariant('success');
            setShowToast(true);

            // Delay navigation
            setTimeout(() => navigate('/students'), 1500);

        } catch (error) {
            console.error('Error adding student:', error);
            setToastMessage('Error Adding Student');
            setToastVariant('danger');
            setShowToast(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center my-5">
                <Spinner animation="border" variant="primary" />
                <span className="ms-2">Loading form...</span>
            </div>
        );
    }

    return (
        <div className="student-form-container">
            <button
                className="back-to-dashboard-btn"
                onClick={() => navigate('/students')}
            >
                <FaChevronLeft className="back-icon" />
                <span>Back to Students</span>
            </button>
            <h4 className="page-title mb-4">New Student</h4>

            <Card className="form-card">
                <Card.Body>
                    <Form>
                        <Row className="g-3">
                            <Col xs={12} md={6}>
                                <Form.Group controlId="name">
                                    <Form.Label>Student's full name <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        isInvalid={!!errors.name}
                                        placeholder="Enter full name"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.name}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            <Col xs={12} md={6}>
                                <Form.Group controlId="email">
                                    <Form.Label>Student's email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        isInvalid={!!errors.email}
                                        placeholder="Enter email address"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.email}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            <Col xs={12} md={6}>
                                <Form.Group controlId="contactNumber">
                                    <Form.Label>Contact Number</Form.Label>
                                    <Form.Control
                                        type="tel"
                                        name="contactNumber"
                                        value={formData.contactNumber}
                                        onChange={handleChange}
                                        isInvalid={!!errors.contactNumber}
                                        placeholder="Enter contact number"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.contactNumber}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            <Col xs={12} md={6}>
                                <Form.Group controlId="dateOfBirth">
                                    <Form.Label>Date of Birth</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="dateOfBirth"
                                        value={formData.dateOfBirth}
                                        onChange={handleChange}
                                        isInvalid={!!errors.dateOfBirth}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.dateOfBirth}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            <Col xs={12}>
                                <Form.Group controlId="address">
                                    <Form.Label>Address</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        name="address"
                                        value={formData.address}
                                        onChange={handleChange}
                                        placeholder="Enter address"
                                    />
                                </Form.Group>
                            </Col>

                            <Col xs={12} md={4}>
                                <Form.Group controlId="branch">
                                    <Form.Label>Branch <span className="text-danger">*</span></Form.Label>
                                    {userRole === 'instructor' ? (
                                        <Form.Control
                                            type="text"
                                            value={userBranch}
                                            disabled
                                            readOnly
                                        />
                                    ) : (
                                        <Form.Select
                                            name="branch"
                                            value={formData.branch}
                                            onChange={handleChange}
                                            isInvalid={!!errors.branch}
                                        >
                                            <option value="">Select Branch</option>
                                            {BRANCH_OPTIONS.map(branch => (
                                                <option key={branch} value={branch}>
                                                    {branch}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    )}
                                    <Form.Control.Feedback type="invalid">
                                        {errors.branch}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            <Col xs={12} md={4}>
                                <Form.Group controlId="batch">
                                    <Form.Label>Batch <span className="text-danger">*</span></Form.Label>
                                    <Form.Select
                                        name="batch"
                                        value={formData.batch}
                                        onChange={handleChange}
                                        isInvalid={!!errors.batch}
                                    >
                                        <option value="">Select Batch</option>
                                        {availableBatches.map(batch => (
                                            <option key={batch} value={batch}>
                                                Batch {batch}
                                            </option>
                                        ))}
                                    </Form.Select>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.batch}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            <Col xs={12} md={4}>
                                <Form.Group controlId="belt">
                                    <Form.Label>Belt <span className="text-danger">*</span></Form.Label>
                                    <Form.Select
                                        name="belt"
                                        value={formData.belt}
                                        onChange={handleChange}
                                        isInvalid={!!errors.belt}
                                    >
                                        <option value="">Select Belt</option>
                                        {BELT_OPTIONS.map(belt => (
                                            <option key={belt} value={belt}>
                                                {belt}
                                            </option>
                                        ))}
                                    </Form.Select>
                                    <Form.Control.Feedback type="invalid">
                                        {errors.belt}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            <Col xs={12} md={6}>
                                <Form.Group controlId="guardianName">
                                    <Form.Label>Guardian's Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="guardianName"
                                        value={formData.guardianName || ''}
                                        onChange={handleChange}
                                        placeholder="Enter guardian's name"
                                    />
                                </Form.Group>
                            </Col>

                            <Col xs={12} md={6}>
                                <Form.Group controlId="guardianContact">
                                    <Form.Label>Guardian's Contact</Form.Label>
                                    <Form.Control
                                        type="tel"
                                        name="guardianContact"
                                        value={formData.guardianContact || ''}
                                        onChange={handleChange}
                                        placeholder="Enter guardian's contact"
                                    />
                                </Form.Group>
                            </Col>

                            <Col xs={12} md={6}>
                                <Form.Group controlId="joinDate">
                                    <Form.Label>Join Date</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="joinDate"
                                        value={formData.joinDate || ''}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>

                            <Col xs={12} className="mt-3">
                                <div className="d-grid">
                                    <Button
                                        variant="primary"
                                        onClick={handleSave}
                                        disabled={isSubmitting}
                                        size="lg"
                                        className="submit-button"
                                    >
                                        {isSubmitting ? 'Adding Student...' : 'Add Student'}
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            <ToastContainer position="top-center" className="mt-5">
                <Toast
                    onClose={() => setShowToast(false)}
                    show={showToast}
                    delay={3000}
                    autohide
                    bg={toastVariant}
                >
                    <Toast.Header>
                        <strong className="me-auto">{toastVariant === 'success' ? 'Success' : 'Error'}</strong>
                    </Toast.Header>
                    <Toast.Body className={toastVariant === 'success' ? 'text-white' : ''}>
                        {toastVariant === 'success' ? <FaCheck className="me-2" /> : <FaTimes className="me-2" />}
                        {toastMessage}
                    </Toast.Body>
                </Toast>
            </ToastContainer>
        </div>
    );
}
