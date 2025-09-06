'use client';

import { Menu, MenuButton, MenuItem, MenuItems } from '@headlessui/react';
import { EllipsisHorizontalIcon } from '@heroicons/react/20/solid';
import { 
  DocumentPlusIcon,
  MagnifyingGlassIcon,
  HeartIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

const statuses = {
  Active: 'text-green-700 bg-green-50 ring-green-600/20',
  Processing: 'text-gold-university-800 bg-gold-university-50 ring-gold-university-600/20',
  Error: 'text-red-700 bg-red-50 ring-red-600/10',
  Connected: 'text-green-700 bg-green-50 ring-green-600/20',
  Disconnected: 'text-red-700 bg-red-50 ring-red-600/10',
};

export interface QuickAccessItem {
  id: number;
  name: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  iconBgColor: string;
  description: string;
  lastActivity: {
    label: string;
    value: string;
    dateTime?: string;
  };
  status: {
    label: string;
    value: string;
    type: keyof typeof statuses;
  };
  metrics?: {
    label: string;
    value: string;
  };
  actions: {
    primary: { label: string; href?: string; onClick?: () => void };
    secondary: { label: string; href?: string; onClick?: () => void };
  };
}

interface QuickAccessCardsProps {
  items?: QuickAccessItem[];
  isLoading?: boolean;
}

const defaultItems: QuickAccessItem[] = [
  {
    id: 1,
    name: 'Create Records',
    icon: DocumentPlusIcon,
    iconBgColor: 'bg-blue-university-600',
    description: 'Upload and process PDF documents into vector embeddings',
    lastActivity: {
      label: 'Last upload',
      value: '2 hours ago',
      dateTime: '2025-09-04T05:30:00Z'
    },
    status: {
      label: 'Status',
      value: 'Active',
      type: 'Active'
    },
    metrics: {
      label: 'Files processed',
      value: '24 today'
    },
    actions: {
      primary: { label: 'Upload Files', href: '/documents/upload' },
      secondary: { label: 'View History', href: '/documents/history' }
    }
  },
  {
    id: 2,
    name: 'Search Records',
    icon: MagnifyingGlassIcon,
    iconBgColor: 'bg-purple-500',
    description: 'Search through vector embeddings and find similar content',
    lastActivity: {
      label: 'Last search',
      value: '1 hour ago',
      dateTime: '2025-09-04T06:30:00Z'
    },
    status: {
      label: 'Query type',
      value: 'Semantic',
      type: 'Active'
    },
    metrics: {
      label: 'Results found',
      value: '156 matches'
    },
    actions: {
      primary: { label: 'New Search', href: '/search' },
      secondary: { label: 'Recent Searches', href: '/search/history' }
    }
  },
  {
    id: 3,
    name: 'System Health',
    icon: HeartIcon,
    iconBgColor: 'bg-blue-university-500',
    description: 'Monitor Pinecone connectivity and system performance',
    lastActivity: {
      label: 'Last check',
      value: '5 minutes ago',
      dateTime: '2025-09-04T07:25:00Z'
    },
    status: {
      label: 'Pinecone status',
      value: 'Connected',
      type: 'Connected'
    },
    metrics: {
      label: 'Response time',
      value: '45ms avg'
    },
    actions: {
      primary: { label: 'Run Health Check', href: '/health/check' },
      secondary: { label: 'View Logs', href: '/health/logs' }
    }
  }
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

function QuickAccessCardSkeleton() {
  return (
    <li className="overflow-hidden rounded-xl border border-gray-200">
      <div className="flex items-center gap-x-4 border-b border-gray-900/5 bg-gray-50 p-6">
        <div className="size-12 rounded-lg bg-gray-300 animate-pulse"></div>
        <div className="flex-1">
          <div className="h-5 bg-gray-300 rounded w-32 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-300 rounded w-48 animate-pulse"></div>
        </div>
        <div className="w-5 h-5 bg-gray-300 rounded animate-pulse"></div>
      </div>
      <div className="px-6 py-4">
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex justify-between">
              <div className="h-4 bg-gray-300 rounded w-20 animate-pulse"></div>
              <div className="h-4 bg-gray-300 rounded w-24 animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    </li>
  );
}

export default function QuickAccessCards({ items = defaultItems, isLoading = false }: QuickAccessCardsProps) {
  if (isLoading) {
    return (
      <div>
        <h3 className="text-base font-semibold text-blue-university-900 mb-4">Quick Actions</h3>
        <ul role="list" className="grid grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-3 xl:gap-x-8">
          {[1, 2, 3].map((i) => (
            <QuickAccessCardSkeleton key={i} />
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-base font-semibold text-gray-900 mb-4">Quick Actions</h3>
      
      <ul role="list" className="grid grid-cols-1 gap-x-6 gap-y-8 lg:grid-cols-3 xl:gap-x-8">
        {items.map((item) => (
          <li key={item.id} className="overflow-hidden rounded-xl border border-gray-200 hover:shadow-md transition-shadow duration-200">
            <div className="flex items-center gap-x-4 border-b border-gray-900/5 bg-gray-50 p-6">
              <div className={`${item.iconBgColor} p-3 rounded-lg`}>
                <item.icon className="size-6 text-white" aria-hidden="true" />
              </div>
              <div className="flex-1">
                <div className="text-sm/6 font-medium text-gray-900">{item.name}</div>
                <div className="text-xs text-gray-600 mt-1">{item.description}</div>
              </div>
              <Menu as="div" className="relative ml-auto">
                <MenuButton className="-m-2.5 block p-2.5 text-gray-400 hover:text-gray-500">
                  <span className="sr-only">Open options</span>
                  <EllipsisHorizontalIcon aria-hidden="true" className="size-5" />
                </MenuButton>
                <MenuItems
                  transition
                  className="absolute right-0 z-10 mt-0.5 w-32 origin-top-right rounded-md bg-white py-2 ring-1 shadow-lg ring-gray-900/5 transition focus:outline-hidden data-closed:scale-95 data-closed:transform data-closed:opacity-0 data-enter:duration-100 data-enter:ease-out data-leave:duration-75 data-leave:ease-in"
                >
                  <MenuItem>
                    {item.actions.primary.onClick ? (
                      <button
                        onClick={item.actions.primary.onClick}
                        className="block w-full text-left px-3 py-1 text-sm/6 text-gray-900 data-focus:bg-gray-50 data-focus:outline-hidden"
                      >
                        {item.actions.primary.label}
                      </button>
                    ) : (
                      <a
                        href={item.actions.primary.href}
                        className="block px-3 py-1 text-sm/6 text-gray-900 data-focus:bg-gray-50 data-focus:outline-hidden"
                      >
                        {item.actions.primary.label}
                      </a>
                    )}
                  </MenuItem>
                  <MenuItem>
                    {item.actions.secondary.onClick ? (
                      <button
                        onClick={item.actions.secondary.onClick}
                        className="block w-full text-left px-3 py-1 text-sm/6 text-gray-900 data-focus:bg-gray-50 data-focus:outline-hidden"
                      >
                        {item.actions.secondary.label}
                      </button>
                    ) : (
                      <a
                        href={item.actions.secondary.href}
                        className="block px-3 py-1 text-sm/6 text-gray-900 data-focus:bg-gray-50 data-focus:outline-hidden"
                      >
                        {item.actions.secondary.label}
                      </a>
                    )}
                  </MenuItem>
                </MenuItems>
              </Menu>
            </div>
            <dl className="-my-3 divide-y divide-gray-100 px-6 py-4 text-sm/6">
              <div className="flex justify-between gap-x-4 py-3">
                <dt className="text-gray-500">{item.lastActivity.label}</dt>
                <dd className="text-gray-700">
                  {item.lastActivity.dateTime ? (
                    <time dateTime={item.lastActivity.dateTime}>{item.lastActivity.value}</time>
                  ) : (
                    item.lastActivity.value
                  )}
                </dd>
              </div>
              <div className="flex justify-between gap-x-4 py-3">
                <dt className="text-gray-500">{item.status.label}</dt>
                <dd className="flex items-start gap-x-2">
                  <div
                    className={classNames(
                      statuses[item.status.type],
                      'rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset',
                    )}
                  >
                    {item.status.value}
                  </div>
                </dd>
              </div>
              {item.metrics && (
                <div className="flex justify-between gap-x-4 py-3">
                  <dt className="text-gray-500">{item.metrics.label}</dt>
                  <dd className="font-medium text-gray-900">{item.metrics.value}</dd>
                </div>
              )}
            </dl>
            
            {/* Action Buttons */}
            <div className="bg-gray-50 px-6 py-4 flex space-x-3">
              {item.actions.primary.onClick ? (
                <button
                  onClick={item.actions.primary.onClick}
                  className="flex-1 inline-flex justify-center items-center px-3 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                >
                  {item.actions.primary.label}
                </button>
              ) : (
                <a
                  href={item.actions.primary.href}
                  className="flex-1 inline-flex justify-center items-center px-3 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                >
                  {item.actions.primary.label}
                </a>
              )}
              {item.actions.secondary.onClick ? (
                <button
                  onClick={item.actions.secondary.onClick}
                  className="flex-1 inline-flex justify-center items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                >
                  {item.actions.secondary.label}
                </button>
              ) : (
                <a
                  href={item.actions.secondary.href}
                  className="flex-1 inline-flex justify-center items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
                >
                  {item.actions.secondary.label}
                </a>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}