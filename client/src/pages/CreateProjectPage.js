import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import { useAuth } from '../context/AuthContext';

function CreateProjectPage() {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        requiredSkills: '', // Comma-separated
        maxMembers: 5, // Default value
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const navigate = useNavigate();
    const { user } = useAuth(); // Needed to ensure user is student

    const { title, description, requiredSkills, maxMembers } = formData;

    const onChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const projectData = {
            title,
            description,
            requiredSkills: requiredSkills.split(',').map(s => s.trim()).filter(s => s), // Convert to array
            maxMembers: parseInt(maxMembers, 10) || 5 // Ensure it's a number
        };

        try {
            const response = await api.createProject(projectData);
            // Navigate to the newly created project's page
            navigate(`/projects/${response.data.data._id}`); 
        } catch (err) {
            console.error("Failed to create project:", err);
            setError(err.response?.data?.message || 'Could not create project.');
            setLoading(false);
        }
        // No need for finally setLoading(false) if navigating away on success
    };

    // Optional: Add a check if user is not student, although ProtectedRoute should handle this
    if (user?.role !== 'student') {
        return <p>Only students can create projects.</p>;
    }

    return (
        <div>
            <h2>Create New Project</h2>
            <form onSubmit={handleSubmit}>
                {error && <p className="error-message">{error}</p>}
                <div>
                    <label htmlFor="title">Project Title:</label>
                    <input type="text" id="title" name="title" value={title} onChange={onChange} required />
                </div>
                <div>
                    <label htmlFor="description">Description:</label>
                    <textarea id="description" name="description" value={description} onChange={onChange} rows={5} required />
                </div>
                <div>
                    <label htmlFor="requiredSkills">Required Skills (comma-separated):</label>
                    <input type="text" id="requiredSkills" name="requiredSkills" value={requiredSkills} onChange={onChange} />
                </div>
                 <div>
                    <label htmlFor="maxMembers">Maximum Members:</label>
                    <input type="number" id="maxMembers" name="maxMembers" value={maxMembers} onChange={onChange} min="1" required />
                </div>
                <button type="submit" disabled={loading}>
                    {loading ? 'Creating Project...' : 'Create Project'}
                </button>
            </form>
        </div>
    );
}

export default CreateProjectPage; 