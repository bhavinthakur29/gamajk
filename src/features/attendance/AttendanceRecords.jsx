import { useState, useEffect } from 'react';
import { collection, getDocs, query, orderBy, where, doc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Table, Card, Accordion, Dropdown, Row, Col, Form, Spinner, Button, Toast } from 'react-bootstrap';
import { FaChevronDown, FaChevronUp, FaCalendarAlt, FaSync } from 'react-icons/fa';
import NoData from '../../components/common/NoData';
import { useAuth } from '../../contexts/AuthContext';
import { attendanceService } from '../../services/firebaseService';
import AttendanceExport from './AttendanceExport';
import { BELT_ORDER } from '../../utils/constants';

export default function AttendanceRecords() {
    const [records, setRecords] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedBatches, setExpandedBatches] = useState({});
    const [sortOptions, setSortOptions] = useState({});
    const [allStudentsByBatch, setAllStudentsByBatch] = useState({});
    const [branches, setBranches] = useState([]);
    const [selectedBranch, setSelectedBranch] = useState('All');
    const [selectedBelt, setSelectedBelt] = useState('All');
    const [selectedMonth, setSelectedMonth] = useState('All');
    const [availableMonths, setAvailableMonths] = useState([]);
    const [sortedDates, setSortedDates] = useState([]);
    const [recordsByDate, setRecordsByDate] = useState({});
    const { userRole, userBranch } = useAuth();
    const [refreshing, setRefreshing] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMsg, setToastMsg] = useState('');

    // Auto-expand the first batch of the most recent date when dates change
    useEffect(() => {
        if (sortedDates.length > 0 && recordsByDate[sortedDates[0]]?.length > 0) {
            const firstDate = sortedDates[0];
            const firstBatch = recordsByDate[firstDate][0].batch;
            if (firstBatch) {
                const key = `${firstDate}-${firstBatch}`;

                if (!expandedBatches[key]) {
                    setExpandedBatches(prev => ({ ...prev, [key]: true }));
                }
            }
        }
    }, [sortedDates, recordsByDate]);

    useEffect(() => {
        const fetchRecords = async () => {
            try {
                setLoading(true);
                console.log("Fetching attendance records...");

                // Clear any cached data
                localStorage.removeItem("attendance_records_cache");

                // Force a fresh fetch of data
                const records = await attendanceService.getAllAttendanceRecords(true);

                console.log("Fetched records:", records);
                setRecords(records);

                // Extract unique branches from the records
                const uniqueBranches = [...new Set(records.map(record => record.branch).filter(Boolean))];
                setBranches(uniqueBranches);

                // For instructors, auto-set their branch as the selected branch
                if (userRole !== 'admin' && userBranch) {
                    setSelectedBranch(userBranch);
                }

                // Extract unique months from the records for filtering
                const months = new Set();
                records.forEach(record => {
                    if (record.month) {
                        months.add(record.month);
                    } else if (record.date) {
                        // For backward compatibility with older records
                        const month = record.date.substring(0, 7);
                        months.add(month);
                    }
                });
                // Sort months in descending order (newest first)
                const sortedMonths = [...months].sort((a, b) => b.localeCompare(a));
                setAvailableMonths(sortedMonths);

                // If months available and none selected, select the latest
                if (sortedMonths.length > 0 && selectedMonth === 'All') {
                    setSelectedMonth(sortedMonths[0]);
                }

                // Create a dictionary of all students by batch for filtering
                const studentsByBatch = {};
                records.forEach(record => {
                    if (!record.batch) return;

                    if (!studentsByBatch[record.batch]) {
                        studentsByBatch[record.batch] = [];
                    }

                    if (record.students && Array.isArray(record.students)) {
                        record.students.forEach(student => {
                            const studentId = student.id || student.studentId;
                            if (studentId && !studentsByBatch[record.batch].find(s => (s.id || s.studentId) === studentId)) {
                                studentsByBatch[record.batch].push(student);
                            }
                        });
                    }
                });

                setAllStudentsByBatch(studentsByBatch);
            } catch (error) {
                console.error('Error fetching attendance records:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchRecords();
    }, [userRole, userBranch, selectedBranch]);

    // Process records when filtering criteria change
    useEffect(() => {
        // Process and organize records for display
        const processRecords = () => {
            try {
                let filteredRecords = [...records];

                // Apply branch filter if not "All" branches
                if (selectedBranch !== 'All') {
                    filteredRecords = filteredRecords.filter(record => record.branch === selectedBranch);
                }

                // Apply month filter if not "All" months
                if (selectedMonth !== 'All') {
                    filteredRecords = filteredRecords.filter(record => {
                        if (record.month) return record.month === selectedMonth;
                        if (record.date) return record.date.substring(0, 7) === selectedMonth;
                        return false;
                    });
                }

                // Apply belt filter if not "All" belts
                if (selectedBelt !== 'All') {
                    filteredRecords = filteredRecords.filter(record => {
                        if (!record.students) return false;
                        return record.students.some(student => {
                            const belt = student.belt || student.studentBelt;
                            return belt === selectedBelt;
                        });
                    });
                }

                // First group records by date
                const recordsByDate = {};

                filteredRecords.forEach(record => {
                    if (!record.date) return;

                    if (!recordsByDate[record.date]) {
                        recordsByDate[record.date] = {};
                    }

                    // Then group by branch within each date
                    if (!recordsByDate[record.date][record.branch]) {
                        recordsByDate[record.date][record.branch] = [];
                    }

                    recordsByDate[record.date][record.branch].push(record);
                });

                // Convert the nested structure to a format for rendering
                const processedData = {};

                // Sort dates in descending order (newest first)
                const sortedDates = Object.keys(recordsByDate).sort((a, b) => {
                    return new Date(b) - new Date(a); // Most recent first
                });

                // For each date
                sortedDates.forEach(date => {
                    processedData[date] = {
                        branches: {}
                    };

                    // Get sorted branches for this date
                    const branches = Object.keys(recordsByDate[date]).sort();

                    // For each branch in this date
                    branches.forEach(branch => {
                        processedData[date].branches[branch] = recordsByDate[date][branch];
                    });

                    // Store the branches for this date
                    processedData[date].sortedBranches = branches;
                });

                // Update state with the processed data
                setRecordsByDate(processedData);
                setSortedDates(sortedDates);

                // Auto-expand the first date's first branch
                if (sortedDates.length > 0) {
                    const firstDate = sortedDates[0];
                    if (processedData[firstDate].sortedBranches.length > 0) {
                        const firstBranch = processedData[firstDate].sortedBranches[0];

                        setExpandedBatches(prev => ({
                            ...prev,
                            [firstDate]: true,
                            [`${firstDate}-${firstBranch}`]: true
                        }));
                    }
                }
            } catch (error) {
                console.error('Error processing records:', error);
            }
        };

        processRecords();
    }, [records, selectedBranch, selectedMonth, selectedBelt]);

    // Toggle functions for each level of the hierarchy
    const toggleDate = (date) => {
        setExpandedBatches(prev => ({
            ...prev,
            [date]: !prev[date]
        }));
    };

    const toggleBranch = (date, branch) => {
        setExpandedBatches(prev => ({
            ...prev,
            [`${date}-${branch}`]: !prev[`${date}-${branch}`]
        }));
    };

    const toggleBatch = (date, branch, batch) => {
        setExpandedBatches(prev => ({
            ...prev,
            [`${date}-${branch}-${batch}`]: !prev[`${date}-${branch}-${batch}`]
        }));
    };

    const handleSortChange = (date, batch, field, direction) => {
        setSortOptions(prev => ({
            ...prev,
            [`${date}-${batch}`]: { field, direction }
        }));
    };

    // Format month as "Month YYYY"
    const formatMonthName = (monthStr) => {
        if (!monthStr) return '';
        const date = new Date(monthStr + '-01');
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    const getFilteredStudents = (students) => {
        if (!students || !Array.isArray(students)) return [];

        let filtered = [...students];

        // Filter by belt if selected
        if (selectedBelt !== 'All') {
            filtered = filtered.filter(student =>
                (student.belt === selectedBelt) || (student.studentBelt === selectedBelt)
            );
        }

        return filtered;
    };

    const getSortedStudents = (students, date, branch) => {
        const sortOption = sortOptions[`${date}-${branch}`] || { field: 'name', direction: 'asc' };
        const field = sortOption.field || 'name';
        const direction = sortOption.direction || 'asc';

        // Filter out empty "No Name" records that might have been created by mistake
        const validStudents = students.filter(student => {
            // Skip entries without a proper name 
            if (!student.name && !student.studentName) return false;

            // Skip entries without a valid studentId
            if (!student.id && !student.studentId) return false;

            return true;
        });

        return [...validStudents].sort((a, b) => {
            let aValue, bValue;

            if (field === 'name') {
                aValue = (a.name || a.studentName || '').toLowerCase();
                bValue = (b.name || b.studentName || '').toLowerCase();
            } else if (field === 'status') {
                aValue = a.present ? 1 : 0;
                bValue = b.present ? 1 : 0;
            } else if (field === 'belt') {
                // Get belt indices from the belt order constant
                const aBelt = a.belt || a.studentBelt || '';
                const bBelt = b.belt || b.studentBelt || '';
                aValue = BELT_ORDER.indexOf(aBelt);
                bValue = BELT_ORDER.indexOf(bBelt);

                // If belt not found in order, put it at the end
                if (aValue === -1) aValue = 999;
                if (bValue === -1) bValue = 999;
            } else if (field === 'batch') {
                // Sort by batch number
                aValue = parseInt(a.batch) || 999;
                bValue = parseInt(b.batch) || 999;
            }

            // Compare based on direction
            if (direction === 'asc') {
                return aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
            } else {
                return aValue < bValue ? 1 : aValue > bValue ? -1 : 0;
            }
        });
    };

    // Get belt style based on belt name
    const getBeltStyle = (belt) => {
        if (!belt || belt === '') return { text: "Unknown", bg: "#6c757d", color: "#fff" };

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
            "Black 3": { text: "Black 3", bg: "#212529", color: "#fff" },
            "Green Stripe": { text: "Green Stripe", bg: "#198754", color: "#fff" }
        };

        return beltMap[belt] || { text: belt || "Unknown", bg: "#6c757d", color: "#fff" };
    };

    // Get row class based on attendance status
    const getRowClass = (isPresent) => {
        if (isPresent === true) return 'present-row';
        if (isPresent === false) return 'absent-row';
        return 'unmarked-row';
    };

    // Add a cleanup function to remove empty records
    const cleanupEmptyRecords = async () => {
        try {
            setRefreshing(true);

            // Process all records to remove empty students
            let anyChanges = false;
            const recordsToUpdate = [];

            for (const record of records) {
                if (!record.students || !Array.isArray(record.students)) continue;

                // Filter out empty students
                const validStudents = record.students.filter(student => {
                    return (student.name || student.studentName) && (student.id || student.studentId);
                });

                // If we removed some students, queue this record for update
                if (validStudents.length !== record.students.length) {
                    anyChanges = true;
                    recordsToUpdate.push({
                        id: record.id,
                        students: validStudents
                    });
                }
            }

            // Update records with cleaned student lists
            if (recordsToUpdate.length > 0) {
                for (const updateRecord of recordsToUpdate) {
                    const recordRef = doc(db, 'attendance_records', updateRecord.id);
                    await updateDoc(recordRef, {
                        students: updateRecord.students
                    });
                }

                setToastMsg(`Cleaned up ${recordsToUpdate.length} attendance records`);
                setShowToast(true);

                // Refresh records
                const refreshedRecords = await attendanceService.getAllAttendanceRecords(true);
                setRecords(refreshedRecords);
            } else {
                setToastMsg('No empty records found to clean up');
                setShowToast(true);
            }
        } catch (error) {
            console.error('Error cleaning up records:', error);
            setToastMsg('Error cleaning up records');
            setShowToast(true);
        } finally {
            setRefreshing(false);
        }
    };

    const handleRefresh = async () => {
        try {
            setRefreshing(true);
            // Force a fresh fetch from Firebase
            const records = await attendanceService.getAllAttendanceRecords(true);
            setRecords(records);
            setToastMsg('Data refreshed successfully!');
            setShowToast(true);
        } catch (error) {
            console.error('Error refreshing data:', error);
            setToastMsg('Error refreshing data.');
            setShowToast(true);
        } finally {
            setRefreshing(false);
        }
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center my-5">
                <Spinner animation="border" variant="primary" />
            </div>
        );
    }

    console.log("Records count:", records.length);

    return (
        <div className="container-fluid px-0 py-4">
            <div className="d-flex justify-content-between mb-4">
                <h4><strong>Attendance Records</strong></h4>
                <div className="d-flex gap-2">
                    {userRole === 'admin' && (
                        <Button
                            variant="warning"
                            onClick={cleanupEmptyRecords}
                            disabled={refreshing || loading}
                            className="d-flex align-items-center"
                        >
                            <span className="me-2">🧹</span>
                            {refreshing ? 'Processing...' : 'Clean Up Records'}
                        </Button>
                    )}
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
            </div>

            {/* Toast for notifications */}
            <Toast
                show={showToast}
                onClose={() => setShowToast(false)}
                delay={3000}
                autohide
                className="position-fixed top-0 end-0 m-4"
                style={{ zIndex: 1050 }}
            >
                <Toast.Header>
                    <strong className="me-auto">Notification</strong>
                </Toast.Header>
                <Toast.Body>{toastMsg}</Toast.Body>
            </Toast>

            {/* Export Component */}
            <AttendanceExport
                branchFilter={userRole !== 'admin' ? userBranch : selectedBranch}
            />

            {/* Filters */}
            <Card className="mb-4 shadow-sm">
                <Card.Body>
                    <Row>
                        <Col md={userRole === 'admin' ? 4 : 6}>
                            <Form.Group className="mb-3">
                                <Form.Label>
                                    <FaCalendarAlt className="me-2" />
                                    Month
                                </Form.Label>
                                <Form.Select
                                    value={selectedMonth}
                                    onChange={e => setSelectedMonth(e.target.value)}
                                >
                                    <option value="All">All Months</option>
                                    {availableMonths.map(month => (
                                        <option key={month} value={month}>
                                            {formatMonthName(month)}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                        {userRole === 'admin' && (
                            <Col md={4}>
                                <Form.Group className="mb-3">
                                    <Form.Label>Branch</Form.Label>
                                    <Form.Select
                                        value={selectedBranch}
                                        onChange={e => setSelectedBranch(e.target.value)}
                                    >
                                        <option value="All">All Branches</option>
                                        {branches.map(branch => (
                                            <option key={branch} value={branch}>{branch}</option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                        )}
                        <Col md={userRole === 'admin' ? 4 : 6}>
                            <Form.Group className="mb-3">
                                <Form.Label>Belt</Form.Label>
                                <Form.Select
                                    value={selectedBelt}
                                    onChange={e => setSelectedBelt(e.target.value)}
                                >
                                    <option value="All">All Belts</option>
                                    {BELT_ORDER.map(belt => (
                                        <option key={belt} value={belt}>{belt}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            {sortedDates.length === 0 ? (
                <NoData message={`No attendance records found for the selected filters. ${records.length > 0 ? 'Try changing your filters.' : 'Please mark and save attendance first.'}`} />
            ) : (
                <Accordion className="mb-4" defaultActiveKey={sortedDates[0]}>
                    {/* First level: Dates */}
                    {sortedDates.map(date => (
                        <Accordion.Item key={date} eventKey={date}>
                            <Accordion.Header>
                                <strong>{new Date(date).toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                            </Accordion.Header>
                            <Accordion.Body>
                                {/* Branch level - only show for admin, for instructors just show a flat list */}
                                {userRole === 'admin' ? (
                                    <Accordion className="mb-3">
                                        {recordsByDate[date].sortedBranches.map(branch => (
                                            <Accordion.Item key={`${date}-${branch}`} eventKey={`${date}-${branch}`}>
                                                <Accordion.Header>
                                                    <strong>{branch}</strong>
                                                </Accordion.Header>
                                                <Accordion.Body>
                                                    {/* Consolidate all batches for this branch into a single table */}
                                                    <div className="d-flex justify-content-between align-items-center mb-3">
                                                        <h5>All Batches</h5>
                                                        <Dropdown>
                                                            <Dropdown.Toggle variant="outline-secondary" size="sm">
                                                                Sort
                                                            </Dropdown.Toggle>
                                                            <Dropdown.Menu>
                                                                <Dropdown.Item
                                                                    onClick={() => handleSortChange(date, branch, 'name', 'asc')}
                                                                    active={sortOptions[`${date}-${branch}`]?.field === 'name' && sortOptions[`${date}-${branch}`]?.direction === 'asc'}
                                                                >
                                                                    Name (A-Z)
                                                                </Dropdown.Item>
                                                                <Dropdown.Item
                                                                    onClick={() => handleSortChange(date, branch, 'name', 'desc')}
                                                                    active={sortOptions[`${date}-${branch}`]?.field === 'name' && sortOptions[`${date}-${branch}`]?.direction === 'desc'}
                                                                >
                                                                    Name (Z-A)
                                                                </Dropdown.Item>
                                                                <Dropdown.Divider />
                                                                <Dropdown.Item
                                                                    onClick={() => handleSortChange(date, branch, 'batch', 'asc')}
                                                                    active={sortOptions[`${date}-${branch}`]?.field === 'batch' && sortOptions[`${date}-${branch}`]?.direction === 'asc'}
                                                                >
                                                                    Batch (Low to High)
                                                                </Dropdown.Item>
                                                                <Dropdown.Item
                                                                    onClick={() => handleSortChange(date, branch, 'batch', 'desc')}
                                                                    active={sortOptions[`${date}-${branch}`]?.field === 'batch' && sortOptions[`${date}-${branch}`]?.direction === 'desc'}
                                                                >
                                                                    Batch (High to Low)
                                                                </Dropdown.Item>
                                                                <Dropdown.Divider />
                                                                <Dropdown.Item
                                                                    onClick={() => handleSortChange(date, branch, 'belt', 'asc')}
                                                                    active={sortOptions[`${date}-${branch}`]?.field === 'belt' && sortOptions[`${date}-${branch}`]?.direction === 'asc'}
                                                                >
                                                                    Belt (High to Low)
                                                                </Dropdown.Item>
                                                                <Dropdown.Item
                                                                    onClick={() => handleSortChange(date, branch, 'belt', 'desc')}
                                                                    active={sortOptions[`${date}-${branch}`]?.field === 'belt' && sortOptions[`${date}-${branch}`]?.direction === 'desc'}
                                                                >
                                                                    Belt (Low to High)
                                                                </Dropdown.Item>
                                                                <Dropdown.Divider />
                                                                <Dropdown.Item
                                                                    onClick={() => handleSortChange(date, branch, 'status', 'asc')}
                                                                    active={sortOptions[`${date}-${branch}`]?.field === 'status' && sortOptions[`${date}-${branch}`]?.direction === 'asc'}
                                                                >
                                                                    Status (Absent First)
                                                                </Dropdown.Item>
                                                                <Dropdown.Item
                                                                    onClick={() => handleSortChange(date, branch, 'status', 'desc')}
                                                                    active={sortOptions[`${date}-${branch}`]?.field === 'status' && sortOptions[`${date}-${branch}`]?.direction === 'desc'}
                                                                >
                                                                    Status (Present First)
                                                                </Dropdown.Item>
                                                            </Dropdown.Menu>
                                                        </Dropdown>
                                                    </div>

                                                    <div className="table-responsive mt-3">
                                                        <Table bordered hover className="attendance-table">
                                                            <thead className="table-light">
                                                                <tr>
                                                                    <th>Name</th>
                                                                    <th>Batch</th>
                                                                    <th>Belt</th>
                                                                    <th>Status</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                {recordsByDate[date].branches[branch].reduce((allStudents, record) => {
                                                                    if (record.students && Array.isArray(record.students)) {
                                                                        return [...allStudents, ...record.students];
                                                                    }
                                                                    return allStudents;
                                                                }, []).length > 0 ? (
                                                                    getSortedStudents(
                                                                        getFilteredStudents(
                                                                            recordsByDate[date].branches[branch].reduce((allStudents, record) => {
                                                                                if (record.students && Array.isArray(record.students)) {
                                                                                    return [...allStudents, ...record.students];
                                                                                }
                                                                                return allStudents;
                                                                            }, [])
                                                                        ),
                                                                        date,
                                                                        branch
                                                                    ).map(student => {
                                                                        const belt = student.belt || student.studentBelt || '';
                                                                        const beltStyle = getBeltStyle(belt);
                                                                        const studentName = student.name || student.studentName || 'No Name';
                                                                        const isPresent = student.present;
                                                                        const studentId = student.id || student.studentId;
                                                                        const batchNumber = student.batch || 'Unknown';

                                                                        return (
                                                                            <tr key={studentId} className={getRowClass(isPresent)}>
                                                                                <td>{studentName}</td>
                                                                                <td className="text-center">Batch {batchNumber}</td>
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
                                                                                <td className="text-center">
                                                                                    <div className={`status-badge ${isPresent ? 'present' : 'absent'}`}>
                                                                                        {isPresent ? 'Present' : 'Absent'}
                                                                                    </div>
                                                                                </td>
                                                                            </tr>
                                                                        );
                                                                    })
                                                                ) : (
                                                                    <tr>
                                                                        <td colSpan="4" className="text-center">No student attendance data found for this branch</td>
                                                                    </tr>
                                                                )}
                                                            </tbody>
                                                        </Table>
                                                    </div>
                                                </Accordion.Body>
                                            </Accordion.Item>
                                        ))}
                                    </Accordion>
                                ) : (
                                    /* For instructors - flat list with all batches */
                                    <>
                                        <div className="d-flex justify-content-between align-items-center mb-3">
                                            <h5>All Batches</h5>
                                            <Dropdown>
                                                <Dropdown.Toggle variant="outline-secondary" size="sm">
                                                    Sort
                                                </Dropdown.Toggle>
                                                <Dropdown.Menu>
                                                    <Dropdown.Item
                                                        onClick={() => handleSortChange(date, userBranch, 'name', 'asc')}
                                                        active={sortOptions[`${date}-${userBranch}`]?.field === 'name' && sortOptions[`${date}-${userBranch}`]?.direction === 'asc'}
                                                    >
                                                        Name (A-Z)
                                                    </Dropdown.Item>
                                                    <Dropdown.Item
                                                        onClick={() => handleSortChange(date, userBranch, 'name', 'desc')}
                                                        active={sortOptions[`${date}-${userBranch}`]?.field === 'name' && sortOptions[`${date}-${userBranch}`]?.direction === 'desc'}
                                                    >
                                                        Name (Z-A)
                                                    </Dropdown.Item>
                                                    <Dropdown.Divider />
                                                    <Dropdown.Item
                                                        onClick={() => handleSortChange(date, userBranch, 'batch', 'asc')}
                                                        active={sortOptions[`${date}-${userBranch}`]?.field === 'batch' && sortOptions[`${date}-${userBranch}`]?.direction === 'asc'}
                                                    >
                                                        Batch (Low to High)
                                                    </Dropdown.Item>
                                                    <Dropdown.Item
                                                        onClick={() => handleSortChange(date, userBranch, 'batch', 'desc')}
                                                        active={sortOptions[`${date}-${userBranch}`]?.field === 'batch' && sortOptions[`${date}-${userBranch}`]?.direction === 'desc'}
                                                    >
                                                        Batch (High to Low)
                                                    </Dropdown.Item>
                                                    <Dropdown.Divider />
                                                    <Dropdown.Item
                                                        onClick={() => handleSortChange(date, userBranch, 'belt', 'asc')}
                                                        active={sortOptions[`${date}-${userBranch}`]?.field === 'belt' && sortOptions[`${date}-${userBranch}`]?.direction === 'asc'}
                                                    >
                                                        Belt (High to Low)
                                                    </Dropdown.Item>
                                                    <Dropdown.Item
                                                        onClick={() => handleSortChange(date, userBranch, 'belt', 'desc')}
                                                        active={sortOptions[`${date}-${userBranch}`]?.field === 'belt' && sortOptions[`${date}-${userBranch}`]?.direction === 'desc'}
                                                    >
                                                        Belt (Low to High)
                                                    </Dropdown.Item>
                                                    <Dropdown.Divider />
                                                    <Dropdown.Item
                                                        onClick={() => handleSortChange(date, userBranch, 'status', 'asc')}
                                                        active={sortOptions[`${date}-${userBranch}`]?.field === 'status' && sortOptions[`${date}-${userBranch}`]?.direction === 'asc'}
                                                    >
                                                        Status (Absent First)
                                                    </Dropdown.Item>
                                                    <Dropdown.Item
                                                        onClick={() => handleSortChange(date, userBranch, 'status', 'desc')}
                                                        active={sortOptions[`${date}-${userBranch}`]?.field === 'status' && sortOptions[`${date}-${userBranch}`]?.direction === 'desc'}
                                                    >
                                                        Status (Present First)
                                                    </Dropdown.Item>
                                                </Dropdown.Menu>
                                            </Dropdown>
                                        </div>

                                        <div className="table-responsive mt-3">
                                            <Table bordered hover className="attendance-table">
                                                <thead className="table-light">
                                                    <tr>
                                                        <th>Name</th>
                                                        <th>Batch</th>
                                                        <th>Belt</th>
                                                        <th>Status</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {recordsByDate[date].branches[userBranch] &&
                                                        recordsByDate[date].branches[userBranch].reduce((allStudents, record) => {
                                                            if (record.students && Array.isArray(record.students)) {
                                                                return [...allStudents, ...record.students];
                                                            }
                                                            return allStudents;
                                                        }, []).length > 0 ? (
                                                        getSortedStudents(
                                                            getFilteredStudents(
                                                                recordsByDate[date].branches[userBranch].reduce((allStudents, record) => {
                                                                    if (record.students && Array.isArray(record.students)) {
                                                                        return [...allStudents, ...record.students];
                                                                    }
                                                                    return allStudents;
                                                                }, [])
                                                            ),
                                                            date,
                                                            userBranch
                                                        ).map(student => {
                                                            const belt = student.belt || student.studentBelt || '';
                                                            const beltStyle = getBeltStyle(belt);
                                                            const studentName = student.name || student.studentName || 'No Name';
                                                            const isPresent = student.present;
                                                            const studentId = student.id || student.studentId;
                                                            const batchNumber = student.batch || 'Unknown';

                                                            return (
                                                                <tr key={studentId} className={getRowClass(isPresent)}>
                                                                    <td>{studentName}</td>
                                                                    <td className="text-center">Batch {batchNumber}</td>
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
                                                                    <td className="text-center">
                                                                        <div className={`status-badge ${isPresent ? 'present' : 'absent'}`}>
                                                                            {isPresent ? 'Present' : 'Absent'}
                                                                        </div>
                                                                    </td>
                                                                </tr>
                                                            );
                                                        })
                                                    ) : (
                                                        <tr>
                                                            <td colSpan="4" className="text-center">No student attendance data found for this date</td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </Table>
                                        </div>
                                    </>
                                )}
                            </Accordion.Body>
                        </Accordion.Item>
                    ))}
                </Accordion>
            )}
        </div>
    );
} 