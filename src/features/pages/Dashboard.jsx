import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import Students from '../students/Students';
import Attendance from '../attendance/Attendance';
import AttendanceRecords from '../attendance/AttendanceRecords';
import { FaUsers, FaClipboardCheck, FaRegListAlt, FaArrowLeft, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { Modal, Button } from 'react-bootstrap';

export default function Dashboard() {
    const { logout, userBranch, userRole } = useAuth();
    const [activeSection, setActiveSection] = useState(null);
    const [showLogoutModal, setShowLogoutModal] = useState(false);
    const navigate = useNavigate();

    const handleLogout = async () => {
        setShowLogoutModal(true);
    };

    const confirmLogout = async () => {
        setShowLogoutModal(false);
        await logout();
        navigate('/login');
    };

    const mainOptions = [
        {
            key: 'students',
            title: 'Students',
            icon: <FaUsers size={36} className="mb-2" />,
        },
        {
            key: 'attendance',
            title: 'Mark Attendance',
            icon: <FaClipboardCheck size={36} className="mb-2" />,
        },
        {
            key: 'records',
            title: 'Attendance Record',
            icon: <FaRegListAlt size={36} className="mb-2" />,
        },
        {
            key: 'logout',
            title: 'Logout',
            icon: <FaSignOutAlt size={36} className="mb-2 text-danger" />,
            onClick: handleLogout,
            logout: true,
        },
    ];

    return (
        <div className="min-vh-100 bg-light">
            {/* Branding Header */}
            <div className="container py-4 d-flex flex-column align-items-center">
                <img src="/logo.png" alt="Logo" className="mb-2" style={{ width: 60, height: 60 }} />
                <h2 className="mt-2 mb-4 fw-bold text-dark" style={{ letterSpacing: 1 }}>GAMA Instructor Portal</h2>
            </div>
            <div className="container" style={{ maxWidth: 500 }}>
                {!activeSection ? (
                    <div className="d-flex flex-column gap-4">
                        {mainOptions.map(option => (
                            <div
                                key={option.key}
                                style={{ cursor: 'pointer', minHeight: 140 }}
                                className={`card text-center shadow-sm dashboard-card clickable ${option.logout ? 'logout-tile border-danger bg-light' : 'border border-secondary bg-white'}`}
                                onClick={() => option.key === 'logout' ? option.onClick() : setActiveSection(option.key)}
                            >
                                <div className="card-body d-flex flex-column justify-content-center align-items-center">
                                    {option.icon}
                                    <h4 className={`mt-2 fw-semibold ${option.logout ? 'text-danger' : 'text-dark'}`}>{option.title}</h4>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="container" style={{ maxWidth: 600 }}>
                        <button className="btn btn-link mb-3 px-0 d-flex align-items-center gap-2" onClick={() => setActiveSection(null)}>
                            <FaArrowLeft /> Back to Dashboard
                        </button>
                        {activeSection === 'students' && <Students branchFilter={userBranch} role={userRole} />}
                        {activeSection === 'attendance' && <Attendance branchFilter={userBranch} role={userRole} />}
                        {activeSection === 'records' && <AttendanceRecords branchFilter={userBranch} role={userRole} />}
                    </div>
                )}
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