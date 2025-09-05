import api from '../axios';

export const auditLogsService = {
    list: (params) => api.get('/audit-logs', { params }),
};
