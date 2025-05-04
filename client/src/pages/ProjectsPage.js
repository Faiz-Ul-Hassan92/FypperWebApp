import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../services/api';
import ProjectCard from '../components/ProjectCard';
import { useAuth } from '../context/AuthContext';

function ProjectsPage() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const { user } = useAuth();

    useEffect(() => {
        const fetchProjects = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await api.getProjects();
                setProjects(response.data.data || []);
            } catch (err) {
                console.error("Failed to fetch projects:", err);
                setError(err.response?.data?.message || 'Could not load projects.');
            } finally {
                setLoading(false);
            }
        };

        fetchProjects();
    }, []);

    const filteredProjects = projects.filter(project => 
        project.title.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div>
            <h1>Available Projects</h1>
             {user?.role === 'student' && (
                <Link to="/create-project" style={{ marginBottom: '1rem', display: 'inline-block' }}>
                    <button>Create New Project</button>
                </Link>
            )}

            <div style={{ marginBottom: '1.5rem' }}>
                <input
                    type="text"
                    placeholder="Search projects by title..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ 
                        padding: '0.5rem 0.8rem', 
                        width: '100%', 
                        maxWidth: '400px', 
                        fontSize: '1rem' 
                    }}
                />
            </div>

            {loading && <p>Loading projects...</p>}
            {error && <p className="error-message">Error: {error}</p>}
            
            {!loading && !error && projects.length === 0 && (
                <p>No projects found.</p>
            )}

            {!loading && !error && projects.length > 0 && (
                <div>
                    {filteredProjects.length > 0 ? (
                        <div className="projects-list">
                            {filteredProjects.map((project) => (
                                <ProjectCard key={project._id} project={project} currentUserId={user?._id} />
                            ))}
                        </div>
                    ) : (
                        <p>No projects found{searchQuery ? ' matching your search.' : '.'}</p>
                    )}
                </div>
            )}
        </div>
    );
}

export default ProjectsPage; 