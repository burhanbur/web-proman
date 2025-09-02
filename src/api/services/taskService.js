import api from '../axios';

export const taskService = {
    // Basic CRUD operations
    list: (params) => api.get('/tasks', { params }),
    get: (slug) => api.get(`/tasks/${slug}`),
    create: (payload) => api.post('/tasks', payload),
    update: (slug, payload) => api.put(`/tasks/${slug}`, payload),
    remove: (slug) => api.delete(`/tasks/${slug}`),

    // Get tasks for a project
    getTasks(workspaceSlug, projectSlug, params = {}) {
        return api.get(`/workspaces/${workspaceSlug}/projects/${projectSlug}/tasks`, { params });
    },

    // Get task by ID
    getTask(workspaceSlug, projectSlug, taskId) {
        return api.get(`/workspaces/${workspaceSlug}/projects/${projectSlug}/tasks/${taskId}`);
    },

    // Create new task
    createTask(workspaceSlug, projectSlug, taskData) {
        return api.post(`/workspaces/${workspaceSlug}/projects/${projectSlug}/tasks`, taskData);
    },

    // Update task
    updateTask(workspaceSlug, projectSlug, taskId, taskData) {
        return api.put(`/workspaces/${workspaceSlug}/projects/${projectSlug}/tasks/${taskId}`, taskData);
    },

    // Delete task
    deleteTask(workspaceSlug, projectSlug, taskId) {
        return api.delete(`/workspaces/${workspaceSlug}/projects/${projectSlug}/tasks/${taskId}`);
    },

    // Update task status
    updateTaskStatus(workspaceSlug, projectSlug, taskId, status) {
        return api.patch(`/workspaces/${workspaceSlug}/projects/${projectSlug}/tasks/${taskId}/status`, { status });
    },

    // Assign task to user
    assignTask(workspaceSlug, projectSlug, taskId, userId) {
        return api.post(`/workspaces/${workspaceSlug}/projects/${projectSlug}/tasks/${taskId}/assign`, { user_id: userId });
    },

    // Unassign task from user
    unassignTask(workspaceSlug, projectSlug, taskId, userId) {
        return api.delete(`/workspaces/${workspaceSlug}/projects/${projectSlug}/tasks/${taskId}/assign/${userId}`);
    },

    // Get task comments
    getTaskComments(workspaceSlug, projectSlug, taskId) {
        return api.get(`/workspaces/${workspaceSlug}/projects/${projectSlug}/tasks/${taskId}/comments`);
    },

    // Add comment to task
    addTaskComment(workspaceSlug, projectSlug, taskId, comment) {
        return api.post(`/workspaces/${workspaceSlug}/projects/${projectSlug}/tasks/${taskId}/comments`, comment);
    },

    // Update task comment
    updateTaskComment(workspaceSlug, projectSlug, taskId, commentId, comment) {
        return api.put(`/workspaces/${workspaceSlug}/projects/${projectSlug}/tasks/${taskId}/comments/${commentId}`, comment);
    },

    // Delete task comment
    deleteTaskComment(workspaceSlug, projectSlug, taskId, commentId) {
        return api.delete(`/workspaces/${workspaceSlug}/projects/${projectSlug}/tasks/${taskId}/comments/${commentId}`);
    },

    // Get task attachments
    getTaskAttachments(workspaceSlug, projectSlug, taskId) {
        return api.get(`/workspaces/${workspaceSlug}/projects/${projectSlug}/tasks/${taskId}/attachments`);
    },

    // Upload task attachment
    uploadTaskAttachment(workspaceSlug, projectSlug, taskId, file) {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/workspaces/${workspaceSlug}/projects/${projectSlug}/tasks/${taskId}/attachments`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },

    // Delete task attachment
    deleteTaskAttachment(workspaceSlug, projectSlug, taskId, attachmentId) {
        return api.delete(`/workspaces/${workspaceSlug}/projects/${projectSlug}/tasks/${taskId}/attachments/${attachmentId}`);
    }
};
