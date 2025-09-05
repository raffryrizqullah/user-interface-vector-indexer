'use client';

import { useState, useLayoutEffect, useRef } from 'react';
import { 
  ClockIcon, 
  UsersIcon,
  TrashIcon,
  ExclamationTriangleIcon,
  EyeIcon,
  PencilIcon,
  ShieldCheckIcon,
  ShieldExclamationIcon,
  CheckCircleIcon,
  XCircleIcon,
  UserIcon,
  UserPlusIcon
} from '@heroicons/react/24/outline';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { ApiService, User } from '@/lib/api';
import { User as AuthUser } from '@/lib/auth';

interface UserListDisplayProps {
  users: User[];
  loading: boolean;
  error: string | null;
  currentUser: AuthUser | null;
  onRefresh?: () => void;
  onUserSelect?: (user: User) => void;
  onUserEdit?: (user: User) => void;
  onUserAdd?: () => void;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
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
  if (isActive && isVerified) return 'Active';
  if (isActive && !isVerified) return 'Unverified';
  return 'Inactive';
}

function formatLastLogin(lastLogin: string | null) {
  if (!lastLogin) return 'Never';
  return new Date(lastLogin).toLocaleDateString();
}

export default function UserListDisplay({ 
  users, 
  loading, 
  error, 
  currentUser,
  onRefresh, 
  onUserSelect, 
  onUserEdit,
  onUserAdd 
}: UserListDisplayProps) {
  const checkbox = useRef<HTMLInputElement>(null);
  const [checked, setChecked] = useState(false);
  const [indeterminate, setIndeterminate] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useLayoutEffect(() => {
    const isIndeterminate = selectedUsers.length > 0 && selectedUsers.length < users.length;
    setChecked(selectedUsers.length === users.length && users.length > 0);
    setIndeterminate(isIndeterminate);
    if (checkbox.current) {
      checkbox.current.indeterminate = isIndeterminate;
    }
  }, [selectedUsers, users]);

  function toggleAll() {
    setSelectedUsers(checked || indeterminate ? [] : users);
    setChecked(!checked && !indeterminate);
    setIndeterminate(false);
  }

  const handleDelete = async () => {
    if (selectedUsers.length === 0) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await Promise.all(
        selectedUsers.map(user => ApiService.deleteUser(user.id))
      );
      
      setSelectedUsers([]);
      setShowDeleteDialog(false);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Delete error:', error);
      setDeleteError(error instanceof Error ? error.message : 'Delete failed');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleSingleDelete = async (user: User) => {
    try {
      await ApiService.deleteUser(user.id);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Delete error:', error);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
              <div className="h-10 w-10 bg-gray-200 rounded-full"></div>
              <div className="h-4 bg-gray-200 rounded flex-1"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error Loading Users
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (users.length === 0) {
    return (
      <div className="text-center py-12">
        <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No users found</h3>
        <p className="mt-1 text-sm text-gray-500">
          No users match your current filters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold text-gray-900">User Management</h1>
          <p className="mt-2 text-sm text-gray-700">
            Manage user accounts, roles, and permissions. Total: {users.length} users
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <div className="flex items-center space-x-4">
            {currentUser?.role === 'super_admin' && onUserAdd && (
              <button
                type="button"
                onClick={onUserAdd}
                className="block rounded-md bg-indigo-600 px-3 py-1.5 text-center text-sm/6 font-semibold text-white shadow-xs hover:bg-indigo-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                <UserPlusIcon className="inline h-4 w-4 mr-2" />
                Add User
              </button>
            )}
            <div className="text-sm text-gray-500">
              <ClockIcon className="inline h-4 w-4 mr-1" />
              Last updated: {new Date().toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="relative">
              {selectedUsers.length > 0 && (
                <div className="absolute top-0 left-14 flex h-12 items-center space-x-3 bg-white sm:left-12">
                  <button
                    type="button"
                    onClick={() => setShowDeleteDialog(true)}
                    className="inline-flex items-center rounded-sm bg-white px-2 py-1 text-sm font-semibold text-red-700 ring-1 shadow-xs ring-red-300 ring-inset hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Delete {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''}
                  </button>
                </div>
              )}
              <table className="min-w-full table-fixed divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th scope="col" className="relative px-7 sm:w-12 sm:px-6">
                      <div className="group absolute top-1/2 left-4 -mt-2 grid size-4 grid-cols-1">
                        <input
                          type="checkbox"
                          className="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 indeterminate:border-indigo-600 indeterminate:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
                          ref={checkbox}
                          checked={checked}
                          onChange={toggleAll}
                        />
                        <svg
                          className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25"
                          viewBox="0 0 14 14"
                          fill="none"
                        >
                          <path
                            className="opacity-0 group-has-checked:opacity-100"
                            d="M3 8L6 11L11 3.5"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            className="opacity-0 group-has-indeterminate:opacity-100"
                            d="M3 7H11"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </th>
                    <th scope="col" className="min-w-[12rem] py-3.5 pr-3 text-left text-sm font-semibold text-gray-900">
                      User
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Email
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Role
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Status
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Last Login
                    </th>
                    <th scope="col" className="relative py-3.5 pr-4 pl-3 sm:pr-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {users.map((user) => (
                    <tr key={user.id} className={selectedUsers.includes(user) ? 'bg-gray-50' : undefined}>
                      <td className="relative px-7 sm:w-12 sm:px-6">
                        {selectedUsers.includes(user) && (
                          <div className="absolute inset-y-0 left-0 w-0.5 bg-indigo-600" />
                        )}
                        <div className="group absolute top-1/2 left-4 -mt-2 grid size-4 grid-cols-1">
                          <input
                            type="checkbox"
                            className="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 indeterminate:border-indigo-600 indeterminate:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
                            value={user.id}
                            checked={selectedUsers.includes(user)}
                            onChange={(e) =>
                              setSelectedUsers(
                                e.target.checked
                                  ? [...selectedUsers, user]
                                  : selectedUsers.filter((u) => u !== user),
                              )
                            }
                          />
                          <svg
                            className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25"
                            viewBox="0 0 14 14"
                            fill="none"
                          >
                            <path
                              className="opacity-0 group-has-checked:opacity-100"
                              d="M3 8L6 11L11 3.5"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              className="opacity-0 group-has-indeterminate:opacity-100"
                              d="M3 7H11"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </td>
                      <td
                        className={classNames(
                          'py-4 pr-3 text-sm font-medium whitespace-nowrap',
                          selectedUsers.includes(user) ? 'text-indigo-600' : 'text-gray-900',
                        )}
                      >
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                              <UserIcon className="h-6 w-6 text-gray-600" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="font-medium text-gray-900">{user.username}</div>
                            <div className="text-xs text-gray-500">ID: {user.id.slice(0, 8)}...</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-3 py-4 text-sm whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getRoleBadgeClass(user.role)}`}>
                          {user.role === 'super_admin' ? (
                            <ShieldExclamationIcon className="h-3 w-3 mr-1" />
                          ) : (
                            <ShieldCheckIcon className="h-3 w-3 mr-1" />
                          )}
                          {user.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-sm whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${getStatusBadgeClass(user.is_active, user.is_verified)}`}>
                          {user.is_active && user.is_verified ? (
                            <CheckCircleIcon className="h-3 w-3 mr-1" />
                          ) : (
                            <XCircleIcon className="h-3 w-3 mr-1" />
                          )}
                          {getStatusText(user.is_active, user.is_verified)}
                        </span>
                      </td>
                      <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500">
                        {formatLastLogin(user.last_login)}
                      </td>
                      <td className="py-4 pr-4 pl-3 text-right text-sm font-medium whitespace-nowrap sm:pr-3">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => onUserSelect?.(user)}
                            className="text-indigo-600 hover:text-indigo-900 p-1 hover:bg-indigo-50 rounded"
                            title="View Details"
                          >
                            <EyeIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => onUserEdit?.(user)}
                            className="text-gray-600 hover:text-gray-900 p-1 hover:bg-gray-50 rounded"
                            title="Edit User"
                          >
                            <PencilIcon className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleSingleDelete(user)}
                            className="text-red-600 hover:text-red-900 p-1 hover:bg-red-50 rounded"
                            title="Delete User"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onClose={setShowDeleteDialog} className="relative z-10">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
        />

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel
              transition
              className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg data-closed:sm:translate-y-0 data-closed:sm:scale-95"
            >
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon aria-hidden="true" className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3 className="text-base font-semibold text-gray-900">
                      Delete Users
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete {selectedUsers.length} user{selectedUsers.length > 1 ? 's' : ''}? 
                        This action cannot be undone and will permanently remove all user data.
                      </p>
                      {deleteError && (
                        <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                          {deleteError}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-red-500 disabled:bg-red-400 sm:ml-3 sm:w-auto"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  type="button"
                  data-autofocus
                  onClick={() => setShowDeleteDialog(false)}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </div>
  );
}