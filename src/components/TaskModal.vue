<template>
  <div v-if="show" class="task-modal-overlay" @click="closeModal">
    <div class="task-modal" @click.stop>
      <!-- Modal Header -->
      <div class="modal-header">
        <h2 class="modal-title">
          Detail Tugas
          <small v-if="titleSuffix" class="modal-title-suffix"> — {{ titleSuffix }}</small>
        </h2>
        <button class="btn-close" @click="closeModal">
          <font-awesome-icon icon="times" />
        </button>
      </div>

      <!-- Modal Content -->
      <div class="modal-content" :class="{ 'no-comments': !isExistingTask }">
        <!-- Task Details (70% or 100% when no comments) -->
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
              <TipTapEditor 
                v-model="taskData.description" 
                @update:modelValue="markAsModified"
                placeholder="Masukkan deskripsi tugas..."
              />
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
                <select v-model="taskData.priority_id" class="form-select" @change="markAsModified" required aria-required="true">
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
              <div class="form-group">
                <label class="form-label">Point</label>
                <input
                  v-model.number="taskData.point"
                  type="number"
                  min="0"
                  step="1"
                  class="form-input"
                  @input="markAsModified"
                  placeholder="Masukkan point tugas"
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

            <!-- Task Relations Section -->
            <div class="form-group">
              <label class="form-label">
                <font-awesome-icon icon="link" />
                Relasi Tugas
              </label>
              
              <div class="relations-container" :class="{ 'relations-empty': (!taskData.related_from || taskData.related_from.length === 0) && (!taskData.related_to || taskData.related_to.length === 0) }">
                <!-- Related From (Dependencies) - Read Only -->
                <div v-if="taskData.related_from && taskData.related_from.length > 0">
                  <h6 class="relation-heading">
                    <font-awesome-icon icon="arrow-left" />
                    Bergantung Pada (Read-only)
                  </h6>
                  <div class="relation-list">
                    <div 
                      v-for="relation in taskData.related_from" 
                      :key="relation.task_uuid"
                      class="relation-item relation-item-readonly"
                    >
                      <div class="relation-info">
                        <span class="relation-task-title">{{ relation.title }}</span>
                        <span class="relation-type">{{ relation.relation_type }}</span>
                      </div>
                      <div class="readonly-indicator">
                        <font-awesome-icon icon="eye" />
                      </div>
                    </div>
                  </div>
                  <p class="relation-note">
                    <font-awesome-icon icon="exclamation-triangle" />
                    Untuk menghapus relasi ini, edit dari tugas yang bersangkutan
                  </p>
                </div>

                <!-- Related To (Dependents) - Editable -->
                <div v-if="taskData.related_to && taskData.related_to.length > 0">
                  <h6 class="relation-heading">
                    <font-awesome-icon icon="arrow-right" />
                    Tugas Terkait
                  </h6>
                  <div class="relation-list">
                    <div 
                      v-for="relation in taskData.related_to" 
                      :key="relation.task_uuid"
                      class="relation-item"
                    >
                      <div class="relation-info">
                        <span class="relation-task-title">{{ relation.title }}</span>
                        <span class="relation-type">{{ relation.relation_type }}</span>
                      </div>
                      <button 
                        @click="removeTaskRelation(relation)"
                        class="btn-remove-relation"
                        type="button"
                        :disabled="saving"
                      >
                        <font-awesome-icon icon="times" />
                      </button>
                    </div>
                  </div>
                </div>

                <!-- Empty state for relations -->
                <div v-if="(!taskData.related_from || taskData.related_from.length === 0) && (!taskData.related_to || taskData.related_to.length === 0)" class="relations-empty-state">
                  <div class="empty-relations-content">
                    <font-awesome-icon icon="link" size="2x" class="empty-relations-icon" />
                    <p class="empty-relations-text">Belum ada relasi tugas</p>
                    <p class="empty-relations-subtext">Tambahkan tugas terkait untuk menunjukkan ketergantungan</p>
                  </div>
                </div>

                <!-- Add Relation Button -->
                <div class="relation-actions">
                  <button 
                    @click="showAddRelationModal"
                    class="btn btn-outline-primary btn-sm"
                    type="button"
                    :disabled="saving"
                  >
                    <font-awesome-icon icon="plus" />
                    Tambah Tugas Terkait
                  </button>
                </div>
              </div>
            </div>
            
            <!-- Attachments for Task (drag & drop) -->
            <div class="form-group">
              <label class="form-label">
                <font-awesome-icon icon="paperclip" />
                Lampiran Tugas
              </label>
              <div class="attachments-container">
                <div
                  class="file-drop-area"
                  :class="{ 'is-dragover': taskDropActive }"
                  @dragover.prevent="onTaskDragOver"
                  @dragenter.prevent="onTaskDragEnter"
                  @dragleave.prevent="onTaskDragLeave"
                  @drop.prevent="onTaskDrop"
                  @click="triggerTaskFileInput"
                  role="button"
                  tabindex="0"
                >
                  <input ref="taskFileInput" type="file" multiple class="sr-only" @change="onTaskFilesSelected" />
                  <div class="file-drop-content">
                    <font-awesome-icon icon="cloud-upload-alt" size="lg" />
                    <div class="file-drop-text">
                      <span v-if="taskAttachments.length === 0" class="file-drop-primary">Tarik dan lepas file di sini, atau klik untuk memilih</span>
                      <span v-else class="file-drop-primary">{{ taskAttachments.length }} file dipilih</span>
                      <span class="file-drop-secondary">Mendukung multiple file</span>
                    </div>
                  </div>
                </div>

                <div v-if="taskAttachments.length" class="file-previews">
                  <div v-for="(f, idx) in taskAttachments" :key="f._uid" class="file-preview">
                    <div class="file-meta">
                      <font-awesome-icon :icon="getFileIcon(f.type)" class="file-icon" />
                      <div class="file-details">
                        <div class="file-name">{{ f.name }}</div>
                        <div class="file-size">{{ formatBytes(f.size) }}</div>
                      </div>
                    </div>
                    <button type="button" class="btn btn-outline btn-sm" @click="removeTaskAttachment(idx)">
                      <font-awesome-icon icon="trash" />
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Existing Task Attachments Display -->
            <div v-if="taskData.attachments && taskData.attachments.length > 0" class="form-group">
              <label class="form-label">Lampiran Tugas Saat Ini</label>
              <div class="existing-attachments">
                <div v-for="attachment in taskData.attachments" :key="attachment.attachment_id" class="attachment-item">
                  <div class="attachment-info">
                    <div class="attachment-icon">
                      <font-awesome-icon 
                        :icon="getFileIcon(attachment.mime_type)" 
                        size="lg"
                        :class="getFileIconClass(attachment.mime_type)"
                      />
                    </div>
                    <div class="attachment-details">
                      <div class="attachment-name">{{ attachment.original_filename }}</div>
                      <div class="attachment-meta">
                        <span class="attachment-size">{{ formatBytes(attachment.file_size) }}</span>
                        <span class="attachment-type">{{ attachment.mime_type }}</span>
                        <span class="attachment-date">{{ formatCommentDate(attachment.created_at) }}</span>
                      </div>
                    </div>
                  </div>
                  <div class="attachment-actions">
                    <a 
                      @click="downloadAttachment(attachment)" 
                      class="btn btn-outline btn-sm"
                      title="Download file"
                      style="cursor: pointer;"
                    >
                      <font-awesome-icon icon="download" size="sm" />
                      Download
                    </a>
                    <button 
                      @click="deleteTaskAttachment(attachment)" 
                      class="btn btn-outline btn-sm btn-delete"
                      title="Hapus lampiran"
                    >
                      <font-awesome-icon icon="trash" size="sm" />
                      Hapus
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="form-actions form-group">
              <button 
                @click="saveTask" 
                class="btn btn-primary"
                :disabled="saving || !isModified || !isFormValid"
              >
                <font-awesome-icon v-if="saving" icon="spinner" spin />
                <font-awesome-icon v-else icon="save" />
                {{ saving ? 'Menyimpan...' : 'Simpan Perubahan' }}
              </button>
              <button @click="cancelChanges" class="btn btn-secondary" :disabled="saving">

                <font-awesome-icon icon="undo" />
                Batalkan Perubahan
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

        <!-- Comments Section (30%) - Only show for existing tasks -->
        <div v-if="taskData.id || taskData.uuid" class="comments-section">
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
                    <!-- Edit mode -->
                    <div v-if="editingCommentId === (comment.uuid || comment.id)" class="comment-edit-form">
                      <textarea 
                        v-model="editCommentText"
                        class="comment-edit-textarea"
                        rows="3"
                        @keydown.ctrl.enter="saveCommentEdit(comment)"
                        @keydown.esc="cancelCommentEdit"
                      ></textarea>
                      
                      <!-- Edit Comment attachments (drag & drop) -->
                      <div class="form-group">
                        <div
                          class="file-drop-area comment-drop"
                          :class="{ 'is-dragover': editCommentDropActive }"
                          @dragover.prevent="onEditCommentDragOver"
                          @dragenter.prevent="onEditCommentDragEnter"
                          @dragleave.prevent="onEditCommentDragLeave"
                          @drop.prevent="onEditCommentDrop"
                          @click="triggerEditCommentFileInput"
                          role="button"
                          tabindex="0"
                        >
                          <input 
                            ref="editCommentFileInput" 
                            type="file" 
                            multiple 
                            style="position: absolute; left: -9999px; opacity: 0; pointer-events: none;"
                            @change="onEditCommentFilesSelected" 
                          />
                          <div class="file-drop-content">
                            <font-awesome-icon icon="paperclip" />
                            <span v-if="editCommentAttachments.length === 0">Tambahkan lampiran (klik atau seret file)</span>
                            <span v-else>{{ editCommentAttachments.length }} file dilampirkan</span>
                          </div>
                        </div>

                        <div v-if="editCommentAttachments.length" class="file-previews">
                          <div v-for="(f, idx) in editCommentAttachments" :key="f._uid" class="file-preview">
                            <div class="file-meta">
                              <div class="file-name">{{ f.name }}</div>
                              <div class="file-size">{{ formatBytes(f.size) }}</div>
                            </div>
                            <button type="button" class="btn btn-outline btn-sm" @click="removeEditCommentAttachment(idx)">Hapus</button>
                          </div>
                        </div>
                      </div>
                      
                      <div class="comment-edit-actions">
                        <button 
                          @click="saveCommentEdit(comment)"
                          class="btn btn-primary btn-sm"
                          :disabled="!editCommentText.trim() || savingComment"
                        >
                          <font-awesome-icon v-if="savingComment" icon="spinner" spin />
                          <font-awesome-icon v-else icon="save" />
                          {{ savingComment ? 'Menyimpan...' : 'Simpan' }}
                        </button>
                        <button 
                          @click="cancelCommentEdit"
                          class="btn btn-secondary btn-sm"
                          :disabled="savingComment"
                        >
                          <font-awesome-icon icon="times" />
                          Batal
                        </button>
                      </div>
                    </div>
                    
                    <!-- View mode -->
                    <div v-else>
                      <div class="comment-text" v-html="comment.comment"></div>
                    </div>
                    
                    <!-- Comment Attachments Display -->
                    <div v-if="comment.attachments && comment.attachments.length > 0" class="comment-attachments">
                      <div class="comment-attachments-label">
                        <font-awesome-icon icon="paperclip" size="sm" />
                        {{ comment.attachments.length }} lampiran
                      </div>
                      <div class="comment-attachments-list">
                        <div v-for="attachment in comment.attachments" :key="attachment.attachment_id" class="comment-attachment-item">
                          <div class="comment-attachment-info">
                            <font-awesome-icon 
                              :icon="getFileIcon(attachment.mime_type)" 
                              size="sm"
                              :class="getFileIconClass(attachment.mime_type)"
                            />
                            <span class="comment-attachment-name">{{ attachment.original_filename }}</span>
                            <span class="comment-attachment-size">({{ formatBytes(attachment.file_size) }})</span>
                          </div>
                          <div class="comment-attachment-actions">
                            <a 
                              @click="downloadAttachment(attachment)" 
                              class="comment-attachment-download"
                              title="Download file"
                              style="cursor: pointer;"
                            >
                              <font-awesome-icon icon="download" size="sm" />
                            </a>
                            <button 
                              @click="deleteCommentAttachment(attachment, comment)" 
                              class="comment-attachment-delete"
                              title="Hapus lampiran"
                              v-if="canEditComment(comment)"
                            >
                              <font-awesome-icon icon="trash" size="sm" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
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
            <!-- Comment attachments (drag & drop) -->
            <div class="form-group">
              <div
                class="file-drop-area comment-drop"
                :class="{ 'is-dragover': commentDropActive }"
                @dragover.prevent="onCommentDragOver"
                @dragenter.prevent="onCommentDragEnter"
                @dragleave.prevent="onCommentDragLeave"
                @drop.prevent="onCommentDrop"
                @click="triggerCommentFileInput"
                role="button"
                tabindex="0"
              >
                <input ref="commentFileInput" type="file" multiple class="sr-only" @change="onCommentFilesSelected" />
                <div class="file-drop-content">
                  <font-awesome-icon icon="paperclip" />
                  <span v-if="commentAttachments.length === 0">Tambahkan lampiran untuk komentar (klik atau seret file)</span>
                  <span v-else>{{ commentAttachments.length }} file dilampirkan</span>
                </div>
              </div>

              <div v-if="commentAttachments.length" class="file-previews">
                <div v-for="(f, idx) in commentAttachments" :key="f._uid" class="file-preview">
                  <div class="file-meta">
                    <div class="file-name">{{ f.name }}</div>
                    <div class="file-size">{{ formatBytes(f.size) }}</div>
                  </div>
                  <button type="button" class="btn btn-outline btn-sm" @click="removeCommentAttachment(idx)">Hapus</button>
                </div>
              </div>
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

  <!-- Add Relation Modal -->
  <div 
    v-if="showAddRelationForm" 
    class="task-modal-overlay"
    @click="cancelAddRelation"
  >
    <div class="relation-modal" @click.stop>
      <div class="relation-modal-header">
        <div class="relation-modal-title">
          <div class="relation-modal-icon">
            <font-awesome-icon icon="link" />
          </div>
          <h3>Tambah Tugas Terkait</h3>
        </div>
        <button @click="cancelAddRelation" class="relation-modal-close">
          <font-awesome-icon icon="times" />
        </button>
      </div>
      
      <div class="relation-modal-content">
        <!-- Loading indicator for initial data loading -->
        <div v-if="(loadingTasks && availableTasks.length === 0) || (loadingRelationTypes && relationTypes.length === 0)" class="relation-initial-loading">
          <font-awesome-icon icon="spinner" spin />
          <span>Memuat data relasi...</span>
        </div>
        
        <div class="relation-form-group">
          <label class="relation-form-label">
            <font-awesome-icon icon="tasks" />
            Pilih Tugas
          </label>
          <div class="autocomplete-container">
            <input 
              v-model="taskSearchQuery"
              @input="handleTaskSearch($event.target.value)"
              @focus="taskSearchQuery.length >= 1 && (showTaskDropdown = true)"
              @blur="handleTaskInputBlur"
              type="text"
              class="autocomplete-input"
              placeholder="Ketik minimal 1 karakter untuk mencari tugas..."
              :disabled="loadingTasks"
            />
            <div v-if="selectedTaskTitle" class="selected-task-indicator">
              <font-awesome-icon icon="check-circle" />
              <span>{{ selectedTaskTitle }}</span>
              <button @click="clearTaskSelection" class="clear-selection">
                <font-awesome-icon icon="times" />
              </button>
            </div>
            
            <!-- Dropdown results -->
            <div v-if="showTaskDropdown" class="autocomplete-dropdown">
              <div v-if="filteredTasks.length === 0" class="autocomplete-empty">
                <font-awesome-icon icon="search" />
                <span>Tidak ada tugas yang ditemukan</span>
              </div>
              <div 
                v-for="task in filteredTasks.slice(0, 10)" 
                :key="task.id"
                @mousedown.prevent="selectTask(task)"
                @click.prevent
                class="autocomplete-item"
              >
                <div class="autocomplete-item-content">
                  <span class="autocomplete-item-title">{{ task.title }}</span>
                  <span v-if="task.project" class="autocomplete-item-project">
                    {{ task.project.name }}
                  </span>
                </div>
                <font-awesome-icon icon="chevron-right" class="autocomplete-item-arrow" />
              </div>
            </div>
          </div>
          
          <div v-if="loadingTasks" class="relation-loading">
            <font-awesome-icon icon="spinner" spin />
            <span>Memuat tugas...</span>
          </div>
        </div>

        <div class="relation-form-group">
          <label class="relation-form-label">
            <font-awesome-icon icon="cog" />
            Tipe Relasi
          </label>
          <select 
            v-model="newRelation.relation_type_id"
            class="relation-form-select"
            :disabled="loadingRelationTypes"
            :placeholder="'Pilih tipe relasi'"
          >
            <option disabled value="">Pilih tipe relasi</option>
            <option 
              v-for="relationType in relationTypes" 
              :key="relationType.id"
              :value="relationType.id"
            >
              {{ relationType.name }}
            </option>
          </select>
          
          <div v-if="loadingRelationTypes" class="relation-loading">
            <font-awesome-icon icon="spinner" spin />
            <span>Memuat tipe relasi...</span>
          </div>
        </div>

        <div class="relation-form-actions">
          <button 
            @click="addTaskRelation"
            class="relation-btn relation-btn-primary"
            :disabled="!newRelation.related_task_id || !newRelation.relation_type_id"
          >
            <font-awesome-icon icon="plus" />
            <span>Tambah Relasi</span>
          </button>
          <button 
            @click="cancelAddRelation"
            class="relation-btn relation-btn-secondary"
          >
            <span>Batal</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, nextTick } from 'vue';
