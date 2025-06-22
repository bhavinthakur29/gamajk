import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, query, where, updateDoc, doc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase';
import { Card, Table, Button, Tabs, Tab, Spinner, Toast, ToastContainer } from 'react-bootstrap';
import { FaCheck, FaTimes, FaSave, FaSync } from 'react-icons/fa';
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
    const [branchConfig, setBranchConfig] = useState(null);
    const [availableBatches, setAvailableBatches] = useState([1, 2]);
    const [refreshing, setRefreshing] = useState(false);

    // Fetch branch configuration
    useEffect(() => {
        const fetchBranchConfig = async () => {
            try {
                if (!userBranch) return;

                // Get branch configuration from the database
                const branchQuery = query(
                    collection(db, 'branches'),
                    where('name', '==', userBranch)
                );

                const branchSnapshot = await getDocs(branchQuery);
                if (!branchSnapshot.empty) {
                    const branchData = branchSnapshot.docs[0].data();
                    setBranchConfig(branchData);

                    // Get number of batches
                    const numBatches = parseInt(branchData.numBatches) || 2;
                    const batchArray = Array.from({ length: numBatches }, (_, i) => i + 1);
                    setAvailableBatches(batchArray);

                    // Set active tab to first batch if current batch doesn't exist
                    const currentBatch = parseInt(activeTab.replace('batch', ''));
                    if (currentBatch > numBatches) {
                        setActiveTab('batch1');
                    }
                }
            } catch (error) {
                console.error('Error fetching branch config:', error);
            }
        };

        fetchBranchConfig();
    }, [userBranch]);

    const fetchStudents = async (forceRefresh = false) => {
        try {
            if (forceRefresh) setRefreshing(true);
            else setLoading(true);

            // Clear any old localStorage data that might be causing issues
            const today = new Date().toISOString().split('T')[0];
            if (forceRefresh) localStorage.removeItem(`attendance_${today}`);

            // For instructors, directly query only students from their branch
            let fetchedStudents = [];
            if (userRole === 'instructor') {
                // First, query by branch only to avoid needing a composite index
                const q = query(
                    collection(db, 'students'),
                    where('branch', '==', userBranch)
                );
                const querySnapshot = await getDocs(q);
                fetchedStudents = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                // Then, filter out derolled students on the client-side
                fetchedStudents = fetchedStudents.filter(student => student.status !== 'derolled');
            } else {
                // For admin, get all students
                const querySnapshot = await getDocs(collection(db, 'students'));
                fetchedStudents = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
            }

            setStudents(fetchedStudents);

            // Load saved attendance from localStorage
            const savedAttendance = localStorage.getItem(`attendance_${today}`);
            if (savedAttendance) {
                setAttendance(JSON.parse(savedAttendance));
            }

            if (forceRefresh) {
                setToastMsg('Data refreshed successfully!');
                setShowToast(true);
            }
        } catch (error) {
            console.error('Error fetching students:', error);
            if (forceRefresh) {
                setToastMsg('Error refreshing data.');
                setShowToast(true);
            }
        } finally {
            if (forceRefresh) setRefreshing(false);
            else setLoading(false);
        }
    };

    const handleRefresh = () => {
        fetchStudents(true);
    };

    useEffect(() => {
        fetchStudents();

        // Check if there's pending data from yesterday that needs to be submitted
        const checkForPendingData = async () => {
            try {
                const today = new Date().toISOString().split('T')[0];
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toISOString().split('T')[0];

                // Check if there's data from yesterday in localStorage
                const pendingData = localStorage.getItem(`attendance_${yesterdayStr}`);

                if (pendingData) {
                    const pendingAttendance = JSON.parse(pendingData);

                    // If there's data, save it to the database
                    if (Object.keys(pendingAttendance).length > 0) {
                        // Temporarily save the data to use in the save function
                        const tempAttendance = { ...attendance };
                        setAttendance(pendingAttendance);

                        // Save the pending data
                        await handleSaveAttendance(yesterdayStr);

                        // Restore current attendance
                        setAttendance(tempAttendance);

                        // Remove yesterday's data from localStorage
                        localStorage.removeItem(`attendance_${yesterdayStr}`);

                        console.log('Pending attendance data from yesterday submitted successfully');
                    }
                }
            } catch (error) {
                console.error('Error processing pending attendance data:', error);
            }
        };

        // Setup a timer to check if we need to save data at midnight
        const setupMidnightCheck = () => {
            // Calculate time until next midnight
            const now = new Date();
            const midnight = new Date();
            midnight.setHours(24, 0, 0, 0);
            const msUntilMidnight = midnight - now;

            console.log(`Scheduling midnight attendance push in ${msUntilMidnight}ms`);

            // Set a timeout for midnight
            const midnightTimeout = setTimeout(() => {
                const today = new Date().toISOString().split('T')[0];
                const attendanceData = localStorage.getItem(`attendance_${today}`);

                if (attendanceData) {
                    // Save attendance data automatically at midnight
                    const savedAttendance = JSON.parse(attendanceData);

                    if (Object.keys(savedAttendance).length > 0) {
                        // Set the attendance data and save it
                        setAttendance(savedAttendance);
                        handleSaveAttendance(today).then(() => {
                            // Clear the localStorage data after saving
                            localStorage.removeItem(`attendance_${today}`);
                            // Reset the attendance state
                            setAttendance({});
                            console.log('Midnight attendance data submitted and reset');
                        });
                    }
                }

                // Setup the next midnight check
                setupMidnightCheck();
            }, msUntilMidnight);

            return midnightTimeout;
        };

        // Check for pending data immediately
        checkForPendingData();

        // Setup midnight check
        const midnightTimeout = setupMidnightCheck();

        return () => {
            // Clear timeout when component unmounts
            clearTimeout(midnightTimeout);
        };
    }, [userRole, userBranch]);

    const handleAttendanceChange = (studentId, present) => {
        const newAttendance = { ...attendance, [studentId]: present };
        setAttendance(newAttendance);
        // Save to localStorage
        const today = new Date().toISOString().split('T')[0];
        localStorage.setItem(`attendance_${today}`, JSON.stringify(newAttendance));
    };

    const handleSaveAttendance = async (dateStr = null) => {
        setSaving(true);
        try {
            const today = dateStr || new Date().toISOString().split('T')[0];
            const month = today.substring(0, 7); // YYYY-MM format
            const attendanceObj = attendance;

            // Gather additional student info for better record keeping
            const studentsArr = Object.entries(attendanceObj).map(([studentId, present]) => {
                const student = students.find(s => s.id === studentId);

                // Skip if no student found with this ID
                if (!student) {
                    console.warn(`No student found with ID: ${studentId}. Skipping attendance entry.`);
                    return null;
                }

                return {
                    studentId,
                    present,
                    name: student.name || '',
                    studentName: student.name || '', // Add this for compatibility
                    belt: student.belt || '',
                    studentBelt: student.belt || '', // Add this for compatibility
                    branch: student.branch || userBranch,
                    batch: student.batch || parseInt(activeTab.replace('batch', ''))
                };
            }).filter(entry => entry !== null); // Remove any null entries

            if (studentsArr.length === 0) {
                setToastMsg('No attendance to save.');
                setShowToast(true);
                setSaving(false);
                return;
            }

            // Check for existing records for today's date AND this branch AND this batch
            const q = query(
                collection(db, 'attendance_records'),
                where('date', '==', today),
                where('branch', '==', userBranch),
                where('batch', '==', parseInt(activeTab.replace('batch', '')))
            );

            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                // Update existing record for this branch and batch
                const recordRef = doc(db, 'attendance_records', querySnapshot.docs[0].id);

                // Get existing record to check for student updates
                const existingRecord = querySnapshot.docs[0].data();

                // Create a new array for updated students to avoid duplicates
                const updatedStudentMap = {};

                // First add existing students to the map (to avoid duplicates)
                if (existingRecord.students && Array.isArray(existingRecord.students)) {
                    existingRecord.students.forEach(student => {
                        if (student.studentId) {
                            updatedStudentMap[student.studentId] = student;
                        }
                    });
                }

                // Now update or add the current attendance
                studentsArr.forEach(newStudent => {
                    if (newStudent.studentId) {
                        updatedStudentMap[newStudent.studentId] = newStudent;
                    }
                });

                // Convert the map back to an array
                const updatedStudents = Object.values(updatedStudentMap);

                await updateDoc(recordRef, {
                    students: updatedStudents,
                    month,
                    timestamp: serverTimestamp()
                });
            } else {
                // Create new record for this branch and batch
                await addDoc(collection(db, 'attendance_records'), {
                    date: today,
                    month,
                    batch: parseInt(activeTab.replace('batch', '')),
                    branch: userBranch,
                    batchName: `Batch ${parseInt(activeTab.replace('batch', ''))}`,
                    students: studentsArr,
                    timestamp: serverTimestamp()
                });
            }

            setToastMsg('Attendance saved successfully!');
            console.log('Attendance saved successfully for batch:', activeTab);
            return true; // Return success status for promise chaining
        } catch (error) {
            console.error('Error saving attendance:', error);
            setToastMsg('Error saving attendance.');
            return false; // Return failure status for promise chaining
        } finally {
            setShowToast(true);
            setSaving(false);
        }
    };

    // Get student status badge label and color based on belt
    const getBeltStyle = (belt) => {
        if (!belt) return { text: "Unknown", bg: "#6c757d", color: "#fff" };

        // Map belt colors to badge styles
        const beltMap = {
            "White": { text: "White", bg: "#f8f9fa", color: "#212529" },
            "Yellow": { text: "Yellow", bg: "#ffc107", color: "#212529" },
            "Yellow Stripe": { text: "Yellow Stripe", bg: "#ffc107", color: "#212529" },
            "Orange": { text: "Orange", bg: "#fd7e14", color: "#212529" },
            "Green": { text: "Green", bg: "#198754", color: "#fff" },
            "Blue": { text: "Blue", bg: "#0d6efd", color: "#fff" },
            "Purple": { text: "Purple", bg: "#6f42c1", color: "#fff" },
            "Brown": { text: "Brown", bg: "#795548", color: "#fff" },
            "Red": { text: "Red", bg: "#dc3545", color: "#fff" },
            "Black": { text: "Black", bg: "#212529", color: "#fff" },
            "Black 1": { text: "Black 1", bg: "#212529", color: "#fff" },
            "Black 2": { text: "Black 2", bg: "#212529", color: "#fff" },
            "Black 3": { text: "Black 3", bg: "#212529", color: "#fff" }
        };

        return beltMap[belt] || { text: belt, bg: "#6c757d", color: "#fff" };
    };

    // Get row class based on attendance status
    const getRowClass = (studentId) => {
        if (attendance[studentId] === true) return 'present-row';
        if (attendance[studentId] === false) return 'absent-row';
        return 'unmarked-row';
    };

    const activeBatch = parseInt(activeTab.replace('batch', ''));

    // Filter students by the active batch
    const filteredStudents = students.filter(student => student.batch === activeBatch);

    // Deduplicate students by ID to prevent rendering issues
    const uniqueStudents = Array.from(new Map(filteredStudents.map(student => [student.id, student])).values());

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
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h4><strong>Mark Attendance</strong></h4>
                    <Button
                        variant="outline-primary"
                        onClick={handleRefresh}
                        disabled={refreshing || loading}
                        className="d-flex align-items-center"
                    >
                        <FaSync className={`me-2 ${refreshing ? 'fa-spin' : ''}`} />
                        {refreshing ? 'Refreshing...' : 'Refresh Data'}
                    </Button>
                </div>
                <Tabs
                    activeKey={activeTab}
                    onSelect={(k) => setActiveTab(k)}
                    className="mb-4"
                >
                    {availableBatches.map(batchNum => (
                        <Tab key={`batch${batchNum}`} eventKey={`batch${batchNum}`} title={`Batch ${batchNum}`} />
                    ))}
                </Tabs>
                <div className="table-responsive">
                    <Table bordered hover className="attendance-table">
                        <thead className="table-light">
                            <tr>
                                <th style={{ width: '60%' }}>Name</th>
                                <th style={{ width: '20%' }}>Belt</th>
                                <th style={{ width: '20%' }}>Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {uniqueStudents.map(student => {
                                const beltStyle = getBeltStyle(student.belt);
                                const isPresent = attendance[student.id] === true;
                                const isAbsent = attendance[student.id] === false;

                                return (
                                    <tr key={student.id} className={getRowClass(student.id)}>
                                        <td>{student.name}</td>
                                        <td className="p-0">
                                            <div
                                                className="belt-label"
                                                style={{
                                                    backgroundColor: beltStyle.bg,
                                                    color: beltStyle.color,
                                                }}
                                            >
                                                {beltStyle.text}
                                            </div>
                                        </td>
                                        <td>
                                            <div className="d-flex justify-content-center">
                                                <button
                                                    type="button"
                                                    className={`att-mark-btn ${isPresent ? 'present' : 'inactive'}`}
                                                    onClick={() => handleAttendanceChange(student.id, true)}
                                                >
                                                    <FaCheck size={16} />
                                                </button>
                                                <button
                                                    type="button"
                                                    className={`att-mark-btn ${isAbsent ? 'absent' : 'inactive'}`}
                                                    onClick={() => handleAttendanceChange(student.id, false)}
                                                >
                                                    <FaTimes size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </Table>
                </div>
                <div className="d-flex justify-content-end mb-3">
                    <Button variant="primary" onClick={() => handleSaveAttendance()} disabled={saving}>
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
