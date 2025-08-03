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

export default api;