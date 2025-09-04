'use client';

import { ReactNode } from 'react';

interface ContentContainerProps {
  children: ReactNode;
  variant?: 'default' | 'card' | 'bordered';
  className?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export default function ContentContainer({ 
  children, 
  variant = 'default',
  className = '',
  size = 'lg'
}: ContentContainerProps) {
  const getSizeClasses = () => {
    switch (size) {
      case 'sm':
        return 'max-w-3xl mx-auto px-4 sm:px-6';
      case 'md':
        return 'max-w-5xl mx-auto px-4 sm:px-6 lg:px-8';
      case 'lg':
        return 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';
      case 'xl':
        return 'max-w-8xl mx-auto px-4 sm:px-6 lg:px-8 xl:px-10';
      default:
        return 'max-w-7xl mx-auto px-4 sm:px-6 lg:px-8';
    }
  };

  const getVariantClasses = () => {
    switch (variant) {
      case 'card':
        return 'bg-white shadow-sm ring-1 ring-gray-900/5 rounded-xl';
      case 'bordered':
        return 'bg-white border border-gray-200 rounded-lg';
      default:
        return '';
    }
  };

  const containerClasses = `${getSizeClasses()} ${className}`;
  const contentClasses = getVariantClasses();

  if (variant === 'default') {
    return (
      <div className={containerClasses}>
        {children}
      </div>
    );
  }

  return (
    <div className={containerClasses}>
      <div className={contentClasses}>
        {children}
      </div>
    </div>
  );
}