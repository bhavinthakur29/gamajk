import { useState, useEffect } from 'react';
import { collection, getDocs, setDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword, deleteUser } from 'firebase/auth';
import { db, auth } from '../../firebase';
import { Card, Alert, Spinner } from 'react-bootstrap';
import InstructorForm from './components/InstructorForm';
import InstructorTable from './components/InstructorTable';
import { userService } from '../../services/firebaseService';

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
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            // Get instructors using the service
            const instructorsData = await userService.getInstructors(true);
            setInstructors(instructorsData);

            // Fetch branches
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

    const handleAddInstructor = async (formData) => {
        setError('');
        setSuccess('');
        setIsSubmitting(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            const user = userCredential.user;
            await setDoc(doc(db, 'users', user.uid), {
                email: formData.email,
                role: 'instructor',
                fullName: formData.fullName,
                branch: formData.branch,
                belt: formData.belt,
                address: formData.address,
                contactNumber: formData.contactNumber,
                dateOfBirth: formData.dateOfBirth,
                createdAt: new Date().toISOString()
            });
            setSuccess('Instructor created successfully!');
            await fetchData();
            return true;
        } catch (err) {
            setError(err.message);
            throw err;
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleEditSave = async (id, data) => {
        try {
            const docRef = doc(db, 'users', id);
            await updateDoc(docRef, {
                fullName: data.fullName,
                email: data.email,
                branch: data.branch,
                belt: data.belt,
                address: data.address,
                contactNumber: data.contactNumber,
                dateOfBirth: data.dateOfBirth,
                updatedAt: new Date().toISOString()
            });
            setSuccess('Instructor updated successfully!');
            await fetchData();
            return true;
        } catch (err) {
            setError('Failed to update: ' + (err.message || err));
            throw err;
        }
    };

    const handleDeleteInstructor = async (id) => {
        if (!window.confirm('Are you sure you want to delete this instructor? This action cannot be undone.')) return;

        try {
            setIsDeleting(true);
            await deleteDoc(doc(db, 'users', id));
            setSuccess('Instructor deleted successfully!');
            await fetchData();
        } catch (err) {
            setError('Failed to delete instructor: ' + err.message);
        } finally {
            setIsDeleting(false);
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

                <div className="mb-4">
                    <h5 className="mb-3">Add New Instructor</h5>
                    <InstructorForm
                        onSubmit={handleAddInstructor}
                        branches={branches}
                        isSubmitting={isSubmitting}
                        initialError={error}
                    />
                </div>

                <h5 className="mb-3 mt-5">Instructor List</h5>
                <InstructorTable
                    instructors={instructors}
                    branches={branches}
                    onSave={handleEditSave}
                    onDelete={handleDeleteInstructor}
                    isDeleting={isDeleting}
                />
            </Card.Body>
        </Card>
    );
} 
