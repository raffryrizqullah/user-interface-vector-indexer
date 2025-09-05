'use client';

import { useState } from 'react';
import { Switch, RadioGroup } from '@headlessui/react';
import { 
  SunIcon,
  MoonIcon,
  ComputerDesktopIcon,
  BellIcon,
  EnvelopeIcon,
  GlobeAltIcon,
  ClockIcon,
  CalendarDaysIcon,
  CogIcon
} from '@heroicons/react/24/outline';
import { CheckIcon } from '@heroicons/react/20/solid';
import { SettingsSectionProps, ThemeMode } from '@/types/settings';
import { SettingsSection, SettingsFormRow } from './SettingsLayout';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

// Theme options configuration
const themeOptions = [
  {
    id: 'light' as ThemeMode,
    name: 'Light',
    description: 'Always use light theme',
    icon: SunIcon,
    color: 'text-yellow-500'
  },
  {
    id: 'dark' as ThemeMode,
    name: 'Dark',
    description: 'Always use dark theme',
    icon: MoonIcon,
    color: 'text-indigo-500'
  },
  {
    id: 'system' as ThemeMode,
    name: 'System',
    description: 'Use system setting',
    icon: ComputerDesktopIcon,
    color: 'text-gray-500'
  }
];

const layoutOptions = [
  { id: 'compact', name: 'Compact', description: 'Dense layout with more information' },
  { id: 'comfortable', name: 'Comfortable', description: 'Balanced spacing and content' },
  { id: 'spacious', name: 'Spacious', description: 'Relaxed layout with more whitespace' }
];

const languageOptions = [
  { id: 'en', name: 'English', flag: '🇺🇸' },
  { id: 'id', name: 'Bahasa Indonesia', flag: '🇮🇩' }
];

const timezoneOptions = [
  { id: 'UTC', name: 'UTC - Coordinated Universal Time' },
  { id: 'America/New_York', name: 'EST - Eastern Time' },
  { id: 'America/Los_Angeles', name: 'PST - Pacific Time' },
  { id: 'Europe/London', name: 'GMT - Greenwich Mean Time' },
  { id: 'Asia/Jakarta', name: 'WIB - Western Indonesia Time' },
  { id: 'Asia/Tokyo', name: 'JST - Japan Standard Time' }
];

