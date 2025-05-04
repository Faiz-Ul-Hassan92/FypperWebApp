import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const SupervisorHomePage = () => {
    const { user } = useAuth();

    return (
        <div style={{ padding: '20px' }}>
            <h1>Welcome, {user?.name}</h1>
            
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
                    <p><strong>Specialization:</strong> {user?.specialization || 'Not specified'}</p>
                </div>
            </div>

            <div style={{ marginTop: '20px' }}>
                <h2>Quick Actions</h2>
                <div style={{ 
                    display: 'grid', 
                    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                    gap: '15px',
                    marginTop: '15px'
                }}>
                    <Link to="/projects" style={{ textDecoration: 'none' }}>
                        <div style={{ 
                            padding: '15px', 
                            background: '#007bff', 
                            color: 'white',
                            borderRadius: '8px',
                            textAlign: 'center'
                        }}>
                            View Projects
                        </div>
                    </Link>
                    <Link to="/requests" style={{ textDecoration: 'none' }}>
                        <div style={{ 
                            padding: '15px', 
                            background: '#28a745', 
                            color: 'white',
                            borderRadius: '8px',
                            textAlign: 'center'
                        }}>
                            View Requests
                        </div>
                    </Link>
                    <Link to="/private-chat" style={{ textDecoration: 'none' }}>
                        <div style={{ 
                            padding: '15px', 
                            background: '#6c757d', 
                            color: 'white',
                            borderRadius: '8px',
                            textAlign: 'center'
                        }}>
                            Private Chats
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default SupervisorHomePage; 