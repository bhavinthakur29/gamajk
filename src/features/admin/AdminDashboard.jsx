import { Card, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaSitemap, FaUserTie, FaUsers, FaClipboardList, FaUserCircle } from 'react-icons/fa';

export default function AdminDashboard() {
    const adminActions = [
        { to: '/admin/branches', label: 'Manage Branches', icon: <FaSitemap size={24} />, color: 'primary' },
        { to: '/admin/instructors', label: 'Manage Instructors', icon: <FaUserTie size={24} />, color: 'success' },
        { to: '/admin/students', label: 'Manage Students', icon: <FaUsers size={24} />, color: 'info' },
        { to: '/admin/attendance-records', label: 'Attendance Records', icon: <FaClipboardList size={24} />, color: 'warning' },
        { to: '/admin/profile', label: 'Admin Profile', icon: <FaUserCircle size={24} />, color: 'secondary' }
    ];

    return (
        <div className="admin-dashboard">


            <Row className="g-3">
                {adminActions.map((action, index) => (
                    <Col xs={12} sm={6} md={4} key={index}>
                        <Link to={action.to} className="text-decoration-none">
                            <Card className="h-100 shadow-sm action-card border-0">
                                <Card.Body className={`d-flex flex-column align-items-center text-center p-4 bg-${action.color} bg-opacity-10`}>
                                    <div className={`icon-wrapper text-${action.color} mb-3`}>
                                        {action.icon}
                                    </div>
                                    <h5 className="mb-0">{action.label}</h5>
                                </Card.Body>
                            </Card>
                        </Link>
                    </Col>
                ))}
            </Row>

            <style jsx>{`
                .action-card {
                    transition: transform 0.2s, box-shadow 0.2s;
                }
                .action-card:hover {
                    transform: translateY(-5px);
                    box-shadow: 0 10px 20px rgba(0,0,0,0.1) !important;
                }
                .icon-wrapper {
                    padding: 16px;
                    border-radius: 50%;
                    background-color: white;
                    box-shadow: 0 4px 10px rgba(0,0,0,0.1);
                    margin-bottom: 15px;
                }
            `}</style>
        </div>
    );
} 