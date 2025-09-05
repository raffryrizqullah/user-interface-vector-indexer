'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  DocumentPlusIcon, 
  MagnifyingGlassIcon, 
  ExclamationTriangleIcon,
  UserIcon,
  ArrowRightOnRectangleIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  UsersIcon,
  InformationCircleIcon,
  ArrowPathIcon
} from '@heroicons/react/20/solid';
import { HeartIcon } from '@heroicons/react/24/outline';
import { ActivityApiService } from '@/lib/activity-api';
import { ActivityResponse, ActionType } from '@/types/activity';

// Icon mapping for activity types
const getActivityIcon = (actionType: ActionType): React.ComponentType<React.SVGProps<SVGSVGElement>> => {
  switch (actionType) {
    case ActionType.LOGIN:
      return UserIcon;
    case ActionType.LOGOUT:
      return ArrowRightOnRectangleIcon;
    case ActionType.UPLOAD:
      return DocumentPlusIcon;
    case ActionType.DELETE:
      return TrashIcon;
    case ActionType.SEARCH:
      return MagnifyingGlassIcon;
    case ActionType.CREATE_RECORDS:
      return DocumentDuplicateIcon;
    case ActionType.USER_CREATE:
    case ActionType.USER_UPDATE:
    case ActionType.USER_DELETE:
      return UsersIcon;
    case ActionType.SYSTEM_HEALTH:
      return HeartIcon;
    default:
      return InformationCircleIcon;
  }
};

// Color mapping for activity types  
const getActivityColor = (actionType: ActionType): string => {
  switch (actionType) {
    case ActionType.LOGIN:
      return 'bg-green-500';
    case ActionType.LOGOUT:
      return 'bg-gray-500';
    case ActionType.UPLOAD:
      return 'bg-blue-500';
    case ActionType.DELETE:
      return 'bg-red-500';
    case ActionType.SEARCH:
      return 'bg-purple-500';
    case ActionType.CREATE_RECORDS:
      return 'bg-indigo-500';
    case ActionType.USER_CREATE:
    case ActionType.USER_UPDATE:
    case ActionType.USER_DELETE:
      return 'bg-orange-500';
    case ActionType.SYSTEM_HEALTH:
      return 'bg-green-500';
    default:
      return 'bg-gray-500';
  }
};

// Legacy interface for backward compatibility
export interface ActivityItem {
  id: number;
  content: string;
  target: string;
  href?: string;
  onClick?: () => void;
  date: string;
  datetime: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  iconBackground: string;
}

