import { useState, useEffect } from 'react';
import { collection, getDocs, setDoc, doc, updateDoc } from 'firebase/firestore';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { db, auth } from '../../firebase';
import { Card, Button, Form, Alert, Table, InputGroup, Row, Col } from 'react-bootstrap';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { FaHome, FaUsers, FaUserTie, FaSitemap, FaBars, FaClipboardList, FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import { Container, Nav, Offcanvas, Modal } from 'react-bootstrap';
import { useAuth } from '../../contexts/AuthContext';
import './AdminLayout.css';

const BELT_OPTIONS = [
    'White', 'Yellow', 'Yellow Stripe', 'Green', 'Green Stripe', 'Blue', 'Blue Stripe', 'Red', 'Red Stripe', 'Black Stripe', 'Black 1', 'Black 2', 'Black 3'
];
const BATCH_OPTIONS = [1, 2, 3];

export default function AdminLayout() {
    const location = useLocation();
    const navigate = useNavigate();
    const [showSidebar, setShowSidebar] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const { logout } = useAuth();
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
    const [logoutLoading, setLogoutLoading] = useState(false);

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

    const confirmLogout = async () => {
        setLogoutLoading(true);
        try {
            await logout();
            setShowLogoutModal(false);
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
            setError('Failed to logout. Please try again.');
        } finally {
            setLogoutLoading(false);
        }
    };

    const isActive = (path) => {
        if (path === '/admin') {
            return location.pathname === '/admin';
        }
        return location.pathname.startsWith(path);
    };

    const SidebarContent = (
        <>
            <div className="sidebar-header">
                <div className="logo-container">
                    <img src="/logo.png" alt="GAMA Logo" className="sidebar-logo" onError={(e) => e.target.src = "https://via.placeholder.com/80"} />
                    <h5 className="sidebar-title">GAMA Admin</h5>
                </div>
            </div>

            <Nav className="sidebar-nav">
                {navLinks.map(link => (
                    <Nav.Item key={link.to} className="sidebar-nav-item">
                        <Link
                            to={link.to}
                            className={`sidebar-nav-link ${isActive(link.to) ? 'active' : ''}`}
                            onClick={() => setShowSidebar(false)}
                        >
                            <span className="sidebar-icon">{link.icon}</span>
                            <span className="sidebar-label">{link.label}</span>
                        </Link>
                    </Nav.Item>
                ))}
            </Nav>

            <div className="sidebar-footer">
                <Button
                    variant="outline-light"
                    className="logout-button"
                    onClick={handleLogout}
                >
                    <FaSignOutAlt /> <span>Logout</span>
                </Button>
            </div>
        </>
    );

    return (
        <div className="admin-layout">
            {/* Desktop Sidebar */}
            <aside className="desktop-sidebar">
                {SidebarContent}
            </aside>

            {/* Mobile Sidebar (Offcanvas) */}
            <Offcanvas
                show={showSidebar}
                onHide={() => setShowSidebar(false)}
                placement="start"
                className="mobile-sidebar"
            >
                <Offcanvas.Header closeButton closeVariant="white">
                    <Offcanvas.Title className="text-white">Menu</Offcanvas.Title>
                </Offcanvas.Header>
                <Offcanvas.Body>
                    {SidebarContent}
                </Offcanvas.Body>
            </Offcanvas>

            {/* Main Content Area */}
            <main className="main-content">
                <div className="mobile-header">
                    <Button
                        variant="link"
                        className="menu-toggle-button"
                        onClick={() => setShowSidebar(true)}
                    >
                        <FaBars size={24} />
                    </Button>
                    <h5 className="mobile-title">GAMA Admin</h5>
                </div>

                <Container fluid className="content-container">
                    {error && <Alert variant="danger" className="mt-3" onClose={() => setError('')} dismissible>{error}</Alert>}
                    <Outlet />
                </Container>
            </main>

            {/* Logout Confirmation Modal */}
            <Modal show={showLogoutModal} onHide={() => !logoutLoading && setShowLogoutModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Logout</Modal.Title>
                </Modal.Header>
                <Modal.Body>Are you sure you want to logout?</Modal.Body>
                <Modal.Footer>
                    <Button
                        variant="secondary"
                        onClick={() => setShowLogoutModal(false)}
                        disabled={logoutLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="danger"
                        onClick={confirmLogout}
                        disabled={logoutLoading}
                    >
                        {logoutLoading ? 'Logging out...' : 'Logout'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
