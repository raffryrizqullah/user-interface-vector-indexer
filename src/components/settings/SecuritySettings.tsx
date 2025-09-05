'use client';

import { useState } from 'react';
import { Switch, Dialog } from '@headlessui/react';
import { 
  KeyIcon,
  EyeIcon,
  EyeSlashIcon,
  DevicePhoneMobileIcon,
  ComputerDesktopIcon,
  ShieldCheckIcon,
  ExclamationTriangleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';
import { SettingsSectionProps, UserSession } from '@/types/settings';
import { SettingsSection, SettingsFormRow } from './SettingsLayout';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

// Mock active sessions data
const mockSessions: UserSession[] = [
  {
    id: '1',
    device: 'MacBook Pro',
    browser: 'Chrome',
    os: 'macOS',
    ip_address: '192.168.1.100',
    location: 'San Francisco, CA',
    last_activity: new Date().toISOString(),
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
    is_current: true
  },
  {
    id: '2',
    device: 'iPhone 15',
    browser: 'Safari',
    os: 'iOS',
    ip_address: '192.168.1.101',
    location: 'San Francisco, CA',
    last_activity: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    is_current: false
  }
];

export default function SecuritySettings({ 
  user, 
  preferences, 
  onUpdate, 
  isLoading = false 
}: SettingsSectionProps) {
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [securitySettings, setSecuritySettings] = useState({
    loginNotifications: preferences.securityAlerts,
    twoFactorEnabled: false,
    sessionTimeout: 30
  });

  const [activeSessions] = useState(mockSessions);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [sessionToLogout, setSessionToLogout] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handlePasswordChange = (field: keyof typeof passwordData, value: string) => {
    setPasswordData(prev => ({ ...prev, [field]: value }));
  };

  const togglePasswordVisibility = (field: keyof typeof showPasswords) => {
    setShowPasswords(prev => ({ ...prev, [field]: !prev[field] }));
  };

  const handleSecuritySettingChange = (field: keyof typeof securitySettings, value: boolean | number) => {
    setSecuritySettings(prev => ({ ...prev, [field]: value }));
  };

  const getPasswordStrength = (password: string): { strength: number; label: string; color: string } => {
    if (!password) return { strength: 0, label: 'No password', color: 'bg-gray-200' };
    
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[a-z]/.test(password)) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    
    if (strength <= 25) return { strength, label: 'Weak', color: 'bg-red-400' };
    if (strength <= 50) return { strength, label: 'Fair', color: 'bg-yellow-400' };
    if (strength <= 75) return { strength, label: 'Good', color: 'bg-blue-400' };
    return { strength, label: 'Strong', color: 'bg-green-400' };
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    setSaving(true);
    try {
      // Will be implemented with real API
      console.log('Changing password...');
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (error) {
      console.error('Failed to change password:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleLogoutSession = async (sessionId: string) => {
    setSaving(true);
    try {
      // Will be implemented with real API
      console.log('Logging out session:', sessionId);
      setShowLogoutModal(false);
      setSessionToLogout(null);
    } catch (error) {
      console.error('Failed to logout session:', error);
    } finally {
      setSaving(false);
    }
  };

  const formatLastActivity = (timestamp: string): string => {
    const now = new Date();
    const activityTime = new Date(timestamp);
    const diffMs = now.getTime() - activityTime.getTime();
    
    if (diffMs < 60 * 1000) return 'Just now';
    if (diffMs < 60 * 60 * 1000) return `${Math.floor(diffMs / (60 * 1000))} minutes ago`;
    if (diffMs < 24 * 60 * 60 * 1000) return `${Math.floor(diffMs / (60 * 60 * 1000))} hours ago`;
    return `${Math.floor(diffMs / (24 * 60 * 60 * 1000))} days ago`;
  };

  const passwordStrength = getPasswordStrength(passwordData.newPassword);

  return (
    <div className="space-y-8">
      {/* Password Change Section */}
      <SettingsSection
        title="Change Password"
        description="Update your password to keep your account secure"
      >
        <div className="space-y-6">
          <SettingsFormRow
            label="Current Password"
            description="Enter your current password"
          >
            <div className="relative">
              <input
                type={showPasswords.current ? 'text' : 'password'}
                value={passwordData.currentPassword}
                onChange={(e) => handlePasswordChange('currentPassword', e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm pr-10"
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('current')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPasswords.current ? (
                  <EyeSlashIcon className="size-4 text-gray-400" />
                ) : (
                  <EyeIcon className="size-4 text-gray-400" />
                )}
              </button>
            </div>
          </SettingsFormRow>

          <SettingsFormRow
            label="New Password"
            description="Choose a strong password with at least 8 characters"
          >
            <div className="space-y-2">
              <div className="relative">
                <input
                  type={showPasswords.new ? 'text' : 'password'}
                  value={passwordData.newPassword}
                  onChange={(e) => handlePasswordChange('newPassword', e.target.value)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm pr-10"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => togglePasswordVisibility('new')}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center"
                >
                  {showPasswords.new ? (
                    <EyeSlashIcon className="size-4 text-gray-400" />
                  ) : (
                    <EyeIcon className="size-4 text-gray-400" />
                  )}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {passwordData.newPassword && (
                <div className="space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Password strength</span>
                    <span className={classNames(
                      'font-medium',
                      passwordStrength.strength <= 25 ? 'text-red-600' :
                      passwordStrength.strength <= 50 ? 'text-yellow-600' :
                      passwordStrength.strength <= 75 ? 'text-blue-600' :
                      'text-green-600'
                    )}>
                      {passwordStrength.label}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className={classNames('h-2 rounded-full transition-all duration-300', passwordStrength.color)}
                      style={{ width: `${passwordStrength.strength}%` }}
                    />
                  </div>
                </div>
              )}
            </div>
          </SettingsFormRow>

          <SettingsFormRow
            label="Confirm New Password"
            description="Re-enter your new password"
          >
            <div className="relative">
              <input
                type={showPasswords.confirm ? 'text' : 'password'}
                value={passwordData.confirmPassword}
                onChange={(e) => handlePasswordChange('confirmPassword', e.target.value)}
                className={classNames(
                  'block w-full rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm pr-10',
                  passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword
                    ? 'border-red-300 text-red-900 placeholder-red-300'
                    : 'border-gray-300'
                )}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => togglePasswordVisibility('confirm')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPasswords.confirm ? (
                  <EyeSlashIcon className="size-4 text-gray-400" />
                ) : (
                  <EyeIcon className="size-4 text-gray-400" />
                )}
              </button>
            </div>
            {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
              <p className="mt-1 text-sm text-red-600">Passwords do not match</p>
            )}
          </SettingsFormRow>

          <div className="flex justify-end">
            <button
              onClick={handleChangePassword}
              disabled={saving || isLoading || !passwordData.currentPassword || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword}
              className={classNames(
                'inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm transition-colors duration-200',
                saving || isLoading || !passwordData.currentPassword || !passwordData.newPassword || passwordData.newPassword !== passwordData.confirmPassword
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-indigo-600 text-white hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500'
              )}
            >
              <KeyIcon className="size-4 mr-2" />
              {saving ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </div>
      </SettingsSection>

      {/* Security Preferences */}
      <SettingsSection
        title="Security Preferences"
        description="Configure additional security settings"
      >
        <div className="space-y-6">
          <SettingsFormRow
            label="Login Notifications"
            description="Get notified when someone signs into your account"
          >
            <Switch
              checked={securitySettings.loginNotifications}
              onChange={(checked) => handleSecuritySettingChange('loginNotifications', checked)}
              className={classNames(
                securitySettings.loginNotifications ? 'bg-indigo-600' : 'bg-gray-200',
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2',
                isLoading && 'opacity-50 cursor-not-allowed'
              )}
              disabled={isLoading}
            >
              <span
                aria-hidden="true"
                className={classNames(
                  securitySettings.loginNotifications ? 'translate-x-5' : 'translate-x-0',
                  'pointer-events-none inline-block h-5 w-5 rounded-full bg-white shadow transform ring-0 transition duration-200 ease-in-out'
                )}
              />
            </Switch>
          </SettingsFormRow>

          <SettingsFormRow
            label="Two-Factor Authentication"
            description="Add an extra layer of security to your account"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <ShieldCheckIcon className="size-5 text-gray-400 mr-2" />
                <span className="text-sm text-gray-700">
                  {securitySettings.twoFactorEnabled ? 'Enabled' : 'Not enabled'}
                </span>
              </div>
              <button
                type="button"
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={isLoading}
              >
                {securitySettings.twoFactorEnabled ? 'Disable' : 'Enable'}
              </button>
            </div>
          </SettingsFormRow>

          <SettingsFormRow
            label="Session Timeout"
            description="Automatically sign out after this many minutes of inactivity"
          >
            <select
              value={securitySettings.sessionTimeout}
              onChange={(e) => handleSecuritySettingChange('sessionTimeout', Number(e.target.value))}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              disabled={isLoading}
            >
              <option value={15}>15 minutes</option>
              <option value={30}>30 minutes</option>
              <option value={60}>1 hour</option>
              <option value={120}>2 hours</option>
              <option value={480}>8 hours</option>
              <option value={0}>Never</option>
            </select>
          </SettingsFormRow>
        </div>
      </SettingsSection>

      {/* Active Sessions */}
      <SettingsSection
        title="Active Sessions"
        description="Monitor and manage devices that are signed into your account"
      >
        <div className="space-y-4">
          {activeSessions.map((session) => (
            <div
              key={session.id}
              className={classNames(
                'rounded-lg border p-4',
                session.is_current 
                  ? 'border-green-200 bg-green-50' 
                  : 'border-gray-200 bg-white'
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    {session.device.includes('iPhone') || session.device.includes('iPad') ? (
                      <DevicePhoneMobileIcon className="size-6 text-gray-400" />
                    ) : (
                      <ComputerDesktopIcon className="size-6 text-gray-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2">
                      <p className="text-sm font-medium text-gray-900">
                        {session.device} • {session.browser}
                      </p>
                      {session.is_current && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                          Current session
                        </span>
                      )}
                    </div>
                    <div className="mt-1 flex items-center space-x-4 text-sm text-gray-500">
                      <span>{session.ip_address}</span>
                      {session.location && <span>{session.location}</span>}
                      <span className="flex items-center">
                        <ClockIcon className="size-4 mr-1" />
                        {formatLastActivity(session.last_activity)}
                      </span>
                    </div>
                  </div>
                </div>
                {!session.is_current && (
                  <button
                    onClick={() => {
                      setSessionToLogout(session.id);
                      setShowLogoutModal(true);
                    }}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    disabled={isLoading}
                  >
                    Sign Out
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </SettingsSection>

      {/* Logout Session Confirmation Modal */}
      <Dialog open={showLogoutModal} onClose={setShowLogoutModal} className="relative z-50">
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
                    Sign Out Device
                  </Dialog.Title>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      This will sign out the selected device from your account. The user will need to sign in again to access their account.
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  onClick={() => sessionToLogout && handleLogoutSession(sessionToLogout)}
                  disabled={saving}
                  className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-red-500 focus:outline-none focus:ring-2 focus:ring-red-600 focus:ring-offset-2 sm:ml-3 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Signing Out...' : 'Sign Out'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowLogoutModal(false)}
                  disabled={saving}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 sm:mt-0 sm:w-auto disabled:opacity-50 disabled:cursor-not-allowed"
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