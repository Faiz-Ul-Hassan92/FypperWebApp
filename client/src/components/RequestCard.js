import React from 'react';
import { Link } from 'react-router-dom';

// Shared Request Card Component
const RequestCard = ({ request, onAction, loadingActionId, currentUserId }) => {
    const { _id, requestType, fromUser, toUser, project, status, message } = request;
    const isLoading = loadingActionId === _id;
    const isProjectOwner = project?.owner?._id === currentUserId;
    
    // Determine if actions should be shown based on request type and user role
    const showActions = status === 'pending' && onAction && 
                        (requestType === 'join_project' ? 
                            isProjectOwner : // Only owner can action join requests
                            request.toUser?._id === currentUserId // Only recipient can action collab requests
                        );

    // Helper function to get descriptive text for the request
    const getRequestDetails = () => {
        switch (requestType) {
            case 'join_project':
                return `${fromUser?.name || 'Someone'} wants to join project: `;
            case 'request_supervisor':
                return `${fromUser?.name || 'Someone'} requested supervision for project: `;
            case 'request_recruiter':
                return `${fromUser?.name || 'Someone'} requested collaboration for project: `;
            default:
                return 'Unknown request regarding project: ';
        }
    }

    return (
        <div className="card" style={{ marginBottom: '1rem' }}>
            <p>
                {getRequestDetails()} 
                <Link to={`/projects/${project?._id}`}>{project?.title || '[Deleted Project]'}</Link>
            </p>
            {/* Show who the request was sent To, if applicable and not a join request */} 
            {requestType !== 'join_project' && toUser && 
                <p>To: {toUser.name}</p>
            }
             {/* Show who sent the request, if it wasn't the current user viewing */}
            {fromUser?._id !== currentUserId && 
                <p>From: {fromUser?.name || 'Unknown'}</p>
            }
             {/* Display the message if provided */} 
            {message && <p>Message: {message}</p>}
            <p>Status: <span style={{ fontWeight: 'bold' }}>{status}</span></p>
            
            {/* Action Buttons (Approve/Reject) */}
            {showActions && (
                <div style={{ marginTop: '0.5rem' }}>
                    <button 
                        onClick={() => onAction(_id, 'approved')} 
                        disabled={isLoading} 
                        style={{ backgroundColor: '#28a745', color: 'white', border: 'none', padding: '0.4rem 0.8rem', cursor: 'pointer' }}
                    >
                        {isLoading ? 'Processing...' : 'Approve'}
                    </button>
                    <button 
                        style={{ marginLeft: '0.5rem', backgroundColor: '#dc3545', color: 'white', border: 'none', padding: '0.4rem 0.8rem', cursor: 'pointer' }}
                        onClick={() => onAction(_id, 'rejected')} 
                        disabled={isLoading}
                     >
                         {isLoading ? 'Processing...' : 'Reject'}
                     </button>
                 </div>
             )}
            {/* TODO: Add cancel button for outgoing pending requests if needed */}
         </div>
    );
};

export default RequestCard; 