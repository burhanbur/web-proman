<template>
  <div class="project-detail-page">
    <!-- Loading State -->
      <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Memuat proyek...</p>
    </div>

    <!-- Project Content -->
    <div v-else-if="project" class="project-content">
      <!-- Project Header -->
      <div class="project-header">
        <div class="project-info">
          <div class="breadcrumb">
            <router-link :to="`/workspaces/${$route.params.workspaceSlug}`" class="breadcrumb-link">
              {{ workspace?.name }}
            </router-link>
            <font-awesome-icon icon="chevron-right" size="sm" class="breadcrumb-separator" />
            <span class="breadcrumb-current">{{ project.name }}</span>
          </div>
          <div class="project-details">
            <div class="project-color" :style="{ backgroundColor: project.color || '#17a2b8' }"></div>
            <div class="project-meta">
              <h1 class="project-name">{{ project.name }}</h1>
              <p v-if="project.description" class="project-description">{{ project.description }}</p>
              <div class="project-stats">
                <span class="stat-item">
                  <font-awesome-icon icon="check-circle" size="sm" />
                      {{ project.completed_tasks_count || 0 }} selesai
                </span>
                <span class="stat-item">
                  <font-awesome-icon icon="circle" size="sm" />
                      {{ project.tasks_count || 0 }} total tugas
                </span>
                <span class="stat-item">
                  <font-awesome-icon icon="users" size="sm" />
                      {{ project.members?.length || 0 }} anggota
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="project-actions">
          <button class="btn btn-primary" @click="showCreateTaskModal = true">
            <font-awesome-icon icon="plus" size="sm" />
            Tugas Baru
          </button>
        </div>
      </div>

      <!-- Project Navigation -->
      <div class="project-nav">
        <button 
          :class="['nav-item', { active: activeView === 'board' }]"
          @click="activeView = 'board'"
        >
          <font-awesome-icon icon="table-columns" size="sm" />
          Kanban
        </button>
        <button 
          :class="['nav-item', { active: activeView === 'list' }]"
          @click="activeView = 'list'"
        >
          <font-awesome-icon icon="list" size="sm" />
          Daftar
        </button>
        <button 
          :class="['nav-item', { active: activeView === 'timeline' }]"
          @click="activeView = 'timeline'"
        >
          <font-awesome-icon icon="calendar" size="sm" />
          Linimasa
        </button>
        <button 
          :class="['nav-item', { active: activeView === 'files' }]"
          @click="activeView = 'files'"
        >
          <font-awesome-icon icon="folder" size="sm" />
          Berkas
        </button>
        <button 
          :class="['nav-item', { active: activeView === 'members' }]"
          @click="activeView = 'members'"
        >
          <font-awesome-icon icon="users" size="sm" />
          Anggota
        </button>
        <button 
          :class="['nav-item', { active: activeView === 'activities' }]"
          @click="activeView = 'activities'"
        >
          <font-awesome-icon icon="clock" size="sm" />
          Aktivitas
        </button>
      </div>

      <!-- View Content -->
      <div class="view-content">
        <!-- Board View -->
        <div v-if="activeView === 'board'" class="board-view">
          <div 
            class="board-columns" 
            ref="boardContainer"
            @scroll="handleBoardScroll"
          >
            <div 
              v-for="status in taskStatuses" 
              :key="status.id"
              class="board-column"
              :data-status-id="status.id"
              :class="{ 'drop-zone-active': dropZoneActive === status.id }"
              @dragover.prevent="handleDragOver($event, status.id)"
              @dragleave="handleDragLeave"
              @drop="handleDrop($event, status.id)"
            >
              <div class="column-header">
                <div class="status-indicator" :style="{ backgroundColor: status.color }"></div>
                <h3 class="column-title">{{ status.name }}</h3>
                <span class="column-count">{{ getTasksByStatus(status.id).length }}</span>
                <button class="btn-icon" @click="showCreateTaskModal = true">
                  <font-awesome-icon icon="plus" size="sm" />
                </button>
              </div>
              <div class="column-tasks">
                <div 
                  v-for="task in getTasksByStatus(status.id)" 
                  :key="task.id"
                  class="task-card"
                  :class="{ 
                    'task-dragging': draggedTask?.id === task.id,
                    'task-ghost': draggedTask?.id === task.id && isDragging
                  }"
                  :draggable="true"
                  @dragstart="handleDragStart($event, task)"
                  @dragend="handleDragEnd"
                  @click="handleTaskClick(task, $event)"
                  @touchstart="handleTouchStart($event, task)"
                  @touchmove="handleTouchMove"
                  @touchend="handleTouchEnd"
                  :aria-label="`Task: ${task.title}. Current status: ${task.status?.name || 'Unknown'}. Drag to change status.`"
                  tabindex="0"
                  @keydown="handleTaskKeydown($event, task)"
                >
                  <div class="task-header">
                    <h4 class="task-title">{{ task.title }}</h4>
                      <div class="task-priority" :class="(task.priority && task.priority.name) ? task.priority.name.toLowerCase() : ''">
                      <font-awesome-icon 
                        :icon="getPriorityIcon(task.priority)" 
                        size="sm" 
                      />
                    </div>
                  </div>
                  <p v-if="task.description" class="task-description">
                    {{ task.description.substring(0, 100) }}{{ task.description.length > 100 ? '...' : '' }}
                  </p>
                  <div class="task-meta">
                    <div class="task-assignees">
                      <div 
                        v-for="(assignee, index) in task.assignees?.slice(0, 2)" 
                        :key="assignee.id"
                        class="assignee-avatar"
                        :style="{ zIndex: 10 - index }"
                      >
                        <img v-if="assignee.avatar" :src="assignee.avatar" :alt="assignee.name" />
                        <div v-else class="assignee-avatar-fallback">{{ getMemberInitials(assignee.name) }}</div>
                      </div>
                      <div v-if="task.assignees?.length > 2" class="assignee-count-more">
                        +{{ task.assignees.length - 2 }}
                      </div>
                    </div>
                    <div class="task-info">
                      <span v-if="task.due_date" class="task-due-date" :class="{ overdue: isOverdue(task.due_date) }">
                        <font-awesome-icon icon="calendar" size="sm" />
                        {{ formatDueDate(task.due_date) }}
                      </span>
                      <span v-if="task.comments_count" class="task-comments">
                        <font-awesome-icon icon="comment" size="sm" />
                        {{ task.comments_count }}
                      </span>
                      <span v-if="task.attachments_count" class="task-attachments">
                        <font-awesome-icon icon="paperclip" size="sm" />
                        {{ task.attachments_count }}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Loading overlay during status update -->
          <div v-if="updatingTaskStatus" class="status-update-overlay">
            <div class="status-update-message">
              <div class="loading-spinner small"></div>
              <span>Memperbarui status tugas...</span>
            </div>
          </div>
        </div>

        <!-- List View -->
        <div v-if="activeView === 'list'" class="list-view">
          <div class="list-header">
            <div class="list-filters">
              <select v-model="filterStatus" class="filter-select">
                <option value="">Semua Status</option>
                <option v-for="status in taskStatuses" :key="status.id" :value="status.id">
                  {{ status.name }}
                </option>
              </select>
              <select v-model="filterAssignee" class="filter-select">
                <option value="">Semua Penugas</option>
                <option v-for="member in project.members" :key="member.id" :value="member.id">
                  {{ member.name }}
                </option>
              </select>
              <select v-model="filterPriority" class="filter-select">
                <option value="">Semua Prioritas</option>
                <option value="low">Rendah</option>
                <option value="medium">Sedang</option>
                <option value="high">Tinggi</option>
                <option value="urgent">Mendesak</option>
              </select>
            </div>
          </div>
          <div class="task-list">
            <div class="task-list-header">
              <div class="task-col task-col-title">Tugas</div>
              <div class="task-col task-col-status">Status</div>
              <div class="task-col task-col-priority">Prioritas</div>
              <div class="task-col task-col-assignee">Penugasan</div>
              <div class="task-col task-col-due-date">Jatuh Tempo</div>
              <div class="task-col task-col-actions">Aksi</div>
            </div>
            <div 
              v-for="task in filteredTasks" 
              :key="task.id"
              class="task-list-item"
              @click="openTaskDetail(task)"
            >
              <div class="task-col task-col-title">
                <div class="task-title-cell">
                  <h4 class="task-title">{{ task.title }}</h4>
                  <div class="task-indicators">
                    <span v-if="task.comments_count" class="indicator">
                      <font-awesome-icon icon="comment" size="sm" />
                      {{ task.comments_count }}
                    </span>
                    <span v-if="task.attachments_count" class="indicator">
                      <font-awesome-icon icon="paperclip" size="sm" />
                      {{ task.attachments_count }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="task-col task-col-status">
                <span class="status-badge" :class="(task.status && task.status.name) ? task.status.name.toLowerCase() : ''">
                  {{ task.status?.name || '' }}
                </span>
              </div>
              <div class="task-col task-col-priority">
                <div class="priority-badge" :class="(task.priority && task.priority.name) ? task.priority.name.toLowerCase() : ''">
                  <font-awesome-icon 
                    :icon="getPriorityIcon(task.priority)" 
                    size="sm" 
                  />
                  {{ task.priority?.name || '' }}
                </div>
              </div>
              <div class="task-col task-col-assignee">
                <div class="assignee-list">
                  <div 
                    v-for="assignee in task.assignees?.slice(0, 3)" 
                    :key="assignee.id"
                    class="assignee-avatar small"
                  >
                    <img v-if="assignee.avatar" :src="assignee.avatar" :alt="assignee.name" />
                    <div v-else class="assignee-avatar-fallback">{{ getMemberInitials(assignee.name) }}</div>
                  </div>
                </div>
              </div>
              <div class="task-col task-col-due-date">
                <span v-if="task.due_date" class="due-date" :class="{ overdue: isOverdue(task.due_date) }">
                  {{ formatDueDate(task.due_date) }}
                </span>
              </div>
              <div class="task-col task-col-actions">
                <button class="btn-icon" @click.stop="toggleTaskMenu(task.id)">
                  <font-awesome-icon icon="ellipsis-vertical" size="sm" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Timeline View -->
        <div v-if="activeView === 'timeline'" class="timeline-view">
            <div class="timeline-placeholder">
            <font-awesome-icon icon="calendar" size="3x" class="placeholder-icon" />
            <h3>Linimasa</h3>
            <p>Linimasa akan ditampilkan di sini</p>
          </div>
        </div>

        <!-- Files View -->
        <div v-if="activeView === 'files'" class="files-view">
          <div class="files-placeholder">
            <font-awesome-icon icon="folder" size="3x" class="placeholder-icon" />
            <h3>Berkas Proyek</h3>
            <p>Manajemen berkas akan ditampilkan di sini</p>
          </div>
        </div>

        <div v-if="activeView === 'members'" class="members-view">

          <div class="members-header">
            <h3>Anggota</h3>
            <div>
              <button class="btn btn-primary" @click="showInviteModal = true">Undang Anggota</button>
            </div>
          </div>

          <div class="members-list">
            <div v-if="!projectMembers.length" class="empty-activities">
              <p>Tidak ada anggota pada proyek ini.</p>
            </div>

            <div v-for="member in projectMembers" :key="member.id" class="member-item">
              <div class="member-info">
                <div class="member-avatar">
                  <img v-if="member.avatar" :src="member.avatar" :alt="member.name" />
                  <div v-else class="member-avatar-fallback">{{ getMemberInitials(member.name) }}</div>
                </div>

                <div class="member-meta">
                  <div class="member-name">{{ member.name }}</div>
                  <div class="member-email">{{ member.email }}</div>
                  <div class="member-role" v-if="getMemberRole(member)">
                    <span class="role-badge">{{ getMemberRole(member) }}</span>
                  </div>
                </div>
              </div>

              <div class="member-actions">
                <button
                  class="btn btn-danger"
                  @click="removeMember(member)"
                  :disabled="member.id === authStore.user?.id"
                  title="Hapus anggota">
                  Hapus
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- Activities View -->
        <div v-if="activeView === 'activities'" class="activities-view">
          <div class="activities-header">
            <h3>Aktivitas Proyek</h3>
            <button class="btn btn-secondary" @click="loadActivities" :disabled="loadingActivities">
              <font-awesome-icon icon="refresh" size="sm" />
              Refresh
            </button>
          </div>

          <div class="activities-content">
            <div v-if="loadingActivities" class="activities-loading">
              <div class="loading-spinner small"></div>
              <p>Memuat aktivitas...</p>
            </div>

            <div v-else-if="!activities || activities.length === 0" class="empty-activities">
              <font-awesome-icon icon="clock" size="2x" class="empty-icon" />
              <p>Belum ada aktivitas di proyek ini.</p>
            </div>

            <div v-else class="activities-list">
              <div v-for="activity in activities" :key="`${activity.type}-${activity.id}`" class="activity-item">
                <div class="activity-avatar">
                  <img v-if="activity.user?.avatar" :src="activity.user.avatar" :alt="activity.user?.name" />
                  <div v-else class="activity-avatar-fallback">
                    {{ getMemberInitials(activity.user?.name || 'U') }}
                  </div>
                </div>
                
                <div class="activity-content">
                  <div class="activity-header">
                    <span class="activity-user">{{ activity.user?.name || 'Unknown User' }}</span>
                    <span class="activity-time">{{ formatActivityTime(activity.created_at) }}</span>
                  </div>
                  
                  <div class="activity-message">
                    <template v-if="activity.type === 'audit'">
                      <span class="activity-action">{{ getActivityMessage(activity) }}</span>
                    </template>
                    
                    <template v-else-if="activity.type === 'task_activity'">
                      <span class="activity-action">{{ activity.action_text }}</span>
                      <span v-if="activity.task" class="activity-target">di tugas "{{ activity.task.title }}"</span>
                    </template>
                    
                    <template v-else-if="activity.type === 'comment'">
                      <span class="activity-action">menambahkan komentar</span>
                      <span v-if="activity.task" class="activity-target">di tugas "{{ activity.task.title }}"</span>
                      <div class="activity-comment">{{ activity.comment }}</div>
                    </template>
                  </div>
                  
                  <div class="activity-type-badge" :class="activity.type">
                    {{ getActivityTypeLabel(activity.type) }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="error-state">
      <font-awesome-icon icon="exclamation-triangle" size="3x" class="error-icon" />
      <h3>Proyek tidak ditemukan</h3>
      <p>Proyek yang Anda cari tidak ada atau Anda tidak memiliki akses.</p>
      <router-link :to="`/workspaces/${$route.params.workspaceSlug}`" class="btn btn-primary">
        Kembali ke Workspace
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { projectService } from '@/api/services/projectService';
import { taskService } from '@/api/services/taskService';
import { workspaceService } from '@/api/services/workspaceService';
import { useAuthStore } from '@/stores/auth';
import { errorToast, successToast } from '@/utils/toast';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// Reactive data
const loading = ref(true);
const project = ref(null);
const workspace = ref(null);
const tasks = ref([]);
const activities = ref([]);
const loadingActivities = ref(false);
const taskStatuses = ref([]);
const activeView = ref('board');
const showInviteModal = ref(false);
const showCreateTaskModal = ref(false);

// Drag and drop state
const isDragging = ref(false);
const draggedTask = ref(null);
const dropZoneActive = ref(null);
const updatingTaskStatus = ref(false);
const dragStartPosition = ref({ x: 0, y: 0 });
const dragThreshold = 5; // pixels

// Touch handling state
const touchStarted = ref(false);
const touchStartPosition = ref({ x: 0, y: 0 });
const touchCurrentPosition = ref({ x: 0, y: 0 });

// Filters
const filterStatus = ref('');
const filterAssignee = ref('');
const filterPriority = ref('');

// Load data on mount
onMounted(async () => {
  await loadProject();
  await loadTaskStatuses();
  if (activeView.value === 'activities') {
    await loadActivities();
  }
  loading.value = false;
});

// Watch for activeView changes to load activities when needed
watch(activeView, async (newView) => {
  if (newView === 'activities' && activities.value.length === 0) {
    await loadActivities();
  }
});

// Load project data
const loadProject = async () => {
  try {
    const workspaceSlug = route.params.workspaceSlug;
    const projectSlug = route.params.projectSlug;
    
    // Load workspace
    const workspaceResponse = await workspaceService.get(workspaceSlug);
    workspace.value = workspaceResponse.data.data;
    
    // Load project details
    const projectResponse = await projectService.get(projectSlug);
    project.value = projectResponse.data.data;
    
    // Load tasks
    await loadTasks(projectSlug);
    
  } catch (error) {
    errorToast('Gagal memuat proyek');
    console.error('Error loading project:', error);
  }
};

// Load tasks
const loadTasks = async (projectSlug) => {
  try {
    const response = await projectService.get(projectSlug);
    tasks.value = response.data.data.tasks || [];
  } catch (error) {
    console.error('Error loading tasks:', error);
  }
};

// Load task statuses
const loadTaskStatuses = async () => {
  try {
    const projectSlug = route.params.projectSlug;
    const response = await projectService.getProjectStatus(projectSlug);
    taskStatuses.value = response.data.data || [];
  } catch (error) {
    console.error('Error loading task statuses:', error);
  }
};

const refreshProject = async () => {
  try {
    const projectSlug = route.params.projectSlug;
    const projectResponse = await projectService.get(projectSlug);
    project.value = projectResponse.data.data;
  } catch (error) {
    console.error('Error refreshing project:', error);
  }
};

// Load activities
const loadActivities = async () => {
  loadingActivities.value = true;
  try {
    const projectSlug = route.params.projectSlug;
    const response = await projectService.getProjectActivities(projectSlug);
    activities.value = response.data.data || [];
  } catch (error) {
    console.error('Error loading activities:', error);
    errorToast('Gagal memuat aktivitas');
  } finally {
    loadingActivities.value = false;
  }
};

// Computed properties
const filteredTasks = computed(() => {
  let filtered = tasks.value;
  
  if (filterStatus.value) {
    filtered = filtered.filter(task => task.status_id === filterStatus.value || task.status?.id === filterStatus.value);
  }
  
  if (filterAssignee.value) {
    filtered = filtered.filter(task => 
      task.assignees?.some(assignee => assignee.id === filterAssignee.value)
    );
  }
  
  if (filterPriority.value) {
    filtered = filtered.filter(task => {
      const p = (task.priority?.name || task.priority || '').toString().toLowerCase();
      return p === filterPriority.value.toString().toLowerCase();
    });
  }
  
  return filtered;
});

// Helper functions
const getTasksByStatus = (statusId) => {
  return tasks.value.filter(task => task.status_id === statusId || task.status?.id === statusId);
};

const getMemberInitials = (name) => {
  return name?.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase() || 'U';
};

const getPriorityIcon = (priority) => {
  const icons = {
    low: 'arrow-down',
    medium: 'minus',
    high: 'arrow-up',
    urgent: 'exclamation'
  };
  // priority may be an object { name } or a string. Normalize safely.
  const key = (priority?.name || priority || '').toString().toLowerCase();
  return icons[key] || 'minus';
};

const isOverdue = (dueDate) => {
  return new Date(dueDate) < new Date();
};

const formatDueDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const today = new Date();
  const diffTime = date - today;
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Hari ini';
  if (diffDays === 1) return 'Besok';
  if (diffDays === -1) return 'Kemarin';
  if (diffDays > 0) return `${diffDays} hari lagi`;
  return `${Math.abs(diffDays)} hari yang lalu`;
};

// Activity helpers
const formatActivityTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return 'Baru saja';
  if (diffMinutes < 60) return `${diffMinutes} menit yang lalu`;
  if (diffHours < 24) return `${diffHours} jam yang lalu`;
  if (diffDays < 7) return `${diffDays} hari yang lalu`;
  
  return date.toLocaleDateString('id-ID', { 
    day: 'numeric', 
    month: 'short', 
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined 
  });
};

