import api from '../axios';

export const taskService = {
    // Basic CRUD operations
    list: (params) => api.get('/tasks', { params }),
    get: (uuid) => api.get(`/tasks/${uuid}`),
    create: (payload) => api.post('/tasks', payload),
    update: (uuid, payload) => api.put(`/tasks/${uuid}`, payload),
    remove: (uuid) => api.delete(`/tasks/${uuid}`),

    recent: (params) => api.get('/tasks/recent', { params }),
    todo: (params) => api.get('/tasks/todo', { params }),

    getComments: (taskId) => api.get(`/tasks/${taskId}/comments`),

    // Get task priorities
    getPriorities: () => api.get('/tasks/priorities'),

    // Update task status
    updateTaskStatus(uuid, payload) {
        return api.put(`/tasks/${uuid}/status`, payload);
    },

    // Assign task to user
    assignTask(uuid, userId) {
        return api.post(`/tasks/${uuid}/assign`, { user_id: userId });
    },

    // Unassign task from user
    unassignTask(uuid, userId) {
        return api.delete(`/tasks/${uuid}/assign/${userId}`);
    },
};
