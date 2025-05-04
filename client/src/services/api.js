import axios from 'axios';

// Determine the base URL for the API
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// --- Axios Request Interceptor --- 
// Add the JWT token (if available) to the Authorization header for all requests
api.interceptors.request.use(
  (config) => {
    // Attempt to get the token from localStorage (or context/state management)
    const token = localStorage.getItem('authToken'); 
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- Axios Response Interceptor --- 
// Handle common responses or errors globally if needed
api.interceptors.response.use(
  (response) => {
    // Any status code that lie within the range of 2xx cause this function to trigger
    return response;
  },
  (error) => {
    // Any status codes that falls outside the range of 2xx cause this function to trigger
    console.error('API Error:', error.response || error.message);
    
    // Example: Handle 401 Unauthorized (e.g., invalid token)
    if (error.response && error.response.status === 401) {
      // Could trigger a logout action here
      console.error('Unauthorized access - 401');
      // localStorage.removeItem('authToken');
      // Redirect to login? (Requires access to routing context or history object)
      // window.location.href = '/login'; 
    }

    // Forward the error so components can handle specific cases
    return Promise.reject(error);
  }
);

// --- Authentication API Calls --- 
export const registerUser = (userData) => api.post('/auth/register', userData);
export const loginUser = (credentials) => api.post('/auth/login', credentials);
export const getMe = () => api.get('/auth/me');

// --- Project API Calls --- 
export const getProjects = () => api.get('/projects');
export const getProjectById = (id) => api.get(`/projects/${id}`);
export const createProject = (projectData) => api.post('/projects', projectData);
export const updateProject = (id, projectData) => api.put(`/projects/${id}`, projectData);
export const deleteProject = (id) => api.delete(`/projects/${id}`);
export const removeProjectMember = (projectId, memberId) => api.delete(`/projects/${projectId}/members/${memberId}`);
export const removeProjectSupervisor = (projectId) => api.delete(`/projects/${projectId}/supervisor`);
export const removeProjectRecruiter = (projectId) => api.delete(`/projects/${projectId}/recruiter`);

// --- Request API Calls --- 
export const createRequest = (requestData) => api.post('/requests', requestData);
export const getRequests = (params = {}) => api.get('/requests', { params }); // Pass potential filters
export const getRequestById = (id) => api.get(`/requests/${id}`);
export const updateRequestStatus = (id, status) => api.put(`/requests/${id}/status`, { status });

// --- User (Admin & General) API Calls --- 
export const getUsers = () => api.get('/users'); // Admin: Get all users
export const getUserById = (id) => api.get(`/users/${id}`); // Admin: Get specific user
export const deleteUser = (id) => api.delete(`/users/${id}`); // Admin: Delete user
export const getSupervisors = () => api.get('/users/supervisors'); // Get potential supervisors
export const getRecruiters = () => api.get('/users/recruiters'); // Get potential recruiters

// --- Chat API Calls (Project Group Chat) ---
export const getChatMessages = (projectId) => api.get(`/chat/${projectId}`);
export const postChatMessage = (projectId, content) => api.post(`/chat/${projectId}`, { content });

// --- Private Chat API Calls (1-on-1) ---
export const getMyConversations = () => api.get('/private-chat/conversations');
export const getPrivateMessages = (otherUserId) => api.get(`/private-chat/messages/${otherUserId}`);
export const sendPrivateMessage = (receiverId, content) => api.post(`/private-chat/messages/${receiverId}`, { content });

// Update User search API call
export const searchUsers = (query) => api.get(`/users/search?q=${encodeURIComponent(query)}`);

// Complaints
export const createComplaint = (data) => api.post('/complaints', data);
export const getComplaints = () => api.get('/complaints');
export const getUserComplaints = () => api.get('/complaints/user');
export const updateComplaintStatus = (id, data) => api.put(`/complaints/${id}/status`, data);

// Supervisor Ideas API
export const getSupervisorIdeas = () => {
    return api.get('/supervisor/ideas')
        .then(response => {
            console.log('Get ideas response:', response);
            return response;
        })
        .catch(error => {
            console.error('Error getting ideas:', error);
            throw error;
        });
};

export const getSupervisorIdeasById = (supervisorId) => {
    return api.get(`/supervisor/${supervisorId}/ideas`)
        .then(response => {
            console.log('Get supervisor ideas response:', response);
            return response;
        })
        .catch(error => {
            console.error('Error getting supervisor ideas:', error);
            throw error;
        });
};

export const createSupervisorIdea = (ideaData) => {
    return api.post('/supervisor/ideas', ideaData)
        .then(response => {
            console.log('Create idea response:', response);
            return response;
        })
        .catch(error => {
            console.error('Error creating idea:', error);
            throw error;
        });
};

export const deleteSupervisorIdea = (ideaId) => {
    return api.delete(`/supervisor/ideas/${ideaId}`)
        .then(response => {
            console.log('Delete idea response:', response);
            return response;
        })
        .catch(error => {
            console.error('Error deleting idea:', error);
            throw error;
        });
};

// Sponsored Projects API
export const getSponsoredProjects = () => {
    return api.get('/recruiter/projects')
        .then(response => {
            console.log('Get sponsored projects response:', response);
            return response;
        })
        .catch(error => {
            console.error('Error getting sponsored projects:', error);
            throw error;
        });
};

export const createSponsoredProject = (projectData) => {
    return api.post('/recruiter/projects', projectData)
        .then(response => {
            console.log('Create sponsored project response:', response);
            return response;
        })
        .catch(error => {
            console.error('Error creating sponsored project:', error);
            throw error;
        });
};

export const deleteSponsoredProject = (projectId) => {
    return api.delete(`/recruiter/projects/${projectId}`)
        .then(response => {
            console.log('Delete sponsored project response:', response);
            return response;
        })
        .catch(error => {
            console.error('Error deleting sponsored project:', error);
            throw error;
        });
};

export const getStudents = () => {
    return api.get('/users/students')
        .then(response => {
            console.log('Get students response:', response);
            return response;
        })
        .catch(error => {
            console.error('Error getting students:', error);
            throw error;
        });
};

// Recruiter Projects API
export const getRecruiterProjects = (recruiterId) => {
    return api.get(`/recruiter/${recruiterId}/projects`)
        .then(response => {
            console.log('Get recruiter projects response:', response);
            return response;
        })
        .catch(error => {
            console.error('Error getting recruiter projects:', error);
            throw error;
        });
};

// User Skills API
export const updateUserSkills = (skills) => {
    return api.put('/users/skills', { skills })
        .then(response => {
            console.log('Update skills response:', response);
            return response;
        })
        .catch(error => {
            console.error('Error updating skills:', error);
            throw error;
        });
};

export default api; 