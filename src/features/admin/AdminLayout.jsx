import { Link, Outlet, useLocation } from 'react-router-dom';
import { FaHome, FaUsers, FaUserTie, FaSitemap, FaBars, FaClipboardList, FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import { Container, Nav, Offcanvas, Button, Modal } from 'react-bootstrap';
import { useState } from 'react';
import '../../styles/admin-layout.css';

export default function AdminLayout() {
    const location = useLocation();
    const [showSidebar, setShowSidebar] = useState(false);
    const [showLogoutModal, setShowLogoutModal] = useState(false);

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
                <div className="container-fluid px-3 py-4">
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