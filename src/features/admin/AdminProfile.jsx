import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import Profile from '../profile/Profile';
import TwoFactorAuth from './components/TwoFactorAuth';
import { useAuth } from '../../contexts/AuthContext';
import { USER_ROLES } from '../../utils/constants';

const AdminProfile = () => {
    const { userRole } = useAuth();
    const isAdmin = userRole === USER_ROLES.ADMIN;

    return (
        <Container fluid className="p-0">
            <h3 className="mb-4">Admin Profile</h3>

            <Row>
                <Col lg={7} className="mb-4">
                    <Profile />
                </Col>

                {isAdmin && (
                    <Col lg={5}>
                        <TwoFactorAuth />
                    </Col>
                )}
            </Row>
        </Container>
    );
};

export default AdminProfile; 