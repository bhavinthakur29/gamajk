import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Card, Button, Form, Alert, Table, Row, Col, Modal, Spinner } from 'react-bootstrap';
import { FaPlus, FaEdit, FaTrash, FaSave, FaTimes } from 'react-icons/fa';
// import './AdminBranches.css';

export default function AdminBranches() {
    const [branches, setBranches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({
        name: '',
        address: '',
        handledBy: '',
        numBatches: '',
        timings: '',
        operationalDays: ''
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [showModal, setShowModal] = useState(false);
    const [selectedBranch, setSelectedBranch] = useState(null);
    const [editMode, setEditMode] = useState(false);
    const [editForm, setEditForm] = useState({});
    const [editError, setEditError] = useState('');
    const [editSuccess, setEditSuccess] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [deleteSuccess, setDeleteSuccess] = useState('');
    const [deleting, setDeleting] = useState(false);
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        const fetchBranches = async () => {
            setLoading(true);
            try {
                const branchSnapshot = await getDocs(collection(db, 'branches'));
                setBranches(branchSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch (err) {
                setError('Failed to fetch branches: ' + err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchBranches();
    }, [success, editSuccess, deleteSuccess]);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleAddBranch = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        if (!form.name.trim()) {
            setError('Branch name is required');
            return;
        }
        try {
            setSubmitting(true);
            await addDoc(collection(db, 'branches'), {
                name: form.name.trim(),
                address: form.address.trim(),
                handledBy: form.handledBy.trim(),
                numBatches: form.numBatches.trim(),
                timings: form.timings.trim(),
                operationalDays: form.operationalDays.trim()
            });
            setSuccess('Branch added successfully!');
            setForm({ name: '', address: '', handledBy: '', numBatches: '', timings: '', operationalDays: '' });
        } catch (err) {
            setError('Failed to add branch: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleRowClick = (branch) => {
        setSelectedBranch(branch);
        setShowModal(true);
        setEditMode(false);
        setEditForm({
            name: branch.name || "",
            address: branch.address || "",
            handledBy: branch.handledBy || "",
            numBatches: branch.numBatches || "",
            timings: branch.timings || "",
            operationalDays: branch.operationalDays || ""
        });
        setEditError('');
        setEditSuccess('');
    };

    const handleEditChange = (e) => {
        setEditForm({ ...editForm, [e.target.name]: e.target.value });
    };

    const handleEditSave = async () => {
        setEditError('');
        setEditSuccess('');
        if (!editForm.name.trim()) {
            setEditError('Branch name is required');
            return;
        }
        try {
            setSubmitting(true);
            await updateDoc(doc(db, 'branches', selectedBranch.id), {
                name: editForm.name.trim(),
                address: editForm.address.trim(),
                handledBy: editForm.handledBy.trim(),
                numBatches: editForm.numBatches.trim(),
                timings: editForm.timings.trim(),
                operationalDays: editForm.operationalDays.trim()
            });
            setEditSuccess('Branch updated successfully!');
            setEditMode(false);
            setSelectedBranch({ ...selectedBranch, ...editForm });
        } catch (err) {
            console.error('Failed to update branch:', err);
            setEditError('Failed to update branch: ' + (err && err.message ? err.message : String(err)));
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteBranch = async () => {
        if (!selectedBranch) return;
        if (!window.confirm(`Are you sure you want to delete the branch "${selectedBranch.name}"? This action cannot be undone.`)) return;
        setDeleting(true);
        setDeleteError('');
        setDeleteSuccess('');
        try {
            await deleteDoc(doc(db, 'branches', selectedBranch.id));
            setDeleteSuccess('Branch deleted successfully!');
            setShowModal(false);
        } catch (err) {
            setDeleteError('Failed to delete branch: ' + (err && err.message ? err.message : String(err)));
        } finally {
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="text-center my-5">
                <Spinner animation="border" role="status" variant="primary">
                    <span className="visually-hidden">Loading...</span>
                </Spinner>
                <p className="mt-2">Loading branches...</p>
            </div>
        );
    }

    return (
        <div className="branches-container">
            <Card className="mb-4">
                <Card.Header className="bg-light">
                    <h4 className="mb-0">Branches</h4>
                </Card.Header>
                <Card.Body>
                    {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
                    {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}

                    <Form onSubmit={handleAddBranch} className="branch-form">
                        <h5 className="mb-3">Add New Branch</h5>
                        <Row className="g-3">
                            <Col xs={12} md={6}>
                                <Form.Group controlId="branchName">
                                    <Form.Label>Branch Name <span className="text-danger">*</span></Form.Label>
                                    <Form.Control
                                        name="name"
                                        value={form.name || ""}
                                        onChange={handleChange}
                                        required
                                        placeholder="Enter branch name"
                                    />
                                </Form.Group>
                            </Col>
                            <Col xs={12} md={6}>
                                <Form.Group controlId="branchAddress">
                                    <Form.Label>Branch Address</Form.Label>
                                    <Form.Control
                                        name="address"
                                        value={form.address || ""}
                                        onChange={handleChange}
                                        placeholder="Enter branch address"
                                    />
                                </Form.Group>
                            </Col>
                            <Col xs={12} md={4}>
                                <Form.Group controlId="handledBy">
                                    <Form.Label>Handled By</Form.Label>
                                    <Form.Control
                                        name="handledBy"
                                        value={form.handledBy || ""}
                                        onChange={handleChange}
                                        placeholder="Enter manager name"
                                    />
                                </Form.Group>
                            </Col>
                            <Col xs={12} md={4}>
                                <Form.Group controlId="numBatches">
                                    <Form.Label>No. of Batches</Form.Label>
                                    <Form.Control
                                        name="numBatches"
                                        value={form.numBatches || ""}
                                        onChange={handleChange}
                                        type="number"
                                        placeholder="Enter number of batches"
                                    />
                                </Form.Group>
                            </Col>
                            <Col xs={12} md={4}>
                                <Form.Group controlId="timings">
                                    <Form.Label>Timings</Form.Label>
                                    <Form.Control
                                        name="timings"
                                        value={form.timings || ""}
                                        onChange={handleChange}
                                        placeholder="E.g., 9AM-6PM"
                                    />
                                </Form.Group>
                            </Col>
                            <Col xs={12}>
                                <Form.Group controlId="operationalDays">
                                    <Form.Label>Operational Days</Form.Label>
                                    <Form.Control
                                        name="operationalDays"
                                        value={form.operationalDays || ""}
                                        onChange={handleChange}
                                        placeholder="E.g., Monday-Friday"
                                    />
                                </Form.Group>
                            </Col>
                            <Col xs={12} className="mt-3">
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="add-branch-btn"
                                    disabled={submitting}
                                >
                                    {submitting ? (
                                        <>
                                            <Spinner animation="border" size="sm" className="me-2" />
                                            Adding...
                                        </>
                                    ) : (
                                        <>
                                            <FaPlus className="me-2" />
                                            Add Branch
                                        </>
                                    )}
                                </Button>
                            </Col>
                        </Row>
                    </Form>
                </Card.Body>
            </Card>

            <Card>
                <Card.Header className="bg-light">
                    <h5 className="mb-0">Branch List</h5>
                </Card.Header>
                <Card.Body className="p-0">
                    <div className="table-responsive">
                        <Table hover className="branch-table mb-0">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Name</th>
                                    <th>Handled By</th>
                                    <th>Action</th>
                                </tr>
                            </thead>
                            <tbody>
                                {branches.length === 0 ? (
                                    <tr>
                                        <td colSpan="4" className="text-center py-4">No branches found</td>
                                    </tr>
                                ) : (
                                    branches.map((branch, idx) => (
                                        <tr key={branch.id}>
                                            <td>{idx + 1}</td>
                                            <td>{branch.name}</td>
                                            <td>{branch.handledBy || '-'}</td>
                                            <td>
                                                <Button
                                                    variant="outline-primary"
                                                    size="sm"
                                                    onClick={() => handleRowClick(branch)}
                                                    className="action-btn"
                                                >
                                                    <FaEdit /> View
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </Table>
                    </div>
                </Card.Body>
            </Card>

            {/* Branch Details Modal */}
            <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                <Modal.Header closeButton>
                    <Modal.Title>
                        {editMode ? 'Edit Branch' : 'Branch Details'}
                    </Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {deleteError && <Alert variant="danger" onClose={() => setDeleteError('')} dismissible>{deleteError}</Alert>}
                    {deleteSuccess && <Alert variant="success" onClose={() => setDeleteSuccess('')} dismissible>{deleteSuccess}</Alert>}
                    {selectedBranch && !editMode && (
                        <div className="branch-details">
                            <p><strong>Name:</strong> {selectedBranch.name}</p>
                            <p><strong>Address:</strong> {selectedBranch.address || '-'}</p>
                            <p><strong>Handled By:</strong> {selectedBranch.handledBy || '-'}</p>
                            <p><strong>No. of Batches:</strong> {selectedBranch.numBatches || '-'}</p>
                            <p><strong>Timings:</strong> {selectedBranch.timings || '-'}</p>
                            <p><strong>Operational Days:</strong> {selectedBranch.operationalDays || '-'}</p>
                        </div>
                    )}
                    {selectedBranch && editMode && (
                        <Form>
                            {editError && <Alert variant="danger" onClose={() => setEditError('')} dismissible>{editError}</Alert>}
                            {editSuccess && <Alert variant="success" onClose={() => setEditSuccess('')} dismissible>{editSuccess}</Alert>}
                            <Form.Group className="mb-3">
                                <Form.Label>Branch Name <span className="text-danger">*</span></Form.Label>
                                <Form.Control name="name" value={editForm.name || ""} onChange={handleEditChange} required />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Branch Address</Form.Label>
                                <Form.Control name="address" value={editForm.address || ""} onChange={handleEditChange} />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Handled By</Form.Label>
                                <Form.Control name="handledBy" value={editForm.handledBy || ""} onChange={handleEditChange} />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>No. of Batches</Form.Label>
                                <Form.Control name="numBatches" value={editForm.numBatches || ""} type="number" onChange={handleEditChange} />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Timings</Form.Label>
                                <Form.Control name="timings" value={editForm.timings || ""} onChange={handleEditChange} />
                            </Form.Group>
                            <Form.Group className="mb-3">
                                <Form.Label>Operational Days</Form.Label>
                                <Form.Control name="operationalDays" value={editForm.operationalDays || ""} onChange={handleEditChange} />
                            </Form.Group>
                        </Form>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    {!editMode ? (
                        <>
                            <Button
                                variant="danger"
                                onClick={handleDeleteBranch}
                                disabled={deleting}
                                className="action-btn"
                            >
                                {deleting ? <Spinner animation="border" size="sm" /> : <FaTrash className="me-1" />}
                                {deleting ? 'Deleting...' : 'Delete'}
                            </Button>
                            <Button
                                variant="primary"
                                onClick={() => setEditMode(true)}
                                className="action-btn"
                            >
                                <FaEdit className="me-1" /> Edit
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button
                                variant="secondary"
                                onClick={() => setEditMode(false)}
                                className="action-btn"
                            >
                                <FaTimes className="me-1" /> Cancel
                            </Button>
                            <Button
                                variant="success"
                                onClick={handleEditSave}
                                disabled={submitting}
                                className="action-btn"
                            >
                                {submitting ? <Spinner animation="border" size="sm" className="me-1" /> : <FaSave className="me-1" />}
                                {submitting ? 'Saving...' : 'Save Changes'}
                            </Button>
                        </>
                    )}
                </Modal.Footer>
            </Modal>
        </div>
    );
} 