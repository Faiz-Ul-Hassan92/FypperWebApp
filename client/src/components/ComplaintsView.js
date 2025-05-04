import React, { useState, useEffect } from 'react';
import { getUserComplaints } from '../services/api';
import { useAuth } from '../context/AuthContext';

function ComplaintsView() {
    const { user } = useAuth();
    const [complaints, setComplaints] = useState({ sent: [], received: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [activeTab, setActiveTab] = useState('sent');

    useEffect(() => {
        const fetchComplaints = async () => {
            try {
                const response = await getUserComplaints();
                setComplaints(response.data.data);
                setLoading(false);
            } catch (err) {
                setError('Failed to load complaints');
                setLoading(false);
            }
        };

        fetchComplaints();
    }, []);

    if (loading) return <div>Loading complaints...</div>;
    if (error) return <div className="error-message">{error}</div>;

    return (
        <div style={{ padding: '1rem' }}>
            <div style={{ 
                display: 'flex', 
                gap: '1rem', 
                marginBottom: '1rem',
                borderBottom: '1px solid #ccc',
                paddingBottom: '0.5rem'
            }}>
                <button
                    onClick={() => setActiveTab('sent')}
                    style={{
                        padding: '0.5rem 1rem',
                        border: 'none',
                        background: activeTab === 'sent' ? '#007bff' : 'transparent',
                        color: activeTab === 'sent' ? 'white' : 'black',
                        cursor: 'pointer',
                        borderRadius: '4px'
                    }}
                >
                    Complaints Sent
                </button>
                <button
                    onClick={() => setActiveTab('received')}
                    style={{
                        padding: '0.5rem 1rem',
                        border: 'none',
                        background: activeTab === 'received' ? '#007bff' : 'transparent',
                        color: activeTab === 'received' ? 'white' : 'black',
                        cursor: 'pointer',
                        borderRadius: '4px'
                    }}
                >
                    Complaints Against Me
                </button>
            </div>

            <div>
                {(activeTab === 'sent' ? complaints.sent : complaints.received).map(complaint => (
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
                        <div style={{ color: '#666', fontSize: '0.9rem' }}>
                            Reported on: {new Date(complaint.createdAt).toLocaleString()}
                        </div>
                    </div>
                ))}
                {(activeTab === 'sent' ? complaints.sent : complaints.received).length === 0 && (
                    <p>No {activeTab === 'sent' ? 'sent' : 'received'} complaints found.</p>
                )}
            </div>
        </div>
    );
}

export default ComplaintsView; 