const getActivityMessage = (activity) => {
  if (!activity) return '';
  
  if (activity.message) {
    return activity.message;
  }
  
  const actionMap = {
    'created': 'membuat',
    'updated': 'memperbarui', 
    'deleted': 'menghapus',
    'restored': 'memulihkan'
  };
  
  const modelMap = {
    'Project': 'proyek',
    'Task': 'tugas',
    'Comment': 'komentar',
    'ProjectUser': 'anggota proyek'
  };
  
  const action = actionMap[activity.action] || activity.action;
  const model = modelMap[activity.model_type] || activity.model_type;
  
  return `${action} ${model}`;
};

const getActivityTypeLabel = (type) => {
  const typeMap = {
    'audit': 'Audit',
    'task_activity': 'Tugas',
    'comment': 'Komentar'
  };
  
  return typeMap[type] || type;
};

// Actions
const openTaskDetail = (task) => {
  // Implement task detail modal or navigation
  console.log('Open task detail:', task);
};

const handleTaskClick = (task, event) => {
  // Only open task detail if not dragging
  if (!isDragging.value && !touchStarted.value) {
    openTaskDetail(task);
  }
};

const toggleTaskMenu = (taskId) => {
  // Implement task menu logic
  console.log('Toggle task menu for:', taskId);
};

