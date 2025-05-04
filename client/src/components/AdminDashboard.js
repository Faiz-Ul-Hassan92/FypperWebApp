import React, { useState, useEffect } from 'react';
import * as api from '../services/api';
import '../styles/AdminDashboard.css';

function AdminDashboard() {
    const [users, setUsers] = useState([]);
    const [filteredUsers, setFilteredUsers] = useState([]);
    const [selectedRole, setSelectedRole] = useState('student');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [removingUserId, setRemovingUserId] = useState(null);

    useEffect(() => {
        fetchUsers();
    }, []);

    useEffect(() => {
        // First filter by role
        let filtered = users.filter(user => user.role === selectedRole);

        // Then filter by search query
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(user => 
                user.name.toLowerCase().includes(query) || 
                user.email.toLowerCase().includes(query)
            );
        }

        setFilteredUsers(filtered);
    }, [selectedRole, searchQuery, users]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await api.getUsers();
            // The API returns { success: true, data: users }
            setUsers(response.data.data || []);
            setError(null);
        } catch (err) {
            setError('Failed to fetch users');
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = (e) => {
        setSelectedRole(e.target.value);
    };

    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    const handleRemoveUser = async (userId) => {
        if (!window.confirm('Are you sure you want to remove this user? This action cannot be undone.')) {
            return;
        }

        try {
            setRemovingUserId(userId);
            await api.deleteUser(userId);
            // Remove the user from the local state
            setUsers(users.filter(user => user._id !== userId));
        } catch (err) {
            setError('Failed to remove user');
            console.error('Error removing user:', err);
        } finally {
            setRemovingUserId(null);
        }
    };

    if (loading) {
        return <p>Loading users...</p>;
    }

    if (error) {
        return <p className="error-message">{error}</p>;
    }

    return (
        <div className="admin-dashboard">
            <h2>Manage Users</h2>
            
            <div className="admin-controls">
                <div className="role-filter">
                    <label htmlFor="role-select">Select User Type:</label>
                    <select 
                        id="role-select" 
                        value={selectedRole} 
                        onChange={handleRoleChange}
                    >
                        <option value="student">Students</option>
                        <option value="supervisor">Supervisors</option>
                        <option value="recruiter">Recruiters</option>
                    </select>
                </div>
                
                <div className="search-bar">
                    <label htmlFor="user-search">Search Users:</label>
                    <input
                        id="user-search"
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchQuery}
                        onChange={handleSearchChange}
                    />
                </div>
            </div>

            <div className="users-list">
                {filteredUsers.length === 0 ? (
                    <p>No {selectedRole}s found</p>
                ) : (
                    <table>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Email</th>
                                <th>Role</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map(user => (
                                <tr key={user._id}>
                                    <td>{user.name}</td>
                                    <td>{user.email}</td>
                                    <td>{user.role}</td>
                                    <td>
                                        <button
                                            className="action-button"
                                            onClick={() => handleRemoveUser(user._id)}
                                            disabled={removingUserId === user._id}
                                        >
                                            {removingUserId === user._id ? 'Removing...' : 'Remove'}
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

export default AdminDashboard; 