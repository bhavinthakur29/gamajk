import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './ResponsiveNav.css';

const ResponsiveNav = ({ user, onLogout }) => {
    const [menuOpen, setMenuOpen] = useState(false);

    return (
        <nav className="app-nav">
            <div className="nav-container">
                <Link to="/" className="nav-logo">GAMA</Link>

                <button className="nav-toggle" onClick={() => setMenuOpen(!menuOpen)}>
                    <span className="toggle-icon"></span>
                </button>

                <div className={`nav-menu ${menuOpen ? 'active' : ''}`}>
                    <Link to="/dashboard" className="nav-link" onClick={() => setMenuOpen(false)}>Dashboard</Link>

                    {user && user.role === 'admin' && (
                        <>
                            <Link to="/admin/instructors" className="nav-link" onClick={() => setMenuOpen(false)}>Instructors</Link>
                            <Link to="/admin/students" className="nav-link" onClick={() => setMenuOpen(false)}>Students</Link>
                        </>
                    )}

                    {user && (
                        <>
                            <Link to="/attendance" className="nav-link" onClick={() => setMenuOpen(false)}>Attendance</Link>
                            <Link to="/profile" className="nav-link" onClick={() => setMenuOpen(false)}>Profile</Link>
                            <button className="nav-logout" onClick={() => { onLogout(); setMenuOpen(false); }}>
                                Logout
                            </button>
                        </>
                    )}
                </div>
            </div>
        </nav>
    );
};

export default ResponsiveNav; 