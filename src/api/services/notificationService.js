import api from '../axios';

export const notificationService = {
    getNotifications: () => {
        return api.get('/notifications');
    },
    createNotification: (params) => {
        return api.post('/notifications', params);
    },
    updateReadStatus: (uuid) => {
        return api.put(`/notifications/${uuid}`);
    },
    deleteNotification: (uuid) => {
        return api.delete(`/notifications/${uuid}`);
    },
    readAllNotification: () => {
        return api.put('/notifications/read-all');
    },
};