// Drag and Drop Methods
const handleDragStart = (event, task) => {
  draggedTask.value = task;
  isDragging.value = true;
  
  // Store drag start position
  dragStartPosition.value = {
    x: event.clientX,
    y: event.clientY
  };
  
  // Set drag effect and data
  event.dataTransfer.effectAllowed = 'move';
  event.dataTransfer.setData('text/plain', task.id.toString());
  
  // Add dragging class after a slight delay to avoid flash
  setTimeout(() => {
    if (isDragging.value) {
      event.target.classList.add('task-dragging');
    }
  }, 50);
  
  // Announce to screen readers
  const announcement = `Started dragging task: ${task.title}`;
  announceToScreenReader(announcement);
};

const handleDragEnd = (event) => {
  isDragging.value = false;
  draggedTask.value = null;
  dropZoneActive.value = null;
  
  // Clean up classes
  event.target.classList.remove('task-dragging');
  
  // Clear any remaining drop zone highlights
  const dropZones = document.querySelectorAll('.drop-zone-active');
  dropZones.forEach(zone => zone.classList.remove('drop-zone-active'));
};

const handleDragOver = (event, statusId) => {
  event.preventDefault();
  event.dataTransfer.dropEffect = 'move';
  
  // Only highlight if dragging a different status
  if (draggedTask.value && draggedTask.value.status_id !== statusId) {
    dropZoneActive.value = statusId;
  }
  
  // Auto-scroll horizontally if near edges
  const container = event.currentTarget.closest('.board-columns');
  if (container) {
    const rect = container.getBoundingClientRect();
    const scrollSpeed = 10;
    
    if (event.clientX < rect.left + 100) {
      container.scrollLeft -= scrollSpeed;
    } else if (event.clientX > rect.right - 100) {
      container.scrollLeft += scrollSpeed;
    }
  }
};

