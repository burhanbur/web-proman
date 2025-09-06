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
              <select v-model="selectedTaskFilter" @change="onFilterChange" class="filter-select">
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
          <div :class="['kanban-board', boardColumnsClass]">
            <div 
              v-for="priority in taskPriorities" 
              :key="priority.id"
              class="kanban-column"
            >
              <div class="column-header">
                <div class="column-title">
                  <div class="status-indicator" :style="{ backgroundColor: priority.color }"></div>
                  <span>{{ getPriorityName(priority.name) || priority.name }}</span>
                  <span class="task-count">{{ getTasksByPriority(priority.id).length }}</span>
                </div>
                <button class="btn-icon" @click="addTask(priority.id)">
                  <font-awesome-icon icon="plus" />
                </button>
              </div>
              
              <div class="column-content">
                <div 
                  v-for="task in getTasksByPriority(priority.id)" 
                  :key="task.id"
                  class="task-card"
                  @click="openTaskDetail(task)"
                >
                  <div class="task-header">
                    <div class="task-priority" :class="`priority-${slugify(task.priority_raw?.name)}`">
                      <font-awesome-icon 
                        :icon="getPriorityIcon(task.priority_raw?.name)" 
                        :class="`priority-${slugify(task.priority_raw?.name)}`"
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
                      <!-- compact point badge -->
                      <div v-if="task.point !== null && task.point !== undefined" class="task-stat task-point-badge" :title="`Point: ${task.point}`">
                        <font-awesome-icon icon="star" />
                        <span>{{ task.point }}</span>
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

        <!-- List View as table with server-side features -->
        <div v-else-if="currentView === 'list'" class="list-view">
          <!-- Table Controls -->
          <div class="table-controls">
            <div class="table-controls-left">
              <div class="per-page-selector">
                <label>Tampilkan</label>
                <select v-model="listParams.per_page" @change="loadListTasks" class="per-page-select">
                  <option value="5">5</option>
                  <option value="10">10</option>
                  <option value="25">25</option>
                  <option value="50">50</option>
                </select>
                <span>entri</span>
              </div>
            </div>
            <div class="table-controls-right">
              <div class="search-box">
                <div class="search-input-wrapper">
                  <font-awesome-icon icon="search" class="search-icon" />
                  <input 
                    v-model="listParams.search" 
                    @input="debounceSearch"
                    type="text" 
                    placeholder="Cari tugas..." 
                    class="search-input"
                  />
                  <button 
                    v-if="listParams.search" 
                    @click="clearSearch" 
                    class="clear-search-btn"
                  >
                    <font-awesome-icon icon="times" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Table -->
          <div class="table-wrapper">
            <table class="tasks-table">
              <thead>
                <tr>
                  <th class="th-name">Nama Tugas</th>
                  <th class="th-status">Status</th>
                  <th class="th-assignee">Assignee</th>
                  <th class="th-priority">Prioritas</th>
                  <th class="th-due">Deadline</th>
                  <th class="th-project">Proyek</th>
                  <th class="th-actions"></th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="listLoading" class="loading-row">
                  <td colspan="7" class="text-center">
                    <div class="table-loading">
                      <div class="loading-spinner small"></div>
                      <span>Memuat data...</span>
                    </div>
                  </td>
                </tr>
                <tr v-else-if="listTasks.length === 0" class="empty-row">
                  <td colspan="7" class="text-center">
                    <div class="table-empty">
                      <font-awesome-icon icon="inbox" size="2x" />
                      <p>{{ listParams.search ? 'Tidak ada tugas yang ditemukan' : 'Belum ada tugas' }}</p>
                    </div>
                  </td>
                </tr>
                <tr v-else v-for="task in listTasks" :key="task.id" class="table-row" @click="openTaskDetail(task)">
                  <td class="td-name">
                    <div class="task-row-name">
                      <div class="task-info">
                        <div class="task-title">{{ task.title }}</div>
                        <div v-if="task.description" class="task-description">{{ task.description }}</div>
                      </div>
                    </div>
                  </td>

                  <td class="td-status">
                    <div class="status-badge" :style="{ backgroundColor: task.status_raw?.color }">{{ task.status_raw?.name }}</div>
                  </td>

                  <td class="td-assignee">
                    <div class="assignee-list">
                      <div v-for="assignee in task.assignees?.slice(0, 3)" :key="assignee.id" class="assignee-avatar small" :title="assignee.name">
                        <img v-if="assignee.avatar" :src="assignee.avatar" :alt="assignee.name" />
                        <div v-else class="assignee-avatar-fallback">{{ getMemberInitials(assignee.name) }}</div>
                      </div>
                      <span v-if="task.assignees?.length > 3" class="assignee-count">+{{ task.assignees.length - 3 }}</span>
                    </div>
                  </td>

                  <td class="td-priority">
                    <div class="priority-badge" :class="`priority-${slugify(task.priority_raw?.name)}`">
                      <font-awesome-icon :icon="getPriorityIcon(task.priority_raw?.name)" />
                      {{ getPriorityName(task.priority_raw?.name) }}
                      <span v-if="task.point !== null && task.point !== undefined" class="list-point-badge" :title="`Point: ${task.point}`">{{ task.point }}</span>
                    </div>
                  </td>

                  <td class="td-due">
                    <div v-if="task.due_date" :class="{ overdue: isOverdue(task.due_date) }">{{ formatDate(task.due_date) }}</div>
                    <div v-else class="no-due-date">—</div>
                  </td>

                  <td class="td-project">
                    <div class="project-info">
                      <!-- <div class="project-color-dot" :style="{ backgroundColor: task.project?.color || '#17a2b8' }"></div> -->
                      <span>{{ task.project?.name }}</span>
                    </div>
                  </td>

                  <td class="td-actions">
                    <button class="btn-icon small" @click.stop="toggleTaskMenu(task.id)">
                      <font-awesome-icon icon="ellipsis-h" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="table-pagination" v-if="!listLoading">
            <div class="pagination-info">
              <span>
                Menampilkan {{ listMeta.from || 0 }} sampai {{ listMeta.to || 0 }} 
                dari {{ listMeta.total || 0 }} entri
                <span v-if="listParams.search"> (difilter dari total entri)</span>
              </span>
            </div>
            <div class="pagination-controls" v-if="listMeta.last_page > 1">
              <button 
                :disabled="listMeta.current_page <= 1" 
                @click="changePage(listMeta.current_page - 1)"
                class="pagination-btn"
              >
                <font-awesome-icon icon="chevron-left" />
                Sebelumnya
              </button>
              
              <div class="pagination-pages">
                <button 
                  v-for="page in visiblePages" 
                  :key="page"
                  :class="['pagination-page', { active: page === listMeta.current_page, disabled: page === '...' }]"
                  @click="page !== '...' && changePage(page)"
                  :disabled="page === '...'"
                >
                  {{ page }}
                </button>
              </div>

              <button 
                :disabled="listMeta.current_page >= listMeta.last_page" 
                @click="changePage(listMeta.current_page + 1)"
                class="pagination-btn"
              >
                Berikutnya
                <font-awesome-icon icon="chevron-right" />
              </button>
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
                  <span>{{ workspace.project_count || 0 }} Proyek</span>
                </div>
                <div class="stat-item">
                  <font-awesome-icon icon="users" />
                  <span>{{ workspace.member_count || 0 }} Anggota</span>
                </div>
                <div class="stat-item">
                  <font-awesome-icon icon="tasks" />
                  <span>{{ workspace.task_count || 0 }} Tugas</span>
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
                    <div class="project-color-indicator" :style="{ backgroundColor: project.color || '#17a2b8' }"></div>
                    <div class="project-title-info">
                      <h3 class="project-name">{{ project.name }}</h3>
                      <p class="project-description">{{ project.description || 'Tidak ada deskripsi' }}</p>
                      <div class="project-workspace-badge">
                        <font-awesome-icon icon="briefcase" />
                        {{ getWorkspaceName(project.workspace?.id) }}
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
                        <span class="stat-label">Total Tugas</span>
                      </div>
                    </div>
                    <div class="stat-item">
                      <div class="stat-icon completed">
                        <font-awesome-icon icon="check-circle" />
                      </div>
                      <div class="stat-content">
                        <span class="stat-number">{{ project.completed_tasks_count || 0 }}</span>
                        <span class="stat-label">Selesai</span>
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
                        :title="member.user_name"
                      >
                        <img v-if="member.avatar" :src="member.avatar" :alt="member.user_name" />
                        <div v-else class="member-avatar-fallback">
                          {{ getMemberInitials(member.user_name) }}
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
import { priorityService } from '@/api/services/priorityService';
import { taskService } from '@/api/services/taskService';
import { useAuthStore } from '@/stores/auth';
import { auditLogsService } from '@/api/services/auditLogsService';
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
const taskPriorities = ref([]);

