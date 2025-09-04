'use client';

import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export default function PageHeader({ 
  title, 
  description, 
  icon, 
  actions, 
  className = '' 
}: PageHeaderProps) {
  return (
    <div className={`border-b border-gray-200 pb-6 sm:pb-8 ${className}`}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="min-w-0 flex-1">
          <div className="flex items-center space-x-3">
            {icon && (
              <div className="flex items-center justify-center size-10 sm:size-12 rounded-xl bg-indigo-100">
                {icon}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl sm:text-3xl font-bold leading-tight text-gray-900 truncate">
                {title}
              </h1>
              {description && (
                <p className="mt-1 sm:mt-2 text-sm sm:text-base text-gray-600 max-w-2xl">
                  {description}
                </p>
              )}
            </div>
          </div>
        </div>
        
        {actions && (
          <div className="flex-shrink-0">
            <div className="flex items-center space-x-3">
              {actions}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}