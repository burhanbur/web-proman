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
      <!-- Tasks Section (Full width) -->
      <section class="tasks-section full-width">
        <div class="section-header">
          <h2 class="section-title">
            <font-awesome-icon icon="tasks" />
            Tugas
            <span class="section-count">{{ allTasks.length }}</span>
          </h2>
          <div class="section-actions">
            <!-- Workspace/Project Filter -->
            <div class="filter-dropdown">
              <select v-model="selectedTaskFilter" @change="loadTasks" class="filter-select">
                <option value="all">Semua Tugas</option>
                <optgroup v-if="workspaces.length > 0" label="Workspace">
                  <option v-for="workspace in workspaces" :key="workspace.id" :value="`workspace-${workspace.id}`">
                    {{ workspace.name }}
                  </option>
                </optgroup>
                <optgroup v-if="projects.length > 0" label="Project">
                  <option v-for="project in projects" :key="project.id" :value="`project-${project.id}`">
                    {{ project.name }}
                  </option>
                </optgroup>
              </select>
            </div>
            <!-- View Toggle -->
            <div class="view-toggle">
              <button 
                class="view-btn" 
                :class="{ active: currentView === 'kanban' }"
                @click="currentView = 'kanban'"
                title="Kanban View"
              >
                <font-awesome-icon icon="columns" />
              </button>
              <button 
                class="view-btn" 
                :class="{ active: currentView === 'list' }"
                @click="currentView = 'list'"
                title="List View"
              >
                <font-awesome-icon icon="list" />
              </button>
            </div>
            <button class="btn btn-secondary" @click="showCreateTaskModal = true">
              <font-awesome-icon icon="plus" />
              Buat Tugas
            </button>
          </div>
        </div>

        <!-- Empty State -->
        <div v-if="allTasks.length === 0" class="empty-state">
          <div class="empty-icon">
            <font-awesome-icon icon="tasks" size="3x" />
          </div>
          <h3>Belum ada tugas</h3>
          <p>Mulai dengan membuat tugas pertama Anda</p>
          <button class="btn btn-primary" @click="showCreateTaskModal = true">
            <font-awesome-icon icon="plus" />
            Buat Tugas Pertama
          </button>
        </div>

        <!-- Kanban View -->
        <div v-else-if="currentView === 'kanban'" class="kanban-view">
          <div class="kanban-board">
            <div 
              v-for="status in taskStatuses" 
              :key="status.id"
              class="kanban-column"
            >
              <div class="column-header">
                <div class="column-title">
                  <div class="status-indicator" :style="{ backgroundColor: status.color }"></div>
                  <span>{{ status.name }}</span>
                  <span class="task-count">{{ getTasksByStatus(status.id).length }}</span>
                </div>
                <button class="btn-icon" @click="addTask(status.id)">
                  <font-awesome-icon icon="plus" />
                </button>
              </div>
              
              <div class="column-content">
                <div 
                  v-for="task in getTasksByStatus(status.id)" 
                  :key="task.id"
                  class="task-card"
                  @click="openTaskDetail(task)"
                >
                  <div class="task-header">
                    <div class="task-priority" :class="`priority-${task.priority}`">
                      <font-awesome-icon 
                        :icon="getPriorityIcon(task.priority)" 
                        :class="`priority-${task.priority}`"
                      />
                    </div>
                    <button class="btn-icon small" @click.stop="toggleTaskMenu(task.id)">
                      <font-awesome-icon icon="ellipsis-h" />
                    </button>
                  </div>
                  
                  <h4 class="task-title">{{ task.title }}</h4>
                  <p v-if="task.description" class="task-description">{{ task.description }}</p>
                  
                  <div class="task-meta">
                    <div class="task-project">
                      <div class="project-color-dot" :style="{ backgroundColor: task.project?.color || '#17a2b8' }"></div>
                      <span>{{ task.project?.name }}</span>
                    </div>
                    
                    <div v-if="task.due_date" class="task-due-date" :class="{ overdue: isOverdue(task.due_date) }">
                      <font-awesome-icon icon="calendar" />
                      <span>{{ formatDate(task.due_date) }}</span>
                    </div>
                  </div>
                  
                  <div class="task-footer">
                    <div class="task-assignees">
                      <div 
                        v-for="assignee in task.assignees?.slice(0, 3)" 
                        :key="assignee.id"
                        class="assignee-avatar"
                        :title="assignee.name"
                      >
                        <img v-if="assignee.avatar" :src="assignee.avatar" :alt="assignee.name" />
                        <div v-else class="assignee-avatar-fallback">
                          {{ getMemberInitials(assignee.name) }}
                        </div>
                      </div>
                      <div v-if="task.assignees?.length > 3" class="assignee-count-more">
                        +{{ task.assignees.length - 3 }}
                      </div>
                    </div>
                    
                    <div class="task-stats">
                      <div v-if="task.comments_count" class="task-stat">
                        <font-awesome-icon icon="comment" />
                        <span>{{ task.comments_count }}</span>
                      </div>
                      <div v-if="task.attachments_count" class="task-stat">
                        <font-awesome-icon icon="paperclip" />
                        <span>{{ task.attachments_count }}</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <!-- Add Task Button in Column -->
                <button class="add-task-btn" @click="addTask(status.id)">
                  <font-awesome-icon icon="plus" />
                  Tambah Tugas
                </button>
              </div>
            </div>
          </div>
        </div>

        <!-- List View -->
        <div v-else-if="currentView === 'list'" class="list-view">
          <div class="list-header">
            <div class="list-header-row">
              <div class="column-name">Nama Tugas</div>
              <div class="column-status">Status</div>
              <div class="column-assignee">Assignee</div>
              <div class="column-priority">Prioritas</div>
              <div class="column-due-date">Deadline</div>
              <div class="column-project">Proyek</div>
              <div class="column-actions"></div>
            </div>
          </div>
          
          <div class="list-content">
            <div 
              v-for="task in allTasks" 
              :key="task.id"
              class="list-row"
              @click="openTaskDetail(task)"
            >
              <div class="column-name">
                <div class="task-priority-indicator" :class="`priority-${task.priority}`"></div>
                <div class="task-info">
                  <span class="task-title">{{ task.title }}</span>
                  <span v-if="task.description" class="task-description">{{ task.description }}</span>
                </div>
              </div>
              
              <div class="column-status">
                <div class="status-badge" :style="{ backgroundColor: getStatusColor(task.status) }">
                  {{ getStatusName(task.status) }}
                </div>
              </div>
              
              <div class="column-assignee">
                <div class="assignee-list">
                  <div 
                    v-for="assignee in task.assignees?.slice(0, 2)" 
                    :key="assignee.id"
                    class="assignee-avatar small"
                    :title="assignee.name"
                  >
                    <img v-if="assignee.avatar" :src="assignee.avatar" :alt="assignee.name" />
                    <div v-else class="assignee-avatar-fallback">
                      {{ getMemberInitials(assignee.name) }}
                    </div>
                  </div>
                  <span v-if="task.assignees?.length > 2" class="assignee-count">
                    +{{ task.assignees.length - 2 }}
                  </span>
                </div>
              </div>
              
              <div class="column-priority">
                <div class="priority-badge" :class="`priority-${task.priority}`">
                  <font-awesome-icon :icon="getPriorityIcon(task.priority)" />
                  {{ getPriorityName(task.priority) }}
                </div>
              </div>
              
              <div class="column-due-date">
                <span v-if="task.due_date" class="due-date" :class="{ overdue: isOverdue(task.due_date) }">
                  {{ formatDate(task.due_date) }}
                </span>
                <span v-else class="no-due-date">—</span>
              </div>
              
              <div class="column-project">
                <div class="project-info">
                  <div class="project-color-dot" :style="{ backgroundColor: task.project?.color || '#17a2b8' }"></div>
                  <span>{{ task.project?.name }}</span>
                </div>
              </div>
              
              <div class="column-actions">
                <button class="btn-icon small" @click.stop="toggleTaskMenu(task.id)">
                  <font-awesome-icon icon="ellipsis-h" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Two Column Layout for Workspaces/Projects and Activities -->
      <div class="dashboard-columns">
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

          <!-- Projects Section -->
          <section class="projects-section">
            <div class="section-header">
              <div class="section-title-group">
                <h2 class="section-title">
                  <font-awesome-icon icon="folder" class="section-icon" />
                  Proyek
                  <span v-if="selectedWorkspaceFilter && selectedWorkspaceFilter !== 'all'">
                    di {{ getWorkspaceName(selectedWorkspaceFilter) }}
                  </span>
                </h2>
                <span class="section-count">{{ filteredProjects.length }} proyek</span>
              </div>
              <div class="section-actions">
                <!-- Workspace Filter Dropdown -->
                <div class="workspace-filter-dropdown">
                  <select v-model="selectedWorkspaceFilter" @change="filterProjects" class="workspace-filter-select">
                    <option value="all">Semua Workspace</option>
                    <option v-for="workspace in workspaces" :key="workspace.id" :value="workspace.id">
                      {{ workspace.name }}
                    </option>
                  </select>
                </div>
                <button class="btn btn-primary" @click="showCreateProjectModal = true">
                  <font-awesome-icon icon="plus" />
                  Buat Proyek
                </button>
              </div>
            </div>

            <!-- Empty State -->
            <div v-if="filteredProjects.length === 0" class="empty-state projects-empty">
              <div class="empty-icon">
                <font-awesome-icon icon="folder-open" size="3x" />
              </div>
              <h3>Belum ada proyek</h3>
              <p v-if="selectedWorkspaceFilter === 'all'">
                Buat proyek pertama Anda
              </p>
              <p v-else>
                Belum ada proyek di workspace <strong>{{ getWorkspaceName(selectedWorkspaceFilter) }}</strong>
              </p>
              <button class="btn btn-primary" @click="showCreateProjectModal = true">
                <font-awesome-icon icon="plus" />
                Buat Proyek Pertama
              </button>
            </div>

            <!-- Projects Grid -->
            <div v-else class="projects-grid">
              <div 
                v-for="project in filteredProjects" 
                :key="project.id" 
                class="project-card"
                @click="goToProject(project)"
              >
                <!-- Project Header -->
                <div class="project-header">
                  <div class="project-title-group">
                    <div class="project-color-indicator" :style="{ backgroundColor: project.color }"></div>
                    <div class="project-title-info">
                      <h3 class="project-name">{{ project.name }}</h3>
                      <p class="project-description">{{ project.description || 'Tidak ada deskripsi' }}</p>
                      <div class="project-workspace-badge">
                        <font-awesome-icon icon="briefcase" />
                        {{ getWorkspaceName(project.workspace_id) }}
                      </div>
                    </div>
                  </div>
                  <div class="project-actions">
                    <button class="btn-icon" @click.stop="toggleProjectMenu(project.id)">
                      <font-awesome-icon icon="ellipsis-h" />
                    </button>
                  </div>
                </div>

                <!-- Project Progress -->
                <div class="project-progress-section">
                  <div class="progress-header">
                    <span class="progress-label">Progress</span>
                    <span class="progress-percentage">{{ calculateProgress(project) }}%</span>
                  </div>
                  <div class="progress-bar">
                    <div 
                      class="progress-fill" 
                      :style="{ 
                        width: calculateProgress(project) + '%',
                        backgroundColor: project.color 
                      }"
                    ></div>
                  </div>
                </div>

                <!-- Project Stats -->
                <div class="project-stats-section">
                  <div class="stats-grid">
                    <div class="stat-item">
                      <div class="stat-icon">
                        <font-awesome-icon icon="tasks" />
                      </div>
                      <div class="stat-content">
                        <span class="stat-number">{{ project.tasks_count || 0 }}</span>
                        <span class="stat-label">Total Tasks</span>
                      </div>
                    </div>
                    <div class="stat-item">
                      <div class="stat-icon completed">
                        <font-awesome-icon icon="check-circle" />
                      </div>
                      <div class="stat-content">
                        <span class="stat-number">{{ project.completed_tasks_count || 0 }}</span>
                        <span class="stat-label">Completed</span>
                      </div>
                    </div>
                  </div>
                </div>

                <!-- Project Footer -->
                <div class="project-footer">
                  <div class="project-members">
                    <span class="members-label">Team</span>
                    <div class="member-avatars">
                      <div 
                        v-for="(member, index) in project.members?.slice(0, 3)" 
                        :key="member.id"
                        class="member-avatar" 
                        :style="{ zIndex: 3 - index }"
                        :title="member.name"
                      >
                        <img v-if="member.avatar" :src="member.avatar" :alt="member.name" />
                        <div v-else class="member-avatar-fallback">
                          {{ getMemberInitials(member.name) }}
                        </div>
                      </div>
                      <div v-if="project.members?.length > 3" class="member-count-more">
                        +{{ project.members.length - 3 }}
                      </div>
                    </div>
                  </div>
                  <div class="project-updated">
                    {{ formatDate(project.updated_at) }}
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
const allProjects = ref([]); // Store all projects for filtering
const selectedWorkspaceFilter = ref('all'); // Filter for projects section
const recentActivities = ref([]);
const recentTasks = ref([]);
const showCreateWorkspaceModal = ref(false);
const showCreateProjectModal = ref(false);
const showCreateTaskModal = ref(false);

