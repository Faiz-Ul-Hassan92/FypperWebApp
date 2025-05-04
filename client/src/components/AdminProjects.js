import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import '../styles/AdminDashboard.css';

function AdminProjects() {
    const [projects, setProjects] = useState([]);
    const [filteredProjects, setFilteredProjects] = useState([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [removingProjectId, setRemovingProjectId] = useState(null);
    const navigate = useNavigate();

    useEffect(() => {
        fetchProjects();
    }, []);

    useEffect(() => {
        if (!searchQuery.trim()) {
            setFilteredProjects(projects);
            return;
        }

        const query = searchQuery.toLowerCase();
        const filtered = projects.filter(project => 
            project.title.toLowerCase().includes(query) || 
            project.description.toLowerCase().includes(query)
        );
        setFilteredProjects(filtered);
    }, [searchQuery, projects]);

    const fetchProjects = async () => {
        try {
            setLoading(true);
            const response = await api.getProjects();
            setProjects(response.data.data || []);
            setError(null);
        } catch (err) {
            setError('Failed to fetch projects');
            console.error('Error fetching projects:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleViewDetails = (projectId) => {
        navigate(`/projects/${projectId}`);
    };

    const handleDeleteProject = async (projectId) => {
        if (!window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            return;
        }

        try {
            setRemovingProjectId(projectId);
            await api.deleteProject(projectId);
            // Remove the project from the local state
            setProjects(projects.filter(project => project._id !== projectId));
            setFilteredProjects(filteredProjects.filter(project => project._id !== projectId));
        } catch (err) {
            setError('Failed to delete project');
            console.error('Error deleting project:', err);
        } finally {
            setRemovingProjectId(null);
        }
    };

    if (loading) {
        return <p>Loading projects...</p>;
    }

    if (error) {
        return <p className="error-message">{error}</p>;
    }

    return (
        <div className="admin-dashboard">
            <h2>Manage Projects</h2>
            
            <div className="admin-controls">
                <div className="search-bar">
                    <label htmlFor="project-search">Search Projects:</label>
                    <input
                        id="project-search"
                        type="text"
                        placeholder="Search by title or description..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                </div>
            </div>

            <div className="projects-list">
                {filteredProjects.length === 0 ? (
                    <p>No projects found</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Title</th>
                                <th>Description</th>
                                <th>Status</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProjects.map(project => (
                                <tr key={project._id}>
                                    <td>{project.title}</td>
                                    <td>{project.description}</td>
                                    <td>{project.status}</td>
                                    <td>
                                        <button
                                            className="action-button"
                                            onClick={() => handleViewDetails(project._id)}
                                            style={{ marginRight: '10px' }}
                                        >
                                            Details
                                        </button>
                                        <button
                                            className="action-button"
                                            onClick={() => handleDeleteProject(project._id)}
                                            disabled={removingProjectId === project._id}
                                        >
                                            {removingProjectId === project._id ? 'Deleting...' : 'Delete'}
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}

export default AdminProjects; 