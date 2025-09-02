<template>
  <div class="dashboard-page">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-content">
        <h1 class="page-title">Dashboard</h1>
        <p class="page-subtitle">Selamat datang di PRIMA - Kelola proyek dan aktivitas Anda</p>
      </div>
      <div class="header-actions">
        <button class="btn btn-primary" @click="showCreateWorkspaceModal = true">
          <font-awesome-icon icon="plus" />
          Buat Workspace
        </button>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Memuat workspace...</p>
    </div>

    <!-- Main Content -->
    <div v-else class="dashboard-content">
      <!-- Left Column -->
      <div class="dashboard-left">
        <!-- Workspaces Section -->
        <section class="workspaces-section">
          <div class="section-header">
            <h2 class="section-title">
              <font-awesome-icon icon="briefcase" />
              Workspace Saya
            </h2>
            <span class="section-count">{{ workspaces.length }} workspace</span>
          </div>

        <!-- Empty State -->
        <div v-if="workspaces.length === 0" class="empty-state">
          <div class="empty-icon">
            <font-awesome-icon icon="briefcase" size="3x" />
          </div>
          <h3>Belum ada workspace</h3>
          <p>Buat workspace pertama Anda untuk mulai mengelola proyek</p>
          <button class="btn btn-primary" @click="showCreateWorkspaceModal = true">
            <font-awesome-icon icon="plus" />
            Buat Workspace Pertama
          </button>
        </div>

        <!-- Workspace Grid -->
        <div v-else class="workspace-grid">
          <div 
            v-for="workspace in workspaces" 
            :key="workspace.id"
            class="workspace-card"
            @click="goToWorkspace(workspace)"
          >
            <div class="workspace-header">
              <div class="workspace-avatar">
                <img v-if="workspace.avatar" :src="workspace.avatar" :alt="workspace.name" />
                <div v-else class="workspace-avatar-fallback">
                  {{ getWorkspaceInitials(workspace.name) }}
                </div>
              </div>
              <div class="workspace-info">
                <h3 class="workspace-name">{{ workspace.name }}</h3>
                <p class="workspace-description">{{ workspace.description || 'Tidak ada deskripsi' }}</p>
              </div>
              <div class="workspace-menu">
                <button class="btn-icon" @click.stop="toggleWorkspaceMenu(workspace.id)">
                  <font-awesome-icon icon="ellipsis-v" />
                </button>
              </div>
            </div>

            <div class="workspace-stats">
              <div class="stat-item">
                <font-awesome-icon icon="folder" />
                <span>{{ workspace.projects_count || 0 }} Proyek</span>
              </div>
              <div class="stat-item">
                <font-awesome-icon icon="users" />
                <span>{{ workspace.members_count || 0 }} Anggota</span>
              </div>
              <div class="stat-item">
                <font-awesome-icon icon="tasks" />
                <span>{{ workspace.tasks_count || 0 }} Tugas</span>
              </div>
            </div>

            <div class="workspace-members">
              <div class="member-avatars">
                <div 
                  v-for="member in workspace.members?.slice(0, 5)" 
                  :key="member.id"
                  class="member-avatar"
                  :title="member.name"
                >
                  <img v-if="member.avatar" :src="member.avatar" :alt="member.name" />
                  <div v-else class="member-avatar-fallback">
                    {{ getMemberInitials(member.name) }}
                  </div>
                </div>
                <div v-if="workspace.members?.length > 5" class="member-count-more">
                  +{{ workspace.members.length - 5 }}
                </div>
              </div>
            </div>

            <div class="workspace-footer">
              <span class="workspace-role">{{ getUserRole(workspace) }}</span>
              <span class="workspace-updated">
                Diperbarui {{ formatDate(workspace.updated_at) }}
              </span>
            </div>
          </div>
        </div>
        </section>

        <!-- Recent Projects Section -->
        <section v-if="selectedWorkspace" class="projects-section">
          <div class="section-header">
            <h2 class="section-title">
              <font-awesome-icon icon="folder" />
              Proyek di {{ selectedWorkspace.name }}
            </h2>
            <div class="section-actions">
              <button class="btn btn-secondary" @click="showCreateProjectModal = true">
                <font-awesome-icon icon="plus" />
                Buat Proyek
              </button>
            </div>
          </div>

          <!-- Project Grid -->
          <div class="project-grid">
            <div 
              v-for="project in projects" 
              :key="project.id"
              class="project-card"
              @click="goToProject(project)"
            >
              <div class="project-header">
                <div class="project-color" :style="{ backgroundColor: project.color || '#17a2b8' }"></div>
                <div class="project-info">
                    <h4 class="project-name">{{ project.name }}</h4>
                    <div class="project-meta-line">
                      <span class="project-workspace">{{ project.workspace?.name || project.workspace_name || '' }}</span>
                    </div>
                    <p class="project-description">{{ project.description || 'Tidak ada deskripsi' }}</p>
                </div>
                <div class="project-menu">
                  <button class="btn-icon" @click.stop="toggleProjectMenu(project.id)">
                    <font-awesome-icon icon="ellipsis-v" />
                  </button>
                </div>
              </div>

              <div class="project-progress">
                <div class="progress-bar">
                  <div 
                    class="progress-fill" 
                    :style="{ width: `${calculateProgress(project)}%` }"
                  ></div>
                </div>
                <span class="progress-text">{{ calculateProgress(project) }}% selesai</span>
              </div>

              <div class="project-stats">
                <div class="stat-item">
                  <font-awesome-icon icon="tasks" />
                  <span>{{ project.tasks_count || 0 }}</span>
                </div>
                <div class="stat-item">
                  <font-awesome-icon icon="check-circle" />
                  <span>{{ project.completed_tasks_count || 0 }}</span>
                </div>
                <div class="stat-item">
                  <font-awesome-icon icon="users" />
                  <span>{{ project.members_count || 0 }}</span>
                </div>
              </div>

              <div class="project-members">
                <div class="member-avatars">
                  <div 
                    v-for="member in project.members?.slice(0, 4)" 
                    :key="member.id"
                    class="member-avatar small"
                    :title="member.name"
                  >
                    <img v-if="member.avatar" :src="member.avatar" :alt="member.name" />
                    <div v-else class="member-avatar-fallback">
                      {{ getMemberInitials(member.name) }}
                    </div>
                  </div>
                  <div v-if="project.members?.length > 4" class="member-count-more small">
                    +{{ project.members.length - 4 }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <!-- Right Column -->
      <div class="dashboard-right">
            <!-- Recent Tasks Section -->
            <section class="recent-tasks-section">
              <div class="section-header">
                <h2 class="section-title">
                  <font-awesome-icon icon="list" />
                  Tugas Terbaru
                </h2>
              </div>

              <div class="task-list">
                <div v-for="task in recentTasks" :key="task.id" class="task-item" @click="goToProject(task.project)">
                  <div class="task-meta">
                    <div class="task-title">{{ task.title }}</div>
                    <div class="task-project">{{ task.project?.workspace?.name || task.project?.workspace_name || task.project?.name || '—' }}</div>
                  </div>
                  <div class="task-time">{{ formatDate(task.updated_at || task.created_at) }}</div>
                </div>
              </div>
            </section>

        <!-- Recent Activity Section -->
        <section class="activity-section">
          <div class="section-header">
            <h2 class="section-title">
              <font-awesome-icon icon="clock" />
              Aktivitas Terbaru
            </h2>
          </div>

          <div class="activity-list">
            <div v-for="activity in recentActivities" :key="activity.id" class="activity-item">
              <div class="activity-avatar">
                <img v-if="activity.user?.avatar" :src="activity.user.avatar" :alt="activity.user.name" />
                <div v-else class="activity-avatar-fallback">
                  {{ getMemberInitials(activity.user?.name || 'U') }}
                </div>
              </div>
              <div class="activity-content">
                <p class="activity-text">
                  <strong>{{ activity.user?.name || 'User' }}</strong>
                  {{ activity.description }}
                </p>
                <span class="activity-time">{{ formatDate(activity.created_at) }}</span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>

    <!-- Modals will be added here later -->
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { workspaceService } from '@/api/services/workspaceService';
import { projectService } from '@/api/services/projectService';
import { useAuthStore } from '@/stores/auth';
import { errorToast, successToast } from '@/utils/toast';

const router = useRouter();
const authStore = useAuthStore();

// Reactive data
const loading = ref(true);
const workspaces = ref([]);
const selectedWorkspace = ref(null);
const projects = ref([]);
const recentActivities = ref([]);
const recentTasks = ref([]);
const showCreateWorkspaceModal = ref(false);
const showCreateProjectModal = ref(false);

// Load data on mount
onMounted(async () => {
  await loadWorkspaces();
  await loadRecentActivities();
  await loadRecentTasks();
  loading.value = false;
});

// Load workspaces
const loadWorkspaces = async () => {
  try {
    const response = await workspaceService.list();
    workspaces.value = response.data.data || [];
    
    // Auto-select first workspace if available
    if (workspaces.value.length > 0) {
      await selectWorkspace(workspaces.value[0]);
    }
  } catch (error) {
    errorToast('Gagal memuat workspace');
    console.error('Error loading workspaces:', error);
  }
};

// Select workspace and load its projects
const selectWorkspace = async (workspace) => {
  selectedWorkspace.value = workspace;
  await loadProjects(workspace.slug);
};

// Load projects for selected workspace
const loadProjects = async (workspaceSlug) => {
  try {
    const response = await projectService.list({ workspace: workspaceSlug });
    projects.value = response.data.data || [];
  } catch (error) {
    errorToast('Gagal memuat proyek');
    console.error('Error loading projects:', error);
  }
};

// Load recent activities
const loadRecentActivities = async () => {
  try {
    // This would be a separate API call for activities
    // For now, using mock data
    recentActivities.value = [
      {
        id: 1,
        user: { name: 'John Doe', avatar: null },
        description: 'membuat task baru "Setup Database"',
        created_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        user: { name: 'Jane Smith', avatar: null },
        description: 'menyelesaikan task "Design UI"',
        created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 3,
        user: { name: 'Mike Johnson', avatar: null },
        description: 'menambahkan komentar di "API Integration"',
        created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 4,
        user: { name: 'Sarah Wilson', avatar: null },
        description: 'mengupload dokumen "Requirements.pdf"',
        created_at: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 5,
        user: { name: 'Alex Brown', avatar: null },
        description: 'memindahkan task "Testing" ke Done',
        created_at: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 6,
        user: { name: 'Lisa Davis', avatar: null },
        description: 'membuat proyek baru "Mobile App"',
        created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
      }
    ];
  } catch (error) {
    console.error('Error loading activities:', error);
  }
};

// Load recent tasks (shows on the right column above activities)
const loadRecentTasks = async () => {
  try {
    // Ideally this comes from an API like taskService.recent()
    // For now provide mock data showing project.workspace usage
    recentTasks.value = [
      {
        id: 101,
        title: 'Setup Database',
        project: { id: 11, name: 'API Integration System', slug: 'api-integration', workspace: { id: 1, name: 'Academic Affairs Workspace', slug: 'academic-affairs' } },
        updated_at: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      },
      {
        id: 102,
        title: 'Design UI',
        project: { id: 12, name: 'Mobile App ProMan', slug: 'mobile-app', workspace_name: 'Development Team Workspace', workspace: { id: 2, name: 'Development Team Workspace', slug: 'development-team' } },
        updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 103,
        title: 'Write Requirements',
        project: { id: 13, name: 'Website Official Universitas', slug: 'website-official', workspace: { id: 3, name: 'Marketing Team Workspace', slug: 'marketing' } },
        updated_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString()
      }
    ];
  } catch (error) {
    console.error('Error loading recent tasks:', error);
  }
};

// Helper functions
const getWorkspaceInitials = (name) => {
  return name?.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase() || 'WS';
};

const getMemberInitials = (name) => {
  return name?.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase() || 'U';
};

const getUserRole = (workspace) => {
  // This would come from the workspace data
  return workspace.user_role || 'Anggota';
};

const calculateProgress = (project) => {
  const total = project.tasks_count || 0;
  const completed = project.completed_tasks_count || 0;
  return total > 0 ? Math.round((completed / total) * 100) : 0;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now - date;
  
  const minutes = Math.floor(diff / (1000 * 60));
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (minutes < 60) return `${minutes} menit lalu`;
  if (hours < 24) return `${hours} jam lalu`;
  if (days < 7) return `${days} hari lalu`;
  
  return date.toLocaleDateString('id-ID');
};

// Navigation
const goToWorkspace = (workspace) => {
  router.push(`/workspaces/${workspace.slug}`);
};

const goToProject = (project) => {
  router.push(`/workspaces/${selectedWorkspace.value.slug}/projects/${project.slug}`);
};

// Menu toggles (placeholder for now)
const toggleWorkspaceMenu = (workspaceId) => {
  console.log('Toggle workspace menu:', workspaceId);
};

const toggleProjectMenu = (projectId) => {
  console.log('Toggle project menu:', projectId);
};
</script>

<style scoped>
.dashboard-page {
  max-width: 1400px;
  margin: 0 auto;
  padding: 24px;
}

/* Dashboard Content Layout */
.dashboard-content {
  display: grid;
  grid-template-columns: 1fr 400px;
  gap: 32px;
  align-items: start;
}

.dashboard-left {
  min-width: 0; /* Allow shrinking */
}

.dashboard-right {
  position: sticky;
  top: 24px;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 32px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color);
}

