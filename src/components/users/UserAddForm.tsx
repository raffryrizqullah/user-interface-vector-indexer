'use client';

import { useState } from 'react';
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { Switch } from '@headlessui/react';
import {
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  UserPlusIcon,
  EyeIcon,
  EyeSlashIcon,
} from '@heroicons/react/24/outline';
import { ApiService, User, UserCreateData } from '@/lib/api';

interface UserAddFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newUser: User) => void;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function UserAddForm({ isOpen, onClose, onSuccess }: UserAddFormProps) {
  const [formData, setFormData] = useState<UserCreateData>({
    username: '',
    email: '',
    password: '',
    role: 'admin',
    is_active: true,
    is_verified: true,
  });
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form validation
  const validateForm = (): string | null => {
    if (!formData.username.trim()) {
      return 'Username is required';
    }
    if (formData.username.length < 3) {
      return 'Username must be at least 3 characters long';
    }
    if (!formData.email.trim()) {
      return 'Email is required';
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      return 'Please enter a valid email address';
    }
    if (!formData.password) {
      return 'Password is required';
    }
    if (formData.password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (formData.password !== confirmPassword) {
      return 'Passwords do not match';
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(formData.password)) {
      return 'Password must contain at least one lowercase letter, one uppercase letter, and one number';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const newUser = await ApiService.createUser(formData);
      setSuccess(true);
      onSuccess(newUser);
      
      // Reset form
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'admin',
        is_active: true,
        is_verified: true,
      });
      setConfirmPassword('');
      
      setTimeout(() => {
        onClose();
        setSuccess(false);
      }, 1500);
    } catch (error) {
      console.error('Create user error:', error);
      setError(error instanceof Error ? error.message : 'Failed to create user');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setError(null);
      setSuccess(false);
      setFormData({
        username: '',
        email: '',
        password: '',
        role: 'admin',
        is_active: true,
        is_verified: true,
      });
      setConfirmPassword('');
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-10">
      <DialogBackdrop
        transition
        className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
      />

      <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4 text-center sm:p-0">
          <DialogPanel
            transition
            className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg data-closed:sm:translate-y-0 data-closed:sm:scale-95"
          >
            <form onSubmit={handleSubmit}>
              <div className="bg-white">
                {/* Header */}
                <div className="border-b border-gray-200 px-6 py-4">
                  <div className="flex items-center justify-between">
                    <DialogTitle className="text-lg font-semibold text-gray-900 flex items-center">
                      <UserPlusIcon className="h-5 w-5 mr-2 text-indigo-600" />
                      Add New User
                    </DialogTitle>
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isLoading}
                      className="rounded-md bg-white text-gray-400 hover:text-gray-500 disabled:opacity-50"
                    >
                      <XMarkIcon className="h-6 w-6" />
                    </button>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 py-6 space-y-6">
                  {/* Success Message */}
                  {success && (
                    <div className="rounded-md bg-green-50 p-4">
                      <div className="flex">
                        <CheckCircleIcon className="h-5 w-5 text-green-400" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-green-800">
                            User created successfully!
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <div className="rounded-md bg-red-50 p-4">
                      <div className="flex">
                        <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-red-800">
                            {error}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Form Fields */}
                  <div className="space-y-4">
                    {/* Username */}
                    <div>
                      <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                        Username *
                      </label>
                      <input
                        type="text"
                        id="username"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        disabled={isLoading}
                        required
                        minLength={3}
                        placeholder="Enter username"
                      />
                    </div>

                    {/* Email */}
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email Address *
                      </label>
                      <input
                        type="email"
                        id="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        disabled={isLoading}
                        required
                        placeholder="user@example.com"
                      />
                    </div>

                    {/* Password */}
                    <div>
                      <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                        Password *
                      </label>
                      <div className="mt-1 relative">
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          disabled={isLoading}
                          required
                          minLength={8}
                          placeholder="Enter password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showPassword ? (
                            <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                          ) : (
                            <EyeIcon className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                      <p className="mt-1 text-xs text-gray-500">
                        At least 8 characters with uppercase, lowercase, and number
                      </p>
                    </div>

                    {/* Confirm Password */}
                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                        Confirm Password *
                      </label>
                      <div className="mt-1 relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          id="confirmPassword"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="block w-full rounded-md border border-gray-300 px-3 py-2 pr-10 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                          disabled={isLoading}
                          required
                          placeholder="Confirm password"
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          className="absolute inset-y-0 right-0 pr-3 flex items-center"
                        >
                          {showConfirmPassword ? (
                            <EyeSlashIcon className="h-4 w-4 text-gray-400" />
                          ) : (
                            <EyeIcon className="h-4 w-4 text-gray-400" />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Role */}
                    <div>
                      <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                        Role *
                      </label>
                      <select
                        id="role"
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value as 'admin' | 'super_admin' })}
                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        disabled={isLoading}
                      >
                        <option value="admin">Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                      <p className="mt-1 text-xs text-gray-500">
                        Admin users can manage content. Super Admins have full system access.
                      </p>
                    </div>

                    {/* Active Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700">
                          Active Status
                        </label>
                        <p className="text-xs text-gray-500">
                          {formData.is_active ? 'User can login and access the system' : 'User account will be disabled'}
                        </p>
                      </div>
                      <Switch
                        checked={formData.is_active || false}
                        onChange={(checked) => setFormData({ ...formData, is_active: checked })}
                        disabled={isLoading}
                        className={classNames(
                          formData.is_active ? 'bg-indigo-600' : 'bg-gray-200',
                          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                        )}
                      >
                        <span
                          className={classNames(
                            formData.is_active ? 'translate-x-5' : 'translate-x-0',
                            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out'
                          )}
                        />
                      </Switch>
                    </div>

                    {/* Verified Status */}
                    <div className="flex items-center justify-between">
                      <div className="flex flex-col">
                        <label className="text-sm font-medium text-gray-700">
                          Email Verification
                        </label>
                        <p className="text-xs text-gray-500">
                          {formData.is_verified ? 'Mark email as already verified' : 'User will need to verify email'}
                        </p>
                      </div>
                      <Switch
                        checked={formData.is_verified || false}
                        onChange={(checked) => setFormData({ ...formData, is_verified: checked })}
                        disabled={isLoading}
                        className={classNames(
                          formData.is_verified ? 'bg-green-600' : 'bg-gray-200',
                          'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-green-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50'
                        )}
                      >
                        <span
                          className={classNames(
                            formData.is_verified ? 'translate-x-5' : 'translate-x-0',
                            'pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out'
                          )}
                        />
                      </Switch>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="bg-gray-50 px-6 py-4 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={isLoading}
                    className="rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isLoading ? 'Creating...' : 'Create User'}
                  </button>
                </div>
              </div>
            </form>
          </DialogPanel>
        </div>
      </div>
    </Dialog>
  );
}