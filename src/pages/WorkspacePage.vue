<template>
  <div class="workspace-page">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <div class="loading-spinner"></div>
      <p>Memuat workspace...</p>
    </div>

    <!-- Workspace Content -->
    <div v-else-if="workspace" class="workspace-content">
      <div class="workspace-container">
        <!-- Workspace Header -->
        <div class="workspace-header">
          <div class="workspace-info">
            <div class="workspace-avatar">
              <img v-if="workspace.logo" :src="workspace.logo" :alt="workspace.name" />
              <div v-else class="workspace-avatar-fallback">
                {{ getWorkspaceInitials(workspace.name) }}
              </div>
            </div>
            <div class="workspace-details">
              <h1 class="workspace-name">{{ workspace.name }}</h1>
        <p v-if="workspace.description" class="workspace-description">{{ workspace.description }}</p>
              <div class="workspace-meta">
                <span class="meta-item">
                  <font-awesome-icon icon="users" size="sm" />
          {{ workspace.members_count || 0 }} Anggota
                </span>
                <span class="meta-item">
                  <font-awesome-icon icon="folder" size="sm" />
          {{ projects.length }} Proyek
                </span>
                <span class="meta-item">
                  <font-awesome-icon icon="calendar" size="sm" />
          Dibuat {{ formatDate(workspace.created_at) }}
                </span>
              </div>
            </div>
          </div>
          <div class="workspace-actions">
            <button class="btn btn-secondary" @click="showInviteModal = true">
              <font-awesome-icon icon="user-plus" size="sm" />
              Undang Anggota
            </button>
            <button class="btn btn-primary" @click="showCreateProjectModal = true">
              <font-awesome-icon icon="plus" size="sm" />
              Buat Proyek
            </button>
          </div>
        </div>

        <!-- Workspace Navigation -->
        <div class="workspace-nav">
          <button 
            :class="['nav-item', { active: activeTab === 'projects' }]"
            @click="activeTab = 'projects'"
          >
            <font-awesome-icon icon="folder" size="sm" />
            Proyek
          </button>
          <button 
            :class="['nav-item', { active: activeTab === 'members' }]"
            @click="activeTab = 'members'"
          >
            <font-awesome-icon icon="users" size="sm" />
            Anggota
          </button>
          <button 
            :class="['nav-item', { active: activeTab === 'activity' }]"
            @click="activeTab = 'activity'"
          >
            <font-awesome-icon icon="clock" size="sm" />
            Aktivitas
          </button>
          <button 
            :class="['nav-item', { active: activeTab === 'settings' }]"
            @click="activeTab = 'settings'"
          >
            <font-awesome-icon icon="cog" size="sm" />
            Pengaturan
          </button>
        </div>

        <!-- Tab Content -->
        <div class="tab-content">
          <!-- Projects Tab -->
          <div v-if="activeTab === 'projects'" class="projects-tab">
            <div v-if="projects.length === 0" class="empty-state">
              <font-awesome-icon icon="folder-open" size="3x" class="empty-icon" />
              <h3>Belum ada proyek</h3>
              <p>Buat proyek pertama Anda untuk memulai</p>
              <button class="btn btn-primary" @click="showCreateProjectModal = true">
                <font-awesome-icon icon="plus" size="sm" />
                Buat Proyek
              </button>
            </div>
            <div v-else class="project-grid">
              <div 
                v-for="project in projects" 
                :key="project.id" 
                class="project-card"
                @click="goToProject(project)"
              >
                <div class="project-header">
                  <div class="project-color" :style="{ backgroundColor: project.color || '#17a2b8' }"></div>
                  <div class="project-info">
                    <h3 class="project-name">{{ project.name }}</h3>
                    <p v-if="project.description" class="project-description">{{ project.description }}</p>
                  </div>
                  <div class="project-menu">
                    <button class="btn-icon" @click.stop="toggleProjectMenu(project.id)">
                      <font-awesome-icon icon="ellipsis-vertical" size="sm" />
                    </button>
                  </div>
                </div>
                <div class="project-progress">
                  <div class="progress-bar">
                    <div 
                      class="progress-fill" 
                      :style="{ width: calculateProgress(project) + '%' }"
                    ></div>
                  </div>
                  <span class="progress-text">{{ calculateProgress(project) }}% selesai</span>
                </div>
                <div class="project-footer">
                  <div class="project-stats">
                    <span class="stat-item">
                      <font-awesome-icon icon="check-circle" size="sm" />
                      {{ project.completed_tasks_count || 0 }} selesai
                    </span>
                    <span class="stat-item">
                      <font-awesome-icon icon="circle" size="sm" />
                      {{ project.tasks_count || 0 }} task
                    </span>
                  </div>
                  <div class="project-members">
                    <div 
                      v-for="(member, index) in project.members?.slice(0, 3)" 
                      :key="member.id"
                      class="member-avatar small"
                      :style="{ zIndex: 10 - index }"
                    >
                      <img v-if="member.avatar" :src="member.avatar" :alt="member.name" />
                      <div v-else class="member-avatar-fallback">{{ getMemberInitials(member.name) }}</div>
                    </div>
                    <div v-if="project.members?.length > 3" class="member-count-more small">
                      +{{ project.members.length - 3 }}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Members Tab -->
          <div v-if="activeTab === 'members'" class="members-tab">
            <div class="members-list">
              <div 
                v-for="member in members" 
                :key="member.id"
                class="member-item"
              >
                <div class="member-avatar">
                  <img v-if="member.avatar" :src="member.avatar" :alt="member.name" />
                  <div v-else class="member-avatar-fallback">{{ getMemberInitials(member.name) }}</div>
                </div>
                <div class="member-info">
                  <h4 class="member-name">{{ member.name }}</h4>
                  <p class="member-email">{{ member.email }}</p>
                </div>
                <div class="member-role">
                  <span class="role-badge" :class="member.role?.toLowerCase()">
                    {{ member.role || 'Anggota' }}
                  </span>
                </div>
                <div class="member-actions">
                  <button class="btn-icon">
                    <font-awesome-icon icon="ellipsis-vertical" size="sm" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Activity Tab -->
          <div v-if="activeTab === 'activity'" class="activity-tab">
            <div v-if="activities.length === 0" class="empty-state">
              <font-awesome-icon icon="clock" size="3x" class="empty-icon" />
              <h3>Belum ada aktivitas terbaru</h3>
              <p>Aktivitas akan muncul di sini ketika anggota bekerja pada proyek</p>
            </div>
            <div v-else class="activity-list">
              <div 
                v-for="activity in activities" 
                :key="activity.id"
                class="activity-item"
              >
                <div class="activity-avatar">
                  <img v-if="activity.user?.avatar" :src="activity.user.avatar" :alt="activity.user.name" />
                  <div v-else class="activity-avatar-fallback">{{ getMemberInitials(activity.user?.name) }}</div>
                </div>
                <div class="activity-content">
                  <p class="activity-text">{{ activity.description }}</p>
                  <span class="activity-time">{{ formatDate(activity.created_at) }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Settings Tab -->
          <div v-if="activeTab === 'settings'" class="settings-tab">
            <div class="settings-section">
              <h3>Pengaturan Workspace</h3>
              <p>Kelola preferensi dan konfigurasi workspace</p>
              <!-- Settings form would go here -->
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Error State -->
    <div v-else class="error-state">
      <font-awesome-icon icon="exclamation-triangle" size="3x" class="error-icon" />
      <h3>Workspace tidak ditemukan</h3>
      <p>Workspace yang Anda cari tidak ada atau Anda tidak memiliki akses.</p>
      <router-link to="/dashboard" class="btn btn-primary">Kembali ke Dashboard</router-link>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { workspaceService } from '@/api/services/workspaceService';
import { projectService } from '@/api/services/projectService';
import { useAuthStore } from '@/stores/auth';
import { errorToast, successToast } from '@/utils/toast';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// Reactive data
const loading = ref(true);
const workspace = ref(null);
const projects = ref([]);
const members = ref([]);
const activities = ref([]);
const activeTab = ref('projects');
const showInviteModal = ref(false);
const showCreateProjectModal = ref(false);

// Load data on mount
onMounted(async () => {
  await loadWorkspace();
  loading.value = false;
});

// Load workspace data
const loadWorkspace = async () => {
  try {
    const workspaceSlug = route.params.workspaceSlug;
    
    // Load workspace details
    const workspaceResponse = await workspaceService.get(workspaceSlug);
    workspace.value = workspaceResponse.data.data;
    
    // Load projects
    await loadProjects(workspaceSlug);
    
    // Load members
    await loadMembers(workspaceSlug);
    
    // Load activities
    await loadActivities(workspaceSlug);
    
  } catch (error) {
    errorToast('Failed to load workspace');
    console.error('Error loading workspace:', error);
  }
};

// Load projects
const loadProjects = async (workspaceSlug) => {
  try {
    const response = await workspaceService.get(workspaceSlug);
    projects.value = response.data.data.projects || [];
  } catch (error) {
    console.error('Error loading projects:', error);
  }
};

// Load members
const loadMembers = async (workspaceSlug) => {
  try {
    const response = await workspaceService.get(workspaceSlug);
    members.value = response.data.data.members || [];
  } catch (error) {
    console.error('Error loading members:', error);
  }
};

// Load activities
const loadActivities = async (workspaceSlug) => {
  try {
    const response = await workspaceService.getWorkspaceActivities(workspaceSlug);
    activities.value = response.data.data || [];
  } catch (error) {
    console.error('Error loading activities:', error);
  }
};

// Helper functions
const getWorkspaceInitials = (name) => {
  return name?.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase() || 'WS';
};

const getMemberInitials = (name) => {
  return name?.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase() || 'U';
};

const calculateProgress = (project) => {
  const total = project.tasks_count || 0;
  const completed = project.completed_tasks_count || 0;
  return total > 0 ? Math.round((completed / total) * 100) : 0;
};

const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// Navigation
const goToProject = (project) => {
  router.push(`/workspaces/${route.params.workspaceSlug}/projects/${project.slug}`);
};

// Menu toggles
const toggleProjectMenu = (projectId) => {
  // Implement project menu logic
  console.log('Toggle project menu for:', projectId);
};
</script>

<style scoped>
.workspace-page {
  min-height: 100vh;
  background: var(--color-background);
  max-width: 1400px;
  margin: 0 auto;
  padding: 16px 24px; /* reduce top padding to bring content higher */
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

/* Workspace Container */
.workspace-container {
  width: 100%;
}

.workspace-content {
  width: 100%;
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

/* Workspace Header */
.workspace-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 24px;
  padding: 8px 0 8px; /* tighter vertical spacing */
  border-bottom: 1px solid var(--color-border);
}

.workspace-info {
  display: flex;
  align-items: flex-start;
  gap: 20px;
  flex: 1;
}

.workspace-avatar {
  width: 80px;
  height: 80px;
  border-radius: 16px;
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
  font-size: 28px;
  font-weight: 700;
}

.workspace-details {
  flex: 1;
}

.workspace-name {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 8px 0;
}

.workspace-description {
  font-size: 16px;
  color: var(--color-muted);
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.workspace-meta {
  display: flex;
  align-items: center;
  gap: 24px;
  flex-wrap: wrap;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-muted);
  font-size: 14px;
}

.meta-item svg {
  color: var(--color-primary-500);
}

.workspace-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

/* Workspace Navigation */
.workspace-nav {
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

/* Tab Content */
.tab-content {
  min-height: 400px;
}

/* Projects Tab */
.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 24px;
  margin-bottom: 32px;
}

.project-card {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.project-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0,0,0,0.1);
  border-color: var(--color-primary-200);
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
}

.project-name {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 4px 0;
}

.project-description {
  font-size: 14px;
  color: var(--color-muted);
  margin: 0;
  line-height: 1.4;
}

.project-menu {
  flex-shrink: 0;
}

.project-progress {
  margin-bottom: 16px;
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: var(--color-border);
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 8px;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary-500);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 12px;
  color: var(--color-muted);
}

