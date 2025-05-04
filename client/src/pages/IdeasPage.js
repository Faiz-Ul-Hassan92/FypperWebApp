import React, { useState, useEffect } from 'react';
import * as api from '../services/api';
import { useAuth } from '../context/AuthContext';

function IdeasPage() {
    const { user } = useAuth();
    const [ideas, setIdeas] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: ''
    });
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        fetchIdeas();
    }, []);

    const fetchIdeas = async () => {
        try {
            setLoading(true);
            const response = await api.getSupervisorIdeas();
            setIdeas(response.data.data || []);
            setError(null);
        } catch (err) {
            setError('Failed to fetch ideas');
            console.error('Error fetching ideas:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInputChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log('Form submitted with data:', formData);
        try {
            const response = await api.createSupervisorIdea(formData);
            console.log('API Response:', response);
            
            if (response.data && response.data.data) {
                // Add the new idea to the list immediately
                setIdeas(prevIdeas => [...prevIdeas, response.data.data]);
                setFormData({ title: '', description: '' });
                setShowAddForm(false);
                setError(null);
            } else {
                console.error('Unexpected response format:', response);
                setError('Failed to create idea: Invalid response format');
            }
        } catch (err) {
            console.error('Error details:', err);
            console.error('Error response:', err.response);
            setError(err.response?.data?.message || 'Failed to create idea. Please try again.');
        }
    };

    const handleDelete = async (ideaId) => {
        if (!window.confirm('Are you sure you want to delete this idea?')) return;
        
        try {
            setDeletingId(ideaId);
            await api.deleteSupervisorIdea(ideaId);
            fetchIdeas();
        } catch (err) {
            setError('Failed to delete idea');
            console.error('Error deleting idea:', err);
        } finally {
            setDeletingId(null);
        }
    };

    if (user?.role !== 'supervisor') {
        return <p>Only supervisors can access this page.</p>;
    }

    return (
        <div style={{ padding: '20px' }}>
            <h1>Project Ideas</h1>
            
            {!showAddForm ? (
                <button 
                    onClick={() => setShowAddForm(true)}
                    style={{
                        padding: '0.5rem 1rem',
                        background: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        marginBottom: '1rem'
                    }}
                >
                    Add New Idea
                </button>
            ) : (
                <div style={{ 
                    background: '#f8f9fa', 
                    padding: '1rem', 
                    borderRadius: '8px',
                    marginBottom: '1rem'
                }}>
                    <h3>Add New Idea</h3>
                    <form onSubmit={handleSubmit}>
                        <div style={{ marginBottom: '1rem' }}>
                            <label htmlFor="title" style={{ display: 'block', marginBottom: '0.5rem' }}>Title:</label>
                            <input
                                type="text"
                                id="title"
                                name="title"
                                value={formData.title}
                                onChange={handleInputChange}
                                required
                                style={{ width: '100%', padding: '0.5rem' }}
                            />
                        </div>
                        <div style={{ marginBottom: '1rem' }}>
                            <label htmlFor="description" style={{ display: 'block', marginBottom: '0.5rem' }}>Description:</label>
                            <textarea
                                id="description"
                                name="description"
                                value={formData.description}
                                onChange={handleInputChange}
                                required
                                rows={4}
                                style={{ width: '100%', padding: '0.5rem' }}
                            />
                        </div>
                        <div>
                            <button 
                                type="submit"
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: '#28a745',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    marginRight: '1rem'
                                }}
                            >
                                Save Idea
                            </button>
                            <button 
                                type="button"
                                onClick={() => setShowAddForm(false)}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {error && <p style={{ color: 'red' }}>{error}</p>}

            {loading ? (
                <p>Loading ideas...</p>
            ) : ideas.length === 0 ? (
                <p>No ideas added yet.</p>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {ideas.map(idea => (
                        <div 
                            key={idea._id}
                            style={{
                                background: 'white',
                                padding: '1rem',
                                borderRadius: '8px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                        >
                            <h3>{idea.title}</h3>
                            <p style={{ whiteSpace: 'pre-wrap' }}>{idea.description}</p>
                            <button
                                onClick={() => handleDelete(idea._id)}
                                disabled={deletingId === idea._id}
                                style={{
                                    padding: '0.25rem 0.5rem',
                                    background: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                {deletingId === idea._id ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default IdeasPage; 