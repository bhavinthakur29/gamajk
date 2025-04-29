import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Modal } from 'react-bootstrap';
import { FaSignOutAlt } from 'react-icons/fa';
import { auth } from '../../firebase';
import { signOut } from 'firebase/auth';

export default function LogoutButton() {
    const [showModal, setShowModal] = useState(false);
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await signOut(auth);
            navigate('/login');
        } catch (error) {
            console.error('Error during logout:', error);
            await signOut(auth);
            navigate('/login');
        }
    };

    return (
        <>
            <Button
                variant="link"
                className="position-absolute top-0 end-0 m-3"
                onClick={() => setShowModal(true)}
            >
                <FaSignOutAlt className="me-2" />
                Logout
            </Button>

            <Modal show={showModal} onHide={() => setShowModal(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Logout</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to logout?
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Cancel
                    </Button>
                    <Button variant="primary" onClick={handleLogout}>
                        Logout
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
} 