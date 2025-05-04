import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../services/api';
import { useAuth } from '../context/AuthContext';
import RequestCard from '../components/RequestCard';

function RequestsPage() {
    const { user, loading: authLoading } = useAuth();
    const [requests, setRequests] = useState([]);
    const [projects, setProjects] = useState([]); // Needed for student incoming check
    const [loadingData, setLoadingData] = useState(true);
    const [error, setError] = useState(null);
    const [loadingActionId, setLoadingActionId] = useState(null);
    const [actionError, setActionError] = useState(null);
    const [actionSuccess, setActionSuccess] = useState(null);
    // State for student view toggle
    const [studentView, setStudentView] = useState('incoming'); // 'incoming' or 'outgoing'

    const fetchData = useCallback(async () => {
        if (!user) return;
        setLoadingData(true);
        setError(null);
        setActionError(null);
        setActionSuccess(null);
        try {
            const promises = [api.getRequests()];
            // Students need projects to determine ownership for incoming join requests
            if (user.role === 'student') {
                promises.push(api.getProjects()); 
            }
            
            const results = await Promise.all(promises);
            setRequests(results[0]?.data?.data || []);
            
            if (user.role === 'student' && results.length > 1) {
                 // Filter projects the student is a member of for context
                setProjects((results[1]?.data?.data || []).filter(p => 
                    p.members?.some(m => m._id === user._id)
                ));
            } else {
                setProjects([]);
            }

        } catch (err) {
            console.error("Failed to fetch requests data:", err);
            setError(err.response?.data?.message || 'Could not load requests data.');
        } finally {
            setLoadingData(false);
        }
    }, [user]);

    useEffect(() => {
        if (!authLoading && user) {
            fetchData();
        }
    }, [user, authLoading, fetchData]);

    // Handler for request actions (Approve/Reject)
    const handleRequestAction = async (requestId, status) => {
        // Only student owners, supervisors, or recruiters should action requests
        if (!user || (user.role !== 'student' && user.role !== 'supervisor' && user.role !== 'recruiter')) return;
        setLoadingActionId(requestId);
        setActionError(null);
        setActionSuccess(null);
        try {
            await api.updateRequestStatus(requestId, status);
            setActionSuccess(`Request successfully ${status}.`);
            fetchData(); // Refresh data after action
        } catch (err) {
            console.error(`Failed to ${status} request:`, err);
            setActionError(err.response?.data?.message || `Failed to ${status} request.`);
        } finally {
            setLoadingActionId(null);
        }
    };

    // --- Filtering Logic --- 
    let filteredRequests = [];
    let pageTitle = "Requests";
    let noRequestsMessage = "No requests found.";
    let showActions = false;

    if (user?.role === 'student') {
        if (studentView === 'incoming') {
            pageTitle = "Incoming Join Requests";
            noRequestsMessage = "No pending join requests for projects you are in.";
            showActions = true; // Actions needed for incoming join requests
            filteredRequests = requests.filter(r => 
                r.requestType === 'join_project' && 
                r.status === 'pending' && 
                r.fromUser?._id !== user?._id && 
                projects.some(p => p._id === r.project?._id)
            );
        } else { // studentView === 'outgoing'
             pageTitle = "My Outgoing Requests";
             noRequestsMessage = "You haven't sent any requests yet.";
             showActions = false; // No actions on outgoing requests
             filteredRequests = requests.filter(r => r.fromUser?._id === user?._id);
        }
    } else if (user?.role === 'supervisor') {
        pageTitle = "Incoming Supervision Requests";
        noRequestsMessage = "You have no pending supervision requests.";
        showActions = true;
        filteredRequests = requests.filter(r => 
            r.requestType === 'request_supervisor' && 
            r.status === 'pending' && 
            r.toUser?._id === user?._id
        );
    } else if (user?.role === 'recruiter') {
        pageTitle = "Incoming Collaboration Requests";
        noRequestsMessage = "You have no pending collaboration requests.";
        showActions = true;
        filteredRequests = requests.filter(r => 
            r.requestType === 'request_recruiter' && 
            r.status === 'pending' && 
            r.toUser?._id === user?._id
        );
    }
    // Add cases for other roles if they need to see requests

    // --- Render Logic --- 
    if (authLoading || loadingData) {
        return <p>Loading requests...</p>;
    }

    if (error) {
        return <p className="error-message">Error loading requests: {error}</p>;
    }

    return (
        <div>
            <h2>{pageTitle}</h2>

            {/* Student View Toggle Buttons */} 
            {user?.role === 'student' && (
                 <div style={{ marginBottom: '1.5rem' }}>
                     <button 
                         onClick={() => setStudentView('incoming')} 
                         disabled={studentView === 'incoming'}
                         style={{ marginRight: '0.5rem', fontWeight: studentView === 'incoming' ? 'bold' : 'normal' }}
                     >
                         Incoming Join Requests
                     </button>
                     <button 
                         onClick={() => setStudentView('outgoing')} 
                         disabled={studentView === 'outgoing'}
                         style={{ fontWeight: studentView === 'outgoing' ? 'bold' : 'normal' }}
                     >
                         My Outgoing Requests
                     </button>
                 </div>
            )}

            {/* Action Feedback Messages */} 
            {actionError && <p className="error-message">{actionError}</p>}
            {actionSuccess && <p className="success-message">{actionSuccess}</p>}

            {/* Request List */} 
            {filteredRequests.length > 0 ? (
                filteredRequests.map(r => (
                    <RequestCard 
                        key={r._id} 
                        request={r} 
                        onAction={showActions ? handleRequestAction : undefined} 
                        loadingActionId={loadingActionId} 
                        currentUserId={user._id} 
                    />
                ))
            ) : (
                <p>{noRequestsMessage}</p>
            )}
        </div>
    );
}

export default RequestsPage; 