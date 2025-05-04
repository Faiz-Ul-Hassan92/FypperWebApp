import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

function Navbar() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };

    // Don't render anything for unauthenticated users
    if (!user) {
        return null;
    }

    return (
        <nav className="navbar">
            <ul>
                {/* Regular user navigation */}
                {user?.role !== 'admin' && (
                    <>
                        <li><Link to="/dashboard">Dashboard</Link></li>
                        <li><Link to="/requests">Requests</Link></li>
                        <li><Link to="/private-chats">Chats</Link></li>
                        <li><Link to="/projects">Projects</Link></li>
                        <li><Link to="/complaints">Complaints</Link></li>
                        {user?.role === 'student' && (
                            <>
                                <li><Link to="/create-project">Create Project</Link></li>
                                <li><Link to="/search">Search</Link></li>
                            </>
                        )}
                        {user?.role === 'supervisor' && (
                            <li><Link to="/ideas" className="nav-link">IDEAS</Link></li>
                        )}
                        {user?.role === 'recruiter' && (
                            <li><Link to="/sponsored-projects" className="nav-link">SPONSORED PROJECTS</Link></li>
                )}
                        {user?.role === 'admin' && (
                            <li><Link to="/admin" className="nav-link">ADMIN DASHBOARD</Link></li>
                        )}
                    </>
                 )}

                {/* Links on the right (Logout/Welcome) */}
                <li className="nav-right">
                            <span>Welcome, {user?.name} ({user?.role}) </span>
                            <button onClick={handleLogout} className="link-button">Logout</button>
                </li>
            </ul>
        </nav>
    );
}

export default Navbar; 