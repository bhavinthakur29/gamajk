import React, { useState } from 'react';
import { Form, Button, Row, Col, InputGroup, Alert, Spinner } from 'react-bootstrap';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { BELT_OPTIONS, BRANCH_OPTIONS, VALIDATION_PATTERNS } from '../../../utils/constants';

const InstructorForm = ({ onSubmit, branches = BRANCH_OPTIONS, isSubmitting = false, initialError = '' }) => {
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

    const [formErrors, setFormErrors] = useState({});
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState(initialError);

    const validateForm = () => {
        const errors = {};
        if (!form.fullName.trim()) errors.fullName = 'Full name is required';
        if (!form.email.trim()) errors.email = 'Email is required';
        else if (!VALIDATION_PATTERNS.EMAIL.test(form.email)) errors.email = 'Please enter a valid email address';
        if (!form.password) errors.password = 'Password is required';
        else if (form.password.length < 6) errors.password = 'Password must be at least 6 characters';
        if (!form.branch) errors.branch = 'Branch is required';
        if (!form.belt) errors.belt = 'Belt is required';
        if (form.contactNumber && !VALIDATION_PATTERNS.PHONE.test(form.contactNumber))
            errors.contactNumber = 'Please enter a valid phone number';

        if (form.dateOfBirth) {
            const selectedDate = new Date(form.dateOfBirth);
            const today = new Date();
            if (selectedDate > today) errors.dateOfBirth = 'Date of birth cannot be in the future';
        }

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

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) return;

        try {
            await onSubmit(form);
            // Reset form after successful submission
            setForm({
                fullName: '',
                email: '',
                password: '',
                branch: '',
                belt: '',
                address: '',
                contactNumber: '',
                dateOfBirth: ''
            });
        } catch (err) {
            setError(err.message || 'An error occurred while submitting the form');
        }
    };

    return (
        <>
            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            <Form onSubmit={handleSubmit}>
                <Row className="g-3">
                    <Col md={6} xs={12}>
                        <Form.Group>
                            <Form.Label>Full Name <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="text"
                                name="fullName"
                                value={form.fullName}
                                onChange={handleChange}
                                isInvalid={!!formErrors.fullName}
                            />
                            <Form.Control.Feedback type="invalid">{formErrors.fullName}</Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                    <Col md={6} xs={12}>
                        <Form.Group>
                            <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="email"
                                name="email"
                                value={form.email}
                                onChange={handleChange}
                                isInvalid={!!formErrors.email}
                            />
                            <Form.Control.Feedback type="invalid">{formErrors.email}</Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                    <Col md={6} xs={12}>
                        <Form.Group>
                            <Form.Label>Password <span className="text-danger">*</span></Form.Label>
                            <InputGroup>
                                <Form.Control
                                    type={showPassword ? "text" : "password"}
                                    name="password"
                                    value={form.password}
                                    onChange={handleChange}
                                    isInvalid={!!formErrors.password}
                                />
                                <Button
                                    variant="outline-secondary"
                                    onClick={() => setShowPassword(!showPassword)}
                                >
                                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                                </Button>
                                <Form.Control.Feedback type="invalid">{formErrors.password}</Form.Control.Feedback>
                            </InputGroup>
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
                    <Col md={6} xs={12}>
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
                    <Col md={6} xs={12}>
                        <Form.Group>
                            <Form.Label>Address</Form.Label>
                            <Form.Control
                                type="text"
                                name="address"
                                value={form.address}
                                onChange={handleChange}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={6} xs={12}>
                        <Form.Group>
                            <Form.Label>Contact Number</Form.Label>
                            <Form.Control
                                type="tel"
                                name="contactNumber"
                                value={form.contactNumber}
                                onChange={handleChange}
                                isInvalid={!!formErrors.contactNumber}
                            />
                            <Form.Control.Feedback type="invalid">{formErrors.contactNumber}</Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                    <Col md={6} xs={12}>
                        <Form.Group>
                            <Form.Label>Date of Birth</Form.Label>
                            <Form.Control
                                type="date"
                                name="dateOfBirth"
                                value={form.dateOfBirth}
                                onChange={handleChange}
                                isInvalid={!!formErrors.dateOfBirth}
                            />
                            <Form.Control.Feedback type="invalid">{formErrors.dateOfBirth}</Form.Control.Feedback>
                        </Form.Group>
                    </Col>
                    <Col xs={12} className="mt-3">
                        <Button type="submit" variant="primary" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                                    Adding Instructor...
                                </>
                            ) : 'Add Instructor'}
                        </Button>
                    </Col>
                </Row>
            </Form>
        </>
    );
};

export default InstructorForm; 