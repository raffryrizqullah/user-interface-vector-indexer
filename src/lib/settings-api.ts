import { AuthService } from './auth';
import {
  UserPreferences,
  ProfileUpdateData,
  PasswordChangeData,
  AvatarUploadResponse,
  UserSession,
  DataExportRequest,
  DataExportResponse,
  SettingsResponse,
  AvatarCropSettings
} from '@/types/settings';
import { User } from './api';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

export class SettingsApiService {
  /**
   * Get current user profile information
   */
  static async getUserProfile(): Promise<User> {
    const response = await AuthService.makeAuthenticatedRequest(
      `${API_BASE_URL}/users/me`
    );
    
    if (!response.ok) {
      throw new Error(`Failed to fetch user profile: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Update user profile information
   */
  static async updateProfile(data: ProfileUpdateData): Promise<User> {
    const response = await AuthService.makeAuthenticatedRequest(
      `${API_BASE_URL}/users/me`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: data.username,
          email: data.email,
          full_name: data.fullName,
          bio: data.bio,
        }),
      }
    );
    
    if (!response.ok) {
      if (response.status === 409) {
        throw new Error('Username or email already exists');
      } else if (response.status === 422) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessages = errorData.detail || 'Invalid profile data provided';
        if (Array.isArray(errorMessages)) {
          const messages = errorMessages.map(e => e.msg || e.message || e).join(', ');
          throw new Error(messages);
        }
        throw new Error(errorMessages);
      }
      throw new Error(`Failed to update profile: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Upload user avatar image
   */
  static async uploadAvatar(
    file: File, 
    cropSettings?: AvatarCropSettings
  ): Promise<AvatarUploadResponse> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    if (cropSettings) {
      formData.append('crop_settings', JSON.stringify(cropSettings));
    }

    const response = await AuthService.makeAuthenticatedRequest(
      `${API_BASE_URL}/users/me/avatar`,
      {
        method: 'POST',
        body: formData,
      }
    );
    
    if (!response.ok) {
      if (response.status === 413) {
        throw new Error('File is too large. Maximum size is 5MB.');
      } else if (response.status === 415) {
        throw new Error('Invalid file type. Please upload JPG, PNG, or GIF images only.');
      }
      throw new Error(`Failed to upload avatar: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Delete user avatar
   */
  static async deleteAvatar(): Promise<void> {
    const response = await AuthService.makeAuthenticatedRequest(
      `${API_BASE_URL}/users/me/avatar`,
      {
        method: 'DELETE',
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to delete avatar: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Change user password
   */
  static async changePassword(data: PasswordChangeData): Promise<void> {
    const response = await AuthService.makeAuthenticatedRequest(
      `${API_BASE_URL}/users/me/password`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          current_password: data.currentPassword,
          new_password: data.newPassword,
        }),
      }
    );
    
    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Current password is incorrect');
      } else if (response.status === 422) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessages = errorData.detail || 'Invalid password data provided';
        if (Array.isArray(errorMessages)) {
          const messages = errorMessages.map(e => e.msg || e.message || e).join(', ');
          throw new Error(messages);
        }
        throw new Error(errorMessages);
      }
      throw new Error(`Failed to change password: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Get user preferences
   */
  static async getUserPreferences(): Promise<UserPreferences> {
    const response = await AuthService.makeAuthenticatedRequest(
      `${API_BASE_URL}/users/me/preferences`
    );
    
    if (!response.ok) {
      if (response.status === 404) {
        // Return default preferences if none exist
        const { DEFAULT_PREFERENCES } = await import('@/types/settings');
        return DEFAULT_PREFERENCES;
      }
      throw new Error(`Failed to fetch user preferences: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Update user preferences
   */
  static async updatePreferences(preferences: Partial<UserPreferences>): Promise<UserPreferences> {
    const response = await AuthService.makeAuthenticatedRequest(
      `${API_BASE_URL}/users/me/preferences`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(preferences),
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to update preferences: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get active user sessions
   */
  static async getActiveSessions(): Promise<UserSession[]> {
    const response = await AuthService.makeAuthenticatedRequest(
      `${API_BASE_URL}/users/me/sessions`
    );
    
    if (!response.ok) {
      if (response.status === 404) {
        // Return empty array if endpoint doesn't exist yet
        return [];
      }
      throw new Error(`Failed to fetch active sessions: ${response.status} ${response.statusText}`);
    }
    
    try {
      const data = await response.json();
      
      // Handle different response formats
      if (Array.isArray(data)) {
        return data;
      } else if (data && typeof data === 'object') {
        if (Array.isArray(data.sessions)) {
          return data.sessions;
        } else if (Array.isArray(data.data)) {
          return data.data;
        }
      }
      
      console.warn('Sessions API returned unexpected format:', data);
      return [];
    } catch (parseError) {
      console.error('Failed to parse sessions response:', parseError);
      return [];
    }
  }

  /**
   * Revoke a specific user session
   */
  static async revokeSession(sessionId: string): Promise<void> {
    const response = await AuthService.makeAuthenticatedRequest(
      `${API_BASE_URL}/users/me/sessions/${sessionId}`,
      {
        method: 'DELETE',
      }
    );
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Session not found or already expired');
      }
      throw new Error(`Failed to revoke session: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Request data export
   */
  static async requestDataExport(request: DataExportRequest): Promise<DataExportResponse> {
    const response = await AuthService.makeAuthenticatedRequest(
      `${API_BASE_URL}/users/me/export`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request),
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to request data export: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get data export status
   */
  static async getDataExportStatus(exportId: string): Promise<DataExportResponse> {
    const response = await AuthService.makeAuthenticatedRequest(
      `${API_BASE_URL}/users/me/export/${exportId}`
    );
    
    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Export request not found');
      }
      throw new Error(`Failed to get export status: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Request account deletion
   */
  static async requestAccountDeletion(reason?: string): Promise<void> {
    const response = await AuthService.makeAuthenticatedRequest(
      `${API_BASE_URL}/users/me/delete`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason,
          confirmation: true,
        }),
      }
    );
    
    if (!response.ok) {
      throw new Error(`Failed to request account deletion: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Validate settings data before submission
   */
  static validateProfileData(data: ProfileUpdateData): Record<string, string> {
    const errors: Record<string, string> = {};
    const { SETTINGS_VALIDATION } = await import('@/types/settings');

    if (data.username) {
      if (data.username.length < SETTINGS_VALIDATION.username.minLength) {
        errors.username = SETTINGS_VALIDATION.username.message;
      } else if (!SETTINGS_VALIDATION.username.pattern.test(data.username)) {
        errors.username = SETTINGS_VALIDATION.username.message;
      }
    }

    if (data.email && !SETTINGS_VALIDATION.email.pattern.test(data.email)) {
      errors.email = SETTINGS_VALIDATION.email.message;
    }

    if (data.fullName && data.fullName.length > SETTINGS_VALIDATION.fullName.maxLength) {
      errors.fullName = SETTINGS_VALIDATION.fullName.message;
    }

    if (data.bio && data.bio.length > SETTINGS_VALIDATION.bio.maxLength) {
      errors.bio = SETTINGS_VALIDATION.bio.message;
    }

    return errors;
  }

  /**
   * Validate password data
   */
  static validatePasswordData(data: PasswordChangeData): Record<string, string> {
    const errors: Record<string, string> = {};
    const { SETTINGS_VALIDATION } = await import('@/types/settings');

    if (!data.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!data.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (data.newPassword.length < SETTINGS_VALIDATION.password.minLength) {
      errors.newPassword = SETTINGS_VALIDATION.password.message;
    } else if (!SETTINGS_VALIDATION.password.pattern.test(data.newPassword)) {
      errors.newPassword = SETTINGS_VALIDATION.password.message;
    }

    if (data.newPassword !== data.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    return errors;
  }

  /**
   * Helper method to get user display name
   */
  static getUserDisplayName(user: User): string {
    // Assuming we might add fullName to User interface later
    return (user as User & { full_name?: string }).full_name || user.username;
  }

  /**
   * Helper method to get user avatar URL
   */
  static getUserAvatarUrl(user: User): string | null {
    // Assuming we might add avatar_url to User interface later
    return (user as User & { avatar_url?: string }).avatar_url || null;
  }

  /**
   * Helper method to check if user can perform admin actions in settings
   */
  static canPerformAdminActions(user: User): boolean {
    return user.role === 'super_admin' || user.role === 'admin';
  }

  /**
   * Format file size for display
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Generate a secure filename for uploads
   */
  static generateSecureFilename(originalFilename: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const extension = originalFilename.split('.').pop();
    
    return `${timestamp}_${randomString}.${extension}`;
  }
}