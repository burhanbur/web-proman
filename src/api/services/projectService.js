import api from '../axios';

export const projectService = {
    // Basic CRUD operations
    list: (params) => api.get('/projects', { params }),
    get: (slug) => api.get(`/projects/${slug}`),
    create: (payload) => api.post('/projects', payload),
    update: (slug, payload) => api.put(`/projects/${slug}`, payload),
    remove: (slug) => api.delete(`/projects/${slug}`),
    
    // Member management
    addMember: (slug, payload) => api.post(`/projects/${slug}/users`, payload),
    updateMember: (slug, payload) => api.put(`/projects/${slug}/users`, payload),
    removeMember: (slug, payload) => api.delete(`/projects/${slug}/users`, payload),

    // Get project activities
    getProjectActivities: (slug, params = {}) => api.get(`/projects/${slug}/activities`, { params }),
};
