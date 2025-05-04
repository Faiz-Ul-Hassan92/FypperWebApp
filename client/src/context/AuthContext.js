import React, { createContext, useState, useEffect, useContext } from 'react';
import * as api from '../services/api'; // Import API service

// Create Context
const AuthContext = createContext();

// Provider Component
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // To handle initial auth check
  const [error, setError] = useState(null);

  // Effect to check for existing token on initial load
  useEffect(() => {
    const checkLoggedIn = async () => {
      const token = localStorage.getItem('authToken');
      if (token) {
        try {
          // No need to set the header here, axios interceptor does it
          const response = await api.getMe(); 
          setUser(response.data.data); // Assuming API returns { success: true, data: user }
        } catch (err) {
          console.error('Auth check failed:', err);
          localStorage.removeItem('authToken'); // Remove invalid token
          setUser(null);
        }
      } else {
          setUser(null); // Ensure user is null if no token
      }
      setLoading(false);
    };
    checkLoggedIn();
  }, []);

  // Register function
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.registerUser(userData);
      localStorage.setItem('authToken', response.data.token);
      setUser(response.data); // Assuming API returns user data + token
      setLoading(false);
      return response.data; // Indicate success
    } catch (err) {
      console.error('Registration Error:', err.response?.data?.message || err.message);
      setError(err.response?.data?.message || 'Registration failed');
      setLoading(false);
      throw err; // Re-throw error for component handling
    }
  };

  // Login function
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.loginUser(credentials);
      localStorage.setItem('authToken', response.data.token);
      // Fetch user details after setting token
      const userDetailsResponse = await api.getMe(); 
      setUser(userDetailsResponse.data.data); 
      setLoading(false);
      return userDetailsResponse.data.data; // Return user data
    } catch (err) {
      console.error('Login Error:', err.response?.data?.message || err.message);
      setError(err.response?.data?.message || 'Invalid credentials');
      setLoading(false);
      throw err; // Re-throw error for component handling
    }
  };

  // Logout function
  const logout = () => {
    localStorage.removeItem('authToken');
    setUser(null);
    // Optionally redirect to login or home page
    // navigate('/login'); // Would need useNavigate hook here or pass it down
  };

  // Context value
  const value = {
    user,
    isAuthenticated: !!user, // Boolean flag derived from user state
    loading,
    error,
    register,
    login,
    logout,
    setError // Allow components to clear errors if needed
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = () => {
  return useContext(AuthContext);
}; 