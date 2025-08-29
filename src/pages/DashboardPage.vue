<template>
  
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
</script>

<style scoped>
@keyframes slideDown {
  from {
    opacity: 0;
    transform: scale(0.95) translateY(-10px);
  }
  to {
    opacity: 1;
    transform: scale(1) translateY(0);
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>