const handleDragLeave = (event) => {
  // Only clear drop zone if leaving the column entirely
  const rect = event.currentTarget.getBoundingClientRect();
  const x = event.clientX;
  const y = event.clientY;
  
  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
    dropZoneActive.value = null;
  }
};

const handleDrop = async (event, newStatusId) => {
  event.preventDefault();
  dropZoneActive.value = null;
  
  if (!draggedTask.value) return;
  
  const task = draggedTask.value;
  const oldStatusId = task.status_id || task.status?.id;
  
  // Don't update if dropping on the same status
  if (oldStatusId === newStatusId) {
    return;
  }
  
  // Update task status
  await updateTaskStatus(task, newStatusId);
  
  // Announce completion to screen readers
  const newStatus = taskStatuses.value.find(s => s.id === newStatusId);
  const announcement = `Task "${task.title}" moved to ${newStatus?.name || 'Unknown status'}`;
  announceToScreenReader(announcement);
};

// Touch handling for mobile drag
const handleTouchStart = (event, task) => {
  touchStarted.value = true;
  draggedTask.value = task;
  
  const touch = event.touches[0];
  touchStartPosition.value = {
    x: touch.clientX,
    y: touch.clientY
  };
  touchCurrentPosition.value = { ...touchStartPosition.value };
  
  // Prevent text selection
  event.preventDefault();
};