// template refs for file inputs
const taskFileInput = ref(null);
const commentFileInput = ref(null);
const editCommentFileInput = ref(null);
import { taskService } from '@/api/services/taskService';
import { commentService } from '@/api/services/commentService';
import { attachmentService } from '@/api/services/attachmentService';
import { useAuthStore } from '@/stores/auth';
import { errorToast, successToast } from '@/utils/toast';
import TipTapEditor from './TipTapEditor.vue';

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
  },
  projectTasks: {
    type: Array,
    default: () => []
  },
  currentProject: {
    type: Object,
    default: null
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
  point: null,
  assignees: [],
  attachments: [],
  related_from: [],
  related_to: []
});
const originalTaskData = ref({});
const isModified = ref(false);
const saving = ref(false);
const showAssigneeSelector = ref(false);

// Simple form validation: ensure required fields are present
const isFormValid = computed(() => {
  // For now only priority is required per request. If more required fields are added, include them here.
  // Accept both numeric and string IDs; treat empty string/null/undefined as invalid.
  const p = taskData.value.priority_id;
  return p !== null && p !== undefined && p !== '';
});

// Task Relations
const relationTypes = ref([]);
const availableTasks = ref([]);
const loadingRelationTypes = ref(false);
const loadingTasks = ref(false);
const showAddRelationForm = ref(false);
const newRelation = ref({
  related_task_id: null,
  relation_type_id: null
});

