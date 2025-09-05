'use client';

import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { 
  ClockIcon,
  ArrowDownTrayIcon,
  TrashIcon,
  EyeIcon,
  ExclamationTriangleIcon,
  DocumentArrowDownIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { SettingsSectionProps } from '@/types/settings';
import { SettingsSection, SettingsFormRow } from './SettingsLayout';
import { ActivityApiService } from '@/lib/activity-api';
import { ActivityResponse } from '@/types/activity';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function ActivitySettings({ 
  user, 
  preferences, 
  onUpdate,
  isLoading = false 
}: SettingsSectionProps) {
  const [activities, setActivities] = useState<ActivityResponse[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    includeProfile: true,
    includeActivities: true,
    includeUploads: false,
    includePreferences: true,
    format: 'json' as 'json' | 'csv',
    dateRange: {
      from: '',
      to: ''
    }
  });

  // Fetch user's personal activities
  useEffect(() => {
    fetchMyActivities();
  }, []);

  const fetchMyActivities = async () => {
    setActivitiesLoading(true);
    try {
      const response = await ActivityApiService.getMyActivities({
        page: 1,
        per_page: 10
      });
      setActivities(response.activities);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
      setActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const handleExportData = async () => {
    try {
      console.log('Exporting data with options:', exportOptions);
      // Will be implemented with real API
      setShowExportDialog(false);
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  const handleDeleteAccount = async () => {
    try {
      console.log('Requesting account deletion...');
      // Will be implemented with real API
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Failed to request account deletion:', error);
    }
  };

  const formatTimeAgo = (timestamp: string): string => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now.getTime() - activityTime.getTime();
    
    if (diffMs < 60 * 1000) return 'Just now';
    if (diffMs < 60 * 60 * 1000) return `${Math.floor(diffMs / (60 * 1000))} minutes ago`;
    if (diffMs < 24 * 60 * 60 * 1000) return `${Math.floor(diffMs / (60 * 60 * 1000))} hours ago`;
    return `${Math.floor(diffMs / (24 * 60 * 60 * 1000))} days ago`;
  };

  const getActivityIcon = (actionType: string) => {
    switch (actionType) {
      case 'LOGIN': return '🔐';
      case 'LOGOUT': return '🚪';
      case 'UPLOAD': return '📤';
      case 'DELETE': return '🗑️';
      case 'SEARCH': return '🔍';
      case 'USER_CREATE': return '👤';
      case 'USER_UPDATE': return '✏️';
      case 'SYSTEM_HEALTH': return '⚡';
      default: return '📋';
    }
  };

  return (
    <div className="space-y-8">
      {/* Personal Activity History */}
      <SettingsSection
        title="My Activity History"
        description="View your recent account activity and actions"
      >
        <div className="bg-gray-50 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h4 className="text-sm font-medium text-gray-900">Recent Activities</h4>
            <button
              onClick={fetchMyActivities}
              disabled={activitiesLoading}
              className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              <ClockIcon className={classNames("size-3 mr-1", activitiesLoading && "animate-spin")} />
              Refresh
            </button>
          </div>

          {activitiesLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center space-x-3 animate-pulse">
                  <div className="size-8 bg-gray-300 rounded-full"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-gray-300 rounded w-3/4 mb-1"></div>
                    <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                  </div>
                  <div className="h-3 bg-gray-300 rounded w-16"></div>
                </div>
              ))}
            </div>
          ) : activities.length > 0 ? (
            <div className="space-y-3">
              {activities.map((activity) => (
                <div key={activity.id} className="flex items-start space-x-3 p-3 bg-white rounded-lg border">
                  <div className="flex-shrink-0">
                    <span className="text-lg">{getActivityIcon(activity.action_type)}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900">
                      {activity.description}
                    </p>
                    <div className="flex items-center space-x-4 mt-1 text-xs text-gray-500">
                      <span>{activity.resource_type}</span>
                      <span>{activity.status}</span>
                      {activity.ip_address && <span>IP: {activity.ip_address}</span>}
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <span className="text-xs text-gray-500">
                      {formatTimeAgo(activity.timestamp)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-6">
              <InformationCircleIcon className="mx-auto size-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-500">No recent activities to display</p>
            </div>
          )}

          <div className="mt-4 text-center">
            <button
              onClick={() => {/* Navigate to full activity logs */}}
              className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
            >
              View all my activities →
            </button>
          </div>
        </div>
      </SettingsSection>

      {/* Privacy Controls */}
      <SettingsSection
        title="Privacy Controls"
        description="Manage your privacy settings and data sharing preferences"
      >
        <div className="space-y-6">
          <SettingsFormRow
            label="Profile Visibility"
            description="Control who can see your profile information"
          >
            <select
              value={preferences.profileVisibility}
              onChange={(e) => onUpdate({ preferences: { profileVisibility: e.target.value as 'public' | 'private' | 'team' } })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              disabled={isLoading}
            >
              <option value="public">Public - Anyone can see your profile</option>
              <option value="team">Team - Only team members</option>
              <option value="private">Private - Only you</option>
            </select>
          </SettingsFormRow>

          <SettingsFormRow
            label="Activity Visibility"
            description="Show your last activity time to others"
          >
            <select
              value={preferences.showLastActivity ? 'visible' : 'hidden'}
              onChange={(e) => onUpdate({ preferences: { showLastActivity: e.target.value === 'visible' } })}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              disabled={isLoading}
            >
              <option value="visible">Show last activity</option>
              <option value="hidden">Keep activity private</option>
            </select>
          </SettingsFormRow>
        </div>
      </SettingsSection>

      {/* Data Management */}
      <SettingsSection
        title="Data Management"
        description="Export your data or manage your account"
      >
        <div className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <ArrowDownTrayIcon className="size-5 text-blue-600 mr-3 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-900">Export Your Data</h4>
                <p className="text-sm text-blue-700 mt-1">
                  Download a copy of your account data, including profile information, activities, and preferences.
                </p>
                <button
                  onClick={() => setShowExportDialog(true)}
                  className="mt-3 inline-flex items-center px-3 py-1.5 border border-blue-300 shadow-sm text-sm font-medium rounded text-blue-700 bg-blue-50 hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  <DocumentArrowDownIcon className="size-4 mr-2" />
                  Export Data
                </button>
              </div>
            </div>
          </div>

          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-start">
              <ExclamationTriangleIcon className="size-5 text-red-600 mr-3 mt-0.5" />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-red-900">Delete Account</h4>
                <p className="text-sm text-red-700 mt-1">
                  Permanently delete your account and all associated data. This action cannot be undone.
                </p>
                <button
                  onClick={() => setShowDeleteDialog(true)}
                  className="mt-3 inline-flex items-center px-3 py-1.5 border border-red-300 shadow-sm text-sm font-medium rounded text-red-700 bg-red-50 hover:bg-red-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                >
                  <TrashIcon className="size-4 mr-2" />
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </SettingsSection>

      {/* Export Data Modal */}
      <Dialog open={showExportDialog} onClose={setShowExportDialog} className="relative z-50">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <div>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
                  <DocumentArrowDownIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Export Your Data
                  </Dialog.Title>
                  <div className="mt-4 text-left">
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-700">What to include:</label>
                        <div className="mt-2 space-y-2">
                          {[
                            { key: 'includeProfile', label: 'Profile information' },
                            { key: 'includeActivities', label: 'Activity history' },
                            { key: 'includeUploads', label: 'Uploaded files' },
                            { key: 'includePreferences', label: 'Settings and preferences' }
                          ].map(({ key, label }) => (
                            <label key={key} className="flex items-center">
                              <input
                                type="checkbox"
                                checked={exportOptions[key as keyof typeof exportOptions] as boolean}
                                onChange={(e) => setExportOptions(prev => ({ ...prev, [key]: e.target.checked }))}
                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                              />
                              <span className="ml-2 text-sm text-gray-700">{label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Format:</label>
                        <select
                          value={exportOptions.format}
                          onChange={(e) => setExportOptions(prev => ({ ...prev, format: e.target.value as 'json' | 'csv' }))}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                        >
                          <option value="json">JSON</option>
                          <option value="csv">CSV</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                <button
                  type="button"
                  onClick={handleExportData}
                  className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 sm:col-start-2"
                >
                  Export Data
                </button>
                <button
                  type="button"
                  onClick={() => setShowExportDialog(false)}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 sm:col-start-1 sm:mt-0"
                >
                  Cancel
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>

      {/* Delete Account Modal */}
      <Dialog open={showDeleteDialog} onClose={setShowDeleteDialog} className="relative z-50">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                  <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
                </div>
                <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Delete Account
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Are you sure you want to delete your account? This will permanently remove all your data, including:
                    </p>
                    <ul className="mt-2 text-sm text-gray-500 list-disc list-inside space-y-1">
                      <li>Profile information and avatar</li>
                      <li>All uploaded documents and files</li>
                      <li>Activity history and logs</li>
                      <li>Settings and preferences</li>
                    </ul>
                    <p className="mt-2 text-sm font-medium text-red-600">
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 sm:ml-3 sm:w-auto"
                >
                  Delete Account
                </button>
                <button
                  type="button"
                  onClick={() => setShowDeleteDialog(false)}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 sm:mt-0 sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </Dialog.Panel>
          </div>
        </div>
      </Dialog>
    </div>
  );
}