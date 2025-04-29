import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, where, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Card, Table, Button, Tabs, Tab, Badge, Spinner, Toast, ToastContainer } from 'react-bootstrap';
import { FaCheck, FaTimes, FaSave } from 'react-icons/fa';
import NoData from '../../components/common/NoData';
import { useAuth } from '../../contexts/AuthContext';

export default function Attendance() {
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [attendance, setAttendance] = useState({});
    const [activeTab, setActiveTab] = useState('batch1');
    const [showToast, setShowToast] = useState(false);
    const [toastMsg, setToastMsg] = useState('');
    const [saving, setSaving] = useState(false);
    const { userRole, userBranch } = useAuth();

    useEffect(() => {
        const fetchStudents = async () => {
            try {
                setLoading(true);
                const querySnapshot = await getDocs(collection(db, 'students'));
                let fetchedStudents = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                // Filter by branch for instructors
                if (userRole === 'instructor') {
                    fetchedStudents = fetchedStudents.filter(s => s.branch === userBranch);
                }
                setStudents(fetchedStudents);

                // Load saved attendance from localStorage
                const today = new Date().toISOString().split('T')[0];
                const savedAttendance = localStorage.getItem(`attendance_${today}`);
                if (savedAttendance) {
                    setAttendance(JSON.parse(savedAttendance));
                }
            } catch (error) {
                console.error('Error fetching students:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchStudents();
    }, [userRole, userBranch]);

    const handleAttendanceChange = (studentId, present) => {
        const newAttendance = { ...attendance, [studentId]: present };
        setAttendance(newAttendance);
        // Save to localStorage
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem(`attendance_${today}`, JSON.stringify(newAttendance));
    };

    const handleSaveAttendance = async () => {
        setSaving(true);
        try {
            const today = new Date().toISOString().split('T')[0];
            const attendanceObj = attendance;
            const studentsArr = Object.entries(attendanceObj).map(([studentId, present]) => ({
                studentId,
                present
            }));
            if (studentsArr.length === 0) {
                setToastMsg('No attendance to save.');
                setShowToast(true);
                setSaving(false);
                return;
            }
            // Upsert logic: check if record exists for today
            const q = query(collection(db, 'attendance_records'), where('date', '==', today));
            const querySnapshot = await getDocs(q);
            if (!querySnapshot.empty) {
                // Update existing
                const recordRef = doc(db, 'attendance_records', querySnapshot.docs[0].id);
                await updateDoc(recordRef, {
                    students: studentsArr,
                    timestamp: serverTimestamp()
                });
            } else {
                // Create new
                await addDoc(collection(db, 'attendance_records'), {
                    date: today,
                    students: studentsArr,
                    timestamp: serverTimestamp()
                });
            }
            setToastMsg('Attendance saved successfully!');
        } catch (error) {
            setToastMsg('Error saving attendance.');
        } finally {
            setShowToast(true);
            setSaving(false);
        }
    };

    const getStudentStatusColor = (studentId) => {
        if (attendance[studentId] === undefined) return 'table-light';
        return attendance[studentId] ? 'table-success' : 'table-danger';
    };

    const filteredStudents = students.filter(student => student.batch === parseInt(activeTab.replace('batch', '')));

    if (loading) {
        return (
            <div className="min-vh-100 bg-light">
                <div className="container-fluid px-3 py-4 position-relative">
                    <div className="text-center">
                        <Spinner animation="border" role="status">
                            <span className="visually-hidden">Loading...</span>
                        </Spinner>
                    </div>
                </div>
            </div>
        );
    }

    if (students.length === 0) {
        return (
            <div className="min-vh-100 bg-light">
                <div className="container-fluid px-3 py-4 position-relative">
                    <NoData
                        title="No Students Found"
                        message="There are no students registered in the system yet."
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="min-vh-100 bg-light">
            <div className="container-fluid px-3 py-4 position-relative">
                <h1 className="mb-4">Take Attendance</h1>
                <Tabs
                    activeKey={activeTab}
                    onSelect={(k) => setActiveTab(k)}
                    className="mb-4"
                >
                    <Tab eventKey="batch1" title="Batch 1" />
                    <Tab eventKey="batch2" title="Batch 2" />
                    <Tab eventKey="batch3" title="Batch 3" />
                </Tabs>
                <div className="table-responsive">
                    <Table striped bordered hover>
                        <thead className="table-light">
                            <tr>
                                <th style={{ width: '60%' }}>Name</th>
                                <th style={{ width: '20%' }}>Belt</th>
                                <th style={{ width: '20%' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredStudents.map(student => (
                                <tr
                                    key={student.id}
                                    className={getStudentStatusColor(student.id)}
                                >
                                    <td>{student.name}</td>
                                    <td>
                                        <Badge bg="secondary">
                                            {student.belt}
                                        </Badge>
                                    </td>
                                    <td>
                                        <div className="d-flex gap-2">
                                            <Button
                                                variant={attendance[student.id] ? 'success' : 'outline-success'}
                                                size="sm"
                                                onClick={() => handleAttendanceChange(student.id, true)}
                                            >
                                                <FaCheck />
                                            </Button>
                                            <Button
                                                variant={attendance[student.id] === false ? 'danger' : 'outline-danger'}
                                                size="sm"
                                                onClick={() => handleAttendanceChange(student.id, false)}
                                            >
                                                <FaTimes />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </Table>
                </div>
                <div className="d-flex justify-content-end mb-3">
                    <Button variant="primary" onClick={handleSaveAttendance} disabled={saving}>
                        <FaSave className="me-2" />
                        {saving ? 'Saving...' : 'Save Attendance'}
                    </Button>
                </div>
                <ToastContainer position="bottom-end" className="p-3">
                    <Toast show={showToast} onClose={() => setShowToast(false)} delay={2000} autohide>
                        <Toast.Header>
                            <strong className="me-auto">Attendance</strong>
                        </Toast.Header>
                        <Toast.Body>{toastMsg}</Toast.Body>
                    </Toast>
                </ToastContainer>
            </div>
        </div>
    );
}
