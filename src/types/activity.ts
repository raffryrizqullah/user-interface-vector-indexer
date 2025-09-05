// Activity-related TypeScript interfaces based on backend API schema

export enum ActionType {
  LOGIN = 'LOGIN',
  LOGOUT = 'LOGOUT',
  UPLOAD = 'UPLOAD',
  DELETE = 'DELETE',
  SEARCH = 'SEARCH',
  CREATE_INDEX = 'CREATE_INDEX',
  CREATE_RECORDS = 'CREATE_RECORDS',
  READ_RECORDS = 'READ_RECORDS',
  DELETE_RECORDS = 'DELETE_RECORDS',
  USER_CREATE = 'USER_CREATE',
  USER_UPDATE = 'USER_UPDATE',
  USER_DELETE = 'USER_DELETE',
  SYSTEM_HEALTH = 'SYSTEM_HEALTH'
}

export enum ResourceType {
  USER = 'USER',
  DOCUMENT = 'DOCUMENT',
  VECTOR = 'VECTOR',
  INDEX = 'INDEX',
  SYSTEM = 'SYSTEM'
}

export enum ActivityStatus {
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  PENDING = 'PENDING'
}

export interface ActivityResponse {
  id: string;
  user_id: string | null;
  username: string | null;
  action_type: ActionType;
  resource_type: ResourceType;
  resource_id: string | null;
  description: string;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  user_agent: string | null;
  timestamp: string; // ISO datetime string
  status: ActivityStatus;
}

export interface ActivityListResponse {
  activities: ActivityResponse[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

export interface ActivityCreate {
  user_id?: string | null;
  username?: string | null;
  action_type: ActionType;
  resource_type: ResourceType;
  resource_id?: string | null;
  description: string;
  metadata?: Record<string, unknown> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  status?: ActivityStatus;
}

export interface ActivityFilters {
  user_id?: string | null;
  username?: string | null;
  action_type?: ActionType | null;
  resource_type?: ResourceType | null;
  resource_id?: string | null;
  status?: ActivityStatus | null;
  date_from?: string | null; // ISO datetime string
  date_to?: string | null; // ISO datetime string
  page?: number;
  per_page?: number;
}

export interface ActivityStats {
  total_activities: number;
  by_action_type: Record<ActionType, number>;
  by_resource_type: Record<ResourceType, number>;
  by_status: Record<ActivityStatus, number>;
  by_date?: Record<string, number>; // date -> count mapping
  top_users?: Array<{
    user_id: string;
    username: string;
    activity_count: number;
  }>;
}

// UI-specific interfaces for components
export interface ActivityDisplayItem extends ActivityResponse {
  timeAgo: string; // Human readable time (e.g., "2 hours ago")
  actionIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  actionColor: string; // Tailwind color class
  isClickable: boolean;
  onClick?: () => void;
}

export interface ActivityFilterState {
  search: string;
  action_type: ActionType | '';
  resource_type: ResourceType | '';
  status: ActivityStatus | '';
  date_range: 'today' | 'week' | 'month' | 'custom' | '';
  custom_date_from: string;
  custom_date_to: string;
  user_filter: string; // username search
}