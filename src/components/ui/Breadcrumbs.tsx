'use client';

import { HomeIcon, ChevronRightIcon } from '@heroicons/react/20/solid';

export interface BreadcrumbItem {
  name: string;
  href?: string;
  current: boolean;
  onClick?: () => void;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
  className?: string;
}

export default function Breadcrumbs({ items, className = '' }: BreadcrumbsProps) {
  return (
    <nav aria-label="Breadcrumb" className={`flex ${className}`}>
      <ol role="list" className="flex items-center space-x-2 sm:space-x-4">
        <li>
          <div>
            <button
              onClick={items[0]?.onClick}
              className="text-gray-400 hover:text-gray-500 transition-colors duration-200"
              aria-label="Home"
            >
              <HomeIcon aria-hidden="true" className="size-4 sm:size-5 shrink-0" />
              <span className="sr-only">Home</span>
            </button>
          </div>
        </li>
        {items.map((item, index) => (
          <li key={item.name}>
            <div className="flex items-center">
              <ChevronRightIcon 
                aria-hidden="true" 
                className="size-4 sm:size-5 shrink-0 text-gray-300" 
              />
              {item.onClick ? (
                <button
                  onClick={item.onClick}
                  aria-current={item.current ? 'page' : undefined}
                  className={`ml-2 sm:ml-4 text-xs sm:text-sm font-medium transition-colors duration-200 truncate max-w-32 sm:max-w-none ${
                    item.current 
                      ? 'text-gray-900' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {item.name}
                </button>
              ) : (
                <a
                  href={item.href}
                  aria-current={item.current ? 'page' : undefined}
                  className={`ml-2 sm:ml-4 text-xs sm:text-sm font-medium transition-colors duration-200 truncate max-w-32 sm:max-w-none ${
                    item.current 
                      ? 'text-gray-900' 
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  {item.name}
                </a>
              )}
            </div>
          </li>
        ))}
      </ol>
    </nav>
  );
}