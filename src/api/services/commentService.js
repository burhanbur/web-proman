import api from '../axios';

export const commentService = {
    list: (params) => api.get('/comments', { params }),
    get: (slug) => api.get(`/comments/${slug}`),
    create: (payload) => api.post('/comments', payload),
    update: (slug, payload) => api.put(`/comments/${slug}`, payload),
    remove: (slug) => api.delete(`/comments/${slug}`),
};