// View state
const currentView = ref('kanban'); // 'kanban' or 'list'

// Task filter
const selectedTaskFilter = ref('all'); // 'all', 'workspace-{id}', 'project-{id}'

// Task data
const allTasks = ref([]);
const taskStatuses = ref([
  { id: 'todo', name: 'To Do', color: '#6c757d' },
  { id: 'in_progress', name: 'In Progress', color: '#17a2b8' },
  { id: 'review', name: 'In Review', color: '#ffc107' },
  { id: 'done', name: 'Done', color: '#28a745' }
]);

// Load data on mount
onMounted(async () => {
  await loadWorkspaces();
  await loadAllProjects(); // Load all projects instead of workspace-specific
  await loadRecentActivities();
  await loadRecentTasks();
  await loadTasks();
  loading.value = false;
});

// Computed property for filtered projects
const filteredProjects = computed(() => {
  if (selectedWorkspaceFilter.value === 'all') {
    return allProjects.value;
  }
  return allProjects.value.filter(project => project.workspace_id === selectedWorkspaceFilter.value);
});

// Load workspaces
const loadWorkspaces = async () => {
  try {
    const response = await workspaceService.list();
    workspaces.value = response.data.data || [];
    
    // Auto-select first workspace if available (for workspace cards display)
    if (workspaces.value.length > 0 && !selectedWorkspace.value) {
      selectedWorkspace.value = workspaces.value[0];
      await loadProjects(workspaces.value[0].slug);
    }
  } catch (error) {
    errorToast('Gagal memuat workspace');
    console.error('Error loading workspaces:', error);
  }
};

