<template>
    <router-view />
</template>

<script setup>
import { onMounted } from 'vue';
import { useThemeStore } from '@/stores/theme';

onMounted(() => {
    const themeStore = useThemeStore();
    themeStore.init();
});
</script>

<style scoped>

</style>
