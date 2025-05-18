import React, { useState, useEffect } from 'react';
import { Button, Form, Card, Row, Col, Alert, Spinner } from 'react-bootstrap';
import { FaFileExport, FaFileCsv, FaFileExcel, FaCalendarAlt, FaSync } from 'react-icons/fa';
import { attendanceService } from '../../services/firebaseService';
import { BRANCH_OPTIONS } from '../../utils/constants';
import { useAuth } from '../../contexts/AuthContext';

const AttendanceExport = ({ branchFilter }) => {
    const [loading, setLoading] = useState(false);
    const [refreshing, setRefreshing] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [exportFormat, setExportFormat] = useState('csv');
    const [selectedMonth, setSelectedMonth] = useState('');
    const [branch, setBranch] = useState(branchFilter || 'All');
    const [availableMonths, setAvailableMonths] = useState([]);
    const { userRole, userBranch } = useAuth();

    // Fetch available months from the attendance records
    const fetchAvailableMonths = async (forceRefresh = false) => {
        try {
            if (forceRefresh) {
                setRefreshing(true);
                setError('');
                setSuccess('');
            }

            // For instructors, always use their branch
            const branchToUse = userRole === 'admin' ? (branch !== 'All' ? branch : null) : userBranch;

            const records = await attendanceService.getAttendanceRecords(branchToUse, null, null, forceRefresh);

            // Extract unique months from records
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

            // Set the most recent month as default if available
            if (sortedMonths.length > 0 && !selectedMonth) {
                setSelectedMonth(sortedMonths[0]);
            }

            if (forceRefresh) {
                setSuccess('Data refreshed successfully!');
            }
        } catch (err) {
            console.error('Error fetching available months:', err);
            if (forceRefresh) {
                setError('Error refreshing data: ' + err.message);
            }
        } finally {
            if (forceRefresh) {
                setRefreshing(false);
            }
        }
    };

    const handleRefresh = () => {
        fetchAvailableMonths(true);
    };

    useEffect(() => {
        fetchAvailableMonths();
    }, [branch, userRole, userBranch]);

    const handleExport = async () => {
        setError('');
        setSuccess('');

        if (!selectedMonth) {
            setError('Please select a month');
            return;
        }

        try {
            setLoading(true);

            // Calculate start and end dates based on the selected month
            const year = parseInt(selectedMonth.split('-')[0]);
            const month = parseInt(selectedMonth.split('-')[1]) - 1; // JS months are 0-indexed

            const startDate = new Date(year, month, 1).toISOString().split('T')[0];
            const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]; // Last day of month

            // For instructors, always use their branch
            const branchToUse = userRole === 'admin' ? (branch !== 'All' ? branch : null) : userBranch;

            // Fetch attendance records for the selected month and branch
            const records = await attendanceService.getAttendanceRecords(
                branchToUse,
                startDate,
                endDate,
                true
            );

            if (records.length === 0) {
                setError('No attendance records found for the selected month');
                return;
            }

            // Process the data for export
            const processedData = processAttendanceData(records);

            // Generate file based on selected format
            if (exportFormat === 'csv') {
                generateCSV(processedData);
            } else {
                generateExcel(processedData);
            }

            setSuccess(`Attendance data for ${formatMonthName(selectedMonth)} exported successfully in ${exportFormat.toUpperCase()} format`);
        } catch (err) {
            console.error('Error exporting attendance data:', err);
            setError('Failed to export attendance data: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    // Format month as "Month YYYY"
    const formatMonthName = (monthStr) => {
        if (!monthStr) return '';
        const date = new Date(monthStr + '-01');
        return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    };

    // Process attendance data for export
    const processAttendanceData = (records) => {
        // Group students by date and batch
        const groupedData = {};

        records.forEach(record => {
            const date = record.date;
            const batch = record.batch;
            const branch = record.branch;

            if (!groupedData[date]) {
                groupedData[date] = {};
            }

            if (!groupedData[date][batch]) {
                groupedData[date][batch] = {
                    branch,
                    students: []
                };
            }

            // Add students with attendance status
            if (record.students && Array.isArray(record.students)) {
                groupedData[date][batch].students = record.students.map(student => ({
                    id: student.id || student.studentId,
                    name: student.name || student.studentName,
                    present: typeof student.present === 'boolean' ? student.present : false,
                    belt: student.belt || student.studentBelt
                }));
            }
        });

        // Flatten the data for export
        const flatData = [];

        Object.entries(groupedData).forEach(([date, batches]) => {
            Object.entries(batches).forEach(([batch, data]) => {
                data.students.forEach(student => {
                    flatData.push({
                        date,
                        batch,
                        branch: data.branch,
                        studentId: student.id,
                        studentName: student.name,
                        studentBelt: student.belt,
                        status: student.present ? 'Present' : 'Absent'
                    });
                });
            });
        });

        return flatData;
    };

    // Generate and download CSV file
    const generateCSV = (data) => {
        // Header row
        const headers = ['Date', 'Batch', 'Branch', 'Student ID', 'Student Name', 'Belt', 'Status'];

        // Generate CSV content
        let csvContent = headers.join(',') + '\r\n';

        data.forEach(row => {
            const values = [
                row.date,
                row.batch,
                row.branch,
                row.studentId,
                `"${row.studentName}"`, // Quote names in case they contain commas
                row.studentBelt,
                row.status
            ];

            csvContent += values.join(',') + '\r\n';
        });

        // Create and download file
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `attendance_${selectedMonth}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    // Generate and download Excel file using CSV as base
    // For a more sophisticated Excel export, consider using a library like xlsx or exceljs
    const generateExcel = (data) => {
        // For this implementation, we'll actually generate a CSV with the .xlsx extension
        // A proper Excel file would require additional libraries

        // Header row
        const headers = ['Date', 'Batch', 'Branch', 'Student ID', 'Student Name', 'Belt', 'Status'];

        // Generate CSV content (Excel compatible)
        let csvContent = headers.join(',') + '\r\n';

        data.forEach(row => {
            const values = [
                row.date,
                row.batch,
                row.branch,
                row.studentId,
                `"${row.studentName}"`,
                row.studentBelt,
                row.status
            ];

            csvContent += values.join(',') + '\r\n';
        });

        // Create and download file with xlsx extension
        const blob = new Blob([csvContent], { type: 'application/vnd.ms-excel' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `attendance_${selectedMonth}.xlsx`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Card className="shadow-sm mb-4">
            <Card.Header className="bg-light">
                <div className="d-flex align-items-center">
                    <FaFileExport className="me-2 text-primary" />
                    <h5 className="mb-0">Export Attendance Records</h5>
                </div>
            </Card.Header>
            <Card.Body>
                <Row>
                    <Col md={6} className="mb-3">
                        <Form.Group>
                            <Form.Label>
                                <FaCalendarAlt className="me-2" />
                                Select Month
                            </Form.Label>
                            <Form.Select
                                value={selectedMonth}
                                onChange={(e) => setSelectedMonth(e.target.value)}
                                required
                            >
                                <option value="">Select a month</option>
                                {availableMonths.map(month => (
                                    <option key={month} value={month}>
                                        {formatMonthName(month)}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    {userRole === 'admin' && (
                        <Col md={6} className="mb-3">
                            <Form.Group>
                                <Form.Label>Branch</Form.Label>
                                <Form.Select
                                    value={branch}
                                    onChange={(e) => setBranch(e.target.value)}
                                >
                                    <option value="All">All Branches</option>
                                    {Object.entries(BRANCH_OPTIONS).map(([value, label]) => (
                                        <option key={value} value={value}>
                                            {label}
                                        </option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </Col>
                    )}
                </Row>

                <Row className="mb-3">
                    <Col>
                        <Form.Group>
                            <Form.Label>Export Format</Form.Label>
                            <div className="d-flex gap-3">
                                <Form.Check
                                    type="radio"
                                    id="format-csv"
                                    label={<><FaFileCsv className="me-1" /> CSV</>}
                                    name="exportFormat"
                                    value="csv"
                                    checked={exportFormat === 'csv'}
                                    onChange={() => setExportFormat('csv')}
                                />
                                <Form.Check
                                    type="radio"
                                    id="format-excel"
                                    label={<><FaFileExcel className="me-1" /> Excel</>}
                                    name="exportFormat"
                                    value="excel"
                                    checked={exportFormat === 'excel'}
                                    onChange={() => setExportFormat('excel')}
                                />
                            </div>
                        </Form.Group>
                    </Col>
                </Row>

                {error && (
                    <Alert variant="danger" className="mb-3">
                        {error}
                    </Alert>
                )}

                {success && (
                    <Alert variant="success" className="mb-3">
                        {success}
                    </Alert>
                )}

                <div className="d-grid">
                    <Button
                        variant="primary"
                        onClick={handleExport}
                        disabled={loading || !selectedMonth}
                    >
                        {loading ? (
                            <>
                                <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                    className="me-2"
                                />
                                Exporting...
                            </>
                        ) : (
                            <>
                                <FaFileExport className="me-2" />
                                Export Attendance
                            </>
                        )}
                    </Button>
                </div>
            </Card.Body>
        </Card>
    );
};

export default AttendanceExport; 