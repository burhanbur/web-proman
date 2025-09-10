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
                  {{ workspace.member_count || 0 }} Anggota
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
            <button class="btn btn-secondary" @click="showInviteModal = true" v-show="activeTab === 'members'">
              <font-awesome-icon icon="user-plus" size="sm" />
              Undang Anggota
            </button>
            <button class="btn btn-primary" @click="showCreateProjectModal = true" v-show="activeTab === 'projects'">
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
          <button 
            :class="['nav-item', { active: activeTab === 'notes' }]"
            @click="(activeTab = 'notes', loadNotes(workspaceId))"
          >
            <font-awesome-icon icon="sticky-note" size="sm" />
            Catatan
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
                      {{ getCompletedCount(project) }} selesai
                    </span>
                    <span class="stat-item">
                      <font-awesome-icon icon="ban" size="sm" />
                      {{ getCancelledCount(project) }} dibatalkan
                    </span>
                    <span class="stat-item">
                      <font-awesome-icon icon="circle" size="sm" />
                      {{ getTotalCount(project) }} tugas
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

                      <template v-else>
                        <span>{{ renderActivityText(activity) }}</span>
                      </template>
                    </div>

                    <div class="activity-type-badge" :class="activity.type">
                      {{ getActivityTypeLabel(activity.type) }}
                    </div>
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

          <!-- Notes Tab -->
          <div v-if="activeTab === 'notes'" class="notes-tab">
            <div class="notes-container">
              <div class="notes-header">
                <h3>Catatan Workspace</h3>
                <button class="btn btn-primary" @click="showCreateNoteModal = true" v-if="authStore.user">
                  <font-awesome-icon icon="plus" size="sm" />
                  Tambah Catatan
                </button>
              </div>

              <div class="notes-list">
                <div v-if="notes.length === 0" class="empty-state">
                  <font-awesome-icon icon="sticky-note" size="3x" class="empty-icon" />
                  <h3>Belum ada catatan</h3>
                  <p>Tambahkan catatan untuk berkomunikasi dengan tim Anda.</p>
                </div>

                <div v-else class="note-card" v-for="note in notes" :key="note.id">
                  <div class="note-header">
                    <div class="note-author">
                      <strong>{{ note.created_by?.name || note.created_by?.email || 'Pengguna' }}</strong>
                      <span class="note-meta">• {{ formatDateTime(note.created_at) }}</span>
                    </div>
                    <div class="note-actions">
                      <button v-if="authStore.user && authStore.user.id === note.created_by?.id" class="btn-icon" @click="deleteNote(note.id)">
                        <font-awesome-icon icon="trash" size="sm" />
                      </button>
                    </div>
                  </div>

                  <div class="note-body">
                    <p>{{ note.content }}</p>

                    <div v-if="note.attachments && note.attachments.length" class="note-attachments">
                      <h4>Lampiran ({{ note.attachments_count || note.attachments.length }})</h4>
                      <ul>
                        <li v-for="att in note.attachments" :key="att.attachment_id">
                          <a :href="`/storage/${att.file_path}`" target="_blank" rel="noopener noreferrer">{{ att.original_filename }}</a>
                          <small class="muted"> — {{ att.mime_type }} • {{ formatFileSize(att.file_size) }}</small>
                        </li>
                      </ul>
                    </div>
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
      <h3>Workspace tidak ditemukan</h3>
      <p>Workspace yang Anda cari tidak ada atau Anda tidak memiliki akses.</p>
      <router-link to="/dashboard" class="btn btn-primary">Kembali ke Dashboard</router-link>
    </div>

    <!-- Create Note Modal -->
    <div v-if="showCreateNoteModal" class="modal-overlay" @click="closeCreateNoteModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>Tambah Catatan</h3>
          <button class="btn-close" @click="closeCreateNoteModal">
            <font-awesome-icon icon="times" />
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="noteContent">Catatan</label>
            <textarea 
              id="noteContent"
              v-model="newNoteContent" 
              placeholder="Tulis catatan untuk anggota workspace..." 
              rows="6"
              class="form-control"
            ></textarea>
          </div>
          
          <div class="form-group">
            <label>Lampiran</label>
            <div 
              class="file-upload-area"
              :class="{ 'drag-over': isDragOver }"
              @dragover.prevent="handleDragOver"
              @dragleave.prevent="handleDragLeave"
              @drop.prevent="handleFileDrop"
            >
              <input 
                type="file" 
                ref="fileInput" 
                multiple 
                @change="handleFileSelect"
                class="file-input"
                accept="*/*"
              />
              <div class="file-upload-button" @click="$refs.fileInput.click()">
                <font-awesome-icon icon="paperclip" size="lg" />
                <span>Pilih File</span>
              </div>
              <p class="file-upload-hint">Klik untuk memilih file atau drag & drop</p>
            </div>
            
            <!-- Selected Files List -->
            <div v-if="selectedFiles.length > 0" class="selected-files">
              <h4>File Terpilih ({{ selectedFiles.length }})</h4>
              <div class="file-list">
                <div v-for="(file, index) in selectedFiles" :key="index" class="file-item">
                  <div class="file-info">
                    <font-awesome-icon icon="paperclip" size="sm" />
                    <span class="file-name">{{ file.name }}</span>
                    <span class="file-size">{{ formatFileSize(file.size) }}</span>
                  </div>
                  <button class="btn-remove" @click="removeFile(index)">
                    <font-awesome-icon icon="times" size="sm" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeCreateNoteModal">Batal</button>
          <button 
            class="btn btn-primary" 
            :disabled="creatingNote || !newNoteContent.trim()" 
            @click="createNoteWithAttachments"
          >
            <font-awesome-icon icon="paper-plane" size="sm" />
            {{ creatingNote ? 'Menyimpan...' : 'Simpan Catatan' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { workspaceService } from '@/api/services/workspaceService';
import { noteService } from '@/api/services/noteService';
import { useAuthStore } from '@/stores/auth';
import { errorToast, successToast } from '@/utils/toast';

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();

// Reactive data
const loading = ref(true);
const workspaceId = ref(null);
const workspace = ref(null);
const projects = ref([]);
const members = ref([]);
const activities = ref([]);
const activeTab = ref('projects');
const showInviteModal = ref(false);
const showCreateProjectModal = ref(false);
const notes = ref([]);
const newNoteContent = ref('');
const creatingNote = ref(false);
const showCreateNoteModal = ref(false);
const selectedFiles = ref([]);
const isDragOver = ref(false);

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
    workspaceId.value = workspace.value.id;

    // Load notes
    await loadNotes(workspaceId.value);

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

const loadNotes = async (workspaceId) => {
  try {
    const response = await noteService.list({ model_type: 'workspace', model_id: workspaceId });
    notes.value = response.data.data || [];
    console.log('Loaded notes:', notes.value);
  } catch (error) {
    console.error('Error loading notes:', error);
  }
};

const createNote = async () => {
  if (!newNoteContent.value.trim()) return;
  creatingNote.value = true;
  try {
    const payload = {
      model_type: 'workspace',
      model_id: workspaceId.value,
      content: newNoteContent.value.trim()
    };
    const res = await noteService.create(payload);
    if (res.data && res.data.success) {
      successToast(res.data.message || 'Catatan berhasil dibuat');
      // prepend new note to list if returned
      const created = res.data.data || null;
      if (created) notes.value.unshift(created);
      else await loadNotes(workspaceId.value);
      newNoteContent.value = '';
    } else {
      errorToast(res.data.message || 'Gagal membuat catatan');
    }
  } catch (error) {
    console.error('Error creating note:', error);
    errorToast('Terjadi kesalahan saat membuat catatan');
  } finally {
    creatingNote.value = false;
  }
};

const deleteNote = async (noteId) => {
  if (!confirm('Hapus catatan ini?')) return;
  try {
    const res = await noteService.remove(noteId);
    if (res.data && res.data.success) {
      notes.value = notes.value.filter(n => n.id !== noteId);
      successToast(res.data.message || 'Catatan dihapus');
    } else {
      errorToast(res.data.message || 'Gagal menghapus catatan');
    }
  } catch (error) {
    console.error('Error deleting note:', error);
    errorToast('Terjadi kesalahan saat menghapus catatan');
  }
};

const formatFileSize = (size) => {
  if (!size && size !== 0) return '';
  const i = size === 0 ? 0 : Math.floor(Math.log(size) / Math.log(1024));
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  return `${(size / Math.pow(1024, i)).toFixed( i === 0 ? 0 : 2 )} ${sizes[i]}`;
};

// Modal functions
const closeCreateNoteModal = () => {
  showCreateNoteModal.value = false;
  newNoteContent.value = '';
  selectedFiles.value = [];
  isDragOver.value = false;
};

// File handling functions
const handleFileSelect = (event) => {
  const files = Array.from(event.target.files);
  selectedFiles.value = [...selectedFiles.value, ...files];
};

const removeFile = (index) => {
  selectedFiles.value.splice(index, 1);
};

// Drag and drop functions
const handleDragOver = (event) => {
  event.preventDefault();
  isDragOver.value = true;
};

const handleDragLeave = (event) => {
  event.preventDefault();
  isDragOver.value = false;
};

const handleFileDrop = (event) => {
  event.preventDefault();
  isDragOver.value = false;
  
  const files = Array.from(event.dataTransfer.files);
  selectedFiles.value = [...selectedFiles.value, ...files];
};

// Create note with attachments
const createNoteWithAttachments = async () => {
  if (!newNoteContent.value.trim()) return;
  creatingNote.value = true;
  
  try {
    const formData = new FormData();
    formData.append('model_type', 'workspace');
    formData.append('model_id', workspaceId.value);
    formData.append('content', newNoteContent.value.trim());
    
    // Add files to FormData
    selectedFiles.value.forEach((file, index) => {
      formData.append(`attachments[${index}]`, file);
    });
    
    const res = await noteService.create(formData);
    if (res.data && res.data.success) {
      successToast(res.data.message || 'Catatan berhasil dibuat');
      // prepend new note to list if returned
      const created = res.data.data || null;
      if (created) notes.value.unshift(created);
      else await loadNotes(workspaceId.value);
      closeCreateNoteModal();
    } else {
      errorToast(res.data.message || 'Gagal membuat catatan');
    }
  } catch (error) {
    console.error('Error creating note:', error);
    errorToast('Terjadi kesalahan saat membuat catatan');
  } finally {
    creatingNote.value = false;
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

// Robust helpers for project task counts and progress
const getTotalCount = (project) => {
  // Prefer common fields, support different naming coming from API
  return project.tasks_count ?? project.total_tasks ?? project.tasksTotal ?? 0;
};

const getCompletedCount = (project) => {
  return project.completed_tasks_count ?? project.tasks_completed_count ?? project.completed ?? 0;
};

const getCancelledCount = (project) => {
  return project.tasks_cancelled_count ?? project.cancelled_tasks_count ?? project.cancelled ?? 0;
};

const calculateProgress = (project) => {
  const total = getTotalCount(project) || 0;
  const completed = getCompletedCount(project) || 0;
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

// Format date/time for activity timestamps (short)
const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d)) return dateString;
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return d.toLocaleDateString('id-ID', options).replace(',', '');
};

// Activity helpers (project-style)
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
  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined });
};

