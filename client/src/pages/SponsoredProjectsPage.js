import React, { useState, useEffect } from 'react';
import * as api from '../services/api';
import { useAuth } from '../context/AuthContext';

function SponsoredProjectsPage() {
    const { user } = useAuth();
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        financingDetails: ''
    });
    const [deletingId, setDeletingId] = useState(null);

    useEffect(() => {
        fetchProjects();
    }, []);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const response = await api.getSponsoredProjects();
            setProjects(response.data.data || []);
            setError(null);
        } catch (err) {
            setError('Failed to fetch projects');
            console.error('Error fetching projects:', err);
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
            const response = await api.createSponsoredProject(formData);
            console.log('API Response:', response);
            
            if (response.data && response.data.data) {
                // Add the new project to the list immediately
                setProjects(prevProjects => [...prevProjects, response.data.data]);
                setFormData({ title: '', description: '', financingDetails: '' });
                setShowAddForm(false);
                setError(null);
            } else {
                console.error('Unexpected response format:', response);
                setError('Failed to create project: Invalid response format');
            }
        } catch (err) {
            console.error('Error details:', err);
            console.error('Error response:', err.response);
            setError(err.response?.data?.message || 'Failed to create project. Please try again.');
        }
    };

    const handleDelete = async (projectId) => {
        if (!window.confirm('Are you sure you want to delete this project?')) return;
        
        try {
            setDeletingId(projectId);
            await api.deleteSponsoredProject(projectId);
            fetchProjects();
        } catch (err) {
            setError('Failed to delete project');
            console.error('Error deleting project:', err);
        } finally {
            setDeletingId(null);
        }
    };

    if (user?.role !== 'recruiter') {
        return <p>Only recruiters can access this page.</p>;
    }

    return (
        <div style={{ padding: '20px' }}>
            <h1>Sponsored Projects</h1>
            
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
                    Add New Project
                </button>
            ) : (
                <div style={{ 
                    background: '#f8f9fa', 
                    padding: '1rem', 
                    borderRadius: '8px',
                    marginBottom: '1rem'
                }}>
                    <h3>Add New Project</h3>
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
                        <div style={{ marginBottom: '1rem' }}>
                            <label htmlFor="financingDetails" style={{ display: 'block', marginBottom: '0.5rem' }}>Financing Details:</label>
                            <textarea
                                id="financingDetails"
                                name="financingDetails"
                                value={formData.financingDetails}
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
                                Save Project
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
                <p>Loading projects...</p>
            ) : projects.length === 0 ? (
                <p>No projects added yet.</p>
            ) : (
                <div style={{ display: 'grid', gap: '1rem' }}>
                    {projects.map(project => (
                        <div 
                            key={project._id}
                            style={{
                                background: 'white',
                                padding: '1rem',
                                borderRadius: '8px',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                            }}
                        >
                            <h3>{project.title}</h3>
                            <p style={{ whiteSpace: 'pre-wrap' }}>{project.description}</p>
                            <h4>Financing Details:</h4>
                            <p style={{ whiteSpace: 'pre-wrap' }}>{project.financingDetails}</p>
                            <button
                                onClick={() => handleDelete(project._id)}
                                disabled={deletingId === project._id}
                                style={{
                                    padding: '0.25rem 0.5rem',
                                    background: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                {deletingId === project._id ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default SponsoredProjectsPage; 