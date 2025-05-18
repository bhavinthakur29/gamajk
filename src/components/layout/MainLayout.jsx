import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { FaUserCircle, FaSignOutAlt } from 'react-icons/fa';
import { Modal, Button, Navbar, Nav, Dropdown } from 'react-bootstrap';
import '../../features/pages/Dashboard.css';

const MainLayout = () => {
    const { logout, userBranch, userRole, currentUser } = useAuth();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const [expanded, setExpanded] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Hide the default top navbar when this component mounts
        document.body.classList.add('hide-default-navbar');

        // Clean up when unmounting
        return () => {
            document.body.classList.remove('hide-default-navbar');
        };
    }, []);

    const handleLogout = async () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = async () => {
        setShowLogoutModal(false);
        await logout();
        navigate('/login');
    };

    const isActive = (path) => {
        return location.pathname.startsWith(path);
    };

    return (
        <>
            {/* Full-width navbar outside of any container */}
            <Navbar
                expand="lg"
                className="instructor-navbar shadow-sm w-100"
                expanded={expanded}
                onToggle={(expanded) => setExpanded(expanded)}
                style={{ width: '100vw', left: 0, right: 0, position: 'sticky', top: 0, zIndex: 1000 }}
            >
                <div className="nav-container w-100">
                    <Navbar.Brand onClick={() => navigate('/dashboard')} className="d-flex align-items-center" style={{ cursor: 'pointer' }}>
                        <img
                            src="/logo.png"
                            alt="GAMA Logo"
                            className="navbar-logo me-2"
                            onError={(e) => e.target.src = "https://via.placeholder.com/40"}
                        />
                        <span className="brand-text">GAMA</span>
                    </Navbar.Brand>

                    <Navbar.Toggle
                        aria-controls="instructor-navbar-nav"
                        className="custom-toggler"
                    />

                    <Navbar.Collapse id="instructor-navbar-nav">
                        <Nav className="me-auto flex-column flex-lg-row w-100">
                            <Nav.Link
                                onClick={() => {
                                    navigate('/dashboard');
                                    setExpanded(false);
                                }}
                                active={location.pathname === '/dashboard'}
                                className="nav-link-custom"
                            >
                                Dashboard
                            </Nav.Link>
                            <Nav.Link
                                onClick={() => {
                                    navigate('/students');
                                    setExpanded(false);
                                }}
                                active={isActive('/student')}
                                className="nav-link-custom"
                            >
                                Students
                            </Nav.Link>
                            <Nav.Link
                                onClick={() => {
                                    navigate('/attendance');
                                    setExpanded(false);
                                }}
                                active={location.pathname === '/attendance'}
                                className="nav-link-custom"
                            >
                                Mark Attendance
                            </Nav.Link>
                            <Nav.Link
                                onClick={() => {
                                    navigate('/attendance-records');
                                    setExpanded(false);
                                }}
                                active={location.pathname === '/attendance-records'}
                                className="nav-link-custom"
                            >
                                Attendance Records
                            </Nav.Link>

                            <div className="d-lg-none w-100">
                                <hr className="dropdown-divider bg-white opacity-25 my-2" />
                                <div className="mobile-user-info text-white text-center mb-2">
                                    <FaUserCircle size={30} className="mb-2" />
                                    <div>{currentUser?.email || 'Instructor'}</div>
                                    <small className="d-block text-white-50 mb-2">Branch: {userBranch || 'All'}</small>
                                    <Button
                                        variant="outline-light"
                                        size="sm"
                                        className="w-100 mt-2"
                                        onClick={handleLogout}
                                    >
                                        <FaSignOutAlt className="me-2" /> Logout
                                    </Button>
                                </div>
                            </div>
                        </Nav>

                        <Dropdown align="end" className="d-none d-lg-block">
                            <Dropdown.Toggle variant="transparent" id="user-dropdown" className="user-dropdown-toggle">
                                <FaUserCircle size={24} className="text-white me-2" />
                                <span className="d-none d-md-inline text-white">
                                    {currentUser?.email || 'Instructor'}
                                </span>
                            </Dropdown.Toggle>

                            <Dropdown.Menu className="dropdown-menu-end shadow">
                                <Dropdown.Item className="text-muted">
                                    <small>Branch: {userBranch || 'All'}</small>
                                </Dropdown.Item>
                                <Dropdown.Divider />
                                <Dropdown.Item onClick={handleLogout} className="text-danger">
                                    <FaSignOutAlt className="me-2" /> Logout
                                </Dropdown.Item>
                            </Dropdown.Menu>
                        </Dropdown>
                    </Navbar.Collapse>
                </div>
            </Navbar>

            {/* Content area */}
            <div className="dashboard-wrapper">
                <div className="dashboard-container">
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
        </>
    );
};

export default MainLayout; 