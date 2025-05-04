import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import { useAuth } from '../context/AuthContext';
import StudentProfileButton from '../components/StudentProfileButton';

function ProjectDetailsPage() {
    const { id: projectId } = useParams();
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    // Project State
    const [project, setProject] = useState(null);
    const [loadingProject, setLoadingProject] = useState(true);
    const [projectError, setProjectError] = useState(null);

    // User Lists State
    const [supervisors, setSupervisors] = useState([]);
    const [recruiters, setRecruiters] = useState([]);
    const [loadingUsers, setLoadingUsers] = useState(false);

    // Action State 
    const [requestMessage, setRequestMessage] = useState(''); // Keep message state for requests
    const [actionError, setActionError] = useState(null);
    const [actionSuccess, setActionSuccess] = useState(null);
    const [loadingAction, setLoadingAction] = useState(false);
    const [loadingActionTarget, setLoadingActionTarget] = useState(null); // For specific request buttons
    const [removingId, setRemovingId] = useState(null); // For remove buttons

    // State for showing selector sections
    const [showSupervisorSelector, setShowSupervisorSelector] = useState(false);
    const [showRecruiterSelector, setShowRecruiterSelector] = useState(false);

    // --- Derived State --- 
    const isOwner = user && project && user._id === project.owner?._id;
    const isMember = user && project && project.members?.some(member => member._id === user._id);
    const needsSupervisor = !project?.supervisor;
    const needsRecruiter = !project?.recruiterCollaboration || project.recruiterCollaboration.status !== 'approved';
    const canRequestSupOrRec = user?.role === 'student' && isMember;
    const canJoin = user?.role === 'student' && project?.status === 'open' && !isMember && !isOwner && (project?.members?.length < project?.maxMembers);

    // --- Utility Functions & Callbacks (fetchProject, fetchPotentialCollaborators, handleGenericRequest, etc.) ---
    const clearMessages = () => {
        setActionError(null);
        setActionSuccess(null);
    }
    
    const fetchProject = useCallback(async () => {
        setLoadingProject(true);
        setProjectError(null);
        try {
            const response = await api.getProjectById(projectId);
            setProject(response.data.data);
        } catch (err) {
            console.error("Failed to fetch project:", err);
            setProjectError(err.response?.data?.message || 'Could not load project details.');
        } finally {
            setLoadingProject(false);
        }
    }, [projectId]);

    const fetchPotentialCollaborators = useCallback(async () => {
        // Only fetch if needed and user is member
        if (!isMember || (!needsSupervisor && !needsRecruiter)) return; 
        setLoadingUsers(true);
        try {
            const [supRes, recRes] = await Promise.all([
                needsSupervisor ? api.getSupervisors() : Promise.resolve({ data: { data: [] } }),
                needsRecruiter ? api.getRecruiters() : Promise.resolve({ data: { data: [] } })
            ]);
            setSupervisors(supRes.data.data || []);
            setRecruiters(recRes.data.data || []);
        } catch (err) {
            console.error("Failed to fetch supervisors/recruiters:", err);
        } finally {
            setLoadingUsers(false);
        }
    }, [isMember, needsSupervisor, needsRecruiter]);

    useEffect(() => {
        if (projectId) {
            fetchProject();
        }
    }, [projectId, fetchProject]);

    useEffect(() => {
         if (project) { // Fetch collaborators once project is loaded
            fetchPotentialCollaborators();
         }
    }, [project, fetchPotentialCollaborators]);

    const handleGenericRequest = async (type, targetUserId, successMessage, errorMessagePrefix) => {
        clearMessages();
        if (!project) return;
        if (type === 'join_project' && !canJoin) return;
        if (type !== 'join_project' && !canRequestSupOrRec) return;

        setLoadingAction(true);
        setLoadingActionTarget(targetUserId); 
        try {
            await api.createRequest({
                requestType: type,
                toUserId: targetUserId, // Will be null for join_project
                projectId: project._id,
                message: requestMessage || undefined // Send message if present
            });
            setActionSuccess(successMessage);
            // Close selectors after successful request
            if (type === 'request_supervisor') setShowSupervisorSelector(false);
            if (type === 'request_recruiter') setShowRecruiterSelector(false);
            fetchProject(); // Refresh project details
            // No need to fetch collaborators again here, list will be hidden
            setRequestMessage('');
        } catch (err) {
            console.error(`${errorMessagePrefix} failed:`, err);
            setActionError(err.response?.data?.message || `${errorMessagePrefix} failed.`);
        } finally {
            setLoadingAction(false);
            setLoadingActionTarget(null);
        }
    };

    const handleJoinRequest = () => handleGenericRequest(
        'join_project', 
        project.owner._id, // Pass the project owner's ID
        'Join request sent successfully!', 
        'Failed to send join request'
    );

    const handleRequestSupervisor = (supervisorId) => handleGenericRequest(
        'request_supervisor', 
        supervisorId, 
        'Supervisor request sent successfully!', 
        'Failed to send supervisor request'
    );
    
    const handleRequestRecruiter = (recruiterId) => handleGenericRequest(
        'request_recruiter', 
        recruiterId, 
        'Recruiter request sent successfully!', 
        'Failed to send recruiter request'
    );

    const handleDeleteProject = async () => {
        clearMessages();
        if (!project || (!isOwner && user?.role !== 'admin')) {
            setActionError("You are not authorized to delete this project.");
            return;
        }
        if (window.confirm('Are you sure you want to delete this project? This action cannot be undone.')) {
            setLoadingAction(true);
            try {
                await api.deleteProject(projectId);
                setActionSuccess('Project deleted successfully!');
                navigate('/projects');
            } catch (err) {
                 console.error("Failed to delete project:", err);
                 setActionError(err.response?.data?.message || 'Failed to delete project.');
                 setLoadingAction(false);
            }
        }
    };
    
    // --- Removal Handlers --- 
    const handleRemoveMember = async (memberIdToRemove) => {
        if (!window.confirm('Are you sure you want to remove this member?')) return;
        setRemovingId(memberIdToRemove); 
        setLoadingAction(true); 
        try {
            const response = await api.removeProjectMember(projectId, memberIdToRemove);
            setProject(response.data.data); 
            setActionSuccess('Member removed successfully.');
        } catch (err) {
            setActionError(err.response?.data?.message || 'Failed to remove member.');
        } finally {
            setRemovingId(null);
            setLoadingAction(false);
        }
    };

    const handleRemoveSupervisor = async () => {
        if (!window.confirm('Are you sure you want to remove the supervisor?')) return;
        setRemovingId('supervisor'); 
        setLoadingAction(true);
        try {
            const response = await api.removeProjectSupervisor(projectId);
            setProject(response.data.data);
            setActionSuccess('Supervisor removed successfully.');
            fetchPotentialCollaborators(); 
        } catch (err) {
             setActionError(err.response?.data?.message || 'Failed to remove supervisor.');
        } finally {
            setRemovingId(null);
            setLoadingAction(false);
        }
    };

     const handleRemoveRecruiter = async () => {
        if (!window.confirm('Are you sure you want to remove the recruiter collaboration?')) return;
         setRemovingId('recruiter');
         setLoadingAction(true);
        try {
            const response = await api.removeProjectRecruiter(projectId);
            setProject(response.data.data);
            setActionSuccess('Recruiter collaboration removed successfully.');
            fetchPotentialCollaborators(); 
        } catch (err) {
             setActionError(err.response?.data?.message || 'Failed to remove recruiter collaboration.');
        } finally {
            setRemovingId(null);
            setLoadingAction(false);
        }
    };

    // --- Render Logic --- 
    if (authLoading || loadingProject) {
        return <p>Loading project details...</p>;
    }

    if (projectError) {
        return <p className="error-message">Error: {projectError}</p>;
    }

    if (!project) {
        return <p>Project not found.</p>;
    }

    return (
        <div className="card">
            {/* Project Info */} 
            <h1>{project.title}</h1>
            <p><strong>Owner:</strong> {project.owner?.name || 'N/A'} ({project.owner?.email || 'N/A'})</p>
            <p><strong>Status:</strong> <span style={{ textTransform: 'capitalize' }}>{project.status}</span></p>
            <p><strong>Members:</strong> {project.members?.length || 0} / {project.maxMembers || 'N/A'}</p>
            <p><strong>Description:</strong></p>
            <p style={{ whiteSpace: 'pre-wrap' }}>{project.description}</p>
            
            {project.requiredSkills && project.requiredSkills.length > 0 && (
                 <p><strong>Required Skills:</strong> {project.requiredSkills.join(', ')}</p>
            )}

            <p><strong>Current Members:</strong></p>
            {project.members && project.members.length > 0 ? (
                <ul>
                    {project.members.map(member => (
                        <li key={member._id}>
                            {member.name}
                            {member._id === project.owner?._id && ' (Owner)'}
                            <StudentProfileButton student={member} />
                            {isOwner && member._id !== user._id && (
                                <button 
                                    onClick={() => handleRemoveMember(member._id)}
                                    disabled={loadingAction && removingId === member._id} 
                                    className="btn-remove"
                                    style={{
                                        marginLeft: '0.5rem',
                                        padding: '0.25rem 0.5rem',
                                        background: '#dc3545',
                                        color: 'white',
                                        border: 'none',
                                        borderRadius: '4px',
                                        cursor: 'pointer'
                                    }}
                                >
                                    {loadingAction && removingId === member._id ? 'Removing...' : 'Remove'}
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            ) : (
                <p>No members yet.</p>
            )}

            <p><strong>Supervisor:</strong> {project.supervisor ? (
                    <>
                        {`${project.supervisor.name} (${project.supervisor.email})`}
                        {isOwner && (
                            <button 
                                onClick={handleRemoveSupervisor}
                                disabled={loadingAction && removingId === 'supervisor'} 
                                className="btn-remove"
                                style={{
                                    marginLeft: '0.5rem',
                                    padding: '0.25rem 0.5rem',
                                    background: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                {loadingAction && removingId === 'supervisor' ? 'Removing...' : 'Remove'}
                            </button>
                        )}
                    </>
                ) : 'Not assigned'}
            </p>

            <p><strong>Recruiter Collaboration:</strong> 
                 {project.recruiterCollaboration?.recruiter ? (
                    <>
                        {`${project.recruiterCollaboration.recruiter.name} (${project.recruiterCollaboration.recruiter.company || 'N/A'}) - Status: ${project.recruiterCollaboration.status}`}
                         {isOwner && (
                             <button 
                                onClick={handleRemoveRecruiter}
                                disabled={loadingAction && removingId === 'recruiter'} 
                                className="btn-remove"
                                style={{
                                    marginLeft: '0.5rem',
                                    padding: '0.25rem 0.5rem',
                                    background: '#dc3545',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '4px',
                                    cursor: 'pointer'
                                }}
                            >
                                {loadingAction && removingId === 'recruiter' ? 'Removing...' : 'Remove'}
                             </button>
                         )}
                    </>
                 ) : 'None'}
            </p>

            {/* Action Feedback */} 
             {actionError && <p className="error-message">{actionError}</p>}
             {actionSuccess && <p className="success-message">{actionSuccess}</p>}

            {/* --- Student Actions --- */}
            {/* Join Request */} 
             {canJoin && (
                 <div className="action-section">
                     <h4>Request to Join</h4>
                     <textarea 
                        placeholder="Optional message to the project owner..."
                        value={requestMessage}
                        onChange={(e) => setRequestMessage(e.target.value)}
                        rows={3}
                        style={{ width: '100%', maxWidth: '500px', display: 'block', marginBottom: '0.5rem' }}
                        disabled={loadingAction}
                    />
                    <button onClick={handleJoinRequest} disabled={loadingAction}>
                        {loadingAction ? 'Sending...' : 'Send Join Request'}
                    </button>
                 </div>
             )}

            {/* Request Supervisor (Button first) */} 
             {canRequestSupOrRec && needsSupervisor && (
                <div className="action-section">
                     <h4>Request Supervisor</h4>
                    {!showSupervisorSelector ? (
                         <button onClick={() => setShowSupervisorSelector(true)} disabled={loadingAction || loadingUsers}>
                             Select Supervisor
                         </button>
                    ) : (
                        <> 
                            {loadingUsers && <p>Loading potential supervisors...</p>}
                             {!loadingUsers && supervisors.length === 0 && <p>No available supervisors found.</p>}
                             {!loadingUsers && supervisors.length > 0 && (
                                 <>
                                     <textarea 
                                         placeholder="Optional message for supervisor request..."
                                         value={requestMessage} 
                                         onChange={(e) => setRequestMessage(e.target.value)}
                                         rows={3}
                                         style={{ width: '100%', maxWidth: '500px', display:'block', marginBottom: '1rem' }}
                                         disabled={loadingAction}
                                     />
                                     <ul>
                                         {supervisors.map(sup => (
                                            <li key={sup._id} style={{ marginBottom: '0.5rem'}}>
                                                {sup.name} ({sup.email}) {sup.expertise?.length > 0 ? `- Expertise: ${sup.expertise.join(', ')}` : ''}
                                                <button 
                                                    style={{ marginLeft: '1rem' }}
                                                    onClick={() => handleRequestSupervisor(sup._id)} 
                                                    disabled={loadingAction || loadingActionTarget === sup._id}
                                                >
                                                    {loadingAction && loadingActionTarget === sup._id ? 'Sending...' : 'Send Request'}
                                                </button>
                                            </li>
                                        ))}
                                     </ul>
                                </> 
                            )}
                             <button onClick={() => setShowSupervisorSelector(false)} style={{ marginTop: '1rem' }} disabled={loadingAction}>
                                 Cancel
                             </button>
                         </>
                     )}
                 </div>
            )}

            {/* Request Recruiter (Button first) */} 
            {canRequestSupOrRec && needsRecruiter && (
                 <div className="action-section">
                     <h4>Request Recruiter Collaboration</h4>
                    {!showRecruiterSelector ? (
                         <button onClick={() => setShowRecruiterSelector(true)} disabled={loadingAction || loadingUsers}>
                             Select Recruiter
                         </button>
                    ) : (
                        <>
                            {loadingUsers && <p>Loading potential recruiters...</p>}
                            {!loadingUsers && recruiters.length === 0 && <p>No available recruiters found.</p>}
                             {!loadingUsers && recruiters.length > 0 && (
                                <> 
                                     <textarea 
                                        placeholder="Optional message for recruiter request..."
                                        value={requestMessage} 
                                        onChange={(e) => setRequestMessage(e.target.value)}
                                        rows={3}
                                        style={{ width: '100%', maxWidth: '500px', display:'block', marginBottom: '1rem' }}
                                        disabled={loadingAction}
                                    />
                                    <ul>
                                        {recruiters.map(rec => (
                                            <li key={rec._id} style={{ marginBottom: '0.5rem'}}>
                                                {rec.name} ({rec.email}) {rec.company ? `- ${rec.company}` : ''}
                                                <button 
                                                    style={{ marginLeft: '1rem' }}
                                                    onClick={() => handleRequestRecruiter(rec._id)} 
                                                    disabled={loadingAction || loadingActionTarget === rec._id}
                                                >
                                                    {loadingAction && loadingActionTarget === rec._id ? 'Sending...' : 'Send Request'}
                                                </button>
                                            </li>
                                        ))}
                                    </ul>
                                </> 
                             )}
                             <button onClick={() => setShowRecruiterSelector(false)} style={{ marginTop: '1rem' }} disabled={loadingAction}>
                                 Cancel
                             </button>
                         </>
                     )}
                </div>
            )}

             {/* --- Owner/Admin Actions --- */}
             {(isOwner || user?.role === 'admin') && (
                 <div className="action-section">
                    <h4>{isOwner && user?.role !== 'admin' ? 'Project Owner' : 'Admin'} Actions</h4>
                    <button 
                        style={{ backgroundColor: '#dc3545' }} 
                        onClick={handleDeleteProject} 
                        disabled={loadingAction}
                    >
                        {loadingAction ? 'Deleting...' : 'Delete Project'}
                    </button>
                 </div>
            )}

        </div>
    );
}

// Helper CSS class (add this to index.css or a separate file)
/*
.action-section {
    margin-top: 1.5rem;
    padding-top: 1.5rem;
    border-top: 1px solid #eee;
}
*/

export default ProjectDetailsPage; 