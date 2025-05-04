import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import * as api from '../services/api';
import { useAuth } from '../context/AuthContext';

function ProjectChatPage() {
    const { projectId } = useParams();
    const { user, loading: authLoading } = useAuth();
    const navigate = useNavigate();

    // Project State
    const [project, setProject] = useState(null);
    const [loadingProject, setLoadingProject] = useState(true);
    const [accessError, setAccessError] = useState(null);

    // Chat State
    const [messages, setMessages] = useState([]);
    const [loadingChat, setLoadingChat] = useState(false);
    const [chatError, setChatError] = useState(null);
    const [newMessage, setNewMessage] = useState('');
    const [sendingMessage, setSendingMessage] = useState(false);
    const chatBoxRef = useRef(null);

    // Derived state
    const isMember = project?.members?.some(member => member._id === user?._id);
    const isSupervisor = project?.supervisor?._id === user?._id;
    const isApprovedRecruiter = 
        project?.recruiterCollaboration?.recruiter?._id === user?._id && 
        project?.recruiterCollaboration?.status === 'approved';
    const hasAccess = isMember || isSupervisor || isApprovedRecruiter; // Include recruiter

    // --- Utilities ---
     const scrollToBottom = () => {
        if (chatBoxRef.current) {
             chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
        }
    };

    // --- Fetching Logic --- 
    const fetchProjectDetails = useCallback(async () => {
        setLoadingProject(true);
        setAccessError(null);
        try {
            const response = await api.getProjectById(projectId);
            setProject(response.data.data); 
        } catch (err) {
            console.error("Failed to fetch project details for chat:", err);
            setAccessError(err.response?.status === 404 ? 'Project not found.' : 'Error loading project details.');
        } finally {
            setLoadingProject(false);
        }
    }, [projectId]);

    const fetchChatMessages = useCallback(async () => {
        // We need project details first to check access properly via derived state
        if (!project || !hasAccess) return;

        setLoadingChat(true);
        setChatError(null);
        try {
            const response = await api.getChatMessages(projectId);
            setMessages(response.data.data);
             setTimeout(scrollToBottom, 0);
        } catch (err) {
            console.error("Failed to fetch chat messages:", err);
            if (err.response && err.response.status === 403) {
                setAccessError('You do not have permission to view this chat.');
            } else {
                setChatError(err.response?.data?.message || 'Could not load chat messages.');
            }
        } finally {
            setLoadingChat(false);
        }
    }, [projectId, project, hasAccess]); // Depends on project loading first, then hasAccess

    // --- Effects --- 
    useEffect(() => {
        if (projectId) {
            fetchProjectDetails();
        }
    }, [projectId, fetchProjectDetails]);

    // Fetch chat messages only after project details are loaded and access is confirmed
    useEffect(() => {
        if (!loadingProject && project && hasAccess) {
            fetchChatMessages();
        } else if (!loadingProject && project && !hasAccess) {
             setAccessError('You do not have permission to access this project chat.');
        }
    }, [loadingProject, project, hasAccess, fetchChatMessages]);
    
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // --- Action Handlers --- 
    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !projectId || !hasAccess) return;
        setSendingMessage(true);
        setChatError(null);
        try {
            const response = await api.postChatMessage(projectId, newMessage);
            setMessages(prevMessages => [...prevMessages, response.data.data]);
            setNewMessage('');
             setTimeout(scrollToBottom, 0);
        } catch (err) {
             console.error("Failed to send message:", err);
             setChatError(err.response?.data?.message || 'Could not send message.');
        } finally {
            setSendingMessage(false);
        }
    };

    // --- Render Logic --- 
    if (authLoading || loadingProject) {
        return <p>Loading chat...</p>;
    }

    if (accessError) {
        return <p className="error-message">Access Denied: {accessError} <Link to="/dashboard">Go to Dashboard</Link></p>;
    }

    if (!project) {
         // This case might be covered by accessError, but included for safety
        return <p>Project not found.</p>;
    }

    return (
        <div>
            <h2>Chat for Project: {project.title}</h2>
            <p><Link to={`/projects/${projectId}`}>Back to Project Details</Link></p>

            <div className="card">
                {chatError && <p className="error-message">{chatError}</p>}
                <div 
                    ref={chatBoxRef}
                    className="chat-message-container"
                >
                    {loadingChat && <p>Loading messages...</p>}
                    {!loadingChat && messages.length === 0 && <p>No messages yet. Start the conversation!</p>}
                    {!loadingChat && messages.map(msg => (
                        <div key={msg._id} className="chat-message">
                            <strong>{msg.sender?.name || 'User'}</strong> 
                            <span style={{ fontSize: '0.8em', color: '#555' }}> ({msg.sender?.role || ''})</span>:
                            <span style={{ fontSize: '0.8em', color: '#888', marginLeft: '10px' }}>
                                ({new Date(msg.timestamp).toLocaleString()})
                            </span>
                            <p>{msg.content}</p>
                        </div>
                    ))}
                </div>
                <form onSubmit={handleSendMessage} className="chat-input-form">
                    <textarea
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        rows={3}
                        required
                        disabled={sendingMessage || !hasAccess}
                    />
                    <button type="submit" disabled={sendingMessage || !hasAccess}>
                            {sendingMessage ? 'Sending...' : 'Send'}
                        </button>
                </form>
            </div>
        </div>
    );
}

export default ProjectChatPage; 