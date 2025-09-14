import api from '../axios';

export const projectService = {
    // Basic CRUD operations
    list: (params) => api.get('/projects', { params }),
    get: (slug) => api.get(`/projects/${slug}`),
    create: (payload, config = {}) => api.post('/projects', payload, config),
    update: (slug, payload, config = {}) => {
        if (typeof FormData !== 'undefined' && payload instanceof FormData) {
            if (!payload.has('_method')) payload.append('_method', 'PUT');
            return api.post(`/projects/${slug}`, payload, config);
        }
        return api.put(`/projects/${slug}`, payload, config);
    },
    remove: (slug) => api.delete(`/projects/${slug}`),
    
    // Member management
    addMember: (slug, payload) => api.post(`/projects/${slug}/users`, payload),
    updateMember: (slug, payload) => api.put(`/projects/${slug}/users`, payload),
    removeMember: (slug, payload) => api.delete(`/projects/${slug}/users`, { data: payload }),

    getProjectActivities: (slug, params = {}) => api.get(`/projects/${slug}/activities`, { params }),
    getProjectAttachments: (slug, params = {}) => api.get(`/projects/${slug}/attachments`, { params }),
    
    // Status management for project (create, update, delete)
    getProjectStatus: (slug) => api.get(`/projects/${slug}/status`),
    createStatus: (slug, payload) => api.post(`/projects/${slug}/status`, payload),
    updateStatus: (slug, statusId, payload) => api.put(`/projects/${slug}/status/${statusId}`, payload),
    deleteStatus: (slug, statusId) => api.delete(`/projects/${slug}/status/${statusId}`),
    // Reorder statuses for a project. payload: { orders: [{ id, order }, ...] } or { order: [id, id, ...] }
    updateStatusOrder: (slug, payload) => api.put(`/projects/${slug}/status/order`, payload),

    getTemplateStatus: () => api.get('/template-status'),
    getProjectRoles: (slug) => api.get(`/project-roles/${slug}/roles/dropdown`),
};
