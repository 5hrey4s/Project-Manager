import axios from 'axios';

const apiClient = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL,
});

const getToken = () => localStorage.getItem('token');
const authHeader = () => ({
    headers: { 'x-auth-token': getToken() }
});

// --- API Functions ---
export const getProjectDetails = (projectId) => apiClient.get(`/api/projects/${projectId}`, authHeader());
export const getProjectTasks = (projectId) => apiClient.get(`/api/projects/${projectId}/tasks`, authHeader());
export const getProjectMembers = (projectId) => apiClient.get(`/api/projects/${projectId}/members`, authHeader());
export const getTaskDetails = (taskId) => apiClient.get(`/api/tasks/${taskId}/details`, authHeader());

// --- THIS IS THE FIX ---
// This function now accepts a single object with all task data
export const createTask = (taskData) => {
    return apiClient.post('/api/tasks', taskData, authHeader());
};

export const updateTask = (taskId, taskData) => apiClient.put(`/api/tasks/${taskId}`, taskData, authHeader());
export const updateTaskStatus = (taskId, status) => apiClient.patch(`/api/tasks/${taskId}/status`, { status }, authHeader());
export const deleteTask = (taskId) => apiClient.delete(`/api/tasks/${taskId}`, authHeader());
export const inviteMember = (projectId, email) => apiClient.post(`/api/projects/${projectId}/invitations`, { email }, authHeader());
export const generateAiTasks = (projectId, goal) => apiClient.post('/api/ai/generate-tasks', { projectId, goal }, authHeader());
export const queryCopilot = (projectId, message) => apiClient.post('/api/ai/copilot', { projectId, message }, authHeader());
export const assignTask = (taskId, assigneeId) => apiClient.patch(`/api/tasks/${taskId}/assign`, { assigneeId }, authHeader());

export const acceptInvitation = (invitationId) => {
    return apiClient.post(`/api/invitations/${invitationId}/accept`, {}, authHeader());
};

// Decline a Project Invitation
export const declineInvitation = (invitationId) => {
    return apiClient.post(`/api/invitations/${invitationId}/decline`, {}, authHeader());
};