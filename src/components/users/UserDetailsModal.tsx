'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import {
  XMarkIcon,
  UserIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  CalendarIcon,
  MapPinIcon,
} from '@heroicons/react/24/outline';
import { ApiService, User, UserSession } from '@/lib/api';

interface UserDetailsModalProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (user: User) => void;
}

function getRoleBadgeClass(role: 'admin' | 'super_admin') {
  switch (role) {
    case 'super_admin':
      return 'bg-purple-100 text-purple-800 ring-purple-600/20';
    case 'admin':
      return 'bg-blue-100 text-blue-800 ring-blue-600/20';
    default:
      return 'bg-gray-100 text-gray-800 ring-gray-600/20';
  }
}

function getStatusBadgeClass(isActive: boolean, isVerified: boolean) {
  if (isActive && isVerified) {
    return 'bg-green-100 text-green-800 ring-green-600/20';
  } else if (isActive && !isVerified) {
    return 'bg-yellow-100 text-yellow-800 ring-yellow-600/20';
  } else {
    return 'bg-red-100 text-red-800 ring-red-600/20';
  }
}

function getStatusText(isActive: boolean, isVerified: boolean) {
  if (isActive && isVerified) return 'Active & Verified';
  if (isActive && !isVerified) return 'Active (Unverified)';
  return 'Inactive';
}

function formatDateTime(dateString: string) {
  return new Date(dateString).toLocaleString();
}

function getDeviceIcon(userAgent?: string) {
  if (!userAgent) return ComputerDesktopIcon;
  if (userAgent.toLowerCase().includes('mobile')) {
    return DevicePhoneMobileIcon;
  }
  return ComputerDesktopIcon;
}

