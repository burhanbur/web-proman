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
            <button class="btn btn-secondary" @click="openInviteModal" v-show="activeTab === 'members'" :disabled="!canInviteMembers">
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
              <!-- <button class="btn btn-primary" @click="showCreateProjectModal = true">
                <font-awesome-icon icon="plus" size="sm" />
                Buat Proyek
              </button> -->
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
            <div v-if="members.length === 0" class="empty-state">
              <font-awesome-icon icon="users" size="3x" class="empty-icon" />
              <h3>Belum ada anggota terbaru</h3>
              <p>Anggota akan muncul di sini ketika anggota ditambahkan pada workspace</p>
              <div style="margin-top: 16px;">
                <button class="btn btn-primary" @click="openInviteModal" v-if="canInviteMembers">
                  <font-awesome-icon icon="user-plus" size="sm" />
                  Undang Anggota
                </button>
              </div>
            </div>

            <div v-else class="members-list">
              <div 
                v-for="(member, i) in members" 
                :key="getMemberKey(member) || i"
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
                  <div class="member-actions-menu">
                    <button class="btn-icon" title="Menu" @click.stop="toggleMemberMenu(getMemberKey(member) || i)">
                      <font-awesome-icon icon="ellipsis-vertical" size="sm" />
                    </button>
                    <div v-if="menuOpenFor === (getMemberKey(member) || i)" class="member-menu-dropdown" @click.stop>
                      <button class="dropdown-item" @click="openEditMemberModal(member)" v-if="canInviteMembers">Edit Peran</button>
                      <button class="dropdown-item text-danger" @click="openRemoveMemberModal(member)" v-if="canInviteMembers">Hapus</button>
                    </div>
                  </div>
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

              <!-- Danger zone: delete workspace -->
              <div class="settings-danger">
                <h4>Hapus Workspace</h4>
                <p class="muted">Menghapus workspace akan menghapus semua data terkait (proyek, tugas, anggota) secara permanen.</p>
                <button class="btn btn-danger" @click="openDeleteWorkspaceModal" :disabled="!canDeleteWorkspace">
                  <font-awesome-icon icon="trash" /> Hapus Workspace
                </button>
              </div>
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

    <!-- Invite Members Modal -->
  <div v-if="showInviteModal" class="modal-overlay" @click="closeInviteModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>Undang Anggota</h3>
          <button class="btn-close" @click="closeInviteModal">
            <font-awesome-icon icon="times" />
          </button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label for="inviteUser" class="form-label">Pilih Pengguna</label>
            <select id="inviteUser" v-model="inviteUserId" class="form-input">
              <option value="">-- Pilih Pengguna --</option>
              <option 
                v-for="u in users" 
                :key="u.id || u.email" 
                :value="u.id"
                :disabled="isUserMember(u)"
              >
                {{ u.name }} — {{ u.email }}
                <span v-if="isUserMember(u)"> (sudah anggota)</span>
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="inviteRole" class="form-label">Pilih Peran Workspace</label>
            <select id="inviteRole" v-model.number="inviteRoleId" class="form-input">
              <option value="">-- Pilih Peran --</option>
              <option v-for="r in workspaceRoles" :key="r.id" :value="r.id">{{ r.name }}</option>
            </select>
            <small class="muted">Peran akan disimpan di tabel workspace_users (workspace_role_id).</small>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeInviteModal" :disabled="inviting">Batal</button>
          <button class="btn btn-primary" @click="sendInvite" :disabled="inviting || !inviteUserId || !inviteRoleId">
            <font-awesome-icon v-if="inviting" icon="spinner" spin />
            <font-awesome-icon v-else icon="paper-plane" />
            {{ inviting ? 'Mengirim...' : 'Kirim Undangan' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Member Modal -->
    <div v-if="showEditMemberModal" class="modal-overlay" @click="showEditMemberModal = false">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>Edit Peran Anggota</h3>
          <button class="btn-close" @click="showEditMemberModal = false"><font-awesome-icon icon="times" /></button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label class="form-label">Pengguna</label>
            <div>{{ editMember?.name || editMember?.email || editMember?.user?.name }}</div>
          </div>
          <div class="form-group">
            <label class="form-label">Pilih Peran</label>
            <select v-model.number="editMemberWorkspaceRoleId" class="form-input">
              <option v-for="r in workspaceRoles" :key="r.id" :value="r.id">{{ r.name }}</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showEditMemberModal = false">Batal</button>
          <button class="btn btn-primary" @click="updateMemberRole" :disabled="updatingMember">Simpan</button>
        </div>
      </div>
    </div>

    <!-- Remove Member Modal -->
    <div v-if="showRemoveMemberModal" class="modal-overlay" @click="showRemoveMemberModal = false">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>Hapus Anggota</h3>
          <button class="btn-close" @click="showRemoveMemberModal = false"><font-awesome-icon icon="times" /></button>
        </div>
        <div class="modal-body">
          <p>Hapus anggota <strong>{{ removeMemberTarget?.name || removeMemberTarget?.email }}</strong> dari workspace ini?</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showRemoveMemberModal = false">Batal</button>
          <button class="btn btn-danger" @click="confirmRemoveMember" :disabled="removingMember">Hapus</button>
        </div>
      </div>
    </div>

    <!-- Delete Workspace Modal -->
    <div v-if="showDeleteWorkspaceModal" class="modal-overlay" @click="closeDeleteWorkspaceModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Hapus Workspace</h3>
          <button class="modal-close" @click="closeDeleteWorkspaceModal">
            <font-awesome-icon icon="times" size="sm" />
          </button>
        </div>

        <div class="modal-body">
          <p>Apakah Anda yakin ingin menghapus workspace <strong>{{ workspace.name }}</strong>? Tindakan ini tidak dapat dibatalkan dan akan menghapus secara permanen:</p>
          <ul>
            <li>Semua proyek dan tugas dalam workspace</li>
            <li>Catatan dan lampiran workspace</li>
            <li>Keanggotaan dan pengaturan workspace</li>
            <li>Riwayat aktivitas workspace</li>
          </ul>
          
          <div class="form-group">
            <label class="form-label">Ketik "{{ deleteRequireMatch }}" untuk konfirmasi:</label>
            <input 
              v-model="deleteConfirmText" 
              type="text" 
              class="form-input"
              :placeholder="deleteRequireMatch"
            />
          </div>

          <div class="form-group">
            <label
              class="checkbox-option checkbox-inline"
              :class="{ disabled: deleteLoading }"
              aria-disabled="false"
            >
              <!-- visually-hidden native checkbox for form semantics and accessibility -->
              <input
                type="checkbox"
                v-model="acknowledgeDelete"
                class="sr-only"
                :disabled="deleteLoading"
                aria-label="Konfirmasi penghapusan workspace"
              />

              <!-- custom styled checkbox square with keyboard support -->
              <span
                class="custom-checkbox"
                role="checkbox"
                :aria-checked="acknowledgeDelete.toString()"
                tabindex="0"
                @keydown.space.prevent="acknowledgeDelete = !acknowledgeDelete"
                @keydown.enter.prevent="acknowledgeDelete = !acknowledgeDelete"
                @click.stop="acknowledgeDelete = !acknowledgeDelete"
              >
                <svg v-if="acknowledgeDelete" width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                  <path d="M20 6L9 17L4 12" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </span>

              <span class="checkbox-label">Saya memahami tindakan ini tidak dapat dibatalkan</span>
            </label>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeDeleteWorkspaceModal" :disabled="deleteLoading">Batal</button>
          <button 
            class="btn btn-danger" 
            :disabled="deleteLoading || deleteConfirmText.trim() !== String(deleteRequireMatch) || !acknowledgeDelete"
            @click="confirmDeleteWorkspace"
          >
            <font-awesome-icon v-if="deleteLoading" icon="spinner" spin />
            <font-awesome-icon v-else icon="trash" size="sm" />
            {{ deleteLoading ? 'Menghapus...' : 'Hapus Workspace' }}
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

// Delete workspace state
const showDeleteWorkspaceModal = ref(false);
const deleteConfirmText = ref('');
const deleteRequireMatch = ref(''); // will set to workspace.slug or workspace.name
const deleteLoading = ref(false);
const acknowledgeDelete = ref(false);

const canDeleteWorkspace = computed(() => {
  const user = authStore.user;
  if (!user || !workspace.value) return false;
  // Allow creator or system admin to delete
  const isCreator = workspace.value.created_by === user.id || workspace.value.created_by?.id === user.id;
  const roleCode = String(user.system_role?.code || '').toLowerCase();
  const isSysAdmin = roleCode === 'admin' || roleCode === 'system_admin' || user.system_role?.id === 1;
  return isCreator || isSysAdmin;
});

// Permission helpers for inviting members
const isSysAdmin = computed(() => {
  const user = authStore.user;
  if (!user) return false;
  const roleCode = String(user.system_role?.code || '').toLowerCase();
  return roleCode === 'admin' || roleCode === 'system_admin' || user.system_role?.id === 1;
});

const currentWorkspaceRole = computed(() => {
  const user = authStore.user;
  if (!user || !workspace.value) return null;
  // workspace.members might include the current user with role; try to find it
  const member = (workspace.value.members || []).find(m => m.user_id === user.id || m.id === user.id || m.user?.id === user.id);
  return member?.role || member?.workspace_role || null;
});

const canInviteMembers = computed(() => {
  if (!authStore.user) return false;
  if (isSysAdmin.value) return true;
  const role = (currentWorkspaceRole.value || '').toLowerCase();
  return role === 'workspace_owner' || role === 'workspace_admin';
});

// Invite members state
const users = ref([]);
const workspaceRoles = ref([]);
const inviteUserId = ref('');
const inviteRoleId = ref('');
const inviting = ref(false);

const openInviteModal = () => {
  inviteUserId.value = '';
  inviteRoleId.value = '';
  // fetch users and workspace roles when opening
  fetchUsers();
  fetchWorkspaceRoles();
  showInviteModal.value = true;
};

const closeInviteModal = () => {
  showInviteModal.value = false;
  inviting.value = false;
};

const sendInvite = async () => {
  if (!inviteUserId.value || !inviteRoleId.value) {
    errorToast('Pilih pengguna dan peran');
    return;
  }
  // prevent inviting an existing member
  const userAlreadyMember = users.value.find(u => String(u.id) === String(inviteUserId.value) && isUserMember(u));
  if (userAlreadyMember) {
    errorToast('Pengguna ini sudah menjadi anggota workspace');
    return;
  }
  inviting.value = true;
  try {
    const slug = workspace.value.slug;
    const payload = { user_id: inviteUserId.value, workspace_role_id: inviteRoleId.value };
    const res = await workspaceService.addMember(slug, payload);
    if (res.data && res.data.success) {
      successToast(res.data.message || 'Undangan terkirim');
      // refresh members list
      await loadMembers(slug);
      closeInviteModal();
    } else {
      errorToast(res.data?.message || 'Gagal mengirim undangan');
    }
  } catch (error) {
    console.error('Error sending invite:', error);
    const msg = error.response?.data?.message || 'Terjadi kesalahan saat mengirim undangan';
    errorToast(msg);
  } finally {
    inviting.value = false;
  }
};

const fetchUsers = async () => {
  try {
    const res = await (await import('@/api/services/userService')).userService.list();
    users.value = res.data.data || [];
  } catch (error) {
    console.error('Error fetching users:', error);
  }
};

const fetchWorkspaceRoles = async () => {
  try {
    const res = await workspaceService.getWorkspaceRoles();
    workspaceRoles.value = res.data.data || [];
  } catch (error) {
    console.error('Error fetching workspace roles:', error);
  }
};

// Edit / Remove member state
const editMember = ref(null);
const showEditMemberModal = ref(false);
const editMemberWorkspaceRoleId = ref(null);
const updatingMember = ref(false);

const removeMemberTarget = ref(null);
const showRemoveMemberModal = ref(false);
const removingMember = ref(false);

const openEditMemberModal = async (member) => {
  editMember.value = member;
  // ensure roles available
  if (!workspaceRoles.value || workspaceRoles.value.length === 0) await fetchWorkspaceRoles();
  // try to find current workspace role id from member
  editMemberWorkspaceRoleId.value = member.workspace_role_id || member.role_id || member.workspace_role?.id || null;
  showEditMemberModal.value = true;
};

const updateMemberRole = async () => {
  if (!editMember.value) return;
  if (!editMemberWorkspaceRoleId.value) { errorToast('Pilih peran'); return; }
  updatingMember.value = true;
  try {
    const slug = workspace.value.slug;
    const payload = { user_id: editMember.value.id || editMember.value.user_id || editMember.value.user?.id, workspace_role_id: editMemberWorkspaceRoleId.value };
    const res = await workspaceService.updateMember(slug, payload);
    if (res.data && res.data.success) {
      successToast(res.data.message || 'Peran anggota diperbarui');
      await loadMembers(slug);
      showEditMemberModal.value = false;
    } else {
      errorToast(res.data?.message || 'Gagal memperbarui peran');
    }
  } catch (error) {
    console.error('Error updating member:', error);
    errorToast(error.response?.data?.message || 'Terjadi kesalahan');
  } finally {
    updatingMember.value = false;
  }
};

const openRemoveMemberModal = (member) => {
  removeMemberTarget.value = member;
  showRemoveMemberModal.value = true;
};

const confirmRemoveMember = async () => {
  if (!removeMemberTarget.value) return;
  removingMember.value = true;
  try {
    const slug = workspace.value.slug;
  const payload = { user_id: removeMemberTarget.value.id || removeMemberTarget.value.user_id || removeMemberTarget.value.user?.id, workspace_id: workspace.value.id };
  const res = await workspaceService.removeMember(slug, payload);
    if (res.data && res.data.success) {
      successToast(res.data.message || 'Anggota dihapus');
      await loadMembers(slug);
      showRemoveMemberModal.value = false;
    } else {
      errorToast(res.data?.message || 'Gagal menghapus anggota');
    }
  } catch (error) {
    console.error('Error removing member:', error);
    errorToast(error.response?.data?.message || 'Terjadi kesalahan');
  } finally {
    removingMember.value = false;
  }
};


// menu for member actions
const menuOpenFor = ref(null);
const toggleMemberMenu = (memberId) => {
  menuOpenFor.value = menuOpenFor.value === memberId ? null : memberId;
};


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

const openDeleteWorkspaceModal = () => {
  // set required confirmation text to workspace slug (prefer slug for uniqueness)
  deleteRequireMatch.value = workspace.value?.slug || workspace.value?.name || '';
  deleteConfirmText.value = '';
  acknowledgeDelete.value = false;
  showDeleteWorkspaceModal.value = true;
};

const closeDeleteWorkspaceModal = () => {
  showDeleteWorkspaceModal.value = false;
  deleteConfirmText.value = '';
  deleteLoading.value = false;
  acknowledgeDelete.value = false;
};

const confirmDeleteWorkspace = async () => {
  if (!canDeleteWorkspace.value) {
    errorToast('Anda tidak memiliki izin untuk menghapus workspace ini');
    return;
  }

  // require exact match
  if (!deleteConfirmText.value || deleteConfirmText.value.trim() !== String(deleteRequireMatch.value)) {
    errorToast('Konfirmasi tidak sesuai. Ketik slug workspace untuk mengonfirmasi.');
    return;
  }

  // require explicit extra check: user must check a final confirmation (we'll reuse an input check by requiring exact match above)
  deleteLoading.value = true;
  try {
    const slug = workspace.value.slug;
    const res = await workspaceService.remove(slug);
    if (res.data && (res.data.success || res.status === 200 || res.status === 204)) {
      successToast(res.data?.message || 'Workspace berhasil dihapus');
      closeDeleteWorkspaceModal();
      // redirect to dashboard
      router.push('/dashboard');
    } else {
      errorToast(res.data?.message || 'Gagal menghapus workspace');
    }
  } catch (error) {
    console.error('Error deleting workspace:', error);
    const msg = error.response?.data?.message || 'Terjadi kesalahan saat menghapus workspace';
    errorToast(msg);
  } finally {
    deleteLoading.value = false;
  }
};

const loadNotes = async (workspaceId) => {
  try {
    const response = await noteService.list({ model_type: 'workspace', model_id: workspaceId });
    notes.value = response.data.data || [];
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

// Resolve a stable key for member objects - different API shapes may use id, user_id, or user.id
const getMemberKey = (member) => {
  if (!member) return null;
  return member.id || member.user_id || member.user?.id || null;
};

// Check if a user object is already a member of the workspace
const isUserMember = (user) => {
  if (!user || !members.value) return false;
  const uid = user.id || user.user_id || user.user?.id || null;
  if (!uid) return false;
  return members.value.some(m => {
    const mid = getMemberKey(m);
    return String(mid) === String(uid) || String(m.email || m.user?.email) === String(user.email);
  });
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

.member-actions-menu { position: relative; }
.member-menu-dropdown {
  position: absolute;
  right: 0;
  top: 36px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.12);
  z-index: 1200;
  min-width: 140px;
  padding: 8px 0;
}
.member-menu-dropdown .dropdown-item {
  display: block;
  width: 100%;
  padding: 8px 12px;
  background: transparent;
  border: none;
  text-align: left;
  cursor: pointer;
  color: var(--color-text);
}
.member-menu-dropdown .dropdown-item:hover { background: var(--color-background-soft); }
.member-menu-dropdown .text-danger { color: #dc3545; }

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

/* Added styles: settings danger, modal, danger button */
.settings-danger {
  margin-top: 32px;
  padding: 24px;
  border-radius: 12px;
  background: var(--color-background-soft);
  border: 1px solid #dc3545;
  overflow: hidden;
}

.settings-danger h4 {
  display: flex;
  align-items: center;
  gap: 8px;
  margin: 0 0 8px 0;
  font-size: 16px;
  font-weight: 600;
  color: #dc3545;
}

.settings-danger p {
  font-size: 14px;
  color: var(--color-muted);
  margin: 0 0 16px 0;
  line-height: 1.4;
}

.btn-danger {
  background: #dc3545;
  color: white;
  border: none;
  padding: 12px 20px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
  transform: translateY(-1px);
}

.btn-danger:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* Modal Overlay */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
}

/* Modal Content */
.modal-content {
  background: var(--color-background);
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow: auto;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 24px;
  border-bottom: 1px solid var(--color-border);
}

.modal-header h3 {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.modal-close {
  background: none;
  border: none;
  color: var(--color-muted);
  cursor: pointer;
  padding: 8px;
  border-radius: 4px;
  transition: background-color 0.2s ease;
}

.modal-close:hover {
  background: var(--color-border);
}

.modal-body {
  padding: 24px;
}

.modal-body p {
  font-size: 14px;
  color: var(--color-text);
  margin: 0 0 16px 0;
  line-height: 1.5;
}

.modal-body ul {
  margin: 0 0 24px 0;
  padding-left: 20px;
}

.modal-body li {
  font-size: 14px;
  color: var(--color-muted);
  margin-bottom: 4px;
}

.modal-footer {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
  padding: 24px;
  border-top: 1px solid var(--color-border);
}

/* Form Elements in Modal */
.form-group {
  margin-bottom: 20px;
}

.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: 8px;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background-soft);
  color: var(--color-text);
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary-500);
}

/* Checkbox Styling - Following ProfilePage pattern */
.checkbox-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  margin: 0;
}

.checkbox-option input[type="checkbox"] {
  margin: 0;
  cursor: pointer;
}

.checkbox-label {
  display: flex;
  align-items: center;
  font-size: 14px;
  color: var(--color-text);
  cursor: pointer;
  margin: 0;
}

/* Inline variant: keep checkbox and text on same line */
.checkbox-option.checkbox-inline {
  display: inline-flex;
  align-items: center;
  gap: 12px;
}

.checkbox-option.checkbox-inline .checkbox-label {
  display: inline-block;
  line-height: 1.3;
}

/* Accessibility: visually hidden helper */
.sr-only {
  position: absolute !important;
  width: 1px !important;
  height: 1px !important;
  padding: 0 !important;
  margin: -1px !important;
  overflow: hidden !important;
  clip: rect(0, 0, 0, 0) !important;
  white-space: nowrap !important;
  border: 0 !important;
}

/* Custom checkbox square */
.custom-checkbox {
  width: 20px;
  height: 20px;
  min-width: 20px;
  border-radius: 6px;
  background: var(--color-background);
  border: 2px solid var(--color-border);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s ease;
  box-sizing: border-box;
  cursor: pointer;
}

.custom-checkbox svg { display: block; }

.checkbox-option .custom-checkbox:focus,
.checkbox-option .custom-checkbox:focus-visible {
  outline: none;
  box-shadow: 0 0 0 4px rgba(220,53,69,0.12);
  border-color: #dc3545;
}

.checkbox-option .custom-checkbox:hover {
  border-color: #c82333;
}

.checkbox-option .custom-checkbox[aria-checked="true"] {
  background: #dc3545;
  border-color: #dc3545;
}

.checkbox-option.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.checkbox-option.disabled .custom-checkbox { cursor: not-allowed; }

/* Button Styles */
.btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 12px 20px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: var(--color-background);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover:not(:disabled) {
  background: var(--color-border);
  transform: translateY(-1px);
}

/* Responsive Modal */
@media (max-width: 768px) {
  .modal-overlay {
    padding: 16px;
  }
  
  .modal-footer {
    flex-direction: column;
    gap: 8px;
  }
  
  .modal-footer .btn {
    width: 100%;
    justify-content: center;
  }
}
</style>
