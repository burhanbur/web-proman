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
                <!-- (Task summary moved to header actions for better layout) -->
              </div>
              <!-- summary moved to header actions (right side) -->
            </div>
          </div>
        </div>
        <div class="project-actions header-actions">
          <div class="summary-cta">
            <div class="task-summary header-right" role="status" aria-label="Ringkasan tugas proyek">
              <div class="task-summary-top">
                <div class="summary-left">
                  <div class="summary-number">{{ tasksCompleted }} / {{ tasksTotal - tasksCancelled }}</div>
                  <div class="summary-label">Tugas Selesai</div>
                </div>
                <div class="summary-percent">
                  <div class="percent">{{ tasksCompletedPercent }}%</div>
                </div>
              </div>
              <div class="progress-bar" aria-hidden>
                <div class="progress-fill" :style="{ width: `${tasksCompletedPercent}%` }"></div>
              </div>
              <div class="summary-breakdown">
                <span class="badge completed">Selesai: {{ tasksCompleted }}</span>
                <span class="badge incomplete">Belum: {{ tasksIncomplete }}</span>
                <span class="badge cancelled">Dibatalkan: {{ tasksCancelled }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

  <!-- (Removed centered summary; inline summary will appear in project-meta) -->

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
        <!-- Timeline tab removed per request -->
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
        <button 
          :class="['nav-item', { active: activeView === 'notes' }]"
          @click="(activeView = 'notes', loadNotes(project.id))"
        >
          <font-awesome-icon icon="sticky-note" size="sm" />
          Catatan
        </button>
        <button 
          :class="['nav-item', { active: activeView === 'settings' }]"
          @click="(activeView = 'settings', loadProjectStatuses(), fillSettingsFromProject())"
        >
          <font-awesome-icon icon="gear" size="sm" />
          Pengaturan
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
                <button class="btn-icon" @click="openCreateTaskModal(status.id)">
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
                  @touchstart.passive="handleTouchStart($event, task)"
                  @touchmove.passive="handleTouchMove"
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
                    {{ truncateText(task.description, 100) }}
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
              <span>Memperbarui status proyek...</span>
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
                <option v-for="member in project.members" :key="member.user_id" :value="member.user_id">
                  {{ member.user_name }}
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
            <div class="list-actions">
              <button class="btn btn-primary" @click="openCreateTaskModal()">
                <font-awesome-icon icon="plus" size="sm" />
                Tugas Baru
              </button>
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

        <!-- Timeline view removed -->


        <!-- Members Tab -->
        <div v-if="activeView === 'members'" class="members-view">
          <div class="members-header">
            <h3>Anggota Proyek</h3>
            <div v-if="canInviteMembers">
              <button class="btn btn-primary" @click="openInviteModal">
                <font-awesome-icon icon="plus" />
                Undang Anggota
              </button>
            </div>
          </div>

          <div class="members-list">
            <div v-if="!projectMembers.length" class="empty-state">
              <font-awesome-icon icon="users" size="3x" class="empty-icon" />
              <h3>Belum ada anggota</h3>
              <p>Undang anggota untuk berkolaborasi dalam proyek ini.</p>
            </div>

            <div v-for="member in projectMembers" :key="member.id" class="member-item">
              <div class="member-info">
                <div class="member-avatar">
                  <img v-if="member.avatar" :src="member.avatar" :alt="member.name" />
                  <div v-else class="member-avatar-fallback">{{ getMemberInitials(member.name) }}</div>
                </div>
                <div class="member-details">
                  <div class="member-name">{{ member.name }}</div>
                  <div class="member-email">{{ member.email }}</div>
                  <div class="member-role">
                    <span class="role-badge" :class="(getMemberRole(member) || '').toLowerCase()">
                      {{ getMemberRole(member) || 'Anggota' }}
                    </span>
                  </div>
                </div>
              </div>
              <div class="member-actions">
                <div class="member-actions-menu">
                  <button class="btn-icon" @click="toggleMemberMenu(member.id)" :aria-expanded="menuOpenFor === member.id">
                    <font-awesome-icon icon="ellipsis-vertical" size="sm" />
                  </button>
                  <div v-if="menuOpenFor === member.id" class="member-menu-dropdown">
                    <button class="dropdown-item" @click="openEditMemberModal(member)" v-if="canManageMembers">
                      <font-awesome-icon icon="edit" />
                      Edit Role
                    </button>
                    <button 
                      class="dropdown-item text-danger" 
                      @click="openRemoveMemberModal(member)"
                      v-if="canRemoveMember(member)"
                    >
                      <font-awesome-icon icon="trash" />
                      Hapus Anggota
                    </button>
                  </div>
                </div>
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

        <!-- Notes View -->
        <div v-if="activeView === 'notes'" class="notes-view">
          <div class="notes-container">
            <div class="notes-header">
              <h3>Catatan Proyek</h3>
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

              <div v-else>
                <div class="note-card" v-for="note in notes" :key="note.id">
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
                    <div class="note-content" v-html="note.content"></div>

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

        <!-- Files / Berkas View -->
        <div v-if="activeView === 'files'" class="files-view">
          <!-- Files Header -->
          <div class="files-header">
            <div class="files-header-content">
              <div class="files-title-section">
                <h3 class="files-title">Berkas Proyek</h3>
                <p class="files-subtitle">
                  {{ attachmentsList.length }} berkas • Semua lampiran dari proyek ini
                </p>
              </div>
              <div class="files-controls">
                <div class="search-box">
                  <font-awesome-icon icon="search" class="search-icon" />
                  <input 
                    type="text" 
                    v-model="fileSearchQuery"
                    placeholder="Cari berkas..." 
                    class="search-input"
                  />
                </div>
                <select v-model="fileTypeFilter" class="type-filter">
                  <option value="">Semua</option>
                  <option value="image">Gambar</option>
                  <option value="document">Dokumen</option>
                  <option value="archive">Arsip</option>
                  <option value="other">Lainnya</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Files Content -->
          <div class="files-content">
            <!-- Loading State -->
            <div v-if="loadingAttachments" class="files-loading">
              <div class="loading-spinner"></div>
              <p>Memuat berkas...</p>
            </div>

            <!-- Empty State -->
            <div v-else-if="filteredAttachments.length === 0" class="files-empty">
              <div class="empty-icon">
                <font-awesome-icon icon="folder-open" size="2x" />
              </div>
              <h4 class="empty-title">
                {{ attachmentsList.length === 0 ? 'Belum ada berkas' : 'Tidak ditemukan' }}
              </h4>
              <p class="empty-text">
                {{ attachmentsList.length === 0 
                  ? 'Berkas akan muncul di sini ketika ditambahkan ke tugas atau komentar.' 
                  : 'Coba ubah kata kunci atau filter untuk menemukan berkas.' 
                }}
              </p>
              <button v-if="fileSearchQuery || fileTypeFilter" @click="clearFilters" class="btn btn-outline">
                Hapus Filter
              </button>
            </div>

            <!-- Files Grid -->
            <div v-else class="files-grid">
              <div 
                v-for="file in filteredAttachments" 
                :key="file.uuid"
                class="file-card"
                @click="previewFile(file)"
              >
                <!-- File Preview -->
                <div class="file-preview">
                  <img 
                    v-if="isImageFile(file)"
                    :src="file.file_url || `/storage/${file.file_path}`" 
                    :alt="file.original_filename"
                    @error="handleImageError"
                    class="file-image"
                  />
                  <div v-else class="file-icon">
                    <font-awesome-icon 
                      :icon="getFileIcon(file)" 
                      size="2x"
                      :class="getFileTypeClass(file)"
                    />
                  </div>
                </div>

                <!-- File Info -->
                <div class="file-info">
                  <h4 class="file-name" :title="file.original_filename">
                    {{ file.original_filename }}
                  </h4>
                  <div class="file-details">
                    <span class="file-size">{{ formatFileSize(file.file_size) }}</span>
                    <span class="file-type">{{ getFileTypeLabel(file.mime_type) }}</span>
                  </div>
                </div>

                <!-- File Actions (left) + Source Badge (right) -->
                <div class="file-actions" @click.stop>
                  <div class="action-group">
                    <button
                      @click="previewFile(file)"
                      class="action-btn"
                      title="Buka berkas"
                    >
                      <font-awesome-icon icon="external-link-alt" />
                    </button>
                    <a
                      :href="file.download_url || file.file_url || `/storage/${file.file_path}`"
                      download
                      class="action-btn"
                      title="Unduh berkas"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <font-awesome-icon icon="download" />
                    </a>
                    <button
                      @click="copyFileLink(file)"
                      class="action-btn"
                      title="Salin link"
                    >
                      <font-awesome-icon icon="link" />
                    </button>
                  </div>
                  <span v-if="getFileSourceLabel(file)" class="file-source-badge">{{ getFileSourceLabel(file) }}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Settings / Pengaturan View -->
        <div v-if="activeView === 'settings'" class="settings-tab">
          <div class="settings-section">
            <h3>Pengaturan Proyek</h3>
            <p>Kelola preferensi dan konfigurasi proyek</p>
            
            <!-- Settings form: 2-column layout (75% left / 25% right) -->
            <div class="settings-form">
              <div class="settings-form-row">
                <div class="settings-left">
                  <div class="form-group">
                    <label class="form-label">Nama Proyek</label>
                    <input class="form-input" v-model="settings.name" type="text" />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Deskripsi</label>
                    <textarea class="form-input" v-model="settings.description" rows="3"></textarea>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Status</label>
                    <div class="status-group">
                      <div class="status-item">
                        <label class="switch" aria-label="Aktifkan proyek">
                          <input type="checkbox" v-model="settings.is_active" :aria-checked="settings.is_active" />
                          <span class="switch-slider" role="switch" :aria-checked="String(settings.is_active)"></span>
                        </label>
                        <div class="switch-labels">
                          <div class="switch-title">Aktif</div>
                          <div class="switch-sub">Proyek dapat digunakan</div>
                        </div>
                      </div>

                      <div class="status-item">
                        <label class="switch" aria-label="Jadikan proyek publik">
                          <input type="checkbox" v-model="settings.is_public" :aria-checked="settings.is_public" />
                          <span class="switch-slider" role="switch" :aria-checked="String(settings.is_public)"></span>
                        </label>
                        <div class="switch-labels">
                          <div class="switch-title">Publik</div>
                          <div class="switch-sub">Dapat dilihat oleh semua anggota proyek</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="settings-right">
                  <label class="form-label">Logo Proyek</label>
                  <div class="logo-upload">
                    <input type="file" ref="settingsLogoInput" class="file-input" @change="onSettingsLogoSelect" accept="image/*" />
                    <div v-if="settingsPreview" class="logo-preview logo-card" @click="$refs.settingsLogoInput.click()" title="Klik untuk mengganti logo">
                      <img class="logo-thumb large" :src="settingsPreview" alt="logo preview"/>
                      <div class="logo-meta">
                        <small v-if="settings.logoFile">{{ settings.logoFile?.name }}</small>
                        <small v-else-if="project.logo">Logo saat ini</small>
                      </div>
                    </div>
                    <div v-else class="logo-preview logo-empty logo-card" @click="$refs.settingsLogoInput.click()" title="Klik untuk memilih logo">
                      <div class="logo-empty-text">Tidak ada logo</div>
                    </div>

                    <div class="logo-actions">
                      <button class="btn btn-primary" @click.prevent="$refs.settingsLogoInput.click()">
                        <font-awesome-icon icon="upload" />
                        <span class="btn-text">Pilih Logo</span>
                      </button>

                      <button
                        class="btn btn-danger"
                        v-if="settings.logoFile"
                        @click="removeSettingsLogo"
                        title="Batalkan pilihan file"
                      >
                        <font-awesome-icon icon="ban" />
                        <span class="btn-text">Batalkan</span>
                      </button>

                      <button
                        :class="['btn', settings.removeLogo ? 'btn-warning' : 'btn-danger']"
                        v-else-if="project.logo && !settings.logoFile"
                        @click.prevent="settings.removeLogo = !settings.removeLogo"
                      >
                        <font-awesome-icon :icon="settings.removeLogo ? 'undo' : 'trash'" />
                        <span class="btn-text">{{ settings.removeLogo ? 'Batalkan Hapus' : 'Hapus Logo' }}</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div class="form-group actions-row">
                <button class="btn btn-primary" :disabled="savingSettings" @click="saveProjectSettings">
                  <font-awesome-icon icon="save" /> {{ savingSettings ? 'Menyimpan...' : 'Simpan Perubahan' }}
                </button>
              </div>
            </div>

            <!-- Project Status Management Section -->
            <div class="settings-section">
              <h3>Status Proyek</h3>
              <p>Kelola status proyek untuk proyek ini. Anda dapat menambah, mengedit, atau menghapus status proyek.</p>

              <div v-if="statusLoading" class="loading-container">
                <div class="loading-spinner"></div>
                <p>Memuat status...</p>
              </div>

              <div v-else>
                <div class="status-list">
                  <div
                    v-for="(s, idx) in projectStatuses"
                    :key="s.id"
                    class="status-row draggable-row"
                    :draggable="true"
                    @dragstart="onStatusDragStart($event, idx)"
                    @dragover.prevent="onStatusDragOver($event, idx)"
                    @drop.prevent="onStatusDrop($event, idx)"
                  >
                    <div class="status-info">
                      <div class="drag-handle" title="Seret untuk mengatur urutan">☰</div>
                      <div class="status-color" :style="{ width: '12px', height: '12px', backgroundColor: s.color, borderRadius: '3px', marginRight: '8px' }"></div>
                      <div>{{ s.name }}</div>
                      <div class="muted" style="margin-left:8px">{{ s.is_completed ? 'Selesai' : '' }} {{ s.is_cancelled ? '• Dibatalkan' : '' }}</div>
                    </div>
                    <div class="status-actions">
                      <button class="btn btn-secondary" @click="openEditStatusModal(s)">Edit</button>
                      <button class="btn btn-danger" @click="removeStatus(s)">Hapus</button>
                    </div>
                  </div>
                </div>

                <div class="status-actions-top">
                  <button class="btn btn-primary" @click="openCreateStatusModal">
                    <font-awesome-icon icon="plus" /> Tambah Status Baru
                  </button>
                </div>

                <!-- Status modal (create / edit) -->
                <div v-if="showStatusModal" class="modal-overlay" @click="closeStatusModal">
                  <div class="modal-container" @click.stop>
                    <div class="modal-header">
                      <h3>{{ isStatusEditing ? 'Edit Status Proyek' : 'Tambah Status Baru' }}</h3>
                      <button class="btn-close" @click="closeStatusModal">
                        <font-awesome-icon icon="times" />
                      </button>
                    </div>
                    <div class="modal-body">
                      <div class="form-group">
                        <label class="form-label">Nama</label>
                        <input v-model="statusForm.name" class="form-input" />
                      </div>
                      <div class="form-group">
                        <label class="form-label">Warna</label>
                        <input type="color" v-model="statusForm.color" class="form-input" />
                      </div>
                      <div class="form-group">
                        <label class="checkbox-option">
                          <input type="checkbox" v-model="statusForm.is_completed" />
                          <span class="checkbox-label"> &nbsp; Menandai sebagai status selesai</span>
                        </label>
                      </div>
                      <div class="form-group">
                        <label class="checkbox-option">
                          <input type="checkbox" v-model="statusForm.is_cancelled" />
                          <span class="checkbox-label"> &nbsp; Menandai sebagai status dibatalkan</span>
                        </label>
                      </div>
                    </div>
                    <div class="modal-footer">
                      <button class="btn btn-secondary" @click="closeStatusModal">Batal</button>
                      <button class="btn btn-primary" :disabled="statusSaving" @click="submitStatusModal">
                        <font-awesome-icon v-if="statusSaving" icon="spinner" spin />
                        <span v-else>{{ isStatusEditing ? 'Simpan' : 'Buat' }}</span>
                      </button>
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
  <div v-if="!loading && !project" class="error-state">
      <font-awesome-icon icon="exclamation-triangle" size="3x" class="error-icon" />
      <h3>Proyek tidak ditemukan</h3>
      <p>Proyek yang Anda cari tidak ada atau Anda tidak memiliki akses.</p>
      <router-link :to="`/workspaces/${$route.params.workspaceSlug}`" class="btn btn-primary">
        Kembali ke Workspace
      </router-link>
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
            <TipTapEditor 
              v-model="newNoteContent" 
              placeholder="Tulis catatan untuk anggota proyek..."
            />
          </div>
          
          <div class="form-group">
            <label>Lampiran</label>
            <div 
              class="file-upload-area"
              :class="{ 'drag-over': isDragOver }"
              @dragover.prevent="handleFileDragOver"
              @dragleave.prevent="handleFileDragLeave"
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
    
    <!-- Generic Confirm Modal -->
    <div v-if="showConfirmModal" class="modal-overlay" @click="closeConfirm">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>{{ confirmTitle }}</h3>
          <button class="btn-close" @click="closeConfirm">
            <font-awesome-icon icon="times" />
          </button>
        </div>
        <div class="modal-body">
          <p>{{ confirmMessage }}</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeConfirm" :disabled="confirmLoading">Batal</button>
          <button class="btn btn-danger" @click="handleConfirm" :disabled="confirmLoading">
            <font-awesome-icon v-if="confirmLoading" icon="spinner" spin />
            <font-awesome-icon v-else icon="check" />
            {{ confirmLoading ? 'Proses...' : 'Konfirmasi' }}
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
            <label class="form-label">Cari Pengguna</label>
            <div class="autocomplete">
              <input
                type="text"
                v-model="inviteSearch"
                @input="onSearchInput"
                placeholder="Ketik nama atau email pengguna..."
                class="form-input"
              />
              <div v-if="showSearchResults" class="autocomplete-list">
                <div v-if="isSearching" class="autocomplete-empty">
                  <font-awesome-icon icon="spinner" spin /> Mencari...
                </div>
                <div v-else-if="!users.length" class="autocomplete-empty">
                  Tidak ada pengguna ditemukan
                </div>
                <div v-else>
                  <div
                    v-for="user in users.slice(0, 5)"
                    :key="user.id"
                    class="autocomplete-item"
                    :class="{ disabled: isUserMember(user) }"
                    @click="selectUser(user)"
                  >
                    <div class="autocomplete-item-main">{{ user.name }}</div>
                    <div class="autocomplete-item-note">
                      {{ user.email }}
                      <span v-if="isUserMember(user)" class="text-muted"> (Sudah anggota)</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="form-group" v-if="projectRoles.length">
            <label class="form-label">Role</label>
            <select v-model="inviteRoleId" class="form-input">
              <option value="">Pilih role...</option>
              <option v-for="role in projectRoles" :key="role.id" :value="role.id">
                {{ role.name }}
              </option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeInviteModal">Batal</button>
          <button 
            class="btn btn-primary" 
            :disabled="inviting || !inviteUserId || !inviteRoleId" 
            @click="sendInvite"
          >
            <font-awesome-icon v-if="inviting" icon="spinner" spin />
            <font-awesome-icon v-else icon="user-plus" />
            {{ inviting ? 'Mengundang...' : 'Undang' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Edit Member Modal -->
    <div v-if="showEditMemberModal" class="modal-overlay" @click="closeEditMemberModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>Edit Role Anggota</h3>
          <button class="btn-close" @click="closeEditMemberModal">
            <font-awesome-icon icon="times" />
          </button>
        </div>
        <div class="modal-body">
          <div v-if="editMember" class="member-preview">
            <div class="member-avatar">
              <img v-if="editMember.avatar" :src="editMember.avatar" :alt="editMember.name" />
              <div v-else class="member-avatar-fallback">{{ getMemberInitials(editMember.name) }}</div>
            </div>
            <div class="member-details">
              <div class="member-name">{{ editMember.name }}</div>
              <div class="member-email">{{ editMember.email }}</div>
            </div>
          </div>

          <div class="form-group" v-if="projectRoles.length">
            <label class="form-label">Role Baru</label>
            <select v-model="editMemberProjectRoleId" class="form-input">
              <option value="">Pilih role...</option>
              <option v-for="role in projectRoles" :key="role.id" :value="role.id">
                {{ role.name }}
              </option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeEditMemberModal">Batal</button>
          <button 
            class="btn btn-primary" 
            :disabled="updatingMember || !editMemberProjectRoleId" 
            @click="updateMemberRole"
          >
            <font-awesome-icon v-if="updatingMember" icon="spinner" spin />
            <font-awesome-icon v-else icon="save" />
            {{ updatingMember ? 'Menyimpan...' : 'Simpan' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Remove Member Modal -->
    <div v-if="showRemoveMemberModal" class="modal-overlay" @click="closeRemoveMemberModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>Hapus Anggota</h3>
          <button class="btn-close" @click="closeRemoveMemberModal">
            <font-awesome-icon icon="times" />
          </button>
        </div>
        <div class="modal-body">
          <div v-if="removeMemberTarget" class="member-preview">
            <div class="member-avatar">
              <img v-if="removeMemberTarget.avatar" :src="removeMemberTarget.avatar" :alt="removeMemberTarget.name" />
              <div v-else class="member-avatar-fallback">{{ getMemberInitials(removeMemberTarget.name) }}</div>
            </div>
            <div class="member-details">
              <div class="member-name">{{ removeMemberTarget.name }}</div>
              <div class="member-email">{{ removeMemberTarget.email }}</div>
            </div>
          </div>
          <p class="text-danger">Apakah Anda yakin ingin menghapus anggota ini dari proyek?</p>
          <p class="text-muted">Anggota akan kehilangan akses ke proyek ini dan semua tugasnya.</p>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeRemoveMemberModal">Batal</button>
          <button 
            class="btn btn-danger" 
            :disabled="removingMember" 
            @click="confirmRemoveMember"
          >
            <font-awesome-icon v-if="removingMember" icon="spinner" spin />
            <font-awesome-icon v-else icon="trash" />
            {{ removingMember ? 'Menghapus...' : 'Hapus Anggota' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Task Modal -->
    <TaskModal
      :show="showTaskModal"
      :task="selectedTask"
      :task-statuses="taskStatuses"
      :task-priorities="taskPriorities"
      :project-members="project?.members || []"
      :project-tasks="allProjectTasks"
      :current-project="project"
      @close="handleTaskModalClose"
      @task-updated="handleTaskUpdated"
      @task-deleted="handleTaskDeleted"
    />
</template>

<script setup>
import { ref, onMounted, computed, watch, nextTick, onBeforeUnmount } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { projectService } from '@/api/services/projectService';
import { taskService } from '@/api/services/taskService';
import { workspaceService } from '@/api/services/workspaceService';
import { noteService } from '@/api/services/noteService';
import { userService } from '@/api/services/userService';
import { useAuthStore } from '@/stores/auth';
import { errorToast, successToast } from '@/utils/toast';
import TaskModal from '@/components/TaskModal.vue';
import TipTapEditor from '@/components/TipTapEditor.vue';
import { priorityService } from '@/api/services/priorityService';

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
const attachmentsList = ref([]);
const loadingAttachments = ref(false);
const taskStatuses = ref([]);
const activeView = ref('board');
const showInviteModal = ref(false);
const notes = ref([]);
const newNoteContent = ref('');
const creatingNote = ref(false);

// Task Modal state
const showTaskModal = ref(false);
const selectedTask = ref(null);
const taskPriorities = ref([]);
const showCreateNoteModal = ref(false);
const selectedFiles = ref([]);
const isDragOver = ref(false);

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

// Member management state
const users = ref([]);
const projectRoles = ref([]);
const inviteUserId = ref('');
const inviteRoleId = ref('');
const inviting = ref(false);
const inviteSearch = ref('');
const isSearching = ref(false);
const showSearchResults = ref(false);
let searchTimeout = null;

// Edit member state  
const editMember = ref(null);
const showEditMemberModal = ref(false);
const editMemberProjectRoleId = ref(null);
const updatingMember = ref(false);

// Remove member state
const removeMemberTarget = ref(null);
const showRemoveMemberModal = ref(false);
const removingMember = ref(false);

// Member menu state
const menuOpenFor = ref(null);

// Files view state
const fileSearchQuery = ref('');
const fileTypeFilter = ref('');

// Load data on mount
onMounted(async () => {
  await loadProject();
  await loadTaskStatuses();
  await loadTaskPriorities();
  await loadActivities();
  await loadAttachments(route.params.projectSlug || project.value?.slug);
  loading.value = false;
  
  // Add document click listener for closing member menus
  document.addEventListener('click', handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick);
  if (searchTimeout) {
    clearTimeout(searchTimeout);
  }
});

// Handle document clicks to close member menus
const handleDocumentClick = (event) => {
  const memberMenus = document.querySelectorAll('.member-actions-menu');
  let clickedInsideMenu = false;
  
  memberMenus.forEach(menu => {
    if (menu.contains(event.target)) {
      clickedInsideMenu = true;
    }
  });
  
  if (!clickedInsideMenu) {
    menuOpenFor.value = null;
  }
};

// Watch for activeView changes to load activities and notes when needed
watch(activeView, async (newView) => {
  if (newView === 'activities' && activities.value.length === 0) {
    await loadActivities();
  }
  if (newView === 'notes' && notes.value.length === 0 && project.value) {
    await loadNotes(project.value.id);
  }
  if (newView === 'files' && attachmentsList.value.length === 0 && project.value) {
    await loadAttachments(project.value.slug);
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

// Load task priorities
const loadTaskPriorities = async () => {
  try {
    // You may need to adjust this API endpoint based on your backend
    const response = await priorityService.list(); // or priorityService.list()
    taskPriorities.value = response.data.data || [];
  } catch (error) {
    console.error('Error loading task priorities:', error);
    // Fallback priorities if API fails
    taskPriorities.value = [
      { id: 1, name: 'Low', color: '#28A745' },
      { id: 2, name: 'Medium', color: '#FFC107' },
      { id: 3, name: 'High', color: '#DC3545' },
      { id: 4, name: 'Urgent', color: '#7d0000' }
    ];
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

// Load project attachments
const loadAttachments = async (projectSlug) => {
  loadingAttachments.value = true;
  try {
    // If no slug provided, try route param or project value
    let slug = projectSlug || route.params.projectSlug || project.value?.slug;
    if (!slug && project.value?.slug) slug = project.value.slug;
    if (!slug) {
      // Wait briefly for project to load if possible
      await nextTick();
      slug = route.params.projectSlug || project.value?.slug;
    }

    if (!slug) {
      throw new Error('Project slug tidak tersedia');
    }

    const response = await projectService.getProjectAttachments(slug);
    attachmentsList.value = response.data.data || [];
  } catch (error) {
    console.error('Error loading attachments:', error);
    // Do not spam toast for expected race conditions
    if (error && error.message !== 'Project slug tidak tersedia') {
      errorToast('Gagal memuat berkas proyek');
    }
  } finally {
    loadingAttachments.value = false;
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

// All project tasks for TaskModal
const allProjectTasks = computed(() => {
  return tasks.value || [];
});

// Filtered attachments for Files view
const filteredAttachments = computed(() => {
  let filtered = attachmentsList.value;
  
  // Filter by search query
  if (fileSearchQuery.value) {
    const query = fileSearchQuery.value.toLowerCase();
    filtered = filtered.filter(file => 
      file.original_filename?.toLowerCase().includes(query) ||
      file.mime_type?.toLowerCase().includes(query)
    );
  }
  
  // Filter by file type
  if (fileTypeFilter.value) {
    filtered = filtered.filter(file => {
      const mimeType = file.mime_type?.toLowerCase() || '';
      switch (fileTypeFilter.value) {
        case 'image':
          return mimeType.startsWith('image/');
        case 'document':
          return mimeType.includes('pdf') || 
                 mimeType.includes('document') ||
                 mimeType.includes('text') ||
                 mimeType.includes('word') ||
                 mimeType.includes('excel') ||
                 mimeType.includes('powerpoint') ||
                 mimeType.includes('sheet') ||
                 mimeType.includes('presentation');
        case 'archive':
          return mimeType.includes('zip') ||
                 mimeType.includes('rar') ||
                 mimeType.includes('tar') ||
                 mimeType.includes('gz') ||
                 mimeType.includes('7z');
        case 'other':
          return !mimeType.startsWith('image/') &&
                 !mimeType.includes('pdf') &&
                 !mimeType.includes('document') &&
                 !mimeType.includes('text') &&
                 !mimeType.includes('word') &&
                 !mimeType.includes('excel') &&
                 !mimeType.includes('powerpoint') &&
                 !mimeType.includes('sheet') &&
                 !mimeType.includes('presentation') &&
                 !mimeType.includes('zip') &&
                 !mimeType.includes('rar') &&
                 !mimeType.includes('tar') &&
                 !mimeType.includes('gz') &&
                 !mimeType.includes('7z');
        default:
          return true;
      }
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

// Strip HTML tags from description for card preview
const stripHtml = (html) => {
  if (!html) return '';
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

// Truncate text to a specific length
const truncateText = (text, maxLength = 100) => {
  if (!text) return '';
  const stripped = stripHtml(text);
  if (stripped.length <= maxLength) return stripped;
  return stripped.substring(0, maxLength) + '...';
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

// File helpers
const isImageFile = (file) => {
  return file.mime_type?.startsWith('image/') || false;
};

const getFileIcon = (file) => {
  const mimeType = file.mime_type?.toLowerCase() || '';
  
  if (mimeType.startsWith('image/')) {
    return 'image';
  } else if (mimeType.includes('pdf')) {
    return 'file-pdf';
  } else if (mimeType.includes('word') || mimeType.includes('document')) {
    return 'file-word';
  } else if (mimeType.includes('excel') || mimeType.includes('sheet')) {
    return 'file-excel';
  } else if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) {
    return 'file-powerpoint';
  } else if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar') || mimeType.includes('gz')) {
    return 'file-zipper';
  } else if (mimeType.startsWith('video/')) {
    return 'file-video';
  } else if (mimeType.startsWith('audio/')) {
    return 'file-audio';
  } else if (mimeType.includes('text')) {
    return 'file-text';
  } else {
    return 'file';
  }
};

const getFileTypeClass = (file) => {
  const mimeType = file.mime_type?.toLowerCase() || '';
  
  if (mimeType.startsWith('image/')) {
    return 'image';
  } else if (mimeType.includes('pdf') || mimeType.includes('word') || mimeType.includes('document') || 
             mimeType.includes('excel') || mimeType.includes('sheet') || mimeType.includes('powerpoint') || 
             mimeType.includes('presentation') || mimeType.includes('text')) {
    return 'document';
  } else if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('tar') || mimeType.includes('gz')) {
    return 'archive';
  } else if (mimeType.startsWith('video/')) {
    return 'video';
  } else if (mimeType.startsWith('audio/')) {
    return 'audio';
  } else {
    return 'other';
  }
};

const getFileTypeLabel = (mimeType) => {
  if (!mimeType) return 'Unknown';
  
  const type = mimeType.toLowerCase();
  
  if (type.startsWith('image/')) {
    return 'Gambar';
  } else if (type.includes('pdf')) {
    return 'PDF';
  } else if (type.includes('word')) {
    return 'Word';
  } else if (type.includes('excel') || type.includes('sheet')) {
    return 'Excel';
  } else if (type.includes('powerpoint') || type.includes('presentation')) {
    return 'PowerPoint';
  } else if (type.includes('text')) {
    return 'Teks';
  } else if (type.startsWith('video/')) {
    return 'Video';
  } else if (type.startsWith('audio/')) {
    return 'Audio';
  } else if (type.includes('zip')) {
    return 'ZIP';
  } else if (type.includes('rar')) {
    return 'RAR';
  } else {
    return mimeType.split('/')[1]?.toUpperCase() || 'File';
  }
};

// Determine whether the attachment came from a Task or a Comment
const getFileSourceLabel = (file) => {
  // Try model_type_short, model_type, or other available keys
  const type = (file.model_type_short || file.model_type || file.model_type_name || '').toString().toLowerCase();
  if (!type) return '';

  if (type.includes('task')) return 'Tugas';
  if (type.includes('comment')) return 'Komentar';
  if (type.includes('note')) return 'Catatan';
  // fallback: if model contains 'comment' or 'task' anywhere
  if (String(file.model_type).toLowerCase().includes('comment')) return 'Komentar';
  if (String(file.model_type).toLowerCase().includes('task')) return 'Tugas';

  return '';
};

const formatFileDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return 'Hari ini';
  if (diffDays === 1) return 'Kemarin';
  if (diffDays < 7) return `${diffDays} hari yang lalu`;
  
  return date.toLocaleDateString('id-ID', { 
    day: 'numeric', 
    month: 'short',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};

const handleImageError = (event) => {
  // Hide broken image and show fallback icon
  event.target.style.display = 'none';
  const parent = event.target.parentElement;
  if (parent) {
    parent.innerHTML = '<div class="file-icon-preview"><i class="fas fa-image file-type-icon image"></i></div>';
  }
};

// File actions
const previewFile = (file) => {
  const url = file.file_url || `/storage/${file.file_path}`;
  window.open(url, '_blank', 'noopener,noreferrer');
};

const copyFileLink = async (file) => {
  try {
    const url = file.file_url || `${window.location.origin}/storage/${file.file_path}`;
    await navigator.clipboard.writeText(url);
    successToast('Link berkas berhasil disalin');
  } catch (error) {
    console.error('Error copying file link:', error);
    errorToast('Gagal menyalin link berkas');
  }
};

const clearFilters = () => {
  fileSearchQuery.value = '';
  fileTypeFilter.value = '';
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
  selectedTask.value = task;
  showTaskModal.value = true;
};

const openCreateTaskModal = (statusId = null) => {
  // Create a new empty task with the specified status
  selectedTask.value = {
    id: null,
    uuid: null,
    title: '',
    description: '',
    status_id: statusId,
    priority_id: null,
    due_date: null,
    assigned_to: [],
    created_by: authStore.user?.id,
    project_id: project.value?.id,
    attachments: [],
    comments: [],
    related_to: []
  };
  showTaskModal.value = true;
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
  
  // We rely on CSS `touch-action: none` on the draggable card to prevent
  // native scrolling and gestures. Avoid calling event.preventDefault()
  // here so the browser can register passive listeners and remain responsive.
};

const handleTouchMove = (event) => {
  if (!touchStarted.value || !draggedTask.value) return;

  // Do not call event.preventDefault() here. We set `touch-action: none`
  // in CSS for .task-card so the browser won't perform native scrolling
  // while interacting with a draggable card. Using passive listeners
  // improves scrolling responsiveness and avoids the browser warning.
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
    
    successToast('Status proyek berhasil diperbarui');
    
    // Refresh project data to get updated stats
    await refreshProject();
    
    // If we're on activities view, refresh activities too
    if (activeView.value === 'activities') {
      await loadActivities();
    }
    
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
  errorToast('Gagal memperbarui status proyek');
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

// Member management functions
const fetchUsers = async (search = '') => {
  try {
    const params = search ? { search } : {};
    const response = await userService.list(params);
    users.value = response.data.data || [];
  } catch (error) {
    console.error('Error fetching users:', error);
    users.value = [];
  }
};

const fetchProjectRoles = async () => {
  try {
    // Fetch project-specific roles from API
    const projectSlug = route.params.projectSlug;
    if (!projectSlug) {
      projectRoles.value = [];
      return;
    }

    const res = await projectService.getProjectRoles(projectSlug);
    // API expected shape: { data: { data: [...] } } or { data: [...] }
    const data = res.data?.data ?? res.data;
    projectRoles.value = Array.isArray(data) ? data : (data?.data || []);
  } catch (error) {
    console.error('Error fetching project roles:', error);
    projectRoles.value = [];
  }
};

const openInviteModal = async () => {
  if (!canInviteMembers.value) {
    errorToast('Anda tidak memiliki izin untuk mengundang anggota');
    return;
  }
  
  inviteUserId.value = '';
  inviteRoleId.value = '';
  inviteSearch.value = '';
  await fetchUsers();
  await fetchProjectRoles();
  showInviteModal.value = true;
};

const closeInviteModal = () => {
  showInviteModal.value = false;
  inviting.value = false;
  inviteSearch.value = '';
  showSearchResults.value = false;
  if (searchTimeout) {
    clearTimeout(searchTimeout);
    searchTimeout = null;
  }
};

const onSearchInput = () => {
  const val = inviteSearch.value || '';
  inviteUserId.value = '';
  showSearchResults.value = !!val && val.length >= 3;
  
  if (searchTimeout) clearTimeout(searchTimeout);
  
  if (!val || val.length < 3) {
    showSearchResults.value = false;
    isSearching.value = false;
    return;
  }
  
  isSearching.value = true;
  searchTimeout = setTimeout(() => performSearch(val), 350);
};

const performSearch = async (query) => {
  try {
    const response = await userService.list({ search: query });
    users.value = response.data.data || [];
  } catch (error) {
    console.error('Error searching users:', error);
    users.value = [];
  } finally {
    isSearching.value = false;
  }
};

const selectUser = (user) => {
  if (isUserMember(user)) {
    errorToast('Pengguna sudah menjadi anggota proyek ini');
    return;
  }
  
  inviteUserId.value = user.id;
  inviteSearch.value = `${user.name} — ${user.email}`;
  showSearchResults.value = false;
};

const isUserMember = (user) => {
  return projectMembers.value.some(member => 
    member.id === user.id || member.user_id === user.id
  );
};

const sendInvite = async () => {
  if (!canInviteMembers.value) {
    errorToast('Anda tidak memiliki izin untuk mengundang anggota');
    return;
  }
  
  if (!inviteUserId.value || !inviteRoleId.value) {
    errorToast('Harap pilih pengguna dan role');
    return;
  }
  
  inviting.value = true;
  try {
    const projectSlug = route.params.projectSlug;
    const payload = {
      user_id: inviteUserId.value,
      project_role_id: inviteRoleId.value,
      project_id: project.value.id
    };
    
    const response = await projectService.addMember(projectSlug, payload);
    
    if (response.data.success) {
      successToast(response.data.message || 'Anggota berhasil diundang');
      await refreshProject();
      closeInviteModal();
    } else {
      errorToast(response.data.message || 'Gagal mengundang anggota');
    }
  } catch (error) {
    console.error('Error inviting member:', error);
    const message = error.response?.data?.message || 'Gagal mengundang anggota';
    errorToast(message);
  } finally {
    inviting.value = false;
  }
};

const openEditMemberModal = async (member) => {
  if (!canManageMembers.value) {
    errorToast('Anda tidak memiliki izin untuk mengedit anggota');
    return;
  }
  
  editMember.value = member;
  editMemberProjectRoleId.value = '';
  await fetchProjectRoles();

  // Try to auto-select the member's current role from fetched roles
  try {
    const r = member?.role ?? '';
    if (r) {
      const match = projectRoles.value.find(role => {
        if (!role) return false;
        const candidates = [role.id, role.name, role.code, role.slug, role.label, role.title];
        return candidates.some(c => c != null && String(c).toLowerCase() === String(r).toLowerCase());
      });
      if (match) editMemberProjectRoleId.value = match.id ?? match.code ?? match.name;
    }
  } catch (err) {
    console.error('Error auto-selecting member role:', err);
  }

  showEditMemberModal.value = true;
};

const closeEditMemberModal = () => {
  showEditMemberModal.value = false;
  editMember.value = null;
  editMemberProjectRoleId.value = '';
  updatingMember.value = false;
};

const updateMemberRole = async () => {
  if (!editMember.value || !editMemberProjectRoleId.value) {
    errorToast('Harap pilih role baru');
    return;
  }
  
  updatingMember.value = true;
  try {
    const projectSlug = route.params.projectSlug;
    const payload = {
      user_id: editMember.value.id,
      project_role_id: editMemberProjectRoleId.value,
      project_id: project.value.id
    };
    
    const response = await projectService.updateMember(projectSlug, payload);
    
    if (response.data.success) {
      successToast(response.data.message || 'Role anggota berhasil diperbarui');
      await refreshProject();
      closeEditMemberModal();
    } else {
      errorToast(response.data.message || 'Gagal memperbarui role anggota');
    }
  } catch (error) {
    console.error('Error updating member role:', error);
    const message = error.response?.data?.message || 'Gagal memperbarui role anggota';
    errorToast(message);
  } finally {
    updatingMember.value = false;
  }
};

const openRemoveMemberModal = (member) => {
  if (!canRemoveMember(member)) {
    errorToast('Anda tidak dapat menghapus anggota ini');
    return;
  }
  
  removeMemberTarget.value = member;
  showRemoveMemberModal.value = true;
};

const closeRemoveMemberModal = () => {
  showRemoveMemberModal.value = false;
  removeMemberTarget.value = null;
  removingMember.value = false;
};

const confirmRemoveMember = async () => {
  if (!removeMemberTarget.value) return;
  
  removingMember.value = true;
  try {
    const projectSlug = route.params.projectSlug;
    const payload = { 
      user_id: removeMemberTarget.value.id,
      project_id: project.value.id
    };
    
    const response = await projectService.removeMember(projectSlug, payload);
    
    if (response.data.success) {
      successToast(response.data.message || 'Anggota berhasil dihapus');
      await refreshProject();
      await loadTasks(route.params.projectSlug);
      closeRemoveMemberModal();
    } else {
      errorToast(response.data.message || 'Gagal menghapus anggota');
    }
  } catch (error) {
    console.error('Error removing member:', error);
    const message = error.response?.data?.message || 'Gagal menghapus anggota';
    errorToast(message);
  } finally {
    removingMember.value = false;
  }
};

const toggleMemberMenu = (memberId) => {
  menuOpenFor.value = menuOpenFor.value === memberId ? null : memberId;
};

// Legacy function for compatibility
const removeMember = async (member) => {
  openRemoveMemberModal(member);
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

// Member management computed properties
const currentProjectRole = computed(() => {
  const user = authStore.user;
  if (!user || !project.value) return null;
  const member = projectMembers.value.find(m => m.id === user.id);
  return member?.role || null;
});

const canInviteMembers = computed(() => {
  if (!authStore.user) return false;
  // System admin can always invite
  const user = authStore.user;
  const roleCode = String(user.system_role?.code || '').toLowerCase();
  const isSysAdmin = roleCode === 'admin' || roleCode === 'system_admin' || user.system_role?.id === 1;
  if (isSysAdmin) return true;
  
  // Check project role
  const role = (currentProjectRole.value || '').toString().toLowerCase();
  return role.includes('owner') || role.includes('admin') || role === 'manager';
});

const canManageMembers = computed(() => {
  return canInviteMembers.value; // Same permission for now
});

const canRemoveMember = (member) => {
  if (!canManageMembers.value) return false;
  if (!member || !authStore.user) return false;
  // Cannot remove self
  return member.id !== authStore.user.id;
};

// Task summary computed values (prefer live `tasks` array; fall back to project counts)
const getStatusForTask = (task) => {
  if (!task) return null;
  if (task.status) return task.status;
  const id = task.status_id ?? task.status?.id;
  return taskStatuses.value.find(s => s.id === id) || null;
};

const tasksTotal = computed(() => {
  if (tasks.value && tasks.value.length) return tasks.value.length;
  if (!project.value) return 0;
  if (project.value.tasks_count != null) return project.value.tasks_count;
  const completed = Number(project.value.tasks_completed_count || 0);
  const incomplete = Number(project.value.tasks_incomplete_count || 0);
  const cancelled = Number(project.value.tasks_cancelled_count || 0);
  return completed + incomplete + cancelled;
});

const tasksCompleted = computed(() => {
  if (tasks.value && tasks.value.length) {
    return tasks.value.filter(t => {
      const s = getStatusForTask(t);
      return !!s?.is_completed;
    }).length;
  }
  return Number(project.value?.tasks_completed_count || 0);
});

const tasksCancelled = computed(() => {
  if (tasks.value && tasks.value.length) {
    return tasks.value.filter(t => {
      const s = getStatusForTask(t);
      return !!s?.is_cancelled;
    }).length;
  }
  return Number(project.value?.tasks_cancelled_count || 0);
});

const tasksIncomplete = computed(() => {
  const total = tasksTotal.value || 0;
  const completed = tasksCompleted.value || 0;
  const cancelled = tasksCancelled.value || 0;
  if (tasks.value && tasks.value.length) return total - completed - cancelled;
  return Number(project.value?.tasks_incomplete_count || Math.max(0, total - completed - cancelled));
});

const tasksCompletedPercent = computed(() => {
  const total = tasksTotal.value || 0;
  if (total === 0) return 0;
  return Math.round((tasksCompleted.value / (total - tasksCancelled.value )) * 100);
});

// Return a readable role label for a member
const getMemberRole = (member) => {
  if (!member) return '';
  const r = member.role ?? '';
  if (!r) return '';

  // Try to resolve using fetched project roles first. The member.role
  // may be an id (number) or a string (code/name). We try several fields.
  const roles = projectRoles.value || [];
  const match = roles.find(role => {
    if (!role) return false;
    const candidates = [role.id, role.name, role.code, role.slug, role.label, role.title];
    return candidates.some(c => c != null && String(c).toLowerCase() === String(r).toLowerCase());
  });

  if (match) {
    // Prefer a human-friendly name field
    return match.name || match.label || match.title || String(match.id);
  }

  // Fallback mapping for common role codes/names
  const map = {
    owner: 'Pemilik',
    admin: 'Admin',
    member: 'Anggota',
    manager: 'Manajer'
  };

  return map[String(r).toLowerCase()] || r;
};

// Notes functions
const loadNotes = async (projectId) => {
  try {
    const response = await noteService.list({ model_type: 'project', model_id: projectId });
    console.log(response);
    notes.value = response.data.data || [];
  } catch (error) {
    console.error('Error loading notes:', error);
  }
};

const formatDateTime = (dateString) => {
  if (!dateString) return '';
  const d = new Date(dateString);
  if (isNaN(d)) return dateString;
  const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
  return d.toLocaleDateString('id-ID', options).replace(',', '');
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

// File drag and drop functions (separate names to avoid conflict with board drag handlers)
const handleFileDragOver = (event) => {
  event.preventDefault();
  isDragOver.value = true;
};

const handleFileDragLeave = (event) => {
  event.preventDefault();
  isDragOver.value = false;
};

const handleFileDrop = (event) => {
  event.preventDefault();
  isDragOver.value = false;
  
  const files = Array.from(event.dataTransfer.files);
  selectedFiles.value = [...selectedFiles.value, ...files];
};

// Create note with attachments (match WorkspacePage behavior)
const createNoteWithAttachments = async () => {
  if (!newNoteContent.value.trim()) return;
  creatingNote.value = true;
  
  try {
    const formData = new FormData();
    formData.append('model_type', 'project');
    formData.append('model_id', project.value.id);
    formData.append('content', newNoteContent.value.trim());
    
    // Add files to FormData using attachments[] so backend matches validation
    selectedFiles.value.forEach((file) => {
      formData.append('attachments[]', file);
    });

    const res = await noteService.create(formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    if (res.data && res.data.success) {
      successToast(res.data.message || 'Catatan berhasil dibuat');
      // prepend new note to list if returned
      const created = res.data.data || null;
      if (created) notes.value.unshift(created);
      else await loadNotes(project.value.id);
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

// Generic confirm modal state & handlers (copied from WorkspacePage pattern)
const showConfirmModal = ref(false);
const confirmTitle = ref('');
const confirmMessage = ref('');
const confirmAction = ref('');
const confirmPayload = ref(null);
const confirmLoading = ref(false);

const openConfirm = ({ title = 'Konfirmasi', message = '', action = '', payload = null } = {}) => {
  confirmTitle.value = title;
  confirmMessage.value = message;
  confirmAction.value = action;
  confirmPayload.value = payload;
  showConfirmModal.value = true;
};

const closeConfirm = () => {
  showConfirmModal.value = false;
  confirmTitle.value = '';
  confirmMessage.value = '';
  confirmAction.value = '';
  confirmPayload.value = null;
  confirmLoading.value = false;
};

const handleConfirm = async () => {
  if (!confirmAction.value) { closeConfirm(); return; }
  confirmLoading.value = true;
  try {
    if (confirmAction.value === 'deleteNote') {
      const noteId = confirmPayload.value?.noteId;
      if (!noteId) { errorToast('Note ID tidak ditemukan'); return; }
      const res = await noteService.remove(noteId);
      if (res.data && res.data.success) {
        notes.value = notes.value.filter(n => n.id !== noteId);
        successToast(res.data.message || 'Catatan dihapus');
      } else {
        errorToast(res.data?.message || 'Gagal menghapus catatan');
      }
    }
    else if (confirmAction.value === 'deleteProjectStatus') {
      // payload: { status }
      try {
        const status = confirmPayload.value?.status;
        if (!status) throw new Error('Status tidak ditemukan');
        const projectSlug = route.params.projectSlug;
        const res = await projectService.deleteStatus(projectSlug, status.id);
        if (res.data && res.data.success) {
          projectStatuses.value = projectStatuses.value.filter(s => s.id !== status.id);
          await loadTaskStatuses();
          successToast(res.data.message || 'Status proyek dihapus');
        } else {
          errorToast(res.data?.message || 'Gagal menghapus status proyek');
        }
      } catch (err) {
        console.error('Error in deleteProjectStatus confirm handler:', err);
        errorToast('Terjadi kesalahan saat menghapus status proyek');
      }
    }
  } catch (err) {
    console.error('Error handling confirm action:', err);
    errorToast('Terjadi kesalahan');
  } finally {
    confirmLoading.value = false;
    closeConfirm();
  }
};

const deleteNote = async (noteId) => {
  openConfirm({ title: 'Hapus Catatan', message: 'Hapus catatan ini?', action: 'deleteNote', payload: { noteId } });
};

// =========================
// Pengaturan (Settings)
// =========================
// Settings tab state
const showSettings = ref(false);
const settings = ref({ name: '', description: '', logoFile: null, is_active: true, is_public: false, removeLogo: false });
const settingsPreview = ref(null);
const savingSettings = ref(false);

// Status management for project
const projectStatuses = ref([]);
const newStatus = ref({ name: '', color: '#17a2b8', is_completed: false, is_cancelled: false });
const editingStatus = ref(null);
// (inline edit refs removed — modal is used instead)
const statusLoading = ref(false);

// Modal state for status create/edit
const showStatusModal = ref(false);
const isStatusEditing = ref(false);
const statusForm = ref({ id: null, name: '', color: '#17a2b8', is_completed: false, is_cancelled: false });
const statusSaving = ref(false);

const openCreateStatusModal = () => {
  isStatusEditing.value = false;
  statusForm.value = { id: null, name: '', color: '#17a2b8', is_completed: false, is_cancelled: false };
  showStatusModal.value = true;
};

const openEditStatusModal = (status) => {
  isStatusEditing.value = true;
  console.log(status);
  statusForm.value = { id: status.id, name: status.name || '', color: status.color || '#17a2b8', is_completed: !!status.is_completed, is_cancelled: !!status.is_cancelled };
  showStatusModal.value = true;
};

const closeStatusModal = () => {
  showStatusModal.value = false;
};

const submitStatusModal = async () => {
  if (!statusForm.value.name?.trim()) {
    errorToast('Nama status tidak boleh kosong');
    return;
  }

  statusSaving.value = true;
  try {
    const projectSlug = route.params.projectSlug;
    if (isStatusEditing.value) {
      const payload = { name: statusForm.value.name, color: statusForm.value.color, is_completed: statusForm.value.is_completed ? 1 : 0, is_cancelled: statusForm.value.is_cancelled ? 1 : 0 };
      const res = await projectService.updateStatus(projectSlug, statusForm.value.id, payload);
      if (res.data && res.data.success) {
        successToast(res.data.message || 'Status diperbarui');
        const idx = projectStatuses.value.findIndex(s => s.id === statusForm.value.id);
        if (idx !== -1) projectStatuses.value.splice(idx, 1, res.data.data || { ...statusForm.value });
        await loadTaskStatuses();
        closeStatusModal();
      } else {
        errorToast(res.data?.message || 'Gagal memperbarui status');
      }
    } else {
      const payload = { name: statusForm.value.name, color: statusForm.value.color, is_completed: statusForm.value.is_completed ? 1 : 0, is_cancelled: statusForm.value.is_cancelled ? 1 : 0 };
      const res = await projectService.createStatus(projectSlug, payload);
      if (res.data && res.data.success) {
        successToast(res.data.message || 'Status dibuat');
        projectStatuses.value.unshift(res.data.data);
        await loadTaskStatuses();
        closeStatusModal();
      } else {
        errorToast(res.data?.message || 'Gagal membuat status');
      }
    }
  } catch (err) {
    console.error('Error submitting status modal:', err);
    errorToast('Terjadi kesalahan saat menyimpan status');
  } finally {
    statusSaving.value = false;
  }
};

// Load project statuses (alias of taskStatuses) but keep separate for management UI
const loadProjectStatuses = async () => {
  try {
    statusLoading.value = true;
    const projectSlug = route.params.projectSlug;
    const res = await projectService.getProjectStatus(projectSlug);
    projectStatuses.value = res.data.data || [];
  } catch (err) {
    console.error('Error loading project statuses:', err);
    errorToast('Gagal memuat status proyek');
  } finally {
    statusLoading.value = false;
  }
};

// Drag & drop for status ordering (settings list)
const statusDragIndex = ref(null);
const statusDropIndex = ref(null);

const onStatusDragStart = (event, idx) => {
  statusDragIndex.value = idx;
  // set drag data to allow drop
  try { event.dataTransfer.setData('text/plain', String(idx)); } catch (e) { /* some browsers */ }
};

const onStatusDragOver = (event, idx) => {
  // highlight potential drop target - handled via CSS :hover mainly
  statusDropIndex.value = idx;
};

const debounce = (fn, wait = 300) => {
  let t = null;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...args), wait);
  };
};

// Persist order to server (debounced to avoid many calls)
const persistStatusOrder = debounce(async (ordered) => {
  try {
    const projectSlug = route.params.projectSlug;
    // payload: { orders: [{ id, order }, ...] }
    const payload = { orders: ordered.map((s, i) => ({ id: s.id, order: i + 1 })) };
    const res = await projectService.updateStatusOrder(projectSlug, payload);
    if (res.data && res.data.success) {
      successToast('Urutan status proyek tersimpan');
    } else {
      errorToast(res.data?.message || 'Gagal menyimpan urutan status');
    }
  } catch (err) {
    console.error('Error persisting status order:', err);
    errorToast('Terjadi kesalahan saat menyimpan urutan status');
  }
}, 250);

const onStatusDrop = async (event, idx) => {
  const from = statusDragIndex.value ?? parseInt(event.dataTransfer.getData('text/plain'));
  const to = idx;
  if (from == null || to == null || from === to) {
    statusDragIndex.value = null;
    statusDropIndex.value = null;
    return;
  }

  // Reorder local array
  const list = [...projectStatuses.value];
  const [moved] = list.splice(from, 1);
  list.splice(to, 0, moved);
  projectStatuses.value = list.map((s, i) => ({ ...s, order: i + 1 }));

  // Persist order (debounced)
  persistStatusOrder(projectStatuses.value);

  // reset drag indices
  statusDragIndex.value = null;
  statusDropIndex.value = null;
};

// Create status
const createStatus = async () => {
  try {
    const projectSlug = route.params.projectSlug;
    const payload = { ...newStatus.value };
    const res = await projectService.createStatus(projectSlug, payload);
    if (res.data && res.data.success) {
      successToast(res.data.message || 'Status dibuat');
      projectStatuses.value.unshift(res.data.data);
      // refresh taskStatuses used by board
      await loadTaskStatuses();
      newStatus.value = { name: '', color: '#17a2b8', is_completed: false, is_cancelled: false };
    } else {
      errorToast(res.data?.message || 'Gagal membuat status');
    }
  } catch (err) {
    console.error('Error creating status:', err);
    errorToast('Terjadi kesalahan saat membuat status');
  }
};

// Edit status (begin editing)
// beginEditStatus removed in favor of modal-based editor

const cancelEditStatus = () => {
  editingStatus.value = null;
};

// Update status
const updateStatus = async () => {
  if (!editingStatus.value) return;
  try {
    const projectSlug = route.params.projectSlug;
    const res = await projectService.updateStatus(projectSlug, editingStatus.value.id, editingStatus.value);
    if (res.data && res.data.success) {
      successToast(res.data.message || 'Status diperbarui');
      // update local arrays
      const idx = projectStatuses.value.findIndex(s => s.id === editingStatus.value.id);
      if (idx !== -1) projectStatuses.value.splice(idx, 1, res.data.data || editingStatus.value);
      await loadTaskStatuses();
      editingStatus.value = null;
    } else {
      errorToast(res.data?.message || 'Gagal memperbarui status');
    }
  } catch (err) {
    console.error('Error updating status:', err);
    errorToast('Terjadi kesalahan saat memperbarui status');
  }
};

// Delete status
const removeStatus = async (status) => {
  openConfirm({
    title: 'Hapus Status Proyek',
    message: `Hapus status "${status.name}" dari proyek ini?`,
    action: 'deleteProjectStatus',
    payload: { status }
  });
};

// Fill settings from project
const fillSettingsFromProject = () => {
  if (!project.value) return;
  settings.value.name = project.value.name || '';
  settings.value.description = project.value.description || '';
  // coerce to boolean in case API returns 0/1 or "0"/"1"
  settings.value.is_active = Boolean(project.value.is_active ?? true);
  settings.value.is_public = Boolean(project.value.is_public ?? false);
  settingsPreview.value = project.value.logo || null;
  settings.value.removeLogo = false;
};

watch(project, (val) => {
  if (val) fillSettingsFromProject();
});

// Logo handling for project settings
const settingsLogoInput = ref(null);
const MAX_LOGO_SIZE = 5 * 1024 * 1024;

const onSettingsLogoSelect = (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) return;
  if (file.size > MAX_LOGO_SIZE) {
    errorToast('Ukuran file logo terlalu besar (maks 5MB)');
    return;
  }
  settings.value.logoFile = file;
  settingsPreview.value = URL.createObjectURL(file);
};

const removeSettingsLogo = () => {
  settings.value.logoFile = null;
  settingsPreview.value = null;
  settings.value.removeLogo = true;
};

const saveProjectSettings = async () => {
  if (!project.value) return;
  savingSettings.value = true;
  try {
    const projectSlug = route.params.projectSlug;
    const formData = new FormData();
    formData.append('name', settings.value.name || '');
    formData.append('description', settings.value.description || '');
    formData.append('is_active', settings.value.is_active ? 1 : 0);
    formData.append('is_public', settings.value.is_public ? 1 : 0);
    if (settings.value.logoFile) {
      formData.append('logo', settings.value.logoFile);
    }
    if (settings.value.removeLogo) {
      formData.append('remove_logo', 1);
    }

    const res = await projectService.update(projectSlug, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
    if (res.data && res.data.success) {
      successToast(res.data.message || 'Pengaturan proyek disimpan');
      // refresh project
      await refreshProject();
      fillSettingsFromProject();
    } else {
      errorToast(res.data?.message || 'Gagal menyimpan pengaturan');
    }
  } catch (err) {
    console.error('Error saving project settings:', err);
    errorToast('Terjadi kesalahan saat menyimpan pengaturan');
  } finally {
    savingSettings.value = false;
  }
};

// TaskModal handlers
const handleTaskModalClose = () => {
  showTaskModal.value = false;
  selectedTask.value = null;
};

const handleTaskUpdated = async (updatedTask) => {
  // Check if this is a new task (no existing ID) or an update
  const taskIndex = tasks.value.findIndex(t => t.id === updatedTask.id);
  if (taskIndex !== -1) {
    // Update existing task
    tasks.value[taskIndex] = updatedTask;
  } else if (updatedTask.id) {
    // This is a new task that was just created
    tasks.value.push(updatedTask);
  }
  
  // Refresh project data to get updated stats
  await refreshProject();
  
  // Reload tasks to ensure data consistency
  const projectSlug = route.params.projectSlug;
  await loadTasks(projectSlug);
  
  // If we're on activities view, refresh activities too
  if (activeView.value === 'activities') {
    await loadActivities();
  }
};

const handleTaskDeleted = async (taskId) => {
  // Remove task from tasks array
  tasks.value = tasks.value.filter(t => t.id !== taskId);
  
  // Refresh project data to get updated stats
  await refreshProject();
  
  // Reload tasks to ensure data consistency
  const projectSlug = route.params.projectSlug;
  await loadTasks(projectSlug);
  
  // If we're on activities view, refresh activities too
  if (activeView.value === 'activities') {
    await loadActivities();
  }
  
  // Close modal
  handleTaskModalClose();
};
</script>

<style scoped>
.project-detail-page {
  min-height: 100vh;
  background: var(--color-background);
}

.draggable-row {
  cursor: grab;
  transition: background-color 0.12s ease, transform 0.12s ease;
}
.draggable-row:active {
  cursor: grabbing;
}
.drag-handle {
  cursor: grab;
  margin-right: 8px;
  color: var(--color-muted);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 20px;
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
  align-items: center;
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

/* Task summary card */
.task-summary {
  display: flex;
  flex-direction: column;
  gap: 8px;
  /* match task card styling so theme colors are consistent */
  background: var(--color-background);
  border: 1px solid var(--color-border);
  padding: 12px 16px;
  border-radius: 8px;
  min-width: 200px;
}
.task-summary-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.summary-left {
  display: flex;
  flex-direction: column;
}
.summary-number {
  font-weight: 700;
  font-size: 16px;
  color: var(--color-text);
}
.summary-label {
  font-size: 12px;
  color: var(--color-muted);
}
.summary-percent .percent {
  font-weight: 700;
  color: var(--color-primary-600);
  font-size: 18px;
}
.progress-bar {
  width: 100%;
  height: 8px;
  background: var(--color-border);
  border-radius: 999px;
  overflow: hidden;
}
.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--color-primary-500), var(--color-primary-600, #6c5ce7));
  border-radius: 999px;
  transition: width 0.4s ease, box-shadow 0.25s ease;
}
.summary-breakdown {
  display: flex;
  gap: 8px;
  align-items: center;
  justify-content: flex-start;
}
.badge {
  padding: 4px 8px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
}
.badge.completed { background: rgba(34,197,94,0.12); color: #16a34a; }
.badge.incomplete { background: rgba(250,204,21,0.12); color: #d97706; }
.badge.cancelled { background: rgba(220,38,38,0.08); color: #dc2626; }

/* Full width container under header */
.task-summary.compact-left {
  width: 360px;
  background: var(--color-card-bg, linear-gradient(180deg, rgba(255,255,255,0.02), rgba(255,255,255,0.01)));
  border: 1px solid var(--color-border-weak, rgba(255,255,255,0.02));
  padding: 10px 12px;
  margin-top: 12px;
  border-radius: 10px;
  box-shadow: var(--card-shadow, 0 8px 24px rgba(2,6,23,0.4));
}

@media (max-width: 1024px) {
  .task-summary.compact-left {
    width: 100%;
  }
}

.project-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 320px;
  justify-content: flex-end;
}

.project-actions .task-summary {
  margin-right: 12px;
  min-width: 260px;
}

.project-actions .actions-right {
  display: flex;
  align-items: center;
}

/* Responsive: stack summary above actions on small screens */
@media (max-width: 820px) {
  .project-header {
    flex-direction: column;
    align-items: stretch;
  }

  .project-actions {
    margin-top: 12px;
    min-width: auto;
    justify-content: space-between;
    gap: 8px;
    flex-wrap: wrap;
  }

  .project-actions .task-summary {
    width: 100%;
    margin-right: 0;
  }

  .project-actions .actions-right {
    width: 100%;
    display: flex;
    justify-content: flex-end;
  }
}

/* Header actions: right-side summary + CTA */
.header-actions {
  align-items: center;
}

.summary-cta {
  display: flex;
  align-items: center;
  gap: 12px;
}

.task-summary.header-right {
  width: 320px;
  background: var(--color-background);
  padding: 12px 14px;
  border-radius: 8px;
  border: 1px solid var(--color-border);
}

.btn-cta {
  white-space: nowrap;
  padding: 12px 18px;
  border-radius: 10px;
}

@media (max-width: 1024px) {
  .task-summary.header-right { display: none; }
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
  gap: 8px;
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
    gap: 8px;
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

.list-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.list-actions {
  display: flex;
  align-items: center;
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

/* Notes View */
.notes-view {
  min-height: 400px;
}

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

.note-author { 
  color: var(--color-text); 
}

.note-meta { 
  color: var(--color-muted); 
  font-size: 13px; 
  margin-left: 8px; 
}

.note-body p { 
  margin: 0; 
  color: var(--color-text); 
}

/* Note content styling for rendered HTML */
.note-content {
  color: var(--color-text);
  line-height: 1.6;
}

.note-content p {
  margin: 0 0 0.5em 0;
}

.note-content p:last-child {
  margin-bottom: 0;
}

.note-content strong {
  font-weight: 600;
}

.note-content em {
  font-style: italic;
}

.note-content ul,
.note-content ol {
  margin: 0.5em 0;
  padding-left: 1.5em;
}

.note-content li {
  margin: 0.25em 0;
}

.note-content h1,
.note-content h2,
.note-content h3,
.note-content h4,
.note-content h5,
.note-content h6 {
  margin: 0.75em 0 0.5em 0;
  font-weight: 600;
}

.note-content blockquote {
  border-left: 3px solid var(--color-border);
  padding-left: 1em;
  margin: 0.5em 0;
  color: var(--color-muted);
}

.note-content code {
  background: var(--color-background-soft);
  padding: 0.2em 0.4em;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.9em;
}

.note-content pre {
  background: var(--color-background-soft);
  padding: 1em;
  border-radius: 6px;
  overflow-x: auto;
  margin: 0.5em 0;
}

.note-content pre code {
  background: none;
  padding: 0;
}

.note-content a {
  color: var(--color-primary-600);
  text-decoration: none;
}

.note-content a:hover {
  text-decoration: underline;
}

.note-attachments ul { 
  list-style: none; 
  padding: 0; 
  margin: 8px 0 0 0; 
}

.note-attachments li { 
  margin-bottom: 6px; 
}

.note-attachments a { 
  color: var(--color-primary-600); 
}

.muted { 
  color: var(--color-muted); 
  font-size: 12px; 
}

/* Empty state for notes */
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

/* Settings Tab Styles */
.settings-tab {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

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
  margin: 0 0 20px 0;
}

/* Settings form two-column layout */
.settings-form { 
  width: 100%; 
}

.settings-form-row { 
  display: flex; 
  gap: 20px; 
  align-items: flex-start; 
}

.settings-left { 
  flex: 3 1 0%; 
}

.settings-right { 
  flex: 1 1 0%; 
  display: flex; 
  flex-direction: column; 
  gap: 12px; 
  align-items: flex-start; 
}

.actions-row { 
  margin-top: 18px; 
}

@media (max-width: 768px) {
  .settings-form-row { 
    flex-direction: column; 
  }
  
  .settings-right { 
    align-items: flex-start; 
  }
}

/* Form elements */
.form-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
  margin-bottom: 8px;
}

.form-input {
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

.form-input:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Status toggles */
.status-group { 
  display: flex; 
  gap: 18px; 
  flex-wrap: wrap; 
}

.status-item { 
  display: flex; 
  align-items: center; 
  gap: 12px; 
}

.switch { 
  position: relative; 
  display: inline-block; 
  width: 48px; 
  height: 28px; 
}

.switch input { 
  opacity: 0; 
  width: 0; 
  height: 0; 
}

.switch-slider {
  position: absolute; 
  cursor: pointer; 
  top: 0; 
  left: 0; 
  right: 0; 
  bottom: 0;
  background-color: var(--color-border); 
  border-radius: 999px; 
  transition: background-color .18s ease;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,0.04);
}

.switch-slider::before {
  content: '';
  position: absolute; 
  width: 20px; 
  height: 20px; 
  left: 4px; 
  top: 4px; 
  background: white; 
  border-radius: 50%; 
  transition: transform .18s ease;
  box-shadow: 0 2px 6px rgba(16,24,40,0.08);
}

.switch input:checked + .switch-slider { 
  background-color: var(--color-primary-500); 
}

.switch input:checked + .switch-slider::before { 
  transform: translateX(20px); 
}

.switch-labels { 
  display: flex; 
  flex-direction: column; 
}

.switch-title { 
  font-weight: 600; 
  font-size: 14px; 
  color: var(--color-text); 
}

.switch-sub { 
  font-size: 12px; 
  color: var(--color-muted); 
}

/* Logo upload */
.logo-upload {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.logo-preview {
  width: 80px;
  height: 80px;
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid var(--color-border);
  cursor: pointer;
  transition: all 0.2s ease;
}

.logo-preview:hover {
  border-color: var(--color-primary-500);
}

.logo-preview.logo-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  background: var(--color-background-soft);
}

.logo-preview.logo-empty {
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-background-soft);
  color: var(--color-muted);
  font-size: 12px;
  text-align: center;
}

.logo-thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.logo-meta {
  margin-top: 4px;
  font-size: 12px;
  color: var(--color-muted);
  text-align: center;
}

.logo-actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.file-input { 
  display: none; 
}

/* Checkbox options */
.checkbox-option {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  margin: 0;
  vertical-align: middle;
}

.checkbox-option input[type="checkbox"] {
  /* larger, touch-friendly checkbox styled to match app theme */
  width: 18px;
  height: 18px;
  margin: 0;
  cursor: pointer;
  -webkit-appearance: none;
  appearance: none;
  display: inline-block;
  vertical-align: middle;
  border-radius: 6px;
  border: 2px solid var(--color-border);
  background: transparent;
  position: relative;
  transition: all 0.15s ease;
  /* Use modern accent-color where supported to color the checkmark/background */
  accent-color: var(--color-primary-500);
}

.checkbox-option input[type="checkbox"]:checked {
  background: var(--color-primary-500);
  border-color: var(--color-primary-500);
}

.checkbox-option input[type="checkbox"]:checked::after {
  content: '\2713';
  color: #fff;
  font-size: 12px;
  position: absolute;
  left: 3px;
  top: -2px;
}

.checkbox-label {
  display: inline-flex;
  align-items: center;
  font-size: 14px;
  color: var(--color-text);
  cursor: pointer;
  margin: 0;
  line-height: 1.2;
  user-select: none;
}

/* Status management */
.status-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.status-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.status-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.status-color {
  width: 12px;
  height: 12px;
  border-radius: 3px;
}

.status-actions {
  display: flex;
  gap: 8px;
}

.status-form, .status-edit {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 16px;
  margin-top: 16px;
}

.status-form h5, .status-edit h5 {
  margin: 0 0 16px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
}

.form-actions {
  display: flex;
  gap: 8px;
  margin-top: 16px;
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

/* Member management styles */
.members-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 24px;
}

.members-header h3 {
  margin: 0;
  font-size: 24px;
  font-weight: 600;
  color: var(--color-text);
}

.member-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  margin-bottom: 12px;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.member-avatar {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  overflow: hidden;
  background: var(--color-background-soft);
  border: 2px solid var(--color-border);
}

.member-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.member-avatar-fallback {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-primary-500);
  color: white;
  font-weight: 600;
  font-size: 14px;
}

.member-details {
  flex: 1;
}

.member-name {
  font-weight: 600;
  color: var(--color-text);
  margin-bottom: 4px;
}

.member-email {
  color: var(--color-muted);
  font-size: 14px;
  margin-bottom: 4px;
}

.role-badge {
  display: inline-block;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  background: var(--color-background-soft);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.role-badge.admin {
  background: #fee2e2;
  color: #dc2626;
  border-color: #fca5a5;
}

.role-badge.manager {
  background: #fef3c7;
  color: #d97706;
  border-color: #fde68a;
}

.role-badge.member {
  background: #e0f2fe;
  color: #0288d1;
  border-color: #81d4fa;
}

.member-actions-menu {
  position: relative;
}

.member-menu-dropdown {
  position: absolute;
  top: 100%;
  right: 0;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 10;
  min-width: 150px;
  overflow: hidden;
}

.dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 12px 16px;
  background: none;
  border: none;
  text-align: left;
  cursor: pointer;
  color: var(--color-text);
  transition: background-color 0.15s ease;
}

.dropdown-item:hover {
  background: var(--color-background-soft);
}

.dropdown-item.text-danger {
  color: #dc2626;
}

.dropdown-item.text-danger:hover {
  background: #fee2e2;
}

/* Member preview in modals */
.member-preview {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 16px;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  margin-bottom: 16px;
}

/* Autocomplete styles */
.autocomplete {
  position: relative;
}

.autocomplete-list {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
  z-index: 20;
  max-height: 200px;
  overflow-y: auto;
}

.autocomplete-item {
  padding: 12px 16px;
  cursor: pointer;
  border-bottom: 1px solid var(--color-border);
}

.autocomplete-item:last-child {
  border-bottom: none;
}

.autocomplete-item:hover {
  background: var(--color-background-soft);
}

.autocomplete-item.disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.autocomplete-item.disabled:hover {
  background: transparent;
}

.autocomplete-item-main {
  font-weight: 500;
  color: var(--color-text);
}

.autocomplete-item-note {
  font-size: 12px;
  color: var(--color-muted);
  margin-top: 2px;
}

.autocomplete-empty {
  padding: 12px 16px;
  color: var(--color-muted);
  text-align: center;
}

.text-muted {
  color: var(--color-muted);
}

.text-danger {
  color: #dc2626;
}

/* ===== Files View Styles - Clean Version ===== */
.files-view {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

/* Files Header */
.files-header {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 24px;
}

.files-header-content {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 24px;
}

.files-title-section {
  flex: 1;
}

.files-title {
  font-size: 24px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 8px 0;
}

.files-subtitle {
  font-size: 14px;
  color: var(--color-muted);
  margin: 0;
}

.files-controls {
  display: flex;
  align-items: center;
  gap: 16px;
}

.search-box {
  position: relative;
  display: flex;
  align-items: center;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 0 12px;
  min-width: 240px;
  transition: border-color 0.2s ease;
}

.search-box:focus-within {
  border-color: var(--color-primary-500);
}

.search-icon {
  color: var(--color-muted);
  margin-right: 8px;
  font-size: 14px;
}

.search-input {
  background: none;
  border: none;
  outline: none;
  padding: 10px 0;
  font-size: 14px;
  color: var(--color-text);
  flex: 1;
}

.search-input::placeholder {
  color: var(--color-muted);
}

.type-filter {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 10px 12px;
  font-size: 14px;
  color: var(--color-text);
  cursor: pointer;
  min-width: 120px;
  transition: border-color 0.2s ease;
}

.type-filter:focus {
  border-color: var(--color-primary-500);
  outline: none;
}

/* Files Content */
.files-content {
  flex: 1;
}

/* Loading State */
.files-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  text-align: center;
}

.files-loading p {
  margin: 16px 0 0 0;
  color: var(--color-muted);
  font-size: 14px;
}

/* Empty State */
.files-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 80px 24px;
  text-align: center;
}

.empty-icon {
  width: 64px;
  height: 64px;
  border-radius: 50%;
  background: var(--color-background-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-muted);
  margin-bottom: 24px;
}

.empty-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 8px 0;
}

.empty-text {
  color: var(--color-muted);
  font-size: 14px;
  line-height: 1.5;
  margin: 0 0 24px 0;
  max-width: 400px;
}

/* Files Grid */
.files-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 24px;
}

/* File Card */
.file-card {
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  padding: 20px;
  transition: all 0.2s ease;
  cursor: pointer;
  position: relative;
}

.file-card:hover {
  border-color: var(--color-primary-300);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
  transform: translateY(-1px);
}

/* File Preview */
.file-preview {
  width: 100%;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  background: var(--color-background-soft);
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.file-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.file-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  color: var(--color-muted);
}

/* File type colors */
.file-icon .image {
  color: #10b981;
}

.file-icon .document {
  color: #3b82f6;
}

.file-icon .archive {
  color: #f59e0b;
}

.file-icon .video {
  color: #8b5cf6;
}

.file-icon .audio {
  color: #ef4444;
}

/* File Info */
.file-info {
  margin-bottom: 16px;
}

.file-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 8px 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  line-clamp: 2;
  overflow: hidden;
}

.file-details {
  display: flex;
  gap: 8px;
  align-items: center;
}

.file-details span {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 4px;
  padding: 2px 6px;
  font-size: 12px;
  color: var(--color-muted);
}

.file-source-badge {
  background: transparent;
  border: 1px solid var(--color-border);
  color: var(--color-muted);
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 600;
  white-space: nowrap;
}

.file-size {
  color: var(--color-primary-600) !important;
  background: var(--color-primary-50) !important;
  border-color: var(--color-primary-200) !important;
}

/* File Actions */
.file-actions {
  display: flex;
  align-items: center;
  justify-content: space-between; /* actions left, badge right */
  gap: 12px;
  opacity: 1; /* always visible */
  transition: opacity 0.15s ease, transform 0.15s ease;
  padding: 6px 8px 0 8px;
}

.action-group {
  display: inline-flex;
  align-items: center;
  gap: 10px;
}

/* Keep a subtle de-emphasis when not interacting */
.file-card:not(:hover) .action-btn {
  opacity: 0.9;
  transform: translateY(0);
}

.file-card:hover .action-btn {
  opacity: 1;
  transform: translateY(-2px);
}

.action-btn {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  border: 1px solid var(--color-border);
  background: var(--color-background-soft);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-muted);
  text-decoration: none;
  transition: all 0.2s ease;
  cursor: pointer;
  font-size: 12px;
}

.action-btn:hover {
  background: var(--color-primary-500);
  border-color: var(--color-primary-500);
  color: white;
}

/* Responsive Design */
@media (max-width: 1200px) {
  .files-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }
}

@media (max-width: 768px) {
  .files-header-content {
    flex-direction: column;
    gap: 16px;
  }
  
  .files-controls {
    width: 100%;
  }
  
  .search-box {
    min-width: auto;
    flex: 1;
  }
  
  .files-grid {
    grid-template-columns: 1fr;
    gap: 16px;
  }
}

@media (max-width: 480px) {
  .files-header {
    padding: 20px;
  }
  
  .files-title {
    font-size: 20px;
  }
  
  .file-card {
    padding: 16px;
  }
  
  .file-preview {
    height: 100px;
  }
  
  .files-controls {
    flex-direction: column;
    gap: 12px;
  }
  
  .type-filter {
    width: 100%;
  }
}
</style>