export default function UserDetailsModal({ user, isOpen, onClose, onEdit }: UserDetailsModalProps) {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);

  useEffect(() => {
    if (user && isOpen) {
      fetchUserSessions();
    }
  }, [user, isOpen]);

  const fetchUserSessions = async () => {
    if (!user) return;

    setLoadingSessions(true);
    setSessionError(null);

    try {
      const response = await ApiService.getUserSessions(user.id);
      
      // Defensive validation: ensure we have an array
      let validatedSessions: UserSession[] = [];
      
      if (Array.isArray(response)) {
        // Direct array response
        validatedSessions = response;
      } else if (response && typeof response === 'object' && Array.isArray(response.sessions)) {
        // Response wrapped in object with sessions property
        validatedSessions = response.sessions;
      } else if (response && typeof response === 'object' && Array.isArray(response.data)) {
        // Response wrapped in object with data property
        validatedSessions = response.data;
      } else {
        // Fallback: log the actual response structure for debugging
        console.warn('Unexpected user sessions response format:', response);
        validatedSessions = [];
      }
      
      setSessions(validatedSessions);
    } catch (error) {
      console.error('Failed to fetch user sessions:', error);
      setSessionError(error instanceof Error ? error.message : 'Failed to load sessions');
      // Ensure sessions is still an array even on error
      setSessions([]);
    } finally {
      setLoadingSessions(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-10">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
          <DialogPanel
            transition
            className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-2xl data-closed:sm:translate-y-0 data-closed:sm:scale-95"
          >
            <div className="bg-white">
              {/* Header */}
              <div className="border-b border-gray-200 px-6 py-4">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-lg font-semibold text-gray-900">
                    User Details
                  </DialogTitle>
                  <div className="flex items-center space-x-2">
                    {onEdit && (
                      <button
                        type="button"
                        onClick={() => onEdit(user)}
                        className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500"
                      >
                        Edit User
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={onClose}
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-6 space-y-6">
                {/* User Profile */}
                <div className="flex items-start space-x-4">
                  <div className="h-16 w-16 rounded-full bg-gray-300 flex items-center justify-center">
                    <UserIcon className="h-8 w-8 text-gray-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl font-semibold text-gray-900">{user.username}</h3>
                    <p className="text-sm text-gray-500">{user.email}</p>
                    <div className="mt-2 flex items-center space-x-3">
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getRoleBadgeClass(user.role)}`}>
                        {user.role === 'super_admin' ? (
                          <ShieldExclamationIcon className="h-3 w-3 mr-1" />
                        ) : (
                          <ShieldCheckIcon className="h-3 w-3 mr-1" />
                        )}
                        {user.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                      </span>
                      <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusBadgeClass(user.is_active, user.is_verified)}`}>
                        {user.is_active && user.is_verified ? (
                          <CheckCircleIcon className="h-3 w-3 mr-1" />
                        ) : (
                          <XCircleIcon className="h-3 w-3 mr-1" />
                        )}
                        {getStatusText(user.is_active, user.is_verified)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Account Information */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-900">Account Information</h4>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-xs font-medium text-gray-500">User ID</dt>
                        <dd className="text-sm text-gray-900 font-mono">{user.id}</dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Created</dt>
                        <dd className="text-sm text-gray-900 flex items-center">
                          <CalendarIcon className="h-4 w-4 mr-1 text-gray-400" />
                          {formatDateTime(user.created_at)}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Last Login</dt>
                        <dd className="text-sm text-gray-900 flex items-center">
                          <ClockIcon className="h-4 w-4 mr-1 text-gray-400" />
                          {user.last_login ? formatDateTime(user.last_login) : 'Never'}
                        </dd>
                      </div>
                    </dl>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-sm font-medium text-gray-900">Account Status</h4>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Active Status</dt>
                        <dd className="text-sm">
                          {user.is_active ? (
                            <span className="text-green-600 flex items-center">
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              Active
                            </span>
                          ) : (
                            <span className="text-red-600 flex items-center">
                              <XCircleIcon className="h-4 w-4 mr-1" />
                              Inactive
                            </span>
                          )}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500">Email Verification</dt>
                        <dd className="text-sm">
                          {user.is_verified ? (
                            <span className="text-green-600 flex items-center">
                              <CheckCircleIcon className="h-4 w-4 mr-1" />
                              Verified
                            </span>
                          ) : (
                            <span className="text-yellow-600 flex items-center">
                              <XCircleIcon className="h-4 w-4 mr-1" />
                              Unverified
                            </span>
                          )}
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>

                {/* User Sessions */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-medium text-gray-900">Recent Sessions</h4>
                    <button
                      onClick={fetchUserSessions}
                      disabled={loadingSessions}
                      className="text-xs text-indigo-600 hover:text-indigo-500 disabled:opacity-50"
                    >
                      {loadingSessions ? 'Loading...' : 'Refresh'}
                    </button>
                  </div>

                  {sessionError ? (
                    <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md">
                      <div className="font-medium">Unable to load sessions</div>
                      <div className="text-xs mt-1">
                        {sessionError.includes('404') || sessionError.includes('not found') ? 
                          'Sessions feature may not be available for this user.' : 
                          sessionError
                        }
                      </div>
                    </div>
                  ) : loadingSessions ? (
                    <div className="animate-pulse space-y-3">
                      {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                          <div className="h-8 w-8 bg-gray-200 rounded"></div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : !Array.isArray(sessions) || sessions.length === 0 ? (
                    <div className="text-sm text-gray-500 text-center py-4">
                      No active sessions found
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {sessions.map((session) => {
                        // Safety check for malformed session objects
                        if (!session || typeof session !== 'object') {
                          console.warn('Skipping malformed session object:', session);
                          return null;
                        }

                        const sessionId = session.id || 'unknown';
                        const DeviceIcon = getDeviceIcon(session.user_agent);
                        
                        return (
                          <div key={sessionId} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-md">
                            <DeviceIcon className="h-5 w-5 text-gray-400" />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <p className="text-sm font-medium text-gray-900">
                                  Session {sessionId.toString().slice(0, 8)}
                                </p>
                                <span className="text-xs text-gray-500">
                                  {session.last_activity ? formatDateTime(session.last_activity) : 'Unknown time'}
                                </span>
                              </div>
                              <div className="flex items-center space-x-4 text-xs text-gray-500 mt-1">
                                {session.ip_address && (
                                  <span className="flex items-center">
                                    <MapPinIcon className="h-3 w-3 mr-1" />
                                    {session.ip_address}
                                  </span>
                                )}
                                {session.expires_at && (
                                  <span>Expires: {formatDateTime(session.expires_at)}</span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      }).filter(Boolean)}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}