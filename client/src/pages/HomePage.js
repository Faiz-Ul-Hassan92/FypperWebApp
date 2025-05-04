import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const HomePage = () => {
    const { isAuthenticated, user } = useAuth();
    const navigate = useNavigate();

    return (
        <div className="home-container card">
            <h1>Welcome to the Final Year Project Platform</h1>
            <p className="lead-text">Find project groups, connect with supervisors, and collaborate with recruiters.</p>
            
            <hr className="home-divider" />

            {isAuthenticated ? (
                <div className="home-actions">
                    <p>Hello, {user?.name}! What would you like to do?</p>
                    <div className="action-links">
                        <Link to="/projects" className="btn btn-primary">Browse Projects</Link>
                        {user?.role === 'student' && 
                            <Link to="/create-project" className="btn btn-secondary">Create a New Project</Link>}
                        <Link to="/dashboard" className="btn btn-secondary">Go to Dashboard</Link>
                    </div>
                </div>
            ) : (
                <div className="home-actions">
                    <p>Please log in or register to get started.</p>
                     <div className="action-links">
                        <Link to="/login" className="btn btn-primary">Login</Link>
                        <Link to="/register" className="btn btn-secondary">Register</Link>
                    </div>
                </div>
            )}

            {isAuthenticated && (
                <div style={{ 
                    background: '#f8f9fa', 
                    padding: '20px', 
                    borderRadius: '8px',
                    marginTop: '20px'
                }}>
                    <h2>Your Information</h2>
                    <div style={{ marginTop: '15px' }}>
                        <p><strong>Email:</strong> {user?.email}</p>
                        <p><strong>Role:</strong> {user?.role}</p>
                        <p><strong>Department:</strong> {user?.department || 'Not specified'}</p>
                        <p><strong>Registration Number:</strong> {user?.registrationNumber || 'Not specified'}</p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default HomePage; 