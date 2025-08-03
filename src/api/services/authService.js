import api from '../axios';

export const authService = {
    login: (username, password) => {
        return api.post('/auth/login', { username, password });
    },
    logout: () => {
        return api.post('/auth/logout');
    },
    updateMyProfile: (user) => {
        return api.post('/auth/me/profiles', user);
    },
    refreshToken: () => {
        return api.post('/auth/refresh');
    },
    me: () => {
        return api.get('/auth/me');
    },
    startImpersonateUser: (uuid) => {
        return api.post(`/auth/impersonate/start/${uuid}`);
    },
    leaveImpersonateUser: () => {
        return api.post('/auth/impersonate/leave');
    }
};