const handleTouchMove = (event) => {
  if (!touchStarted.value || !draggedTask.value) return;
  
  event.preventDefault();
  const touch = event.touches[0];
  touchCurrentPosition.value = {
    x: touch.clientX,
    y: touch.clientY
  };
  
  // Calculate distance moved
  const deltaX = Math.abs(touch.clientX - touchStartPosition.value.x);
  const deltaY = Math.abs(touch.clientY - touchStartPosition.value.y);
  
  // Start visual dragging if moved enough horizontally
  if (deltaX > dragThreshold && deltaX > deltaY) {
    isDragging.value = true;
    
    // Find which column we're over
    const columns = document.querySelectorAll('.board-column');
    let targetColumn = null;
    
    columns.forEach(column => {
      const rect = column.getBoundingClientRect();
      if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
          touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
        targetColumn = column;
      }
    });
    
    if (targetColumn) {
      const statusId = parseInt(targetColumn.dataset.statusId);
      if (statusId !== draggedTask.value.status_id) {
        dropZoneActive.value = statusId;
      }
    } else {
      dropZoneActive.value = null;
    }
    
    // Auto-scroll horizontally
    const container = document.querySelector('.board-columns');
    if (container) {
      const rect = container.getBoundingClientRect();
      const scrollSpeed = 10;
      
      if (touch.clientX < rect.left + 50) {
        container.scrollLeft -= scrollSpeed;
      } else if (touch.clientX > rect.right - 50) {
        container.scrollLeft += scrollSpeed;
      }
    }
  }
};

const handleTouchEnd = async (event) => {
  if (!touchStarted.value) return;
  
  const wasDragging = isDragging.value;
  const task = draggedTask.value;
  
  // Reset touch state
  touchStarted.value = false;
  isDragging.value = false;
  
  if (wasDragging && task && dropZoneActive.value) {
    // Complete the drag operation
    await updateTaskStatus(task, dropZoneActive.value);
    
    // Announce completion
    const newStatus = taskStatuses.value.find(s => s.id === dropZoneActive.value);
    const announcement = `Task "${task.title}" moved to ${newStatus?.name || 'Unknown status'}`;
    announceToScreenReader(announcement);
  }
  
  // Clean up
  draggedTask.value = null;
  dropZoneActive.value = null;
};

// Keyboard accessibility
const handleTaskKeydown = async (event, task) => {
  // Handle arrow keys for keyboard navigation
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    event.preventDefault();
    
    const currentStatusIndex = taskStatuses.value.findIndex(s => 
      s.id === (task.status_id || task.status?.id)
    );
    
    let newStatusIndex;
    if (event.key === 'ArrowLeft') {
      newStatusIndex = Math.max(0, currentStatusIndex - 1);
    } else {
      newStatusIndex = Math.min(taskStatuses.value.length - 1, currentStatusIndex + 1);
    }
    
    if (newStatusIndex !== currentStatusIndex) {
      const newStatus = taskStatuses.value[newStatusIndex];
      await updateTaskStatus(task, newStatus.id);
      
      // Announce the change
      const announcement = `Task "${task.title}" moved to ${newStatus.name}`;
      announceToScreenReader(announcement);
    }
  } else if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    openTaskDetail(task);
  }
};

// Update task status via API
const updateTaskStatus = async (task, newStatusId) => {
  if (updatingTaskStatus.value) return;
  
  const oldStatusId = task.status_id || task.status?.id;
  if (oldStatusId === newStatusId) return;
  
  updatingTaskStatus.value = true;
  
  try {
    // Optimistically update UI
    const oldStatus = task.status_id || task.status?.id;
    task.status_id = newStatusId;
    
    // Find and update status object if it exists
    if (task.status) {
      const newStatus = taskStatuses.value.find(s => s.id === newStatusId);
      if (newStatus) {
        task.status = { ...newStatus };
      }
    }
    
    // Call API to update status
    await taskService.updateTaskStatus(task.uuid || task.id, { status_id: newStatusId });
    
    successToast('Status tugas berhasil diperbarui');
    
  } catch (error) {
    // Revert optimistic update on error
    task.status_id = oldStatusId;
    if (task.status) {
      const oldStatusObj = taskStatuses.value.find(s => s.id === oldStatusId);
      if (oldStatusObj) {
        task.status = { ...oldStatusObj };
      }
    }
    
    console.error('Error updating task status:', error);
    errorToast('Gagal memperbarui status tugas');
  } finally {
    updatingTaskStatus.value = false;
  }
};

