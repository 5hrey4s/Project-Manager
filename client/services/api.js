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
export const generateAiTasks = (goal, projectId) => {
    const token = localStorage.getItem('token');
    const apiUrl = process.env.NEXT_PUBLIC_API_URL;

    // --- THIS IS THE FIX ---
    // Ensure the object keys match what the backend expects:
    // { goal: "the user's text", projectId: "the project's ID" }
    const body = {
        goal: goal,
        projectId: projectId,
    };

    return axios.post(`${apiUrl}/api/ai/generate-tasks`, body, {
        headers: { 'x-auth-token': token },
    });
}; export const queryCopilot = (projectId, message) => apiClient.post('/api/ai/copilot', { projectId, message }, authHeader());
export const assignTask = (taskId, assigneeId) => apiClient.patch(`/api/tasks/${taskId}/assign`, { assigneeId }, authHeader());

export const acceptInvitation = (invitationId) => {
    return apiClient.post(`/api/invitations/${invitationId}/accept`, {}, authHeader());
};

// Decline a Project Invitation
export const declineInvitation = (invitationId) => {
    return apiClient.post(`/api/invitations/${invitationId}/decline`, {}, authHeader());
};

export const addComment = (taskId, content) => {
    return apiClient.post(`/api/tasks/${taskId}/comments`, { content }, authHeader());
};

// Get a secure URL from the backend to upload a file to
export const getAttachmentUploadUrl = (taskId, { fileName, fileType }) => {
    return apiClient.post(`/api/attachments/presigned-url/tasks/${taskId}`, { fileName, fileType }, authHeader());
};

// Tell our backend to save the attachment details after a successful upload
export const addAttachmentRecord = (taskId, attachmentData) => {
    return apiClient.post(`/api/attachments/record/tasks/${taskId}`, attachmentData, authHeader());
};

// Delete an attachment
export const deleteAttachment = (attachmentId) => {
    return apiClient.delete(`/api/attachments/${attachmentId}`, authHeader());
};

export const linkTaskToGithub = (taskId, prUrl) => {
    return apiClient.post(`/api/integrations/tasks/${taskId}/link-github`, { prUrl }, authHeader());
};

export const getPrStatus = (taskId) => {
    const token = localStorage.getItem('token');
    return axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/integrations/tasks/${taskId}/link-status`, {
        headers: { 'x-auth-token': token }
    });
};

export const searchItems = (query) => {
    const token = localStorage.getItem('token');
    return axios.get(`${process.env.NEXT_PUBLIC_API_URL}/api/search?q=${query}`, {
        headers: { 'x-auth-token': token }
    });
};

