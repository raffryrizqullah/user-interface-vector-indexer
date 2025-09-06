'use client';

import { useState } from 'react';
import { Tab } from '@headlessui/react';
import { 
  UserIcon,
  LockClosedIcon,
  Cog6ToothIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { SettingsCategory, SettingsSectionProps, UserPreferences, ProfileUpdateData } from '@/types/settings';
import ProfileSettings from './ProfileSettings';
import SecuritySettings from './SecuritySettings';
import PreferencesSettings from './PreferencesSettings';
import ActivitySettings from './ActivitySettings';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

// Settings categories configuration
const settingsCategories: SettingsCategory[] = [
  {
    id: 'profile',
    name: 'Profile',
    description: 'Manage your avatar, personal information, and public profile settings',
    icon: UserIcon,
    component: ProfileSettings
  },
  {
    id: 'security',
    name: 'Security & Privacy',
    description: 'Password, sessions, and privacy controls',
    icon: LockClosedIcon,
    component: SecuritySettings
  },
  {
    id: 'preferences',
    name: 'Preferences',
    description: 'Theme, notifications, and application settings',
    icon: Cog6ToothIcon,
    component: PreferencesSettings
  },
  {
    id: 'activity',
    name: 'Activity & Data',
    description: 'Your activity history and data management',
    icon: ClockIcon,
    component: ActivitySettings
  }
];

interface SettingsLayoutProps {
  className?: string;
}

export default function SettingsLayout({ className }: SettingsLayoutProps) {
  const [selectedCategoryIndex, setSelectedCategoryIndex] = useState(0);

  // Mock user data - will be replaced with real data from context
  const mockUser = {
    id: '1',
    username: 'current_user',
    email: 'user@example.com',
    role: 'admin' as const,
    is_active: true,
    is_verified: true,
    created_at: new Date().toISOString(),
    last_login: new Date().toISOString(),
    last_activity: new Date().toISOString()
  };

  const mockPreferences = {
    theme: 'system' as const,
    language: 'en' as const,
    timezone: 'UTC',
    dateFormat: 'MM/DD/YYYY' as const,
    timeFormat: '24h' as const,
    dashboardLayout: 'comfortable' as const,
    showRecentActivity: true,
    showQuickActions: true,
    defaultView: 'dashboard' as const,
    emailNotifications: true,
    activityNotifications: true,
    systemAlerts: true,
    securityAlerts: true,
    profileVisibility: 'private' as const,
    showLastActivity: false,
    allowDataExport: true
  };

  const handleUpdate = async (data: Partial<ProfileUpdateData>) => {
    console.log('Update profile:', data);
    // Will be implemented with real API
  };

  const handlePreferencesUpdate = async (preferences: Partial<UserPreferences>) => {
    console.log('Update preferences:', preferences);
    // Will be implemented with real API
  };

  const sectionProps: SettingsSectionProps = {
    user: mockUser,
    preferences: mockPreferences,
    onUpdate: handleUpdate,
    onPreferencesUpdate: handlePreferencesUpdate,
    isLoading: false
  };

  return (
    <div className={classNames("bg-white shadow-sm rounded-lg border border-gray-200", className)}>
      <Tab.Group selectedIndex={selectedCategoryIndex} onChange={setSelectedCategoryIndex}>
        <div className="lg:grid lg:grid-cols-12 lg:gap-x-8">
          {/* Settings Navigation Sidebar - Desktop */}
          <div className="lg:col-span-3">
            <div className="px-6 py-6 border-b border-gray-200 lg:border-b-0 lg:border-r">
              <h2 className="text-lg font-medium text-gray-900 mb-1">Settings</h2>
              <p className="text-sm text-gray-500 mb-6">
                Manage your account settings and preferences
              </p>
              
              {/* Desktop Tab Navigation */}
              <Tab.List className="hidden lg:flex lg:flex-col lg:space-y-1">
                {settingsCategories.map((category, index) => (
                  <Tab
                    key={category.id}
                    className={({ selected }) =>
                      classNames(
                        'group flex items-start px-3 py-3 text-left text-sm font-medium rounded-lg transition-colors duration-200',
                        selected
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                          : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 border border-transparent'
                      )
                    }
                  >
                    {({ selected }) => (
                      <>
                        <category.icon
                          className={classNames(
                            'size-5 mr-3 mt-0.5 flex-shrink-0',
                            selected ? 'text-indigo-500' : 'text-gray-400 group-hover:text-gray-500'
                          )}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium">{category.name}</p>
                          <p className="text-xs text-gray-500 mt-1 leading-4">
                            {category.description}
                          </p>
                        </div>
                      </>
                    )}
                  </Tab>
                ))}
              </Tab.List>

              {/* Mobile Tab Navigation */}
              <Tab.List className="flex lg:hidden overflow-x-auto space-x-1 pb-2">
                {settingsCategories.map((category, index) => (
                  <Tab
                    key={category.id}
                    className={({ selected }) =>
                      classNames(
                        'flex-shrink-0 flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200',
                        selected
                          ? 'bg-indigo-100 text-indigo-700'
                          : 'text-gray-500 hover:text-gray-700'
                      )
                    }
                  >
                    {({ selected }) => (
                      <>
                        <category.icon
                          className={classNames(
                            'size-4 mr-2',
                            selected ? 'text-indigo-500' : 'text-gray-400'
                          )}
                        />
                        {category.name}
                      </>
                    )}
                  </Tab>
                ))}
              </Tab.List>
            </div>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-9">
            <Tab.Panels>
              {settingsCategories.map((category, index) => (
                <Tab.Panel key={category.id} className="focus:outline-none">
                  <div className="px-6 py-6">
                    {/* Section Header */}
                    <div className="mb-8">
                      <div className="flex items-center mb-2">
                        <category.icon className="size-6 text-indigo-600 mr-3" />
                        <h3 className="text-xl font-semibold text-gray-900">
                          {category.name}
                        </h3>
                      </div>
                      <p className="text-sm text-gray-600">
                        {category.description}
                      </p>
                    </div>

                    {/* Settings Section Content */}
                    <div className="max-w-4xl">
                      <category.component {...sectionProps} />
                    </div>
                  </div>
                </Tab.Panel>
              ))}
            </Tab.Panels>
          </div>
        </div>
      </Tab.Group>
    </div>
  );
}

// Helper component for settings section wrapper
export function SettingsSection({ 
  title, 
  description, 
  children, 
  className 
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={classNames("border-b border-gray-200 pb-8 mb-8 last:border-b-0 last:pb-0 last:mb-0", className)}>
      <div className="mb-6">
        <h4 className="text-lg font-medium text-gray-900 mb-2">{title}</h4>
        {description && (
          <p className="text-sm text-gray-600">{description}</p>
        )}
      </div>
      <div className="space-y-6">
        {children}
      </div>
    </div>
  );
}

// Helper component for form rows
export function SettingsFormRow({ 
  label, 
  description, 
  children, 
  className 
}: {
  label: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={classNames("grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6", className)}>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
        {description && (
          <p className="text-sm text-gray-500">{description}</p>
        )}
      </div>
      <div>
        {children}
      </div>
    </div>
  );
}

// Loading skeleton for settings
export function SettingsLoadingSkeleton() {
  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200 p-6">
      <div className="lg:grid lg:grid-cols-12 lg:gap-x-8">
        <div className="lg:col-span-3 border-r border-gray-200 pr-6">
          {/* Skeleton sidebar */}
          <div className="space-y-4">
            <div className="h-4 bg-gray-300 rounded w-24 animate-pulse"></div>
            <div className="h-3 bg-gray-300 rounded w-48 animate-pulse"></div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center space-x-3 p-3 rounded-lg">
                <div className="size-5 bg-gray-300 rounded animate-pulse"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-20 animate-pulse"></div>
                  <div className="h-3 bg-gray-300 rounded w-32 animate-pulse"></div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <div className="lg:col-span-9 pl-6">
          {/* Skeleton content */}
          <div className="space-y-8">
            <div className="space-y-3">
              <div className="h-6 bg-gray-300 rounded w-32 animate-pulse"></div>
              <div className="h-4 bg-gray-300 rounded w-64 animate-pulse"></div>
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-4">
                <div className="h-4 bg-gray-300 rounded w-24 animate-pulse"></div>
                <div className="h-10 bg-gray-300 rounded animate-pulse"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}