// Load all projects from all workspaces
const loadAllProjects = async () => {
  try {
    // Mock data for all projects with workspace information
    const mockAllProjects = [
      {
        id: 1,
        name: 'API Integration System',
        description: 'Sistem integrasi API untuk menghubungkan berbagai aplikasi internal.',
        color: '#17a2b8',
        workspace_id: 1,
        tasks_count: 8,
        completed_tasks_count: 3,
        members: [
          { id: 1, name: 'John Doe', avatar: null },
          { id: 2, name: 'Jane Smith', avatar: null },
          { id: 3, name: 'Mike Johnson', avatar: null }
        ],
        updated_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        name: 'Mobile App ProMan',
        description: 'Aplikasi mobile untuk project management yang user-friendly.',
        color: '#28a745',
        workspace_id: 2,
        tasks_count: 12,
        completed_tasks_count: 8,
        members: [
          { id: 4, name: 'Sarah Wilson', avatar: null },
          { id: 5, name: 'Alex Brown', avatar: null }
        ],
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 3,
        name: 'Website Official Universitas',
        description: 'Website resmi universitas dengan CMS yang modern.',
        color: '#ffc107',
        workspace_id: 3,
        tasks_count: 15,
        completed_tasks_count: 15,
        members: [
          { id: 6, name: 'Lisa Davis', avatar: null }
        ],
        updated_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 4,
        name: 'Audit Sistem Keamanan',
        description: 'Audit menyeluruh terhadap sistem keamanan aplikasi dan infrastruktur.',
        color: '#dc3545',
        workspace_id: 1,
        tasks_count: 0,
        completed_tasks_count: 0,
        members: [
          { id: 1, name: 'John Doe', avatar: null }
        ],
        updated_at: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];
    
    allProjects.value = mockAllProjects;
  } catch (error) {
    errorToast('Gagal memuat proyek');
    console.error('Error loading all projects:', error);
  }
};

// Select workspace and load its projects
const selectWorkspace = async (workspace) => {
  selectedWorkspace.value = workspace;
  await loadProjects(workspace.slug);
  // Load projects to update filter dropdown
  await loadTasks();
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

// Load tasks for kanban and list view
const loadTasks = async (filterValue = null) => {
  try {
    // This would be an API call to taskService.list()
    // For now, using mock data based on filter
    const filter = filterValue || selectedTaskFilter.value;
    
    // Mock data for all tasks
    const mockTasks = [
      {
        id: 1,
        title: 'Setup Database Schema',
        description: 'Create database tables and relationships for the project management system',
        status: 'todo',
        priority: 'high',
        due_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString(),
        project: { id: 1, name: 'API Integration System', color: '#17a2b8', workspace_id: 1 },
        workspace_id: 1,
        assignees: [
          { id: 1, name: 'John Doe', avatar: null },
          { id: 2, name: 'Jane Smith', avatar: null }
        ],
        comments_count: 3,
        attachments_count: 1,
        created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 2,
        title: 'Design User Interface',
        description: 'Create wireframes and mockups for the dashboard',
        status: 'in_progress',
        priority: 'medium',
        due_date: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        project: { id: 2, name: 'Mobile App ProMan', color: '#28a745', workspace_id: 2 },
        workspace_id: 2,
        assignees: [
          { id: 3, name: 'Mike Johnson', avatar: null }
        ],
        comments_count: 7,
        attachments_count: 2,
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 3,
        title: 'API Documentation',
        description: 'Write comprehensive API documentation using Swagger',
        status: 'review',
        priority: 'low',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        project: { id: 1, name: 'API Integration System', color: '#17a2b8', workspace_id: 1 },
        workspace_id: 1,
        assignees: [
          { id: 4, name: 'Sarah Wilson', avatar: null },
          { id: 5, name: 'Alex Brown', avatar: null }
        ],
        comments_count: 2,
        attachments_count: 0,
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 4,
        title: 'Unit Testing',
        description: 'Write unit tests for core functionality',
        status: 'done',
        priority: 'medium',
        due_date: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        project: { id: 3, name: 'Website Official', color: '#ffc107', workspace_id: 3 },
        workspace_id: 3,
        assignees: [
          { id: 6, name: 'Lisa Davis', avatar: null }
        ],
        comments_count: 5,
        attachments_count: 3,
        created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 5,
        title: 'Performance Optimization',
        description: 'Optimize database queries and improve response times',
        status: 'todo',
        priority: 'high',
        due_date: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
        project: { id: 1, name: 'API Integration System', color: '#17a2b8', workspace_id: 1 },
        workspace_id: 1,
        assignees: [
          { id: 1, name: 'John Doe', avatar: null },
          { id: 3, name: 'Mike Johnson', avatar: null },
          { id: 4, name: 'Sarah Wilson', avatar: null }
        ],
        comments_count: 1,
        attachments_count: 0,
        created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 6,
        title: 'User Authentication',
        description: 'Implement JWT authentication system',
        status: 'in_progress',
        priority: 'high',
        due_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        project: { id: 2, name: 'Mobile App ProMan', color: '#28a745', workspace_id: 2 },
        workspace_id: 2,
        assignees: [
          { id: 2, name: 'Jane Smith', avatar: null }
        ],
        comments_count: 4,
        attachments_count: 1,
        created_at: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Filter tasks based on selection
    if (filter === 'all') {
      allTasks.value = mockTasks;
    } else if (filter.startsWith('workspace-')) {
      const workspaceId = parseInt(filter.split('-')[1]);
      allTasks.value = mockTasks.filter(task => task.workspace_id === workspaceId);
    } else if (filter.startsWith('project-')) {
      const projectId = parseInt(filter.split('-')[1]);
      allTasks.value = mockTasks.filter(task => task.project.id === projectId);
    }
  } catch (error) {
    console.error('Error loading tasks:', error);
  }
};

// Task management functions
const getTasksByStatus = (statusId) => {
  return allTasks.value.filter(task => task.status === statusId);
};

const getStatusColor = (statusId) => {
  const status = taskStatuses.value.find(s => s.id === statusId);
  return status?.color || '#6c757d';
};

const getStatusName = (statusId) => {
  const status = taskStatuses.value.find(s => s.id === statusId);
  return status?.name || 'Unknown';
};

const getPriorityIcon = (priority) => {
  switch (priority) {
    case 'high': return 'arrow-up';
    case 'medium': return 'minus';
    case 'low': return 'arrow-down';
    default: return 'minus';
  }
};

const getPriorityName = (priority) => {
  switch (priority) {
    case 'high': return 'Tinggi';
    case 'medium': return 'Sedang';
    case 'low': return 'Rendah';
    default: return 'Sedang';
  }
};

const isOverdue = (dueDate) => {
  if (!dueDate) return false;
  return new Date(dueDate) < new Date();
};

// Task actions
const addTask = (statusId) => {
  console.log('Add task to status:', statusId);
  // Implementation for adding task
};

const openTaskDetail = (task) => {
  console.log('Open task detail:', task);
  // Implementation for opening task detail
};

const toggleTaskMenu = (taskId) => {
  console.log('Toggle task menu:', taskId);
  // Implementation for task menu
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

const getWorkspaceName = (workspaceId) => {
  if (!workspaceId) return 'Unknown Workspace';
  const workspace = workspaces.value.find(w => w.id === workspaceId);
  return workspace?.name || 'Unknown Workspace';
};

const filterProjects = () => {
  // This function is called when workspace filter changes
  // The actual filtering is handled by the computed property
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
  const workspace = workspaces.value.find(w => w.id === project.workspace_id);
  if (workspace) {
    router.push(`/workspaces/${workspace.slug}/projects/${project.slug}`);
  }
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
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.dashboard-columns {
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

/* Tasks Section Full Width */
.tasks-section.full-width {
  width: 100%;
  margin-bottom: 16px;
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
.tasks-section {
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
  align-items: center;
}

/* Workspace Filter Dropdown */
.workspace-filter-dropdown {
  position: relative;
}

.workspace-filter-select {
  background: var(--bg-0);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 8px 12px;
  font-size: 14px;
  color: var(--text-color);
  cursor: pointer;
  min-width: 200px;
  outline: none;
  transition: all 0.2s ease;
}

.workspace-filter-select:focus {
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(23, 162, 184, 0.1);
}

.workspace-filter-select option {
  background: var(--bg-0);
  color: var(--text-color);
  padding: 8px;
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

/* Projects Section */
.projects-section {
  margin-bottom: 48px;
}

.section-title-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.section-icon {
  color: var(--color-primary-500);
}

/* Projects Grid */
.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 24px;
}

.project-card {
  background: var(--bg-0);
  border: 1px solid var(--border-color);
  border-radius: 12px;
  padding: 24px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.project-card:hover {
  border-color: var(--color-primary-500);
  box-shadow: 0 8px 32px rgba(23, 162, 184, 0.12);
  transform: translateY(-2px);
}

.project-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: linear-gradient(90deg, var(--color-primary-500), var(--color-primary-400));
  opacity: 0;
  transition: opacity 0.3s ease;
}

.project-card:hover::before {
  opacity: 1;
}

/* Project Header */
.project-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 20px;
}

.project-title-group {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  flex: 1;
}

.project-color-indicator {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
  margin-top: 6px;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.8);
}

.project-title-info {
  flex: 1;
  min-width: 0;
}

.project-name {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-color);
  margin: 0 0 6px 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: 1.3;
}

.project-description {
  color: var(--color-muted);
  font-size: 14px;
  margin: 0 0 8px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.project-workspace-badge {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: rgba(23, 162, 184, 0.1);
  color: var(--color-primary-600);
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
}

.project-workspace-badge svg {
  width: 10px;
  height: 10px;
}

.project-actions {
  flex-shrink: 0;
}

/* Project Progress */
.project-progress-section {
  margin-bottom: 20px;
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 6px;
}

.progress-label {
  font-size: 12px;
  color: var(--color-muted);
  font-weight: 500;
}

.progress-percentage {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-color);
}

.progress-bar {
  width: 100%;
  height: 6px;
  background: var(--border-color);
  border-radius: 3px;
  overflow: hidden;
}

.progress-fill {
  height: 100%;
  background: var(--color-primary-500);
  transition: width 0.4s ease;
  border-radius: 3px;
}

/* Project Stats */
.project-stats-section {
  margin-bottom: 20px;
}

.stats-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.stat-item {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px;
  background: var(--bg-1);
  border-radius: 8px;
  transition: all 0.2s ease;
}

.stat-item:hover {
  background: var(--border-color);
}

.stat-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--color-primary-100);
  color: var(--color-primary-600);
  border-radius: 6px;
  flex-shrink: 0;
}

.stat-icon.completed {
  background: var(--color-success-100);
  color: var(--color-success-600);
}

.stat-content {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.stat-number {
  font-size: 18px;
  font-weight: 700;
  color: var(--text-color);
  line-height: 1;
}

.stat-label {
  font-size: 12px;
  color: var(--color-muted);
  font-weight: 500;
}

/* Project Footer */
.project-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 12px;
  border-top: 1px solid var(--border-color);
}

.project-members {
  display: flex;
  align-items: center;
  gap: 6px;
}

.members-label {
  font-size: 11px;
  color: var(--color-muted);
  font-weight: 500;
}

.member-avatars {
  display: flex;
  align-items: center;
  gap: -6px;
}

.member-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid var(--bg-0);
  overflow: hidden;
  margin-left: -6px;
  transition: transform 0.2s ease;
}

.member-avatar:first-child {
  margin-left: 0;
}

.member-avatar:hover {
  transform: scale(1.1);
  z-index: 10;
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
  font-size: 10px;
}

.member-count-more {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--border-color);
  color: var(--color-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 9px;
  font-weight: 600;
  margin-left: -6px;
  border: 2px solid var(--bg-0);
}

.project-updated {
  font-size: 11px;
  color: var(--color-muted);
}

/* Empty State for Projects */
.projects-empty {
  padding: 48px 32px;
}

.projects-empty .empty-icon {
  color: var(--color-primary-200);
  margin-bottom: 16px;
}

.projects-empty h3 {
  color: var(--text-color);
  margin: 0 0 8px 0;
  font-size: 20px;
}

.projects-empty p {
  margin: 0 0 24px 0;
  color: var(--color-muted);
}

.projects-empty p strong {
  color: var(--color-primary-600);
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

/* View Toggle */
.view-toggle {
  display: flex;
  background: var(--bg-1);
  border-radius: 6px;
  padding: 2px;
  margin-right: 12px;
}

.view-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 32px;
  border: none;
  background: transparent;
  border-radius: 4px;
  cursor: pointer;
  color: var(--color-muted);
  transition: all 0.2s ease;
}

.view-btn:hover {
  color: var(--text-color);
}

.view-btn.active {
  background: var(--color-primary-500);
  color: white;
}

/* Filter Dropdown */
.filter-dropdown {
  margin-right: 12px;
}

.filter-select {
  background: var(--bg-0);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 6px 12px;
  font-size: 14px;
  color: var(--text-color);
  cursor: pointer;
  min-width: 200px;
  outline: none;
  transition: all 0.2s ease;
}

.filter-select:focus {
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(23, 162, 184, 0.1);
}

.filter-select option {
  background: var(--bg-0);
  color: var(--text-color);
  padding: 8px;
}

.filter-select optgroup {
  background: var(--bg-1);
  color: var(--color-muted);
  font-weight: 600;
  padding: 4px 8px;
}

/* Kanban View */
.kanban-view {
  overflow-x: auto;
  padding-bottom: 16px;
}

.kanban-board {
  display: flex;
  gap: 20px;
  min-width: fit-content;
  padding: 4px;
}

.kanban-column {
  width: 300px;
  background: var(--bg-1);
  border-radius: 8px;
  padding: 16px;
  flex-shrink: 0;
}

.column-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color);
}

