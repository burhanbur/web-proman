<template>
  <div :class="['min-h-screen flex items-center justify-center transition-colors duration-300 px-4', theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50']">
    <div class="flex flex-col md:flex-row w-full max-w-4xl shadow-2xl rounded-xl overflow-hidden bg-transparent">
      <!-- Left Image -->
      <div class="hidden md:block md:w-1/2 relative rounded-l-xl overflow-hidden">
        <img :src="bgImage" alt="Login Background" class="object-cover w-full h-full" />
        <div :class="['absolute inset-0', theme === 'dark' ? 'bg-gradient-to-b from-black/30 to-black/50' : 'bg-gradient-to-b from-black/10 to-black/20']"></div>
      </div>

      <!-- Login Form -->
  <div :class="['w-full md:w-1/2 flex flex-col justify-center items-center p-8 rounded-r-xl transition-colors', theme === 'dark' ? 'bg-gray-800' : 'bg-white shadow-sm border border-gray-200']">
        <div class="w-full max-w-sm">
          <div class="flex justify-center mb-6">
            <img :src="logoImage" alt="Logo" class="h-16" />
          </div>
          <h1 :class="['text-2xl font-semibold text-center mb-2', theme === 'dark' ? 'text-gray-100' : 'text-gray-800']">Project Management</h1>
          <h2 :class="['text-center text-sm mb-8', theme === 'dark' ? 'text-gray-400' : 'text-gray-600']">Universitas Pertamina</h2>

          <form @submit.prevent="handleLogin" class="space-y-6">
            <div>
              <label for="username" :class="['block text-sm font-medium mb-1', theme === 'dark' ? 'text-gray-300' : 'text-gray-800']">Username</label>
              <input
                id="username"
                type="text"
                v-model="username"
                placeholder="Username"
                required
                autofocus
                autocomplete="username"
                :class="[
                  'block w-full px-4 py-2 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-primary-500',
                  theme === 'dark'
                    ? 'border border-gray-700 bg-gray-700 text-gray-100'
                    : 'border border-gray-200 bg-white text-gray-900 placeholder-gray-600'
                ]"
              />
            </div>

            <div>
              <label for="password" :class="['block text-sm font-medium mb-1', theme === 'dark' ? 'text-gray-300' : 'text-gray-800']">Password</label>
              <div class="relative">
                <input
                  :type="showPassword ? 'text' : 'password'"
                    id="password"
                    v-model="password"
                    placeholder="Password"
                    required
                    autocomplete="current-password"
                    :class="[
                      'block w-full px-4 py-2 rounded-lg transition focus:outline-none focus:ring-2 focus:ring-primary-500 pr-12',
                      theme === 'dark'
                        ? 'border border-gray-700 bg-gray-700 text-gray-100'
                        : 'border border-gray-200 bg-white text-gray-900 placeholder-gray-400'
                    ]"
                />
                <button
                  type="button"
                  class="absolute right-3 top-1/2 -translate-y-1/2 flex items-center pw-toggle text-gray-400 hover:text-primary-500 dark:hover:text-primary-400 focus:outline-none"
                  @click="showPassword = !showPassword"
                  :title="showPassword ? 'Hide password' : 'Show password'"
                  tabindex="-1"
                >
                  <font-awesome-icon :icon="showPassword ? 'eye-slash' : 'eye'" />
                </button>
              </div>
            </div>

            <div class="flex items-center justify-between">
              <button
                type="submit"
                :disabled="loading"
                class="w-full flex items-center justify-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 dark:bg-primary-500 dark:hover:bg-primary-600 text-white font-semibold rounded-lg shadow transition disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <font-awesome-icon icon="sign-in-alt" />
                <span>{{ loading ? 'Logging in...' : 'Login' }}</span>
              </button>
            </div>
          </form>

          <div class="flex justify-center mt-8">
            <button
              @click="toggleTheme"
              :class="[
                'flex items-center gap-2 px-3 py-1.5 rounded-md transition',
                theme === 'dark'
                  ? 'border border-gray-700 bg-gray-700 text-gray-200 hover:bg-gray-600'
                  : 'border border-gray-200 bg-gray-100 text-gray-700 hover:bg-gray-200'
              ]"
            >
              <font-awesome-icon :icon="theme === 'dark' ? 'sun' : 'moon'" />
              <span>{{ theme === 'dark' ? 'Light Mode' : 'Dark Mode' }}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useAuthStore } from '@/stores/auth';
import { successToast, errorToast } from '@/utils/toast';

// Import images so Vite can resolve them correctly
import bgImage from '@/assets/img/up.jpg';
import logoImage from '@/assets/logo.png';

const router = useRouter();
const username = ref('');
const password = ref('');
const loading = ref(false);
const showPassword = ref(false);
const theme = ref('light');

const authStore = useAuthStore();

const handleLogin = async () => {
  try {
    loading.value = true;
    const response = await authStore.login(username.value, password.value);
    if (!response) throw new Error();
    successToast('Verifikasi identitas berhasil.');
    router.push('/dashboard');
  } catch (error) {
    const message = error?.response?.data?.message || 'Login gagal. Periksa kembali data Anda.';
    errorToast(message);
  } finally {
    loading.value = false;
  }
};

const toggleTheme = () => {
  theme.value = theme.value === 'dark' ? 'light' : 'dark';
  document.documentElement.classList.toggle('dark', theme.value === 'dark');
  localStorage.setItem('theme', theme.value);
};

onMounted(() => {
  const saved = localStorage.getItem('theme');
  if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
    theme.value = 'dark';
    document.documentElement.classList.add('dark');
  } else {
    theme.value = 'light';
    document.documentElement.classList.remove('dark');
  }
});
</script>