// Utility function for screen reader announcements
const announceToScreenReader = (message) => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', 'polite');
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Handle board horizontal scrolling
const handleBoardScroll = (event) => {
  // Could add scroll indicators or other UX enhancements here
  const container = event.target;
  const isAtStart = container.scrollLeft === 0;
  const isAtEnd = container.scrollLeft >= container.scrollWidth - container.clientWidth;
  
  // Could emit events or update reactive state for scroll indicators
};

// Member actions
const removeMember = async (member) => {
  if (!confirm(`Hapus anggota ${member.name} dari proyek?`)) return;

  try {
    const projectSlug = route.params.projectSlug;
    await projectService.removeMember(projectSlug, { user_id: member.id });
    successToast('Anggota berhasil dihapus');
    // Refresh project data and tasks
    await refreshProject();
    await loadTasks(route.params.projectSlug);
  } catch (error) {
    console.error('Error removing member:', error);
    errorToast('Gagal menghapus anggota');
  }
};

// Normalized project members computed (handles several API shapes)
const projectMembers = computed(() => {
  if (!project.value) return [];
  // common shapes: project.members (array of {id, name, email, avatar, role})
  // or project.users with pivot {role}
  const members = project.value.members || project.value.users || [];

  return members.map(m => {
    // m may be a 'user' object or a pivot wrapper
    const id = m.id ?? m.user_id ?? m.user?.id;
    const name = m.name ?? m.user_name ?? m.user?.name ?? m.user?.full_name;
    const email = m.email ?? m.user_email ?? m.user?.email;
    const avatar = m.avatar ?? m.user?.avatar;
    // role may be on pivot (m.pivot.role) or m.role or m.project_role
    const role = m.role ?? m.pivot?.role ?? m.project_role ?? m.permission;

    return { id, name, email, avatar, role };
  }).filter(x => x && x.id);
});

// Return a readable role label for a member
const getMemberRole = (member) => {
  if (!member) return '';
  const r = member.role || '';
  if (!r) return '';
  // common roles mapping
  const map = {
    owner: 'Pemilik',
    admin: 'Admin',
    member: 'Anggota',
    manager: 'Manajer'
  };
  return map[r.toString().toLowerCase()] || r;
};
</script>

<style scoped>
.project-detail-page {
  min-height: 100vh;
  background: var(--color-background);
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--color-border);
  border-top: 3px solid var(--color-primary-500);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Project Header */
.project-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 24px 0;
  border-bottom: 1px solid var(--color-border);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  font-size: 14px;
}

.breadcrumb-link {
  color: var(--color-primary-500);
  text-decoration: none;
}

.breadcrumb-link:hover {
  text-decoration: underline;
}

.breadcrumb-separator {
  color: var(--color-muted);
}

.breadcrumb-current {
  color: var(--color-text);
  font-weight: 500;
}

.project-details {
  display: flex;
  align-items: flex-start;
  gap: 16px;
}

.project-color {
  width: 6px;
  height: 60px;
  border-radius: 3px;
  flex-shrink: 0;
}

.project-meta {
  flex: 1;
}

.project-name {
  font-size: 28px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 8px 0;
}

.project-description {
  font-size: 16px;
  color: var(--color-muted);
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.project-stats {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-muted);
  font-size: 14px;
}

.stat-item svg {
  color: var(--color-primary-500);
}

.project-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Project Navigation */
.project-nav {
  display: flex;
  align-items: center;
  gap: 0;
  border-bottom: 1px solid var(--color-border);
  margin-bottom: 32px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  background: transparent;
  border: none;
  color: var(--color-muted);
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
}

.nav-item:hover {
  color: var(--color-text);
  background: var(--color-background-soft);
}

.nav-item.active {
  color: var(--color-primary-600);
  border-bottom-color: var(--color-primary-500);
}

.nav-item svg {
  color: currentColor;
}

/* Board View */
.board-view {
  min-height: 600px;
  position: relative;
  /* let content determine height, no fixed height constraint */
  display: flex;
  flex-direction: column;
}

.board-columns {
  display: flex;
  gap: 24px;
  /* only horizontal scroll, let height be natural */
  overflow-x: auto;
  overflow-y: visible;
  padding: 16px;
  align-items: flex-start; /* align columns to top, let them grow naturally */
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
}

/* Horizontal scrolling for many columns */
@media (min-width: 768px) {
  .board-columns {
    /* ensure flex layout on desktop too */
    display: flex;
    gap: 24px;
    overflow-x: auto;
    overflow-y: visible;
    padding-bottom: 12px;
    scroll-behavior: smooth;
    -webkit-overflow-scrolling: touch;
    align-items: flex-start;
  }

  .board-column {
    /* responsive width on desktop */
    flex: 0 0 auto;
    min-width: 300px;
    width: clamp(300px, 20vw, 350px);
    display: flex;
    flex-direction: column;
  }
}

.board-column {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 16px;
  /* responsive width with minimum constraint */
  flex: 0 0 auto;
  min-width: 280px;
  width: clamp(280px, 25vw, 400px); /* responsive width between 280px and 400px */
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
}

/* Drop zone styling */
.board-column.drop-zone-active {
  border-color: var(--color-primary-500);
  background: var(--color-primary-50);
  box-shadow: 0 0 0 2px var(--color-primary-200);
  transform: scale(1.02);
}

.column-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
}

.status-indicator {
  width: 4px;
  height: 20px;
  border-radius: 2px;
  flex-shrink: 0;
}

.column-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
  flex: 1;
}

.column-count {
  background: var(--color-border);
  color: var(--color-muted);
  font-size: 12px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: 12px;
  min-width: 24px;
  text-align: center;
  transition: all 0.2s ease;
}

.drop-zone-active .column-count {
  background: var(--color-primary-500);
  color: white;
}

.column-tasks {
  display: flex;
  flex-direction: column;
  gap: 12px;
  /* no scroll, show all tasks directly */
  flex: 1 1 auto;
  min-height: 0;
}

