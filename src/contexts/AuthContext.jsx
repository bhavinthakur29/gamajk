import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import {
    signInWithEmailAndPassword,
    signOut,
    createUserWithEmailAndPassword,
    sendPasswordResetEmail
} from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs, query, where, limit } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

// Password strength validation
export function validatePassword(password) {
    const errors = [];

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long');
    }

    if (!/[A-Z]/.test(password)) {
        errors.push('Password must include at least one uppercase letter');
    }

    if (!/[a-z]/.test(password)) {
        errors.push('Password must include at least one lowercase letter');
    }

    if (!/[0-9]/.test(password)) {
        errors.push('Password must include at least one number');
    }

    if (!/[^A-Za-z0-9]/.test(password)) {
        errors.push('Password must include at least one special character');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [userBranch, setUserBranch] = useState(null);
    const [loading, setLoading] = useState(true);
    const [authError, setAuthError] = useState(null);

    async function login(email, password, expectedRole) {
        setAuthError(null);
        try {
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            const userDoc = await getDoc(doc(db, 'users', user.uid));

            if (!userDoc.exists()) {
                throw new Error('User profile not found. Please contact an administrator.');
            }

            const { role, branch } = userDoc.data();

            if (role !== expectedRole) {
                throw new Error(`Access denied. You're trying to login as a ${expectedRole} but your account is registered as a ${role}.`);
            }

            setUserRole(role);
            setUserBranch(branch);
            setCurrentUser(user);
            return user;
        } catch (error) {
            let errorMessage = 'Authentication failed';

            switch (error.code) {
                case 'auth/invalid-credential':
                    errorMessage = 'Invalid email or password. Please try again.';
                    break;
                case 'auth/user-disabled':
                    errorMessage = 'This account has been disabled. Please contact an administrator.';
                    break;
                case 'auth/user-not-found':
                    errorMessage = 'No account found with this email address.';
                    break;
                case 'auth/wrong-password':
                    errorMessage = 'Incorrect password. Please try again.';
                    break;
                case 'auth/too-many-requests':
                    errorMessage = 'Too many failed login attempts. Please try again later or reset your password.';
                    break;
                default:
                    if (error.message) {
                        errorMessage = error.message;
                    }
            }

            setAuthError(errorMessage);
            throw new Error(errorMessage);
        }
    }

    async function signupAdmin(email, password, fullName) {
        setAuthError(null);

        // Validate password strength
        const { isValid, errors } = validatePassword(password);
        if (!isValid) {
            const errorMessage = errors.join('. ');
            setAuthError(errorMessage);
            throw new Error(errorMessage);
        }

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            await setDoc(doc(db, 'users', user.uid), {
                email,
                role: 'admin',
                fullName: fullName || '',
                branch: 'HQ',
                belt: '',
                address: '',
                contactNumber: '',
                dateOfBirth: ''
            });
            setUserRole('admin');
            setUserBranch('HQ');
            setCurrentUser(user);
            return user;
        } catch (error) {
            let errorMessage = 'Failed to create account';

            switch (error.code) {
                case 'auth/email-already-in-use':
                    errorMessage = 'An account with this email already exists.';
                    break;
                case 'auth/invalid-email':
                    errorMessage = 'Please provide a valid email address.';
                    break;
                case 'auth/operation-not-allowed':
                    errorMessage = 'Account creation is disabled. Please contact an administrator.';
                    break;
                case 'auth/weak-password':
                    errorMessage = 'Password is too weak. Please choose a stronger password.';
                    break;
                default:
                    if (error.message) {
                        errorMessage = error.message;
                    }
            }

            setAuthError(errorMessage);
            throw new Error(errorMessage);
        }
    }

    async function resetPassword(email) {
        setAuthError(null);
        try {
            // First check if the user exists
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', email), limit(1));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                throw new Error('No account found with this email address.');
            }

            // Send password reset email
            await sendPasswordResetEmail(auth, email);
            return true;
        } catch (error) {
            let errorMessage = 'Failed to send password reset email';

            switch (error.code) {
                case 'auth/invalid-email':
                    errorMessage = 'Please provide a valid email address.';
                    break;
                case 'auth/user-not-found':
                    errorMessage = 'No account found with this email address.';
                    break;
                default:
                    if (error.message) {
                        errorMessage = error.message;
                    }
            }

            setAuthError(errorMessage);
            throw new Error(errorMessage);
        }
    }

    async function logout() {
        setAuthError(null);
        try {
            setCurrentUser(null);
            setUserRole(null);
            setUserBranch(null);
            return await signOut(auth);
        } catch (error) {
            const errorMessage = error.message || 'Failed to log out';
            setAuthError(errorMessage);
            throw new Error(errorMessage);
        }
    }

    // Check if user has phone verification enabled
    async function hasPhoneVerification(email) {
        try {
            const usersRef = collection(db, 'users');
            const q = query(usersRef, where('email', '==', email), limit(1));
            const snapshot = await getDocs(q);

            if (snapshot.empty) {
                return { hasPhone: false, phoneNumber: null };
            }

            const userData = snapshot.docs[0].data();
            return {
                hasPhone: !!userData.isPhoneVerified,
                phoneNumber: userData.phoneNumber || null
            };
        } catch (error) {
            console.error("Error checking phone verification:", error);
            return { hasPhone: false, phoneNumber: null };
        }
    }

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                try {
                    const userDoc = await getDoc(doc(db, 'users', user.uid));
                    if (userDoc.exists()) {
                        setUserRole(userDoc.data().role);
                        setUserBranch(userDoc.data().branch);
                    } else {
                        // User exists in Auth but not in Firestore
                        console.warn('User exists in Auth but not in Firestore:', user.uid);
                    }
                    setCurrentUser(user);
                } catch (error) {
                    console.error('Error fetching user data:', error);
                    // Still set the user so they're not stuck in a loading state
                    setCurrentUser(user);
                }
            } else {
                setCurrentUser(null);
                setUserRole(null);
                setUserBranch(null);
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const value = {
        currentUser,
        userRole,
        userBranch,
        login,
        signupAdmin,
        logout,
        resetPassword,
        hasPhoneVerification,
        authError
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
} 