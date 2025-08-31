<template>
  <div class="notification-wrapper" ref="wrapper">
    <button @click.stop="toggle" class="notification-button" :class="{ 'has-unread': hasUnreadNotifications }" aria-label="Notifications">
      <font-awesome-icon icon="bell" size="lg" />
      <span v-if="unreadCount" class="notification-badge">{{ unreadCount }}</span>
    </button>

    <div v-if="showNotifications" class="notification-dropdown">
      <div class="notification-header">
        <h3>Notifikasi</h3>
        <button v-if="notifications.length > 0" @click="markAllAsRead" class="mark-all-read">
          <font-awesome-icon icon="check-double" />
          <span>Tandai Semua Dibaca</span>
        </button>
      </div>

      <div class="notification-list" v-if="notifications.length > 0">
        <div v-for="notification in notifications" :key="notification.id" class="notification-item" :class="{ 'unread': !notification.read_at }">
          <div class="notification-content" @click="readNotification(notification)">
            <p class="notification-text">{{ notification.message }}</p>
            <span class="notification-time">{{ formatTime(notification.created_at) }}</span>
          </div>
          <button @click.stop="deleteNotification(notification.uuid)" class="delete-notification" title="Hapus notifikasi">
            <font-awesome-icon icon="trash" size="sm" />
          </button>
        </div>
      </div>

      <div v-else class="empty-notifications">
        <font-awesome-icon icon="inbox" />
        <div class="empty-text">
          <p>Belum ada notifikasi</p>
          <span>Notifikasi baru akan muncul di sini</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { notificationService } from '@/api/services/notificationService';
import { errorToast } from '@/utils/toast';

const notifications = ref([]);
const showNotifications = ref(false);
const wrapper = ref(null);

const hasUnreadNotifications = computed(() => notifications.value.some(n => !n.read_at));
const unreadCount = computed(() => notifications.value.filter(n => !n.read_at).length);

const toggle = () => {
  showNotifications.value = !showNotifications.value;
  if (showNotifications.value) fetchNotifications();
};

const fetchNotifications = async () => {
  try {
    const response = await notificationService.getNotifications();
    notifications.value = response.data.data;
  } catch (error) {
    errorToast(error);
  }
};

const readNotification = async (notification) => {
  if (!notification.read_at) {
    try {
      await notificationService.updateReadStatus(notification.uuid);
      notification.read_at = new Date().toISOString();
    } catch (error) {
      errorToast(error);
    }
  }
};

const markAllAsRead = async () => {
  try {
    await notificationService.readAllNotification();
    notifications.value = notifications.value.map(n => ({ ...n, read_at: n.read_at || new Date().toISOString() }));
  } catch (error) {
    errorToast(error);
  }
};

const deleteNotification = async (uuid) => {
  try {
    await notificationService.deleteNotification(uuid);
    notifications.value = notifications.value.filter(n => n.uuid !== uuid);
  } catch (error) {
    errorToast(error);
  }
};

const formatTime = (timestamp) => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = (now - date) / 1000;

  if (diff < 60) return 'Baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)} menit yang lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam yang lalu`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} hari yang lalu`;

  return date.toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric' });
};

const onClickOutside = (e) => {
  if (wrapper.value && !wrapper.value.contains(e.target)) {
    showNotifications.value = false;
  }
};

onMounted(() => {
  document.addEventListener('click', onClickOutside);
  fetchNotifications();
});

onUnmounted(() => {
  document.removeEventListener('click', onClickOutside);
});
</script>

<style scoped>
.notification-wrapper { position: relative; }

/* Notification button */
.notification-button {
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  padding: 10px;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  cursor: pointer;
  position: relative;
  color: inherit;
  transition: transform 0.2s ease, background 0.2s ease;
}