.task-card {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  user-select: none;
  -webkit-user-select: none;
  touch-action: none;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border-color: var(--color-primary-200);
}

.task-card:focus {
  outline: 2px solid var(--color-primary-500);
  outline-offset: 2px;
}

/* Drag states */
.task-card.task-dragging {
  opacity: 0.7;
  transform: rotate(2deg) scale(1.05);
  z-index: 1000;
  box-shadow: 0 8px 25px rgba(0,0,0,0.15);
  border-color: var(--color-primary-500);
}

.task-card.task-ghost {
  opacity: 0.3;
  transform: scale(0.95);
}

/* Mobile drag feedback */
@media (max-width: 768px) {
  .task-card.task-dragging {
    transform: scale(1.1);
    box-shadow: 0 12px 30px rgba(0,0,0,0.2);
  }
}

.task-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  margin-bottom: 8px;
}

.task-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
  line-height: 1.4;
  flex: 1;
}

.task-priority {
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
}

.task-priority.low { background: #e5f3ff; color: #0066cc; }
.task-priority.medium { background: #fff3cd; color: #856404; }
.task-priority.high { background: #ffe5e5; color: #dc3545; }
.task-priority.urgent { background: #ff4757; color: white; }

.task-description {
  font-size: 12px;
  color: var(--color-muted);
  margin: 0 0 12px 0;
  line-height: 1.4;
}

.task-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.task-assignees {
  display: flex;
  align-items: center;
  gap: -6px;
}

.assignee-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid var(--color-background);
  overflow: hidden;
  margin-left: -6px;
  position: relative;
  transition: all 0.2s ease;
}

.assignee-avatar:first-child {
  margin-left: 0;
}

.assignee-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.assignee-avatar-fallback {
  width: 100%;
  height: 100%;
  background: var(--color-primary-500);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
}

.assignee-count-more {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--color-border);
  color: var(--color-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  margin-left: -6px;
  border: 2px solid var(--color-background);
  transition: all 0.2s ease;
}

.task-info {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 11px;
  color: var(--color-muted);
}

.task-due-date {
  display: flex;
  align-items: center;
  gap: 4px;
}

.task-due-date.overdue {
  color: #dc3545;
}

.task-comments,
.task-attachments {
  display: flex;
  align-items: center;
  gap: 4px;
}

/* Status update overlay */
.status-update-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  border-radius: 12px;
}

.status-update-message {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px 24px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  font-weight: 500;
  color: var(--color-text);
}

/* Screen reader only content */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

/* Drag animations */
@keyframes dragPulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.task-card.task-dragging {
  animation: dragPulse 0.6s ease-in-out infinite;
}

/* Custom scrollbar for horizontal scrolling */
.board-columns::-webkit-scrollbar {
  height: 8px;
}

.board-columns::-webkit-scrollbar-track {
  background: var(--color-background-soft);
  border-radius: 4px;
}

.board-columns::-webkit-scrollbar-thumb {
  background: var(--color-border);
  border-radius: 4px;
}

.board-columns::-webkit-scrollbar-thumb:hover {
  background: var(--color-muted);
}

/* List View */
.list-view {
  min-height: 600px;
}

.list-header {
  margin-bottom: 24px;
}

.list-filters {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.filter-select {
  padding: 8px 12px;
  border: 1px solid var(--color-border);
  border-radius: 6px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 14px;
  min-width: 140px;
}

.task-list {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
}

.task-list-header {
  display: grid;
  grid-template-columns: 2fr 120px 120px 150px 120px 60px;
  gap: 16px;
  padding: 16px 20px;
  background: var(--color-border);
  font-size: 12px;
  font-weight: 600;
  color: var(--color-muted);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.task-list-item {
  display: grid;
  grid-template-columns: 2fr 120px 120px 150px 120px 60px;
  gap: 16px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--color-border);
  cursor: pointer;
  transition: background-color 0.2s ease;
}

.task-list-item:hover {
  background: var(--color-background);
}

.task-list-item:last-child {
  border-bottom: none;
}

.task-col {
  display: flex;
  align-items: center;
  min-height: 40px;
}

.task-title-cell {
  flex: 1;
}

.task-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  margin: 0 0 4px 0;
}

.task-indicators {
  display: flex;
  align-items: center;
  gap: 8px;
}

.indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--color-muted);
}

