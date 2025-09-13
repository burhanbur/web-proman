import api from '../axios';

export const workspaceService = {
    // Basic CRUD operations
    list: (params) => api.get('/workspaces', { params }),
    get: (slug) => api.get(`/workspaces/${slug}`),
    create: (payload) => api.post('/workspaces', payload),
    update: (slug, payload, config = {}) => {
        if (typeof FormData !== 'undefined' && payload instanceof FormData) {
            if (!payload.has('_method')) payload.append('_method', 'PUT');
            return api.post(`/workspaces/${slug}`, payload, config);
        }
        return api.put(`/workspaces/${slug}`, payload, config);
    },
    removeLogo: (slug) => api.post(`/workspaces/${slug}/remove-logo`),
    remove: (slug) => api.delete(`/workspaces/${slug}`),
    
    // Member management
    addMember: (slug, payload) => api.post(`/workspaces/${slug}/users`, payload),
    updateMember: (slug, payload) => api.put(`/workspaces/${slug}/users`, payload),
    // axios.delete takes config as the second argument; to send a request body use { data: payload }
    removeMember: (slug, payload) => api.delete(`/workspaces/${slug}/users`, { data: payload }),
    
    // Get workspace activities
    getWorkspaceActivities: (slug, params = {}) => api.get(`/workspaces/${slug}/activities`, { params }),

    getWorkspaceRoles: (slug) => api.get(`/workspace-roles/${slug}/roles/dropdown`),
};