.notification-button:hover { 
  transform: translateY(-1px); 
  background: var(--color-background-soft, #f8f8f8);
}

/* Light mode unread state */
html:not(.dark) .notification-button.has-unread { 
  background: var(--color-primary-50, #e3f2fd); 
  color: var(--color-primary-700, #2196f3); 
}

/* Dark mode styles */
html.dark .notification-button:hover {
  background: var(--color-background-soft, #1f2937);
}

html.dark .notification-button.has-unread { 
  background: rgba(23, 162, 184, 0.15); 
  color: var(--color-primary-400, #4fc3cf); 
}

/* Badge */
.notification-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background: #ef4444;
  color: #fff;
  border-radius: 12px;
  padding: 2px 6px;
  font-size: 0.75rem;
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
}

/* Dropdown container */
.notification-dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 12px);
  width: 380px;
  background: var(--color-background, #fff);
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0,0,0,0.12);
  z-index: 1000;
  border: 1px solid var(--color-border, #e5e7eb);
  animation: slideDown 0.2s ease-out;
  transform-origin: top right;
}

/* Dark mode dropdown shadow */
html.dark .notification-dropdown {
  box-shadow: 0 4px 24px rgba(0,0,0,0.4);
}

@keyframes slideDown {
  from { opacity: 0; transform: scale(0.95) translateY(-10px); }
  to   { opacity: 1; transform: scale(1) translateY(0); }
}

.notification-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid var(--color-border, #e5e7eb);
  display:flex;
  justify-content:space-between;
  align-items:center;
  background: var(--color-background-soft, #f8fafc);
  border-radius: 12px 12px 0 0;
}
.notification-header h3 { margin:0; font-size:1.1rem; font-weight:600; color:var(--color-text, #1e293b); }

.mark-all-read {
  background:none;
  border:1px solid var(--color-border, #e2e8f0);
  color:var(--color-text, #64748b);
  cursor:pointer;
  font-size:0.875rem;
  padding:6px 12px;
  border-radius:6px;
  transition: background 0.2s ease, border-color 0.2s ease;
  display:flex; align-items:center; gap:6px; font-weight:500;
}

.mark-all-read:hover {
  background: var(--color-background-mute, #f1f5f9);
  border-color: var(--color-border-hover, #cbd5e1);
}

/* Dark mode mark all read button */
html.dark .mark-all-read:hover {
  background: var(--color-background-mute, #374151);
}

.notification-list { max-height:420px; overflow-y:auto; }

.notification-item {
  padding:1.25rem;
  border-bottom:1px solid var(--color-border, #e5e7eb);
  display:flex;
  align-items:flex-start;
  gap:1rem;
  transition: background 0.2s ease, transform 0.2s ease;
  cursor:pointer;
  position:relative;
}

.notification-item:hover {
  background: var(--color-background-soft, #f8fafc);
}

/* Dark mode notification item hover */
html.dark .notification-item:hover {
  background: var(--color-background-soft, #1f2937);
}

.notification-item.unread { 
  background: var(--color-primary-50, #f0f9ff); 
}

/* Dark mode unread notification */
html.dark .notification-item.unread {
  background: rgba(23, 162, 184, 0.1); /* Semi-transparent primary color */
}

.notification-item.unread::before {
  content: '';
  position: absolute;
  left:0; top:0; bottom:0;
  width:3px;
  background: var(--color-primary-500, #17a2b8);
  border-radius: 0 4px 4px 0;
}

.notification-content { flex:1; }
.notification-text { margin:0; font-size:0.9375rem; color:var(--color-text, #1e293b); line-height:1.5; font-weight:400; }
.notification-time { display:block; font-size:0.8125rem; color:var(--color-text, #64748b); margin-top:6px; font-weight:500; opacity: 0.7; }

.delete-notification {
  background:none;
  border:none;
  color:var(--color-text, #94a3b8);
  cursor:pointer;
  padding:8px;
  opacity:0;
  transition: opacity 0.2s ease, color 0.2s ease;
  border-radius:6px;
  display:flex; align-items:center; justify-content:center;
  width:28px; height:28px; margin-top:-4px;
}
.notification-item:hover .delete-notification { opacity:1; }
.delete-notification:hover { color: #ef4444; }

.empty-notifications {
  padding:3rem 2rem;
  text-align:center;
  color:var(--color-text, #64748b);
  opacity: 0.7;
  display:flex;
  flex-direction:column;
  align-items:center;
  gap:1rem;
}

.empty-notifications svg {
  font-size: 2.5rem;
  opacity: 0.5;
}

.empty-text p {
  font-weight: 500;
  margin-bottom: 0.5rem;
}

.empty-text span {
  font-size: 0.875rem;
  opacity: 0.8;
}

</style>
