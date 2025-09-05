import { AuthService } from './auth';
import {
  ActivityResponse,
  ActivityListResponse,
  ActivityCreate,
  ActivityFilters,
  ActivityStats,
  ActionType,
  ResourceType
} from '@/types/activity';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

export class ActivityApiService {
  /**
   * Get all activities (admin only)
   * Supports comprehensive filtering and pagination
   */
  static async getActivities(filters: ActivityFilters = {}): Promise<ActivityListResponse> {
    const params = new URLSearchParams();
    
    // Add filters to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const url = params.toString() 
      ? `${API_BASE_URL}/activities?${params}`
      : `${API_BASE_URL}/activities`;

    const response = await AuthService.makeAuthenticatedRequest(url);
    
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Admin access required to view all activities');
      }
      throw new Error(`Failed to fetch activities: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get activities for a specific user (admin only)
   */
  static async getUserActivities(
    userId: string, 
    filters: Omit<ActivityFilters, 'user_id'> = {}
  ): Promise<ActivityListResponse> {
    const params = new URLSearchParams();
    
    // Add filters to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const url = params.toString()
      ? `${API_BASE_URL}/activities/user/${userId}?${params}`
      : `${API_BASE_URL}/activities/user/${userId}`;

    const response = await AuthService.makeAuthenticatedRequest(url);
    
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Admin access required to view user activities');
      }
      if (response.status === 404) {
        throw new Error('User not found');
      }
      throw new Error(`Failed to fetch user activities: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get current user's activities
   * Available to all authenticated users
   */
  static async getMyActivities(
    filters: Omit<ActivityFilters, 'user_id' | 'username'> = {}
  ): Promise<ActivityListResponse> {
    const params = new URLSearchParams();
    
    // Add filters to query params
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, value.toString());
      }
    });

    const url = params.toString()
      ? `${API_BASE_URL}/activities/my-activities?${params}`
      : `${API_BASE_URL}/activities/my-activities`;

    const response = await AuthService.makeAuthenticatedRequest(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch my activities: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Get activity statistics (admin only)
   */
  static async getActivityStats(
    dateFrom?: string, 
    dateTo?: string
  ): Promise<ActivityStats> {
    const params = new URLSearchParams();
    
    if (dateFrom) {
      params.append('date_from', dateFrom);
    }
    if (dateTo) {
      params.append('date_to', dateTo);
    }

    const url = params.toString()
      ? `${API_BASE_URL}/activities/stats?${params}`
      : `${API_BASE_URL}/activities/stats`;

    const response = await AuthService.makeAuthenticatedRequest(url);
    
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Admin access required to view activity statistics');
      }
      throw new Error(`Failed to fetch activity stats: ${response.status} ${response.statusText}`);
    }
    
    return response.json();
  }

  /**
   * Create a new activity log entry (admin only)
   * Useful for manual logging or system events
   */
  static async createActivity(activity: ActivityCreate): Promise<void> {
    const response = await AuthService.makeAuthenticatedRequest(
      `${API_BASE_URL}/activities`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(activity),
      }
    );
    
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Admin access required to create activity logs');
      } else if (response.status === 422) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessages = errorData.detail || 'Invalid activity data provided';
        if (Array.isArray(errorMessages)) {
          const messages = errorMessages.map(e => e.msg || e.message || e).join(', ');
          throw new Error(messages);
        }
        throw new Error(errorMessages);
      }
      throw new Error(`Failed to create activity: ${response.status} ${response.statusText}`);
    }
  }

  /**
   * Helper method to get recent activities for dashboard
   * Returns the most recent 10 activities
   */
  static async getRecentActivities(): Promise<ActivityResponse[]> {
    try {
      const response = await this.getActivities({
        page: 1,
        per_page: 10
      });
      return response.activities;
    } catch {
      // If admin access fails, try to get current user's activities
      console.warn('Failed to fetch all activities, falling back to user activities');
      try {
        const myResponse = await this.getMyActivities({
          page: 1,
          per_page: 10
        });
        return myResponse.activities;
      } catch {
        console.error('Failed to fetch any activities');
        return [];
      }
    }
  }

  /**
   * Helper method to format activity for display
   */
  static formatActivityForDisplay(activity: ActivityResponse): {
    title: string;
    description: string;
    timeAgo: string;
    actionIcon: string;
    actionColor: string;
  } {
    const now = new Date();
    const activityTime = new Date(activity.timestamp);
    const diffMs = now.getTime() - activityTime.getTime();
    
    // Calculate time ago
    let timeAgo: string;
    if (diffMs < 60 * 1000) {
      timeAgo = 'Just now';
    } else if (diffMs < 60 * 60 * 1000) {
      const minutes = Math.floor(diffMs / (60 * 1000));
      timeAgo = `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffMs < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diffMs / (60 * 60 * 1000));
      timeAgo = `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
      timeAgo = `${days} day${days > 1 ? 's' : ''} ago`;
    }

    // Get action-specific formatting
    const actionConfig = this.getActionConfig(activity.action_type, activity.resource_type);
    
    return {
      title: `${activity.username || 'System'}`,
      description: activity.description,
      timeAgo,
      actionIcon: actionConfig.icon,
      actionColor: actionConfig.color
    };
  }

  /**
   * Helper method to get action-specific configuration
   */
  private static getActionConfig(actionType: ActionType): {
    icon: string;
    color: string;
  } {
    switch (actionType) {
      case ActionType.LOGIN:
        return { icon: 'UserIcon', color: 'bg-green-500' };
      case ActionType.LOGOUT:
        return { icon: 'ArrowRightOnRectangleIcon', color: 'bg-gray-500' };
      case ActionType.UPLOAD:
        return { icon: 'DocumentPlusIcon', color: 'bg-blue-500' };
      case ActionType.DELETE:
        return { icon: 'TrashIcon', color: 'bg-red-500' };
      case ActionType.SEARCH:
        return { icon: 'MagnifyingGlassIcon', color: 'bg-purple-500' };
      case ActionType.CREATE_RECORDS:
        return { icon: 'DocumentDuplicateIcon', color: 'bg-indigo-500' };
      case ActionType.USER_CREATE:
      case ActionType.USER_UPDATE:
      case ActionType.USER_DELETE:
        return { icon: 'UsersIcon', color: 'bg-orange-500' };
      case ActionType.SYSTEM_HEALTH:
        return { icon: 'HeartIcon', color: 'bg-green-500' };
      default:
        return { icon: 'InformationCircleIcon', color: 'bg-gray-500' };
    }
  }

  /**
   * Helper method to check if user has admin access to activities
   */
  static async checkActivityAccess(): Promise<{
    canViewAll: boolean;
    canViewStats: boolean;
    canCreate: boolean;
  }> {
    try {
      // Try to fetch activities to check admin access
      await this.getActivities({ page: 1, per_page: 1 });
      return {
        canViewAll: true,
        canViewStats: true,
        canCreate: true
      };
    } catch (error) {
      return {
        canViewAll: false,
        canViewStats: false,
        canCreate: false
      };
    }
  }
}