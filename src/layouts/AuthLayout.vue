<template>
    <div class="public-layout">
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
    // No additional logic needed for public layout
</script>

<style scoped>
    .public-layout {
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background-color: var(--background);
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