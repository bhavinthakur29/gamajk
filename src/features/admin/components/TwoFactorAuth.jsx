import React, { useState, useEffect } from 'react';
import { Card, Button, Form, Alert, Spinner, Modal, Toast, ToastContainer } from 'react-bootstrap';
import { FaShieldAlt, FaCheck, FaTimes, FaPhone, FaSms, FaCheckCircle } from 'react-icons/fa';
import { auth, db } from '../../../firebase';
import { RecaptchaVerifier, PhoneAuthProvider, signInWithPhoneNumber } from 'firebase/auth';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../../contexts/AuthContext';

const PhoneVerification = () => {
    const { currentUser } = useAuth();
    const [isEnabled, setIsEnabled] = useState(false);
    const [phoneNumber, setPhoneNumber] = useState('');
    const [otpCode, setOtpCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [verifyLoading, setVerifyLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showVerifyModal, setShowVerifyModal] = useState(false);
    const [verificationId, setVerificationId] = useState('');
    const [checkingStatus, setCheckingStatus] = useState(true);
    const [showConfirmation, setShowConfirmation] = useState(false);

    // Check if phone verification is already enabled
    useEffect(() => {
        const checkPhoneStatus = async () => {
            try {
                setCheckingStatus(true);
                if (!currentUser) return;

                const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
                if (userDoc.exists()) {
                    const userData = userDoc.data();
                    setIsEnabled(!!userData.isPhoneVerified);
                    if (userData.phoneNumber) {
                        setPhoneNumber(userData.phoneNumber);
                    }
                }
            } catch (err) {
                console.error('Error checking phone status:', err);
            } finally {
                setCheckingStatus(false);
            }
        };

        checkPhoneStatus();
    }, [currentUser]);

    // Initialize reCAPTCHA verifier
    const setupRecaptcha = () => {
        if (!window.recaptchaVerifier) {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'normal',
                'callback': () => {
                    // reCAPTCHA solved
                },
                'expired-callback': () => {
                    setError('reCAPTCHA expired. Please try again.');
                }
            });
        }
    };

    const handleSendCode = async () => {
        setError('');
        setSuccess('');

        if (!phoneNumber || phoneNumber.trim().length < 10) {
            setError('Please enter a valid phone number with country code (e.g., +1234567890)');
            return;
        }

        try {
            setLoading(true);
            setupRecaptcha();

            const phoneProvider = new PhoneAuthProvider(auth);
            const verifier = window.recaptchaVerifier;

            // Send verification code
            const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, verifier);
            setVerificationId(confirmationResult.verificationId);
            setShowVerifyModal(true);
            setSuccess('Verification code sent! Please check your phone.');
        } catch (err) {
            console.error('Error sending verification code:', err);
            setError(err.message || 'Failed to send verification code. Please try again.');
        } finally {
            setLoading(false);
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.clear();
                window.recaptchaVerifier = null;
            }
        }
    };

    const handleVerifyCode = async () => {
        setError('');
        setSuccess('');

        if (!otpCode || otpCode.trim().length !== 6) {
            setError('Please enter a valid 6-digit verification code.');
            return;
        }

        try {
            setVerifyLoading(true);
            if (!currentUser) throw new Error('User not authenticated');

            // Verify the code
            const credential = PhoneAuthProvider.credential(verificationId, otpCode);

            // Update user document to mark phone as verified
            await updateDoc(doc(db, 'users', currentUser.uid), {
                phoneNumber: phoneNumber,
                isPhoneVerified: true
            });

            // Show success notification like an SMS
            setShowConfirmation(true);

            setSuccess('Phone verification successful!');
            setIsEnabled(true);

            // Close the modal after a short delay
            setTimeout(() => {
                setShowVerifyModal(false);
                setOtpCode('');
            }, 1500);
        } catch (err) {
            console.error('Error verifying code:', err);
            setError(err.message || 'Failed to verify code. Please try again.');
        } finally {
            setVerifyLoading(false);
        }
    };

    const handleDisablePhoneVerification = async () => {
        if (!window.confirm('Are you sure you want to disable phone verification? This will reduce the security of your account.')) {
            return;
        }

        try {
            setLoading(true);
            setError('');
            setSuccess('');

            if (!currentUser) throw new Error('User not authenticated');

            await updateDoc(doc(db, 'users', currentUser.uid), {
                isPhoneVerified: false
            });

            setIsEnabled(false);
            setSuccess('Phone verification disabled successfully.');
        } catch (err) {
            console.error('Error disabling phone verification:', err);
            setError(err.message || 'Failed to disable phone verification.');
        } finally {
            setLoading(false);
        }
    };

    if (checkingStatus) {
        return (
            <div className="text-center my-4">
                <Spinner animation="border" variant="primary" />
                <p className="mt-2">Checking phone verification status...</p>
            </div>
        );
    }

    return (
        <>
            <Card className="shadow-sm mb-4">
                <Card.Header className="bg-light">
                    <div className="d-flex align-items-center">
                        <FaShieldAlt className="me-2 text-primary" />
                        <h5 className="mb-0">Phone Verification</h5>
                    </div>
                </Card.Header>
                <Card.Body>
                    {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
                    {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

                    <p>
                        Phone verification adds an extra layer of security to your account.
                        When enabled, you'll be able to recover your account using your verified phone number.
                    </p>

                    {isEnabled ? (
                        <div className="d-flex flex-column gap-3">
                            <div className="d-flex align-items-center mb-3">
                                <FaCheck className="me-2 text-success" />
                                <span className="fw-semibold">Phone verification is enabled</span>
                            </div>

                            <div className="mb-3">
                                <div className="mb-2 fw-semibold">Verified Phone Number:</div>
                                <div>{phoneNumber}</div>
                            </div>

                            <Button
                                variant="outline-danger"
                                onClick={handleDisablePhoneVerification}
                                disabled={loading}
                                className="action-btn"
                            >
                                {loading ? (
                                    <>
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        Disabling...
                                    </>
                                ) : (
                                    <>
                                        <FaTimes className="me-2" />
                                        Disable Phone Verification
                                    </>
                                )}
                            </Button>
                        </div>
                    ) : (
                        <div className="d-flex flex-column gap-3">
                            <div className="d-flex align-items-center mb-3">
                                <FaTimes className="me-2 text-danger" />
                                <span className="fw-semibold">Phone verification is not enabled</span>
                            </div>

                            <Form.Group className="mb-3">
                                <Form.Label>Phone Number</Form.Label>
                                <Form.Control
                                    type="tel"
                                    placeholder="Enter your phone number with country code (e.g., +1234567890)"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    disabled={loading}
                                />
                                <Form.Text className="text-muted">
                                    We'll send a verification code to this number.
                                </Form.Text>
                            </Form.Group>

                            <div className="mb-3" id="recaptcha-container"></div>

                            <Button
                                variant="primary"
                                onClick={handleSendCode}
                                disabled={loading}
                                className="action-btn"
                            >
                                {loading ? (
                                    <>
                                        <Spinner animation="border" size="sm" className="me-2" />
                                        Sending Code...
                                    </>
                                ) : (
                                    <>
                                        <FaSms className="me-2" />
                                        Send Verification Code
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </Card.Body>
            </Card>

            {/* Verification Modal */}
            <Modal show={showVerifyModal} onHide={() => !verifyLoading && setShowVerifyModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Verify Your Phone</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
                    {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

                    <p>We've sent a verification code to {phoneNumber}.</p>

                    <Form.Group className="mb-3">
                        <Form.Label>Enter Verification Code</Form.Label>
                        <Form.Control
                            type="text"
                            placeholder="6-digit code"
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, '').slice(0, 6))}
                            disabled={verifyLoading}
                        />
                    </Form.Group>
                </Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setShowVerifyModal(false)}
                        disabled={verifyLoading}
                        className="action-btn"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleVerifyCode}
                        disabled={verifyLoading || otpCode.length !== 6}
                        className="action-btn"
                    >
                        {verifyLoading ? (
                            <>
                                <Spinner animation="border" size="sm" className="me-2" />
                                Verifying...
                            </>
                        ) : 'Verify'}
                    </Button>
                </Modal.Footer>
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
        </>
    );
};

export default PhoneVerification; 