export default function PreferencesSettings({ 
  user, 
  preferences, 
  onUpdate,
  onPreferencesUpdate,
  isLoading = false 
}: SettingsSectionProps) {
  const [settings, setSettings] = useState({
    // Appearance
    theme: preferences.theme,
    language: preferences.language,
    dashboardLayout: preferences.dashboardLayout,
    
    // Regional
    timezone: preferences.timezone,
    dateFormat: preferences.dateFormat,
    timeFormat: preferences.timeFormat,
    
    // Dashboard
    showRecentActivity: preferences.showRecentActivity,
    showQuickActions: preferences.showQuickActions,
    defaultView: preferences.defaultView,
    
    // Notifications
    emailNotifications: preferences.emailNotifications,
    activityNotifications: preferences.activityNotifications,
    systemAlerts: preferences.systemAlerts,
    securityAlerts: preferences.securityAlerts
  });

  const [saving, setSaving] = useState(false);

  const handleSettingChange = (field: string, value: string | boolean) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const handleSavePreferences = async () => {
    setSaving(true);
    try {
      await onPreferencesUpdate(settings);
    } catch (error) {
      console.error('Failed to save preferences:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Appearance Settings */}
      <SettingsSection
        title="Appearance"
        description="Customize how the interface looks and feels"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-4">
              Theme
            </label>
            <RadioGroup value={settings.theme} onChange={(value) => handleSettingChange('theme', value)}>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {themeOptions.map((option) => (
                  <RadioGroup.Option
                    key={option.id}
                    value={option.id}
                    disabled={isLoading}
                    className={({ active, checked }) =>
                      classNames(
                        'cursor-pointer focus:outline-none',
                        active ? 'ring-2 ring-indigo-600 ring-offset-2' : '',
                        checked
                          ? 'bg-indigo-50 border-indigo-200 ring-2 ring-indigo-600'
                          : 'bg-white border-gray-300 hover:bg-gray-50',
                        'relative flex rounded-lg border p-4 transition-all duration-200',
                        isLoading && 'opacity-50 cursor-not-allowed'
                      )
                    }
                  >
                    {({ checked }) => (
                      <>
                        <span className="flex flex-1">
                          <span className="flex flex-col">
                            <span className="flex items-center mb-2">
                              <option.icon className={classNames('size-5 mr-2', option.color)} />
                              <RadioGroup.Label as="span" className="block text-sm font-medium text-gray-900">
                                {option.name}
                              </RadioGroup.Label>
                            </span>
                            <RadioGroup.Description as="span" className="text-sm text-gray-500">
                              {option.description}
                            </RadioGroup.Description>
                          </span>
                        </span>
                        {checked ? (
                          <CheckIcon className="size-5 text-indigo-600" />
                        ) : null}
                      </>
                    )}
                  </RadioGroup.Option>
                ))}
              </div>
            </RadioGroup>
          </div>

          <SettingsFormRow
            label="Dashboard Layout"
            description="Choose how dense or spacious the dashboard appears"
          >
            <select
              value={settings.dashboardLayout}
              onChange={(e) => handleSettingChange('dashboardLayout', e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              disabled={isLoading}
            >
              {layoutOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name} - {option.description}
                </option>
              ))}
            </select>
          </SettingsFormRow>
        </div>
      </SettingsSection>

      {/* Regional Settings */}
      <SettingsSection
        title="Regional Settings"
        description="Configure language, timezone, and format preferences"
      >
        <div className="space-y-6">
          <SettingsFormRow
            label="Language"
            description="Choose your preferred language"
          >
            <select
              value={settings.language}
              onChange={(e) => handleSettingChange('language', e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              disabled={isLoading}
            >
              {languageOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.flag} {option.name}
                </option>
              ))}
            </select>
          </SettingsFormRow>

          <SettingsFormRow
            label="Timezone"
            description="Set your local timezone for accurate time display"
          >
            <select
              value={settings.timezone}
              onChange={(e) => handleSettingChange('timezone', e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              disabled={isLoading}
            >
              {timezoneOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.name}
                </option>
              ))}
            </select>
          </SettingsFormRow>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <SettingsFormRow
              label="Date Format"
              description="How dates are displayed"
              className="sm:grid-cols-1"
            >
              <select
                value={settings.dateFormat}
                onChange={(e) => handleSettingChange('dateFormat', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                disabled={isLoading}
              >
                <option value="MM/DD/YYYY">MM/DD/YYYY (US)</option>
                <option value="DD/MM/YYYY">DD/MM/YYYY (International)</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD (ISO)</option>
              </select>
            </SettingsFormRow>

            <SettingsFormRow
              label="Time Format"
              description="12-hour or 24-hour clock"
              className="sm:grid-cols-1"
            >
              <select
                value={settings.timeFormat}
                onChange={(e) => handleSettingChange('timeFormat', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                disabled={isLoading}
              >
                <option value="12h">12-hour (AM/PM)</option>
                <option value="24h">24-hour</option>
              </select>
            </SettingsFormRow>
          </div>
        </div>
      </SettingsSection>

      {/* Dashboard Preferences */}
      <SettingsSection
        title="Dashboard Preferences"
        description="Customize your dashboard experience"
      >
        <div className="space-y-6">
          <SettingsFormRow
            label="Default View"
            description="The page that opens when you access the dashboard"
          >
            <select
              value={settings.defaultView}
              onChange={(e) => handleSettingChange('defaultView', e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              disabled={isLoading}
            >
              <option value="dashboard">Dashboard Overview</option>
              <option value="upsert-records">Upload Documents</option>
              <option value="vector-search">Vector Search</option>
              <option value="health-check">Health Check</option>
            </select>
          </SettingsFormRow>

          <SettingsFormRow
            label="Show Recent Activity"
            description="Display recent activity widget on the dashboard"
          >
            <Switch
              checked={settings.showRecentActivity}
              onChange={(checked) => handleSettingChange('showRecentActivity', checked)}
              className={classNames(
                settings.showRecentActivity ? 'bg-indigo-600' : 'bg-gray-200',
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2',
                isLoading && 'opacity-50 cursor-not-allowed'
              )}
              disabled={isLoading}
            >
              <span
                aria-hidden="true"
                className={classNames(
                  settings.showRecentActivity ? 'translate-x-5' : 'translate-x-0',
                  'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out'
                )}
              />
            </Switch>
          </SettingsFormRow>

          <SettingsFormRow
            label="Show Quick Actions"
            description="Display quick action cards on the dashboard"
          >
            <Switch
              checked={settings.showQuickActions}
              onChange={(checked) => handleSettingChange('showQuickActions', checked)}
              className={classNames(
                settings.showQuickActions ? 'bg-indigo-600' : 'bg-gray-200',
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2',
                isLoading && 'opacity-50 cursor-not-allowed'
              )}
              disabled={isLoading}
            >
              <span
                aria-hidden="true"
                className={classNames(
                  settings.showQuickActions ? 'translate-x-5' : 'translate-x-0',
                  'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out'
                )}
              />
            </Switch>
          </SettingsFormRow>
        </div>
      </SettingsSection>

      {/* Notification Settings */}
      <SettingsSection
        title="Notifications"
        description="Choose what notifications you want to receive"
      >
        <div className="space-y-6">
          <SettingsFormRow
            label="Email Notifications"
            description="Receive notifications via email"
          >
            <div className="flex items-center space-x-3">
              <Switch
                checked={settings.emailNotifications}
                onChange={(checked) => handleSettingChange('emailNotifications', checked)}
                className={classNames(
                  settings.emailNotifications ? 'bg-indigo-600' : 'bg-gray-200',
                  'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2',
                  isLoading && 'opacity-50 cursor-not-allowed'
                )}
                disabled={isLoading}
              >
                <span
                  aria-hidden="true"
                  className={classNames(
                    settings.emailNotifications ? 'translate-x-5' : 'translate-x-0',
                    'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out'
                  )}
                />
              </Switch>
              <EnvelopeIcon className="size-5 text-gray-400" />
            </div>
          </SettingsFormRow>

          <SettingsFormRow
            label="Activity Notifications"
            description="Get notified about your account activity"
          >
            <div className="flex items-center space-x-3">
              <Switch
                checked={settings.activityNotifications}
                onChange={(checked) => handleSettingChange('activityNotifications', checked)}
                className={classNames(
                  settings.activityNotifications ? 'bg-indigo-600' : 'bg-gray-200',
                  'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2',
                  isLoading && 'opacity-50 cursor-not-allowed'
                )}
                disabled={isLoading}
              >
                <span
                  aria-hidden="true"
                  className={classNames(
                    settings.activityNotifications ? 'translate-x-5' : 'translate-x-0',
                    'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out'
                  )}
                />
              </Switch>
              <BellIcon className="size-5 text-gray-400" />
            </div>
          </SettingsFormRow>

          <SettingsFormRow
            label="System Alerts"
            description="Important system updates and maintenance notices"
          >
            <Switch
              checked={settings.systemAlerts}
              onChange={(checked) => handleSettingChange('systemAlerts', checked)}
              className={classNames(
                settings.systemAlerts ? 'bg-indigo-600' : 'bg-gray-200',
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2',
                isLoading && 'opacity-50 cursor-not-allowed'
              )}
              disabled={isLoading}
            >
              <span
                aria-hidden="true"
                className={classNames(
                  settings.systemAlerts ? 'translate-x-5' : 'translate-x-0',
                  'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out'
                )}
              />
            </Switch>
          </SettingsFormRow>

          <SettingsFormRow
            label="Security Alerts"
            description="Critical security notifications and login alerts"
          >
            <Switch
              checked={settings.securityAlerts}
              onChange={(checked) => handleSettingChange('securityAlerts', checked)}
              className={classNames(
                settings.securityAlerts ? 'bg-indigo-600' : 'bg-gray-200',
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2',
                isLoading && 'opacity-50 cursor-not-allowed'
              )}
              disabled={isLoading}
            >
              <span
                aria-hidden="true"
                className={classNames(
                  settings.securityAlerts ? 'translate-x-5' : 'translate-x-0',
                  'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out'
                )}
              />
            </Switch>
          </SettingsFormRow>
        </div>
      </SettingsSection>

      {/* Save Button */}
      <div className="flex justify-end pt-6 border-t border-gray-200">
        <button
          onClick={handleSavePreferences}
          disabled={saving || isLoading}
          className={classNames(
            'inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md text-white shadow-sm transition-colors duration-200',
            saving || isLoading 
              ? 'bg-gray-400 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
          )}
        >
          {saving ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Saving...
            </>
          ) : (
            <>
              <CogIcon className="size-4 mr-2" />
              Save Preferences
            </>
          )}
        </button>
      </div>
    </div>
  );
}