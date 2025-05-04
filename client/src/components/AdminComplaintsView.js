import React, { useState, useEffect } from 'react';
import { getComplaints, updateComplaintStatus } from '../services/api';

function AdminComplaintsView() {
    const [complaints, setComplaints] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchComplaints = async () => {
            try {
                const response = await getComplaints();
                setComplaints(response.data.data);
                setLoading(false);
            } catch (err) {
                setError('Failed to load complaints');
                setLoading(false);
            }
        };

        fetchComplaints();
    }, []);

    const handleStatusUpdate = async (complaintId, newStatus) => {
        try {
            const response = await updateComplaintStatus(complaintId, { status: newStatus });
            if (response.data.success) {
                setComplaints(complaints.map(complaint => 
                    complaint._id === complaintId 
                        ? { ...complaint, status: newStatus }
                        : complaint
                ));
                setError(null);
            } else {
                setError(response.data.message || 'Failed to update complaint status');
            }
        } catch (err) {
            console.error('Error updating complaint status:', err);
            setError(err.response?.data?.message || 'Failed to update complaint status');
        }
    };

    if (loading) return <div>Loading complaints...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div style={{ padding: '1rem' }}>
            <h2 style={{ marginBottom: '1rem' }}>Complaints Management</h2>
            <div>
                {complaints.map(complaint => (
                    <div key={complaint._id} style={{
                        border: '1px solid #ccc',
                        borderRadius: '8px',
                        padding: '1rem',
                        marginBottom: '1rem',
                        backgroundColor: '#f9f9f9'
                    }}>
                        <div style={{ marginBottom: '0.5rem' }}>
                            <strong>Message Sender:</strong> {complaint.senderEmail}
                        </div>
                        <div style={{ marginBottom: '0.5rem' }}>
                            <strong>Complainer:</strong> {complaint.complainerEmail}
                        </div>
                        <div style={{ marginBottom: '0.5rem' }}>
                            <strong>Reported Message:</strong>
                            <div style={{
                                backgroundColor: '#f0f0f0',
                                padding: '0.5rem',
                                borderRadius: '4px',
                                marginTop: '0.25rem'
                            }}>
                                {complaint.messageContent}
                            </div>
                        </div>
                        <div style={{ marginBottom: '0.5rem' }}>
                            <strong>Description:</strong> {complaint.description}
                        </div>
                        <div style={{ marginBottom: '0.5rem' }}>
                            <strong>Status:</strong> {complaint.status}
                        </div>
                        <div style={{ marginBottom: '0.5rem' }}>
                            <strong>Actions:</strong>
                            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                                <button
                                    onClick={() => handleStatusUpdate(complaint._id, 'reviewed')}
                                    disabled={complaint.status === 'reviewed'}
                                    style={{
                                        padding: '0.25rem 0.5rem',
                                        border: 'none',
                                        background: '#007bff',
                                        color: 'white',
                                        cursor: 'pointer',
                                        borderRadius: '4px',
                                        opacity: complaint.status === 'reviewed' ? 0.5 : 1
                                    }}
                                >
                                    Mark as Reviewed
                                </button>
                                <button
                                    onClick={() => handleStatusUpdate(complaint._id, 'resolved')}
                                    disabled={complaint.status === 'resolved'}
                                    style={{
                                        padding: '0.25rem 0.5rem',
                                        border: 'none',
                                        background: '#28a745',
                                        color: 'white',
                                        cursor: 'pointer',
                                        borderRadius: '4px',
                                        opacity: complaint.status === 'resolved' ? 0.5 : 1
                                    }}
                                >
                                    Mark as Resolved
                                </button>
                            </div>
                        </div>
                        <div style={{ color: '#666', fontSize: '0.9rem' }}>
                            Reported on: {new Date(complaint.createdAt).toLocaleString()}
                        </div>
                    </div>
                ))}
                {complaints.length === 0 && (
                    <p>No complaints found.</p>
                )}
            </div>
        </div>
    );
}

export default AdminComplaintsView; 