<template>
  <div class="profile-page">
    <div class="profile-header">
      <h1 class="page-title">Profile Settings</h1>
      <p class="page-description">Manage your account settings and preferences</p>
    </div>

    <div class="profile-content">
      <!-- Profile Information -->
      <div class="profile-section">
        <div class="section-header">
          <h2 class="section-title">
            <font-awesome-icon icon="user" size="sm" />
            Personal Information
          </h2>
        </div>
        <div class="section-content">
          <form @submit.prevent="updateProfile" class="profile-form">
            <!-- Avatar Upload -->
            <div class="form-group avatar-group">
              <label class="form-label">Profile Photo</label>
              <div class="avatar-upload">
                <div class="current-avatar">
                  <img v-if="profile.avatar" :src="profile.avatar" :alt="profile.name" class="avatar-image" />
                  <div v-else class="avatar-fallback">{{ getInitials(profile.name) }}</div>
                </div>
                <div class="avatar-actions">
                  <button type="button" class="btn btn-secondary" @click="triggerAvatarUpload">
                    <font-awesome-icon icon="camera" size="sm" />
                    Change Photo
                  </button>
                  <button v-if="profile.avatar" type="button" class="btn btn-outline" @click="removeAvatar">
                    <font-awesome-icon icon="trash" size="sm" />
                    Remove
                  </button>
                </div>
                <input 
                  ref="avatarInput"
                  type="file" 
                  accept="image/*" 
                  @change="handleAvatarUpload"
                  style="display: none;"
                />
              </div>
            </div>

            <!-- Basic Information -->
            <div class="form-row">
              <div class="form-group">
                <label for="name" class="form-label">Full Name</label>
                <input 
                  id="name"
                  v-model="profile.name" 
                  type="text" 
                  class="form-input"
                  placeholder="Enter your full name"
                  required
                />
              </div>
              <div class="form-group">
                <label for="email" class="form-label">Email Address</label>
                <input 
                  id="email"
                  v-model="profile.email" 
                  type="email" 
                  class="form-input"
                  placeholder="Enter your email"
                  required
                />
              </div>
            </div>

            <div class="form-row">
              <div class="form-group">
                <label for="phone" class="form-label">Phone Number</label>
                <input 
                  id="phone"
                  v-model="profile.phone" 
                  type="tel" 
                  class="form-input"
                  placeholder="Enter your phone number"
                />
              </div>
              <div class="form-group">
                <label for="location" class="form-label">Location</label>
                <input 
                  id="location"
                  v-model="profile.location" 
                  type="text" 
                  class="form-input"
                  placeholder="City, Country"
                />
              </div>
            </div>

            <div class="form-group">
              <label for="bio" class="form-label">Bio</label>
              <textarea 
                id="bio"
                v-model="profile.bio" 
                class="form-textarea"
                rows="4"
                placeholder="Tell us about yourself..."
              ></textarea>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="profileLoading">
                <font-awesome-icon v-if="profileLoading" icon="spinner" size="sm" spin />
                <font-awesome-icon v-else icon="save" size="sm" />
                {{ profileLoading ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Password Change -->
      <div class="profile-section">
        <div class="section-header">
          <h2 class="section-title">
            <font-awesome-icon icon="lock" size="sm" />
            Change Password
          </h2>
        </div>
        <div class="section-content">
          <form @submit.prevent="updatePassword" class="password-form">
            <div class="form-group">
              <label for="current-password" class="form-label">Current Password</label>
              <input 
                id="current-password"
                v-model="passwordForm.currentPassword" 
                type="password" 
                class="form-input"
                placeholder="Enter current password"
                required
              />
            </div>
            
            <div class="form-row">
              <div class="form-group">
                <label for="new-password" class="form-label">New Password</label>
                <input 
                  id="new-password"
                  v-model="passwordForm.newPassword" 
                  type="password" 
                  class="form-input"
                  placeholder="Enter new password"
                  required
                />
              </div>
              <div class="form-group">
                <label for="confirm-password" class="form-label">Confirm New Password</label>
                <input 
                  id="confirm-password"
                  v-model="passwordForm.confirmPassword" 
                  type="password" 
                  class="form-input"
                  placeholder="Confirm new password"
                  required
                />
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="passwordLoading">
                <font-awesome-icon v-if="passwordLoading" icon="spinner" size="sm" spin />
                <font-awesome-icon v-else icon="key" size="sm" />
                {{ passwordLoading ? 'Updating...' : 'Update Password' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Preferences -->
      <div class="profile-section">
        <div class="section-header">
          <h2 class="section-title">
            <font-awesome-icon icon="cog" size="sm" />
            Preferences
          </h2>
        </div>
        <div class="section-content">
          <form @submit.prevent="updatePreferences" class="preferences-form">
            <div class="form-group">
              <label class="form-label">Theme</label>
              <div class="radio-group">
                <label class="radio-option">
                  <input 
                    v-model="preferences.theme" 
                    type="radio" 
                    value="light"
                    name="theme"
                  />
                  <span class="radio-label">
                    <font-awesome-icon icon="sun" size="sm" />
                    Light
                  </span>
                </label>
                <label class="radio-option">
                  <input 
                    v-model="preferences.theme" 
                    type="radio" 
                    value="dark"
                    name="theme"
                  />
                  <span class="radio-label">
                    <font-awesome-icon icon="moon" size="sm" />
                    Dark
                  </span>
                </label>
                <label class="radio-option">
                  <input 
                    v-model="preferences.theme" 
                    type="radio" 
                    value="auto"
                    name="theme"
                  />
                  <span class="radio-label">
                    <font-awesome-icon icon="circle-half-stroke" size="sm" />
                    Auto
                  </span>
                </label>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label">Language</label>
              <select v-model="preferences.language" class="form-select">
                <option value="en">English</option>
                <option value="id">Bahasa Indonesia</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Timezone</label>
              <select v-model="preferences.timezone" class="form-select">
                <option value="Asia/Jakarta">Asia/Jakarta (WIB)</option>
                <option value="Asia/Makassar">Asia/Makassar (WITA)</option>
                <option value="Asia/Jayapura">Asia/Jayapura (WIT)</option>
                <option value="UTC">UTC</option>
              </select>
            </div>

            <div class="form-group">
              <label class="form-label">Notifications</label>
              <div class="checkbox-group">
                <label class="checkbox-option">
                  <input 
                    v-model="preferences.emailNotifications" 
                    type="checkbox"
                  />
                  <span class="checkbox-label">Email notifications</span>
                </label>
                <label class="checkbox-option">
                  <input 
                    v-model="preferences.pushNotifications" 
                    type="checkbox"
                  />
                  <span class="checkbox-label">Push notifications</span>
                </label>
                <label class="checkbox-option">
                  <input 
                    v-model="preferences.taskReminders" 
                    type="checkbox"
                  />
                  <span class="checkbox-label">Task reminders</span>
                </label>
              </div>
            </div>

            <div class="form-actions">
              <button type="submit" class="btn btn-primary" :disabled="preferencesLoading">
                <font-awesome-icon v-if="preferencesLoading" icon="spinner" size="sm" spin />
                <font-awesome-icon v-else icon="save" size="sm" />
                {{ preferencesLoading ? 'Saving...' : 'Save Preferences' }}
              </button>
            </div>
          </form>
        </div>
      </div>

      <!-- Account Actions -->
      <div class="profile-section danger-zone">
        <div class="section-header">
          <h2 class="section-title">
            <font-awesome-icon icon="exclamation-triangle" size="sm" />
            Danger Zone
          </h2>
        </div>
        <div class="section-content">
          <div class="danger-actions">
            <div class="danger-item">
              <div class="danger-info">
                <h3>Export Data</h3>
                <p>Download a copy of your data including projects, tasks, and comments.</p>
              </div>
              <button class="btn btn-outline" @click="exportData">
                <font-awesome-icon icon="download" size="sm" />
                Export
              </button>
            </div>
            
            <div class="danger-item">
              <div class="danger-info">
                <h3>Delete Account</h3>
                <p>Permanently delete your account and all associated data. This action cannot be undone.</p>
              </div>
              <button class="btn btn-danger" @click="showDeleteConfirm = true">
                <font-awesome-icon icon="trash" size="sm" />
                Delete Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirmation Modal -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click="showDeleteConfirm = false">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>Delete Account</h3>
          <button class="modal-close" @click="showDeleteConfirm = false">
            <font-awesome-icon icon="times" size="sm" />
          </button>
        </div>
        <div class="modal-body">
          <p>Are you sure you want to delete your account? This action cannot be undone and will permanently remove:</p>
          <ul>
            <li>Your profile and personal information</li>
            <li>All your projects and tasks</li>
            <li>Your comments and attachments</li>
            <li>Your workspace memberships</li>
          </ul>
          <div class="form-group">
            <label class="form-label">Type "DELETE" to confirm:</label>
            <input 
              v-model="deleteConfirmText" 
              type="text" 
              class="form-input"
              placeholder="DELETE"
            />
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showDeleteConfirm = false">Cancel</button>
          <button 
            class="btn btn-danger" 
            :disabled="deleteConfirmText !== 'DELETE'"
            @click="deleteAccount"
          >
            <font-awesome-icon icon="trash" size="sm" />
            Delete Account
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useRouter } from 'vue-router';
import { errorToast, successToast } from '@/utils/toast';

const authStore = useAuthStore();
const router = useRouter();

// Reactive data
const profile = ref({
  name: '',
  email: '',
  phone: '',
  location: '',
  bio: '',
  avatar: null
});

const passwordForm = ref({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

const preferences = ref({
  theme: 'auto',
  language: 'en',
  timezone: 'Asia/Jakarta',
  emailNotifications: true,
  pushNotifications: true,
  taskReminders: true
});

const profileLoading = ref(false);
const passwordLoading = ref(false);
const preferencesLoading = ref(false);
const showDeleteConfirm = ref(false);
const deleteConfirmText = ref('');
const avatarInput = ref(null);

// Load user data on mount
onMounted(() => {
  loadUserData();
});

// Load user data
const loadUserData = () => {
  const user = authStore.user;
  if (user) {
    profile.value = {
      name: user.name || '',
      email: user.email || '',
      phone: user.phone || '',
      location: user.location || '',
      bio: user.bio || '',
      avatar: user.avatar || null
    };
    
    // Load preferences from user data or localStorage
    const savedPreferences = localStorage.getItem('userPreferences');
    if (savedPreferences) {
      preferences.value = { ...preferences.value, ...JSON.parse(savedPreferences) };
    }
  }
};

// Helper functions
const getInitials = (name) => {
  return name?.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase() || 'U';
};

// Profile update
const updateProfile = async () => {
  profileLoading.value = true;
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update auth store
    authStore.user = { ...authStore.user, ...profile.value };
    
    successToast('Profile updated successfully');
  } catch (error) {
    errorToast('Failed to update profile');
  } finally {
    profileLoading.value = false;
  }
};

// Password update
const updatePassword = async () => {
  if (passwordForm.value.newPassword !== passwordForm.value.confirmPassword) {
    errorToast('New passwords do not match');
    return;
  }
  
  if (passwordForm.value.newPassword.length < 8) {
    errorToast('Password must be at least 8 characters long');
    return;
  }
  
  passwordLoading.value = true;
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    successToast('Password updated successfully');
    
    // Clear form
    passwordForm.value = {
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    };
  } catch (error) {
    errorToast('Failed to update password');
  } finally {
    passwordLoading.value = false;
  }
};

// Preferences update
const updatePreferences = async () => {
  preferencesLoading.value = true;
  try {
    // Save to localStorage
    localStorage.setItem('userPreferences', JSON.stringify(preferences.value));
    
    // Apply theme change
    if (preferences.value.theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (preferences.value.theme === 'light') {
      document.documentElement.classList.remove('dark');
    } else {
      // Auto mode - use system preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    
    successToast('Preferences updated successfully');
  } catch (error) {
    errorToast('Failed to update preferences');
  } finally {
    preferencesLoading.value = false;
  }
};

// Avatar handling
const triggerAvatarUpload = () => {
  avatarInput.value?.click();
};

const handleAvatarUpload = (event) => {
  const file = event.target.files[0];
  if (file) {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      errorToast('Please select a valid image file');
      return;
    }
    
    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      errorToast('Image must be smaller than 5MB');
      return;
    }
    
    // Create preview URL
    const reader = new FileReader();
    reader.onload = (e) => {
      profile.value.avatar = e.target.result;
    };
    reader.readAsDataURL(file);
  }
};

const removeAvatar = () => {
  profile.value.avatar = null;
  if (avatarInput.value) {
    avatarInput.value.value = '';
  }
};

// Account actions
const exportData = async () => {
  try {
    successToast('Data export started. You will receive an email when ready.');
  } catch (error) {
    errorToast('Failed to start data export');
  }
};

const deleteAccount = async () => {
  try {
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    successToast('Account deleted successfully');
    await authStore.logout();
    router.push('/login');
  } catch (error) {
    errorToast('Failed to delete account');
  }
};
</script>

<style scoped>
.profile-page {
  max-width: 800px;
  margin: 0 auto;
  padding: 32px 0;
}

.profile-header {
  margin-bottom: 40px;
}

.page-title {
  font-size: 32px;
  font-weight: 700;
  color: var(--color-text);
  margin: 0 0 8px 0;
}

.page-description {
  font-size: 16px;
  color: var(--color-muted);
  margin: 0;
}

.profile-content {
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.profile-section {
  background: var(--color-background-soft);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
}

.section-header {
  padding: 24px;
  border-bottom: 1px solid var(--color-border);
}

.section-title {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 20px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0;
}

.section-title svg {
  color: var(--color-primary-500);
}

.section-content {
  padding: 24px;
}

/* Forms */
.profile-form,
.password-form,
.preferences-form {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text);
}

.form-input,
.form-textarea,
.form-select {
  padding: 12px 16px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-background);
  color: var(--color-text);
  font-size: 14px;
  transition: border-color 0.2s ease;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: var(--color-primary-500);
}

.form-textarea {
  resize: vertical;
  min-height: 100px;
}

/* Avatar Upload */
.avatar-group {
  flex-direction: row;
  align-items: center;
  gap: 20px;
}

.avatar-upload {
  display: flex;
  align-items: center;
  gap: 20px;
  flex: 1;
}

.current-avatar {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.avatar-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-fallback {
  width: 100%;
  height: 100%;
  background: var(--color-primary-500);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  font-weight: 700;
}

.avatar-actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* Radio and Checkbox Groups */
.radio-group {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
}

.radio-option,
.checkbox-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.radio-option input[type="radio"],
.checkbox-option input[type="checkbox"] {
  margin: 0;
}

.radio-label,
.checkbox-label {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 14px;
  color: var(--color-text);
}

.checkbox-group {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

/* Buttons */
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

.btn-primary {
  background: var(--color-primary-500);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-600);
  transform: translateY(-1px);
}

.btn-secondary {
  background: var(--color-background);
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn-secondary:hover {
  background: var(--color-border);
  transform: translateY(-1px);
}

.btn-outline {
  background: transparent;
  color: var(--color-text);
  border: 1px solid var(--color-border);
}

.btn-outline:hover {
  background: var(--color-background-soft);
  transform: translateY(-1px);
}

.btn-danger {
  background: #dc3545;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #c82333;
  transform: translateY(-1px);
}

.form-actions {
  display: flex;
  justify-content: flex-start;
  padding-top: 16px;
  border-top: 1px solid var(--color-border);
}

/* Danger Zone */
.danger-zone {
  border-color: #dc3545;
}

.danger-zone .section-title svg {
  color: #dc3545;
}

.danger-actions {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.danger-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 20px;
  background: var(--color-background);
  border: 1px solid var(--color-border);
  border-radius: 8px;
}

.danger-info {
  flex: 1;
}

.danger-info h3 {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text);
  margin: 0 0 4px 0;
}

.danger-info p {
  font-size: 14px;
  color: var(--color-muted);
  margin: 0;
  line-height: 1.4;
}

/* Modal */
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

.modal-content {
  background: var(--color-background);
  border-radius: 12px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow: auto;
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

/* Responsive */
@media (max-width: 768px) {
  .profile-page {
    padding: 20px 0;
  }

  .form-row {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .avatar-group {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .avatar-upload {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .radio-group {
    flex-direction: column;
    gap: 12px;
  }

  .danger-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 16px;
  }

  .avatar-actions {
    width: 100%;
  }

  .btn {
    width: 100%;
    justify-content: center;
  }

  .modal-overlay {
    padding: 16px;
  }

  .modal-footer {
    flex-direction: column;
    gap: 8px;
  }

  .modal-footer .btn {
    width: 100%;
  }
}

@media (max-width: 480px) {
  .page-title {
    font-size: 24px;
  }

  .section-content {
    padding: 16px;
  }

  .section-header {
    padding: 16px;
  }

  .current-avatar {
    width: 60px;
    height: 60px;
  }

  .avatar-fallback {
    font-size: 18px;
  }
}
</style>
