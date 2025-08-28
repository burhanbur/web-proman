<template>
  <button class="theme-toggle" @click="toggle">
    <font-awesome-icon :icon="isDark ? 'moon' : 'sun'" />
  </button>
</template>

<script setup>
import { computed } from 'vue'
import { useThemeStore } from '@/stores/theme'

const themeStore = useThemeStore()
const isDark = computed(() => themeStore.theme === 'dark')
const toggle = () => themeStore.toggle()
</script>

<style scoped>
.theme-toggle {
  background: transparent;
  border: none;
  padding: 6px 8px;
  cursor: pointer;
  font-size: 18px;
  color: inherit;
}
</style>
