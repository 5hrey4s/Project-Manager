import axios from 'axios';

// Create a new Axios instance with a base URL
const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
});

// Function to get the auth token from localStorage
const getToken = () => localStorage.getItem('token');

// Create a config object with the auth header
const authHeader = () => ({
    headers: { 'x-auth-token': getToken() }
});

// --- API Functions ---

// Project Details
export const getProjectDetails = (projectId) => {
    return apiClient.get(`/api/projects/${projectId}`, authHeader());
};

// Project Tasks
export const getProjectTasks = (projectId) => {
    return apiClient.get(`/api/projects/${projectId}/tasks`, authHeader());
};

// Project Members
export const getProjectMembers = (projectId) => {
    return apiClient.get(`/api/projects/${projectId}/members`, authHeader());
};

// Update Task Status
export const updateTaskStatus = (taskId, status) => {
    return apiClient.patch(`/api/tasks/${taskId}/status`, { status }, authHeader());
};

// Assign Task
export const assignTask = (taskId, assigneeId) => {
    return apiClient.patch(`/api/tasks/${taskId}/assign`, { assigneeId }, authHeader());
};

// Invite Member
export const inviteMember = (projectId, email) => {
    return apiClient.post(`/api/projects/${projectId}/invitations`, { email }, authHeader());
};

// AI Task Generator
export const generateAiTasks = (projectId, goal) => {
    return apiClient.post('/api/ai/generate-tasks', { projectId, goal }, authHeader());
};

// AI Copilot
export const queryCopilot = (projectId, message) => {
    return apiClient.post('/api/ai/copilot', { projectId, message }, authHeader());
};



// Accept a Project Invitation
export const acceptInvitation = (invitationId) => {
    return apiClient.post(`/api/invitations/${invitationId}/accept`, {}, authHeader());
};

// Decline a Project Invitation
export const declineInvitation = (invitationId) => {
    return apiClient.post(`/api/invitations/${invitationId}/decline`, {}, authHeader());
};

// Create Task
export const createTask = (projectId, title) => {
    return apiClient.post('/api/tasks', { projectId, title }, authHeader());
};

// Update a Task's Details
export const updateTask = (taskId, taskData) => {
    return apiClient.put(`/api/tasks/${taskId}`, taskData, authHeader());
};
