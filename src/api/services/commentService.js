import api from '../axios';

export const commentService = {
    list: (params) => api.get('/comments', { params }),
    get: (uuid) => api.get(`/comments/${uuid}`),
    create: (payload) => api.post('/comments', payload),
    update: (uuid, payload) => api.put(`/comments/${uuid}`, payload),
    remove: (uuid) => api.delete(`/comments/${uuid}`),
    // Create comment using FormData (for attachments)
    // Accept optional axios config as second parameter to allow passing multipart headers
    createForm: (formData, config = {}) => api.post('/comments', formData, config),
};
