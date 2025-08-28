// stores/auth.js
import { defineStore } from 'pinia';
import { authService } from '../api/services/authService';
import router from '../router';
import { errorToast, successToast, warningToast } from '@/utils/toast';

export const useAuthStore = defineStore('auth', {
  // State
  state: () => ({
    user: null,
    isUserLoaded: false,
    isLoading: false,
    loadError: null,
    refreshPromise: null,
    isRefreshing: false,
    isUserImpersonating: false,
    impersonatedBy: null,
  }),

  // Getters
  getters: {
    isAuthenticated: (state) => !!state.user,
    isImpersonating: (state) => state.isUserImpersonating,
    isAdmin: (state) => {
      return true;
    },
    fullName: (state) => state.user?.name || 'Pengguna',
    email: (state) => state.user?.email || '',
    roles: (state) => {
        return state.user?.roles || [];
    }
  },

  // Actions
  actions: {
    // Mengambil data user
    async fetchUserData(force = false) {
      // Jika data sudah ada dan tidak dipaksa refresh, gunakan data yang sudah ada
      if (this.isUserLoaded && !force) {
        return this.user;
      }
      
      // Jika sedang loading, jangan mulai request baru
      if (this.isLoading) {
        return new Promise((resolve, reject) => {
          const checkInterval = setInterval(() => {
            if (!this.isLoading) {
              clearInterval(checkInterval);
              if (this.loadError) {
                reject(this.loadError);
              } else {
                resolve(this.user);
              }
            }
          }, 100);
        });
      }
      
      // Mulai request baru
      this.isLoading = true;
      this.loadError = null;
      
      try {
        const response = await authService.me();
        this.user = response.data.data;
        
        // Check impersonation status from user data or custom claims
        const impersonatedBy = response.data.data.impersonated_by;
        this.isUserImpersonating = !!impersonatedBy;
        this.impersonatedBy = impersonatedBy || null;
        
        this.isUserLoaded = true;
        return this.user;
      } catch (error) {
        let message = error;
        if (error && error.response && error.response.data && error.response.data.message) {
          message = error.response.data.message;
        }

        errorToast(message);
        this.loadError = error;
        
        // Logout jika error 401 (token tidak valid)
        if (error.response?.status === 401) {
          this.clearSession();
        }
        
        throw error;
      } finally {
        this.isLoading = false;
      }
    },
    
    // Login
    async login(username, password) {
      try {
        let userData = null;
        const response = await authService.login(username, password);

        if (response && response.data.success) {
          // Fetch user data setelah login
          userData = await this.fetchUserData(true);
          if (!userData) {
            throw new Error('Failed to fetch user data');
          }
        } else {
          throw new Error(response.data.message);
        }
        
        return true;
      } catch (error) {
        errorToast(error);
        throw error;
      }
    },
    
    // Logout
    async logout() {
      try {
        const response = await authService.logout();
        this.clearSession();

        if (response && response.data.success) {
          successToast(response.data.message);
        } else {
          errorToast('Sesi login gagal dihapus. Silakan coba lagi.');
        }
        router.push('/login');
      } catch (error) {
        // Tetap clear session meskipun API logout gagal
        this.clearSession();
        errorToast(error);
        router.push('/login');
      }
    },
    
    // Clear session data
    clearSession() {
      this.user = null;
      this.isUserLoaded = false;
      this.isUserImpersonating = false;
      this.impersonatedBy = null;
    },
    
    // Impersonate user (untuk fitur admin)
    async impersonateUser(userId) {
      try {
        const response = await authService.startImpersonateUser(userId);
        
        // Refresh user data
        await this.fetchUserData(true);
        
        return true;
      } catch (error) {
        errorToast(error);
        throw error;
      }
    },
    
    // Berhenti impersonate
    async stopImpersonating() {
      try {
        const response = await authService.leaveImpersonateUser();
        
        // Refresh user data
        await this.fetchUserData(true);
        
        return true;
      } catch (error) {
        errorToast(error);
        throw error;
      }
    }
  }
});