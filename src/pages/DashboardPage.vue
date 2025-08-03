<template>    
  <div class="">
    <header class="">
      <div class="">
        <div class="">
          <h2 class="">📊 Selamat datang di Project Management Universitas Pertamina</h2>
        </div>          
        <div class="">
          <div class="notification-wrapper">
            <button @click="toggleNotifications" class="notification-button" :class="{ 'has-unread': hasUnreadNotifications }">
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
                <div v-for="notification in notifications" 
                      :key="notification.id" 
                      class="notification-item"
                      :class="{ 'unread': !notification.read_at }">
                  <div class="notification-content" @click="readNotification(notification)">
                    <p class="notification-text">{{ notification.content }}</p>
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
        </div>
      </div>
    </header>

    <section class="">
        
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { notificationService } from '../api/services/notificationService';
import { errorToast } from '@/utils/toast';

const notifications = ref([]);
const showNotifications = ref(false);

const hasUnreadNotifications = computed(() => {
  return notifications.value.some(notification => !notification.read_at);
});

const unreadCount = computed(() => {
  return notifications.value.filter(notification => !notification.read_at).length;
});

const toggleNotifications = () => {
  showNotifications.value = !showNotifications.value;
  if (showNotifications.value) {
    fetchNotifications();
  }
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
    notifications.value = notifications.value.map(notification => ({
      ...notification,
      read_at: notification.read_at || new Date().toISOString()
    }));
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
  const diff = (now - date) / 1000; // difference in seconds

  if (diff < 60) return 'Baru saja';
  if (diff < 3600) return `${Math.floor(diff / 60)} menit yang lalu`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} jam yang lalu`;
  if (diff < 604800) return `${Math.floor(diff / 86400)} hari yang lalu`;
  
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

onMounted(async () => {
    await fetchNotifications();
});

onUnmounted(() => {

});
</script>

<style scoped>
.notification-wrapper {
  position: relative;
}

.notification-button {
  display: flex;
  align-items: center;
  justify-content: center;
  background: #f5f7fa;
  border: none;
  padding: 10px;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  cursor: pointer;
  position: relative;
  color: #64748b;
  transition: all 0.2s ease;
}

.notification-button:hover {
  color: #333;
}

.notification-button:hover {
  background: #e2e8f0;
  color: #334155;
  transform: translateY(-1px);
}

.notification-button.has-unread {
  background: #e3f2fd;
  color: #2196f3;
}

.notification-button.has-unread:hover {
  background: #bbdefb;
  color: #1976d2;
}

.notification-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  background: #ef4444;
  color: white;
  border-radius: 12px;
  padding: 2px 6px;
  font-size: 0.75rem;
  min-width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  border: 2px solid white;
  font-weight: 600;
}

.notification-dropdown {
  position: absolute;
  right: 0;
  top: calc(100% + 12px);
  width: 380px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.12);
  z-index: 1000;
  border: 1px solid #e5e7eb;
  animation: slideDown 0.2s ease-out;
  transform-origin: top right;
}

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

.notification-header {
  padding: 1rem 1.25rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background: #f8fafc;
  border-radius: 12px 12px 0 0;
}

.notification-header h3 {
  margin: 0;
  font-size: 1.1rem;
  font-weight: 600;
  color: #1e293b;
}

.mark-all-read {
  background: none;
  border: 1px solid #e2e8f0;
  color: #64748b;
  cursor: pointer;
  font-size: 0.875rem;
  padding: 6px 12px;
  border-radius: 6px;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 500;
}

.mark-all-read:hover {
  background: #f1f5f9;
  border-color: #cbd5e1;
  color: #475569;
}

.notification-list {
  max-height: 420px;
  overflow-y: auto;
  scrollbar-width: thin;
  scrollbar-color: #cbd5e1 #f1f5f9;
}

.notification-list::-webkit-scrollbar {
  width: 6px;
}

.notification-list::-webkit-scrollbar-track {
  background: #f1f5f9;
}

.notification-list::-webkit-scrollbar-thumb {
  background-color: #cbd5e1;
  border-radius: 3px;
}

.notification-item {
  padding: 1.25rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  align-items: flex-start;
  gap: 1rem;
  transition: all 0.2s ease;
  cursor: pointer;
}

.notification-item:hover {
  background: #f8fafc;
}

.notification-item.unread {
  background: #f0f9ff;
  position: relative;
}

.notification-item.unread::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  background: #2196f3;
  border-radius: 0 4px 4px 0;
}

.notification-item.unread:hover {
  background: #e0f2fe;
}

.notification-content {
  flex: 1;
}

.notification-text {
  margin: 0;
  font-size: 0.9375rem;
  color: #1e293b;
  line-height: 1.5;
  font-weight: 400;
}

.notification-time {
  display: block;
  font-size: 0.8125rem;
  color: #64748b;
  margin-top: 6px;
  font-weight: 500;
}

.delete-notification {
  background: none;
  border: none;
  color: #94a3b8;
  cursor: pointer;
  padding: 8px;
  opacity: 0;
  transition: all 0.2s ease;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  margin-top: -4px;
}

.notification-item:hover .delete-notification {
  opacity: 1;
}

.delete-notification:hover {
  background: #fef2f2;
  color: #ef4444;
}

.empty-notifications {
  padding: 3rem 2rem;
  text-align: center;
  color: #64748b;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  animation: fadeIn 0.3s ease-out;
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

.empty-notifications i {
  font-size: 2.5rem;
  color: #10b981;
  background: #f0fdf4;
  width: 64px;
  height: 64px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  margin-bottom: 0.5rem;
}

.empty-notifications .empty-text {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.empty-notifications p {
  margin: 0;
  font-size: 0.9375rem;
  font-weight: 600;
  color: #475569;
}

.empty-notifications span {
  font-size: 0.875rem;
  color: #94a3b8;
}
</style>