const getActivityMessage = (activity) => {
  if (!activity) return '';
  if (activity.message) return activity.message;
  const actionMap = { created: 'membuat', updated: 'memperbarui', deleted: 'menghapus', restored: 'memulihkan' };
  const modelMap = { Project: 'proyek', Task: 'tugas', Comment: 'komentar', ProjectUser: 'anggota proyek' };
  const action = actionMap[activity.action] || activity.action;
  const model = modelMap[activity.model_type] || activity.model_type;
  return `${action} ${model}`;
};

const getActivityTypeLabel = (type) => {
  const typeMap = { audit: 'Audit', task_activity: 'Tugas', comment: 'Komentar' };
  return typeMap[type] || type;
};

// Render activity object to human-readable sentence
const renderActivityText = (a) => {
  if (!a || typeof a !== 'object') return String(a || '');

  // Handle comment type
  if (a.type === 'comment') {
    const user = a.user?.name || 'Seseorang';
    const task = a.task?.title || 'tugas';
    const project = a.project?.name ? `di proyek ${a.project.name}` : '';
    const comment = a.comment ? `: "${a.comment}"` : '';
    return `${user} mengomentari tugas "${task}" ${project}${comment}`.trim();
  }

  // Fallback generic representation
  if (a.description) return a.description;
  return JSON.stringify(a);
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

.activity-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 6px;
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

.activity-action { font-weight: 500; }
.activity-target { color: var(--color-primary-600); font-weight: 500; }
.activity-comment { background: var(--color-background-soft); border: 1px solid var(--color-border); border-radius: 6px; padding: 8px 12px; margin-top: 8px; font-size: 13px; color: var(--color-muted); font-style: italic; }

.activity-type-badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
.activity-type-badge.audit { background: #e3f2fd; color: #1976d2; }
.activity-type-badge.task_activity { background: #fff3e0; color: #f57c00; }
.activity-type-badge.comment { background: #e8f5e8; color: #2e7d32; }

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

/* Notes styles */
.notes-container {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.notes-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--color-border);
}

.notes-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
}

.note-card {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 10px;
  padding: 16px;
}
.note-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}
.note-author { color: var(--color-text); }
.note-meta { color: var(--color-muted); font-size: 13px; margin-left: 8px; }
.note-body p { margin: 0; color: var(--color-text); }
.note-attachments ul { list-style: none; padding: 0; margin: 8px 0 0 0; }
.note-attachments li { margin-bottom: 6px; }
.note-attachments a { color: var(--color-primary-600); }
.muted { color: var(--color-muted); font-size: 12px; }

/* Modal styles */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.modal-container {
  background: var(--color-background);
  border-radius: 12px;
  width: 90%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
}

.btn-close {
  background: none;
  border: none;
  color: var(--color-muted);
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.btn-close:hover {
  background: var(--color-border);
  color: var(--color-text);
}

.modal-body {
  padding: 24px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid var(--color-border);
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-weight: 500;
  color: var(--color-text);
  font-size: 14px;
}

.form-control {
  width: 100%;
  padding: 12px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 14px;
  background: var(--color-background);
  color: var(--color-text);
  resize: vertical;
  transition: border-color 0.2s ease;
}

.form-control:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* File upload styles */
.file-upload-area {
  border: 2px dashed var(--color-border);
  border-radius: 8px;
  padding: 20px;
  text-align: center;
  background: var(--color-background-soft);
  transition: all 0.2s ease;
}

.file-upload-area:hover {
  border-color: var(--color-primary-500);
  background: var(--color-primary-50);
}

.file-upload-area.drag-over {
  border-color: var(--color-primary-500);
  background: var(--color-primary-100);
  transform: scale(1.02);
}

.file-input {
  display: none;
}

.file-upload-button {
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  color: var(--color-primary-500);
  font-weight: 500;
}

.file-upload-button:hover {
  color: var(--color-primary-600);
}

.file-upload-hint {
  margin: 8px 0 0 0;
  font-size: 13px;
  color: var(--color-muted);
}

.selected-files {
  margin-top: 16px;
}

.selected-files h4 {
  margin: 0 0 12px 0;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
}

.file-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.file-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 6px;
}

.file-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
}

.file-name {
  font-size: 14px;
  color: var(--color-text);
  font-weight: 500;
}

.file-size {
  font-size: 12px;
  color: var(--color-muted);
}

.btn-remove {
  background: none;
  border: none;
  color: var(--color-muted);
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.btn-remove:hover {
  background: var(--color-border);
  color: var(--color-text);
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
