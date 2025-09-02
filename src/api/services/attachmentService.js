import api from '../axios';

export const attachmentService = {
    list: (params) => api.get('/attachments', { params }),
    get: (slug) => api.get(`/attachments/${slug}`),
    create: (payload) => api.post('/attachments', payload),
    update: (slug, payload) => api.put(`/attachments/${slug}`, payload),
    remove: (slug) => api.delete(`/attachments/${slug}`),
};
