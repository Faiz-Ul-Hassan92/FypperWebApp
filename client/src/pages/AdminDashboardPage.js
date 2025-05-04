import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import AdminDashboard from '../components/AdminDashboard';
import AdminProjects from '../components/AdminProjects';
import AdminComplaintsView from '../components/AdminComplaintsView';

function AdminDashboardPage() {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('users'); // 'users', 'projects', or 'complaints'

    return (
        <div className="admin-dashboard-page">
            <div className="admin-header">
                <h1>Admin Dashboard</h1>
                <p>Welcome, {user?.name}! ({user?.email})</p>
            </div>

            <div className="admin-navigation">
                <button 
                    className={`nav-button ${activeTab === 'users' ? 'active' : ''}`}
                    onClick={() => setActiveTab('users')}
                >
                    Manage Users
                </button>
                <button 
                    className={`nav-button ${activeTab === 'projects' ? 'active' : ''}`}
                    onClick={() => setActiveTab('projects')}
                >
                    Manage Projects
                </button>
                                        <button 
                    className={`nav-button ${activeTab === 'complaints' ? 'active' : ''}`}
                    onClick={() => setActiveTab('complaints')}
                                        >
                    Complaints
                                        </button>
            </div>

            <div className="admin-content">
                {activeTab === 'users' ? (
                    <AdminDashboard />
                ) : activeTab === 'projects' ? (
                    <AdminProjects />
                ) : (
                    <AdminComplaintsView />
                        )}
            </div>
        </div>
    );
}

export default AdminDashboardPage; 