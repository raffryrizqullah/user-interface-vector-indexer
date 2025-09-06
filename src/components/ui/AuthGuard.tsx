import { ReactNode } from 'react';
import { auth, UserRole } from '@/lib/authorization';
import { ShieldExclamationIcon } from '@heroicons/react/24/outline';

interface AuthGuardProps {
  children: ReactNode;
  requiredRole?: UserRole;
  fallback?: ReactNode;
  className?: string;
}

export default function AuthGuard({ 
  children, 
  requiredRole, 
  fallback, 
  className = '' 
}: AuthGuardProps) {
  const currentUser = auth.getCurrentUser();

  // If no role requirement, just check if authenticated
  if (!requiredRole) {
    return currentUser ? <>{children}</> : null;
  }

  // Check if user has required role
  const hasAccess = auth.hasMinimumRole(requiredRole);

  if (!hasAccess) {
    if (fallback) {
      return <>{fallback}</>;
    }

    // Default unauthorized message
    return (
      <div className={`min-h-96 flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="flex justify-center mb-4">
            <div className="rounded-full bg-red-50 p-3 dark:bg-red-900/20">
              <ShieldExclamationIcon className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
            Access Denied
          </h3>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-1">
            You don&apos;t have permission to access this feature.
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-500">
            Required role: {requiredRole === 'super_admin' ? 'Super Admin' : 'Admin'}
          </p>
          {currentUser && (
            <p className="text-xs text-slate-400 dark:text-slate-600 mt-2">
              Current role: {auth.getRoleDisplayName(currentUser.role)}
            </p>
          )}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

// Utility component for checking specific permissions
interface PermissionGuardProps {
  children: ReactNode;
  resource: string;
  action?: string;
  fallback?: ReactNode;
}

export function PermissionGuard({ 
  children, 
  resource, 
  action = 'read', 
  fallback 
}: PermissionGuardProps) {
  const hasAccess = auth.canAccess(resource, action);

  if (!hasAccess) {
    return fallback ? <>{fallback}</> : null;
  }

  return <>{children}</>;
}

// Hook for role-based conditional rendering
export function useAuthGuard(requiredRole?: UserRole) {
  const currentUser = auth.getCurrentUser();
  
  if (!requiredRole) {
    return { hasAccess: !!currentUser, currentUser };
  }
  
  const hasAccess = auth.hasMinimumRole(requiredRole);
  
  return { hasAccess, currentUser };
}