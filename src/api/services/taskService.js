import api from '../axios';

export const taskService = {
    // Basic CRUD operations
    list: (params) => api.get('/tasks', { params }),
    get: (uuid) => api.get(`/tasks/${uuid}`),
    create: (payload) => api.post('/tasks', payload),
    update: (uuid, payload) => api.put(`/tasks/${uuid}`, payload),
    remove: (uuid) => api.delete(`/tasks/${uuid}`),

    recent: (params) => api.get('/tasks/recent', { params }),

    // Update task status
    updateTaskStatus(uuid, status) {
        return api.put(`/tasks/${uuid}/status`, { status });
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
