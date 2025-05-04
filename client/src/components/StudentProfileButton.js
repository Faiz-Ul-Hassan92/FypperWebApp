import React, { useState } from 'react';

function StudentProfileButton({ student }) {
    const [showProfile, setShowProfile] = useState(false);

    return (
        <>
            <button 
                onClick={() => setShowProfile(true)}
                style={{
                    marginLeft: '0.5rem',
                    padding: '0.25rem 0.5rem',
                    background: '#007bff',
                    color: 'white',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer'
                }}
            >
                Profile
            </button>

            {showProfile && (
                <div 
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        background: 'rgba(0, 0, 0, 0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000
                    }}
                    onClick={() => setShowProfile(false)}
                >
                    <div 
                        style={{
                            background: 'white',
                            padding: '2rem',
                            borderRadius: '8px',
                            maxWidth: '500px',
                            width: '90%',
                            maxHeight: '90vh',
                            overflow: 'auto'
                        }}
                        onClick={e => e.stopPropagation()}
                    >
                        <h3>Student Profile</h3>
                        <div style={{ marginTop: '1rem' }}>
                            <p><strong>Name:</strong> {student.name}</p>
                            <p><strong>Email:</strong> {student.email}</p>
                            {student.skills && student.skills.length > 0 && (
                                <p><strong>Skills:</strong> {student.skills.join(', ')}</p>
                            )}
                        </div>
                        <button 
                            onClick={() => setShowProfile(false)}
                            style={{
                                marginTop: '1rem',
                                padding: '0.5rem 1rem',
                                background: '#dc3545',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}

export default StudentProfileButton; 