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
            <button v-if="canInviteMembers" class="btn btn-secondary" @click="openInviteModal" v-show="activeTab === 'members'" :disabled="!canInviteMembers">
              <font-awesome-icon icon="user-plus" size="sm" />
              Undang Anggota
            </button>
            <button v-if="canInviteMembers" class="btn btn-primary" @click="openCreateProjectModal" v-show="activeTab === 'projects'">
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
            v-if="canAccessSettings"
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
                    <button v-if="canInviteMembers" class="btn-icon" title="Menu" @click.stop="toggleProjectMenu(project.id)">
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
              <!-- <div style="margin-top: 16px;">
                <button class="btn btn-primary" @click="openInviteModal" v-if="canInviteMembers">
                  <font-awesome-icon icon="user-plus" size="sm" />
                  Undang Anggota
                </button>
              </div> -->
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
                    <!-- Only show menu button and dropdown to users who can manage members -->
                    <button v-if="canInviteMembers && !isMemberSelf(member)" class="btn-icon" title="Menu" @click.stop="toggleMemberMenu(getMemberKey(member) || i)">
                      <font-awesome-icon icon="ellipsis-vertical" size="sm" />
                    </button>
                    <div v-if="canInviteMembers && !isMemberSelf(member) && menuOpenFor === (getMemberKey(member) || i)" class="member-menu-dropdown" @click.stop>
                      <button class="dropdown-item" @click="openEditMemberModal(member)">Edit Peran</button>
                      <button class="dropdown-item text-danger" @click="openRemoveMemberModal(member)">Hapus</button>
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
            <div v-if="!canAccessSettings" class="settings-noaccess">
              <h3>Akses Ditolak</h3>
              <p class="muted">Hanya Owner workspace atau Admin sistem yang dapat mengubah pengaturan ini.</p>
            </div>
            <div v-else>
            <div class="settings-section">
              <h3>Pengaturan Workspace</h3>
                      <p>Kelola preferensi dan konfigurasi workspace</p>
                      <!-- Settings form: 2-column layout (75% left / 25% right) -->
                      <div class="settings-form">
                        <div class="settings-form-row">
                          <div class="settings-left">
                            <div class="form-group">
                              <label class="form-label">Nama Workspace</label>
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
                                  <label class="switch" aria-label="Aktifkan workspace">
                                    <input type="checkbox" v-model="settings.is_active" aria-checked="{{settings.is_active}}" />
                                    <span class="switch-slider" role="switch" :aria-checked="String(settings.is_active)"></span>
                                  </label>
                                  <div class="switch-labels">
                                    <div class="switch-title">Aktif</div>
                                    <div class="switch-sub">Workspace dapat digunakan</div>
                                  </div>
                                </div>

                                <div class="status-item">
                                  <label class="switch" aria-label="Jadikan workspace publik">
                                    <input type="checkbox" v-model="settings.is_public" aria-checked="{{settings.is_public}}" />
                                    <span class="switch-slider" role="switch" :aria-checked="String(settings.is_public)"></span>
                                  </label>
                                  <div class="switch-labels">
                                    <div class="switch-title">Publik</div>
                                    <div class="switch-sub">Dapat dilihat oleh semua pengguna</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>

                          <div class="settings-right">
                            <label class="form-label">Logo Workspace</label>
                            <div class="logo-upload">
                              <input type="file" ref="logoInput" class="file-input" @change="onLogoSelect" accept="image/*" />
                              <div v-if="displayLogoSrc" class="logo-preview logo-card" @click="triggerLogoDialog" title="Klik untuk mengganti logo">
                                <img class="logo-thumb large" :src="displayLogoSrc" alt="logo preview"/>
                                <div class="logo-meta">
                                  <small v-if="settings.logoFile">{{ settings.logoFile?.name }}</small>
                                  <small v-else-if="workspace.logo">Logo saat ini</small>
                                </div>
                              </div>
                              <div v-else class="logo-preview logo-empty logo-card" @click="triggerLogoDialog" title="Klik untuk memilih logo">
                                <div class="logo-empty-text">Tidak ada logo</div>
                              </div>

                              <div class="logo-actions">
                                <button class="btn btn-primary" @click.prevent="triggerLogoDialog">
                                  <font-awesome-icon icon="upload" />
                                  <span class="btn-text">Pilih Logo</span>
                                </button>

                                <button
                                  class="btn btn-danger"
                                  v-if="settings.logoFile"
                                  @click="removeSelectedLogo"
                                  title="Batalkan pilihan file"
                                >
                                  <font-awesome-icon icon="ban" />
                                  <span class="btn-text">Batalkan</span>
                                </button>

                                <button
                                  :class="['btn', settings.removeLogo ? 'btn-warning' : 'btn-danger']"
                                  v-else-if="workspace.logo && !settings.logoFile"
                                  @click.prevent="handleRemoveLogoClick"
                                >
                                  <font-awesome-icon :icon="settings.removeLogo ? 'undo' : 'trash'" />
                                  <span class="btn-text">{{ settings.removeLogo ? 'Batalkan Hapus' : 'Hapus Logo' }}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div class="form-group actions-row">
                          <button class="btn btn-primary" :disabled="savingSettings" @click="saveWorkspaceSettings">
                            <font-awesome-icon icon="save" /> {{ savingSettings ? 'Menyimpan...' : 'Simpan Perubahan' }}
                          </button>
                        </div>
                      </div>

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
    </div>

  <!-- Error State -->
  <div v-if="!workspace && !loading" class="error-state">
      <font-awesome-icon icon="exclamation-triangle" size="3x" class="error-icon" />
      <h3>Workspace tidak ditemukan</h3>
      <p>Workspace yang Anda cari tidak ada atau Anda tidak memiliki akses.</p>
      <router-link to="/dashboard" class="btn btn-primary">Kembali ke Dashboard</router-link>
    </div>

    <!-- Create Project Modal -->
    <div v-if="showCreateProjectModal" class="modal-overlay" @click="closeCreateProjectModal">
      <div class="modal-container modal-large" @click.stop>
        <div class="modal-header">
          <h3>Buat Proyek Baru</h3>
          <button class="btn-close" @click="closeCreateProjectModal">
            <font-awesome-icon icon="times" />
          </button>
        </div>
        <div class="modal-body">
          <div class="project-form">
            <div class="form-row">
              <div class="form-left">
                <div class="form-group">
                  <label for="projectName" class="form-label">Nama Proyek <span class="required">*</span></label>
                  <input
                    id="projectName"
                    v-model="newProject.name"
                    type="text"
                    class="form-input"
                    placeholder="Masukkan nama proyek"
                    maxlength="255"
                    required
                  />
                </div>

                <div class="form-group">
                  <label for="projectDescription" class="form-label">Deskripsi</label>
                  <textarea
                    id="projectDescription"
                    v-model="newProject.description"
                    class="form-input"
                    rows="4"
                    placeholder="Masukkan deskripsi proyek"
                  ></textarea>
                </div>

                <div class="form-group">
                  <label class="form-label">Pengaturan Proyek</label>
                  <div class="status-group">
                    <div class="status-item">
                      <label class="switch" aria-label="Aktifkan proyek">
                        <input type="checkbox" v-model="newProject.is_active" />
                        <span class="switch-slider" role="switch" :aria-checked="String(newProject.is_active)"></span>
                      </label>
                      <div class="switch-labels">
                        <div class="switch-title">Aktif</div>
                        <div class="switch-sub">Proyek dapat digunakan</div>
                      </div>
                    </div>

                    <div class="status-item">
                      <label class="switch" aria-label="Jadikan proyek publik">
                        <input type="checkbox" v-model="newProject.is_public" />
                        <span class="switch-slider" role="switch" :aria-checked="String(newProject.is_public)"></span>
                      </label>
                      <div class="switch-labels">
                        <div class="switch-title">Publik</div>
                        <div class="switch-sub">Dapat dilihat oleh semua anggota workspace</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="form-right">
                <label class="form-label">Logo Proyek</label>
                <div class="logo-upload">
                  <input type="file" ref="projectLogoInput" class="file-input" @change="onProjectLogoSelect" accept="image/*" />
                  <div v-if="projectLogoPreview" class="logo-preview logo-card" @click="triggerProjectLogoDialog" title="Klik untuk mengganti logo">
                    <img class="logo-thumb large" :src="projectLogoPreview" alt="logo preview"/>
                    <div class="logo-meta">
                      <small>{{ newProject.logoFile?.name || 'Logo proyek' }}</small>
                    </div>
                  </div>
                  <div v-else class="logo-preview logo-empty logo-card" @click="triggerProjectLogoDialog" title="Klik untuk memilih logo">
                    <div class="logo-empty-text">Tidak ada logo</div>
                  </div>

                  <div class="logo-actions">
                    <button class="btn btn-primary" @click.prevent="triggerProjectLogoDialog">
                      <font-awesome-icon icon="upload" />
                      <span class="btn-text">Pilih Logo</span>
                    </button>

                    <button
                      class="btn btn-danger"
                      v-if="newProject.logoFile"
                      @click="removeProjectLogo"
                      title="Hapus file yang dipilih"
                    >
                      <font-awesome-icon icon="trash" />
                      <span class="btn-text">Hapus</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Anggota Proyek</label>
              <div class="members-section">
                <div class="members-list-container">
                  <div v-if="newProject.members.length === 0" class="no-members">
                    <p>Belum ada anggota yang ditambahkan. Klik tombol di bawah untuk menambah anggota.</p>
                  </div>
                  <div v-else class="selected-members">
                    <div v-for="(member, index) in newProject.members" :key="index" class="member-row">
                      <div class="member-info">
                        <div class="member-avatar">
                          <img v-if="member.user?.avatar" :src="member.user.avatar" :alt="member.user.name" />
                          <div v-else class="member-avatar-fallback">{{ getMemberInitials(member.user?.name) }}</div>
                        </div>
                        <div class="member-details">
                          <div class="member-name">{{ member.user?.name }}</div>
                          <div class="member-email">{{ member.user?.email }}</div>
                        </div>
                      </div>
                      <div class="member-role-select">
                        <select v-model="member.project_role_id" class="form-input">
                          <option value="">-- Pilih Peran --</option>
                          <option v-for="role in projectRoles" :key="role.id" :value="role.id">{{ role.name }}</option>
                        </select>
                      </div>
                      <button class="btn-remove" @click="removeMemberFromProject(index)" title="Hapus anggota">
                        <font-awesome-icon icon="times" />
                      </button>
                    </div>
                  </div>
                </div>
                <button class="btn btn-secondary btn-add-member" @click="openAddMemberModal">
                  <font-awesome-icon icon="user-plus" />
                  Tambah Anggota
                </button>
              </div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeCreateProjectModal" :disabled="creatingProject">Batal</button>
          <button 
            class="btn btn-primary" 
            :disabled="creatingProject || !isProjectFormValid" 
            @click="createProject"
          >
            <font-awesome-icon v-if="creatingProject" icon="spinner" spin />
            <font-awesome-icon v-else icon="plus" />
            {{ creatingProject ? 'Membuat...' : 'Buat Proyek' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Add Member to Project Modal -->
    <div v-if="showAddMemberModal" class="modal-overlay" @click="closeAddMemberModal">
      <div class="modal-container" @click.stop>
        <div class="modal-header">
          <h3>Tambah Anggota ke Proyek</h3>
          <button class="btn-close" @click="closeAddMemberModal">
            <font-awesome-icon icon="times" />
          </button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label for="memberSelect" class="form-label">Pilih Anggota Workspace</label>
            <select id="memberSelect" v-model="selectedMemberId" class="form-input">
              <option value="">-- Pilih Anggota --</option>
              <option 
                v-for="member in availableMembers" 
                :key="getMemberKey(member)" 
                :value="getMemberKey(member)"
              >
                {{ member.name || member.user?.name }} - {{ member.email || member.user?.email }}
              </option>
            </select>
          </div>

          <div class="form-group">
            <label for="memberProjectRole" class="form-label">Peran dalam Proyek</label>
            <select id="memberProjectRole" v-model="selectedMemberRoleId" class="form-input">
              <option value="">-- Pilih Peran --</option>
              <option v-for="role in projectRoles" :key="role.id" :value="role.id">{{ role.name }}</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="closeAddMemberModal">Batal</button>
          <button 
            class="btn btn-primary" 
            :disabled="!selectedMemberId || !selectedMemberRoleId" 
            @click="addMemberToProject"
          >
            <font-awesome-icon icon="plus" />
            Tambah
          </button>
        </div>
      </div>
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
              placeholder="Tulis catatan untuk anggota workspace..." 
              :min-height="150"
            />
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
            <label for="inviteUser" class="form-label">Cari Pengguna (nama atau email)</label>
            <div class="autocomplete">
              <input
                id="inviteUser"
                type="text"
                class="form-input"
                v-model="inviteSearch"
                @input="onSearchInput"
                placeholder="Ketik minimal 3 huruf untuk mencari..."
                autocomplete="off"
                aria-autocomplete="list"
              />

              <ul v-if="showSearchResults" class="autocomplete-list" role="listbox">
                <li
                  v-for="u in users"
                  :key="u.id || u.email"
                  class="autocomplete-item"
                  :class="{ disabled: isUserMember(u) }"
                  role="option"
                  @click="selectUser(u)"
                >
                  <div class="autocomplete-item-main">{{ u.name }} <small class="muted">— {{ u.email }}</small></div>
                  <div v-if="isUserMember(u)" class="autocomplete-item-note">sudah anggota</div>
                </li>
                <li v-if="!isSearching && users.length === 0" class="autocomplete-empty">Tidak ada hasil</li>
                <li v-if="isSearching" class="autocomplete-empty">Mencari...</li>
              </ul>
            </div>
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

  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { workspaceService } from '@/api/services/workspaceService';
import { noteService } from '@/api/services/noteService';
import { useAuthStore } from '@/stores/auth';
import { errorToast, successToast } from '@/utils/toast';
import api from '@/api/axios';
import TipTapEditor from '@/components/TipTapEditor.vue';

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

// Create project state
const newProject = ref({
  name: '',
  description: '',
  is_active: true,
  is_public: false,
  logoFile: null,
  members: []
});
const projectLogoPreview = ref(null);
const projectLogoInput = ref(null);
const creatingProject = ref(false);

// Add member to project state
const showAddMemberModal = ref(false);
const selectedMemberId = ref('');
const selectedMemberRoleId = ref('');
const projectRoles = ref([]);

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

// Generic confirm modal state & handler
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
    if (confirmAction.value === 'removeLogo') {
      // call existing remove logo API flow
      savingSettings.value = true;
      const slug = workspace.value?.slug;
      const res = await workspaceService.removeLogo(slug);
      if (res.data && res.data.success) {
        successToast(res.data.message || 'Logo berhasil dihapus');
        await loadWorkspace();
        fillSettingsFromWorkspace();
      } else {
        errorToast(res.data?.message || 'Gagal menghapus logo');
      }
      savingSettings.value = false;
    } else if (confirmAction.value === 'deleteNote') {
      const noteId = confirmPayload.value?.noteId;
      if (!noteId) { errorToast('Note ID tidak ditemukan'); return; }
      const res = await noteService.remove(noteId);
      if (res.data && res.data.success) {
        notes.value = notes.value.filter(n => n.id !== noteId);
        successToast(res.data.message || 'Catatan dihapus');
      } else {
        errorToast(res.data?.message || 'Gagal menghapus catatan');
      }
    } else if (confirmAction.value === 'removeMember') {
      const userId = confirmPayload.value?.userId;
      if (!userId) { errorToast('Target anggota tidak ditemukan'); return; }
      removingMember.value = true;
      try {
        const slug = workspace.value.slug;
        const payload = { user_id: userId, workspace_id: workspace.value.id };
        const res = await workspaceService.removeMember(slug, payload);
        if (res.data && res.data.success) {
          successToast(res.data.message || 'Anggota dihapus');
          await loadMembers(slug);
          showRemoveMemberModal.value = false;
        } else {
          errorToast(res.data?.message || 'Gagal menghapus anggota');
        }
      } catch (err) {
        console.error('Error removing member (confirm):', err);
        errorToast(err.response?.data?.message || 'Terjadi kesalahan saat menghapus anggota');
      } finally {
        removingMember.value = false;
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
  const roleRaw = currentWorkspaceRole.value || '';
  const role = String(roleRaw).toLowerCase();
  // Accept common variants (e.g. 'Owner', 'Workspace Owner', 'workspace_owner')
  // and admin variants. This ensures UX gating works across different API shapes.
  return role.includes('owner') || role.includes('admin') || role === 'workspace_owner' || role === 'workspace_admin';
});

// Only workspace owner (or system admin) can access Settings
const canAccessSettings = computed(() => {
  if (isSysAdmin.value) return true;
  const role = (currentWorkspaceRole.value || '')?.toString().toLowerCase() || '';
  // accept variants that include 'owner'
  return role.includes('owner');
});

// Project form validation
const isProjectFormValid = computed(() => {
  return newProject.value.name.trim().length > 0;
});

// Available members for project (workspace members not already added)
const availableMembers = computed(() => {
  if (!members.value) return [];
  const addedMemberIds = newProject.value.members.map(m => getMemberKey(m.user));
  return members.value.filter(member => {
    const memberId = getMemberKey(member);
    return !addedMemberIds.includes(memberId);
  });
});

// Invite members state
const users = ref([]);
const workspaceRoles = ref([]);
const inviteUserId = ref('');
const inviteRoleId = ref('');
const inviting = ref(false);
// Autocomplete search state
const inviteSearch = ref('');
const isSearching = ref(false);
const showSearchResults = ref(false);
let searchTimeout = null;

const openInviteModal = () => {
  if (!canInviteMembers.value) {
    errorToast('Anda tidak memiliki izin untuk mengundang anggota');
    return;
  }
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
  if (!canInviteMembers.value) {
    errorToast('Anda tidak memiliki izin untuk mengundang anggota');
    return;
  }
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

const onSearchInput = (e) => {
  const val = inviteSearch.value || '';
  // hide previously selected user id when typing
  inviteUserId.value = '';
  showSearchResults.value = !!val && val.length >= 3;
  if (searchTimeout) clearTimeout(searchTimeout);
  if (!val || val.length < 3) {
    users.value = [];
    isSearching.value = false;
    return;
  }
  // debounce request
  isSearching.value = true;
  searchTimeout = setTimeout(() => performSearch(val), 350);
};

const performSearch = async (q) => {
  try {
    const res = await (await import('@/api/services/userService')).userService.list({ search: q });
    users.value = res.data.data || [];
  } catch (err) {
    console.error('Error searching users:', err);
    users.value = [];
  } finally {
    isSearching.value = false;
    showSearchResults.value = true;
  }
};

const selectUser = (u) => {
  if (isUserMember(u)) {
    // do nothing for existing members
    return;
  }
  inviteUserId.value = u.id;
  inviteSearch.value = u.name + ' — ' + u.email;
  showSearchResults.value = false;
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
    const res = await workspaceService.getWorkspaceRoles(workspace.value.slug);
    workspaceRoles.value = res.data.data || [];
  } catch (error) {
    console.error('Error fetching workspace roles:', error);
  }
};

// Settings state
const settings = ref({ name: '', description: '', logoFile: null, is_active: true, is_public: false, removeLogo: false });
const settingsPreview = ref(null);
const savingSettings = ref(false);

// Prefill settings when workspace loads
const fillSettingsFromWorkspace = () => {
  settings.value.name = workspace.value?.name || '';
  settings.value.description = workspace.value?.description || '';
  settings.value.logoFile = null;
  settings.value.is_active = typeof workspace.value?.is_active !== 'undefined' ? !!workspace.value.is_active : true;
  settings.value.is_public = typeof workspace.value?.is_public !== 'undefined' ? !!workspace.value.is_public : false;
  settings.value.removeLogo = false;
  settingsPreview.value = null;
};

// (settings watcher below will fill settings when workspace changes)

// template ref for logo input
const logoInput = ref(null);

const triggerLogoDialog = () => {
  if (logoInput.value && typeof logoInput.value.click === 'function') logoInput.value.click();
};

// Logo handlers
const MAX_LOGO_SIZE = 5 * 1024 * 1024; // 5 MB
const settingsPreviewIsObjectUrl = ref(false);

const onLogoSelect = (e) => {
  const f = e.target.files && e.target.files[0];
  if (!f) return;
  // validate size
  if (f.size > MAX_LOGO_SIZE) {
    errorToast('Ukuran logo maksimal 5 MB');
    // reset input
    if (logoInput.value) logoInput.value.value = null;
    return;
  }
  settings.value.logoFile = f;
  // selecting a new file cancels any pending removal
  settings.value.removeLogo = false;
  // preview
  // revoke previous object URL if any
  if (settingsPreviewIsObjectUrl.value && settingsPreview.value) {
    try { URL.revokeObjectURL(settingsPreview.value); } catch (err) { /* ignore */ }
  }
  settingsPreview.value = URL.createObjectURL(f);
  settingsPreviewIsObjectUrl.value = true;
};

const removeSelectedLogo = () => {
  // revoke object url if used
  if (settingsPreviewIsObjectUrl.value && settingsPreview.value) {
    try { URL.revokeObjectURL(settingsPreview.value); } catch (err) { /* ignore */ }
  }
  settings.value.logoFile = null;
  settingsPreview.value = null;
  settingsPreviewIsObjectUrl.value = false;
  if (logoInput.value) logoInput.value.value = null;
  // removing selected file does not mark for server-side deletion
  settings.value.removeLogo = false;
};

const markRemoveLogo = () => {
  // mark that the existing logo should be removed on save
  settings.value.removeLogo = true;
  // clear any selected file or preview
  if (settingsPreviewIsObjectUrl.value && settingsPreview.value) {
    try { URL.revokeObjectURL(settingsPreview.value); } catch (err) { }
  }
  settings.value.logoFile = null;
  settingsPreview.value = null;
  settingsPreviewIsObjectUrl.value = false;
  if (logoInput.value) logoInput.value.value = null;
};

const toggleRemoveLogo = () => {
  // toggle removal mark; if turning off, just unset flag
  if (settings.value.removeLogo) {
    settings.value.removeLogo = false;
  } else {
    // mark for removal and clear local preview/file
    settings.value.removeLogo = true;
    if (settingsPreviewIsObjectUrl.value && settingsPreview.value) {
      try { URL.revokeObjectURL(settingsPreview.value); } catch (err) { }
    }
    settings.value.logoFile = null;
    settingsPreview.value = null;
    settingsPreviewIsObjectUrl.value = false;
    if (logoInput.value) logoInput.value.value = null;
  }
};

// Derived display source for logo: prefer preview; if removeLogo marked, hide existing logo
const displayLogoSrc = computed(() => {
  if (settingsPreview.value) return settingsPreview.value;
  if (settings.value.removeLogo) return null;
  return workspace.value?.logo || null;
});

const handleRemoveLogoClick = async () => {
  // If already marked for removal, just toggle off
  if (settings.value.removeLogo) {
    settings.value.removeLogo = false;
    return;
  }

  // Open confirm modal instead of native confirm
  openConfirm({
    title: 'Hapus Logo',
    message: 'Hapus logo workspace ini? Tindakan ini akan menghapus file dari penyimpanan.',
    action: 'removeLogo'
  });
};

const saveWorkspaceSettings = async () => {
  if (!workspace.value) return;
  savingSettings.value = true;
  try {
    const slug = workspace.value.slug;
    // prepare payload; use FormData if file present
    if (settings.value.logoFile) {
      const fd = new FormData();
      fd.append('name', settings.value.name);
      fd.append('description', settings.value.description);
      fd.append('is_active', settings.value.is_active ? '1' : '0');
      fd.append('is_public', settings.value.is_public ? '1' : '0');
      if (settings.value.removeLogo) fd.append('remove_logo', '1');
      fd.append('logo', settings.value.logoFile);
  const res = await workspaceService.update(slug, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      // if workspaceService.update doesn't accept FormData headers, axios will set headers automatically
      if (res.data && res.data.success) {
        successToast(res.data.message || 'Workspace diperbarui');
        // reload workspace
        await loadWorkspace();
      } else {
        errorToast(res.data?.message || 'Gagal menyimpan pengaturan');
      }
    } else {
      const payload = { name: settings.value.name, description: settings.value.description, is_active: settings.value.is_active, is_public: settings.value.is_public };
      if (settings.value.removeLogo) payload.remove_logo = true;
      const res = await workspaceService.update(workspace.value.slug, payload);
      if (res.data && res.data.success) {
        successToast(res.data.message || 'Workspace diperbarui');
        await loadWorkspace();
      } else {
        errorToast(res.data?.message || 'Gagal menyimpan pengaturan');
      }
    }
  } catch (error) {
    console.error('Error saving workspace settings:', error);
    errorToast(error.response?.data?.message || 'Terjadi kesalahan saat menyimpan');
  } finally {
    savingSettings.value = false;
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
  if (!canInviteMembers.value) {
    errorToast('Anda tidak memiliki izin untuk mengubah peran anggota');
    return;
  }
  if (isMemberSelf(member)) {
    errorToast('Anda tidak dapat mengubah peran akun Anda sendiri');
    return;
  }
  editMember.value = member;
  // ensure roles available
  if (!workspaceRoles.value || workspaceRoles.value.length === 0) await fetchWorkspaceRoles();
  // try to find current workspace role id from member
  editMemberWorkspaceRoleId.value = member.workspace_role_id || member.role_id || member.workspace_role?.id || null;
  showEditMemberModal.value = true;
};

const updateMemberRole = async () => {
  if (!canInviteMembers.value) {
    errorToast('Anda tidak memiliki izin untuk mengubah peran anggota');
    return;
  }
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
  if (!canInviteMembers.value) {
    errorToast('Anda tidak memiliki izin untuk menghapus anggota');
    return;
  }
  if (isMemberSelf(member)) {
    errorToast('Anda tidak dapat menghapus akun Anda sendiri dari workspace');
    return;
  }
  // prefer confirm modal for destructive action; still keep the remove member modal flow
  removeMemberTarget.value = member;
  openConfirm({
    title: 'Hapus Anggota',
    message: `Hapus anggota ${member?.name || member?.email || ''} dari workspace ini?`,
    action: 'removeMember',
    payload: { userId: getMemberKey(member) }
  });
};

const confirmRemoveMember = async () => {
  // This flow is now handled centrally by the confirm modal (handleConfirm)
  if (!canInviteMembers.value) {
    errorToast('Anda tidak memiliki izin untuk menghapus anggota');
    return;
  }
  // If the removal was triggered from the modal, ensure payload exists and call handleConfirm
  if (confirmAction.value === 'removeMember') {
    await handleConfirm();
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

// When workspace is loaded or changed, prefill settings
watch(workspace, (newVal) => {
  if (newVal) fillSettingsFromWorkspace();
});

// Close member menu when clicking outside
const handleDocumentClick = (e) => {
  // if click happened inside a member-actions-menu, do nothing
  if (e.target && e.target.closest && e.target.closest('.member-actions-menu')) return;
  // otherwise close any open member menu
  menuOpenFor.value = null;
};

onMounted(() => {
  document.addEventListener('click', handleDocumentClick);
});

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick);
  if (settingsPreviewIsObjectUrl.value && settingsPreview.value) {
    try { URL.revokeObjectURL(settingsPreview.value); } catch (err) { }
  }
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

// Project creation functions
const openCreateProjectModal = async () => {
  if (!canInviteMembers.value) {
    errorToast('Anda tidak memiliki izin untuk membuat proyek');
    return;
  }
  
  // Reset form
  newProject.value = {
    name: '',
    description: '',
    is_active: true,
    is_public: false,
    logoFile: null,
    members: []
  };
  projectLogoPreview.value = null;
  
  // Load project roles
  await fetchProjectRoles();
  
  showCreateProjectModal.value = true;
};

const closeCreateProjectModal = () => {
  showCreateProjectModal.value = false;
  // Clean up
  if (projectLogoPreview.value && newProject.value.logoFile) {
    try { URL.revokeObjectURL(projectLogoPreview.value); } catch (err) { /* ignore */ }
  }
  projectLogoPreview.value = null;
  if (projectLogoInput.value) projectLogoInput.value.value = null;
};

const fetchProjectRoles = async () => {
  try {
    // Try to get project roles from API
    const response = await (await import('@/api/axios')).default.get('/project-roles');
    projectRoles.value = response.data.data || [];
  } catch (error) {
    console.error('Error fetching project roles:', error);
    // Fallback roles if API fails
    projectRoles.value = [
      { id: 1, name: 'Owner', code: 'owner' },
      { id: 2, name: 'Admin', code: 'admin' },
      { id: 3, name: 'Member', code: 'member' },
      { id: 4, name: 'Guest', code: 'guest' }
    ];
  }
};

const triggerProjectLogoDialog = () => {
  if (projectLogoInput.value && typeof projectLogoInput.value.click === 'function') {
    projectLogoInput.value.click();
  }
};

const onProjectLogoSelect = (e) => {
  const file = e.target.files && e.target.files[0];
  if (!file) {
    // Clear any existing selection
    newProject.value.logoFile = null;
    if (projectLogoPreview.value) {
      try { URL.revokeObjectURL(projectLogoPreview.value); } catch (err) { /* ignore */ }
    }
    projectLogoPreview.value = null;
    return;
  }
  
  // Validate file type
  if (!file.type.startsWith('image/')) {
    errorToast('File harus berupa gambar');
    if (projectLogoInput.value) projectLogoInput.value.value = null;
    return;
  }
  
  // Validate file size (5MB max)
  const MAX_SIZE = 5 * 1024 * 1024;
  if (file.size > MAX_SIZE) {
    errorToast('Ukuran logo maksimal 5 MB');
    if (projectLogoInput.value) projectLogoInput.value.value = null;
    return;
  }
  
  newProject.value.logoFile = file;
  
  // Create preview
  if (projectLogoPreview.value) {
    try { URL.revokeObjectURL(projectLogoPreview.value); } catch (err) { /* ignore */ }
  }
  projectLogoPreview.value = URL.createObjectURL(file);
};

const removeProjectLogo = () => {
  if (projectLogoPreview.value) {
    try { URL.revokeObjectURL(projectLogoPreview.value); } catch (err) { /* ignore */ }
  }
  newProject.value.logoFile = null;
  projectLogoPreview.value = null;
  if (projectLogoInput.value) projectLogoInput.value.value = null;
};

const openAddMemberModal = () => {
  selectedMemberId.value = '';
  selectedMemberRoleId.value = '';
  showAddMemberModal.value = true;
};

const closeAddMemberModal = () => {
  showAddMemberModal.value = false;
  selectedMemberId.value = '';
  selectedMemberRoleId.value = '';
};

const addMemberToProject = () => {
  if (!selectedMemberId.value || !selectedMemberRoleId.value) {
    errorToast('Pilih anggota dan peran');
    return;
  }
  
  const member = members.value.find(m => getMemberKey(m) === selectedMemberId.value);
  if (!member) {
    errorToast('Anggota tidak ditemukan');
    return;
  }
  
  // Check if already added
  const alreadyAdded = newProject.value.members.some(m => getMemberKey(m.user) === selectedMemberId.value);
  if (alreadyAdded) {
    errorToast('Anggota sudah ditambahkan');
    return;
  }
  
  newProject.value.members.push({
    user_id: selectedMemberId.value,
    project_role_id: selectedMemberRoleId.value,
    user: member.user || member  // Handle different API response structures
  });
  
  closeAddMemberModal();
  successToast('Anggota berhasil ditambahkan');
};

const removeMemberFromProject = (index) => {
  newProject.value.members.splice(index, 1);
};

const createProject = async () => {
  if (!canInviteMembers.value) {
    errorToast('Anda tidak memiliki izin untuk membuat proyek');
    return;
  }
  
  if (!isProjectFormValid.value) {
    errorToast('Nama proyek wajib diisi');
    return;
  }
  
  creatingProject.value = true;
  
  try {
    const formData = new FormData();
    formData.append('workspace_id', workspace.value.id);
    formData.append('name', newProject.value.name.trim());
    formData.append('description', newProject.value.description.trim());
    formData.append('is_active', newProject.value.is_active ? '1' : '0');
    formData.append('is_public', newProject.value.is_public ? '1' : '0');
    
    // Only append logo if a file is actually selected and valid
    if (newProject.value.logoFile && 
        newProject.value.logoFile instanceof File && 
        newProject.value.logoFile.size > 0 &&
        newProject.value.logoFile.type.startsWith('image/')) {
      console.log('Appending logo file:', newProject.value.logoFile.name, newProject.value.logoFile.type, newProject.value.logoFile.size);
      formData.append('logo', newProject.value.logoFile);
    } else {
      console.log('No valid logo file to append, logoFile:', newProject.value.logoFile);
    }
    
    // Add members
    newProject.value.members.forEach((member, index) => {
      formData.append(`members[${index}][user_id]`, member.user_id);
      formData.append(`members[${index}][project_role_id]`, member.project_role_id);
    });
    
    // Debug: Log FormData contents
    console.log('FormData contents:');
    for (let [key, value] of formData.entries()) {
      console.log(key, value);
    }
    
    const response = await api.post('/projects', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    if (response.data && response.data.success) {
      successToast(response.data.message || 'Proyek berhasil dibuat');
      closeCreateProjectModal();
      
      // Refresh projects list
      await loadProjects(workspace.value.slug);
      
      // Optionally navigate to the new project
      if (response.data.data && response.data.data.slug) {
        router.push(`/workspaces/${workspace.value.slug}/projects/${response.data.data.slug}`);
      }
    } else {
      errorToast(response.data?.message || 'Gagal membuat proyek');
    }
  } catch (error) {
    console.error('Error creating project:', error);
    const msg = error.response?.data?.message || 'Terjadi kesalahan saat membuat proyek';
    errorToast(msg);
  } finally {
    creatingProject.value = false;
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
  // open confirm modal (action will call confirm handler)
  openConfirm({
    title: 'Hapus Catatan',
    message: 'Hapus catatan ini?',
    action: 'deleteNote',
    payload: { noteId }
  });
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

// Check if a member entry corresponds to the currently authenticated user
const isMemberSelf = (member) => {
  const user = authStore.user;
  if (!user || !member) return false;
  const mid = getMemberKey(member);
  return String(mid) === String(user.id) || String(member.email || member.user?.email) === String(user.email);
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
  /* Logo card adapted for dark theme */
  .logo-upload { display: flex; gap: 18px; align-items: flex-start; }

  .logo-preview.logo-card {
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    padding: 14px;
    border-radius: 12px;
    background: var(--panel-bg, rgba(255,255,255,0.02));
    border: 1px solid rgba(255,255,255,0.04);
    min-height: 160px;
    max-width: 220px;
    margin-bottom: 4px;
    cursor: pointer;
    transition: transform .12s ease, box-shadow .12s ease;
  }

  .logo-preview.logo-card:hover {
    transform: translateY(-4px);
    box-shadow: 0 8px 24px rgba(2,6,23,0.6);
  }

  .logo-thumb.large {
    width: 140px;
    height: 140px;
    object-fit: cover;
    border-radius: 10px;
    box-shadow: 0 6px 18px rgba(2,6,23,0.55);
    margin-bottom: 10px;
    background: linear-gradient(180deg, rgba(255,255,255,0.02), rgba(0,0,0,0.04));
  }

  .logo-meta { text-align: center; }
  .logo-meta small { display: block; color: var(--muted, #9ca3af); font-size: 13px; margin-top: 6px; }

  /* Empty card style */
  .logo-empty.logo-card { border-style: dashed; opacity: 0.9; }
  .logo-empty-text { color: var(--muted, #9ca3af); font-size: 13px; }

  /* Actions column */
  .logo-actions {
    display: flex;
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
    margin-top: 4px;
  }

  /* Make buttons visually match dark theme and consistent sizes */
  .logo-actions .btn {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 14px 20px;
    border-radius: 12px;
    font-size: 15px;
    line-height: 1;
    justify-content: center;
    min-width: 160px;
  }

  .logo-actions .btn.btn-secondary { background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.03); color: var(--text, #e5e7eb); }
  .logo-actions .btn.btn-danger { background: #ae2323; color: #fff; border: none; }
  .logo-actions .btn.btn-warning { background: #ae2323; color: #fff; border: none; }

  .logo-actions .btn:hover { filter: brightness(1.06); }

  /* Make layout responsive on small screens */
  @media (max-width: 720px) {
    .logo-upload { flex-direction: column; align-items: stretch; }
    .logo-actions { flex-direction: row; justify-content: flex-start; }
    .logo-actions .btn { min-width: 120px; padding: 10px 14px; }
    .logo-preview.logo-card { margin-right: 0; max-width: none; }
  }
  
  /* Light theme overrides */
  @media (prefers-color-scheme: light) {
    .logo-preview.logo-card {
      background: #ffffff;
      border: 1px solid rgba(15,23,42,0.06);
      box-shadow: 0 18px 40px rgba(15,23,42,0.06);
      transform: none; /* avoid dark hover lift feel */
    }

    .logo-preview.logo-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 22px 48px rgba(16,24,40,0.08);
    }

    .logo-thumb.large {
      width: 160px;
      height: 160px;
      object-fit: cover;
      border-radius: 12px;
      box-shadow: 0 18px 40px rgba(16,24,40,0.08);
    }

  /* stronger label color for light theme */
  .logo-meta small { color: #4b5563; opacity: 1; font-weight: 600; }

    .logo-empty.logo-card { border-style: dashed; border-color: rgba(15,23,42,0.06); }

    .logo-actions {
      align-items: center;
      margin-top: 0;
      gap: 18px;
      justify-content: flex-start;
      flex-direction: row;
    }

    .logo-actions .btn {
      min-width: 220px;
      padding: 16px 26px;
      border-radius: 14px;
      font-size: 16px;
    }

    /* Make the secondary action clearly readable in light mode */
    .logo-actions .btn.btn-secondary {
      background: transparent;
      color: #374151; /* slate-700 for good contrast */
      border: none;
      opacity: 1;
    }

    .logo-actions .btn .btn-text { color: inherit; font-weight: 600; }
    .logo-actions .btn svg, .logo-actions .btn .svg-inline--fa { color: inherit; fill: currentColor; }

    /* Big rounded delete button like screenshot */
    .logo-actions .btn.btn-danger {
      background: #7f1d1d; /* deep red */
      color: #fff;
      border-radius: 28px;
      padding-left: 28px;
      padding-right: 28px;
      box-shadow: 0 8px 24px rgba(127,29,29,0.12);
      min-width: 240px;
      justify-content: flex-start;
      gap: 14px;
    }

    .logo-actions .btn.btn-warning {
      background: #92400e;
      color: #fff;
      border-radius: 18px;
    }
  }

  </style>
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

.logo-upload { display:flex; align-items:center; gap:12px; }
.logo-preview { display:flex; flex-direction:column; align-items:center; cursor:pointer; }
.logo-thumb { width:64px; height:64px; border-radius:8px; object-fit:cover; border:1px solid var(--color-border); }
.logo-meta { margin-top:6px; color:var(--color-muted); font-size:12px; }
.file-input { display:none; }

/* Settings form two-column layout */
.settings-form { width: 100%; }
.settings-form-row { display: flex; gap: 20px; align-items: flex-start; }
.settings-left { flex: 3 1 0%; }
.settings-right { flex: 1 1 0%; display:flex; flex-direction:column; gap:12px; align-items:flex-start; }
.actions-row { margin-top: 18px; }

@media (max-width: 768px) {
  .settings-form-row { flex-direction: column; }
  .settings-right { align-items: flex-start; }
}

.checkbox-option { display:flex; align-items:center; gap:12px; }
.checkbox-label input[type="checkbox"] { margin:0 6px 0 0; }
.logo-actions .btn-danger { margin-left:8px; }

/* Status toggles */
.status-group { display:flex; gap:18px; flex-wrap:wrap; }
.status-item { display:flex; align-items:center; gap:12px; }
.switch { position: relative; display: inline-block; width:48px; height:28px; }
.switch input { opacity: 0; width: 0; height: 0; }
.switch-slider {
  position: absolute; cursor: pointer; top: 0; left: 0; right: 0; bottom: 0;
  background-color: var(--color-border); border-radius: 999px; transition: background-color .18s ease;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,0.04);
}
.switch-slider::before {
  content: '';
  position: absolute; width: 20px; height: 20px; left: 4px; top: 4px; background: white; border-radius: 50%; transition: transform .18s ease;
  box-shadow: 0 2px 6px rgba(16,24,40,0.08);
}
.switch input:checked + .switch-slider { background-color: var(--color-primary-500); }
.switch input:checked + .switch-slider::before { transform: translateX(20px); }
.switch-labels { display:flex; flex-direction:column; }
.switch-title { font-weight:600; font-size:14px; color:var(--color-text); }
.switch-sub { font-size:12px; color:var(--color-muted); }

/* Autocomplete styles */
.autocomplete { position: relative; }
.autocomplete-list {
  position: absolute;
  top: calc(100% + 8px);
  left: 0;
  right: 0;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
  box-shadow: 0 8px 20px rgba(0,0,0,0.12);
  z-index: 1400;
  max-height: 280px;
  overflow: auto;
  padding: 8px 0;
}
.autocomplete-item { padding: 10px 12px; cursor: pointer; display:flex; justify-content:space-between; gap:12px; align-items:center; }
.autocomplete-item.disabled { opacity: 0.6; cursor: not-allowed; }
.autocomplete-item:hover { background: var(--color-background-soft); }
.autocomplete-item-main { font-weight: 500; color: var(--color-text); }
.autocomplete-item-note { font-size: 12px; color: var(--color-muted); }
.autocomplete-empty { padding: 10px 12px; color: var(--color-muted); }

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

/* Project creation modal styles */
.modal-large {
  max-width: 800px;
}

/* Project form styles */
.project-form {
  width: 100%;
}

.form-row {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.form-left {
  flex: 2;
}

.form-right {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: flex-start;
}

.required {
  color: #dc3545;
}

.form-input {
  width: 100%;
  padding: 12px 16px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.form-input:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(var(--color-primary-rgb), 0.1);
}

/* Members section styles */
.members-section {
  border: 1px solid var(--color-border);
  border-radius: 8px;
  padding: 16px;
  background: var(--color-background);
}

.members-list-container {
  margin-bottom: 16px;
}

.no-members {
  text-align: center;
  padding: 24px;
  color: var(--color-muted);
}

.selected-members {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.member-row {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 12px;
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.member-info {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.member-details {
  flex: 1;
}

.member-name {
  font-weight: 500;
  color: var(--color-text);
  font-size: 14px;
}

.member-email {
  color: var(--color-muted);
  font-size: 12px;
}

.member-role-select {
  flex: 0 0 180px;
}

.member-role-select select {
  width: 100%;
}

.btn-add-member {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.btn-remove {
  background: transparent;
  border: none;
  color: var(--color-muted);
  cursor: pointer;
  padding: 8px;
  border-radius: 6px;
  transition: all 0.2s ease;
  flex-shrink: 0;
}

.btn-remove:hover {
  background: #dc3545;
  color: white;
}

/* Project form responsive adjustments */
@media (max-width: 768px) {
  .form-row {
    flex-direction: column;
    gap: 16px;
  }
  
  .member-row {
    flex-direction: column;
    gap: 12px;
    align-items: stretch;
  }
  
  .member-info {
    flex-direction: row;
  }
  
  .member-role-select {
    flex: 1;
  }
}
</style>
