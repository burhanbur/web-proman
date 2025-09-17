<template>
  <div v-if="show" class="task-modal-overlay" @click="closeModal">
    <div class="task-modal" @click.stop>
      <!-- Modal Header -->
      <div class="modal-header">
        <h2 class="modal-title">Detail Tugas</h2>
        <button class="btn-close" @click="closeModal">
          <font-awesome-icon icon="times" />
        </button>
      </div>

      <!-- Modal Content -->
      <div class="modal-content">
        <!-- Task Details (70%) -->
        <div class="task-section">
          <div class="task-form">
            <!-- Task Title -->
            <div class="form-group">
              <label class="form-label">Judul Tugas</label>
              <input 
                v-model="taskData.title" 
                type="text" 
                class="form-input"
                @input="markAsModified"
                placeholder="Masukkan judul tugas..."
              />
            </div>

            <!-- Task Description -->
            <div class="form-group">
              <label class="form-label">Deskripsi</label>
              <textarea 
                v-model="taskData.description" 
                class="form-textarea"
                @input="markAsModified"
                rows="6"
                placeholder="Masukkan deskripsi tugas..."
              ></textarea>
            </div>

            <!-- Task Meta Information Row 1 -->
            <div class="form-row">
              <div class="form-group">
                  <label class="form-label">Status</label>
                  <select v-model="taskData.status_id" class="form-select" @change="markAsModified">
                  <option value="">Pilih Status</option>
                  <option v-for="status in taskStatuses" :key="status.id" :value="status.id">
                    {{ status.name }}
                  </option>
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">Prioritas</label>
                  <select v-model="taskData.priority_id" class="form-select" @change="markAsModified">
                  <option value="">Pilih Prioritas</option>
                  <option v-for="priority in taskPriorities" :key="priority.id" :value="priority.id">
                    {{ priority.name }}
                  </option>
                </select>
              </div>
            </div>

            <!-- Task Meta Information Row 2 -->
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Target Selesai</label>
                <input 
                  v-model="dueDateModel" 
                  type="date" 
                  class="form-input"
                  @input="markAsModified"
                />
              </div>
            </div>

            <!-- Assignees -->
            <div class="form-group">
              <label class="form-label">Penugasan</label>
              <div class="assignees-section">
                <div class="current-assignees">
                  <div 
                    v-for="assignee in taskData.assignees" 
                    :key="assignee.user_id"
                    class="assignee-tag"
                  >
                    <div class="assignee-avatar">
                      <img v-if="assignee.avatar" :src="assignee.avatar" :alt="assignee.name" />
                      <div v-else class="assignee-avatar-fallback">{{ getMemberInitials(assignee.name) }}</div>
                    </div>
                    <span class="assignee-name">{{ assignee.name }}</span>
                    <button 
                      @click="removeAssignee(assignee.user_id)" 
                      class="remove-assignee"
                      type="button"
                    >
                      <font-awesome-icon icon="times" size="sm" />
                    </button>
                  </div>
                </div>
                <button 
                  @click="showAssigneeSelector = !showAssigneeSelector" 
                  class="btn btn-outline btn-sm"
                  type="button"
                >
                  <font-awesome-icon icon="plus" size="sm" />
                  Tambah Penugasan
                </button>
                
                <!-- Assignee Selector -->
                <div v-if="showAssigneeSelector" class="assignee-selector">
                  <div 
                    v-for="member in availableMembers" 
                    :key="member.user_id"
                    class="member-option"
                    @click="addAssignee(member)"
                  >
                    <div class="member-avatar">
                      <img v-if="member.avatar" :src="member.avatar" :alt="member.user_name" />
                      <div v-else class="member-avatar-fallback">{{ getMemberInitials(member.user_name) }}</div>
                    </div>
                    <span class="member-name">{{ member.user_name }}</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="form-actions">
              <button 
                @click="saveTask" 
                class="btn btn-primary"
                :disabled="saving || !isModified"
              >
                <font-awesome-icon v-if="saving" icon="spinner" spin />
                <font-awesome-icon v-else icon="save" />
                {{ saving ? 'Menyimpan...' : 'Simpan Perubahan' }}
              </button>
              <button @click="cancelChanges" class="btn btn-secondary" :disabled="saving">
                Batal
              </button>
              <button 
                @click="deleteTask" 
                class="btn btn-danger"
                :disabled="saving"
                v-if="taskData.id"
              >
                <font-awesome-icon icon="trash" />
                Hapus Tugas
              </button>
            </div>
          </div>
        </div>

        <!-- Comments Section (30%) -->
        <div class="comments-section">
          <div class="comments-header">
            <h3 class="comments-title">
              <font-awesome-icon icon="comments" />
              Komentar
              <span class="comment-count">({{ comments.length }})</span>
            </h3>
          </div>

          <!-- Comments List -->
          <div class="comments-list">
            <div v-if="loadingComments" class="comments-loading">
              <div class="loading-spinner small"></div>
              <p>Memuat komentar...</p>
            </div>

            <div v-else-if="comments.length === 0" class="comments-empty">
              <font-awesome-icon icon="comment" size="2x" class="empty-icon" />
              <p>Belum ada komentar</p>
              <p class="text-sm">Mulai diskusi dengan menambahkan komentar pertama</p>
            </div>

            <div v-else class="comments-container">
              <div 
                v-for="comment in comments" 
                :key="comment.uuid || comment.id"
                class="comment-item"
              >
                <div class="comment-avatar">
                  <img v-if="comment.user?.avatar" :src="comment.user.avatar" :alt="comment.user.name" />
                  <div v-else class="comment-avatar-fallback">{{ getMemberInitials(comment.user?.name || '') }}</div>
                </div>
                <div class="comment-content">
                  <div class="comment-header">
                    <span class="comment-author">{{ comment.user?.name || 'Unknown User' }}</span>
                    <span class="comment-time">{{ formatCommentDate(comment.created_at) }}</span>
                  </div>
                  <div class="comment-body">
                    <p>{{ comment.comment }}</p>
                  </div>
                  <div class="comment-actions" v-if="canEditComment(comment)">
                    <button 
                      @click="editComment(comment)" 
                      class="comment-action-btn"
                    >
                      <font-awesome-icon icon="edit" size="sm" />
                    </button>
                    <button 
                      @click="deleteComment(comment.uuid || comment.id)" 
                      class="comment-action-btn delete"
                    >
                      <font-awesome-icon icon="trash" size="sm" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Add Comment Form (moved below list) -->
          <div class="add-comment-form" style="border-top:1px solid var(--tw-border-opacity, #e5e7eb);">
            <div class="comment-input-group">
              <div class="user-avatar">
                <img v-if="currentUser?.avatar" :src="currentUser.avatar" :alt="currentUser.name" />
                <div v-else class="user-avatar-fallback">{{ getMemberInitials(currentUser?.name || '') }}</div>
              </div>
              <textarea 
                v-model="newComment" 
                class="comment-input"
                placeholder="Tulis komentar..."
                rows="3"
                @keydown.ctrl.enter="addComment"
              ></textarea>
            </div>
            <div class="comment-actions">
              <button 
                @click="addComment" 
                class="btn btn-primary btn-sm"
                :disabled="!newComment.trim() || addingComment"
              >
                <font-awesome-icon v-if="addingComment" icon="spinner" spin />
                <font-awesome-icon v-else icon="paper-plane" />
                {{ addingComment ? 'Mengirim...' : 'Kirim' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { taskService } from '@/api/services/taskService';
import { commentService } from '@/api/services/commentService';
import { useAuthStore } from '@/stores/auth';
import { errorToast, successToast } from '@/utils/toast';

// Props
const props = defineProps({
  show: {
    type: Boolean,
    default: false
  },
  task: {
    type: Object,
    default: () => ({})
  },
  taskStatuses: {
    type: Array,
    default: () => []
  },
  taskPriorities: {
    type: Array,
    default: () => []
  },
  projectMembers: {
    type: Array,
    default: () => []
  }
});

// Emits
const emit = defineEmits(['close', 'task-updated', 'task-deleted']);

// Stores
const authStore = useAuthStore();

// Reactive data
// ensure taskData always has flat fields used by the template to avoid undefined reads
const taskData = ref({
  id: null,
  uuid: null,
  title: '',
  description: '',
  status_id: null,
  priority_id: null,
  due_date: null,
  assignees: []
});
const originalTaskData = ref({});
const isModified = ref(false);
const saving = ref(false);
const showAssigneeSelector = ref(false);

// Comments
const comments = ref([]);
const newComment = ref('');
const loadingComments = ref(false);
const addingComment = ref(false);

// Computed
const currentUser = computed(() => authStore.user);

// Track last opened task to avoid double-initialization
const lastOpenTaskId = ref(null);

const availableMembers = computed(() => {
  if (!props.projectMembers || !taskData.value.assignees) return props.projectMembers;
  
  const assignedIds = taskData.value.assignees.map(a => a.user_id);
  const returnValue = props.projectMembers.filter(member => !assignedIds.includes(member.id));
  console.log('Available members:', returnValue);
  return returnValue;
});

// Methods
const initializeTaskData = async () => {
  // Initialize when we have either numeric id or uuid (some contexts only provide uuid)
  const id = props.task?.uuid || props.task?.id;

  if (!props.task || (!props.task.id && !props.task.uuid)) {
    return;
  }

  try {
    // Always fetch fresh data from API
    const response = await taskService.get(props.task.uuid || props.task.id);
    const freshTaskData = response.data.data || response.data;
    
    // Use fresh data from API and normalize flat fields
    taskData.value = {
      id: freshTaskData.id || freshTaskData.uuid || null,
      uuid: freshTaskData.uuid || null,
      title: freshTaskData.title || '',
      description: freshTaskData.description || '',
      status_id: freshTaskData.status_id || freshTaskData.status?.status_id || freshTaskData.status?.id || null,
      priority_id: freshTaskData.priority_id || freshTaskData.priority?.priority_id || freshTaskData.priority?.id || null,
      due_date: freshTaskData.due_date || freshTaskData.dueDate || null,
      assignees: (freshTaskData.assignees || []).map(a => ({ user_id: a.user_id || a.id, name: a.name || a.full_name || null, avatar: a.avatar || null }))
    };
    originalTaskData.value = { ...taskData.value, assignees: [...(taskData.value.assignees || [])] };
    isModified.value = false;
    lastOpenTaskId.value = id || null;

    // Load comments when task is set
    loadComments();
  } catch (error) {
    console.error('Error fetching fresh task data:', error);
    // Fallback to props data if API fails - normalize flat fields
    const p = props.task || {};
    taskData.value = {
      id: p.id || p.uuid || null,
      uuid: p.uuid || null,
      title: p.title || '',
      description: p.description || '',
      status_id: p.status_id || p.status?.status_id || p.status?.id || null,
      priority_id: p.priority_id || p.priority?.priority_id || p.priority?.id || null,
      due_date: p.due_date || p.dueDate || null,
      assignees: (p.assignees || []).map(a => ({ user_id: a.user_id || a.id, name: a.name || a.full_name || null, avatar: a.avatar || null }))
    };
    originalTaskData.value = { ...taskData.value, assignees: [...(taskData.value.assignees || [])] };
    isModified.value = false;
    lastOpenTaskId.value = id || null;

    console.log('Fallback to props task data:', taskData.value);
    
    // Load comments when task is set
    loadComments();
  }
};

const markAsModified = () => {
  isModified.value = true;
};

// Normalize due_date for <input type="date"> which requires yyyy-MM-dd.
// This computed provides a safe view for the date input while preserving
// the original datetime string (including time) in taskData.value.due_date.
const dueDateModel = computed({
  get() {
    const v = taskData.value.due_date;
    if (!v) return null;

    // If it's already in YYYY-MM-DD format, return as-is
    // Otherwise try to parse common datetime formats and return yyyy-MM-dd
    // Accepts: 'YYYY-MM-DD', 'YYYY-MM-DD HH:mm:ss', ISO strings, etc.
    // Use Date to parse ISO-like strings; for 'YYYY-MM-DD HH:mm:ss' replace space with 'T'
    if (/^\d{4}-\d{2}-\d{2}$/.test(v)) return v;

    let d = null;
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(v)) {
      d = new Date(v.replace(' ', 'T'));
    } else {
      d = new Date(v);
    }

    if (isNaN(d.getTime())) return null;

    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  },
  set(val) {
    if (!val) {
      taskData.value.due_date = null;
      markAsModified();
      return;
    }

    // val is in yyyy-MM-dd. Try to preserve time component if original had one.
    const original = taskData.value.due_date;
    let timePart = '';
    if (original) {
      // Try to extract time from original like 'YYYY-MM-DD HH:mm:ss' or ISO
      const m = original.match(/(\d{2}:\d{2}:\d{2})$/);
      if (m) timePart = ` ${m[1]}`;
      else {
        const isoMatch = original.match(/T(\d{2}:\d{2}:\d{2})/);
        if (isoMatch) timePart = ` ${isoMatch[1]}`;
      }
    }

    taskData.value.due_date = `${val}${timePart}`.trim();
    markAsModified();
  }
});

const closeModal = () => {
  if (isModified.value) {
    if (confirm('Anda memiliki perubahan yang belum disimpan. Yakin ingin menutup?')) {
      emit('close');
    }
  } else {
    emit('close');
  }
};

const saveTask = async () => {
  try {
    saving.value = true;
    
    const payload = {
      title: taskData.value.title,
      description: taskData.value.description,
      status_id: taskData.value.status_id,
      priority_id: taskData.value.priority_id,
      due_date: taskData.value.due_date,
      assignees: taskData.value.assignees?.map(a => a.user_id) || []
    };

    const response = await taskService.update(taskData.value.uuid, payload);
    
    originalTaskData.value = { ...taskData.value, assignees: [...(taskData.value.assignees || [])] };
    isModified.value = false;
    
    successToast('Tugas berhasil diperbarui');
    emit('task-updated', response.data);
    
  } catch (error) {
    console.error('Error updating task:', error);
    errorToast('Gagal memperbarui tugas');
  } finally {
    saving.value = false;
  }
};

const cancelChanges = () => {
  taskData.value = { ...originalTaskData.value, assignees: [...(originalTaskData.value.assignees || [])] };
  isModified.value = false;
};

const deleteTask = async () => {
  if (confirm('Yakin ingin menghapus tugas ini? Tindakan ini tidak dapat dibatalkan.')) {
    try {
      saving.value = true;
      await taskService.remove(taskData.value.uuid);
      
      successToast('Tugas berhasil dihapus');
      emit('task-deleted', taskData.value.id);
      emit('close');
      
    } catch (error) {
      console.error('Error deleting task:', error);
      errorToast('Gagal menghapus tugas');
    } finally {
      saving.value = false;
    }
  }
};

const addAssignee = (member) => {
  if (!taskData.value.assignees) {
    taskData.value.assignees = [];
  }
  
  if (!taskData.value.assignees.find(a => a.user_id === member.user_id)) {
    taskData.value.assignees.push({
      user_id: member.user_id,
      name: member.user_name,
      email: member.user_email
    });
    markAsModified();
  }
  
  showAssigneeSelector.value = false;
};

const removeAssignee = (memberId) => {
  if (taskData.value.assignees) {
    taskData.value.assignees = taskData.value.assignees.filter(a => a.user_id !== memberId);
    markAsModified();
  }
};

// Comments methods
const loadComments = async () => {
  const identifier = taskData.value.id || taskData.value.uuid;
  if (!identifier) return;

  try {
    loadingComments.value = true;
    const response = await taskService.getComments(identifier);
    comments.value = response.data.data || [];
  } catch (error) {
    console.error('Error loading comments:', error);
    comments.value = [];
  } finally {
    loadingComments.value = false;
  }
};

const addComment = async () => {
  if (!newComment.value.trim()) return;
  
  try {
    addingComment.value = true;
    
    const payload = {
      comment: newComment.value.trim(),
      task_id: taskData.value.id
    };
    
    const response = await commentService.create(payload);
    // Add the new comment to the beginning of the comments list
    // Response might be wrapped in data property, so handle both cases
    const newCommentData = response.data.data || response.data;
    comments.value.unshift(newCommentData);
    newComment.value = '';
    
    successToast('Komentar berhasil ditambahkan');
    
  } catch (error) {
    console.error('Error adding comment:', error);
    errorToast('Gagal menambahkan komentar');
  } finally {
    addingComment.value = false;
  }
};

const editComment = (comment) => {
  // TODO: Implement edit comment functionality
  console.log('Edit comment:', comment);
};

const deleteComment = async (commentId) => {
  if (confirm('Yakin ingin menghapus komentar ini?')) {
    try {
      await commentService.remove(commentId);
      
      // Remove comment from local array (check both id and uuid for compatibility)
      comments.value = comments.value.filter(c => c.id !== commentId && c.uuid !== commentId);
      
      successToast('Komentar berhasil dihapus');
    } catch (error) {
      console.error('Error deleting comment:', error);
      errorToast('Gagal menghapus komentar');
    }
  }
};

const canEditComment = (comment) => {
  return currentUser.value && comment.user && currentUser.value.id === comment.user.id;
};

// Helper methods
const getMemberInitials = (name) => {
  if (!name) return '';
  return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
};

const formatCommentDate = (dateString) => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const now = new Date();
  const diffInMinutes = Math.floor((now - date) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Baru saja';
  if (diffInMinutes < 60) return `${diffInMinutes} menit yang lalu`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} jam yang lalu`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 7) return `${diffInDays} hari yang lalu`;
  
  return date.toLocaleDateString('id-ID', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Watchers
// Combined watcher: initialize when modal is opened (show true) or when task changes
watch([
  () => props.show,
  () => props.task
], async ([show, task], [oldShow, oldTask]) => {
  const id = task?.uuid || task?.id;
  const oldId = oldTask?.uuid || oldTask?.id;

  // Initialize only when modal becomes visible, or when task prop changed to a different task
  if (show) {
    if (!oldShow && show) {
      // modal was just opened
      lastOpenTaskId.value = id || null;
      await initializeTaskData();
    } else if (id && id !== oldId) {
      // different task while modal visible
      lastOpenTaskId.value = id;
      await initializeTaskData();
    }
  } else if (oldShow && !show) {
    // modal was just closed - reset to allow fresh data on next open
    lastOpenTaskId.value = null;
  }
}, { immediate: true });
</script>

<style scoped>
.task-modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 5vh 5vw;
}

.task-modal {
  background: white;
  border-radius: 12px;
  width: 100%;
  height: 100%;
  max-width: none;
  max-height: none;
  display: flex;
  flex-direction: column;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: #6b7280;
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.btn-close:hover {
  color: #ef4444;
  background-color: #fef2f2;
}

.modal-content {
  display: flex;
  flex: 1;
  overflow: hidden;
}

.task-section {
  flex: 0 0 70%;
  padding: 2rem;
  overflow-y: auto;
  border-right: 1px solid #e5e7eb;
}

.comments-section {
  flex: 0 0 30%;
  display: flex;
  flex-direction: column;
  background-color: #f9fafb;
}

/* Task Form Styles */
.task-form {
  max-width: 100%;
}

.form-group {
  margin-bottom: 1.5rem;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.form-label {
  display: block;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
  font-size: 0.875rem;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-textarea {
  resize: vertical;
  min-height: 120px;
}

/* Assignees */
.assignees-section > * + * {
  margin-top: 1rem;
}

.current-assignees {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.assignee-tag {
  display: flex;
  align-items: center;
  background-color: #f3f4f6;
  border: 1px solid #d1d5db;
  border-radius: 20px;
  padding: 0.25rem 0.75rem 0.25rem 0.25rem;
  gap: 0.5rem;
}

.assignee-avatar,
.member-avatar,
.user-avatar,
.comment-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.assignee-avatar img,
.member-avatar img,
.user-avatar img,
.comment-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.assignee-avatar-fallback,
.member-avatar-fallback,
.user-avatar-fallback,
.comment-avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #3b82f6;
  color: white;
  font-size: 0.625rem;
  font-weight: 500;
}

.assignee-name,
.member-name {
  font-size: 0.75rem;
  color: #374151;
}

.remove-assignee {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.125rem;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.remove-assignee:hover {
  color: #ef4444;
  background-color: #fef2f2;
}

.assignee-selector {
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: white;
  max-height: 200px;
  overflow-y: auto;
  margin-top: 0.5rem;
}

.member-option {
  display: flex;
  align-items: center;
  padding: 0.75rem;
  gap: 0.75rem;
  cursor: pointer;
  transition: background-color 0.2s;
}

.member-option:hover {
  background-color: #f3f4f6;
}

.member-option:not(:last-child) {
  border-bottom: 1px solid #f3f4f6;
}

/* Form Actions */
.form-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 2rem;
  border-top: 1px solid #e5e7eb;
}

/* Comments Styles */
.comments-header {
  padding: 1.5rem 1.5rem 1rem;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.comments-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
}

.comment-count {
  font-size: 0.875rem;
  color: #6b7280;
  font-weight: 400;
}

.add-comment-form {
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  flex-shrink: 0;
}

.comment-input-group {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
}

.comment-input {
  flex: 1;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  resize: vertical;
  min-height: 60px;
}

.comment-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.comment-actions {
  display: flex;
  justify-content: flex-end;
}

.comments-list {
  flex: 1;
  overflow-y: auto;
  padding: 1rem 0;
}

.comments-list .comments-container {
  padding-bottom: 1rem; /* ensure space at bottom */
}

.add-comment-form {
  flex-shrink: 0;
  padding: 1rem 1.5rem;
  background: transparent;
}

.add-comment-form.sticky {
  position: sticky;
  bottom: 0;
  background: inherit;
}

.comments-loading,
.comments-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  color: #6b7280;
  text-align: center;
}

.comments-empty .empty-icon {
  color: #d1d5db;
  margin-bottom: 1rem;
}

.comments-empty .text-sm {
  font-size: 0.75rem;
  margin-top: 0.25rem;
}

.comments-container {
  padding: 0 1.5rem;
}

.comment-item {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1.5rem;
}

.comment-content {
  flex: 1;
  min-width: 0;
}

.comment-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 0.25rem;
}

.comment-author {
  font-weight: 500;
  color: #111827;
  font-size: 0.875rem;
}

.comment-time {
  font-size: 0.75rem;
  color: #6b7280;
}

.comment-body {
  margin-bottom: 0.5rem;
}

.comment-body p {
  margin: 0;
  font-size: 0.875rem;
  color: #374151;
  line-height: 1.5;
  word-wrap: break-word;
}

.comment-actions {
  display: flex;
  gap: 0.5rem;
}

.comment-action-btn {
  background: none;
  border: none;
  color: #6b7280;
  cursor: pointer;
  padding: 0.25rem;
  border-radius: 4px;
  transition: all 0.2s;
}

.comment-action-btn:hover {
  color: #374151;
  background-color: #f3f4f6;
}

.comment-action-btn.delete:hover {
  color: #ef4444;
  background-color: #fef2f2;
}

/* Button Styles */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  border: 1px solid transparent;
  border-radius: 6px;
  font-size: 0.875rem;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-sm {
  padding: 0.5rem 0.75rem;
  font-size: 0.75rem;
}

.btn-primary {
  background-color: #3b82f6;
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background-color: #2563eb;
}

.btn-secondary {
  background-color: #6b7280;
  color: white;
}

.btn-secondary:hover:not(:disabled) {
  background-color: #374151;
}

.btn-danger {
  background-color: #ef4444;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background-color: #dc2626;
}

.btn-outline {
  background-color: transparent;
  color: #6b7280;
  border-color: #d1d5db;
}

.btn-outline:hover:not(:disabled) {
  background-color: #f3f4f6;
  color: #374151;
}

/* Loading spinner */
.loading-spinner {
  width: 20px;
  height: 20px;
  border: 2px solid #f3f4f6;
  border-top: 2px solid #3b82f6;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-spinner.small {
  width: 16px;
  height: 16px;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Dark mode support */
html.dark .task-modal {
  background-color: #1f2937;
  color: #f9fafb;
}

html.dark .modal-header {
  border-bottom-color: #374151;
}

html.dark .modal-title {
  color: #f9fafb;
}

html.dark .task-section {
  border-right-color: #374151;
}

html.dark .comments-section {
  background-color: #111827;
}

html.dark .comments-header {
  border-bottom-color: #374151;
}

html.dark .add-comment-form {
  border-bottom-color: #374151;
}

html.dark .form-label {
  color: #d1d5db;
}

html.dark .form-input,
html.dark .form-textarea,
html.dark .form-select {
  background-color: #374151;
  border-color: #4b5563;
  color: #f9fafb;
}

html.dark .form-input:focus,
html.dark .form-textarea:focus,
html.dark .form-select:focus {
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
}

html.dark .assignee-name,
html.dark .member-name {
  color: #d1d5db;
}

html.dark .assignee-tag {
  background-color: #374151;
  border-color: #4b5563;
}

html.dark .assignee-selector {
  background-color: #374151;
  border-color: #4b5563;
}

html.dark .member-option:hover {
  background-color: #4b5563;
}

html.dark .comment-input {
  background-color: #374151;
  border-color: #4b5563;
  color: #f9fafb;
}

html.dark .form-actions {
  border-top-color: #374151;
}

html.dark .comment-author {
  color: #f9fafb;
}

html.dark .comment-time {
  color: #9ca3af;
}

html.dark .comment-body p {
  color: #d1d5db;
}

html.dark .comments-title {
  color: #f9fafb;
}

html.dark .comment-count {
  color: #9ca3af;
}

/* Responsive */
@media (max-width: 1024px) {
  .task-modal-overlay {
    padding: 2vh 2vw;
  }
  
  .modal-content {
    flex-direction: column;
  }
  
  .task-section {
    flex: none;
    border-right: none;
    border-bottom: 1px solid #e5e7eb;
    max-height: 60vh;
  }
  
  .comments-section {
    flex: none;
    height: 40vh;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .task-modal-overlay {
    padding: 1vh 1vw;
  }
  
  .modal-header {
    padding: 1rem;
  }
  
  .task-section {
    padding: 1rem;
  }
  
  .form-actions {
    flex-direction: column;
  }
}
</style>