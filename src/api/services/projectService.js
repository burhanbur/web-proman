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
    removeMember: (slug, payload) => api.delete(`/projects/${slug}/users`, { data: payload }),

    // Additional methods for new features
    getProject: (workspaceSlug, projectSlug) => api.get(`/workspaces/${workspaceSlug}/projects/${projectSlug}`),
    getProjects: (workspaceSlug, params = {}) => api.get(`/workspaces/${workspaceSlug}/projects`, { params }),
    
    // Create project in workspace
    createProject: (workspaceSlug, projectData) => api.post(`/workspaces/${workspaceSlug}/projects`, projectData),
    
    // Update project
    updateProject: (workspaceSlug, projectSlug, projectData) => api.put(`/workspaces/${workspaceSlug}/projects/${projectSlug}`, projectData),
    
    // Delete project
    deleteProject: (workspaceSlug, projectSlug) => api.delete(`/workspaces/${workspaceSlug}/projects/${projectSlug}`),
    
    // Get project members
    getProjectMembers: (workspaceSlug, projectSlug) => api.get(`/workspaces/${workspaceSlug}/projects/${projectSlug}/members`),
    
    // Invite member to project
    inviteMember: (workspaceSlug, projectSlug, inviteData) => api.post(`/workspaces/${workspaceSlug}/projects/${projectSlug}/invite`, inviteData),
    
    // Update member role in project
    updateMemberRole: (workspaceSlug, projectSlug, userId, role) => api.patch(`/workspaces/${workspaceSlug}/projects/${projectSlug}/members/${userId}/role`, { role }),
    
    // Remove member from project
    removeMemberFromProject: (workspaceSlug, projectSlug, userId) => api.delete(`/workspaces/${workspaceSlug}/projects/${projectSlug}/members/${userId}`),
    
    // Get project activities
    getProjectActivities: (workspaceSlug, projectSlug, params = {}) => api.get(`/workspaces/${workspaceSlug}/projects/${projectSlug}/activities`, { params }),
    
    // Get project statistics
    getProjectStats: (workspaceSlug, projectSlug) => api.get(`/workspaces/${workspaceSlug}/projects/${projectSlug}/stats`),
    
    // Archive/unarchive project
    archiveProject: (workspaceSlug, projectSlug) => api.patch(`/workspaces/${workspaceSlug}/projects/${projectSlug}/archive`),
    unarchiveProject: (workspaceSlug, projectSlug) => api.patch(`/workspaces/${workspaceSlug}/projects/${projectSlug}/unarchive`),
    
    // Get project files
    getProjectFiles: (workspaceSlug, projectSlug, params = {}) => api.get(`/workspaces/${workspaceSlug}/projects/${projectSlug}/files`, { params }),
    
    // Upload project file
    uploadProjectFile: (workspaceSlug, projectSlug, file) => {
        const formData = new FormData();
        formData.append('file', file);
        return api.post(`/workspaces/${workspaceSlug}/projects/${projectSlug}/files`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
    },
    
    // Delete project file
    deleteProjectFile: (workspaceSlug, projectSlug, fileId) => api.delete(`/workspaces/${workspaceSlug}/projects/${projectSlug}/files/${fileId}`)
};