// List view datatable data
const listTasks = ref([]);
const listLoading = ref(false);
const listParams = ref({
  page: 1,
  per_page: 10,
  search: '',
  sort: 'created_at',
  order: 'desc'
});
const listMeta = ref({
  current_page: 1,
  last_page: 1,
  per_page: 10,
  total: 0,
  from: 0,
  to: 0
});

// Search debounce
let searchTimeout = null;

// Load priorities from API and map to taskPriorities shape
const loadPriorities = async () => {
  try {
    const res = await priorityService.list();
    const priorities = res.data.data || res.data || [];
    // Map to expected local shape
    taskPriorities.value = priorities.map(p => ({ id: p.code || p.id || p.name, name: p.name, color: p.color || '#6c757d' }));
  } catch (error) {
    console.error('Error loading priorities:', error);
  }
};

// Load data on mount
onMounted(async () => {
  await loadWorkspaces();
  await loadAllProjects(); // Load all projects instead of workspace-specific
  await loadPriorities();
  await loadRecentActivities();
  await loadRecentTasks();
  await loadTasks();
  await loadListTasks(); // Load list tasks for datatable
  loading.value = false;
});

// Computed property for filtered projects
// Accepts projects that may store workspace id in different shapes
const filteredProjects = computed(() => {
  const filter = selectedWorkspaceFilter.value;
  if (filter === 'all') return allProjects.value;

  // normalize filter to string for loose comparison (handles number/string)
  const filterStr = String(filter);

  return allProjects.value.filter(project => {
    const wid = project.workspace_id ?? project.workspace?.id ?? project.workspace?.workspace_id ?? project.workspace ?? null;
    return wid !== null && String(wid) === filterStr;
  });
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
    const response = await projectService.list();
    // Expecting API to return { data: [...] } pattern
    allProjects.value = response.data.data || response.data || [];
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

// Called when user changes workspace/project filter in the UI
const onFilterChange = async () => {
  // Refresh kanban source
  await loadTasks();
  // Reset list page and reload list view as well
  listParams.value.page = 1;
  await loadListTasks();
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
    const res = await auditLogsService.list({ limit: 6 });
    const items = res.data.data || res.data || [];
    // Map audit log entries to recentActivities shape
    recentActivities.value = items.map(item => ({
      id: item.id || item.uuid || Math.random().toString(36).substr(2, 9),
      user: { name: item.user.name || item.user?.name || (item.user_id ? `User ${item.user_id}` : 'User'), 
      avatar: item.user?.avatar || null },
      description: item.message || `${item.action} ${item.model_type || ''}`,
      created_at: item.created_at || item.createdAt || item.timestamp || new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error loading activities:', error);
    // fallback to empty
    recentActivities.value = [];
  }
};

// Load recent tasks (shows on the right column above activities)
const loadRecentTasks = async () => {
  try {
    const res = await taskService.recent({ limit: 5 });
    const items = res.data.data || res.data || [];
    recentTasks.value = items.map(item => ({
      id: item.id || item.uuid || Math.random().toString(36).substr(2, 9),
      title: item.title || item.name || 'Untitled',
      point: item.point ?? item.points ?? null,
      project: item.project || item.project_data || null,
      updated_at: item.updated_at || item.updatedAt || item.created_at || new Date().toISOString()
    }));
  } catch (error) {
    console.error('Error loading recent tasks:', error);
    recentTasks.value = [];
  }
};

// Load tasks for kanban and list view (fetch from API)
const loadTasks = async (filterValue = null) => {
  try {
    // If this function is accidentally called from a DOM event handler
    // the first argument may be a Browser Event. Ignore Events and use
    // the selectedTaskFilter instead.
    if (filterValue instanceof Event) {
      filterValue = null;
    }

    let filter = (filterValue !== null && filterValue !== undefined) ? filterValue : selectedTaskFilter.value;
    const params = {};

  if (filter === 'all') {
      // no extra params
    } else if (filter.startsWith('workspace-')) {
      params.workspace = parseInt(filter.split('-')[1]);
    } else if (filter.startsWith('project-')) {
      params.project = parseInt(filter.split('-')[1]);
    }

    const res = await taskService.list(params);
    const items = res.data.data || res.data || [];

    allTasks.value = items.map(item => ({
      id: item.id || item.uuid,
      uuid: item.uuid || null,
      title: item.title || item.name || 'Untitled',
      description: item.description || '',
      due_date: item.due_date || item.dueDate || null,
      point: item.point ?? item.points ?? null,
      // priority and status come as nested objects in the API sample
      priority: item.priority ? (item.priority.priority_id || item.priority.id || item.priority.name) : (item.priority_id || null),
      priority_raw: item.priority || null,
      status: item.status ? (item.status.status_id || item.status.id || item.status.name) : (item.status_id || null),
      status_raw: item.status || null,
      // project in API is nested under `project` with project_id
      project: item.project || null,
      workspace_id: item.project?.workspace?.workspace_id || item.project?.workspace?.id || item.project?.workspace_id || item.workspace_id || null,
      // assignees in API sample use user_id and assigned_at
      assignees: (item.assignees || []).map(a => ({
        user_id: a.user_id || a.id,
        id: a.user_id || a.id,
        name: a.name || a.full_name || null,
        email: a.email || null,
        avatar: a.avatar || null,
        assigned_at: a.assigned_at || a.pivot?.created_at || null,
      })),
      comments_count: item.comments_count ?? (item.comments ? item.comments.length : 0) ?? 0,
      attachments_count: item.attachments_count ?? (item.attachments ? item.attachments.length : 0) ?? 0,
      created_at: item.created_at || item.createdAt || null,
      updated_at: item.updated_at || item.updatedAt || null,
    }));
  } catch (error) {
    console.error('Error loading tasks:', error);
    errorToast('Gagal memuat tugas');
    allTasks.value = [];
  }
};

// Load tasks for list view with server-side datatable features
const loadListTasks = async () => {
  try {
    listLoading.value = true;
    const params = {
      limit: listParams.value.per_page,
      page: listParams.value.page,
      search: listParams.value.search || undefined,
      sort: listParams.value.sort,
      order: listParams.value.order
    };

    // Apply workspace/project filter (same behavior as kanban)
    let listFilter = selectedTaskFilter.value;
    if (listFilter instanceof Event) listFilter = null;
    let fetchAllForFilter = false;
    if (typeof listFilter === 'string') {
      if (listFilter.startsWith('workspace-')) {
        params.workspace = parseInt(listFilter.split('-')[1]);
        // to ensure correct filtering in list view, fetch full dataset and filter client-side
        fetchAllForFilter = true;
      } else if (listFilter.startsWith('project-')) {
        params.project = parseInt(listFilter.split('-')[1]);
        // project filtering can be handled server-side, but fetch all to be safe
        fetchAllForFilter = true;
      }
    }

    if (fetchAllForFilter) {
      // request larger limit so we can filter client-side and paginate reliably
      params.limit = 10000;
      params.page = 1;
    }

    // Remove empty params
    Object.keys(params).forEach(key => {
      if (params[key] === undefined || params[key] === '') {
        delete params[key];
      }
    });

    const res = await taskService.recent(params);
    const data = res.data;

  // Handle pagination response - check for nested pagination object
    if (data.data && Array.isArray(data.data) && data.pagination) {
      // Response with nested pagination object (like your API)
      listTasks.value = data.data.map(item => ({
        id: item.id || item.uuid,
        uuid: item.uuid || null,
        title: item.title || item.name || 'Untitled',
        description: item.description || '',
        due_date: item.due_date || item.dueDate || null,
        point: item.point ?? item.points ?? null,
        priority: item.priority ? (item.priority.priority_id || item.priority.id || item.priority.name) : (item.priority_id || null),
        priority_raw: item.priority || null,
        status: item.status ? (item.status.status_id || item.status.id || item.status.name) : (item.status_id || null),
        status_raw: item.status || null,
        project: item.project || null,
        workspace_id: item.project?.workspace?.workspace_id || item.project?.workspace?.id || item.project?.workspace_id || item.workspace_id || null,
        assignees: (item.assignees || []).map(a => ({
          user_id: a.user_id || a.id,
          id: a.user_id || a.id,
          name: a.name || a.full_name || null,
          email: a.email || null,
          avatar: a.avatar || null,
          assigned_at: a.assigned_at || a.pivot?.created_at || null,
        })),
        comments_count: item.comments_count ?? (item.comments ? item.comments.length : 0) ?? 0,
        attachments_count: item.attachments_count ?? (item.attachments ? item.attachments.length : 0) ?? 0,
        created_at: item.created_at || item.createdAt || null,
        updated_at: item.updated_at || item.updatedAt || null,
      }));

      // Use nested pagination object
      listMeta.value = {
        current_page: data.pagination.current_page || 1,
        last_page: data.pagination.last_page || 1,
        per_page: data.pagination.per_page || 10,
        total: data.pagination.total || 0,
        from: data.pagination.from || 0,
        to: data.pagination.to || 0
      };

      // If we fetched full dataset for client-side filter, apply filter and recalc meta
      if (fetchAllForFilter) {
        let filtered = listTasks.value.filter(t => {
          if (params.workspace) {
            return t.workspace_id == params.workspace;
          }
          if (params.project) {
            const pid = t.project?.project_id || t.project?.id || null;
            return pid == params.project;
          }
          return true;
        });

        const total = filtered.length;
        const per = listParams.value.per_page;
        const current = listParams.value.page || 1;
        const last = Math.max(1, Math.ceil(total / per));
        const from = total > 0 ? ((current - 1) * per) + 1 : 0;
        const to = Math.min(current * per, total);

        listMeta.value = { current_page: current, last_page: last, per_page: per, total, from, to };
        // slice for current page
        listTasks.value = filtered.slice((current - 1) * per, current * per);
      }
    } else if (data.data && Array.isArray(data.data)) {
      // Laravel pagination response (top-level pagination)
      listTasks.value = data.data.map(item => ({
        id: item.id || item.uuid,
        uuid: item.uuid || null,
        title: item.title || item.name || 'Untitled',
        description: item.description || '',
        due_date: item.due_date || item.dueDate || null,
        point: item.point ?? item.points ?? null,
        priority: item.priority ? (item.priority.priority_id || item.priority.id || item.priority.name) : (item.priority_id || null),
        priority_raw: item.priority || null,
        status: item.status ? (item.status.status_id || item.status.id || item.status.name) : (item.status_id || null),
        status_raw: item.status || null,
        project: item.project || null,
        workspace_id: item.project?.workspace?.workspace_id || item.project?.workspace?.id || item.project?.workspace_id || item.workspace_id || null,
        assignees: (item.assignees || []).map(a => ({
          user_id: a.user_id || a.id,
          id: a.user_id || a.id,
          name: a.name || a.full_name || null,
          email: a.email || null,
          avatar: a.avatar || null,
          assigned_at: a.assigned_at || a.pivot?.created_at || null,
        })),
        comments_count: item.comments_count ?? (item.comments ? item.comments.length : 0) ?? 0,
        attachments_count: item.attachments_count ?? (item.attachments ? item.attachments.length : 0) ?? 0,
        created_at: item.created_at || item.createdAt || null,
        updated_at: item.updated_at || item.updatedAt || null,
      }));

      // Update pagination meta
      listMeta.value = {
        current_page: data.current_page || 1,
        last_page: data.last_page || 1,
        per_page: data.per_page || 10,
        total: data.total || 0,
        from: data.from || 0,
        to: data.to || 0
      };

      if (fetchAllForFilter) {
        // apply client-side filter and recalc meta
        let filtered = listTasks.value.filter(t => {
          if (params.workspace) return t.workspace_id == params.workspace;
          if (params.project) {
            const pid = t.project?.project_id || t.project?.id || null;
            return pid == params.project;
          }
          return true;
        });
        const total = filtered.length;
        const per = listParams.value.per_page;
        const current = listParams.value.page || 1;
        const last = Math.max(1, Math.ceil(total / per));
        const from = total > 0 ? ((current - 1) * per) + 1 : 0;
        const to = Math.min(current * per, total);
        listMeta.value = { current_page: current, last_page: last, per_page: per, total, from, to };
        listTasks.value = filtered.slice((current - 1) * per, current * per);
      }
    } else {
      // Simple array response
      listTasks.value = (data || []).map(item => ({
        id: item.id || item.uuid,
        uuid: item.uuid || null,
        title: item.title || item.name || 'Untitled',
        description: item.description || '',
        due_date: item.due_date || item.dueDate || null,
        point: item.point ?? item.points ?? null,
        priority: item.priority ? (item.priority.priority_id || item.priority.id || item.priority.name) : (item.priority_id || null),
        priority_raw: item.priority || null,
        status: item.status ? (item.status.status_id || item.status.id || item.status.name) : (item.status_id || null),
        status_raw: item.status || null,
        project: item.project || null,
        workspace_id: item.project?.workspace?.workspace_id || item.project?.workspace?.id || item.project?.workspace_id || item.workspace_id || null,
        assignees: (item.assignees || []).map(a => ({
          user_id: a.user_id || a.id,
          id: a.user_id || a.id,
          name: a.name || a.full_name || null,
          email: a.email || null,
          avatar: a.avatar || null,
          assigned_at: a.assigned_at || a.pivot?.created_at || null,
        })),
        comments_count: item.comments_count ?? (item.comments ? item.comments.length : 0) ?? 0,
        attachments_count: item.attachments_count ?? (item.attachments ? item.attachments.length : 0) ?? 0,
        created_at: item.created_at || item.createdAt || null,
        updated_at: item.updated_at || item.updatedAt || null,
      }));

      // Fake pagination for simple response
      // apply filter client-side if requested
      if (fetchAllForFilter) {
        let filtered = listTasks.value.filter(t => {
          if (params.workspace) return t.workspace_id == params.workspace;
          if (params.project) {
            const pid = t.project?.project_id || t.project?.id || null;
            return pid == params.project;
          }
          return true;
        });
        const total = filtered.length;
        const per = listParams.value.per_page;
        const current = listParams.value.page || 1;
        const last = Math.max(1, Math.ceil(total / per));
        const from = total > 0 ? ((current - 1) * per) + 1 : 0;
        const to = Math.min(current * per, total);
        listMeta.value = { current_page: current, last_page: last, per_page: per, total, from, to };
        listTasks.value = filtered.slice((current - 1) * per, current * per);
      } else {
        listMeta.value = {
          current_page: 1,
          last_page: Math.max(1, Math.ceil(listTasks.value.length / listParams.value.per_page)),
          per_page: listParams.value.per_page,
          total: listTasks.value.length,
          from: listTasks.value.length > 0 ? 1 : 0,
          to: listTasks.value.length
        };
      }
    }
  } catch (error) {
    console.error('Error loading list tasks:', error);
    errorToast('Gagal memuat daftar tugas');
    listTasks.value = [];
    listMeta.value = {
      current_page: 1,
      last_page: 1,
      per_page: 10,
      total: 0,
      from: 0,
      to: 0
    };
  } finally {
    listLoading.value = false;
  }
};

// Pagination functions
const changePage = (page) => {
  if (page >= 1 && page <= listMeta.value.last_page) {
    listParams.value.page = page;
    loadListTasks();
  }
};

const visiblePages = computed(() => {
  const current = listMeta.value.current_page;
  const last = listMeta.value.last_page;
  const pages = [];

  if (last <= 7) {
    // Show all pages if 7 or fewer
    for (let i = 1; i <= last; i++) {
      pages.push(i);
    }
  } else {
    // Show first page
    pages.push(1);

    if (current > 4) {
      pages.push('...');
    }

    // Show pages around current
    const start = Math.max(2, current - 1);
    const end = Math.min(last - 1, current + 1);

    for (let i = start; i <= end; i++) {
      if (!pages.includes(i)) {
        pages.push(i);
      }
    }

    if (current < last - 3) {
      pages.push('...');
    }

    // Show last page
    if (!pages.includes(last)) {
      pages.push(last);
    }
  }

  return pages;
});

// Search functions
const debounceSearch = () => {
  clearTimeout(searchTimeout);
  searchTimeout = setTimeout(() => {
    listParams.value.page = 1; // Reset to first page when searching
    loadListTasks();
  }, 500);
};

const clearSearch = () => {
  listParams.value.search = '';
  listParams.value.page = 1;
  loadListTasks();
};

// Task management functions
const getTasksByPriority = (priorityId) => {
  // Respect selected workspace/project filter when showing kanban columns
  const filter = selectedTaskFilter.value;
  let workspaceFilterId = null;
  let projectFilterId = null;

  if (typeof filter === 'string') {
    if (filter.startsWith('workspace-')) {
      workspaceFilterId = parseInt(filter.split('-')[1]);
    } else if (filter.startsWith('project-')) {
      projectFilterId = parseInt(filter.split('-')[1]);
    }
  }

  return allTasks.value.filter(task => {
    // apply workspace/project filtering if active
    if (workspaceFilterId && task.workspace_id != workspaceFilterId) return false;
    if (projectFilterId) {
      const pid = task.project?.project_id || task.project?.id || null;
      if (pid != projectFilterId) return false;
    }

    // Robust priority matching: compare against nested raw fields and normalized priority
    const tRaw = task.priority_raw || {};
    if (tRaw.priority_id != null && String(tRaw.priority_id) === String(priorityId)) return true;
    if (tRaw.id != null && String(tRaw.id) === String(priorityId)) return true;
    if (tRaw.name != null && String(tRaw.name) === String(priorityId)) return true;
    if (task.priority != null && String(task.priority) === String(priorityId)) return true;

    return false;
  });
};

const getPriorityIcon = (priority) => {
  switch (priority) {
    case 'High': return 'arrow-up';
    case 'Medium': return 'minus';
    case 'Low': return 'arrow-down';
    case 'Urgent': return 'exclamation';
    default: return 'minus';
  }
};

const getPriorityName = (priority) => {
  switch (priority) {
    case 'High': return 'Tinggi';
    case 'Medium': return 'Sedang';
    case 'Low': return 'Rendah';
    case 'Urgent': return 'Sangat Mendesak';
    default: return 'Sedang';
  }
};

// Normalize a string to a slug suitable for CSS classes, e.g. 'High' -> 'high', 'Very High' -> 'very-high'
const slugify = (value) => {
  if (!value) return '';
  return String(value)
    .toLowerCase()
    .replace(/\s+/g, '-')        // replace spaces with -
    .replace(/[^a-z0-9\-]/g, '') // remove invalid chars
    .replace(/\-+/g, '-')        // collapse dashes
    .replace(/^-+|-+$/g, '');     // trim dashes
};

// Compute dynamic class based on number of taskPriorities to allow grid-like columns (e.g. 4 statuses -> columns-4)
const boardColumnsClass = computed(() => {
  const n = taskPriorities.value.length || 1;
  return `columns-${Math.min(n, 12)}`;
});

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
  // allow passing a ref or plain value
  const id = (workspaceId && workspaceId.value !== undefined) ? workspaceId.value : workspaceId;
  if (id === null || id === undefined || id === 'all') return 'Semua Workspace';

  const ws = workspaces.value.find(w => String(w.id) === String(id));
  return ws?.name || 'Unknown Workspace';
};

const filterProjects = () => {
  // Ensure selectedWorkspaceFilter is a simple primitive (number or 'all')
  if (selectedWorkspaceFilter.value !== 'all') {
    // coerce to number when possible
    const n = Number(selectedWorkspaceFilter.value);
    if (!Number.isNaN(n)) selectedWorkspaceFilter.value = n;
  }
  // computed `filteredProjects` will react automatically
};

const calculateProgress = (project) => {
  const total = project.tasks_count || 0;
  const completed = project.completed_tasks_count || 0;
  return total > 0 ? Math.round((completed / total) * 100) : 0;
};

// Robustly parse backend date strings and format relative time in Indonesian
const parseToDate = (dateString) => {
  if (!dateString) return null;
  if (dateString instanceof Date) return dateString;
  let s = String(dateString).trim();
  // If format is 'YYYY-MM-DD HH:mm:ss' convert to ISO-ish 'YYYY-MM-DDTHH:mm:ss'
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(s)) {
    s = s.replace(' ', 'T');
  }
  // If timezone missing, Date will treat as local; fallback to Date.parse
  const d = new Date(s);
  if (isNaN(d)) return null;
  return d;
};

const formatDate = (dateString) => {
  const date = parseToDate(dateString);
  if (!date) return '';
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const absMs = Math.abs(diffMs);

  const minutes = Math.floor(absMs / (1000 * 60));
  const hours = Math.floor(absMs / (1000 * 60 * 60));
  const days = Math.floor(absMs / (1000 * 60 * 60 * 24));

  if (diffMs >= 0) {
    // past
    if (minutes < 60) return `${minutes} menit lalu`;
    if (hours < 24) return `${hours} jam lalu`;
    if (days < 7) return `${days} hari lalu`;
    return date.toLocaleDateString('id-ID');
  } else {
    // future
    if (minutes < 60) return `dalam ${minutes} menit`;
    if (hours < 24) return `dalam ${hours} jam`;
    if (days < 7) return `dalam ${days} hari`;
    return date.toLocaleDateString('id-ID');
  }
};

// Navigation
const goToWorkspace = (workspace) => {
  router.push(`/workspaces/${workspace.slug}`);
};

const goToProject = (project) => {
  const workspace = workspaces.value.find(w => w.id === project.workspace?.id);
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
  overflow-y: hidden;
  padding: 0 8px 16px;
  max-height: 80vh;
  position: relative;
}

.kanban-view::-webkit-scrollbar {
  height: 8px;
}

.kanban-view::-webkit-scrollbar-track {
  background: var(--bg-1);
  border-radius: 4px;
}

.kanban-view::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 4px;
}

.kanban-view::-webkit-scrollbar-thumb:hover {
  background: var(--color-muted);
}

.kanban-board {
  display: flex;
  gap: 20px;
  /* ensure board fills container width but can grow beyond and trigger horizontal scroll */
  min-width: 100%;
  padding: 4px;
  height: fit-content;
  align-items: flex-start;
}

/* When there are 4 columns, make each column 25% width (like col-3) */
.kanban-board.columns-4 .kanban-column {
  flex: 0 0 calc((100% - 60px) / 4); /* subtract gaps (20px * 3) approximated as 60px */
  width: calc((100% - 60px) / 4);
}

/* Responsive fallback: on small screens keep fixed 300px columns */
@media (max-width: 900px) {
  .kanban-board.columns-4 .kanban-column {
    flex: 0 0 300px;
    width: 300px;
  }
}

.kanban-column {
  flex: 0 0 300px; /* fixed basis so columns are stable */
  width: 300px;
  background: var(--bg-1);
  border-radius: 8px;
  padding: 16px;
  flex-shrink: 0;
  max-height: 75vh;
  display: flex;
  flex-direction: column;
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
  overflow-y: auto;
  flex: 1;
  padding-right: 4px;
}

.column-content::-webkit-scrollbar {
  width: 6px;
}

.column-content::-webkit-scrollbar-track {
  background: transparent;
}

.column-content::-webkit-scrollbar-thumb {
  background: var(--border-color);
  border-radius: 3px;
}

.column-content::-webkit-scrollbar-thumb:hover {
  background: var(--color-muted);
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
  color: #b42c3aff;
}

.priority-medium {
  color: #ffc107;
}

/* Ensure priority badge doesn't wrap and icon aligns */
.priority-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}

