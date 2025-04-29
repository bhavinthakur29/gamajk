import { useState, useEffect } from 'react';
import { collection, getDocs, setDoc, doc, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../../firebase';
import { Card, Button, Form, Alert, Table, InputGroup, Row, Col } from 'react-bootstrap';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { FaHome, FaUsers, FaUserTie, FaSitemap, FaBars, FaClipboardList, FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import { Container, Nav, Offcanvas, Modal } from 'react-bootstrap';

const BELT_OPTIONS = [
    'White', 'Yellow', 'Yellow Stripe', 'Green', 'Green Stripe', 'Blue', 'Blue Stripe', 'Red', 'Red Stripe', 'Black Stripe', 'Black 1', 'Black 2', 'Black 3'
];
const BATCH_OPTIONS = [1, 2, 3];

export default function AdminLayout() {
    const location = useLocation();
    const [showSidebar, setShowSidebar] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
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

    const navLinks = [
        { to: '/admin', label: 'Dashboard', icon: <FaHome /> },
        { to: '/admin/branches', label: 'Branches', icon: <FaSitemap /> },
        { to: '/admin/instructors', label: 'Instructors', icon: <FaUserTie /> },
        { to: '/admin/students', label: 'Students', icon: <FaUsers /> },
        { to: '/admin/attendance-records', label: 'Attendance Records', icon: <FaClipboardList /> },
        { to: '/admin/profile', label: 'Profile', icon: <FaUserCircle /> }
    ];

    const handleLogout = () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = () => {
        setShowLogoutModal(false);
        window.location.href = '/login';
    };

    const SidebarContent = (
        <>
            <div className="d-flex flex-column align-items-center mb-4">
                <img src="/logo.png" alt="Logo" className="rounded-circle shadow-sm" style={{ width: 80, height: 80, objectFit: 'cover' }} />
            </div>
            <div className="mb-4 text-center fw-bold fs-4">Admin Panel</div>
            <Nav className="flex-column gap-1 px-2">
                {navLinks.map(link => (
                    <Nav.Item key={link.to}>
                        <Link
                            to={link.to}
                            className={`nav-link py-2 px-3 rounded-2 d-flex align-items-center gap-2 fw-medium fs-6${link.to !== '/admin' && location.pathname.startsWith(link.to) ? ' active bg-secondary' : ' text-white'}`}
                            onClick={() => setShowSidebar(false)}
                        >
                            {link.icon} {link.label}
                        </Link>
                    </Nav.Item>
                ))}
            </Nav>
            <div className="mt-auto px-3 pt-4">
                <Button
                    variant="outline-light"
                    className="w-100 d-flex align-items-center justify-content-center gap-2 rounded-2 fw-medium fs-6 border border-white mt-4"
                    onClick={handleLogout}
                >
                    <FaSignOutAlt /> Logout
                </Button>
            </div>
        </>
    );

    return (
        <div className="d-flex min-vh-100">
            {/* Sidebar for desktop */}
            <aside
                className="d-none d-md-flex flex-column bg-dark text-white position-fixed top-0 start-0 bottom-0 shadow-sm"
                style={{ width: 240, padding: '2rem 0', zIndex: 1000 }}
            >
                {SidebarContent}
            </aside>
            {/* Offcanvas sidebar for mobile */}
            <Offcanvas show={showSidebar} onHide={() => setShowSidebar(false)} className="d-md-none bg-dark text-white" style={{ width: 240 }}>
                <Offcanvas.Header closeButton closeVariant="white">
                    <Offcanvas.Title className="text-white">Admin Panel</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body className="d-flex flex-column h-100">
                    {SidebarContent}
                </Offcanvas.Body>
            </Offcanvas>
            {/* Main content */}
            <div className="flex-grow-1 bg-light min-vh-100" style={{ marginLeft: 0 }}>
                {/* Mobile menu button */}
                <div className="d-md-none p-2">
                    <Button variant="outline-dark" onClick={() => setShowSidebar(true)}>
                        <FaBars />
                    </Button>
                </div>
                <div className="container-fluid px-3 py-4" style={{ marginLeft: 'auto', maxWidth: '100%' }}>
                    <Outlet />
                </div>
            </div>
            {/* Logout Confirmation Modal */}
            <Modal show={showLogoutModal} onHide={() => setShowLogoutModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Logout</Modal.Title>
                </Modal.Header>
                <Modal.Body>Are you sure you want to logout?</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowLogoutModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={confirmLogout}>
                        Logout
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