.column-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
}

.status-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.task-count {
  background: var(--border-color);
  color: var(--color-muted);
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: 500;
}

.column-content {
  display: flex;
  flex-direction: column;
  gap: 12px;
  min-height: 200px;
}

/* Task Card */
.task-card {
  background: var(--bg-0);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.task-card:hover {
  border-color: var(--color-primary-500);
  box-shadow: 0 2px 8px rgba(23, 162, 184, 0.1);
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.task-priority {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 20px;
  height: 20px;
}

.priority-high {
  color: #dc3545;
}

.priority-medium {
  color: #ffc107;
}

.priority-low {
  color: #28a745;
}

.task-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-color);
  margin: 0 0 8px 0;
  line-height: 1.4;
}

.task-description {
  font-size: 12px;
  color: var(--color-muted);
  margin: 0 0 12px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
}

.task-meta {
  margin-bottom: 12px;
}

.task-project {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-muted);
  margin-bottom: 6px;
}

.project-color-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.task-due-date {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--color-muted);
}

.task-due-date.overdue {
  color: #dc3545;
}

.task-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  border: 2px solid var(--bg-0);
  overflow: hidden;
  margin-left: -6px;
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
  font-weight: 600;
  font-size: 10px;
}

.assignee-count-more {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: var(--border-color);
  color: var(--color-muted);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 600;
  margin-left: -6px;
  border: 2px solid var(--bg-0);
}