.header-content h1 {
  font-size: 28px;
  font-weight: 700;
  color: var(--text-color);
  margin: 0 0 4px 0;
}

.header-content p {
  color: var(--color-muted);
  margin: 0;
}

.header-actions {
  display: flex;
  gap: 12px;
}

/* Loading State */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px;
  color: var(--color-muted);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid var(--border-color);
  border-top: 3px solid var(--color-primary-500);
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Section Styles */
.workspaces-section,
.projects-section {
  margin-bottom: 48px;
}

.activity-section {
  margin-bottom: 24px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.section-title {
  font-size: 20px;
  font-weight: 600;
  color: var(--text-color);
  display: flex;
  align-items: center;
  gap: 8px;
}

.section-title svg {
  color: var(--color-primary-500);
}

.section-count {
  color: var(--color-muted);
  font-size: 14px;
}

.section-actions {
  display: flex;
  gap: 12px;
}

/* Empty State */
.empty-state {
  text-align: center;
  padding: 64px 32px;
  color: var(--color-muted);
}

.empty-icon {
  color: var(--border-color);
  margin-bottom: 16px;
}

.empty-state h3 {
  color: var(--text-color);
  margin: 0 0 8px 0;
}

.empty-state p {
  margin: 0 0 24px 0;
}

/* Workspace Grid */
.workspace-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}