// Autocomplete search for tasks
const taskSearchQuery = ref('');
const filteredTasks = ref([]);
const showTaskDropdown = ref(false);
const selectedTaskTitle = ref('');

// Comments
const comments = ref([]);
const newComment = ref('');
const loadingComments = ref(false);
const addingComment = ref(false);
// Edit comment state
const editingCommentId = ref(null);
const editCommentText = ref('');
const originalCommentText = ref('');
const savingComment = ref(false);
// Edit comment attachments
const editCommentAttachments = ref([]);
const editCommentDropActive = ref(false);
// Attachments state for task and comments
const taskAttachments = ref([]); // array of File
const commentAttachments = ref([]);
const taskDropActive = ref(false);
const commentDropActive = ref(false);

// Computed
const currentUser = computed(() => authStore.user);

// Check if this is an existing task (has id or uuid)
const isExistingTask = computed(() => {
  return !!(taskData.value.id || taskData.value.uuid);
});

// Track last opened task to avoid double-initialization
const lastOpenTaskId = ref(null);

const availableMembers = computed(() => {
  // Gather potential member sources in priority order
  const sources = [];
  if (Array.isArray(props.projectMembers) && props.projectMembers.length) sources.push(...props.projectMembers);
  if (props.currentProject && Array.isArray(props.currentProject.members) && props.currentProject.members.length) sources.push(...props.currentProject.members);
  if (props.task && props.task.project && Array.isArray(props.task.project.members) && props.task.project.members.length) sources.push(...props.task.project.members);
  if (props.task && Array.isArray(props.task.members) && props.task.members.length) sources.push(...props.task.members);

  // Deduplicate by id or user_id
  const seen = new Set();
  const normalized = [];
  sources.forEach(m => {
    const id = m.user_id || m.id || m.userId || m.uuid || null;
    if (!id) return;
    if (seen.has(id)) return;
    seen.add(id);
    normalized.push({
      user_id: m.user_id || m.id || id,
      user_name: m.user_name || m.name || m.full_name || m.username || m.email || '',
      avatar: m.avatar || null,
      id: m.id || m.user_id || id
    });
  });

  // If there are no normalized members, return empty array
  if (!normalized.length) return [];

  // Filter out already assigned users
  const assignedIds = (taskData.value.assignees || []).map(a => a.user_id || a.id).filter(Boolean);
  return normalized.filter(m => !assignedIds.includes(m.user_id) && !assignedIds.includes(m.id));
});

// Title suffix to show workspace and project context (e.g. "Workspace / Project")
const titleSuffix = computed(() => {
  try {
    // First priority: use currentProject prop (from ProjectDetailPage)
    if (props.currentProject) {
      const projectName = props.currentProject.name || props.currentProject.title;
      const workspaceName = props.currentProject.workspace?.name;
      
      if (workspaceName && projectName) return `${workspaceName} / ${projectName}`;
      if (projectName) return projectName;
      if (workspaceName) return workspaceName;
    }

    // Second priority: use task data project/workspace info
    const p = taskData.value || {};
    let projectName = p.project?.name || p.project_name || p.project?.title || null;
    let workspaceName = p.project?.workspace?.name || p.workspace?.name || null;

    // Fallback: check props.task.project
    if (!projectName && props.task && props.task.project) {
      projectName = props.task.project.name || props.task.project.title || projectName;
      if (!workspaceName && props.task.project.workspace) {
        workspaceName = props.task.project.workspace.name;
      }
    }

    // Fallback: try to resolve from props.projectTasks by project_id
    if (!projectName && taskData.value.project_id && props.projectTasks && props.projectTasks.length) {
      const match = props.projectTasks.find(pt => pt.id === taskData.value.project_id || pt.uuid === taskData.value.project_id);
      if (match) {
        projectName = match.name || match.title || projectName;
        if (!workspaceName && match.workspace) workspaceName = match.workspace.name;
      }
    }

    if (workspaceName && projectName) return `${workspaceName} / ${projectName}`;
    if (projectName) return projectName;
    if (workspaceName) return workspaceName;
    return '';
  } catch (e) {
    return '';
  }
});

// Methods
const initializeTaskData = async () => {
  // Initialize when we have either numeric id or uuid (some contexts only provide uuid)
  const id = props.task?.uuid || props.task?.id;

  // Always reset comments and attachments state first
  comments.value = [];
  newComment.value = '';
  taskAttachments.value = [];
  commentAttachments.value = [];

  // For new tasks (no id/uuid), just use props data directly
  if (!props.task || (!props.task.id && !props.task.uuid)) {
    // This is a new task, initialize from props directly
    const p = props.task || {};
    taskData.value = {
      id: p.id || null,
      uuid: p.uuid || null,
      title: p.title || '',
      description: p.description || '',
      status_id: p.status_id || null,
      priority_id: p.priority_id || null,
      due_date: p.due_date || null,
      point: p.point != null ? p.point : null,
      project_id: p.project_id || null, // ✅ Include project_id for new tasks
      assignees: (p.assignees || p.assigned_to || []).map(a => ({ 
        user_id: a.user_id || a.id, 
        name: a.name || a.full_name || null, 
        avatar: a.avatar || null 
      })),
      attachments: p.attachments || [],
      related_from: p.related_from || [],
      related_to: p.related_to || []
    };
    originalTaskData.value = { 
      ...taskData.value, 
      assignees: [...(taskData.value.assignees || [])],
      related_from: [...(taskData.value.related_from || [])],
      related_to: [...(taskData.value.related_to || [])]
    };
    isModified.value = false;
    lastOpenTaskId.value = null;

    
    
    // Load relation types and available tasks for new task
    loadRelationTypes();
    loadAvailableTasks();
    
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
      point: freshTaskData.point != null ? freshTaskData.point : (freshTaskData.points || freshTaskData.point_value || null),
      project_id: freshTaskData.project_id || null, // ✅ Include project_id
      assignees: (freshTaskData.assignees || []).map(a => ({ user_id: a.user_id || a.id, name: a.name || a.full_name || null, avatar: a.avatar || null })),
      attachments: freshTaskData.attachments || [],
      related_from: freshTaskData.related_from || [],
      related_to: freshTaskData.related_to || []
    };
    originalTaskData.value = { 
      ...taskData.value, 
      assignees: [...(taskData.value.assignees || [])],
      related_from: [...(taskData.value.related_from || [])],
      related_to: [...(taskData.value.related_to || [])]
    };
    isModified.value = false;
    lastOpenTaskId.value = id || null;

  // Load comments when task is set
  loadComments();
  
  // Load relation types and available tasks
  loadRelationTypes();
  loadAvailableTasks();
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
      point: p.point != null ? p.point : (p.points || p.point_value || null),
      project_id: p.project_id || null, // ✅ Include project_id
      assignees: (p.assignees || []).map(a => ({ user_id: a.user_id || a.id, name: a.name || a.full_name || null, avatar: a.avatar || null })),
      attachments: p.attachments || [],
      related_from: p.related_from || [],
      related_to: p.related_to || []
    };
    originalTaskData.value = { 
      ...taskData.value, 
      assignees: [...(taskData.value.assignees || [])],
      related_from: [...(taskData.value.related_from || [])],
      related_to: [...(taskData.value.related_to || [])]
    };
    isModified.value = false;
    lastOpenTaskId.value = id || null;

    
    
  // Reset or load comments depending on task type
  if (!id) {
    // New task - comments already reset at the beginning
    
  } else {
    // Existing task - load comments
    loadComments();
  }
  }
};

const markAsModified = () => {
  isModified.value = true;
};

// Refresh task data from server
const refreshTaskData = async () => {
  if (!taskData.value.uuid && !taskData.value.id) return;
  
  try {
    const response = await taskService.get(taskData.value.uuid || taskData.value.id);
    const freshTaskData = response.data.data || response.data;
    
    // Update all task data including assignees and relations to ensure view is current
    taskData.value = {
      ...taskData.value,
      id: freshTaskData.id || taskData.value.id,
      uuid: freshTaskData.uuid || taskData.value.uuid,
      title: freshTaskData.title || taskData.value.title,
      description: freshTaskData.description || taskData.value.description,
      status_id: freshTaskData.status_id || taskData.value.status_id,
      priority_id: freshTaskData.priority_id || taskData.value.priority_id,
      due_date: freshTaskData.due_date || taskData.value.due_date,
      point: freshTaskData.point !== undefined ? freshTaskData.point : taskData.value.point,
      project_id: freshTaskData.project_id || taskData.value.project_id,
      // Ensure assignees are properly updated from server
      assignees: (freshTaskData.assignees || []).map(a => ({ 
        user_id: a.user_id || a.id, 
        name: a.name || a.full_name || null, 
        avatar: a.avatar || null 
      })),
      // Ensure attachments are updated
      attachments: freshTaskData.attachments || [],
      // Ensure relations are updated
      related_from: freshTaskData.related_from || [],
      related_to: freshTaskData.related_to || []
    };
    
    // Update original data as well to prevent false modified state
    originalTaskData.value = { 
      ...taskData.value,
      assignees: [...(taskData.value.assignees || [])],
      related_from: [...(taskData.value.related_from || [])],
      related_to: [...(taskData.value.related_to || [])]
    };
    
    
  } catch (error) {
    console.error('Error refreshing task data:', error);
  }
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
      resetModalState();
      emit('close');
    }
  } else {
    resetModalState();
    emit('close');
  }
};

