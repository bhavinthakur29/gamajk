import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import ResponsiveContainer from './components/layout/ResponsiveContainer';
import MainLayout from './components/layout/MainLayout';
import PrivateRoute from './components/PrivateRoute';
import Login from './features/pages/Login';
import Dashboard from './features/pages/Dashboard';
import Students from './features/students/Students';
import StudentDetail from './features/students/StudentDetail';
import EditStudent from './features/students/EditStudent';
import Attendance from './features/attendance/Attendance';
import AttendanceRecords from './features/attendance/AttendanceRecords';
import AddStudent from './features/students/AddStudent';
import Profile from './features/profile/Profile';
import AdminLayout from './features/admin/AdminLayout';
import AdminDashboard from './features/admin/AdminDashboard';
import AdminBranches from './features/admin/AdminBranches';
import AdminInstructors from './features/admin/AdminInstructors';
import AdminStudents from './features/admin/AdminStudents';
import AdminProfile from './features/admin/AdminProfile';
import { USER_ROLES } from './utils/constants';

// Route guard for admin users
function AdminRoute({ children }) {
  const { currentUser, userRole } = useAuth();
  if (!currentUser) return <Navigate to="/login" />;
  if (userRole !== USER_ROLES.ADMIN) return <Navigate to="/dashboard" />;
  return children;
}

// Route guard for instructor users
function InstructorRoute({ children }) {
  const { currentUser, userRole } = useAuth();
  if (!currentUser) return <Navigate to="/login" />;
  if (userRole !== USER_ROLES.INSTRUCTOR) return <Navigate to="/login" />;
  return children;
}

function AppContent() {
  const { userRole } = useAuth();

  return (
    <>
      <ResponsiveContainer>
        <div className="app-content">
          <Routes>
            <Route path="/login" element={<Login />} />

            {/* Root redirect based on user role */}
            <Route
              path="/"
              element={
                <PrivateRoute>
                  {userRole === USER_ROLES.ADMIN ? (
                    <Navigate to="/admin" replace />
                  ) : (
                    <Navigate to="/dashboard" replace />
                  )}
                </PrivateRoute>
              }
            />

            {/* Instructor routes with MainLayout */}
            <Route
              element={
                <PrivateRoute>
                  <InstructorRoute>
                    <MainLayout />
                  </InstructorRoute>
                </PrivateRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/students" element={<Students />} />
              <Route path="/student/:studentId" element={<StudentDetail />} />
              <Route path="/edit-student/:studentId" element={<EditStudent />} />
              <Route path="/attendance" element={<Attendance />} />
              <Route path="/attendance-records" element={<AttendanceRecords />} />
              <Route path="/add-student" element={<AddStudent />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Admin routes */}
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
              <Route path="student/:studentId" element={<StudentDetail />} />
              <Route path="edit-student/:studentId" element={<EditStudent />} />
              <Route path="attendance-records" element={<AttendanceRecords />} />
              <Route path="profile" element={<AdminProfile />} />
            </Route>

            {/* Fallback route */}
            <Route path="*" element={
              <PrivateRoute>
                {userRole === USER_ROLES.ADMIN ? (
                  <Navigate to="/admin" replace />
                ) : (
                  <Navigate to="/dashboard" replace />
                )}
              </PrivateRoute>
            } />
          </Routes>
        </div>
      </ResponsiveContainer>
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AuthProvider>
          <AppContent />
        </AuthProvider>
      </Router>
    </ErrorBoundary>
  );
}

export default App;
