'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { AuthService } from '@/lib/auth';
import { auth } from '@/lib/authorization';
import { ShieldExclamationIcon, ArrowLeftIcon } from '@heroicons/react/24/outline';

export default function UnauthorizedPage() {
  const router = useRouter();
  const currentUser = auth.getCurrentUser();

  useEffect(() => {
    // If not authenticated, redirect to login
    if (!AuthService.isAuthenticated()) {
      router.replace('/login');
      return;
    }
  }, [router]);

  const handleGoBack = () => {
    router.back();
  };

  const handleGoToDashboard = () => {
    router.push('/dashboard');
  };

  if (!currentUser) {
    return null; // Will redirect to login
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900 flex items-center justify-center px-4">
      <div className="max-w-md w-full text-center">
        {/* Icon */}
        <div className="flex justify-center mb-6">
          <div className="rounded-full bg-red-50 p-4 dark:bg-red-900/20">
            <ShieldExclamationIcon className="h-12 w-12 text-red-600 dark:text-red-400" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 mb-4">
          Access Denied
        </h1>

        {/* Description */}
        <div className="text-slate-600 dark:text-slate-400 mb-6 space-y-2">
          <p>
            You don&apos;t have permission to access this page or feature.
          </p>
          <p className="text-sm">
            This area is restricted to users with higher privileges.
          </p>
        </div>

        {/* User Info */}
        <div className="bg-white dark:bg-slate-800 rounded-lg p-4 mb-6 border border-slate-200 dark:border-slate-700">
          <div className="flex items-center justify-center space-x-3">
            <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/50 flex items-center justify-center">
              <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-300">
                {currentUser.username.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="text-left">
              <div className="font-medium text-slate-900 dark:text-slate-100">
                {currentUser.username}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-slate-500 dark:text-slate-400">
                  Current role:
                </span>
                <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset ${auth.getRoleBadgeClasses()}`}>
                  {auth.getRoleDisplayName()}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <button
            onClick={handleGoToDashboard}
            className="w-full flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            Go to Dashboard
          </button>
          
          <button
            onClick={handleGoBack}
            className="w-full flex justify-center items-center px-4 py-2 border border-slate-300 dark:border-slate-600 text-sm font-medium rounded-md text-slate-700 dark:text-slate-300 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Go Back
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-8 text-xs text-slate-500 dark:text-slate-600">
          <p>
            If you believe this is an error, please contact your system administrator.
          </p>
        </div>
      </div>
    </div>
  );
}