.project-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.project-stats {
  display: flex;
  align-items: center;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-muted);
}

.stat-item svg {
  color: var(--color-primary-500);
}

.project-members {
  display: flex;
  align-items: center;
  gap: -8px;
}

.member-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid var(--color-background-soft);
  overflow: hidden;
  position: relative;
}

.member-avatar.small {
  width: 24px;
  height: 24px;
  margin-left: -8px;
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
  font-size: 10px;
  font-weight: 600;
}

.member-count-more {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-border);
  color: var(--color-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  border: 2px solid var(--color-background-soft);
}

.member-count-more.small {
  width: 24px;
  height: 24px;
  margin-left: -8px;
}

/* Members Tab */
.members-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.member-info {
  flex: 1;
}

.member-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 4px 0;
}

.member-email {
  font-size: 14px;
  color: var(--color-muted);
  margin: 0;
}

.member-role {
  margin-right: 16px;
}

.role-badge {
  padding: 4px 12px;
  border-radius: 20px;
  font-size: 12px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.role-badge.admin {
  background: var(--color-primary-100);
  color: var(--color-primary-700);
}

.role-badge.member {
  background: var(--color-border);
  color: var(--color-muted);
}

/* Activity Tab */
.activity-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.activity-item {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 12px;
}

.activity-avatar {
  width: 40px;
  height: 40px;
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
  font-size: 14px;
  font-weight: 600;
}

.activity-content {
  flex: 1;
}

.activity-text {
  font-size: 14px;
  color: var(--color-text);
  margin: 0 0 4px 0;
  line-height: 1.4;
}

.activity-time {
  font-size: 12px;
  color: var(--color-muted);
}

/* Settings Tab */
.settings-section {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 24px;
}

.settings-section h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 8px 0;
}

.settings-section p {
  font-size: 14px;
  color: var(--color-muted);
  margin: 0;
}

/* Empty State */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 64px 24px;
  text-align: center;
}

.empty-icon {
  color: var(--color-muted);
  margin-bottom: 24px;
}

.empty-state h3 {
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 8px 0;
}

.empty-state p {
  font-size: 14px;
  color: var(--color-muted);
  margin: 0 0 24px 0;
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
  width: 32px;
  height: 32px;
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
  .workspace-page {
    padding: 16px;
  }
  
  .workspace-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .workspace-actions {
    width: 100%;
    justify-content: flex-start;
  }

  .workspace-nav {
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  .nav-item {
    white-space: nowrap;
    flex-shrink: 0;
  }

  .project-grid {
    grid-template-columns: 1fr;
  }

  .member-item {
    flex-wrap: wrap;
    gap: 12px;
  }

  .workspace-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
}

@media (max-width: 480px) {
  .workspace-info {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .workspace-avatar {
    width: 60px;
    height: 60px;
  }

  .workspace-name {
    font-size: 24px;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
