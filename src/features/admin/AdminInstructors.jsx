import { useState, useEffect } from 'react';
import { collection, getDocs, setDoc, doc, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../../firebase';
import { Card, Button, Form, Alert, Table, InputGroup } from 'react-bootstrap';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import AdminBranches from './AdminBranches';

const BELT_OPTIONS = [
    'White', 'Yellow', 'Yellow Stripe', 'Green', 'Green Stripe', 'Blue', 'Blue Stripe', 'Red', 'Red Stripe', 'Black Stripe', 'Black 1', 'Black 2', 'Black 3'
];
const BATCH_OPTIONS = [1, 2, 3];

export default function AdminInstructors() {
    const [instructors, setInstructors] = useState([]);
    const [branches, setBranches] = useState([]);
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
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [editRowId, setEditRowId] = useState(null);
    const [editRowData, setEditRowData] = useState({});
    const [editError, setEditError] = useState('');
    const [editLoading, setEditLoading] = useState(false);

    const fetchData = async () => {
        const usersSnapshot = await getDocs(collection(db, 'users'));
        setInstructors(usersSnapshot.docs.filter(docSnap => docSnap.data().role === 'instructor').map(docSnap => ({ id: docSnap.id, ...docSnap.data() })));
        const branchSnapshot = await getDocs(collection(db, 'branches'));
        setBranches(branchSnapshot.docs.map(doc => doc.data().name));
    };

    useEffect(() => {
        fetchData();
    }, [success]);

    const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
    const handleAddInstructor = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        try {
            const userCredential = await createUserWithEmailAndPassword(auth, form.email, form.password);
            const user = userCredential.user;
            await setDoc(doc(db, 'users', user.uid), {
                email: form.email,
                role: 'instructor',
                fullName: form.fullName,
                branch: form.branch,
                belt: form.belt,
                address: form.address,
                contactNumber: form.contactNumber,
                dateOfBirth: form.dateOfBirth
            });
            setSuccess('Instructor created successfully!');
            setForm({ fullName: '', email: '', password: '', branch: '', belt: '', address: '', contactNumber: '', dateOfBirth: '' });
        } catch (err) {
            setError(err.message);
        }
    };

    const handleEditClick = (inst) => {
        setEditRowId(inst.id);
        setEditRowData({ ...inst });
        setEditError('');
    };

    const handleEditChange = (e) => {
        setEditRowData({ ...editRowData, [e.target.name]: e.target.value });
    };

    const handleEditCancel = () => {
        setEditRowId(null);
        setEditRowData({});
        setEditError('');
    };

    const handleEditSave = async () => {
        setEditLoading(true);
        setEditError('');
        try {
            const docRef = doc(db, 'users', editRowId);
            await updateDoc(docRef, {
                fullName: editRowData.fullName,
                email: editRowData.email,
                branch: editRowData.branch,
                belt: editRowData.belt,
                address: editRowData.address,
                contactNumber: editRowData.contactNumber,
                dateOfBirth: editRowData.dateOfBirth
            });
            setSuccess('Instructor updated successfully!');
            setEditRowId(null);
            setEditRowData({});
            await fetchData();
        } catch (err) {
            setEditError('Failed to update: ' + (err.message || err));
        } finally {
            setEditLoading(false);
        }
    };

    const handleDeleteInstructor = async (id) => {
        if (!window.confirm('Are you sure you want to delete this instructor? This action cannot be undone.')) return;
        // ...
    };

    return (
        <Card>
            <Card.Body>
                <h3>Instructors</h3>
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}
                <Form onSubmit={handleAddInstructor} className="mb-4">
                    <Form.Group className="mb-2">
                        <Form.Label>Full Name</Form.Label>
                        <Form.Control name="fullName" value={form.fullName} onChange={handleChange} required />
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Label>Email</Form.Label>
                        <Form.Control name="email" value={form.email} onChange={handleChange} required autoComplete="off" />
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Label>Password</Form.Label>
                        <InputGroup>
                            <Form.Control name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={handleChange} required autoComplete="new-password" />
                            <Button variant="outline-secondary" type="button" onClick={() => setShowPassword(v => !v)} tabIndex={-1} style={{ borderLeft: 0 }}>
                                {showPassword ? <FaEyeSlash /> : <FaEye />}
                            </Button>
                        </InputGroup>
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Label>Branch</Form.Label>
                        <Form.Select name="branch" value={form.branch} onChange={handleChange} required>
                            <option value="">Select Branch</option>
                            {branches.map(branch => (
                                <option key={branch} value={branch}>{branch}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Label>Belt</Form.Label>
                        <Form.Control name="belt" value={form.belt} onChange={handleChange} />
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Label>Address</Form.Label>
                        <Form.Control name="address" value={form.address} onChange={handleChange} />
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Label>Contact Number</Form.Label>
                        <Form.Control name="contactNumber" value={form.contactNumber} onChange={handleChange} />
                    </Form.Group>
                    <Form.Group className="mb-2">
                        <Form.Label>Date of Birth</Form.Label>
                        <Form.Control name="dateOfBirth" type="date" value={form.dateOfBirth} onChange={handleChange} />
                    </Form.Group>
                    <Button type="submit">Add Instructor</Button>
                </Form>
                <Table striped bordered hover size="sm">
                    <thead>
                        <tr>
                            <th>Full Name</th>
                            <th>Email</th>
                            <th>Branch</th>
                            <th>Belt</th>
                            <th>Address</th>
                            <th>Contact</th>
                            <th>Date of Birth</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {instructors.map(inst => (
                            <tr key={inst.id} className={editRowId === inst.id ? 'table-warning' : ''}>
                                {editRowId === inst.id ? (
                                    <>
                                        <td><Form.Control name="fullName" value={editRowData.fullName || ''} onChange={handleEditChange} size="sm" /></td>
                                        <td><Form.Control name="email" value={editRowData.email || ''} onChange={handleEditChange} size="sm" /></td>
                                        <td>
                                            <Form.Select name="branch" value={editRowData.branch || ''} onChange={handleEditChange} size="sm">
                                                <option value="">Select Branch</option>
                                                {branches.map(branch => (
                                                    <option key={branch} value={branch}>{branch}</option>
                                                ))}
                                            </Form.Select>
                                        </td>
                                        <td>
                                            <Form.Select name="belt" value={editRowData.belt || ''} onChange={handleEditChange} size="sm">
                                                <option value="">Select Belt</option>
                                                {BELT_OPTIONS.map(belt => (
                                                    <option key={belt} value={belt}>{belt}</option>
                                                ))}
                                            </Form.Select>
                                        </td>
                                        <td><Form.Control name="address" value={editRowData.address || ''} onChange={handleEditChange} size="sm" /></td>
                                        <td><Form.Control name="contactNumber" value={editRowData.contactNumber || ''} onChange={handleEditChange} size="sm" /></td>
                                        <td><Form.Control name="dateOfBirth" type="date" value={editRowData.dateOfBirth || ''} onChange={handleEditChange} size="sm" /></td>
                                        <td className="d-flex gap-2 align-items-center">
                                            <Button variant="success" size="sm" onClick={handleEditSave} disabled={editLoading}>{editLoading ? 'Saving...' : 'Save'}</Button>
                                            <Button variant="secondary" size="sm" onClick={handleEditCancel} disabled={editLoading}>Cancel</Button>
                                        </td>
                                    </>
                                ) : (
                                    <>
                                        <td>{inst.fullName}</td>
                                        <td>{inst.email}</td>
                                        <td>{inst.branch}</td>
                                        <td>{inst.belt}</td>
                                        <td>{inst.address}</td>
                                        <td>{inst.contactNumber}</td>
                                        <td>{inst.dateOfBirth}</td>
                                        <td>
                                            <Button variant="outline-primary" size="sm" onClick={() => handleEditClick(inst)}>Edit</Button>
                                            <Button variant="outline-danger" size="sm" onClick={() => handleDeleteInstructor(inst.id)}>Delete</Button>
                                        </td>
                                    </>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </Table>
                {editError && <Alert variant="danger" className="mt-2">{editError}</Alert>}
            </Card.Body>
        </Card>
    );
} 