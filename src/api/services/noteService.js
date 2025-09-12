import api from '../axios';

export const noteService = {
    list: (params) => api.get('/notes', { params }),
    get: (id) => api.get(`/notes/${id}`),
    // payload can be JSON or FormData; pass optional axios config as second arg
    create: (payload, config = {}) => api.post('/notes', payload, config),
    update: (id, payload) => api.put(`/notes/${id}`, payload),
    remove: (id) => api.delete(`/notes/${id}`),
};
