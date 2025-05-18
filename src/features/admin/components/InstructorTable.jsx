import React, { useState } from 'react';
import { Table, Form, Button, Spinner, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { FaEdit, FaSave, FaTimes, FaTrash, FaInfoCircle } from 'react-icons/fa';
import { BELT_OPTIONS, BRANCH_OPTIONS } from '../../../utils/constants';

const InstructorTable = ({
    instructors = [],
    branches = BRANCH_OPTIONS,
    onSave,
    onDelete,
    isDeleting = false
}) => {
    const [editRowId, setEditRowId] = useState(null);
    const [editRowData, setEditRowData] = useState({});
    const [editError, setEditError] = useState('');
    const [editLoading, setEditLoading] = useState(false);

    const handleEditClick = (inst) => {
        setEditRowId(inst.id);
        setEditRowData({ ...inst });
        setEditError('');
    };

    const handleEditChange = (e) => {
        setEditRowData({ ...editRowData, [e.target.name]: e.target.value });
    };

    const handleEditCancel = () => {
        setEditRowId(null);
        setEditRowData({});
        setEditError('');
    };

    const handleEditSave = async () => {
        setEditLoading(true);
        setEditError('');
        try {
            await onSave(editRowId, editRowData);
            setEditRowId(null);
            setEditRowData({});
        } catch (err) {
            setEditError('Failed to update: ' + (err.message || err));
        } finally {
            setEditLoading(false);
        }
    };

    if (instructors.length === 0) {
        return <p className="text-center py-4">No instructors found.</p>;
    }

    return (
        <div className="table-responsive">
            <Table hover striped className="align-middle">
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Branch</th>
                        <th>Belt</th>
                        <th>Contact</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    {instructors.map(instructor => (
                        <tr key={instructor.id}>
                            {editRowId === instructor.id ? (
                                // Edit mode row
                                <>
                                    <td>
                                        <Form.Control
                                            type="text"
                                            name="fullName"
                                            value={editRowData.fullName || ''}
                                            onChange={handleEditChange}
                                            size="sm"
                                        />
                                    </td>
                                    <td>
                                        <Form.Control
                                            type="email"
                                            name="email"
                                            value={editRowData.email || ''}
                                            onChange={handleEditChange}
                                            size="sm"
                                        />
                                    </td>
                                    <td>
                                        <Form.Select
                                            name="branch"
                                            value={editRowData.branch || ''}
                                            onChange={handleEditChange}
                                            size="sm"
                                        >
                                            <option value="">Select Branch</option>
                                            {branches.map(branch => (
                                                <option key={branch} value={branch}>{branch}</option>
                                            ))}
                                        </Form.Select>
                                    </td>
                                    <td>
                                        <Form.Select
                                            name="belt"
                                            value={editRowData.belt || ''}
                                            onChange={handleEditChange}
                                            size="sm"
                                        >
                                            <option value="">Select Belt</option>
                                            {BELT_OPTIONS.map(belt => (
                                                <option key={belt} value={belt}>{belt}</option>
                                            ))}
                                        </Form.Select>
                                    </td>
                                    <td>
                                        <Form.Control
                                            type="tel"
                                            name="contactNumber"
                                            value={editRowData.contactNumber || ''}
                                            onChange={handleEditChange}
                                            size="sm"
                                        />
                                    </td>
                                    <td className="d-flex gap-1">
                                        <Button
                                            variant="success"
                                            size="sm"
                                            onClick={handleEditSave}
                                            disabled={editLoading}
                                        >
                                            {editLoading ? <Spinner animation="border" size="sm" /> : <FaSave />}
                                        </Button>
                                        <Button
                                            variant="outline-secondary"
                                            size="sm"
                                            onClick={handleEditCancel}
                                        >
                                            <FaTimes />
                                        </Button>
                                        {editError && (
                                            <OverlayTrigger
                                                placement="top"
                                                overlay={<Tooltip>{editError}</Tooltip>}
                                            >
                                                <span className="text-danger ms-2">
                                                    <FaInfoCircle />
                                                </span>
                                            </OverlayTrigger>
                                        )}
                                    </td>
                                </>
                            ) : (
                                // Normal row
                                <>
                                    <td>{instructor.fullName}</td>
                                    <td>{instructor.email}</td>
                                    <td>{instructor.branch}</td>
                                    <td>{instructor.belt}</td>
                                    <td>{instructor.contactNumber || '-'}</td>
                                    <td className="d-flex gap-1">
                                        <Button
                                            variant="outline-primary"
                                            size="sm"
                                            onClick={() => handleEditClick(instructor)}
                                        >
                                            <FaEdit />
                                        </Button>
                                        <Button
                                            variant="outline-danger"
                                            size="sm"
                                            onClick={() => onDelete(instructor.id)}
                                            disabled={isDeleting}
                                        >
                                            <FaTrash />
                                        </Button>
                                    </td>
                                </>
                            )}
                        </tr>
                    ))}
                </tbody>
            </Table>
        </div>
    );
};

export default InstructorTable; 