const resetModalState = () => {
  // Reset all modal state when closing
  comments.value = [];
  newComment.value = '';
  taskAttachments.value = [];
  commentAttachments.value = [];
  isModified.value = false;
  showAssigneeSelector.value = false;
  showAddRelationForm.value = false;
  taskSearchQuery.value = '';
  selectedTaskTitle.value = '';
  filteredTasks.value = [];
  showTaskDropdown.value = false;
  // Reset comment edit state
  editingCommentId.value = null;
  editCommentText.value = '';
  originalCommentText.value = '';
  savingComment.value = false;
  editCommentAttachments.value = [];
};

const saveTask = async () => {
  try {
    saving.value = true;
    const hasFiles = taskAttachments.value && taskAttachments.value.length > 0;
    const isNewTask = !taskData.value.id && !taskData.value.uuid;

    // Debug: log current task data
    

    // If has attachments, use FormData
    let response;
    if (hasFiles) {
      const form = new FormData();
      
      // Add files first
      taskAttachments.value.forEach((file) => {
        // Make sure file is valid before appending
        if (file instanceof File && file.size > 0) {
          form.append('attachments[]', file);
          
        } else {
          console.warn('Skipping invalid task file:', file);
        }
      });
      
      // Then add other form data
      form.append('title', taskData.value.title || '');
      form.append('description', taskData.value.description || '');
      if (taskData.value.status_id) form.append('status_id', taskData.value.status_id);
      if (taskData.value.priority_id) form.append('priority_id', taskData.value.priority_id);
      if (taskData.value.due_date) form.append('due_date', taskData.value.due_date);
      if (taskData.value.point !== null && taskData.value.point !== undefined) form.append('point', taskData.value.point);
      
      // Add project_id for new tasks
      if (isNewTask) {
        const projectId = taskData.value.project_id;
        
        if (projectId) {
          form.append('project_id', projectId);
        } else {
          console.warn('project_id is missing for new task:', taskData.value);
        }
      }

      // Add assignees to FormData
      if (taskData.value.assignees && taskData.value.assignees.length > 0) {
        taskData.value.assignees.forEach((assignee, index) => {
          form.append(`assignees[${index}][user_id]`, assignee.user_id);
        });
      }

      // Add related tasks (only related_to - related_from is read-only)
      const relatedTasks = taskData.value.related_to || [];

      

      if (relatedTasks.length > 0) {
        relatedTasks.forEach((relation, index) => {
          
          form.append(`related_tasks[${index}][related_task_id]`, relation.task_id);
          form.append(`related_tasks[${index}][relation_type_id]`, relation.relation_type_id || 1);
        });
      }

      if (isNewTask) {
        response = await taskService.create(form, { headers: { 'Content-Type': 'multipart/form-data' } });
      } else {
        // Laravel expects PUT for update routes when using multipart/form-data
        form.append('_method', 'PUT');
        
        // Forward multipart header so server recognizes file parts (match note flow)
        response = await taskService.updateForm(taskData.value.uuid, form, { headers: { 'Content-Type': 'multipart/form-data' } });
      }
    } else {
      // Only send related_to (Tugas Terkait) - related_from is read-only
      const relatedTasks = (taskData.value.related_to || []).map(relation => ({
        related_task_id: relation.task_id,
        relation_type_id: relation.relation_type_id || 1
      }));

      const payload = {
        title: taskData.value.title,
        description: taskData.value.description,
        status_id: taskData.value.status_id,
        priority_id: taskData.value.priority_id,
        due_date: taskData.value.due_date,
        point: taskData.value.point,
        assignees: taskData.value.assignees || [],
        related_tasks: relatedTasks
      };

      // Add project_id for new tasks
      if (isNewTask) {
        const projectId = taskData.value.project_id;
        
        if (projectId) {
          payload.project_id = projectId;
        }
      }

      if (isNewTask) {
        
        response = await taskService.create(payload);
      } else {
        
        response = await taskService.update(taskData.value.uuid, payload);
      }
    }
    
    // Update taskData with fresh server response for both new and existing tasks
    if (response.data) {
      const freshTaskData = response.data.data || response.data;
      
      // Update taskData with complete response data, ensuring all fields are properly updated
      taskData.value = {
        ...taskData.value,
        id: freshTaskData.id || taskData.value.id,
        uuid: freshTaskData.uuid || taskData.value.uuid,
        title: freshTaskData.title || taskData.value.title,
        description: freshTaskData.description || taskData.value.description,
        status_id: freshTaskData.status_id || taskData.value.status_id,
        priority_id: freshTaskData.priority_id || taskData.value.priority_id,
        due_date: freshTaskData.due_date || taskData.value.due_date,
        point: freshTaskData.point !== undefined ? freshTaskData.point : taskData.value.point,
        project_id: freshTaskData.project_id || taskData.value.project_id,
        assignees: freshTaskData.assignees || [],
        attachments: freshTaskData.attachments || [],
        related_from: freshTaskData.related_from || [],
        related_to: freshTaskData.related_to || []
      };
      
      // For new tasks, also refresh all related data
      if (isNewTask) {
        // Load comments for the newly created task
        await loadComments();
        
        // Refresh available tasks so the new task appears in related tasks dropdown
        await loadAvailableTasks();
      }
    }
    
    // Always refresh task data from server to ensure consistency
    await refreshTaskData();
    
    // Update original data with the refreshed data
    originalTaskData.value = { 
      ...taskData.value, 
      assignees: [...(taskData.value.assignees || [])],
      related_from: [...(taskData.value.related_from || [])],
      related_to: [...(taskData.value.related_to || [])]
    };
    isModified.value = false;
    
    const successMessage = isNewTask ? 'Tugas berhasil dibuat' : 'Tugas berhasil diperbarui';
    successToast(successMessage);
    emit('task-updated', response.data);
    
    // Always refresh comments to ensure consistency
    await loadComments();
    
    // clear attachments on success
    taskAttachments.value = [];
    
  } catch (error) {
    console.error('Error updating task:', error);
    
    // Log detailed error response for debugging
    if (error.response) {
      console.error('Error response status:', error.response.status);
      console.error('Error response data:', error.response.data);
      console.error('Error response headers:', error.response.headers);
    }
    
    // Show more specific error message
    let errorMessage = 'Gagal memperbarui tugas';
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data?.errors) {
      const errors = Object.values(error.response.data.errors).flat();
      errorMessage = errors.join(', ');
    }
    
    errorToast(errorMessage);
  } finally {
    saving.value = false;
  }
};

const cancelChanges = () => {
  taskData.value = { 
    ...originalTaskData.value, 
    assignees: [...(originalTaskData.value.assignees || [])],
    related_from: [...(originalTaskData.value.related_from || [])],
    related_to: [...(originalTaskData.value.related_to || [])]
  };
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
      email: member.user_email,
      avatar: member.avatar || null
    });
    markAsModified();
  }
  
  showAssigneeSelector.value = false;
};

const removeAssignee = (memberId) => {
  if (taskData.value.assignees) {
    const initialLength = taskData.value.assignees.length;
    taskData.value.assignees = taskData.value.assignees.filter(a => a.user_id !== memberId);
    
    // Only mark as modified if an assignee was actually removed
    if (taskData.value.assignees.length < initialLength) {
      markAsModified();
    }
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
    const hasFiles = commentAttachments.value && commentAttachments.value.length > 0;
    
    // Debug: ensure we have valid task ID
    const taskId = taskData.value.id;
    if (!taskId) {
      errorToast('Task ID tidak ditemukan');
      return;
    }
    
    let response;
    if (hasFiles) {
      const form = new FormData();
      form.append('comment', newComment.value.trim());
      form.append('task_id', taskId);
      
      // Append attachments[] to match ProjectDetailPage (Catatan) implementation
      commentAttachments.value.forEach((file) => {
        if (file instanceof File && file.size > 0) {
          form.append('attachments[]', file);
        } else {
          console.warn('Skipping invalid comment file:', file);
        }
      });

      // Pass multipart header like the working notes flow so the server validates files correctly
      response = await commentService.createForm(form, { headers: { 'Content-Type': 'multipart/form-data' } });
    } else {
      const payload = {
        comment: newComment.value.trim(),
        task_id: taskId
      };
      response = await commentService.create(payload);
    }
    
    // Clear form first
    newComment.value = '';
    commentAttachments.value = [];
    
    // If comment had attachments, refresh both task data and comments to ensure attachments are displayed
    if (hasFiles) {
      await refreshTaskData();
      await loadComments(); // Refresh comments to get complete attachment data
    } else {
      // For comments without files, just add the new comment to the beginning of the list
      const newCommentData = response.data.data || response.data;
      comments.value.unshift(newCommentData);
    }
    
    successToast('Komentar berhasil ditambahkan');
    
  } catch (error) {
    console.error('Error adding comment:', error);
    errorToast('Gagal menambahkan komentar');
  } finally {
    addingComment.value = false;
  }
};

// Drag & Drop and file helpers for task attachments
const triggerTaskFileInput = () => {
  if (taskFileInput.value) taskFileInput.value.click();
};

const onTaskFilesSelected = (e) => {
  const files = Array.from(e.target.files || []);
  addFilesToTask(files);
  // reset input so same file can be selected again
  e.target.value = null;
};

const onTaskDragOver = (e) => {
  e.dataTransfer.dropEffect = 'copy';
  taskDropActive.value = true;
};
const onTaskDragEnter = (e) => { taskDropActive.value = true; };
const onTaskDragLeave = (e) => { taskDropActive.value = false; };
const onTaskDrop = (e) => {
  taskDropActive.value = false;
  const files = Array.from(e.dataTransfer.files || []);
  addFilesToTask(files);
};

