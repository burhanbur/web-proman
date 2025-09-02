import api from '../axios';

export const workspaceService = {
    // Basic CRUD operations
    list: (params) => api.get('/workspaces', { params }),
    get: (slug) => api.get(`/workspaces/${slug}`),
    create: (payload) => api.post('/workspaces', payload),
    update: (slug, payload) => api.put(`/workspaces/${slug}`, payload),
    remove: (slug) => api.delete(`/workspaces/${slug}`),
    
    // Member management
    addMember: (slug, payload) => api.post(`/workspaces/${slug}/users`, payload),
    updateMember: (slug, payload) => api.put(`/workspaces/${slug}/users`, payload),
    removeMember: (slug, payload) => api.delete(`/workspaces/${slug}/users`, { data: payload }),

    // Additional methods for new features
    getWorkspace: (slug) => api.get(`/workspaces/${slug}`),
    getWorkspaces: (params = {}) => api.get('/workspaces', { params }),
    
    // Get workspace members
    getWorkspaceMembers: (slug) => api.get(`/workspaces/${slug}/members`),
    
    // Get workspace activities
    getWorkspaceActivities: (slug, params = {}) => api.get(`/workspaces/${slug}/activities`, { params }),
    
    // Invite member to workspace
    inviteMember: (slug, inviteData) => api.post(`/workspaces/${slug}/invite`, inviteData),
    
    // Update member role
    updateMemberRole: (slug, userId, role) => api.patch(`/workspaces/${slug}/members/${userId}/role`, { role }),
    
    // Get workspace statistics
    getWorkspaceStats: (slug) => api.get(`/workspaces/${slug}/stats`),
    
    // Export workspace data
    exportWorkspace: (slug) => api.get(`/workspaces/${slug}/export`, {
        responseType: 'blob'
    })
};