.workspace-card {
  background: var(--bg-0);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.workspace-card:hover {
  border-color: var(--color-primary-500);
  box-shadow: 0 4px 12px rgba(23, 162, 184, 0.1);
}

.workspace-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.workspace-avatar {
  width: 48px;
  height: 48px;
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
}

.workspace-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.workspace-avatar-fallback {
  width: 100%;
  height: 100%;
  background: var(--color-primary-500);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 16px;
}

.workspace-info {
  flex: 1;
  min-width: 0;
}

.workspace-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workspace-description {
  color: var(--color-muted);
  font-size: 14px;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workspace-menu {
  flex-shrink: 0;
}

.workspace-stats {
  display: flex;
  gap: 16px;
  margin-bottom: 16px;
  padding: 12px 0;
  border-top: 1px solid var(--border-color);
  border-bottom: 1px solid var(--border-color);
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  color: var(--color-muted);
  font-size: 14px;
}

.stat-item svg {
  color: var(--color-primary-500);
  width: 14px;
}

.workspace-members {
  margin-bottom: 16px;
}

.member-avatars {
  display: flex;
  gap: -8px;
}

.member-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid var(--bg-0);
  overflow: hidden;
  margin-left: -8px;
}

.member-avatar:first-child {
  margin-left: 0;
}

.member-avatar.small {
  width: 24px;
  height: 24px;
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
  font-weight: 600;
  font-size: 12px;
}

.member-count-more {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--border-color);
  color: var(--color-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  margin-left: -8px;
  border: 2px solid var(--bg-0);
}

.member-count-more.small {
  width: 24px;
  height: 24px;
  font-size: 10px;
}

.workspace-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 12px;
  color: var(--color-muted);
}

