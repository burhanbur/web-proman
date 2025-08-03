<template>
    <div class="login-container">
        <div class="login-image">
            <div class="image-wrapper">
                <img src="../assets/img/up.jpg" alt="Login Background" />
                <div class="overlay"></div>
            </div>
        </div>
        
        <div class="login-form-container">
            <div class="login-form-wrapper">
                <div class="logo-container">
                    <img src="../assets/logo.png" alt="Logo" class="logo" />
                </div>
                <h1 class="text-center">Project Management<br>Universitas Pertamina</h1>
                
                <form @submit.prevent="handleLogin" class="login-form">
                    <div class="form-group">
                        <input 
                            type="text" 
                            id="username" 
                            v-model="username" 
                            placeholder="Username"
                            required
                        />
                    </div>

                    <div class="form-group password-group">
                        <input 
                            :type="showPassword ? 'text' : 'password'"
                            id="password" 
                            v-model="password" 
                            placeholder="Password"
                            required
                        />
                        <button 
                            type="button"
                            class="toggle-password"
                            @click="showPassword = !showPassword"
                            :title="showPassword ? 'Hide password' : 'Show password'"
                        >
                            <font-awesome-icon :icon="showPassword ? 'eye-slash' : 'eye'" />
                        </button>
                    </div>

                    <div class="form-links">
                        <router-link to="/forgot-password" class="forgot-link">Lupa Password?</router-link>
                    </div>

                    <button type="submit" :disabled="loading" class="sign-in-btn">
                        <font-awesome-icon icon="sign-in-alt" /> &nbsp; {{ loading ? 'Logging in...' : 'Login' }}
                    </button>
                </form>
            </div>
        </div>
    </div>
</template>

<script setup>
    import { ref, onMounted } from 'vue';
    import { useRouter } from 'vue-router';
    import { useAuthStore } from '@/stores/auth';
    import { successToast, errorToast, warningToast } from '@/utils/toast'

    const router = useRouter();
    const username = ref('');
    const password = ref('');
    const loading = ref(false);
    const showPassword = ref(false);

    const authStore = useAuthStore();

    const handleLogin = async () => {
        try {
            loading.value = true;
            const response = await authStore.login(username.value, password.value);

            if (!response) {
                throw new Error();
            }

            successToast('Verifikasi identitas berhasil.');
            router.push('/dashboard');
        } catch (error) {
            const message = error?.response?.data?.message || 'Login gagal. Periksa kembali data Anda.';
            errorToast(message);
        } finally {
            loading.value = false;
        }
    }
</script>

<style scoped>
    .login-container {
        display: flex;
        min-height: 100vh;
        width: 100vw;
        background-color: var(--background);
    }

    .login-image {
        position: relative;
        width: 55%;
        overflow: hidden;
    }

    .image-wrapper {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
    }

    .image-wrapper img {
        width: 100%;
        height: 100%;
        object-fit: cover;
    }

    .overlay {
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        background: rgba(0, 0, 0, 0.3);
    }

    .login-form-container {
        width: 45%;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--background);
        padding: 2rem;
    }

    .login-form-wrapper {
        width: 100%;
        max-width: 420px;
        padding: 2rem;
    }

    .logo-container {
        text-align: center;
        margin-bottom: 2rem;
    }

    .logo {
        max-width: 200px;
        height: auto;
    }

    h1 {
        font-size: 14px;
        color: var(--text-secondary);
        margin-bottom: 30px;
        font-weight: 500;
        letter-spacing: 1px;
    }

    .login-form {
        display: flex;
        flex-direction: column;
        gap: 20px;
    }

    .form-group input {
        width: 100%;
        padding: 12px 15px;
        border: 1px solid var(--border);
        border-radius: 4px;
        font-size: 14px;
        background-color: var(--background);
    }

    .form-group input::placeholder {
        color: var(--text-muted);
    }

    .form-group input:focus {
        outline: none;
        border-color: var(--primary);
    }

    .form-links {
        text-align: right;
        margin-top: -10px;
    }

    .forgot-link {
        color: var(--text-muted);
        text-decoration: none;
        font-size: 12px;
    }

    .forgot-link:hover {
        color: var(--text-secondary);
    }

    .sign-in-btn {
        width: 100%;
        padding: 12px;
        background-color: var(--primary);
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .sign-in-btn:hover:not(:disabled) {
        background-color: var(--primary-hover);
        transform: translateY(-1px);
    }

    .sign-in-btn:active:not(:disabled) {
        transform: translateY(0);
    }

    .sign-in-btn:disabled {
        opacity: 0.7;
        cursor: not-allowed;
    }

    .sign-up-section {
        text-align: center;
        margin-top: 20px;
    }

    .sign-up-link {
        color: var(--primary);
        text-decoration: none;
        font-size: 12px;
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 1px;
    }

    .sign-up-link:hover {
        color: var(--primary-hover);
    }

    .error-message {
        margin-top: 20px;
        padding: 10px;
        background-color: rgba(220, 53, 69, 0.1);
        color: var(--error);
        border-radius: 4px;
        font-size: 13px;
        text-align: center;
    }

    .success-message {
        margin-top: 20px;
        padding: 10px;
        background-color: rgba(40, 167, 69, 0.1);
        color: var(--success);
        border-radius: 4px;
        font-size: 13px;
        text-align: center;
    }

    .password-group {
        position: relative;
    }

    .toggle-password {
        position: absolute;
        right: 12px;
        top: 50%;
        transform: translateY(-50%);
        background: none;
        border: none;
        padding: 4px 8px;
        cursor: pointer;
        color: var(--text-muted);
        transition: color 0.2s;
        display: flex;
        align-items: center;
        z-index: 2;
    }

    .toggle-password:hover {
        color: var(--text-secondary);
    }

    .toggle-password:focus {
        outline: none;
    }

    .password-group input {
        padding-right: 40px;
    }

    /* Responsive Design */
    @media (max-width: 1200px) {
        .login-image {
            width: 50%;
        }
        
        .login-form-container {
            width: 50%;
        }
    }

    @media (max-width: 768px) {
        .login-container {
            flex-direction: column;
            width: 100%;
        }

        .login-image {
            width: 100%;
            height: 280px;
        }

        .login-form-container {
            width: 100%;
            padding: 2rem 1.5rem;
        }

        .login-form-wrapper {
            padding: 0;
        }
    }
</style>