const addFilesToTask = (files) => {
  // simple limit: ignore zero-size files and keep cumulative count reasonable
  files.forEach((f) => {
    // Validate file before adding
    if (f instanceof File && f.size > 0) {
      f._uid = `${f.name}-${f.size}-${Date.now()}-${Math.random().toString(36).substr(2,5)}`;
      taskAttachments.value.push(f);
    } else {
      console.warn('Skipping invalid task file:', f);
    }
  });
  markAsModified();
};

const removeTaskAttachment = (idx) => {
  taskAttachments.value.splice(idx, 1);
  markAsModified();
};

// Comment attachments (reuse logic)
const triggerCommentFileInput = () => {
  if (commentFileInput.value) commentFileInput.value.click();
};

const onCommentFilesSelected = (e) => {
  const files = Array.from(e.target.files || []);
  addFilesToComment(files);
  e.target.value = null;
};

const onCommentDragOver = (e) => { e.dataTransfer.dropEffect = 'copy'; commentDropActive.value = true; };
const onCommentDragEnter = (e) => { commentDropActive.value = true; };
const onCommentDragLeave = (e) => { commentDropActive.value = false; };
const onCommentDrop = (e) => { commentDropActive.value = false; const files = Array.from(e.dataTransfer.files || []); addFilesToComment(files); };

const addFilesToComment = (files) => {
  files.forEach((f) => {
    // Validate file before adding
    if (f instanceof File && f.size > 0) {
      f._uid = `${f.name}-${f.size}-${Date.now()}-${Math.random().toString(36).substr(2,5)}`;
      commentAttachments.value.push(f);
    } else {
      console.warn('Skipping invalid comment file:', f);
    }
  });
};

const removeCommentAttachment = (idx) => {
  commentAttachments.value.splice(idx, 1);
};

// Edit comment attachments handlers (reuse logic from comment attachments)
const triggerEditCommentFileInput = async () => {
  await nextTick(); // Ensure DOM is updated
  
  if (editCommentFileInput.value && typeof editCommentFileInput.value.click === 'function') {
    editCommentFileInput.value.click();
  } else {
    // Fallback: create temporary file input
    console.warn('Using fallback file input method');
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', (e) => {
      const files = Array.from(e.target.files || []);
      addFilesToEditComment(files);
      document.body.removeChild(fileInput);
    });
    document.body.appendChild(fileInput);
    fileInput.click();
  }
};

const onEditCommentFilesSelected = (e) => {
  const files = Array.from(e.target.files || []);
  addFilesToEditComment(files);
  e.target.value = null;
};

const onEditCommentDragOver = (e) => { 
  e.dataTransfer.dropEffect = 'copy'; 
  editCommentDropActive.value = true; 
};

const onEditCommentDragEnter = (e) => { 
  editCommentDropActive.value = true; 
};

const onEditCommentDragLeave = (e) => { 
  editCommentDropActive.value = false; 
};

const onEditCommentDrop = (e) => { 
  editCommentDropActive.value = false; 
  const files = Array.from(e.dataTransfer.files || []); 
  addFilesToEditComment(files); 
};

const addFilesToEditComment = (files) => {
  files.forEach((f) => {
    // Validate file before adding
    if (f instanceof File && f.size > 0) {
      f._uid = `${f.name}-${f.size}-${Date.now()}-${Math.random().toString(36).substr(2,5)}`;
      editCommentAttachments.value.push(f);
    } else {
      console.warn('Skipping invalid edit comment file:', f);
    }
  });
};

const removeEditCommentAttachment = (idx) => {
  editCommentAttachments.value.splice(idx, 1);
};

// small helper to format bytes
const formatBytes = (bytes, decimals = 2) => {
  if (!bytes) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

// (template refs defined above: taskFileInput, commentFileInput)

const editComment = (comment) => {
  // Set edit mode for this specific comment
  editingCommentId.value = comment.uuid || comment.id;
  editCommentText.value = comment.comment;
  originalCommentText.value = comment.comment;
  // Clear any previous edit attachments
  editCommentAttachments.value = [];
};

const saveCommentEdit = async (comment) => {
  if (!editCommentText.value.trim()) {
    errorToast('Komentar tidak boleh kosong');
    return;
  }

  try {
    savingComment.value = true;
    
    const hasFiles = editCommentAttachments.value && editCommentAttachments.value.length > 0;
    let response;
    
    if (hasFiles) {
      // Use FormData for multipart upload
      const form = new FormData();
      form.append('comment', editCommentText.value.trim());
      form.append('_method', 'PUT'); // Laravel method spoofing for PUT request
      
      // Append attachments
      editCommentAttachments.value.forEach((file) => {
        if (file instanceof File && file.size > 0) {
          form.append('attachments[]', file);
        } else {
          console.warn('Skipping invalid edit comment file:', file);
        }
      });

      // Use updateForm method with multipart headers
      response = await commentService.updateForm(comment.uuid || comment.id, form, { 
        headers: { 'Content-Type': 'multipart/form-data' } 
      });
    } else {
      // Regular JSON update without files
      const payload = {
        comment: editCommentText.value.trim()
      };

      response = await commentService.update(comment.uuid || comment.id, payload);
    }
    
    // Update the comment in local state
    const commentIndex = comments.value.findIndex(c => 
      (c.uuid || c.id) === (comment.uuid || comment.id)
    );
    
    if (commentIndex !== -1) {
      if (hasFiles) {
        // If files were uploaded, refresh comments to get complete data
        await loadComments();
      } else {
        // For text-only updates, just update the comment text
        comments.value[commentIndex] = {
          ...comments.value[commentIndex],
          comment: editCommentText.value.trim(),
          updated_at: new Date().toISOString()
        };
      }
    }
    
    // Exit edit mode and clear attachments
    editingCommentId.value = null;
    editCommentText.value = '';
    originalCommentText.value = '';
    editCommentAttachments.value = [];
    
    successToast('Komentar berhasil diperbarui');
    
  } catch (error) {
    console.error('Error updating comment:', error);
    
    let errorMessage = 'Gagal memperbarui komentar';
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.response?.data?.errors) {
      const errors = Object.values(error.response.data.errors).flat();
      errorMessage = errors.join(', ');
    }
    
    errorToast(errorMessage);
  } finally {
    savingComment.value = false;
  }
};

