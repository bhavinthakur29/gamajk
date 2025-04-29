import { Card, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaSitemap, FaUserTie, FaUsers } from 'react-icons/fa';

export default function AdminDashboard() {
    return (
        <Card>
            <Card.Body>
                <h2>Welcome to the Admin Dashboard</h2>
                <p className="mb-4">Use the sidebar to manage branches, instructors, and students.</p>
                <div className="d-flex gap-3">
                    <Link to="/admin/branches" className="btn btn-outline-primary">
                        <FaSitemap className="me-2" />Manage Branches
                    </Link>
                    <Link to="/admin/instructors" className="btn btn-outline-success">
                        <FaUserTie className="me-2" />Manage Instructors
                    </Link>
                    <Link to="/admin/students" className="btn btn-outline-info">
                        <FaUsers className="me-2" />Manage Students
                    </Link>
                </div>
            </Card.Body>
        </Card>
    );
} 