.task-stats {
  display: flex;
  gap: 8px;
}

.task-stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: var(--color-muted);
}

.add-task-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 12px;
  border: 1px dashed var(--border-color);
  background: transparent;
  border-radius: 6px;
  color: var(--color-muted);
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
}

.add-task-btn:hover {
  border-color: var(--color-primary-500);
  color: var(--color-primary-500);
  background: rgba(23, 162, 184, 0.05);
}

/* List View */
.list-view {
  background: var(--bg-0);
  border: 1px solid var(--border-color);
  border-radius: 8px;
  overflow: hidden;
}

.list-header {
  background: var(--bg-1);
  border-bottom: 1px solid var(--border-color);
  padding: 0 16px;
}

.list-header-row {
  display: grid;
  grid-template-columns: 2fr 120px 120px 100px 120px 150px 40px;
  gap: 16px;
  align-items: center;
  height: 48px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-muted);
}

.list-content {
  max-height: 600px;
  overflow-y: auto;
}

.list-row {
  display: grid;
  grid-template-columns: 2fr 120px 120px 100px 120px 150px 40px;
  gap: 16px;
  align-items: center;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  cursor: pointer;
  transition: background 0.2s ease;
}

.list-row:hover {
  background: var(--bg-1);
}

.list-row:last-child {
  border-bottom: none;
}

