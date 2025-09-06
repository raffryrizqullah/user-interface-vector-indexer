'use client';

import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/20/solid';
import { 
  DocumentTextIcon, 
  ChartBarIcon, 
  FolderIcon, 
  UserGroupIcon,
  CubeIcon 
} from '@heroicons/react/24/outline';

export interface StatItem {
  id: number;
  name: string;
  stat: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  change: string;
  changeType: 'increase' | 'decrease';
  href?: string;
  healthStatus?: 'healthy' | 'warning' | 'error';
  lastUpdated?: string;
}

interface StatsWithIconsProps {
  stats?: StatItem[];
  isLoading?: boolean;
}

const defaultStats: StatItem[] = [
  { 
    id: 1, 
    name: 'Total Documents', 
    stat: '245', 
    icon: DocumentTextIcon, 
    change: '12', 
    changeType: 'increase',
    href: '#documents'
  },
  { 
    id: 2, 
    name: 'Vector Records', 
    stat: '12,847', 
    icon: CubeIcon, 
    change: '2.4k', 
    changeType: 'increase',
    href: '#vectors'
  },
  { 
    id: 3, 
    name: 'Active Namespaces', 
    stat: '3', 
    icon: FolderIcon, 
    change: '1', 
    changeType: 'increase',
    href: '#namespaces'
  },
  { 
    id: 4, 
    name: 'Active Users', 
    stat: '8', 
    icon: UserGroupIcon, 
    change: '2', 
    changeType: 'increase',
    href: '#users'
  },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

function StatCardSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-lg bg-white px-4 pt-5 pb-12 shadow-lg sm:px-6 sm:pt-6 border border-blue-university-200">
      <div className="animate-pulse">
        <div className="flex items-start">
          <div className="rounded-md bg-blue-university-100 p-3 w-12 h-12"></div>
          <div className="ml-4 flex-1">
            <div className="h-4 bg-blue-university-100 rounded w-24 mb-2"></div>
            <div className="h-6 bg-blue-university-100 rounded w-16 mb-2"></div>
            <div className="flex items-center">
              <div className="h-4 bg-blue-university-100 rounded w-4 mr-1"></div>
              <div className="h-4 bg-blue-university-100 rounded w-8"></div>
            </div>
          </div>
        </div>
        <div className="absolute inset-x-0 bottom-0 bg-blue-university-50 px-4 py-4">
          <div className="h-4 bg-blue-university-100 rounded w-16"></div>
        </div>
      </div>
    </div>
  );
}

export default function StatsWithIcons({ stats = defaultStats, isLoading = false }: StatsWithIconsProps) {
  if (isLoading) {
    return (
      <div>
        <h3 className="text-base font-semibold text-blue-university-900 mb-4">System Statistics</h3>
        <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <StatCardSkeleton key={i} />
          ))}
        </dl>
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-base font-semibold text-blue-university-900 mb-4">System Statistics</h3>

      <dl className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => (
          <div
            key={item.id}
            className={`relative overflow-hidden rounded-lg bg-white px-4 pt-5 pb-12 shadow-lg sm:px-6 sm:pt-6 border hover:shadow-xl transition-all duration-200 ${
              item.healthStatus === 'error' ? 'border-red-300 bg-red-50' : 
              item.healthStatus === 'warning' ? 'border-gold-university-300 bg-gold-university-50' : 
              'border-blue-university-200 hover:border-blue-university-300'
            }`}
          >
            <dt>
              <div className={`absolute rounded-md p-3 ${
                item.healthStatus === 'error' ? 'bg-red-500' : 
                item.healthStatus === 'warning' ? 'bg-gold-university-600' : 
                'bg-blue-university-600'
              }`}>
                <item.icon aria-hidden="true" className="size-6 text-white" />
              </div>
              <div className="ml-16 flex items-center justify-between">
                <p className="truncate text-sm font-medium text-gray-500">{item.name}</p>
                {item.healthStatus && (
                  <div className={`w-2 h-2 rounded-full ${
                    item.healthStatus === 'healthy' ? 'bg-green-500' : 
                    item.healthStatus === 'warning' ? 'bg-gold-university-600' : 
                    'bg-red-500'
                  }`}></div>
                )}
              </div>
            </dt>
            <dd className="ml-16 flex items-baseline pb-6 sm:pb-7">
              <p className="text-2xl font-semibold text-blue-university-900">{item.stat}</p>
              <p
                className={classNames(
                  item.changeType === 'increase' ? 'text-green-600' : 'text-red-600',
                  'ml-2 flex items-baseline text-sm font-semibold',
                )}
              >
                {item.changeType === 'increase' ? (
                  <ArrowUpIcon aria-hidden="true" className="size-5 shrink-0 self-center text-green-500" />
                ) : (
                  <ArrowDownIcon aria-hidden="true" className="size-5 shrink-0 self-center text-red-500" />
                )}

                <span className="sr-only"> {item.changeType === 'increase' ? 'Increased' : 'Decreased'} by </span>
                {item.change}
              </p>
              <div className="absolute inset-x-0 bottom-0 bg-blue-university-50 px-4 py-4 sm:px-6">
                <div className="text-sm">
                  <a 
                    href={item.href || '#'} 
                    className="font-medium text-blue-university-600 hover:text-blue-university-700 transition-colors duration-200"
                  >
                    View all<span className="sr-only"> {item.name} stats</span>
                  </a>
                </div>
              </div>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}