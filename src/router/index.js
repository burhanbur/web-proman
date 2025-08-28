import { createRouter, createWebHistory } from 'vue-router';
import { useAuthStore } from '@/stores/auth';

import MainLayout from '../layouts/MainLayout.vue';
import AuthLayout from '../layouts/AuthLayout.vue';

import LoginPage from '../pages/LoginPage.vue';
import DashboardPage from '../pages/DashboardPage.vue';

const routes = [
    {
        path: '/',
        redirect: '/dashboard'
    },
    {
        path: '/',
        component: AuthLayout,
        children: [
            {
                path: 'login',
                name: 'login',
                component: LoginPage,
            },
        ],
        meta: { requiresGuest: true }
    },
    {
        path: '/',
        component: MainLayout,
        children: [
            {
                path: 'dashboard',
                name: 'dashboard',
                component: DashboardPage,
            },
        ],
        meta: { requiresAuth: true }
    },
    {
        path: '/:pathMatch(.*)*',
        redirect: '/dashboard'
    }
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes
});

// Navigation guard
router.beforeEach(async (to, from, next) => {
    const authStore = useAuthStore();
    const isGuestRoute = to.matched.some(record => record.meta.requiresGuest);
    const isAuthRoute = to.matched.some(record => record.meta.requiresAuth);
    const isAdminRoute = to.matched.some(record => record.meta.requiresAdmin);

    if (!isGuestRoute && !authStore.isUserLoaded) {
        try {
            await authStore.fetchUserData();
        } catch (error) {
            console.log('Failed to fetch user data:', error);
        }
    }

    const isAuthenticated = authStore.isAuthenticated;

    if (isAuthRoute) {
        if (!isAuthenticated) {
            return next('/login');
        }

        if (isAdminRoute && !authStore.isAdmin) {
            return next('/dashboard');
        }
        
        return next();
    }

    if (isGuestRoute) {
        if (isAuthenticated || authStore.isUserLoaded) {
            return next('/dashboard');
        }
        return next();
    }
    
    return next();
});

export default router;