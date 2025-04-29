import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

export default function Login() {
    const { login } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [activeTab, setActiveTab] = useState('instructor');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await login(email, password, activeTab);
            if (activeTab === 'admin') {
                navigate('/admin');
            } else {
                navigate('/dashboard');
            }
        } catch (err) {
            setError(err.message || 'Login failed');
        } finally {
            setLoading(false);
        }
    };

    const handleTabChange = (tab) => {
        setActiveTab(tab);
        setEmail('');
        setPassword('');
        setError('');
    };

    return (
        <div className="container mt-4" style={{ maxWidth: 400 }}>
            <h1 className="mb-4">Login</h1>
            <ul className="nav nav-tabs mb-3">
                <li className="nav-item">
                    <button className={`nav-link${activeTab === 'instructor' ? ' active' : ''}`} onClick={() => handleTabChange('instructor')} type="button">Instructor</button>
                </li>
                <li className="nav-item">
                    <button className={`nav-link${activeTab === 'admin' ? ' active' : ''}`} onClick={() => handleTabChange('admin')} type="button">Admin</button>
                </li>
            </ul>
            <form onSubmit={handleSubmit} className="d-flex flex-column gap-3">
                <input
                    type="email"
                    className="form-control"
                    placeholder="Email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    required
                />
                <input
                    type="password"
                    className="form-control"
                    placeholder="Password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    required
                />
                {error && <div className="alert alert-danger py-2">{error}</div>}
                <button type="submit" className="btn btn-primary w-100" disabled={loading}>
                    {loading ? 'Logging in...' : (activeTab === 'admin' ? 'Login as Admin' : 'Login as Instructor')}
                </button>
            </form>
        </div>
    );
} 