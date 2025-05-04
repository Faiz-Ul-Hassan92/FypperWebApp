import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import * as api from '../services/api';
import { Link } from 'react-router-dom';
import AdminDashboard from '../components/AdminDashboard';

// --- Helper: Request Card --- 
const RequestCard = ({ request, onAction, loadingActionId, currentUserId }) => {
    const { _id, requestType, fromUser, toUser, project, status, message } = request;
    const isLoading = loadingActionId === _id;
    const isProjectOwner = project?.owner?._id === currentUserId;
    const showActions = status === 'pending' && onAction && 
                        (requestType === 'join_project' ? isProjectOwner : request.toUser?._id === currentUserId);

    const getRequestDetails = () => {
         switch (requestType) {
            case 'join_project':
                return `${fromUser?.name || 'Someone'} wants to join project: `;
            case 'request_supervisor':
                 return `${fromUser?.name || 'Someone'} requested supervision for project: `;
            case 'request_recruiter':
                 return `${fromUser?.name || 'Someone'} requested collaboration for project: `;
            default:
                return 'Unknown request for project: ';
        }
    }

    return (
        <div className="card">
            <p>{getRequestDetails()} <Link to={`/projects/${project?._id}`}>{project?.title || '[Deleted Project]'}</Link></p>
            {/* Show who the request was sent to, unless it's an incoming join request (implicitly to owner) */}
            {requestType !== 'join_project' && toUser && <p>To: {toUser.name}</p>}
            {/* Show who sent the request, if it wasn't the current user */}
            {fromUser?._id !== currentUserId && <p>From: {fromUser?.name || 'Unknown'}</p>}
            {message && <p>Message: {message}</p>}
            <p>Status: <span style={{fontWeight: 'bold'}}>{status}</span></p>
             {showActions && (
                <div>
                    <button 
                        onClick={() => onAction(_id, 'approved')} 
                        disabled={isLoading} 
                        style={{backgroundColor: '#28a745'}}
                    >
                        {isLoading ? 'Processing...' : 'Approve'}
                    </button>
                    <button 
                        style={{marginLeft: '0.5rem', backgroundColor: '#dc3545'}}
                        onClick={() => onAction(_id, 'rejected')} 
                        disabled={isLoading}
                     >
                         {isLoading ? 'Processing...' : 'Reject'}
                     </button>
                 </div>
             )}
             {/* TODO: Add cancel button for outgoing pending requests if fromUser === currentUserId */} 
         </div>
    );
}

