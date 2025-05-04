import React from 'react';
import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate
} from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Pages
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailsPage from './pages/ProjectDetailsPage';
import DashboardPage from './pages/DashboardPage';
import CreateProjectPage from './pages/CreateProjectPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import ProjectChatPage from './pages/ProjectChatPage';
import RequestsPage from './pages/RequestsPage';
import PrivateChatPage from './pages/PrivateChatPage';
import ComplaintsView from './components/ComplaintsView';
import AdminComplaintsView from './components/AdminComplaintsView';
import SupervisorHomePage from './pages/SupervisorHomePage';
import RecruiterHomePage from './pages/RecruiterHomePage';
import AdminHomePage from './pages/AdminHomePage';
import IdeasPage from './pages/IdeasPage';
import SponsoredProjectsPage from './pages/SponsoredProjectsPage';
import SearchPage from './pages/SearchPage';

// Components
import Navbar from './components/Navbar';

// Higher-order component for protected routes
const ProtectedRoute = ({ children, roles }) => {
    const { user, loading, isAuthenticated } = useAuth();

    if (loading) {
        return <div>Loading authentication status...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (roles && roles.length > 0 && !roles.includes(user?.role)) {
        console.warn(`User role '${user?.role}' not authorized for this route. Allowed roles: ${roles.join(', ')}`);
        return <Navigate to="/" replace />;
    }

    return children;
};

function AppContent() {
    const { user } = useAuth();

    return (
        <Router>
            <Navbar />
            <div className="container">
                <Routes>
                    {/* Public Routes */}
                    <Route path="/" element={<HomePage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />
                    <Route path="/home" element={
                        <ProtectedRoute>
                            {user?.role === 'student' && <HomePage />}
                            {user?.role === 'supervisor' && <SupervisorHomePage />}
                            {user?.role === 'recruiter' && <RecruiterHomePage />}
                            {user?.role === 'admin' && <AdminHomePage />}
                        </ProtectedRoute>
                    } />

                    {/* Protected Routes (require login) */}
                    <Route 
                        path="/projects" 
                        element={
                            <ProtectedRoute>
                                <ProjectsPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route 
                        path="/projects/:id" 
                        element={
                             <ProtectedRoute>
                                <ProjectDetailsPage />
                            </ProtectedRoute>
                        }
                    />
                     <Route 
                        path="/create-project" 
                        element={
                             <ProtectedRoute roles={['student']}>
                                <CreateProjectPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route 
                        path="/ideas" 
                        element={
                             <ProtectedRoute roles={['supervisor']}>
                                <IdeasPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route 
                        path="/sponsored-projects" 
                        element={
                            <ProtectedRoute roles={['recruiter']}>
                                <SponsoredProjectsPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route 
                        path="/dashboard" 
                        element={
                             <ProtectedRoute>
                                <DashboardPage />
                            </ProtectedRoute>
                        } 
                    />
                    
                    {/* Admin Routes */}
                     <Route 
                        path="/admin" 
                        element={
                             <ProtectedRoute roles={['admin']}>
                                <AdminDashboardPage />
                            </ProtectedRoute>
                        } 
                    />

                    {/* Chat Routes */}
                    <Route 
                        path="/chat/:projectId" 
                        element={
                            <ProtectedRoute>
                                <ProjectChatPage />
                            </ProtectedRoute>
                        }
                    />
                    <Route 
                        path="/private-chats" 
                        element={
                            <ProtectedRoute>
                                <PrivateChatPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* Requests Route */}
                    <Route 
                        path="/requests" 
                        element={
                            <ProtectedRoute>
                                <RequestsPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* Complaints Route */}
                    <Route path="/complaints" element={<ComplaintsView />} />

                    {/* Admin Complaints Route */}
                    <Route path="/admin/complaints" element={<AdminComplaintsView />} />

                    {/* Search Route */}
                    <Route 
                        path="/search" 
                        element={
                            <ProtectedRoute>
                                <SearchPage />
                            </ProtectedRoute>
                        }
                    />

                    {/* Catch-all route */}
                    <Route path="*" element={<Navigate to="/" replace />} /> 
                </Routes>
            </div>
        </Router>
    );
}

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App; 