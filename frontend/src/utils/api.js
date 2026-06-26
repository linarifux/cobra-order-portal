import axios from 'axios';

// Ensure this matches your backend server's URL and port
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api/v1';

const api = axios.create({
  baseURL: API_URL,
  // CRITICAL: This allows Axios to send and receive HTTP-only cookies securely
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request Interceptor: Attach the token if it exists in local storage
api.interceptors.request.use(
  (config) => {
    // If you are storing the token locally (e.g., from the login response), grab it here
    const token = localStorage.getItem('token'); 
    
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle global errors (like expired tokens)
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // If the backend returns a 401 Unauthorized, the session has expired or the token is invalid
    if (error.response && error.response.status === 401) {
      // Clear the local token and force the user back to the login screen
      localStorage.removeItem('token');
      // window.location.href = '/login'; // Uncomment this to enforce strict logouts
    }
    return Promise.reject(error);
  }
);

export default api;