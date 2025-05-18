import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc, updateDoc, collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../firebase';
import { Card, Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { FaChevronLeft, FaSave, FaUndo } from 'react-icons/fa';
import { useAuth } from '../../contexts/AuthContext';

const BELT_OPTIONS = [
    'White', 'Yellow', 'Yellow Stripe', 'Green', 'Green Stripe', 'Blue', 'Blue Stripe', 'Red', 'Red Stripe', 'Black Stripe', 'Black 1', 'Black 2', 'Black 3'
];

export default function EditStudent() {
    const { studentId } = useParams();
    const navigate = useNavigate();
    const { userRole, userBranch } = useAuth();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState('');
    const [branches, setBranches] = useState([]);
    const [availableBatches, setAvailableBatches] = useState([]);
    const [branchBatchesMap, setBranchBatchesMap] = useState({});

    const [formData, setFormData] = useState({
        name: '',
        email: '',
        contactNumber: '',
        address: '',
        belt: '',
        branch: '',
        batch: '',
        dateOfBirth: '',
        joinDate: '',
        guardianName: '',
        guardianContact: ''
    });

    const [formErrors, setFormErrors] = useState({});

    // Fetch student data and branches
    useEffect(() => {
        const fetchStudentAndBranches = async () => {
            try {
                setLoading(true);
                setError(null);

                // Fetch student data
                const studentRef = doc(db, 'students', studentId);
                const studentSnap = await getDoc(studentRef);

                if (!studentSnap.exists()) {
                    setError('Student not found');
                    setLoading(false);
                    return;
                }

                const studentData = { id: studentSnap.id, ...studentSnap.data() };
                setFormData(studentData);

                // Fetch branches
                const branchesSnapshot = await getDocs(collection(db, 'branches'));
                const branchesData = branchesSnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                // Create a map of branch to number of batches
                const batchesMap = {};
                branchesData.forEach(branch => {
                    const numBatches = parseInt(branch.numBatches) || 2;
                    batchesMap[branch.name] = Array.from({ length: numBatches }, (_, i) => i + 1);
                });
                setBranchBatchesMap(batchesMap);

                // Get list of branch names
                const branchNames = branchesData.map(branch => branch.name);
                setBranches(branchNames);

                // Set available batches based on current branch
                if (studentData.branch && batchesMap[studentData.branch]) {
                    setAvailableBatches(batchesMap[studentData.branch]);
                }
            } catch (err) {
                console.error('Error fetching data:', err);
                setError('Failed to load student data: ' + err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchStudentAndBranches();
    }, [studentId]);

    // Update available batches when branch changes
    useEffect(() => {
        if (formData.branch && branchBatchesMap[formData.branch]) {
            setAvailableBatches(branchBatchesMap[formData.branch]);

            // Check if current batch is valid for this branch
            const currentBatch = parseInt(formData.batch);
            const maxBatch = Math.max(...branchBatchesMap[formData.branch]);

            if (currentBatch > maxBatch) {
                // Batch is out of range for this branch, mark as unallocated
                setFormData(prev => ({
                    ...prev,
                    batch: 'unallocated'
                }));
            }
        }
    }, [formData.branch, branchBatchesMap]);

    const handleChange = (e) => {
        const { name, value } = e.target;

        // If branch is changed, we need to check batch compatibility
        if (name === 'branch') {
            setFormData(prev => ({
                ...prev,
                [name]: value,
                // Reset batch if branch changes to ensure compatibility
                batch: ''
            }));
        } else {
            setFormData(prev => ({
                ...prev,
                [name]: value
            }));
        }

        // Clear any previous errors for this field
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const validateForm = () => {
        const errors = {};

        if (!formData.name || formData.name.trim() === '') {
            errors.name = 'Name is required';
        }

        if (!formData.branch || formData.branch.trim() === '') {
            errors.branch = 'Branch is required';
        }

        if (!formData.batch) {
            errors.batch = 'Batch is required';
        }

        if (formData.email && !/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Invalid email format';
        }

        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            setSaving(true);
            setError(null);
            setSuccess('');

            // Update student document in Firestore
            const studentRef = doc(db, 'students', studentId);

            // Convert batch to number if it's not 'unallocated'
            const updatedData = {
                ...formData,
                batch: formData.batch === 'unallocated' ? 'unallocated' : parseInt(formData.batch)
            };

            // Remove id from the data to be updated
            const { id, ...dataToUpdate } = updatedData;

            await updateDoc(studentRef, dataToUpdate);

            setSuccess('Student updated successfully!');

            // Wait a moment before navigating back
            setTimeout(() => {
                navigate(`/student/${studentId}`);
            }, 1500);
        } catch (err) {
            console.error('Error updating student:', err);
            setError('Failed to update student: ' + err.message);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        navigate(`/student/${studentId}`);
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center my-5">
                <Spinner animation="border" variant="primary" />
                <span className="ms-2">Loading student data...</span>
            </div>
        );
    }

    return (
        <div className="container py-4">
            <button
                className="btn btn-link d-flex align-items-center mb-4 ps-0 text-decoration-none"
                onClick={handleCancel}
            >
                <FaChevronLeft className="me-2" />
                <span>Back to Student Details</span>
            </button>

            <h4 className="mb-4">Edit Student: {formData.name}</h4>

            {error && (
                <Alert variant="danger" dismissible onClose={() => setError(null)}>
                    {error}
                </Alert>
            )}

            {success && (
                <Alert variant="success" dismissible onClose={() => setSuccess('')}>
                    {success}
                </Alert>
            )}

            <Card className="shadow-sm">
                <Card.Body>
                    <Form onSubmit={handleSubmit}>
                        <Row className="g-3">
                            <Col xs={12} md={6}>
                                <Form.Group controlId="name">
                                    <Form.Label>Student's full name <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="name"
                                        value={formData.name || ''}
                                        onChange={handleChange}
                                        isInvalid={!!formErrors.name}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {formErrors.name}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            <Col xs={12} md={6}>
                                <Form.Group controlId="email">
                                    <Form.Label>Email</Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="email"
                                        value={formData.email || ''}
                                        onChange={handleChange}
                                        isInvalid={!!formErrors.email}
                                    />
                                    <Form.Control.Feedback type="invalid">
                                        {formErrors.email}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            <Col xs={12} md={6}>
                                <Form.Group controlId="contactNumber">
                                    <Form.Label>Contact Number</Form.Label>
                                    <Form.Control
                                        type="tel"
                                        name="contactNumber"
                                        value={formData.contactNumber || ''}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>

                            <Col xs={12} md={6}>
                                <Form.Group controlId="dateOfBirth">
                                    <Form.Label>Date of Birth</Form.Label>
                                    <Form.Control
                                        type="date"
                                        name="dateOfBirth"
                                        value={formData.dateOfBirth || ''}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>

                            <Col xs={12}>
                                <Form.Group controlId="address">
                                    <Form.Label>Address</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        rows={2}
                                        name="address"
                                        value={formData.address || ''}
                                        onChange={handleChange}
                                    />
                                </Form.Group>
                            </Col>

                            <Col xs={12} md={4}>
                                <Form.Group controlId="branch">
                                    <Form.Label>Branch <span className="text-danger">*</span></Form.Label>
                                    {userRole === 'admin' ? (
                                        <Form.Select
                                            name="branch"
                                            value={formData.branch || ''}
                                            onChange={handleChange}
                                            isInvalid={!!formErrors.branch}
                                        >
                                            <option value="">Select Branch</option>
                                            {branches.map(branch => (
                                                <option key={branch} value={branch}>
                                                    {branch}
                                                </option>
                                            ))}
                                        </Form.Select>
                                    ) : (
                                        <Form.Control
                                            type="text"
                                            value={formData.branch || ''}
                                            disabled
                                            readOnly
                                        />
                                    )}
                                    <Form.Control.Feedback type="invalid">
                                        {formErrors.branch}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            <Col xs={12} md={4}>
                                <Form.Group controlId="batch">
                                    <Form.Label>Batch <span className="text-danger">*</span></Form.Label>
                                    <Form.Select
                                        name="batch"
                                        value={formData.batch || ''}
                                        onChange={handleChange}
                                        isInvalid={!!formErrors.batch}
                                    >
                                        <option value="">Select Batch</option>
                                        {availableBatches.map(batch => (
                                            <option key={batch} value={batch}>
                                                Batch {batch}
                                            </option>
                                        ))}
                                        <option value="unallocated">Unallocated</option>
                                    </Form.Select>
                                    <Form.Control.Feedback type="invalid">
                                        {formErrors.batch}
                                    </Form.Control.Feedback>
                                </Form.Group>
                            </Col>

                            <Col xs={12} md={4}>
                                <Form.Group controlId="belt">
                                    <Form.Label>Belt</Form.Label>
                                    <Form.Select
                                        name="belt"
                                        value={formData.belt || ''}
                                        onChange={handleChange}
                                    >
                                        <option value="">Select Belt</option>
                                        {BELT_OPTIONS.map(belt => (
                                            <option key={belt} value={belt}>
                                                {belt}
                                            </option>
                                        ))}
                                    </Form.Select>
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

                            <Col xs={12} className="mt-4">
                                <div className="d-flex justify-content-end gap-2">
                                    <Button
                                        variant="outline-secondary"
                                        onClick={handleCancel}
                                        disabled={saving}
                                    >
                                        <FaUndo className="me-2" />
                                        Cancel
                                    </Button>
                                    <Button
                                        variant="primary"
                                        type="submit"
                                        disabled={saving}
                                    >
                                        <FaSave className="me-2" />
                                        {saving ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </div>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>
        </div>
    );
} 