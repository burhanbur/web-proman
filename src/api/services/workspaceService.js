import api from '../axios';

export const workspaceService = {
    list: (params) => api.get('/workspaces', { params }),
    get: (slug) => api.get(`/workspaces/${slug}`),
    create: (payload) => api.post('/workspaces', payload),
    update: (slug, payload) => api.put(`/workspaces/${slug}`, payload),
    remove: (slug) => api.delete(`/workspaces/${slug}`),
    addMember: (slug, payload) => api.post(`/workspaces/${slug}/users`, payload),
    updateMember: (slug, payload) => api.put(`/workspaces/${slug}/users`, payload),
    removeMember: (slug, payload) => api.delete(`/workspaces/${slug}/users`, { data: payload }),
};
