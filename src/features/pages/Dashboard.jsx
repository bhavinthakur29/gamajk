import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaClipboardCheck, FaRegListAlt } from 'react-icons/fa';
import { Container, Row, Col, Card } from 'react-bootstrap';
import './Dashboard.css';

export default function Dashboard() {
    const navigate = useNavigate();

    const cardStyles = {
        blue: {
            background: 'linear-gradient(135deg, #3498db, #2980b9)',
            color: 'white',
            borderRadius: '15px',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
        },
        green: {
            background: 'linear-gradient(135deg, #27ae60, #2ecc71)',
            color: 'white',
            borderRadius: '15px',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
        },
        orange: {
            background: 'linear-gradient(135deg, #f39c12, #f1c40f)',
            color: 'white',
            borderRadius: '15px',
            boxShadow: '0 5px 15px rgba(0, 0, 0, 0.1)',
            transition: 'all 0.3s ease',
            cursor: 'pointer'
        }
    };

    const mainOptions = [
        {
            key: 'students',
            title: 'Students',
            description: 'View and manage student profiles',
            icon: <FaUsers size={36} style={{ color: 'white' }} />,
            path: '/students',
            style: cardStyles.blue
        },
        {
            key: 'attendance',
            title: 'Mark Attendance',
            description: 'Record daily attendance',
            icon: <FaClipboardCheck size={36} style={{ color: 'white' }} />,
            path: '/attendance',
            style: cardStyles.green
        },
        {
            key: 'records',
            title: 'Attendance Records',
            description: 'View historical attendance data',
            icon: <FaRegListAlt size={36} style={{ color: 'white' }} />,
            path: '/attendance-records',
            style: cardStyles.orange
        }
    ];

    return (
        <Container className="py-5">
            <div className="dashboard-welcome mb-4">
                <h3 className="dashboard-title">Instructor Dashboard</h3>
                <p className="dashboard-subtitle">Welcome to your student management portal</p>
            </div>

            <Row className="g-4 justify-content-center">
                {mainOptions.map(option => (
                    <Col key={option.key} xs={12} sm={6} md={4}>
                        <Card
                            className="dashboard-card h-100"
                            style={option.style}
                            onClick={() => navigate(option.path)}
                        >
                            <Card.Body className="d-flex flex-column justify-content-center align-items-center text-center p-4">
                                <div className="icon-container mb-3" style={{
                                    background: 'rgba(255, 255, 255, 0.2)',
                                    borderRadius: '50%',
                                    width: '80px',
                                    height: '80px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                }}>
                                    {option.icon}
                                </div>
                                <h4 className="card-title mb-2" style={{ color: 'white', fontWeight: '600', fontSize: '1.4rem' }}>
                                    {option.title}
                                </h4>
                                <p className="card-description" style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.95rem' }}>
                                    {option.description}
                                </p>
                            </Card.Body>
                        </Card>
                    </Col>
                ))}
            </Row>
        </Container>
    );
} 