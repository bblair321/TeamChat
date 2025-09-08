import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL || "http://192.168.0.198:8000";

// Create axios instance with default config
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for better error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    // Handle network errors
    if (!error.response) {
      error.code = "NETWORK_ERROR";
      error.message = "Network error. Please check your connection.";
    }

    // Handle specific HTTP status codes
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem("token");
      window.dispatchEvent(new CustomEvent("tokenExpired"));
    }

    return Promise.reject(error);
  }
);

// API functions
export const authAPI = {
  login: (credentials) => api.post("/auth/login", credentials),
  register: (userData) => api.post("/auth/register", userData),
  getProfile: () => api.get("/auth/profile"),
  updateProfile: (profileData) => api.put("/auth/profile", profileData),
  getUsers: () => api.get("/auth/users"),
  updateOnlineStatus: (isOnline) =>
    api.post("/auth/online", { is_online: isOnline }),
};

export const chatAPI = {
  getChannels: () => api.get("/chat/channels"),
  getMessages: (channelId) => api.get(`/chat/channels/${channelId}/messages`),
  sendMessage: (channelId, message) =>
    api.post(`/chat/channels/${channelId}/messages`, message),
  addReaction: (messageId, emoji) =>
    api.post(`/chat/messages/${messageId}/reactions`, { emoji }),
  removeReaction: (messageId, emoji) =>
    api.delete(`/chat/messages/${messageId}/reactions`, { data: { emoji } }),
  deleteChannel: (channelId) => api.delete(`/chat/channels/${channelId}`),
};

// Individual exports for backward compatibility
export const login = authAPI.login;
export const register = authAPI.register;
export const getProfile = authAPI.getProfile;
export const updateProfile = authAPI.updateProfile;
export const getUsers = authAPI.getUsers;
export const updateOnlineStatus = authAPI.updateOnlineStatus;
export const getChannels = chatAPI.getChannels;
export const getMessages = chatAPI.getMessages;
export const sendMessage = chatAPI.sendMessage;
export const addReaction = chatAPI.addReaction;
export const removeReaction = chatAPI.removeReaction;
export const deleteChannel = chatAPI.deleteChannel;
export const createChannel = (channelData) =>
  api.post("/chat/channels", channelData);

export default api;