const cancelCommentEdit = () => {
  // Exit edit mode without saving and clear attachments
  editingCommentId.value = null;
  editCommentText.value = '';
  originalCommentText.value = '';
  editCommentAttachments.value = [];
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

// Task Relations methods
const loadRelationTypes = async () => {
  try {
    loadingRelationTypes.value = true;
    const response = await taskService.getTaskRelationTypes();
    relationTypes.value = response.data.data || response.data || [];
  } catch (error) {
    console.error('Error loading relation types:', error);
    errorToast('Gagal memuat tipe relasi');
  } finally {
    loadingRelationTypes.value = false;
  }
};

const loadAvailableTasks = async () => {
  try {
    loadingTasks.value = true;
    
    // First try to use projectTasks from props if available
    if (props.projectTasks && props.projectTasks.length > 0) {
      const currentTaskId = taskData.value.uuid || taskData.value.id;
      
      if (currentTaskId) {
        // For existing tasks, filter out the current task
        availableTasks.value = props.projectTasks.filter(task => 
          task.uuid !== currentTaskId && task.id !== currentTaskId
        );
      } else {
        // For new tasks, show all tasks
        availableTasks.value = props.projectTasks;
      }
      
      return;
    }
    
    // Get project_id from taskData
    const projectId = taskData.value.project_id;
    
    // If no project_id available, skip loading for now
    if (!projectId) {
      availableTasks.value = [];
      return;
    }
    
    // Try to load tasks with project filter
    const params = { project_id: projectId };
    const response = await taskService.list(params);
    
    // Filter out current task from available tasks (only if current task has uuid/id)
    const allTasks = response.data.data || response.data || [];
    const currentTaskId = taskData.value.uuid || taskData.value.id;
    
    if (currentTaskId) {
      // For existing tasks, filter out the current task
      availableTasks.value = allTasks.filter(task => 
        task.uuid !== currentTaskId && task.id !== currentTaskId
      );
    } else {
      // For new tasks, show all tasks
      availableTasks.value = allTasks;
    }
    
  } catch (error) {
    console.error('Error loading available tasks:', error);
    
    // If API call fails, try without parameters as fallback
    try {
      const response = await taskService.list();
      const allTasks = response.data.data || response.data || [];
      const currentTaskId = taskData.value.uuid || taskData.value.id;
      
      if (currentTaskId) {
        availableTasks.value = allTasks.filter(task => 
          task.uuid !== currentTaskId && task.id !== currentTaskId
        );
      } else {
        availableTasks.value = allTasks;
      }
    } catch (fallbackError) {
      console.error('Fallback also failed:', fallbackError);
      // Only show error toast if this is not during initial task creation
      const isNewTask = !taskData.value.id && !taskData.value.uuid;
      if (!isNewTask) {
        errorToast('Gagal memuat daftar tugas');
      }
      // Set empty array to prevent further issues
      availableTasks.value = [];
    }
  } finally {
    loadingTasks.value = false;
  }
};

const showAddRelationModal = async () => {
  newRelation.value = {
    related_task_id: null,
    relation_type_id: null
  };
  taskSearchQuery.value = '';
  selectedTaskTitle.value = '';
  filteredTasks.value = [];
  showTaskDropdown.value = false;
  
  // Ensure data is loaded before showing the modal
  if (availableTasks.value.length === 0 && !loadingTasks.value) {
    await loadAvailableTasks();
  }
  if (relationTypes.value.length === 0 && !loadingRelationTypes.value) {
    await loadRelationTypes();
  }
  
  showAddRelationForm.value = true;
};

const cancelAddRelation = () => {
  showAddRelationForm.value = false;
  newRelation.value = {
    related_task_id: null,
    relation_type_id: null
  };
  taskSearchQuery.value = '';
  selectedTaskTitle.value = '';
  filteredTasks.value = [];
  showTaskDropdown.value = false;
};

// Autocomplete search methods
const handleTaskSearch = async (query) => {
  taskSearchQuery.value = query;
  
  if (query.length >= 1) {
    // Load available tasks if not loaded yet (lazy loading)
    if (availableTasks.value.length === 0 && !loadingTasks.value) {
      await loadAvailableTasks();
    }
    
    filteredTasks.value = availableTasks.value.filter(task => 
      task.title.toLowerCase().includes(query.toLowerCase())
    );

    showTaskDropdown.value = filteredTasks.value.length > 0;
  } else {
    filteredTasks.value = [];
    showTaskDropdown.value = false;
  }
  
  // Clear selection if query doesn't match selected task
  if (selectedTaskTitle.value && !selectedTaskTitle.value.toLowerCase().includes(query.toLowerCase())) {
    newRelation.value.related_task_id = null;
    selectedTaskTitle.value = '';
  }
};

const selectTask = (task) => {
  newRelation.value.related_task_id = task.id;
  selectedTaskTitle.value = task.title;
  taskSearchQuery.value = task.title;
  showTaskDropdown.value = false;
};

const handleTaskInputBlur = () => {
  // Delay hiding dropdown to allow click events on dropdown items
  setTimeout(() => {
    showTaskDropdown.value = false;
  }, 250); // Increased from 150ms to 250ms
};

const clearTaskSelection = () => {
  newRelation.value.related_task_id = null;
  selectedTaskTitle.value = '';
  taskSearchQuery.value = '';
  filteredTasks.value = [];
  showTaskDropdown.value = false;
};

const addTaskRelation = async () => {
  if (!newRelation.value.related_task_id || !newRelation.value.relation_type_id) {
    errorToast('Pilih tugas dan tipe relasi');
    return;
  }

  try {
    // Add to local state immediately for better UX
    const selectedTask = availableTasks.value.find(t => t.id === newRelation.value.related_task_id);
    const selectedRelationType = relationTypes.value.find(rt => rt.id === newRelation.value.relation_type_id);
    
    if (selectedTask && selectedRelationType) {
      const newRelationData = {
        task_id: selectedTask.id,
        task_uuid: selectedTask.uuid,
        title: selectedTask.title,
        relation_type: selectedRelationType.name,
        relation_type_id: selectedRelationType.id
      };

      // Always add to related_to (this task → related task)
      if (!taskData.value.related_to) {
        taskData.value.related_to = [];
      }
      taskData.value.related_to.push(newRelationData);
      
      markAsModified();
    }

    // Reset and close form
    showAddRelationForm.value = false;
    newRelation.value = {
      related_task_id: null,
      relation_type_id: null
    };
    taskSearchQuery.value = '';
    selectedTaskTitle.value = '';
    filteredTasks.value = [];
    showTaskDropdown.value = false;
    
    successToast('Tugas terkait berhasil ditambahkan');
  } catch (error) {
    console.error('Error adding task relation:', error);
    errorToast('Gagal menambahkan tugas terkait');
  }
};

const removeTaskRelation = (relation) => {
  try {
    if (!taskData.value.related_to) {
      taskData.value.related_to = [];
    }
    
    const index = taskData.value.related_to.findIndex(r => 
      (r.task_uuid === relation.task_uuid) || 
      (r.task_id === relation.task_id)
    );
    
    if (index > -1) {
      taskData.value.related_to.splice(index, 1);
      markAsModified();
      successToast('Tugas terkait berhasil dihapus');
    } else {
      console.warn('Relation not found for removal:', relation);
    }
  } catch (error) {
    console.error('Error removing task relation:', error);
    errorToast('Gagal menghapus tugas terkait');
  }
};

// Attachment helper functions
const getFileIcon = (mimeType) => {
  if (!mimeType) return 'file';
  
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'music';
  if (mimeType.includes('pdf')) return 'file-pdf';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'file-word';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'file-excel';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'file-powerpoint';
  if (mimeType.includes('zip') || mimeType.includes('archive')) return 'file-archive';
  if (mimeType.includes('text/')) return 'file-lines';
  
  return 'file';
};

const getFileIconClass = (mimeType) => {
  if (!mimeType) return 'text-gray-500';
  
  if (mimeType.startsWith('image/')) return 'text-green-500';
  if (mimeType.startsWith('video/')) return 'text-purple-500';
  if (mimeType.startsWith('audio/')) return 'text-blue-500';
  if (mimeType.includes('pdf')) return 'text-red-500';
  if (mimeType.includes('word') || mimeType.includes('document')) return 'text-blue-600';
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return 'text-green-600';
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return 'text-orange-500';
  if (mimeType.includes('zip') || mimeType.includes('archive')) return 'text-yellow-600';
  
  return 'text-gray-500';
};

const getAttachmentDownloadUrl = (attachment) => {
  // Construct download URL based on API endpoint pattern
  // You may need to adjust this based on your backend download endpoint
  return `/api/attachments/download/${attachment.uuid}`;
};

// Attachment download and delete handlers
const downloadAttachment = async (attachment) => {
  try {
    // Use attachmentService.download with proper parameters
    // Based on the API structure, we need modelType, modelId, and uuid
    const modelType = attachment.file_path.includes('/tasks/') ? 'task' : 'comment';
    const modelId = attachment.file_path.match(/\/(tasks|comments)\/(\d+)\//)?.[2];
    
    const response = await attachmentService.download(modelType, modelId, attachment.uuid);
    
    // Create download link for blob response
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', attachment.original_filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error downloading attachment:', error);
    errorToast('Gagal mengunduh file');
  }
};

const deleteTaskAttachment = async (attachment) => {
  if (confirm(`Yakin ingin menghapus file "${attachment.original_filename}"?`)) {
    try {
      await attachmentService.remove(attachment.uuid);
      
      // Remove from local task data
      if (taskData.value.attachments) {
        taskData.value.attachments = taskData.value.attachments.filter(
          a => a.attachment_id !== attachment.attachment_id
        );
      }
      
      successToast('Lampiran berhasil dihapus');
    } catch (error) {
      console.error('Error deleting task attachment:', error);
      errorToast('Gagal menghapus lampiran');
    }
  }
};

const deleteCommentAttachment = async (attachment, comment) => {
  if (confirm(`Yakin ingin menghapus file "${attachment.original_filename}"?`)) {
    try {
      await attachmentService.remove(attachment.uuid);
      
      // Remove from local comment data
      if (comment.attachments) {
        comment.attachments = comment.attachments.filter(
          a => a.attachment_id !== attachment.attachment_id
        );
        // Update attachments count
        comment.attachments_count = comment.attachments.length;
      }
      
      successToast('Lampiran berhasil dihapus');
    } catch (error) {
      console.error('Error deleting comment attachment:', error);
      errorToast('Gagal menghapus lampiran');
    }
  }
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
  padding: 0.5rem 2rem;
  border-bottom: 1px solid transparent;
  /* Use primary color gradient from design tokens */
  background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600));
  color: white;
  flex-shrink: 0;
}

.modal-title {
  font-size: 1.5rem;
  font-weight: 600;
  color: inherit;
  margin: 0;
}

.modal-title-suffix {
  font-size: 0.85rem;
  font-weight: 500;
  margin-left: 0.5rem;
  opacity: 0.95;
  color: rgba(255,255,255,0.9);
}

.btn-close {
  background: none;
  border: none;
  font-size: 1.25rem;
  color: rgba(255,255,255,0.95);
  cursor: pointer;
  padding: 0.5rem;
  border-radius: 6px;
  transition: all 0.2s;
}

.btn-close:hover {
  color: white;
  background-color: rgba(255,255,255,0.08);
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

/* When comments section is hidden (new task), task section takes full width */
.modal-content.no-comments .task-section {
  flex: 1;
  border-right: none;
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

/* File drop & previews */
.file-drop-area {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 1.5rem;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  user-select: none;
  transition: all 0.2s ease;
  background: #fafafa;
}

/* Compact style for comment file drops */
.file-drop-area.comment-drop {
  padding: 0.75rem 1rem;
  border-radius: 6px;
  border-width: 1px;
  font-size: 0.875rem;
}

.attachments-container {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  background: #f9fafb;
}

.file-drop-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  color: #6b7280;
  text-align: center;
}

/* Compact content for comment drops */
.comment-drop .file-drop-content {
  flex-direction: row;
  gap: 0.5rem;
  font-size: 0.875rem;
}

.file-drop-text {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.file-drop-primary {
  font-weight: 500;
  color: #374151;
}

.file-drop-secondary {
  font-size: 0.875rem;
  color: #9ca3af;
}

.file-drop-area.is-dragover {
  background: #eef2ff;
  border-color: #3b82f6;
  color: #3b82f6;
}

.file-drop-area:hover {
  background: #f3f4f6;
  border-color: #9ca3af;
}

.file-previews {
  margin-top: 1rem;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
}

/* Compact file previews for comments */
.comment-drop + .file-previews,
.comment-edit-form .file-previews {
  margin-top: 0.5rem;
  padding-top: 0.5rem;
  gap: 0.375rem;
}

.file-preview {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
}

/* Compact file preview for comments */
.comment-drop + .file-previews .file-preview,
.comment-edit-form .file-previews .file-preview {
  padding: 0.5rem;
  font-size: 0.875rem;
}

.file-meta {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.file-icon {
  color: #6b7280;
}

.file-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.file-name {
  font-weight: 500;
  color: #111827;
  font-size: 0.875rem;
}

.file-size {
  font-size: 0.75rem;
  color: #6b7280;
}

/* Existing attachments display */
.existing-attachments {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  padding: 1rem;
  background: #f9fafb;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.attachment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.75rem;
  background: white;
  border-radius: 6px;
  border: 1px solid #e5e7eb;
}

.attachment-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex: 1;
}

.attachment-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  border-radius: 6px;
  background: #f3f4f6;
}

.attachment-details {
  flex: 1;
}

.attachment-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #111827;
  margin-bottom: 0.25rem;
}