.column-name {
  display: flex;
  align-items: center;
  gap: 8px;
}

.task-priority-indicator {
  width: 8px;
  height: 8px;
  border-radius: 50%;
}

.task-priority-indicator.priority-high {
  background: #dc3545;
}

.task-priority-indicator.priority-medium {
  background: #ffc107;
}

.task-priority-indicator.priority-low {
  background: #28a745;
}

.task-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.list-row .task-title {
  font-size: 14px;
  font-weight: 500;
  color: var(--text-color);
  margin: 0;
}

.list-row .task-description {
  font-size: 12px;
  color: var(--color-muted);
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  color: white;
}

.assignee-list {
  display: flex;
  align-items: center;
  gap: 4px;
}

.assignee-list .assignee-avatar {
  width: 20px;
  height: 20px;
  margin-left: 0;
}

.assignee-count {
  font-size: 11px;
  color: var(--color-muted);
}

.priority-badge {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 500;
}

.due-date {
  font-size: 12px;
  color: var(--color-muted);
}

.due-date.overdue {
  color: #dc3545;
  font-weight: 500;
}

.no-due-date {
  font-size: 12px;
  color: var(--color-muted);
}

.project-info {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--color-muted);
}

.btn-icon.small {
  width: 24px;
  height: 24px;
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
  .dashboard-columns {
    grid-template-columns: 1fr;
    gap: 24px;
  }
  
  .dashboard-right {
    position: static;
    order: -1; /* Show activity first on mobile */
  }

  .projects-grid {
    grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
    gap: 20px;
  }

  .kanban-board {
    gap: 16px;
  }

  .kanban-column {
    width: 280px;
  }

  .list-header-row,
  .list-row {
    grid-template-columns: 2fr 100px 100px 80px 100px 120px 40px;
    gap: 12px;
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

  .workspace-grid {
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

  .section-actions {
    width: 100%;
    flex-direction: column;
    align-items: stretch;
    gap: 8px;
  }

  .workspace-filter-select {
    min-width: auto;
    width: 100%;
  }

  .projects-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .project-card {
    padding: 20px;
  }

  .stats-grid {
    gap: 12px;
  }

  .stat-item {
    padding: 10px;
  }

  .stat-icon {
    width: 28px;
    height: 28px;
  }

  .stat-number {
    font-size: 16px;
  }

  .kanban-column {
    width: 260px;
  }

  .list-view {
    overflow-x: auto;
  }

  .list-header-row,
  .list-row {
    grid-template-columns: 200px 80px 80px 60px 80px 100px 30px;
    gap: 8px;
    font-size: 12px;
  }

  .list-header-row {
    height: 40px;
  }

  .list-row {
    padding: 8px 12px;
  }

  .view-toggle {
    margin-right: 8px;
  }

  .view-btn {
    width: 32px;
    height: 28px;
  }
}

@media (max-width: 480px) {
  .project-footer {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .project-members {
    width: 100%;
    justify-content: space-between;
  }

  .member-avatar {
    width: 20px;
    height: 20px;
  }

  .member-count-more {
    width: 20px;
    height: 20px;
    font-size: 8px;
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