'use client';

import { useState } from 'react';
import { Switch, Dialog } from '@headlessui/react';
import { 
  PhotoIcon,
  PencilIcon,
  TrashIcon,
  UserIcon,
  CameraIcon
} from '@heroicons/react/24/outline';
import { SettingsSectionProps } from '@/types/settings';
import { SettingsSection, SettingsFormRow } from './SettingsLayout';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function ProfileSettings({ 
  user, 
  preferences, 
  onUpdate, 
  isLoading = false 
}: SettingsSectionProps) {
  const [formData, setFormData] = useState({
    username: user.username,
    email: user.email,
    fullName: '',
    bio: '',
    profileVisibility: preferences.profileVisibility,
    showLastActivity: preferences.showLastActivity
  });
  
  const [showAvatarModal, setShowAvatarModal] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const reader = new FileReader();
      reader.onload = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      setShowAvatarModal(true);
    }
  };

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await onUpdate({
        username: formData.username,
        email: formData.email,
        fullName: formData.fullName,
        bio: formData.bio,
        avatar: avatarFile,
        preferences: {
          profileVisibility: formData.profileVisibility,
          showLastActivity: formData.showLastActivity
        }
      });
    } catch (error) {
      console.error('Failed to save profile:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAvatar = async () => {
    if (avatarFile) {
      setSaving(true);
      try {
        await onUpdate({ avatar: avatarFile });
        setShowAvatarModal(false);
        setAvatarFile(null);
        setAvatarPreview(null);
      } catch (error) {
        console.error('Failed to save avatar:', error);
      } finally {
        setSaving(false);
      }
    }
  };

  return (
    <div className="space-y-8">
      {/* Avatar Section */}
      <SettingsSection
        title="Profile Photo"
        description="Upload a photo to personalize your account"
      >
        <div className="flex items-center space-x-6">
          <div className="relative">
            {/* Current Avatar Display */}
            <div className="size-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
              <UserIcon className="size-12 text-gray-400" />
            </div>
            
            {/* Avatar Upload Overlay */}
            <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 hover:opacity-100 transition-opacity duration-200 cursor-pointer">
              <CameraIcon className="size-6 text-white" />
              <input
                type="file"
                className="sr-only"
                accept="image/*"
                onChange={handleAvatarUpload}
                disabled={isLoading}
              />
            </label>
          </div>

          <div className="flex-1">
            <div className="flex space-x-3">
              <label className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer">
                <PhotoIcon className="size-4 mr-2" />
                Upload Photo
                <input
                  type="file"
                  className="sr-only"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  disabled={isLoading}
                />
              </label>
              <button
                type="button"
                className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                disabled={isLoading}
              >
                <TrashIcon className="size-4 mr-2" />
                Remove
              </button>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              JPG, PNG, or GIF up to 5MB. Recommended size: 400x400px
            </p>
          </div>
        </div>
      </SettingsSection>

      {/* Personal Information */}
      <SettingsSection
        title="Personal Information"
        description="Update your basic profile information"
      >
        <div className="space-y-6">
          <SettingsFormRow
            label="Username"
            description="Your unique username for the platform"
          >
            <input
              type="text"
              value={formData.username}
              onChange={(e) => handleInputChange('username', e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              disabled={isLoading}
            />
          </SettingsFormRow>

          <SettingsFormRow
            label="Email Address"
            description="Your email address for notifications and account recovery"
          >
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              disabled={isLoading}
            />
          </SettingsFormRow>

          <SettingsFormRow
            label="Full Name"
            description="Your full name as displayed in your profile"
          >
            <input
              type="text"
              value={formData.fullName}
              onChange={(e) => handleInputChange('fullName', e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Enter your full name"
              disabled={isLoading}
            />
          </SettingsFormRow>

          <SettingsFormRow
            label="Bio"
            description="A brief description about yourself"
          >
            <textarea
              rows={3}
              value={formData.bio}
              onChange={(e) => handleInputChange('bio', e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Tell us about yourself..."
              disabled={isLoading}
            />
            <p className="mt-1 text-sm text-gray-500">
              {formData.bio.length}/500 characters
            </p>
          </SettingsFormRow>
        </div>
      </SettingsSection>

      {/* Privacy Settings */}
      <SettingsSection
        title="Privacy Settings"
        description="Control who can see your profile information"
      >
        <div className="space-y-6">
          <SettingsFormRow
            label="Profile Visibility"
            description="Choose who can view your profile"
          >
            <select
              value={formData.profileVisibility}
              onChange={(e) => handleInputChange('profileVisibility', e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              disabled={isLoading}
            >
              <option value="public">Public - Anyone can see your profile</option>
              <option value="team">Team - Only team members can see your profile</option>
              <option value="private">Private - Only you can see your profile</option>
            </select>
          </SettingsFormRow>

          <SettingsFormRow
            label="Show Last Activity"
            description="Display when you were last active"
          >
            <Switch
              checked={formData.showLastActivity}
              onChange={(checked) => handleInputChange('showLastActivity', checked)}
              className={classNames(
                formData.showLastActivity ? 'bg-indigo-600' : 'bg-gray-200',
                'relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2',
                isLoading && 'opacity-50 cursor-not-allowed'
              )}
              disabled={isLoading}
            >
              <span
                aria-hidden="true"
                className={classNames(
                  formData.showLastActivity ? 'translate-x-5' : 'translate-x-0',
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
          onClick={handleSaveProfile}
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
              <PencilIcon className="size-4 mr-2" />
              Save Changes
            </>
          )}
        </button>
      </div>

      {/* Avatar Upload Modal */}
      <Dialog open={showAvatarModal} onClose={setShowAvatarModal} className="relative z-50">
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" />
        <div className="fixed inset-0 z-10 overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <Dialog.Panel className="relative transform overflow-hidden rounded-lg bg-white px-4 pb-4 pt-5 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
              <div>
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                  <PhotoIcon className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="mt-3 text-center sm:mt-5">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Upload Profile Photo
                  </Dialog.Title>
                  <div className="mt-4">
                    {avatarPreview && (
                      <div className="mx-auto w-32 h-32 rounded-full overflow-hidden mb-4">
                        <img 
                          src={avatarPreview} 
                          alt="Avatar preview" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <p className="text-sm text-gray-500">
                      This will be your new profile photo. Make sure it represents you well!
                    </p>
                  </div>
                </div>
              </div>
              <div className="mt-5 sm:mt-6 sm:grid sm:grid-flow-row-dense sm:grid-cols-2 sm:gap-3">
                <button
                  type="button"
                  onClick={handleSaveAvatar}
                  disabled={saving}
                  className="inline-flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 sm:col-start-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {saving ? 'Uploading...' : 'Save Photo'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAvatarModal(false)}
                  disabled={saving}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-medium text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 sm:col-start-1 sm:mt-0 disabled:opacity-50 disabled:cursor-not-allowed"
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