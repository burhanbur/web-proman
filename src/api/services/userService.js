import api from '../axios';

export const userService = {
    list: (params) => api.get('/users', { params }),
    get: (uuid) => api.get(`/users/${uuid}`),
    create: (payload) => api.post('/users', payload),
    update: (uuid, payload) => api.put(`/users/${uuid}`, payload),
    remove: (uuid) => api.delete(`/users/${uuid}`),
};
