import React, { useState, useEffect } from 'react';
import * as api from '../services/api';

function SearchPage() {
    // State for user type selection and search
    const [userType, setUserType] = useState('supervisor');
    const [searchQuery, setSearchQuery] = useState('');
    
    // State for users list
    const [users, setUsers] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);
    
    // State for selected user's data
    const [selectedUser, setSelectedUser] = useState(null);
    const [userData, setUserData] = useState([]);
    const [loadingData, setLoadingData] = useState(false);

    // Fetch users when type changes
    useEffect(() => {
        const fetchUsers = async () => {
            setLoadingUsers(true);
            try {
                const response = userType === 'supervisor' 
                    ? await api.getSupervisors()
                    : await api.getRecruiters();
                setUsers(response.data.data || []);
            } catch (error) {
                console.error('Error fetching users:', error);
                setUsers([]);
            } finally {
                setLoadingUsers(false);
            }
        };

        fetchUsers();
    }, [userType]);

    // Fetch user data when a user is selected
    useEffect(() => {
        const fetchUserData = async () => {
            if (!selectedUser) return;
            
            setLoadingData(true);
            try {
                let response;
                if (userType === 'supervisor') {
                    response = await api.getSupervisorIdeasById(selectedUser._id);
                } else {
                    response = await api.getRecruiterProjects(selectedUser._id);
                }
                setUserData(response.data.data || []);
            } catch (error) {
                console.error('Error fetching user data:', error);
                setUserData([]);
            } finally {
                setLoadingData(false);
            }
        };

        fetchUserData();
    }, [selectedUser, userType]);

    // Filter users based on search query
    const filteredUsers = users.filter(user => {
        const searchLower = searchQuery.toLowerCase();
        return (
            user.name.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className="container" style={{ maxWidth: '800px', margin: '2rem auto' }}>
            <h1>Search Users</h1>
            
            {/* Search Controls */}
            <div style={{ marginBottom: '2rem' }}>
                <select 
                    value={userType}
                    onChange={(e) => {
                        setUserType(e.target.value);
                        setSelectedUser(null);
                        setUserData([]);
                    }}
                    style={{
                        width: '100%',
                        padding: '0.5rem',
                        marginBottom: '1rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                    }}
                >
                    <option value="supervisor">Supervisors</option>
                    <option value="recruiter">Recruiters</option>
                </select>
                
                <input
                    type="text"
                    placeholder={`Search ${userType}s...`}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                        width: '100%',
                        padding: '0.5rem',
                        border: '1px solid #ddd',
                        borderRadius: '4px'
                    }}
                />
            </div>

            {/* Main Content */}
            <div style={{ display: 'flex', gap: '2rem' }}>
                {/* Users List */}
                <div className="card" style={{ flex: 1 }}>
                    <h2>{userType.charAt(0).toUpperCase() + userType.slice(1)}s</h2>
                    {loadingUsers ? (
                        <p>Loading...</p>
                    ) : (
                        <ul style={{ 
                            listStyle: 'none',
                            padding: 0,
                            margin: 0
                        }}>
                            {filteredUsers.map(user => (
                                <li 
                                    key={user._id} 
                                    style={{
                                        padding: '1rem',
                                        borderBottom: '1px solid #eee',
                                        cursor: 'pointer',
                                        backgroundColor: selectedUser?._id === user._id ? '#f8f9fa' : 'white'
                                    }}
                                    onClick={() => setSelectedUser(user)}
                                >
                                    <div>
                                        <strong>{user.name}</strong>
                                        <br />
                                        <small>{user.email}</small>
                                        {user.company && (
                                            <div>
                                                <small>Company: {user.company}</small>
                                            </div>
                                        )}
                                    </div>
                                </li>
                            ))}
                            {filteredUsers.length === 0 && (
                                <li style={{ padding: '1rem', color: '#666' }}>
                                    No {userType}s found
                                </li>
                            )}
                        </ul>
                    )}
                </div>

                {/* User Data */}
                {selectedUser && (
                    <div className="card" style={{ flex: 1 }}>
                        <h2>
                            {userType === 'supervisor' ? 'Ideas' : 'Sponsored Projects'}
                        </h2>
                        {loadingData ? (
                            <p>Loading...</p>
                        ) : (
                            <ul style={{ 
                                listStyle: 'none',
                                padding: 0,
                                margin: 0
                            }}>
                                {userData.length > 0 ? (
                                    userData.map((item, index) => (
                                        <li key={index} style={{
                                            padding: '1rem',
                                            borderBottom: '1px solid #eee'
                                        }}>
                                            <div>
                                                <strong>{item.title}</strong>
                                                <p>{item.description}</p>
                                                {item.skills && (
                                                    <div>
                                                        <small>Skills: {item.skills.join(', ')}</small>
                                                    </div>
                                                )}
                                                {item.status && (
                                                    <div>
                                                        <small>Status: {item.status}</small>
                                                    </div>
                                                )}
                                            </div>
                                        </li>
                                    ))
                                ) : (
                                    <li style={{ padding: '1rem', color: '#666' }}>
                                        No {userType === 'supervisor' ? 'ideas' : 'sponsored projects'} found
                                    </li>
                                )}
                            </ul>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

export default SearchPage; 