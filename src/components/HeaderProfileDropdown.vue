<template>
  <div class="profile-dropdown">
    <button class="profile-button" @click="open = !open">
      <img v-if="user && user.avatar" :src="user.avatar" alt="avatar" class="avatar" />
      <div v-else class="avatar-fallback">{{ initials }}</div>
      <span class="name">{{ user?.name || 'User' }}</span>
      <font-awesome-icon icon="chevron-down" size="sm" />
    </button>

    <div v-if="open" class="dropdown-menu">
      <router-link to="/profile" class="dropdown-item">
      <font-awesome-icon icon="user" size="sm" /> &nbsp; Profile</router-link>
      <router-link to="/settings" class="dropdown-item">
      <font-awesome-icon icon="cog" size="sm" /> &nbsp; Settings</router-link>
      <hr />
      <button class="dropdown-item logout" @click="logout">
      <font-awesome-icon icon="sign-out-alt" size="sm" /> &nbsp; Logout</button>
    </div>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useRouter } from 'vue-router'

const open = ref(false)
const router = useRouter()
const authStore = useAuthStore()

const user = computed(() => ({ name: authStore.fullName, avatar: authStore.user?.avatar }))

const initials = computed(() => {
  const n = user.value?.name || ''
  if (!n) return 'U'
  return n.split(' ').map(s => s[0] || '').join('').slice(0,2).toUpperCase()
})

const logout = async () => {
  await authStore.logout()
  router.push('/login')
}

// simple v-click-outside directive substitute
import { onMounted, onBeforeUnmount } from 'vue'
const onClick = (e) => {
  if (!e.target.closest('.profile-dropdown')) open.value = false
}
onMounted(() => document.addEventListener('click', onClick))
onBeforeUnmount(() => document.removeEventListener('click', onClick))
</script>

<style scoped>
.profile-dropdown { position: relative; }

/* Button */
.profile-button {
  display: flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 6px;
}
.profile-button .name { color: var(--text-color) !important; }

/* Avatar */
.avatar,
.avatar-fallback {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
.avatar { object-fit: cover; }
.avatar-fallback { background: var(--bg-1); font-weight: 700; color: var(--color-primary-500) !important; }

/* Dropdown */
.dropdown-menu {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  background: var(--bg-0);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 8px;
  min-width: 180px;
  box-shadow: 0 6px 20px rgba(16,24,40,0.08);
  z-index: 200;
}

/* Dropdown items (links and buttons) share the same base styles */
.dropdown-item {
  display: block;
  padding: 8px 10px;
  color: var(--text-color);
  text-decoration: none;
  background: transparent;
  border: none;
  width: 100%;
  text-align: left;
  cursor: pointer;
}

/* Icons inside items follow color (works with dark/light) */
.dropdown-item svg,
.dropdown-item svg *,
.profile-button svg,
.profile-button svg * {
  fill: currentColor !important;
  stroke: currentColor !important;
  vertical-align: middle;
  color: var(--text-color);
}
html:not(.dark) .profile-dropdown .dropdown-item svg { color: var(--color-primary-700); }

.dropdown-item:hover { background: var(--bg-1); }
</style>
