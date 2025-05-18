import React from 'react';
import { useNavigate } from 'react-router-dom';
import { FaUsers, FaClipboardCheck, FaRegListAlt } from 'react-icons/fa';
import { Container, Row, Col, Card } from 'react-bootstrap';
import './Dashboard.css';

export default function Dashboard() {
    const navigate = useNavigate();

    const mainOptions = [
        {
            key: 'students',
            title: 'Students',
            description: 'View and manage student profiles',
            icon: <FaUsers size={36} className="mb-2" />,
            path: '/students'
        },
        {
            key: 'attendance',
            title: 'Mark Attendance',
            description: 'Record daily attendance',
            icon: <FaClipboardCheck size={36} className="mb-2" />,
            path: '/attendance'
        },
        {
            key: 'records',
            title: 'Attendance Records',
            description: 'View historical attendance data',
            icon: <FaRegListAlt size={36} className="mb-2" />,
            path: '/attendance-records'
        }
    ];

    return (
        <Container className="py-5">
            <div className="dashboard-welcome mb-4">
                <h3 className="dashboard-title">Instructor Dashboard</h3>
                <p className="dashboard-subtitle">Welcome to GAMA Martial Arts School management portal</p>
            </div>

            <Row className="g-4 justify-content-center">
                {mainOptions.map(option => (
                    <Col key={option.key} xs={12} sm={6} md={4}>
                        <Card
                            className="dashboard-card h-100"
                            onClick={() => navigate(option.path)}
                        >
                            <Card.Body className="d-flex flex-column justify-content-center align-items-center text-center p-4">
                                <div className="icon-container mb-3">
                                    {option.icon}
                                </div>
                                <h4 className="card-title mb-2">
                                    {option.title}
                                </h4>
                                <p className="card-description text-muted mb-0">
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