.workspace-role {
  background: var(--color-primary-50);
  color: var(--color-primary-700);
  padding: 2px 8px;
  border-radius: 12px;
  font-weight: 500;
}

/* Project Grid */
.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
}

.project-card {
  background: var(--bg-0);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.project-card:hover {
  border-color: var(--color-primary-500);
  box-shadow: 0 2px 8px rgba(23, 162, 184, 0.1);
}

.project-header {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 16px;
}

.project-color {
  width: 4px;
  height: 32px;
  border-radius: 2px;
  flex-shrink: 0;
}

.project-info {
  flex: 1;
  min-width: 0;
}

.project-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 4px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-description {
  color: var(--color-muted);
  font-size: 13px;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.project-meta-line {
  display: flex;
  gap: 8px;
  align-items: center;
  margin-bottom: 6px;
}

.project-workspace {
  font-size: 12px;
  color: var(--color-muted);
  background: rgba(23,162,184,0.06);
  padding: 2px 8px;
  border-radius: 999px;
}

.project-progress {
  margin-bottom: 16px;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: var(--border-color);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 4px;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary-500);
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: var(--color-muted);
}

.project-stats {
  display: flex;
  gap: 12px;
  margin-bottom: 12px;
}

.project-members {
  display: flex;
  justify-content: flex-end;
}

/* Activity Section */
.activity-section {
  background: var(--bg-0);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 20px;
}

/* Recent Tasks Section */
.recent-tasks-section {
  background: var(--bg-0);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 16px;
  margin-bottom: 16px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.task-item {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 12px;
  border-radius: 8px;
  background: transparent;
  cursor: pointer;
  transition: background 0.15s ease;
}

.task-item:hover {
  background: var(--bg-1);
}

.task-meta {
  display: flex;
  flex-direction: column;
}

.task-title {
  font-size: 14px;
  color: var(--text-color);
  font-weight: 600;
}

.task-project {
  font-size: 12px;
  color: var(--color-muted);
}

.task-time {
  font-size: 12px;
  color: var(--color-muted);
  white-space: nowrap;
}

.activity-list {
  max-height: 600px;
  overflow-y: auto;
}

.activity-item {
  display: flex;
  gap: 12px;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color);
}

.activity-item:last-child {
  border-bottom: none;
}

.activity-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  overflow: hidden;
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
  font-weight: 600;
  font-size: 12px;
}

.activity-content {
  flex: 1;
}

.activity-text {
  color: var(--text-color);
  margin: 0 0 4px 0;
  font-size: 14px;
}

.activity-time {
  color: var(--color-muted);
  font-size: 12px;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
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
}

.btn-secondary {
  background: var(--bg-1);
  color: var(--text-color);
  border: 1px solid var(--border-color);
}

.btn-secondary:hover {
  background: var(--border-color);
}

.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: var(--color-muted);
  transition: all 0.2s ease;
}

.btn-icon:hover {
  background: var(--bg-1);
  color: var(--text-color);
}

/* Responsive */
@media (max-width: 1024px) {
  .dashboard-content {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  .dashboard-right {
    position: static;
    order: -1; /* Show activity first on mobile */
  }
}

@media (max-width: 768px) {
  .dashboard-page {
    padding: 16px;
  }

  .page-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .workspace-grid,
  .project-grid {
    grid-template-columns: 1fr;
  }

  .workspace-stats {
    flex-wrap: wrap;
  }

  .section-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 12px;
  }
}

/* Dark theme adjustments */
html.dark .workspace-role {
  background: var(--color-primary-900);
  color: var(--color-primary-200);
}

html.dark .progress-bar {
  background: var(--color-background-soft);
}
</style>