.status-badge {
  padding: 4px 12px;
  border-radius: 16px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.status-badge.todo { background: #f8f9fa; color: #6c757d; }
.status-badge.in-progress { background: #e3f2fd; color: #1976d2; }
.status-badge.review { background: #fff3e0; color: #f57c00; }
.status-badge.done { background: #e8f5e8; color: #2e7d32; }

.priority-badge {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  border-radius: 6px;
  font-size: 11px;
  font-weight: 500;
  text-transform: capitalize;
}

.priority-badge.low { background: #e5f3ff; color: #0066cc; }
.priority-badge.medium { background: #fff3cd; color: #856404; }
.priority-badge.high { background: #ffe5e5; color: #dc3545; }
.priority-badge.urgent { background: #ff4757; color: white; }

.assignee-list {
  display: flex;
  align-items: center;
  gap: -6px;
}

.assignee-avatar.small {
  width: 28px;
  height: 28px;
  margin-left: -6px;
}

.assignee-avatar.small:first-child {
  margin-left: 0;
}

.due-date {
  font-size: 12px;
  color: var(--color-muted);
}

.due-date.overdue {
  color: #dc3545;
  font-weight: 600;
}

/* Placeholder Views */
.timeline-view,
.files-view {
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.timeline-placeholder,
.files-placeholder {
  text-align: center;
  padding: 64px 24px;
}

.placeholder-icon {
  color: var(--color-muted);
  margin-bottom: 24px;
}

.timeline-placeholder h3,
.files-placeholder h3 {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 8px 0;
}

.timeline-placeholder p,
.files-placeholder p {
  font-size: 14px;
  color: var(--color-muted);
  margin: 0;
}

/* Members View */
.members-view {
  min-height: 400px;
}

.members-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.members-list {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 12px;
}

.member-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border-bottom: 1px solid var(--color-border);
}

.member-item:last-child {
  border-bottom: none;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 12px;
}

.member-avatar {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--color-background);
}

.member-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.member-avatar-fallback {
  width: 100%;
  height: 100%;
  background: var(--color-primary-500);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 700;
}

.member-meta .member-name {
  font-weight: 600;
  color: var(--color-text);
}

.member-meta .member-email {
  font-size: 13px;
  color: var(--color-muted);
}

.member-role {
  margin-top: 6px;
}

.role-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 999px;
  background: var(--color-border);
  color: var(--color-muted);
  font-size: 12px;
  font-weight: 600;
}

.member-actions .btn[disabled] {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Activities View */
.activities-view {
  min-height: 400px;
}

.activities-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.activities-header h3 {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.activities-content {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 16px;
  min-height: 300px;
}

.activities-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
}

.loading-spinner.small {
  width: 24px;
  height: 24px;
  border: 2px solid var(--color-border);
  border-top: 2px solid var(--color-primary-500);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 12px;
}

.empty-activities {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 40px;
  text-align: center;
  color: var(--color-muted);
}

.empty-icon {
  margin-bottom: 16px;
}

.activities-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.activity-item:hover {
  border-color: var(--color-primary-200);
  box-shadow: 0 2px 8px rgba(0,0,0,0.05);
}

.activity-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  border: 2px solid var(--color-background);
  flex-shrink: 0;
}

.activity-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.activity-avatar-fallback {
  width: 100%;
  height: 100%;
  background: var(--color-primary-500);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
}

.activity-content {
  flex: 1;
  min-width: 0;
}

.activity-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 4px;
}

.activity-user {
  font-weight: 600;
  color: var(--color-text);
  font-size: 14px;
}

.activity-time {
  font-size: 12px;
  color: var(--color-muted);
}

.activity-message {
  font-size: 14px;
  color: var(--color-text);
  line-height: 1.4;
  margin-bottom: 8px;
}

.activity-action {
  font-weight: 500;
}

.activity-target {
  color: var(--color-primary-600);
  font-weight: 500;
}

.activity-comment {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 6px;
  padding: 8px 12px;
  margin-top: 8px;
  font-size: 13px;
  color: var(--color-muted);
  font-style: italic;
}

.activity-type-badge {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.activity-type-badge.audit {
  background: #e3f2fd;
  color: #1976d2;
}

.activity-type-badge.task_activity {
  background: #fff3e0;
  color: #f57c00;
}

.activity-type-badge.comment {
  background: #e8f5e8;
  color: #2e7d32;
}

/* Error State */
.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
  min-height: 60vh;
}

.error-icon {
  color: #ef4444;
  margin-bottom: 24px;
}

.error-state h3 {
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 8px 0;
}

.error-state p {
  font-size: 16px;
  color: var(--color-muted);
  margin: 0 0 24px 0;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-primary {
  background: var(--color-primary-500);
  color: white;
}

.btn-primary:hover {
  background: var(--color-primary-600);
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--color-background-soft);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background: var(--color-border);
  transform: translateY(-1px);
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover {
  background: #c82333;
  transform: translateY(-1px);
}

.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 6px;
  background: transparent;
  color: var(--color-muted);
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-icon:hover {
  background: var(--color-border);
  color: var(--color-text);
}

/* Responsive */
@media (max-width: 768px) {
  .project-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .project-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .project-nav {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .nav-item {
    white-space: nowrap;
    flex-shrink: 0;
  }

  /* Mobile-first board layout */
  .board-columns {
    display: flex;
    gap: 16px;
    padding: 0 16px 16px 16px;
    margin: 0 -16px;
  }

  .board-column {
    min-width: 260px;
    flex-shrink: 0;
  }

  /* Enhanced touch targets for mobile */
  .task-card {
    padding: 20px 16px;
    touch-action: manipulation;
  }

  .task-card.task-dragging {
    transform: scale(1.08);
    box-shadow: 0 8px 25px rgba(0,0,0,0.2);
    z-index: 9999;
  }

  /* Better tap targets */
  .btn-icon {
    min-width: 44px;
    min-height: 44px;
  }

  .task-list-header,
  .task-list-item {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .task-col {
    justify-content: flex-start;
    min-height: auto;
  }

  .list-filters {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .filter-select {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .project-details {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }

  .project-color {
    width: 100%;
    height: 4px;
  }

  .project-stats {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }

  /* Smaller cards on very small screens */
  .board-column {
    min-width: 240px;
  }

  .task-card {
    padding: 16px 12px;
  }

  /* Status update overlay adjustments */
  .status-update-message {
    padding: 12px 16px;
    font-size: 14px;
  }
}

/* Landscape orientation on mobile */
@media screen and (max-height: 500px) and (orientation: landscape) {
  .board-view {
    min-height: 300px;
  }

  .board-column {
    min-height: 250px;
  }

  .task-card {
    padding: 12px;
  }
}

/* High DPI displays */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .task-card.task-dragging {
    transform: scale(1.05);
  }
}

/* Reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  .task-card,
  .board-column,
  .assignee-avatar,
  .column-count {
    transition: none;
  }

  .task-card.task-dragging {
    animation: none;
    transform: scale(1.02);
  }

  .board-columns {
    scroll-behavior: auto;
  }
}

/* Dark mode support */
@media (prefers-color-scheme: dark) {
  .status-update-overlay {
    background: rgba(0, 0, 0, 0.8);
  }

  .board-columns::-webkit-scrollbar-track {
    background: #2d3748;
  }

  .board-columns::-webkit-scrollbar-thumb {
    background: #4a5568;
  }

  .board-columns::-webkit-scrollbar-thumb:hover {
    background: #718096;
  }
}
</style>