.attachment-meta {
  display: flex;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
}

.attachment-meta span + span::before {
  content: "•";
  margin-right: 0.5rem;
  color: #d1d5db;
}

.attachment-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-delete {
  color: #ef4444 !important;
  border-color: #ef4444 !important;
}

.btn-delete:hover {
  background-color: #fef2f2 !important;
  color: #dc2626 !important;
}

/* Comment attachments */
.comment-attachments {
  margin-top: 0.75rem;
  padding-top: 0.75rem;
  border-top: 1px solid #f3f4f6;
}

.comment-attachments-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.75rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.comment-attachments-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.comment-attachment-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem;
  background: #f9fafb;
  border-radius: 4px;
  border: 1px solid #f3f4f6;
}

.comment-attachment-actions {
  display: flex;
  gap: 0.25rem;
  align-items: center;
}

.comment-attachment-info {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.comment-attachment-name {
  font-size: 0.75rem;
  color: #374151;
  font-weight: 500;
}

.comment-attachment-size {
  font-size: 0.625rem;
  color: #9ca3af;
}

.comment-attachment-download {
  color: #6b7280;
  transition: color 0.2s;
  padding: 0.25rem;
  border-radius: 4px;
}

.comment-attachment-download:hover {
  color: #3b82f6;
  background: #eff6ff;
}

.comment-attachment-delete {
  color: #ef4444;
  background: none;
  border: none;
  transition: all 0.2s;
  padding: 0.25rem;
  border-radius: 4px;
  cursor: pointer;
}

.comment-attachment-delete:hover {
  color: #dc2626;
  background: #fef2f2;
}

/* File icon colors */
.text-green-500 { color: #10b981; }
.text-purple-500 { color: #8b5cf6; }
.text-blue-500 { color: #3b82f6; }
.text-red-500 { color: #ef4444; }
.text-blue-600 { color: #2563eb; }
.text-green-600 { color: #059669; }
.text-orange-500 { color: #f97316; }
.text-yellow-600 { color: #d97706; }
.text-gray-500 { color: #6b7280; }


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

.comment-text {
  font-size: 0.875rem;
  /* use CSS token if available for theming, fallback to default dark-gray */
  color: var(--color-text, #374151);
  line-height: 1.5;
  word-wrap: break-word;
}

/* Dark mode override: when .dark is applied on documentElement, swap to a light text color */
.dark .comment-text {
  color: var(--color-text-dark, #e5e7eb);
}

/* Styling for rendered HTML in comments */
.comment-text :deep(p) {
  margin: 0 0 0.5rem 0;
}

.comment-text :deep(p:last-child) {
  margin-bottom: 0;
}

.comment-text :deep(h1),
.comment-text :deep(h2),
.comment-text :deep(h3) {
  margin: 0.5rem 0 0.25rem 0;
  font-weight: 600;
}

.comment-text :deep(h1) {
  font-size: 1.25rem;
}

.comment-text :deep(h2) {
  font-size: 1.125rem;
}

.comment-text :deep(h3) {
  font-size: 1rem;
}

.comment-text :deep(ul),
.comment-text :deep(ol) {
  margin: 0.5rem 0;
  padding-left: 1.5rem;
}

.comment-text :deep(li) {
  margin: 0.25rem 0;
}

.comment-text :deep(blockquote) {
  border-left: 3px solid #e5e7eb;
  padding-left: 0.75rem;
  margin: 0.5rem 0;
  color: #6b7280;
  font-style: italic;
}

.comment-text :deep(code) {
  background: #f3f4f6;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-family: 'Courier New', monospace;
  font-size: 0.85em;
}

.comment-text :deep(pre) {
  background: #1f2937;
  color: #f9fafb;
  padding: 0.5rem 0.75rem;
  border-radius: 0.25rem;
  overflow-x: auto;
  margin: 0.5rem 0;
}

.comment-text :deep(pre code) {
  background: none;
  padding: 0;
  color: inherit;
}

.comment-text :deep(a) {
  color: #3b82f6;
  text-decoration: underline;
}

.comment-text :deep(strong) {
  font-weight: 600;
}

.comment-text :deep(em) {
  font-style: italic;
}

.comment-text :deep(u) {
  text-decoration: underline;
}

.comment-text :deep(s) {
  text-decoration: line-through;
}

/* Comment Edit Form Styles */
.comment-edit-form {
  margin-bottom: 0.75rem;
}

.comment-edit-textarea {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 0.875rem;
  line-height: 1.5;
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.comment-edit-textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.comment-edit-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.75rem;
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
  background: linear-gradient(90deg, var(--color-primary-500), var(--color-primary-600));
  color: white;
}

.btn-primary:hover:not(:disabled) {
  filter: brightness(0.95);
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
  border-bottom-color: rgba(255,255,255,0.04);
  background: linear-gradient(135deg, var(--color-primary-700), var(--color-primary-800));
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

html.dark .form-label svg {
  color: #9ca3af;
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

/* Dark mode for comment editing */
html.dark .comment-edit-textarea {
  background-color: #374151;
  border-color: #4b5563;
  color: #f9fafb;
}

html.dark .comment-edit-textarea:focus {
  border-color: #60a5fa;
  box-shadow: 0 0 0 3px rgba(96, 165, 250, 0.1);
}

html.dark .comments-title {
  color: #f9fafb;
}

html.dark .comment-count {
  color: #9ca3af;
}

/* Dark mode for attachments */
html.dark .existing-attachments {
  background: #111827;
  border-color: #374151;
}

html.dark .attachments-container {
  background: #1f2937;
  border-color: #374151;
}

html.dark .file-drop-area {
  background: #111827;
  border-color: #4b5563;
  color: #9ca3af;
}

html.dark .file-drop-area:hover {
  background: #1f2937;
  border-color: #6b7280;
}

html.dark .file-drop-area.is-dragover {
  background: #1e3a8a;
  border-color: #60a5fa;
  color: #93c5fd;
}

html.dark .file-drop-primary {
  color: #d1d5db;
}

html.dark .file-drop-secondary {
  color: #9ca3af;
}

html.dark .file-previews {
  border-color: #374151;
}

html.dark .file-preview {
  background: #111827;
  border-color: #374151;
}

html.dark .file-name {
  color: #f3f4f6;
}

html.dark .file-size {
  color: #9ca3af;
}

html.dark .file-icon {
  color: #9ca3af;
}

html.dark .attachment-item {
  background: #1f2937;
  border-color: #374151;
}

html.dark .attachment-info {
  color: #d1d5db;
}

html.dark .attachment-icon {
  background: #111827;
}

html.dark .attachment-name {
  color: #f9fafb;
}

html.dark .attachment-meta {
  color: #9ca3af;
}

html.dark .attachment-actions a,
html.dark .attachment-actions .btn {
  color: #d1d5db;
  border-color: #374151;
  background: transparent;
}

html.dark .attachment-actions .btn-delete {
  color: #f87171 !important;
  border-color: #f87171 !important;
}

html.dark .attachment-actions .btn-delete:hover {
  background-color: #1f2937 !important;
  color: #fca5a5 !important;
}

/* Task Relations Styles */
.relations-container {
  margin-bottom: 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 1rem;
  background: #f9fafb;
}

/* Compact relations container when empty */
.relations-container.relations-empty {
  padding: 0.75rem;
  margin-bottom: 0.75rem;
}

.relation-heading {
  color: #374151;
  font-size: 0.875rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.relation-list {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.relation-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  transition: all 0.2s ease;
}

.relation-item:hover {
  background: #f3f4f6;
  border-color: #d1d5db;
}

.relation-item-readonly {
  background: #f8fafc !important;
  border-color: #e2e8f0 !important;
  opacity: 0.8;
}

.relation-item-readonly:hover {
  background: #f1f5f9 !important;
  border-color: #cbd5e1 !important;
}

.readonly-indicator {
  color: #64748b;
  padding: 0.375rem;
  font-size: 0.875rem;
}

.relation-note {
  font-size: 0.75rem;
  color: #64748b;
  margin-top: 0.5rem;
  padding: 0.5rem;
  background: #f8fafc;
  border-radius: 4px;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.relations-empty-state {
  text-align: center;
  padding: 1.5rem 1rem;
}

/* More compact empty state */
.relations-container.relations-empty .relations-empty-state {
  padding: 1rem 0.75rem;
}

.empty-relations-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
}

/* More compact empty relations content */
.relations-container.relations-empty .empty-relations-content {
  gap: 0.5rem;
}

.empty-relations-icon {
  color: #9ca3af;
}

/* Smaller icon for compact empty state */
.relations-container.relations-empty .empty-relations-icon {
  font-size: 1.25rem;
}

.empty-relations-text {
  font-weight: 500;
  color: #6b7280;
  margin: 0;
  font-size: 0.875rem;
}

.empty-relations-subtext {
  color: #9ca3af;
  margin: 0;
  font-size: 0.75rem;
}

.relation-actions {
  border-top: 1px solid #e5e7eb;
  padding-top: 1rem;
  margin-top: 1rem;
}

.relation-info {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.relation-task-title {
  font-weight: 500;
  color: #111827;
  font-size: 0.875rem;
}

.relation-type {
  font-size: 0.75rem;
  color: #6b7280;
  background: #e5e7eb;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
  align-self: flex-start;
}

.btn-remove-relation {
  background: none;
  border: none;
  color: #dc2626;
  padding: 0.375rem;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-remove-relation:hover {
  background: #fef2f2;
  color: #b91c1c;
}

.btn-remove-relation:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-outline-primary {
  background: none;
  border: 1px solid #3b82f6;
  color: #3b82f6;
  padding: 0.5rem 1rem;
  border-radius: 6px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s ease;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
}

.btn-outline-primary:hover {
  background: #3b82f6;
  color: white;
}

.btn-outline-primary:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* Relation Modal Styles */
.relation-modal {
  background: white;
  border-radius: 16px;
  max-width: 520px;
  width: 90%;
  max-height: 80vh;
  overflow: hidden;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  display: flex;
  flex-direction: column;
}

.relation-modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid rgba(0,0,0,0.06);
  background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600));
  color: white;
}

.relation-modal-title {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.relation-modal-icon {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.2);
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.125rem;
}

.relation-modal-title h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.relation-modal-close {
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: white;
  padding: 0.5rem;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
}

.relation-modal-close:hover {
  background: rgba(255, 255, 255, 0.3);
}

.relation-modal-content {
  padding: 2rem;
  flex: 1;
  overflow-y: auto;
}

.relation-form-group {
  margin-bottom: 1.5rem;
}

.relation-form-label {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 600;
  color: #374151;
  margin-bottom: 0.75rem;
  font-size: 0.875rem;
}

.relation-form-select {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  background: #fafbfc;
}

.relation-form-select:focus {
  outline: none;
  border-color: var(--color-primary-500);
  box-shadow: 0 0 0 3px rgba(23,162,184,0.12);
  background: white;
}

/* Autocomplete Styles */
.autocomplete-container {
  position: relative;
}

.autocomplete-input {
  width: 100%;
  padding: 0.875rem 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  background: #fafbfc;
}

.autocomplete-input:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
  background: white;
}

.autocomplete-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.selected-task-indicator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  margin-top: 0.5rem;
  padding: 0.5rem 0.75rem;
  background: #ecfdf5;
  border: 1px solid #d1fae5;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #065f46;
}

.clear-selection {
  background: none;
  border: none;
  color: #dc2626;
  cursor: pointer;
  padding: 0.125rem;
  border-radius: 4px;
  transition: all 0.2s ease;
  margin-left: auto;
}

.clear-selection:hover {
  background: rgba(220, 38, 38, 0.1);
}

.autocomplete-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  background: white;
  border: 2px solid #e5e7eb;
  border-top: none;
  border-radius: 0 0 12px 12px;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  max-height: 200px;
  overflow-y: auto;
}

.autocomplete-empty {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 1rem;
  color: #6b7280;
  font-size: 0.875rem;
  text-align: center;
  justify-content: center;
}

.autocomplete-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0.75rem 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
  border-bottom: 1px solid #f3f4f6;
}

.autocomplete-item:hover {
  background: #f8fafc;
}

.autocomplete-item:last-child {
  border-bottom: none;
}

.autocomplete-item-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  flex: 1;
}

.autocomplete-item-title {
  font-weight: 500;
  color: #111827;
  font-size: 0.875rem;
}

.autocomplete-item-project {
  font-size: 0.75rem;
  color: #6b7280;
}

.autocomplete-item-arrow {
  color: #d1d5db;
  font-size: 0.75rem;
}

.relation-loading {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.5rem;
}

.relation-initial-loading {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
  background-color: #f8fafc;
  border-radius: 0.5rem;
  margin-bottom: 1rem;
  color: #64748b;
  font-size: 0.875rem;
}

.relation-form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 2rem;
  padding-top: 1.5rem;
  border-top: 1px solid #f1f5f9;
}

.relation-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.5rem;
  border-radius: 10px;
  font-weight: 500;
  font-size: 0.875rem;
  transition: all 0.2s ease;
  cursor: pointer;
  border: none;
  flex: 1;
  justify-content: center;
}

.relation-btn-primary {
  background: linear-gradient(135deg, var(--color-primary-500), var(--color-primary-600));
  color: white;
}

.relation-btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.relation-btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
  box-shadow: none;
}

.relation-btn-secondary {
  background: #f8fafc;
  color: #64748b;
  border: 1px solid #e2e8f0;
}

.relation-btn-secondary:hover {
  background: #f1f5f9;
  color: #475569;
}

.loading-text {
  font-size: 0.875rem;
  color: #6b7280;
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

/* Dark mode for relations */
html.dark .relation-heading {
  color: #f9fafb;
}

html.dark .relations-container {
  background: #1f2937;
  border-color: #374151;
}

html.dark .relations-empty-state {
  background: #1f2937;
}

html.dark .empty-relations-content {
  color: #9ca3af;
}

html.dark .empty-relations-text {
  color: #d1d5db;
}

html.dark .empty-relations-subtext {
  color: #9ca3af;
}

html.dark .empty-relations-icon {
  color: #6b7280;
}

html.dark .relation-item {
  background: #1f2937;
  border-color: #374151;
}

html.dark .relation-item:hover {
  background: #111827;
  border-color: #4b5563;
}

html.dark .relation-task-title {
  color: #f9fafb;
}

html.dark .relation-type {
  background: #374151;
  color: #d1d5db;
}

html.dark .btn-remove-relation {
  color: #f87171;
}

html.dark .btn-remove-relation:hover {
  background: #1f2937;
  color: #fca5a5;
}

html.dark .btn-outline-primary {
  border-color: #60a5fa;
  color: #60a5fa;
}

html.dark .btn-outline-primary:hover {
  background: #60a5fa;
  color: #111827;
}

html.dark .relation-actions {
  background: #1f2937;
  border-color: #374151;
}

html.dark .loading-text {
  color: #9ca3af;
}

/* Dark mode for readonly relations */
html.dark .relation-item-readonly {
  background: #111827 !important;
  border-color: #374151 !important;
}

html.dark .relation-item-readonly:hover {
  background: #1f2937 !important;
  border-color: #4b5563 !important;
}

html.dark .readonly-indicator {
  color: #9ca3af;
}

html.dark .relation-note {
  background: #111827;
  color: #9ca3af;
}

/* Dark mode for new relation modal */
html.dark .relation-modal {
  background: #1f2937;
}

html.dark .relation-modal-header {
  background: linear-gradient(135deg, var(--color-primary-700), var(--color-primary-800));
  border-bottom-color: rgba(255,255,255,0.04);
  color: #f9fafb;
}

html.dark .relation-modal-content {
  background: #1f2937;
}

html.dark .relation-form-label {
  color: #f9fafb;
}

html.dark .relation-form-select,
html.dark .autocomplete-input {
  background: #111827;
  border-color: #374151;
  color: #f9fafb;
}

html.dark .relation-form-select:focus,
html.dark .autocomplete-input:focus {
  border-color: #4f46e5;
  background: #1f2937;
}

html.dark .selected-task-indicator {
  background: #065f46;
  border-color: #059669;
  color: #d1fae5;
}

html.dark .autocomplete-dropdown {
  background: #1f2937;
  border-color: #374151;
}

html.dark .autocomplete-item {
  border-bottom-color: #374151;
}

html.dark .autocomplete-item:hover {
  background: #111827;
}

html.dark .autocomplete-item-title {
  color: #f9fafb;
}

html.dark .autocomplete-item-project {
  color: #9ca3af;
}

html.dark .autocomplete-empty {
  color: #9ca3af;
}

html.dark .relation-loading {
  color: #9ca3af;
}

html.dark .relation-initial-loading {
  background-color: #1f2937;
  color: #9ca3af;
}

html.dark .relation-form-actions {
  border-top-color: #374151;
}

html.dark .relation-btn-secondary {
  background: #374151;
  border-color: #4b5563;
  color: #d1d5db;
}

html.dark .relation-btn-secondary:hover {
  background: #4b5563;
  color: #f9fafb;
}

html.dark .comment-attachments {
  border-top-color: #374151;
}

html.dark .comment-attachment-item {
  background: #111827;
  border-color: #374151;
}

html.dark .comment-attachment-name {
  color: #d1d5db;
}

html.dark .comment-attachment-size {
  color: #9ca3af;
}

html.dark .comment-attachment-delete {
  color: #f87171;
}

html.dark .comment-attachment-delete:hover {
  color: #fca5a5;
  background: #1f2937;
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
  
  /* When no comments section, task section can use full height */
  .modal-content.no-comments .task-section {
    max-height: none;
    border-bottom: none;
  }
  
  .comments-section {
    flex: none;
    height: 40vh;
  }
  
  .form-row {
    grid-template-columns: 1fr;
  }
  
  /* Even more compact on mobile for relations and comment attachments */
  .relations-container.relations-empty {
    padding: 0.5rem;
    margin-bottom: 0.5rem;
  }
  
  .relations-container.relations-empty .relations-empty-state {
    padding: 0.75rem 0.5rem;
  }
  
  .comment-drop {
    padding: 0.5rem 0.75rem;
  }
  
  .comment-drop + .file-previews,
  .comment-edit-form .file-previews {
    margin-top: 0.375rem;
    padding-top: 0.375rem;
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
  
  /* Extra compact on small screens */
  .comment-drop .file-drop-content {
    flex-direction: column;
    gap: 0.25rem;
    font-size: 0.8125rem;
  }
  
  .relations-container.relations-empty .empty-relations-content {
    gap: 0.375rem;
  }
  
  .relations-container.relations-empty .empty-relations-text {
    font-size: 0.8125rem;
  }
  
  .relations-container.relations-empty .empty-relations-subtext {
    font-size: 0.6875rem;
  }
}
</style>