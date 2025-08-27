<template>
    <div class="public-layout auth-wrapper">
        <div class="public-content">
            <router-view v-slot="{ Component }">
                <transition name="fade" mode="out-in">
                    <component :is="Component" />
                </transition>
            </router-view>
        </div>
    </div>
</template>

<script setup>
import { onMounted, onUnmounted } from 'vue';

// Mark the document when an auth/public layout is active so global layout
// rules (like the two-column grid in `#app`) can be overridden.
onMounted(() => {
    document.body.classList.add('auth-page');
    document.documentElement.classList.add('auth-page');
});

onUnmounted(() => {
    document.body.classList.remove('auth-page');
    document.documentElement.classList.remove('auth-page');
});
</script>

<style scoped>
    .public-layout {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: var(--color-background);
    }

    .public-content {
        width: 100%;
        height: 100vh;
    }

    .fade-enter-active,
    .fade-leave-active {
        transition: opacity 0.2s ease;
    }

    .fade-enter-from,
    .fade-leave-to {
        opacity: 0;
    }
</style>