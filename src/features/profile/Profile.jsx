import { useState, useEffect } from 'react';
import { auth, db } from '../../firebase';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import { sendEmailVerification, updateEmail } from 'firebase/auth';
import { Button } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import { BELT_OPTIONS } from '../../utils/constants';
import { userService } from '../../services/firebaseService';

export default function Profile() {
    const [isEditing, setIsEditing] = useState(false);
    const [userData, setUserData] = useState({
        fullName: '',
        email: '',
        belt: '',
        address: '',
        contactNumber: '',
        dateOfBirth: '',
        emailVerified: true,
        role: ''
    });
    const [loading, setLoading] = useState(true);
    const [emailEdit, setEmailEdit] = useState('');
    const [emailStatus, setEmailStatus] = useState('verified'); // 'verified' | 'unverified' | 'pending'
    const [emailError, setEmailError] = useState('');
    const [showVerificationSent, setShowVerificationSent] = useState(false);
    const [canResendVerification, setCanResendVerification] = useState(false);
    const [pendingEmail, setPendingEmail] = useState(localStorage.getItem('pendingEmail') || '');
    const navigate = useNavigate();

    const { userRole } = useAuth();

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const user = auth.currentUser;
                if (!user) {
                    navigate('/login');
                    return;
                }
                await user.reload();

                // Use the userService instead of direct Firestore calls
                const userData = await userService.getUserProfile(user.uid, true);

                if (userData) {
                    setUserData({
                        fullName: userData.fullName || '',
                        email: userData.email || user.email,
                        belt: userData.belt || '',
                        address: userData.address || '',
                        contactNumber: userData.contactNumber || '',
                        dateOfBirth: userData.dateOfBirth || '',
                        emailVerified: userData.emailVerified !== false,
                        role: userData.role || ''
                    });
                    setEmailEdit(userData.email || user.email);
                    setEmailStatus(userData.emailVerified === false ? 'unverified' : 'verified');
                } else {
                    const defaultData = {
                        fullName: '',
                        email: user.email,
                        belt: 'White Belt',
                        address: '',
                        contactNumber: '',
                        dateOfBirth: '',
                        emailVerified: true,
                        role: ''
                    };

                    // Use service
                    await userService.updateUserProfile(user.uid, defaultData);

                    setUserData(defaultData);
                    setEmailEdit(user.email);
                    setEmailStatus('verified');
                }
            } catch (error) {
                console.error('Error fetching user data:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchUserData();
    }, [navigate]);

    const handleSave = async () => {
        try {
            const user = auth.currentUser;
            if (!user) return;
            // If email changed, update Auth email and Firestore immediately
            if (emailEdit !== userData.email) {
                setEmailError('');
                try {
                    await updateEmail(user, emailEdit);

                    // Update with service
                    await userService.updateUserProfile(user.uid, {
                        ...userData,
                        email: emailEdit,
                        emailVerified: true
                    });

                    setUserData(prev => ({ ...prev, email: emailEdit, emailVerified: true }));
                    setEmailStatus('verified');
                    setIsEditing(false);
                    return;
                } catch (err) {
                    if (err.code === 'auth/requires-recent-login') {
                        setEmailError('Please log out and log in again to change your email.');
                    } else {
                        setEmailError('Failed to update email: ' + (err.message || err));
                    }
                    return;
                }
            }
            // Only save editable fields
            const updatedData = {
                ...userData,
                email: userData.email,
                belt: userData.belt
            };

            // Use service
            await userService.updateUserProfile(user.uid, updatedData);

            setIsEditing(false);
        } catch (error) {
            setEmailError('Error saving user data: ' + (error.message || error));
        }
    };

    const handleSendVerification = async () => {
        setEmailError('');
        try {
            const user = auth.currentUser;
            if (!user) return;
            await updateEmail(user, pendingEmail);
            await sendEmailVerification(user);
            setShowVerificationSent(true);
        } catch (err) {
            setEmailError('Failed to send verification: ' + (err.message || err));
        }
    };

    const handleCheckVerified = async () => {
        try {
            const user = auth.currentUser;
            if (!user) return;
            await user.reload();
            if (user.emailVerified && pendingEmail) {
                await updateDoc(doc(db, 'users', user.uid), { email: pendingEmail, emailVerified: true });
                setUserData(prev => ({ ...prev, email: pendingEmail, emailVerified: true }));
                setEmailStatus('verified');
                setShowVerificationSent(false);
                localStorage.removeItem('pendingEmail');
                setPendingEmail('');
            } else {
                setEmailError('Email not verified yet. Please check your inbox and click the verification link.');
            }
        } catch (err) {
            setEmailError('Failed to check verification: ' + (err.message || err));
        }
    };

    if (loading) {
        return <div className="container mt-4">Loading...</div>;
    }

    return (
        <div className="container-fluid px-3 py-4">
            <div className="card">
                <div className="card-header d-flex justify-content-between align-items-center">
                    <h2 className="mb-0">Profile</h2>
                    {!isEditing && (
                        <button
                            className="btn btn-primary"
                            onClick={() => setIsEditing(true)}
                        >
                            Edit Profile
                        </button>
                    )}
                </div>
                <div className="card-body">
                    <div className="mb-3">
                        <label className="form-label">Full Name</label>
                        <input
                            type="text"
                            className="form-control"
                            value={userData.fullName}
                            onChange={(e) => setUserData({ ...userData, fullName: e.target.value })}
                            disabled={!isEditing}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Address</label>
                        <input
                            type="text"
                            className="form-control"
                            value={userData.address}
                            onChange={(e) => setUserData({ ...userData, address: e.target.value })}
                            disabled={!isEditing}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Contact Number</label>
                        <input
                            type="tel"
                            className="form-control"
                            value={userData.contactNumber}
                            onChange={(e) => setUserData({ ...userData, contactNumber: e.target.value })}
                            disabled={!isEditing}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Date of Birth</label>
                        <input
                            type="date"
                            className="form-control"
                            value={userData.dateOfBirth}
                            onChange={(e) => setUserData({ ...userData, dateOfBirth: e.target.value })}
                            disabled={!isEditing}
                        />
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Email</label>
                        {isEditing ? (
                            <input
                                type="email"
                                className="form-control"
                                value={emailEdit}
                                onChange={e => setEmailEdit(e.target.value)}
                            />
                        ) : (
                            <input
                                type="email"
                                className="form-control"
                                value={userData.email}
                                disabled
                            />
                        )}
                        {emailError && <div className="text-danger mt-1">{emailError}</div>}
                    </div>
                    <div className="mb-3">
                        <label className="form-label">Belt</label>
                        {isEditing ? (
                            <select
                                className="form-select"
                                value={userData.belt}
                                onChange={e => setUserData({ ...userData, belt: e.target.value })}
                            >
                                <option value="">Select Belt</option>
                                {BELT_OPTIONS.map(belt => (
                                    <option key={belt} value={belt}>{belt}</option>
                                ))}
                            </select>
                        ) : (
                            <input
                                type="text"
                                className="form-control"
                                value={userData.belt}
                                disabled
                            />
                        )}
                    </div>
                    {isEditing && (
                        <div className="d-flex gap-2">
                            <button
                                className="btn btn-primary"
                                onClick={handleSave}
                            >
                                Save Changes
                            </button>
                            <button
                                className="btn btn-secondary"
                                onClick={() => setIsEditing(false)}
                            >
                                Cancel
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
} 