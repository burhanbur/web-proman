import api from '../axios';

export const attachmentService = {
    list: (params) => api.get('/attachments', { params }),
    get: (uuid) => api.get(`/attachments/${uuid}`),
    create: (payload) => api.post('/attachments', payload, {
        headers: {
            'Content-Type': 'multipart/form-data'
        }
    }),
    update: (uuid, payload) => api.put(`/attachments/${uuid}`, payload),
    
    remove: (uuid) => api.delete(`/attachments/${uuid}`),
    download: (modelType, modelId, uuid) => api.get(`/attachments/${modelType}/${modelId}/${uuid}/download`, {
        responseType: 'blob'
    }),
};
