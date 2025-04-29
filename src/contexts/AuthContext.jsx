import { createContext, useContext, useState, useEffect } from 'react';
import { auth, db } from '../firebase';
import { signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, collection, getDocs } from 'firebase/firestore';

const AuthContext = createContext();

export function useAuth() {
    return useContext(AuthContext);
}

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null);
    const [userRole, setUserRole] = useState(null);
    const [userBranch, setUserBranch] = useState(null);
    const [loading, setLoading] = useState(true);

    async function login(email, password, expectedRole) {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) throw new Error('User profile not found');
        const { role, branch } = userDoc.data();
        if (role !== expectedRole) throw new Error('Incorrect role for this login');
        setUserRole(role);
        setUserBranch(branch);
        setCurrentUser(user);
    }

    async function signupAdmin(email, password, fullName) {
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
    }

    async function logout() {
        setCurrentUser(null);
        setUserRole(null);
        setUserBranch(null);
        return signOut(auth);
    }

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                const userDoc = await getDoc(doc(db, 'users', user.uid));
                if (userDoc.exists()) {
                    setUserRole(userDoc.data().role);
                    setUserBranch(userDoc.data().branch);
                }
                setCurrentUser(user);
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
        logout
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
        </AuthContext.Provider>
    );
} 