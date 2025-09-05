import api from '../axios';

export const priorityService = {
    list: (params) => api.get('/priorities', { params }),
    get: (id) => api.get(`/priorities/${id}`),
    create: (payload) => api.post('/priorities', payload),
    update: (id, payload) => api.put(`/priorities/${id}`, payload),
    remove: (id) => api.delete(`/priorities/${id}`),
};
