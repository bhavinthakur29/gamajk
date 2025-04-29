import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Toast, ToastContainer, Button, Form, Card, Row, Col } from 'react-bootstrap';
import { FaUserPlus, FaCheck, FaTimes } from 'react-icons/fa';
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import LogoutButton from '../../components/common/LogoutButton';

const BELT_OPTIONS = [
    'White',
    'Yellow',
    'Yellow Stripe',
    'Green',
    'Green Stripe',
    'Blue',
    'Blue Stripe',
    'Red',
    'Red Stripe',
    'Black Stripe',
    'Black 1',
    'Black 2',
    'Black 3'
];

const BRANCH_OPTIONS = ['HQ', 'Satwari', 'Gangyal'];
const BATCH_OPTIONS = [1, 2, 3];

export default function AddStudent() {
    const navigate = useNavigate();
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastVariant, setToastVariant] = useState('success');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        branch: '',
        belt: '',
        batch: ''
    });

    const [errors, setErrors] = useState({});

    const validateForm = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Name is required';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Please enter a valid email address';
        }

        if (!formData.branch) {
            newErrors.branch = 'Branch is required';
        }

        if (!formData.belt) {
            newErrors.belt = 'Belt is required';
        }

        if (!formData.batch) {
            newErrors.batch = 'Batch is required';
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
            setToastMessage('Please fix the errors in the form ❌');
            setToastVariant('danger');
            setShowToast(true);
            return;
        }

        setIsSubmitting(true);
        try {
            const newStudent = {
                ...formData,
                batch: parseInt(formData.batch, 10),
                createdAt: new Date().toISOString()
            };

            // Save to Firebase
            const docRef = await addDoc(collection(db, 'students'), newStudent);
            console.log('Student added with ID:', docRef.id);

            setToastMessage('Student Added Successfully ✅');
            setToastVariant('success');
            setShowToast(true);

            // Reset form
            setFormData({
                name: '',
                email: '',
                branch: '',
                belt: '',
                batch: ''
            });

            // Delay navigation
            setTimeout(() => navigate('/students'), 1500);

        } catch (error) {
            console.error('Error adding student:', error);
            setToastMessage('Error Adding Student ❌');
            setToastVariant('danger');
            setShowToast(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="container-fluid px-3 py-4 position-relative">
            <LogoutButton />

            <Card className="shadow-sm">
                <Card.Header className="bg-primary text-white">
                    <h1 className="h3 mb-0">
                        <FaUserPlus className="me-2" />
                        Add New Student
                    </h1>
                </Card.Header>
                <Card.Body>
                    <Form className="d-flex flex-column gap-4">
                        <Row>
                            <Col md={6}>
                                <Form.Group controlId="name">
                                    <Form.Label>Full Name</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        isInvalid={!!errors.name}
                                        placeholder="Enter student's full name"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.name}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={6}>
                                <Form.Group controlId="email">
                                    <Form.Label>Email Address</Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleChange}
                                        isInvalid={!!errors.email}
                                        placeholder="Enter student's email"
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {errors.email}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                        </Row>

                        <Row>
                            <Col md={4}>
                                <Form.Group controlId="branch">
                                    <Form.Label>Branch</Form.Label>
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
                                    <Form.Control.Feedback type="invalid">
                                        {errors.branch}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group controlId="belt">
                                    <Form.Label>Belt</Form.Label>
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
                            <Col md={4}>
                                <Form.Group controlId="batch">
                                    <Form.Label>Batch</Form.Label>
                                    <Form.Select
                                        name="batch"
                                        value={formData.batch}
                                        onChange={handleChange}
                                        isInvalid={!!errors.batch}
                                    >
                                        <option value="">Select Batch</option>
                                        {BATCH_OPTIONS.map(batch => (
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
                        </Row>

                        <div className="d-flex justify-content-end gap-2">
                            <Button
                                variant="outline-secondary"
                                onClick={() => navigate('/students')}
                            >
                                <FaTimes className="me-2" />
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleSave}
                                disabled={isSubmitting}
                            >
                                <FaCheck className="me-2" />
                                {isSubmitting ? 'Saving...' : 'Save Student'}
                            </Button>
                        </div>
                    </Form>
                </Card.Body>
            </Card>

            <ToastContainer position="bottom-center" className="mb-4">
                <Toast
                    bg={toastVariant}
                    show={showToast}
                    onClose={() => setShowToast(false)}
                    delay={3000}
                    autohide
                >
                    <Toast.Body className="text-white text-center fw-bold">
                        {toastMessage}
                    </Toast.Body>
                </Toast>
            </ToastContainer>
        </div>
    );
}