interface RecentActivityProps {
  activities?: ActivityItem[]; // Legacy prop for backward compatibility
  isLoading?: boolean;
  onNavigate?: (view: string) => void;
  useRealData?: boolean; // New prop to enable real API data
  refreshInterval?: number; // Auto-refresh interval in milliseconds
  maxItems?: number; // Maximum number of items to display
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

function ActivitySkeleton() {
  return (
    <li>
      <div className="relative pb-8">
        <span aria-hidden="true" className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
        <div className="relative flex space-x-3">
          <div>
            <span className="flex size-8 items-center justify-center rounded-full bg-gray-300 animate-pulse ring-8 ring-white">
            </span>
          </div>
          <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
            <div className="flex-1">
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-1 animate-pulse"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2 animate-pulse"></div>
            </div>
            <div className="text-right">
              <div className="h-4 bg-gray-300 rounded w-16 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

// Convert API activity to display format
const convertActivityToDisplayFormat = (
  activity: ActivityResponse, 
  onNavigate?: (view: string) => void
): ActivityItem => {
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
    if (days < 7) {
      timeAgo = `${days} day${days > 1 ? 's' : ''} ago`;
    } else {
      timeAgo = activityTime.toLocaleDateString();
    }
  }

  // Determine click action based on activity type
  let onClick: (() => void) | undefined;
  if (onNavigate) {
    switch (activity.action_type) {
      case ActionType.UPLOAD:
      case ActionType.CREATE_RECORDS:
        onClick = () => onNavigate('upsert-records');
        break;
      case ActionType.SEARCH:
        onClick = () => onNavigate('vector-search');
        break;
      case ActionType.SYSTEM_HEALTH:
        onClick = () => onNavigate('health-check');
        break;
      case ActionType.USER_CREATE:
      case ActionType.USER_UPDATE:
      case ActionType.USER_DELETE:
        onClick = () => onNavigate('users');
        break;
      default:
        onClick = undefined;
    }
  }

  // Format content and target based on activity
  let content: string;
  let target: string;

  switch (activity.action_type) {
    case ActionType.LOGIN:
      content = `${activity.username || 'User'} logged in`;
      target = '';
      break;
    case ActionType.LOGOUT:
      content = `${activity.username || 'User'} logged out`;
      target = '';
      break;
    case ActionType.UPLOAD:
      content = `${activity.username || 'User'} uploaded`;
      target = activity.metadata?.filename || 'document';
      break;
    case ActionType.DELETE:
      content = `${activity.username || 'User'} deleted`;
      target = activity.metadata?.filename || 'resource';
      break;
    case ActionType.SEARCH:
      content = `${activity.username || 'User'} searched for`;
      target = activity.metadata?.query || 'vectors';
      break;
    case ActionType.CREATE_RECORDS:
      content = `${activity.username || 'User'} created`;
      target = `${activity.metadata?.count || ''} records`;
      break;
    case ActionType.USER_CREATE:
      content = `${activity.username || 'Admin'} created user`;
      target = activity.metadata?.target_username || 'account';
      break;
    case ActionType.USER_UPDATE:
      content = `${activity.username || 'Admin'} updated user`;
      target = activity.metadata?.target_username || 'account';
      break;
    case ActionType.USER_DELETE:
      content = `${activity.username || 'Admin'} deleted user`;
      target = activity.metadata?.target_username || 'account';
      break;
    case ActionType.SYSTEM_HEALTH:
      content = 'System health check';
      target = activity.status === 'SUCCESS' ? 'completed successfully' : 'failed';
      break;
    default:
      content = activity.description;
      target = '';
  }

  return {
    id: parseInt(activity.id.replace(/-/g, '').substring(0, 8), 16), // Convert UUID to number
    content,
    target,
    onClick,
    date: timeAgo,
    datetime: activity.timestamp,
    icon: getActivityIcon(activity.action_type),
    iconBackground: getActivityColor(activity.action_type)
  };
};

export default function RecentActivity({ 
  activities: legacyActivities, 
  isLoading: externalLoading = false, 
  onNavigate,
  useRealData = true,
  refreshInterval = 30000, // 30 seconds default
  maxItems = 5
}: RecentActivityProps) {
  const [realActivities, setRealActivities] = useState<ActivityResponse[]>([]);
  const [isRealDataLoading, setIsRealDataLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  // Fetch activities from API
  const fetchActivities = useCallback(async () => {
    if (!useRealData) return;
    
    setIsRealDataLoading(true);
    setError(null);
    
    try {
      const activities = await ActivityApiService.getRecentActivities();
      setRealActivities(activities.slice(0, maxItems));
      setLastRefresh(new Date());
    } catch (err) {
      console.error('Failed to fetch activities:', err);
      setError(err instanceof Error ? err.message : 'Failed to load activities');
    } finally {
      setIsRealDataLoading(false);
    }
  }, [useRealData, maxItems]);

  // Initial load and auto-refresh
  useEffect(() => {
    if (useRealData) {
      fetchActivities();
      
      // Set up auto-refresh if interval is provided
      if (refreshInterval > 0) {
        const interval = setInterval(fetchActivities, refreshInterval);
        return () => clearInterval(interval);
      }
    }
  }, [fetchActivities, refreshInterval, useRealData]);

  // Manual refresh handler
  const handleRefresh = () => {
    fetchActivities();
  };

  // Determine what data to display
  const isLoading = externalLoading || isRealDataLoading;
  const displayActivities = useRealData 
    ? realActivities.map(activity => convertActivityToDisplayFormat(activity, onNavigate))
    : (legacyActivities || []);

  if (isLoading && displayActivities.length === 0) {
    return (
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Recent Activity
            </h3>
          </div>
          <div className="flow-root">
            <ul role="list" className="-mb-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <ActivitySkeleton key={i} />
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (error && displayActivities.length === 0) {
    return (
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Recent Activity
            </h3>
            <button
              onClick={handleRefresh}
              className="text-sm text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
            >
              <ArrowPathIcon className="size-4" />
              Retry
            </button>
          </div>
          <div className="text-center py-8">
            <ExclamationTriangleIcon className="mx-auto size-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500 mb-2">Failed to load activities</p>
            <p className="text-xs text-gray-400">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (displayActivities.length === 0) {
    return (
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              Recent Activity
            </h3>
            {useRealData && (
              <button
                onClick={handleRefresh}
                className="text-sm text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                disabled={isLoading}
              >
                <ArrowPathIcon className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            )}
          </div>
          <div className="text-center py-8">
            <InformationCircleIcon className="mx-auto size-8 text-gray-400 mb-2" />
            <p className="text-sm text-gray-500">No recent activities to display</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Recent Activity
          </h3>
          <div className="flex items-center gap-3">
            {useRealData && (
              <>
                <span className="text-xs text-gray-400">
                  Updated {lastRefresh.toLocaleTimeString()}
                </span>
                <button
                  onClick={handleRefresh}
                  className="text-sm text-indigo-600 hover:text-indigo-900 flex items-center gap-1"
                  disabled={isLoading}
                >
                  <ArrowPathIcon className={`size-4 ${isLoading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </>
            )}
          </div>
        </div>
        <div className="flow-root">
          <ul role="list" className="-mb-8">
            {displayActivities.map((activity, activityIdx) => (
              <li key={activity.id}>
                <div className="relative pb-8">
                  {activityIdx !== displayActivities.length - 1 ? (
                    <span aria-hidden="true" className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div>
                      <span
                        className={classNames(
                          activity.iconBackground,
                          'flex size-8 items-center justify-center rounded-full ring-8 ring-white',
                        )}
                      >
                        <activity.icon aria-hidden="true" className="size-5 text-white" />
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                      <div>
                        <p className="text-sm text-gray-500">
                          {activity.content}{' '}
                          {activity.target && (
                            activity.onClick ? (
                              <button 
                                onClick={activity.onClick} 
                                className="font-medium text-gray-900 hover:text-indigo-600 transition-colors duration-200 underline"
                              >
                                {activity.target}
                              </button>
                            ) : activity.href ? (
                              <a 
                                href={activity.href} 
                                className="font-medium text-gray-900 hover:text-indigo-600 transition-colors duration-200"
                              >
                                {activity.target}
                              </a>
                            ) : (
                              <span className="font-medium text-gray-900">{activity.target}</span>
                            )
                          )}
                        </p>
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                        <time dateTime={activity.datetime}>{activity.date}</time>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
        
        {/* View More Activities Link (for admins) */}
        {useRealData && displayActivities.length > 0 && onNavigate && (
          <div className="mt-6 pt-4 border-t border-gray-200">
            <button
              onClick={() => onNavigate('activity-logs')}
              className="text-sm font-medium text-indigo-600 hover:text-indigo-900 transition-colors duration-200"
            >
              View all activities →
            </button>
          </div>
        )}
      </div>
    </div>
  );
}