import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import * as api from '../services/api';
import { useAuth } from '../context/AuthContext';
import useDebounce from '../hooks/useDebounce'; // Assuming a debounce hook exists

// Simple component to display a single message
const MessageBubble = ({ message, isOwnMessage }) => {
    return (
        <div style={{
            marginBottom: '0.75rem',
            textAlign: isOwnMessage ? 'right' : 'left',
        }}>
            <div style={{
                 display: 'inline-block',
                 padding: '0.5rem 1rem',
                 borderRadius: '15px',
                 backgroundColor: isOwnMessage ? '#007bff' : '#e9ecef',
                 color: isOwnMessage ? 'white' : '#333',
                 maxWidth: '70%',
                 wordWrap: 'break-word',
                 textAlign: 'left',
            }}>
                 {!isOwnMessage && (
                    <strong style={{ display: 'block', marginBottom: '0.2rem', fontSize: '0.8em' }}>
                        {message.sender?.name || 'User'}
                    </strong>
                 )}
                {message.content}
                <div style={{ fontSize: '0.7em', marginTop: '0.3rem', color: isOwnMessage ? '#eee' : '#666' }}>
                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                </div>
            </div>
        </div>
    );
};

function PrivateChatPage() {
    const { user } = useAuth();
    const [conversations, setConversations] = useState([]);
    const [messages, setMessages] = useState([]);
    const [selectedUserId, setSelectedUserId] = useState(null); // ID of the user currently chatting with
    const [selectedUserName, setSelectedUserName] = useState(''); // Name of the user chatting with
    
    const [newMessage, setNewMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    
    const [loadingConversations, setLoadingConversations] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);
    const [loadingSearch, setLoadingSearch] = useState(false);
    const [sendingMessage, setSendingMessage] = useState(false);
    const [error, setError] = useState(null);
    
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [reportDescription, setReportDescription] = useState('');
    const [reportError, setReportError] = useState(null);
    const [reportSuccess, setReportSuccess] = useState(null);
    
    const debouncedSearchQuery = useDebounce(searchQuery, 300); // Debounce search input
    const messagesEndRef = useRef(null); // Ref to scroll to bottom

    // --- Data Fetching ---
    const fetchConversations = useCallback(async () => {
        setLoadingConversations(true);
        try {
            const response = await api.getMyConversations();
            setConversations(response.data.data || []);
        } catch (err) {
            setError('Failed to load conversations');
            console.error(err);
        } finally {
            setLoadingConversations(false);
        }
    }, []);

    const fetchMessages = useCallback(async (otherUserId) => {
        if (!otherUserId) return;
        setLoadingMessages(true);
        setError(null);
        try {
            const response = await api.getPrivateMessages(otherUserId);
            setMessages(response.data.data || []);
        } catch (err) {
            setError('Failed to load messages');
            console.error(err);
            setMessages([]); // Clear messages on error
        } finally {
            setLoadingMessages(false);
        }
    }, []);

    // --- Search Logic ---
    const handleSearch = useCallback(async (query) => {
        if (!query.trim()) {
            setSearchResults([]);
            setLoadingSearch(false);
            return;
        }
        setLoadingSearch(true);
        try {
            const response = await api.searchUsers(query);
            // Filter out admin users from search results
            const nonAdminUsers = response.data.data.filter(user => user.role !== 'admin');
            setSearchResults(nonAdminUsers);
        } catch (err) {
            setError('Failed to search users');
            console.error(err);
        } finally {
            setLoadingSearch(false);
        }
    }, []);

    // --- Effects ---
    useEffect(() => {
        fetchConversations();
    }, [fetchConversations]);

    useEffect(() => {
        if (debouncedSearchQuery) {
            handleSearch(debouncedSearchQuery);
        } else {
            setSearchResults([]); // Clear results when search is empty
        }
    }, [debouncedSearchQuery, handleSearch]);

    useEffect(() => {
        if (selectedUserId) {
            fetchMessages(selectedUserId);
        }
    }, [selectedUserId, fetchMessages]);
    
     // Scroll to bottom when messages change or user is selected
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, selectedUserId]);

    // --- Handlers ---
    const selectConversation = (otherUser) => {
        if (!otherUser || otherUser.role === 'admin') return; // Prevent selecting admin users
        setSelectedUserId(otherUser._id);
        setSelectedUserName(otherUser.name);
        setSearchQuery(''); // Clear search
        setSearchResults([]); // Clear search results
        setError(null); // Clear errors
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedUserId || sendingMessage) return;
        
        setSendingMessage(true);
        setError(null);
        const tempMessageId = Date.now(); // Temporary ID for optimistic update
        const messageToSend = {
             _id: tempMessageId, // Use temporary ID
             sender: { _id: user._id, name: user.name, role: user.role }, // Mock sender for UI
             receiver: { _id: selectedUserId }, // Mock receiver ID
             content: newMessage.trim(),
             createdAt: new Date().toISOString() // Current time
         };

        // Optimistic update
        setMessages(prev => [...prev, messageToSend]);
        setNewMessage('');

        try {
            const response = await api.sendPrivateMessage(selectedUserId, messageToSend.content);
             // Replace temp message with actual message from server
             setMessages(prev => prev.map(msg => 
                 msg._id === tempMessageId ? response.data.data : msg
             ));
            // Refresh conversation list to update last message/time
            fetchConversations(); 
        } catch (err) {
            setError('Failed to send message');
            console.error(err);
            // Remove the optimistic message on failure
            setMessages(prev => prev.filter(msg => msg._id !== tempMessageId));
        } finally {
            setSendingMessage(false);
        }
    };

    const handleReportMessage = (message) => {
        // Only allow reporting messages that were received (not sent by the current user)
        if (message.sender._id === user._id) {
            setError('You can only report messages that you have received');
            return;
        }
        setSelectedMessage(message);
        setShowReportModal(true);
        setReportDescription('');
        setReportError(null);
        setReportSuccess(null);
    };

    const handleSubmitReport = async () => {
        if (!reportDescription.trim()) {
            setReportError('Please provide a description for your complaint');
            return;
        }

        try {
            console.log('Submitting report for message:', selectedMessage);
            const response = await api.createComplaint({
                messageId: selectedMessage._id,
                description: reportDescription
            });
            console.log('Report submitted successfully:', response.data);
            setReportSuccess('Complaint submitted successfully');
            setShowReportModal(false);
        } catch (err) {
            console.error('Error submitting report:', err);
            console.error('Error details:', err.response?.data);
            setReportError(err.response?.data?.message || 'Failed to submit complaint');
        }
    };

    // --- Render ---
    return (
        <div style={{ display: 'flex', height: 'calc(100vh - 80px)' }}> {/* Adjust height based on Navbar */} 
            {/* Left Sidebar */}
            <div style={{
                width: '300px',
                borderRight: '1px solid #ccc',
                display: 'flex',
                flexDirection: 'column',
                padding: '1rem'
            }}>
                {/* Search */}
                <input
                    type="text"
                    placeholder="Search users by name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{ padding: '0.5rem', marginBottom: '1rem' }}
                />
                {loadingSearch && <p style={{fontSize: '0.9em'}}>Searching...</p>}
                {!loadingSearch && searchResults.length > 0 && (
                    <ul style={{ listStyle: 'none', padding: 0, margin: 0, maxHeight: '150px', overflowY: 'auto', border: '1px solid #eee', marginBottom: '1rem' }}>
                        {searchResults.map(u => (
                            <li key={u._id} 
                                onClick={() => selectConversation(u)} 
                                style={{ padding: '0.5rem', cursor: 'pointer', borderBottom: '1px solid #eee' }}
                            >
                                {u.name} ({u.email})
                            </li>
                        ))}
                    </ul>
                )}

                {/* Conversation List */}
                <h4 style={{marginTop: '1rem'}}>Conversations</h4>
                {loadingConversations && <p>Loading conversations...</p>}
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, flexGrow: 1, overflowY: 'auto' }}>
                    {!loadingConversations && conversations.length === 0 && <p>No conversations yet.</p>}
                    {conversations.map(conv => (
                        <li key={conv._id} 
                            onClick={() => selectConversation(conv.otherParticipant)} 
                            style={{
                                padding: '0.75rem 0.5rem', 
                                cursor: 'pointer', 
                                borderBottom: '1px solid #eee',
                                backgroundColor: selectedUserId === conv.otherParticipant?._id ? '#f0f0f0' : 'transparent'
                             }}
                        >
                             <strong>{conv.otherParticipant?.name || 'Unknown User'}</strong>
                             {/* Optional: Display last message snippet */} 
                             {/* <p style={{fontSize: '0.8em', color: '#555', margin: '0.2rem 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'}}>{conv.lastMessage?.content}</p> */}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Right Chat Area */}
            <div style={{
                 flexGrow: 1, 
                 display: 'flex', 
                 flexDirection: 'column', 
                 padding: '1rem' 
            }}>
                {selectedUserId ? (
                    <>
                        <h3>Chat with {selectedUserName}</h3>
                        <div style={{
                            flexGrow: 1, 
                            overflowY: 'auto', 
                            marginBottom: '1rem', 
                            border: '1px solid #eee', 
                            padding: '1rem',
                            backgroundColor: '#f9f9f9'
                         }}>
                            {loadingMessages && <p>Loading messages...</p>}
                            {!loadingMessages && messages.length === 0 && <p>No messages yet. Start the conversation!</p>}
                            {!loadingMessages && messages.map(msg => (
                                <div 
                                    key={msg._id} 
                                    style={{ 
                                        marginBottom: '1rem',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: msg.sender._id === user._id ? 'flex-end' : 'flex-start'
                                    }}
                                >
                                    <div style={{ 
                                        maxWidth: '70%',
                                        padding: '0.5rem 1rem',
                                        borderRadius: '10px',
                                        backgroundColor: msg.sender._id === user._id ? '#007bff' : '#f0f0f0',
                                        color: msg.sender._id === user._id ? 'white' : 'black'
                                    }}>
                                        <p style={{ margin: 0 }}>{msg.content}</p>
                                        <small style={{ opacity: 0.7 }}>
                                            {new Date(msg.createdAt).toLocaleString()}
                                        </small>
                                    </div>
                                    {msg.sender._id !== user._id && (
                                        <button 
                                            onClick={() => handleReportMessage(msg)}
                                            style={{
                                                background: 'none',
                                                border: 'none',
                                                color: '#dc3545',
                                                cursor: 'pointer',
                                                padding: '0.2rem',
                                                fontSize: '0.8rem'
                                            }}
                                        >
                                            Report
                                        </button>
                                    )}
                                </div>
                            ))}
                             <div ref={messagesEndRef} /> {/* Element to scroll to */}
                        </div>
                        <form onSubmit={handleSendMessage} style={{ display: 'flex' }}>
                            <input
                                type="text"
                                placeholder="Type your message..."
                                value={newMessage}
                                onChange={(e) => setNewMessage(e.target.value)}
                                style={{ flexGrow: 1, padding: '0.75rem', marginRight: '0.5rem' }}
                                disabled={sendingMessage}
                            />
                            <button type="submit" disabled={sendingMessage || !newMessage.trim()}>
                                {sendingMessage ? 'Sending...' : 'Send'}
                            </button>
                        </form>
                    </>
                ) : (
                    <div style={{textAlign: 'center', marginTop: '3rem'}}>Select a conversation or search for a user to start chatting.</div>
                )}
                {error && <p className="error-message" style={{marginTop: '1rem'}}>{error}</p>} 

                {/* Report Modal */}
                {showReportModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0,0,0,0.5)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{
                            backgroundColor: 'white',
                            padding: '2rem',
                            borderRadius: '8px',
                            width: '90%',
                            maxWidth: '500px'
                        }}>
                            <h3>Report Message</h3>
                            <p>Please describe why you are reporting this message:</p>
                            <textarea
                                value={reportDescription}
                                onChange={(e) => setReportDescription(e.target.value)}
                                style={{
                                    width: '100%',
                                    minHeight: '100px',
                                    margin: '1rem 0',
                                    padding: '0.5rem'
                                }}
                                placeholder="Enter your complaint description..."
                            />
                            {reportError && <p style={{ color: 'red' }}>{reportError}</p>}
                            {reportSuccess && <p style={{ color: 'green' }}>{reportSuccess}</p>}
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                                <button onClick={() => setShowReportModal(false)}>Cancel</button>
                                <button onClick={handleSubmitReport}>Submit Report</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

// You might need a debounce hook (useDebounce.js)
// Example basic implementation:
/*
import { useState, useEffect } from 'react';

export default function useDebounce(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
*/

export default PrivateChatPage; 