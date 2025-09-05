'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowPathIcon,
  UserIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  ChevronLeftIcon,
  ChevronRightIcon
} from '@heroicons/react/24/outline';
import { ActivityApiService } from '@/lib/activity-api';
import { 
  ActivityResponse, 
  ActionType, 
  ResourceType, 
  ActivityStatus, 
  ActivityFilters,
  ActivityListResponse
} from '@/types/activity';

// Import the same icon mapping from RecentActivity
import { 
  DocumentPlusIcon, 
  MagnifyingGlassIcon as SearchIcon,
  UserIcon as UserSolidIcon,
  ArrowRightOnRectangleIcon,
  TrashIcon,
  DocumentDuplicateIcon,
  UsersIcon,
  InformationCircleIcon as InfoIcon
} from '@heroicons/react/20/solid';
import { HeartIcon } from '@heroicons/react/24/outline';

const getActivityIcon = (actionType: ActionType): React.ComponentType<React.SVGProps<SVGSVGElement>> => {
  switch (actionType) {
    case ActionType.LOGIN:
      return UserSolidIcon;
    case ActionType.LOGOUT:
      return ArrowRightOnRectangleIcon;
    case ActionType.UPLOAD:
      return DocumentPlusIcon;
    case ActionType.DELETE:
      return TrashIcon;
    case ActionType.SEARCH:
      return SearchIcon;
    case ActionType.CREATE_RECORDS:
      return DocumentDuplicateIcon;
    case ActionType.USER_CREATE:
    case ActionType.USER_UPDATE:
    case ActionType.USER_DELETE:
      return UsersIcon;
    case ActionType.SYSTEM_HEALTH:
      return HeartIcon;
    default:
      return InfoIcon;
  }
};

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

