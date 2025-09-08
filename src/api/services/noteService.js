import api from '../axios';

export const noteService = {
    list: (params) => api.get('/notes', { params }),
    get: (id) => api.get(`/notes/${id}`),
    create: (payload) => api.post('/notes', payload),
    update: (id, payload) => api.put(`/notes/${id}`, payload),
    remove: (id) => api.delete(`/notes/${id}`),
};
