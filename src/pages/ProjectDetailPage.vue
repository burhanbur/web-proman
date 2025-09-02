<template>
  <div class="project-detail-page">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Loading project...</p>
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
                  {{ project.completed_tasks_count || 0 }} completed
                </span>
                <span class="stat-item">
                  <font-awesome-icon icon="circle" size="sm" />
                  {{ project.tasks_count || 0 }} total tasks
                </span>
                <span class="stat-item">
                  <font-awesome-icon icon="users" size="sm" />
                  {{ project.members?.length || 0 }} members
                </span>
              </div>
            </div>
          </div>
        </div>
        <div class="project-actions">
          <button class="btn btn-secondary" @click="showInviteModal = true">
            <font-awesome-icon icon="user-plus" size="sm" />
            Add Member
          </button>
          <button class="btn btn-primary" @click="showCreateTaskModal = true">
            <font-awesome-icon icon="plus" size="sm" />
            New Task
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
          Board
        </button>
        <button 
          :class="['nav-item', { active: activeView === 'list' }]"
          @click="activeView = 'list'"
        >
          <font-awesome-icon icon="list" size="sm" />
          List
        </button>
        <button 
          :class="['nav-item', { active: activeView === 'timeline' }]"
          @click="activeView = 'timeline'"
        >
          <font-awesome-icon icon="calendar" size="sm" />
          Timeline
        </button>
        <button 
          :class="['nav-item', { active: activeView === 'files' }]"
          @click="activeView = 'files'"
        >
          <font-awesome-icon icon="folder" size="sm" />
          Files
        </button>
      </div>

      <!-- View Content -->
      <div class="view-content">
        <!-- Board View -->
        <div v-if="activeView === 'board'" class="board-view">
          <div class="board-columns">
            <div 
              v-for="status in taskStatuses" 
              :key="status.id"
              class="board-column"
            >
              <div class="column-header">
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
                  @click="openTaskDetail(task)"
                >
                  <div class="task-header">
                    <h4 class="task-title">{{ task.title }}</h4>
                    <div class="task-priority" :class="task.priority?.toLowerCase()">
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
        </div>

        <!-- List View -->
        <div v-if="activeView === 'list'" class="list-view">
          <div class="list-header">
            <div class="list-filters">
              <select v-model="filterStatus" class="filter-select">
                <option value="">All Status</option>
                <option v-for="status in taskStatuses" :key="status.id" :value="status.id">
                  {{ status.name }}
                </option>
              </select>
              <select v-model="filterAssignee" class="filter-select">
                <option value="">All Assignees</option>
                <option v-for="member in project.members" :key="member.id" :value="member.id">
                  {{ member.name }}
                </option>
              </select>
              <select v-model="filterPriority" class="filter-select">
                <option value="">All Priorities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
          </div>
          <div class="task-list">
            <div class="task-list-header">
              <div class="task-col task-col-title">Task</div>
              <div class="task-col task-col-status">Status</div>
              <div class="task-col task-col-priority">Priority</div>
              <div class="task-col task-col-assignee">Assignee</div>
              <div class="task-col task-col-due-date">Due Date</div>
              <div class="task-col task-col-actions">Actions</div>
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
                <span class="status-badge" :class="task.status?.toLowerCase()">
                  {{ task.status }}
                </span>
              </div>
              <div class="task-col task-col-priority">
                <div class="priority-badge" :class="task.priority?.toLowerCase()">
                  <font-awesome-icon 
                    :icon="getPriorityIcon(task.priority)" 
                    size="sm" 
                  />
                  {{ task.priority }}
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
            <h3>Timeline View</h3>
            <p>Timeline view will be implemented here</p>
          </div>
        </div>

        <!-- Files View -->
        <div v-if="activeView === 'files'" class="files-view">
          <div class="files-placeholder">
            <font-awesome-icon icon="folder" size="3x" class="placeholder-icon" />
            <h3>Project Files</h3>
            <p>File management will be implemented here</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="error-state">
      <font-awesome-icon icon="exclamation-triangle" size="3x" class="error-icon" />
      <h3>Project not found</h3>
      <p>The project you're looking for doesn't exist or you don't have access to it.</p>
      <router-link :to="`/workspaces/${$route.params.workspaceSlug}`" class="btn btn-primary">
        Back to Workspace
      </router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
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
const taskStatuses = ref([
  { id: 'todo', name: 'To Do' },
  { id: 'in-progress', name: 'In Progress' },
  { id: 'review', name: 'Review' },
  { id: 'done', name: 'Done' }
]);
const activeView = ref('board');
const showInviteModal = ref(false);
const showCreateTaskModal = ref(false);

// Filters
const filterStatus = ref('');
const filterAssignee = ref('');
const filterPriority = ref('');

// Load data on mount
onMounted(async () => {
  await loadProject();
  loading.value = false;
});

// Load project data
const loadProject = async () => {
  try {
    const workspaceSlug = route.params.workspaceSlug;
    const projectSlug = route.params.projectSlug;
    
    // Load workspace
    const workspaceResponse = await workspaceService.getWorkspace(workspaceSlug);
    workspace.value = workspaceResponse.data.data;
    
    // Load project details
    const projectResponse = await projectService.getProject(workspaceSlug, projectSlug);
    project.value = projectResponse.data.data;
    
    // Load tasks
    await loadTasks(workspaceSlug, projectSlug);
    
  } catch (error) {
    errorToast('Failed to load project');
    console.error('Error loading project:', error);
  }
};

// Load tasks
const loadTasks = async (workspaceSlug, projectSlug) => {
  try {
    const response = await taskService.getTasks(workspaceSlug, projectSlug);
    tasks.value = response.data.data || [];
  } catch (error) {
    console.error('Error loading tasks:', error);
  }
};

// Computed properties
const filteredTasks = computed(() => {
  let filtered = tasks.value;
  
  if (filterStatus.value) {
    filtered = filtered.filter(task => task.status === filterStatus.value);
  }
  
  if (filterAssignee.value) {
    filtered = filtered.filter(task => 
      task.assignees?.some(assignee => assignee.id === filterAssignee.value)
    );
  }
  
  if (filterPriority.value) {
    filtered = filtered.filter(task => task.priority === filterPriority.value);
  }
  
  return filtered;
});

// Helper functions
const getTasksByStatus = (statusId) => {
  return tasks.value.filter(task => task.status === statusId);
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
  return icons[priority?.toLowerCase()] || 'minus';
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
  
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays === -1) return 'Yesterday';
  if (diffDays > 0) return `${diffDays} days`;
  return `${Math.abs(diffDays)} days ago`;
};

// Actions
const openTaskDetail = (task) => {
  // Implement task detail modal or navigation
  console.log('Open task detail:', task);
};

const toggleTaskMenu = (taskId) => {
  // Implement task menu logic
  console.log('Toggle task menu for:', taskId);
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
}

.board-columns {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 24px;
}

.board-column {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 16px;
  min-height: 500px;
}

.column-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--color-border);
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
}

.column-tasks {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-card {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.task-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  border-color: var(--color-primary-200);
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

  .board-columns {
    grid-template-columns: 1fr;
    gap: 16px;
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
}
</style>
