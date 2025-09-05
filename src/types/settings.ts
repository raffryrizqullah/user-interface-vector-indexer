// Settings-related TypeScript interfaces for user preferences and profile management

import { User } from '@/lib/api';

// Theme and appearance settings
export enum ThemeMode {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system'
}

export enum Language {
  EN = 'en',
  ID = 'id'
}

// User preferences interface
export interface UserPreferences {
  // Appearance settings
  theme: ThemeMode;
  language: Language;
  timezone: string;
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
  
  // Dashboard preferences
  dashboardLayout: 'compact' | 'comfortable' | 'spacious';
  showRecentActivity: boolean;
  showQuickActions: boolean;
  defaultView: 'dashboard' | 'upsert-records' | 'vector-search' | 'health-check';
  
  // Notification preferences
  emailNotifications: boolean;
  activityNotifications: boolean;
  systemAlerts: boolean;
  securityAlerts: boolean;
  
  // Privacy settings
  profileVisibility: 'public' | 'private' | 'team';
  showLastActivity: boolean;
  allowDataExport: boolean;
}

// Profile update data interface
export interface ProfileUpdateData {
  username?: string;
  email?: string;
  fullName?: string;
  bio?: string;
  avatar?: File | null;
  preferences?: Partial<UserPreferences>;
}

// Password change interface
export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

// Avatar upload response
export interface AvatarUploadResponse {
  avatar_url: string;
  thumbnail_url: string;
  upload_id: string;
}

// User session interface for active sessions management
export interface UserSession {
  id: string;
  device: string;
  browser: string;
  os: string;
  ip_address: string;
  location?: string;
  last_activity: string;
  created_at: string;
  is_current: boolean;
}

// Settings categories for navigation
export interface SettingsCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  component: React.ComponentType<SettingsSectionProps>;
}

// Props for settings section components
export interface SettingsSectionProps {
  user: User;
  preferences: UserPreferences;
  onUpdate: (data: Partial<ProfileUpdateData>) => Promise<void>;
  onPreferencesUpdate: (preferences: Partial<UserPreferences>) => Promise<void>;
  isLoading?: boolean;
}

// Form field types for reusable components
export interface SettingsFormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'textarea' | 'select' | 'switch' | 'file';
  value: string | boolean | File | null;
  placeholder?: string;
  description?: string;
  required?: boolean;
  disabled?: boolean;
  options?: Array<{ value: string; label: string }>;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    required?: boolean;
    custom?: (value: string | boolean | File | null) => string | null;
  };
}

// Avatar crop settings
export interface AvatarCropSettings {
  x: number;
  y: number;
  width: number;
  height: number;
  scale: number;
}

// Settings form state
export interface SettingsFormState<T = Record<string, unknown>> {
  data: T;
  errors: Record<string, string>;
  isLoading: boolean;
  isSubmitting: boolean;
  isDirty: boolean;
  isValid: boolean;
}

// Security settings
export interface SecuritySettings {
  twoFactorEnabled: boolean;
  loginNotifications: boolean;
  suspiciousActivityAlerts: boolean;
  sessionTimeout: number; // in minutes
  passwordExpiryDays: number;
  allowMultipleSessions: boolean;
}

// Data export request
export interface DataExportRequest {
  includeProfile: boolean;
  includeActivities: boolean;
  includeUploads: boolean;
  includePreferences: boolean;
  format: 'json' | 'csv';
  dateRange?: {
    from: string;
    to: string;
  };
}

// Data export response
export interface DataExportResponse {
  exportId: string;
  status: 'processing' | 'completed' | 'failed';
  downloadUrl?: string;
  createdAt: string;
  expiresAt: string;
  fileSize?: number;
}

// Settings API response wrappers
export interface SettingsResponse<T = unknown> {
  success: boolean;
  message: string;
  data?: T;
  errors?: Record<string, string[]>;
}

// Settings context type for React context
export interface SettingsContextType {
  user: User | null;
  preferences: UserPreferences | null;
  activeSessions: UserSession[];
  isLoading: boolean;
  error: string | null;
  
  // Actions
  updateProfile: (data: ProfileUpdateData) => Promise<void>;
  updatePreferences: (preferences: Partial<UserPreferences>) => Promise<void>;
  changePassword: (data: PasswordChangeData) => Promise<void>;
  uploadAvatar: (file: File, cropSettings?: AvatarCropSettings) => Promise<void>;
  deleteAvatar: () => Promise<void>;
  revokeSession: (sessionId: string) => Promise<void>;
  exportUserData: (request: DataExportRequest) => Promise<DataExportResponse>;
  refreshSettings: () => Promise<void>;
}

// Default preferences
export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: ThemeMode.SYSTEM,
  language: Language.EN,
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '24h',
  
  dashboardLayout: 'comfortable',
  showRecentActivity: true,
  showQuickActions: true,
  defaultView: 'dashboard',
  
  emailNotifications: true,
  activityNotifications: true,
  systemAlerts: true,
  securityAlerts: true,
  
  profileVisibility: 'private',
  showLastActivity: false,
  allowDataExport: true,
};

// Settings validation schemas
export const SETTINGS_VALIDATION = {
  username: {
    minLength: 3,
    maxLength: 30,
    pattern: /^[a-zA-Z0-9_]+$/,
    message: 'Username must be 3-30 characters and contain only letters, numbers, and underscores'
  },
  password: {
    minLength: 8,
    pattern: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/,
    message: 'Password must contain at least 8 characters with uppercase, lowercase, number, and special character'
  },
  email: {
    pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    message: 'Please enter a valid email address'
  },
  bio: {
    maxLength: 500,
    message: 'Bio must be less than 500 characters'
  },
  fullName: {
    maxLength: 100,
    message: 'Full name must be less than 100 characters'
  }
} as const;