/* Fallback priority classes (colors) */
.priority-high { color: #b42c3aff; }
.priority-medium { color: #FFC107; }
.priority-low { color: #28A745; }
.priority-urgent { color: #7d0000ff; }

.priority-low {
  color: #28a745;
}

.priority-urgent {
  color: #7d0000;
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

.task-priority-indicator.priority-urgent {
  background: #7d0000;
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

  /* Datatable responsive */
  .table-controls {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }

  .table-controls-left,
  .table-controls-right {
    justify-content: center;
  }

  .search-input {
    width: 100%;
    max-width: 300px;
  }

  .table-pagination {
    flex-direction: column;
    gap: 12px;
    align-items: center;
  }

  .pagination-controls {
    flex-wrap: wrap;
    justify-content: center;
  }

  .pagination-pages {
    margin: 0 8px;
  }

  .tasks-table th,
  .tasks-table td {
    padding: 8px 10px;
    font-size: 13px;
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

/* Tasks Table (List view) styling */
.tasks-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.tasks-table thead {
  background: var(--bg-1);
}

.tasks-table th {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  text-align: center;
  vertical-align: middle;
  font-weight: 600;
  color: var(--color-muted);
  font-size: 13px;
}

.tasks-table td {
  padding: 12px 16px;
  border-bottom: 1px solid var(--border-color);
  text-align: left;
  vertical-align: middle;
}

.tasks-table tbody tr:hover {
  background: var(--bg-1);
}

.tasks-table .td-actions {
  width: 40px;
  text-align: right;
}

.tasks-table .assignee-avatar.small {
  width: 24px;
  height: 24px;
}

.tasks-table .priority-badge {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border-radius: 12px;
  font-size: 12px;
}

/* Compact point badges */
.task-point-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: linear-gradient(90deg, rgba(255,215,64,0.18), rgba(255,193,7,0.08));
  color: var(--text-color);
  padding: 4px 6px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  box-shadow: 0 1px 0 rgba(0,0,0,0.06);
}

.task-point-badge font-awesome-icon {
  color: #ffcc00;
  font-size: 12px;
}

.list-point-badge {
  display: inline-block;
  margin-left: 8px;
  background: linear-gradient(90deg, rgba(255,215,64,0.14), rgba(255,193,7,0.06));
  color: var(--text-color);
  padding: 2px 6px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  vertical-align: middle;
  box-shadow: 0 1px 0 rgba(0,0,0,0.04);
}

/* Dark mode: make point badges highly visible */
html.dark .task-point-badge {
  background: linear-gradient(90deg, rgba(255,193,7,0.95), rgba(255,160,0,0.9));
  color: #111;
  box-shadow: 0 4px 10px rgba(0,0,0,0.6);
}

html.dark .list-point-badge {
  background: rgba(255,193,7,0.95);
  color: #111;
  box-shadow: 0 2px 6px rgba(0,0,0,0.5);
}

/* Table Controls */
.table-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  padding: 16px;
  background: var(--bg-0);
  border: 1px solid var(--border-color);
  border-radius: 8px 8px 0 0;
}

.table-controls-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.table-controls-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.per-page-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  color: var(--text-color);
}

.per-page-select {
  background: var(--bg-0);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  padding: 4px 8px;
  font-size: 14px;
  color: var(--text-color);
  cursor: pointer;
  outline: none;
  transition: all 0.2s ease;
}

.per-page-select:focus {
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 2px rgba(23, 162, 184, 0.1);
}

.search-box {
  position: relative;
}

.search-input-wrapper {
  position: relative;
  display: flex;
  align-items: center;
}

.search-input {
  background: var(--bg-0);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  padding: 8px 12px 8px 36px;
  font-size: 14px;
  color: var(--text-color);
  width: 250px;
  outline: none;
  transition: all 0.2s ease;
}

.search-input:focus {
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(23, 162, 184, 0.1);
}

.search-icon {
  position: absolute;
  left: 12px;
  color: var(--color-muted);
  font-size: 14px;
  z-index: 1;
}

.clear-search-btn {
  position: absolute;
  right: 8px;
  background: none;
  border: none;
  color: var(--color-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 2px;
  transition: all 0.2s ease;
}

.clear-search-btn:hover {
  color: var(--text-color);
  background: var(--bg-1);
}

/* Table Wrapper */
.table-wrapper {
  background: var(--bg-0);
  border: 1px solid var(--border-color);
  border-top: none;
  overflow-x: auto;
}

/* Table Loading and Empty States */
.loading-row,
.empty-row {
  background: var(--bg-0);
}

.table-loading,
.table-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 24px;
  color: var(--color-muted);
}

.table-loading {
  gap: 12px;
}

.table-empty {
  gap: 16px;
}

.table-empty p {
  margin: 0;
  font-size: 14px;
}

.loading-spinner.small {
  width: 24px;
  height: 24px;
  border-width: 2px;
  margin: 0;
}

/* Pagination */
.table-pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: var(--bg-0);
  border: 1px solid var(--border-color);
  border-top: none;
  border-radius: 0 0 8px 8px;
}

.pagination-info {
  font-size: 14px;
  color: var(--color-muted);
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 8px;
}

.pagination-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--bg-0);
  border: 1px solid var(--border-color);
  border-radius: 6px;
  color: var(--text-color);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.pagination-btn:hover:not(:disabled) {
  background: var(--bg-1);
  border-color: var(--color-primary-500);
}

.pagination-btn:disabled {
  color: var(--color-muted);
  cursor: not-allowed;
  opacity: 0.6;
}

.pagination-pages {
  display: flex;
  align-items: center;
  gap: 4px;
  margin: 0 12px;
}

.pagination-page {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  background: var(--bg-0);
  border: 1px solid var(--border-color);
  border-radius: 4px;
  color: var(--text-color);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s ease;
  text-decoration: none;
}

.pagination-page:hover:not(.disabled):not(.active) {
  background: var(--bg-1);
  border-color: var(--color-primary-500);
}

.pagination-page.active {
  background: var(--color-primary-500);
  border-color: var(--color-primary-500);
  color: white;
}

.pagination-page.disabled {
  cursor: default;
  border: none;
  background: transparent;
  color: var(--color-muted);
}

@media (max-width: 768px) {
  .tasks-table th,
  .tasks-table td {
    padding: 8px 10px;
    font-size: 13px;
  }
}
</style>