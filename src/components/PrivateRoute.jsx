import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

/**
 * Component for routes that require authentication
 * This component only checks if the user is logged in
 * For role-specific access, use AdminRoute or InstructorRoute
 */
export default function PrivateRoute({ children }) {
    const { currentUser } = useAuth();

    return currentUser ? children : <Navigate to="/login" />;
} 