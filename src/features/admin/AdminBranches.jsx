import { useState, useEffect } from 'react';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db } from '../../firebase';
import { Card, Button, Form, Alert, Table, Row, Col, Modal } from 'react-bootstrap';

export default function AdminBranches() {
    const [branches, setBranches] = useState([]);
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

    useEffect(() => {
        const fetchBranches = async () => {
            const branchSnapshot = await getDocs(collection(db, 'branches'));
            setBranches(branchSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        };
        fetchBranches();
    }, [success, editSuccess]);

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
            setError('Failed to add branch');
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

    return (
        <Card>
            <Card.Body>
                <h3>Branches</h3>
                {error && <Alert variant="danger">{error}</Alert>}
                {success && <Alert variant="success">{success}</Alert>}
                <Form onSubmit={handleAddBranch} className="mb-4">
                    <Row>
                        <Col md={6} className="mb-2">
                            <Form.Group>
                                <Form.Label>Branch Name</Form.Label>
                                <Form.Control name="name" value={form.name || ""} onChange={handleChange} required />
                            </Form.Group>
                        </Col>
                        <Col md={6} className="mb-2">
                            <Form.Group>
                                <Form.Label>Branch Address</Form.Label>
                                <Form.Control name="address" value={form.address || ""} onChange={handleChange} />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={4} className="mb-2">
                            <Form.Group>
                                <Form.Label>Handled By</Form.Label>
                                <Form.Control name="handledBy" value={form.handledBy || ""} onChange={handleChange} />
                            </Form.Group>
                        </Col>
                        <Col md={4} className="mb-2">
                            <Form.Group>
                                <Form.Label>No. of Batches</Form.Label>
                                <Form.Control name="numBatches" value={form.numBatches || ""} onChange={handleChange} />
                            </Form.Group>
                        </Col>
                        <Col md={4} className="mb-2">
                            <Form.Group>
                                <Form.Label>Timings</Form.Label>
                                <Form.Control name="timings" value={form.timings || ""} onChange={handleChange} />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Row>
                        <Col md={6} className="mb-2">
                            <Form.Group>
                                <Form.Label>Operational Days</Form.Label>
                                <Form.Control name="operationalDays" value={form.operationalDays || ""} onChange={handleChange} />
                            </Form.Group>
                        </Col>
                    </Row>
                    <Button type="submit">Add Branch</Button>
                </Form>
                <Table striped bordered hover size="sm" responsive>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Name</th>
                            <th>Handled By</th>
                        </tr>
                    </thead>
                    <tbody>
                        {branches.map((branch, idx) => (
                            <tr key={branch.id} style={{ cursor: 'pointer' }} onClick={() => handleRowClick(branch)}>
                                <td>{idx + 1}</td>
                                <td>{branch.name}</td>
                                <td>{branch.handledBy}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>

                {/* Branch Details Modal */}
                <Modal show={showModal} onHide={() => setShowModal(false)} centered>
                    <Modal.Header closeButton>
                        <Modal.Title>Branch Details</Modal.Title>
                    </Modal.Header>
                    <Modal.Body>
                        {deleteError && <Alert variant="danger">{deleteError}</Alert>}
                        {deleteSuccess && <Alert variant="success">{deleteSuccess}</Alert>}
                        {selectedBranch && !editMode && (
                            <div>
                                <p><strong>Name:</strong> {selectedBranch.name}</p>
                                <p><strong>Address:</strong> {selectedBranch.address}</p>
                                <p><strong>Handled By:</strong> {selectedBranch.handledBy}</p>
                                <p><strong>No. of Batches:</strong> {selectedBranch.numBatches}</p>
                                <p><strong>Timings:</strong> {selectedBranch.timings}</p>
                                <p><strong>Operational Days:</strong> {selectedBranch.operationalDays}</p>
                                <div className="d-flex gap-2 justify-content-end mt-3">
                                    <Button variant="danger" onClick={handleDeleteBranch} disabled={deleting}>
                                        {deleting ? 'Deleting...' : 'Delete'}
                                    </Button>
                                    <Button variant="primary" onClick={() => setEditMode(true)}>
                                        Edit
                                    </Button>
                                </div>
                            </div>
                        )}
                        {selectedBranch && editMode && (
                            <Form>
                                {editError && <Alert variant="danger">{editError}</Alert>}
                                {editSuccess && <Alert variant="success">{editSuccess}</Alert>}
                                <Form.Group className="mb-2">
                                    <Form.Label>Branch Name</Form.Label>
                                    <Form.Control name="name" value={editForm.name || ""} onChange={handleEditChange} required />
                                </Form.Group>
                                <Form.Group className="mb-2">
                                    <Form.Label>Branch Address</Form.Label>
                                    <Form.Control name="address" value={editForm.address || ""} onChange={handleEditChange} />
                                </Form.Group>
                                <Form.Group className="mb-2">
                                    <Form.Label>Handled By</Form.Label>
                                    <Form.Control name="handledBy" value={editForm.handledBy || ""} onChange={handleEditChange} />
                                </Form.Group>
                                <Form.Group className="mb-2">
                                    <Form.Label>No. of Batches</Form.Label>
                                    <Form.Control name="numBatches" value={editForm.numBatches || ""} onChange={handleEditChange} />
                                </Form.Group>
                                <Form.Group className="mb-2">
                                    <Form.Label>Timings</Form.Label>
                                    <Form.Control name="timings" value={editForm.timings || ""} onChange={handleEditChange} />
                                </Form.Group>
                                <Form.Group className="mb-2">
                                    <Form.Label>Operational Days</Form.Label>
                                    <Form.Control name="operationalDays" value={editForm.operationalDays || ""} onChange={handleEditChange} />
                                </Form.Group>
                                <div className="d-flex gap-2 justify-content-end">
                                    <Button variant="secondary" onClick={() => setEditMode(false)}>
                                        Cancel
                                    </Button>
                                    <Button variant="primary" onClick={handleEditSave}>
                                        Save Changes
                                    </Button>
                                </div>
                            </Form>
                        )}
                    </Modal.Body>
                </Modal>
            </Card.Body>
        </Card>
    );
} 