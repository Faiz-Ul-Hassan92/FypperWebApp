import React from 'react';
import { Link } from 'react-router-dom';

// Basic placeholder Project Card
function ProjectCard({ project }) {
    if (!project) {
        return <div className="card">Loading project data...</div>;
    }

    const { _id, title, description, owner, members = [], status } = project;

    return (
        <div className="card">
            <h3><Link to={`/projects/${_id}`}>{title}</Link></h3>
            <p><strong>Owner:</strong> {owner?.name || 'N/A'}</p>
            <p><strong>Status:</strong> <span style={{ textTransform: 'capitalize' }}>{status}</span></p>
            <p><strong>Members:</strong> {members.length} / {project.maxMembers || 'N/A'}</p>
            {members.length > 0 && (
                <p>
                    <strong>Current Members:</strong>
                    <ul>
                        {members.map(member => (
                            <li key={member._id}>
                                {member.name}
                                {member._id === owner?._id && ' (Owner)'}
                            </li>
                        ))}
                    </ul>
                </p>
            )}
            <p>{description.substring(0, 150)}{description.length > 150 ? '...' : ''}</p> 
            <Link to={`/projects/${_id}`} className="btn btn-secondary" style={{marginTop: '0.5rem'}}>View Details</Link>
            {/* Add Join button or other actions here, potentially based on user role/status */} 
        </div>
    );
}

export default ProjectCard; 