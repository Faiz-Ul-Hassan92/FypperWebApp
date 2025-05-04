import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const StudentDashboard = () => {
    const navigate = useNavigate();
    const { user } = useAuth();

    useEffect(() => {
        // Redirect to home page on student login
        navigate('/home');
    }, [navigate]);

    return (
        <div>
            <nav style={{ padding: '10px', background: '#f8f9fa' }}>
                <button onClick={() => navigate('/home')}>Home</button>
                <button onClick={() => navigate('/dashboard')}>Dashboard</button>
                <button onClick={() => navigate('/complaints')}>Complaints</button>
                <button onClick={() => navigate('/private-chat')}>Private Chat</button>
                <button onClick={() => navigate('/logout')}>Logout</button>
            </nav>
            {/* Rest of the dashboard content */}
        </div>
    );
};

export default StudentDashboard; 