interface ActivityDashboardProps {
  className?: string;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

function ActivitySkeleton() {
  return (
    <div className="border-b border-gray-200 pb-4 mb-4 last:border-b-0">
      <div className="flex items-start space-x-3">
        <div className="flex size-8 items-center justify-center rounded-full bg-gray-300 animate-pulse ring-4 ring-white"></div>
        <div className="flex-1 space-y-2">
          <div className="flex items-center justify-between">
            <div className="h-4 bg-gray-300 rounded w-1/2 animate-pulse"></div>
            <div className="h-3 bg-gray-300 rounded w-20 animate-pulse"></div>
          </div>
          <div className="h-3 bg-gray-300 rounded w-3/4 animate-pulse"></div>
          <div className="flex space-x-4 text-xs">
            <div className="h-3 bg-gray-300 rounded w-16 animate-pulse"></div>
            <div className="h-3 bg-gray-300 rounded w-12 animate-pulse"></div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ActivityDashboard({ className }: ActivityDashboardProps) {
  const [activities, setActivities] = useState<ActivityResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 20;

  // Filter state
  const [filters, setFilters] = useState<ActivityFilters>({
    page: 1,
    per_page: itemsPerPage
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch activities
  const fetchActivities = useCallback(async (showRefreshIndicator = false) => {
    try {
      if (showRefreshIndicator) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response: ActivityListResponse = await ActivityApiService.getActivities({
        ...filters,
        page: currentPage,
        per_page: itemsPerPage,
        username: searchQuery || undefined
      });

      setActivities(response.activities);
      setTotalPages(response.total_pages);
      setTotalItems(response.total);
    } catch (err) {
      console.error('Failed to fetch activities:', err);
      setError(err instanceof Error ? err.message : 'Failed to load activities');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [filters, currentPage, searchQuery]);

  // Initial load and filter changes
  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Handle filter changes
  const handleFilterChange = (key: keyof ActivityFilters, value: string) => {
    setFilters(prev => ({
      ...prev,
      [key]: value === '' ? undefined : value
    }));
    setCurrentPage(1); // Reset to first page when filtering
  };

  // Handle pagination
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  // Handle refresh
  const handleRefresh = () => {
    fetchActivities(true);
  };

  // Format time ago
  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now.getTime() - activityTime.getTime();
    
    if (diffMs < 60 * 1000) {
      return 'Just now';
    } else if (diffMs < 60 * 60 * 1000) {
      const minutes = Math.floor(diffMs / (60 * 1000));
      return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    } else if (diffMs < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(diffMs / (60 * 60 * 1000));
      return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    } else {
      const days = Math.floor(diffMs / (24 * 60 * 60 * 1000));
      if (days < 7) {
        return `${days} day${days > 1 ? 's' : ''} ago`;
      } else {
        return activityTime.toLocaleDateString();
      }
    }
  };

  // Format activity description
  const formatActivityDescription = (activity: ActivityResponse): string => {
    switch (activity.action_type) {
      case ActionType.LOGIN:
        return `${activity.username} logged into the system`;
      case ActionType.LOGOUT:
        return `${activity.username} logged out`;
      case ActionType.UPLOAD:
        return `${activity.username} uploaded ${activity.metadata?.filename || 'a file'}`;
      case ActionType.DELETE:
        return `${activity.username} deleted ${activity.metadata?.filename || 'a resource'}`;
      case ActionType.SEARCH:
        return `${activity.username} performed a vector search${activity.metadata?.query ? ` for "${activity.metadata.query}"` : ''}`;
      case ActionType.CREATE_RECORDS:
        return `${activity.username} created ${activity.metadata?.count || ''} vector records`;
      case ActionType.USER_CREATE:
        return `${activity.username} created user account for ${activity.metadata?.target_username || 'new user'}`;
      case ActionType.USER_UPDATE:
        return `${activity.username} updated user account for ${activity.metadata?.target_username || 'user'}`;
      case ActionType.USER_DELETE:
        return `${activity.username} deleted user account for ${activity.metadata?.target_username || 'user'}`;
      case ActionType.SYSTEM_HEALTH:
        return `System health check ${activity.status === 'SUCCESS' ? 'completed successfully' : 'failed'}`;
      default:
        return activity.description;
    }
  };

  if (loading && activities.length === 0) {
    return (
      <div className={classNames("bg-white shadow-sm rounded-lg border border-gray-200", className)}>
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-medium text-gray-900">Activity Logs</h2>
        </div>
        <div className="p-6">
          <div className="space-y-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <ActivitySkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={classNames("bg-white shadow-sm rounded-lg border border-gray-200", className)}>
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-medium text-gray-900">Activity Logs</h2>
          <div className="flex items-center space-x-3">
            <span className="text-sm text-gray-500">
              {totalItems} total activities
            </span>
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <ArrowPathIcon className={classNames("size-4 mr-1", refreshing ? "animate-spin" : "")} />
              Refresh
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mt-4 flex items-center justify-between">
          <div className="flex-1 max-w-md">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search by username..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md text-sm placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
              />
            </div>
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="ml-4 inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <FunnelIcon className="size-4 mr-2" />
            Filters
          </button>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Action Type
                </label>
                <select
                  value={filters.action_type || ''}
                  onChange={(e) => handleFilterChange('action_type', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Actions</option>
                  {Object.values(ActionType).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Resource Type
                </label>
                <select
                  value={filters.resource_type || ''}
                  onChange={(e) => handleFilterChange('resource_type', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Resources</option>
                  {Object.values(ResourceType).map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status || ''}
                  onChange={(e) => handleFilterChange('status', e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="">All Statuses</option>
                  {Object.values(ActivityStatus).map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <button
                  onClick={() => {
                    setFilters({ page: 1, per_page: itemsPerPage });
                    setSearchQuery('');
                    setCurrentPage(1);
                  }}
                  className="w-full px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Clear Filters
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        {error ? (
          <div className="text-center py-12">
            <ExclamationTriangleIcon className="mx-auto size-8 text-red-400 mb-4" />
            <h3 className="text-sm font-medium text-gray-900 mb-2">Error loading activities</h3>
            <p className="text-sm text-gray-500 mb-4">{error}</p>
            <button
              onClick={handleRefresh}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Try Again
            </button>
          </div>
        ) : activities.length === 0 ? (
          <div className="text-center py-12">
            <InformationCircleIcon className="mx-auto size-8 text-gray-400 mb-4" />
            <h3 className="text-sm font-medium text-gray-900 mb-2">No activities found</h3>
            <p className="text-sm text-gray-500">
              {searchQuery || Object.values(filters).some(v => v && v !== 1 && v !== itemsPerPage) 
                ? 'Try adjusting your search or filters.' 
                : 'Activities will appear here as users interact with the system.'}
            </p>
          </div>
        ) : (
          <>
            {/* Activity List */}
            <div className="space-y-6">
              {activities.map((activity) => {
                const Icon = getActivityIcon(activity.action_type);
                const iconColor = getActivityColor(activity.action_type);
                
                return (
                  <div key={activity.id} className="flex items-start space-x-3">
                    <div className={classNames(iconColor, "flex size-8 items-center justify-center rounded-full ring-4 ring-white")}>
                      <Icon className="size-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-sm font-medium text-gray-900">
                          {formatActivityDescription(activity)}
                        </p>
                        <div className="flex items-center space-x-2 text-sm text-gray-500">
                          <time dateTime={activity.timestamp}>
                            {formatTimeAgo(activity.timestamp)}
                          </time>
                          <span className={classNames(
                            "inline-flex items-center px-2 py-0.5 rounded text-xs font-medium",
                            activity.status === 'SUCCESS' 
                              ? "bg-green-100 text-green-800"
                              : activity.status === 'FAILED'
                              ? "bg-red-100 text-red-800"
                              : "bg-yellow-100 text-yellow-800"
                          )}>
                            {activity.status}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                        <span className="flex items-center">
                          <UserIcon className="size-3 mr-1" />
                          {activity.username || 'System'}
                        </span>
                        <span>{activity.resource_type}</span>
                        {activity.ip_address && (
                          <span>IP: {activity.ip_address}</span>
                        )}
                      </div>
                      {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                        <details className="mt-2">
                          <summary className="text-xs text-indigo-600 cursor-pointer hover:text-indigo-800">
                            Show details
                          </summary>
                          <pre className="mt-1 text-xs text-gray-600 bg-gray-50 p-2 rounded overflow-x-auto">
                            {JSON.stringify(activity.metadata, null, 2)}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between border-t border-gray-200 pt-6">
                <div className="text-sm text-gray-700">
                  Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, totalItems)} of {totalItems} activities
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <ChevronLeftIcon className="size-4 mr-1" />
                    Previous
                  </button>
                  <span className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </span>
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next
                    <ChevronRightIcon className="size-4 ml-1" />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}