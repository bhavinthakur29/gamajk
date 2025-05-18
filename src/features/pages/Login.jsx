import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Button, Modal, Form, Alert, Spinner, Toast, ToastContainer } from 'react-bootstrap';
import { FaEnvelope, FaLock, FaUser, FaUserShield, FaMobile, FaSms, FaKey, FaCheckCircle } from 'react-icons/fa';
import { checkPhoneVerification, sendOTP, verifyOTP } from '../../services/phoneAuthService';
import './Login.css';

export default function Login() {
    const { login, resetPassword, authError } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [activeTab, setActiveTab] = useState('instructor');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Password reset state
    const [showResetModal, setShowResetModal] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetMessage, setResetMessage] = useState('');
    const [resetError, setResetError] = useState('');
    const [resetLoading, setResetLoading] = useState(false);
    const [resetMethod, setResetMethod] = useState('email');
    const [hasPhoneVerification, setHasPhoneVerification] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');

    // OTP verification state
    const [showOtpModal, setShowOtpModal] = useState(false);
    const [otpCode, setOtpCode] = useState('');
    const [verificationId, setVerificationId] = useState('');
    const [verifyLoading, setVerifyLoading] = useState(false);
    const [checkingPhone, setCheckingPhone] = useState(false);

    // Success notification
    const [showConfirmation, setShowConfirmation] = useState(false);

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password, activeTab);
            if (activeTab === 'admin') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setEmail('');
        setPassword('');
        setError('');
    };

    const handleResetPasswordClick = async () => {
        setResetEmail(email);
        setResetMethod('email');
        setResetError('');
        setResetMessage('');
        setHasPhoneVerification(false);
        setPhoneNumber('');

        if (email) {
            setCheckingPhone(true);
            try {
                const { hasPhone, phoneNumber } = await checkPhoneVerification(email);
                setHasPhoneVerification(hasPhone);
                if (hasPhone && phoneNumber) {
                    setPhoneNumber(phoneNumber);
                }
            } catch (err) {
                console.error("Error checking phone verification:", err);
            } finally {
                setCheckingPhone(false);
            }
        }

        setShowResetModal(true);
    };

    const handleResetPassword = async (e) => {
        e.preventDefault();
        setResetError('');
        setResetMessage('');
        setResetLoading(true);

        try {
            if (resetMethod === 'email') {
                await resetPassword(resetEmail);
                setResetMessage('Password reset email sent. Please check your inbox.');
                setTimeout(() => {
                    setShowResetModal(false);
                    setResetEmail('');
                    setResetMessage('');
                }, 3000);
            } else if (resetMethod === 'phone') {
                // Send OTP to phone
                const verificationId = await sendOTP(phoneNumber);
                setVerificationId(verificationId);
                setShowOtpModal(true);
                setShowResetModal(false);
            }
        } catch (err) {
            setResetError(err.message);
        } finally {
            setResetLoading(false);
        }
    };

    const handleVerifyOTP = async (e) => {
        e.preventDefault();
        setError('');
        setVerifyLoading(true);

        try {
            const success = await verifyOTP(verificationId, otpCode);
            if (success) {
                // Show verification success message
                setResetMessage('Phone number verified successfully. You will receive instructions to reset your password shortly.');

                // Display the SMS-like confirmation notification
                setShowConfirmation(true);

                // Close the OTP modal after success
                setTimeout(() => {
                    setShowOtpModal(false);
                    // In a real implementation, this would trigger the actual password reset
                }, 2000);
            }
        } catch (err) {
            setError(err.message || 'Failed to verify OTP.');
        } finally {
            setVerifyLoading(false);
        }
    };

    return (
        <div className="login-container">
            <div className="login-header">
                <h1>GAMA Martial Arts</h1>
            </div>

            <div className="login-body">
                <div className="login-tabs">
                    <button
                        className={`login-tab ${activeTab === 'instructor' ? 'active' : ''}`}
                        onClick={() => handleTabChange('instructor')}
                    >
                        <FaUser className="me-2" />
                        Instructor
                    </button>
                    <button
                        className={`login-tab ${activeTab === 'admin' ? 'active' : ''}`}
                        onClick={() => handleTabChange('admin')}
                    >
                        <FaUserShield className="me-2" />
                        Admin
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="login-form">
                    <div className="form-group">
                        <FaEnvelope className="input-icon" />
                        <input
                            type="email"
                            placeholder="Email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <FaLock className="input-icon" />
                        <input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            required
                        />
                    </div>

                    {error && <Alert variant="danger">{error}</Alert>}

                    <Button
                        type="submit"
                        variant="primary"
                        className="login-btn"
                        disabled={loading}
                    >
                        {loading ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Logging in...
                            </>
                        ) : (
                            `Login as ${activeTab === 'admin' ? 'Admin' : 'Instructor'}`
                        )}
                    </Button>

                    <div className="text-center mt-3">
                        <button
                            type="button"
                            className="forgot-btn"
                            onClick={handleResetPasswordClick}
                        >
                            Forgot Password?
                        </button>
                    </div>
                </form>
            </div>

            {/* Password Reset Modal */}
            <Modal show={showResetModal} onHide={() => setShowResetModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Reset Password</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {resetError && <Alert variant="danger">{resetError}</Alert>}
                    {resetMessage && <Alert variant="success">{resetMessage}</Alert>}

                    <Form onSubmit={handleResetPassword}>
                        <Form.Group className="mb-3">
                            <Form.Label>Email address</Form.Label>
                            <Form.Control
                                type="email"
                                value={resetEmail}
                                onChange={(e) => setResetEmail(e.target.value)}
                                placeholder="Enter your email"
                                required
                            />
                        </Form.Group>

                        {checkingPhone ? (
                            <div className="text-center my-3">
                                <Spinner animation="border" size="sm" />
                                <span className="ms-2">Checking verification options...</span>
                            </div>
                        ) : (
                            hasPhoneVerification && (
                                <div className="mb-3">
                                    <Form.Label>Reset method</Form.Label>
                                    <div className="reset-options">
                                        <div
                                            className={`reset-option ${resetMethod === 'email' ? 'active' : ''}`}
                                            onClick={() => setResetMethod('email')}
                                        >
                                            <FaEnvelope className="reset-icon" />
                                            <div>Email</div>
                                            <small className="text-muted">Receive a reset link via email</small>
                                        </div>
                                        <div
                                            className={`reset-option ${resetMethod === 'phone' ? 'active' : ''}`}
                                            onClick={() => setResetMethod('phone')}
                                        >
                                            <FaMobile className="reset-icon" />
                                            <div>Phone</div>
                                            <small className="text-muted">Receive a verification code via SMS</small>
                                        </div>
                                    </div>
                                </div>
                            )
                        )}

                        {resetMethod === 'phone' && (
                            <Form.Group className="mb-3">
                                <Form.Label>Phone Number</Form.Label>
                                <Form.Control
                                    type="text"
                                    value={phoneNumber}
                                    disabled
                                    readOnly
                                />
                                <Form.Text className="text-muted">
                                    We'll send a verification code to this phone number.
                                </Form.Text>
                                <div id="recaptcha-container" className="mt-3"></div>
                            </Form.Group>
                        )}

                        <div className="d-grid gap-2">
                            <Button variant="primary" type="submit" disabled={resetLoading}>
                                {resetLoading ? (
                                    <>
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        {resetMethod === 'email' ? 'Sending...' : 'Verifying...'}
                                    </>
                                ) : (
                                    resetMethod === 'email' ? 'Send Reset Link' : 'Send Verification Code'
                                )}
                            </Button>
                            <Button variant="secondary" onClick={() => setShowResetModal(false)}>
                                Cancel
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* OTP Verification Modal */}
            <Modal show={showOtpModal} onHide={() => !verifyLoading && setShowOtpModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Verify Phone Number</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && <Alert variant="danger">{error}</Alert>}
                    {resetMessage && <Alert variant="success">{resetMessage}</Alert>}

                    <p className="mb-4">
                        We've sent a 6-digit verification code to your phone number.
                        Please enter the code below to verify your identity.
                    </p>

                    <Form onSubmit={handleVerifyOTP}>
                        <Form.Group className="mb-4">
                            <Form.Label>Verification Code</Form.Label>
                            <Form.Control
                                type="text"
                                placeholder="Enter 6-digit code"
                                value={otpCode}
                                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                                maxLength={6}
                                required
                            />
                        </Form.Group>

                        <div className="d-grid gap-2">
                            <Button
                                variant="primary"
                                type="submit"
                                disabled={verifyLoading || otpCode.length !== 6}
                            >
                                {verifyLoading ? (
                                    <>
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        Verifying...
                                    </>
                                ) : (
                                    <>
                                        <FaKey className="me-2" />
                                        Verify Code
                                    </>
                                )}
                            </Button>
                            <Button
                                variant="outline-secondary"
                                onClick={() => setShowOtpModal(false)}
                                disabled={verifyLoading}
                            >
                                Cancel
                            </Button>
                        </div>
                    </Form>
                </Modal.Body>
            </Modal>

            {/* SMS Confirmation Toast */}
            <ToastContainer position="bottom-end" className="p-3 position-fixed">
                <Toast
                    show={showConfirmation}
                    onClose={() => setShowConfirmation(false)}
                    delay={5000}
                    autohide
                    className="sms-toast"
                >
                    <Toast.Header closeButton={false}>
                        <FaSms className="me-2 text-primary" />
                        <strong className="me-auto">SMS Message</strong>
                    </Toast.Header>
                    <Toast.Body>
                        <div className="d-flex align-items-center">
                            <FaCheckCircle className="me-2 text-success" />
                            <div>
                                <strong>Phone number verified for GAMA.</strong>
                                <small className="d-block text-muted mt-1">
                                    {new Date().toLocaleTimeString()}
                                </small>
                            </div>
                        </div>
                    </Toast.Body>
                </Toast>
            </ToastContainer>
        </div>
    );
} 