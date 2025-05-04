import React, { useState, useEffect } from 'react';
import * as api from '../services/api';

function SearchUsers() {
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [userType, setUserType] = useState('student');
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchUsers = async () => {
            setLoading(true);
            try {
                let response;
                switch (userType) {
                    case 'student':
                        response = await api.getStudents();
                        break;
                    case 'supervisor':
                        response = await api.getSupervisors();
                        break;
                    case 'recruiter':
                        response = await api.getRecruiters();
                        break;
                    default:
                        response = { data: { data: [] } };
                }
                setUsers(response.data.data || []);
            } catch (error) {
                console.error('Error fetching users:', error);
            } finally {
                setLoading(false);
            }
        };

        if (showSearch) {
            fetchUsers();
        }
    }, [userType, showSearch]);

    const filteredUsers = users.filter(user => {
        const searchLower = searchQuery.toLowerCase();
        return (
            user.name.toLowerCase().includes(searchLower) ||
            user.email.toLowerCase().includes(searchLower)
        );
    });

    return (
        <div className="search-container" style={{ position: 'relative' }}>
            <button 
                onClick={() => setShowSearch(!showSearch)}
                className="nav-link"
                style={{ 
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0.5rem 1rem',
                    color: '#007bff',
                    textDecoration: 'none'
                }}
            >
                SEARCH
            </button>

            {showSearch && (
                <div style={{
                    position: 'absolute',
                    top: '100%',
                    right: 0,
                    background: 'white',
                    padding: '1rem',
                    borderRadius: '4px',
                    boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
                    zIndex: 1000,
                    minWidth: '300px'
                }}>
                    <div style={{ marginBottom: '1rem' }}>
                        <select 
                            value={userType}
                            onChange={(e) => setUserType(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.5rem',
                                marginBottom: '0.5rem',
                                border: '1px solid #ddd',
                                borderRadius: '4px'
                            }}
                        >
                            <option value="student">Students</option>
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

                    {loading ? (
                        <p>Loading...</p>
                    ) : (
                        <ul style={{ 
                            maxHeight: '300px', 
                            overflowY: 'auto',
                            listStyle: 'none',
                            padding: 0,
                            margin: 0
                        }}>
                            {filteredUsers.map(user => (
                                <li key={user._id} style={{
                                    padding: '0.5rem',
                                    borderBottom: '1px solid #eee'
                                }}>
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
                                <li style={{ padding: '0.5rem', color: '#666' }}>
                                    No {userType}s found
                                </li>
                            )}
                        </ul>
                    )}
                </div>
            )}
        </div>
    );
}

export default SearchUsers; 