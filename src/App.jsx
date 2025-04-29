import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './features/pages/Login';
import Dashboard from './features/pages/Dashboard';
import Students from './features/students/Students';
import Attendance from './features/attendance/Attendance';
import AttendanceRecords from './features/attendance/AttendanceRecords';
import AddStudent from './features/students/AddStudent';
import Profile from './features/profile/Profile';
import AdminLayout from './features/admin/AdminLayout';
import AdminDashboard from './features/admin/AdminDashboard';
import AdminBranches from './features/admin/AdminBranches';
import AdminInstructors from './features/admin/AdminInstructors';
import AdminStudents from './features/admin/AdminStudents';

function AdminRoute({ children }) {
  const { currentUser, userRole } = useAuth();
  if (!currentUser) return <Navigate to="/login" />;
  if (userRole !== 'admin') return <Navigate to="/dashboard" />;
  return children;
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route
            path="/dashboard"
            element={
              <PrivateRoute>
                <Dashboard />
              </PrivateRoute>
            }
          />
          <Route
            path="/admin"
            element={
              <PrivateRoute>
                <AdminRoute>
                  <AdminLayout />
                </AdminRoute>
              </PrivateRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="branches" element={<AdminBranches />} />
            <Route path="instructors" element={<AdminInstructors />} />
            <Route path="students" element={<AdminStudents />} />
            <Route path="attendance-records" element={<AttendanceRecords />} />
            <Route path="profile" element={<Profile />} />
          </Route>
          <Route
            path="/students"
            element={
              <PrivateRoute>
                <Students />
              </PrivateRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <PrivateRoute>
                <Attendance />
              </PrivateRoute>
            }
          />
          <Route
            path="/attendance-records"
            element={
              <PrivateRoute>
                <AttendanceRecords />
              </PrivateRoute>
            }
          />
          <Route
            path="/add-student"
            element={
              <PrivateRoute>
                <AddStudent />
              </PrivateRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <PrivateRoute>
                <Profile />
              </PrivateRoute>
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