// --- Role-Specific Dashboards --- 
const StudentDashboard = ({ user, projects }) => {
    const [isEditingSkills, setIsEditingSkills] = useState(false);
    const [skills, setSkills] = useState(user.skills || []);
    const [newSkill, setNewSkill] = useState('');
    const [error, setError] = useState(null);

    const handleAddSkill = () => {
        if (newSkill.trim() && !skills.includes(newSkill.trim())) {
            setSkills([...skills, newSkill.trim()]);
            setNewSkill('');
        }
    };

    const handleRemoveSkill = (skillToRemove) => {
        setSkills(skills.filter(skill => skill !== skillToRemove));
    };

    const handleSaveSkills = async () => {
        try {
            const response = await api.updateUserSkills(skills);
            if (response.data.success) {
                setIsEditingSkills(false);
                setError(null);
            }
        } catch (err) {
            setError('Failed to update skills. Please try again.');
            console.error('Error updating skills:', err);
        }
    };

    // Filter projects user is a member of (includes owned projects)
    const memberProjects = projects.filter(p => p.members?.some(m => m._id === user._id));

    return (
        <div>
            <h2>Welcome, {user.name}!</h2>
            
            {/* Skills Section */}
            <div style={{ marginBottom: '2rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <h3>Your Skills</h3>
                    {!isEditingSkills ? (
                        <button 
                            onClick={() => setIsEditingSkills(true)}
                            style={{ 
                                marginLeft: '1rem',
                                padding: '0.25rem 0.5rem',
                                background: '#007bff',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Edit
                        </button>
                    ) : (
                        <button 
                            onClick={handleSaveSkills}
                            style={{ 
                                marginLeft: '1rem',
                                padding: '0.25rem 0.5rem',
                                background: '#28a745',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer'
                            }}
                        >
                            Save
                        </button>
                    )}
                </div>

                {isEditingSkills ? (
                    <div>
                        <div style={{ display: 'flex', marginBottom: '1rem' }}>
                            <input
                                type="text"
                                value={newSkill}
                                onChange={(e) => setNewSkill(e.target.value)}
                                placeholder="Add a new skill"
                                style={{
                                    padding: '0.5rem',
                                    marginRight: '0.5rem',
                                    border: '1px solid #ddd',
                                    borderRadius: '4px',
                                    flex: 1
                                }}
                            />
                            <button 
                                onClick={handleAddSkill}
                                style={{
                                    padding: '0.5rem 1rem',
                                    background: '#007bff',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                Add
                            </button>
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                            {skills.map((skill, index) => (
                                <div 
                                    key={index}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        background: '#f8f9fa',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem'
                                    }}
                                >
                                    {skill}
                                    <button 
                                        onClick={() => handleRemoveSkill(skill)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            color: '#dc3545',
                                            cursor: 'pointer',
                                            padding: '0'
                                        }}
                                    >
                                        ×
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {skills.length > 0 ? (
                            skills.map((skill, index) => (
                                <div 
                                    key={index}
                                    style={{
                                        padding: '0.5rem 1rem',
                                        background: '#f8f9fa',
                                        border: '1px solid #ddd',
                                        borderRadius: '4px'
                                    }}
                                >
                                    {skill}
                                </div>
                            ))
                        ) : (
                            <p>No skills added yet</p>
                        )}
                    </div>
                )}
                {error && <p style={{ color: '#dc3545', marginTop: '0.5rem' }}>{error}</p>}
            </div>

            {/* Rest of the existing dashboard content */}
            <h3>Your Projects</h3>
            {memberProjects.length > 0 ? (
                memberProjects.map(p => (
                    <div key={p._id} className="card">
                        <Link to={`/projects/${p._id}`}><h4>{p.title}</h4></Link>
                        <p>Status: {p.status}</p>
                        <p>Members: {p.members?.length || 0}/{p.maxMembers}</p>
                        <Link to={`/projects/${p._id}`} className="btn btn-secondary btn-sm" style={{marginRight: '0.5rem'}}>Details</Link>
                        <Link to={`/chat/${p._id}`} className="btn btn-secondary btn-sm">Chat</Link>
                    </div>
                ))
            ) : <p>You are not part of any projects yet.</p>}
        </div>
    );
}

const SupervisorDashboard = ({ user, projects }) => {
    // Filter projects supervisor is assigned to
    const supervisedProjects = projects.filter(p => p.supervisor?._id === user._id);

     return (
        <div>
             {/* Removed action feedback and incoming request display */} 
             {/* {actionError && <p className="error-message">{actionError}</p>} */}
             {/* {actionSuccess && <p className="success-message">{actionSuccess}</p>} */} 

             {/* Removed Incoming Supervision Requests Section */} 

             <h3>Projects You Are Supervising</h3>
             {supervisedProjects.length > 0 ? (
                 supervisedProjects.map(p => (
                     <div key={p._id} className="card">
                        <Link to={`/projects/${p._id}`}><h4>{p.title}</h4></Link>
                        <p>Owner: {p.owner?.name || 'N/A'}</p> 
                        <p>Members: {p.members?.length || 0}/{p.maxMembers}</p>
                        <Link to={`/projects/${p._id}`} className="btn btn-secondary btn-sm" style={{marginRight: '0.5rem'}}>Details</Link> 
                        <Link to={`/chat/${p._id}`} className="btn btn-secondary btn-sm">Chat</Link> 
                     </div>
                 ))
             ) : <p>You are not currently supervising any projects.</p>}
        </div>
    );
}

const RecruiterDashboard = ({ user, projects }) => {
    // Filter projects recruiter is collaborating on (Keep this)
    const collaboratingProjects = projects.filter(p => {
        // Check the _id of the populated recruiter object
        // console.log(`[RecruiterDashboard] Checking project: ${p.title}, Recruiter Collab:`, p.recruiterCollaboration);
        return p.recruiterCollaboration?.recruiter?._id === user._id && 
               p.recruiterCollaboration?.status === 'approved';
    });

     return (
        <div>
             {/* Removed Incoming Collaboration Requests Section */}
            
             <h3>Projects You Are Collaborating On</h3>
             {collaboratingProjects.length > 0 ? (
                 collaboratingProjects.map(p => (
                     <div key={p._id} className="card">
                        <Link to={`/projects/${p._id}`}><h4>{p.title}</h4></Link>
                        <p>Owner: {p.owner?.name || 'N/A'}</p> 
                        <p>Members: {p.members?.length || 0}/{p.maxMembers}</p>
                        <Link to={`/projects/${p._id}`} className="btn btn-secondary btn-sm" style={{marginRight: '0.5rem'}}>Details</Link> 
                        <Link to={`/chat/${p._id}`} className="btn btn-secondary btn-sm">Chat</Link> 
                     </div>
                 ))
             ) : <p>You are not currently collaborating on any projects.</p>}
        </div>
    );
}

// --- Main Dashboard Page Component --- 
function DashboardPage() {
    const { user, loading: authLoading } = useAuth();
    // Remove requests state completely as it's handled in separate pages now
    // const [requests, setRequests] = useState([]);
    const [projects, setProjects] = useState([]);
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState(null);

    // Remove action state completely
    // const [loadingActionId, setLoadingActionId] = useState(null);
    // const [actionError, setActionError] = useState(null);
    // const [actionSuccess, setActionSuccess] = useState(null);

    // Function to fetch dashboard data
    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoadingData(true);
        setError(null);
        // No action state to clear
        try {
            const promises = [];
            // Requests are no longer fetched here at all
            // Students, Supervisors, and Recruiters still need project data
            if (user.role === 'student' || user.role === 'supervisor' || user.role === 'recruiter') {
                promises.push(api.getProjects()); 
            }
            
            if (promises.length === 0) { 
                 setLoadingData(false);
                 return;
             }

            const results = await Promise.all(promises);
            let projectData = [];
            
            // Only project data is fetched now
            if ((user.role === 'student' || user.role === 'supervisor' || user.role === 'recruiter') && results.length > 0) {
                 projectData = results[0]?.data?.data || [];
            }

            setProjects(projectData);

        } catch (err) {
            console.error("Failed to fetch dashboard data:", err);
            setError(err.response?.data?.message || 'Could not load dashboard data.');
        } finally {
            setLoadingData(false);
        }
    }, [user]);

    // Initial data fetch and setup
    useEffect(() => {
        if (!authLoading && user) {
            fetchData();
        }
    }, [user, authLoading, fetchData]);

    if (authLoading || loadingData) {
        return <p>Loading dashboard...</p>;
    }

    if (error) {
        return <p className="error-message">Error loading dashboard: {error}</p>;
    }

    if (!user) {
        return <p>Please login to view your dashboard.</p>;
    }

    // Props no longer include request/action details
    const dashboardProps = {
        user,
        projects, 
    };

    const renderDashboard = () => {
        switch (user.role) {
            case 'student':
                return <StudentDashboard {...dashboardProps} />;
            case 'supervisor':
                 return <SupervisorDashboard {...dashboardProps} />;
            case 'recruiter':
                return <RecruiterDashboard {...dashboardProps} />;
            case 'admin':
                return <AdminDashboard />;
            default:
                return <p>Unknown user role.</p>;
        }
    };

    return (
        <div>
            <h2>My Dashboard</h2>
            <p>Welcome, {user.name}!</p>
            {renderDashboard()}
        </div>
    );
}

export default DashboardPage; 