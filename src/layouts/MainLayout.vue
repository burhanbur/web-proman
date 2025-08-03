<template>
    <div class="">
        <main class="">
            <div class="">
                <router-view v-slot="{ Component }">
                    <transition name="fade" mode="out-in">
                        <component :is="Component" />
                    </transition>
                </router-view>
            </div>
        </main>

        <footer class="">
        <div class="">
            <p>&copy; 2025 Universitas Pertamina. All rights reserved.</p>
        </div>
        </footer>
    </div>
</template>

<script setup>    
    import { useRouter } from 'vue-router';
    import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome';
    import { ref, onMounted, computed, onBeforeUnmount } from 'vue';
    import { authService } from '../api/services/authService';
    import { useAuthStore } from '@/stores/auth';
    import { successToast, errorToast, warningToast } from '@/utils/toast'

    const router = useRouter();
    const authStore = useAuthStore();

    // Data user
    const userData = ref(null);
    const isLoading = ref(true);

    // Fetch data user
    const fetchUserData = async () => {
        isLoading.value = true;
        try {
            const response = await authService.me();
            userData.value = response.data.data;
        } catch (error) {
            errorToast(error);
        } finally {
            isLoading.value = false;
        }
    };

    const isImpersonating = computed(() => authStore.isImpersonating);
    const name = computed(() => authStore.fullName);
    const isAdminUser = computed(() => authStore.isAdmin);

    const logout = async () => {
        await authStore.logout();
    }

    const leaveImpersonation = async () => {
        try {
            const response = await authStore.stopImpersonating();

            if (response) {
                successToast('Berhasil keluar impersonasi pengguna.');
                router.push('/profile');
            }
        } catch (error) {
            const message =
                error.response?.data?.message ||
                error.message ||
                'Gagal keluar impersonasi pengguna. Silakan coba lagi nanti.'

            errorToast(message)
        }
    }

    onMounted(() => {
        fetchUserData();
    })
</script>

<style scoped>

</style>