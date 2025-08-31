import axios from 'axios';
import { authService } from './services/authService';
import { useRouter } from 'vue-router';
import { jwtDecode } from 'jwt-decode';
import { successToast, errorToast, warningToast } from '@/utils/toast'

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL,
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    },
});

// Activity tracking
let lastActivity = Date.now();

// Track user activity
const updateActivity = () => {
    lastActivity = Date.now();
    // const formattedTime = new Date(lastActivity).toLocaleTimeString();
    // console.log('User activity updated:', formattedTime);
}

// Setup activity listeners
if (typeof window !== 'undefined') {
    ['mousedown', 'keydown', 'scroll', 'touchstart', 'wheel', 'mousemove'].forEach(event => {
        window.addEventListener(event, updateActivity);
    });
}

// Response interceptor untuk menangani error
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Jika ada response dari server, gunakan message dari response
        if (error.response?.data?.message) {
            error.message = error.response.data.message;
        }
        
        return Promise.reject(error);
    }
);

export default api;