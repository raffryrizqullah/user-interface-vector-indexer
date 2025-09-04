'use client';

import { 
  DocumentPlusIcon, 
  MagnifyingGlassIcon, 
  HeartIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/20/solid';

export interface ActivityItem {
  id: number;
  content: string;
  target: string;
  href?: string;
  date: string;
  datetime: string;
  icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  iconBackground: string;
}

interface RecentActivityProps {
  activities?: ActivityItem[];
  isLoading?: boolean;
}

const defaultActivities: ActivityItem[] = [
  {
    id: 1,
    content: 'New document uploaded:',
    target: 'research_paper_2025.pdf',
    href: '#',
    date: '2 hours ago',
    datetime: '2025-09-04T05:30:00Z',
    icon: DocumentPlusIcon,
    iconBackground: 'bg-blue-500',
  },
  {
    id: 2,
    content: 'Vector search performed on',
    target: 'machine learning datasets',
    href: '#',
    date: '4 hours ago',
    datetime: '2025-09-04T03:30:00Z',
    icon: MagnifyingGlassIcon,
    iconBackground: 'bg-purple-500',
  },
  {
    id: 3,
    content: 'System health check',
    target: 'completed successfully',
    href: '#',
    date: '6 hours ago',
    datetime: '2025-09-04T01:30:00Z',
    icon: CheckCircleIcon,
    iconBackground: 'bg-green-500',
  },
  {
    id: 4,
    content: 'Batch processing completed:',
    target: '15 documents indexed',
    href: '#',
    date: '8 hours ago',
    datetime: '2025-09-03T23:30:00Z',
    icon: DocumentPlusIcon,
    iconBackground: 'bg-indigo-500',
  },
  {
    id: 5,
    content: 'Health monitoring detected',
    target: 'high response time',
    href: '#',
    date: '12 hours ago',
    datetime: '2025-09-03T19:30:00Z',
    icon: ExclamationTriangleIcon,
    iconBackground: 'bg-yellow-500',
  },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

function ActivitySkeleton() {
  return (
    <li>
      <div className="relative pb-8">
        <span aria-hidden="true" className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
        <div className="relative flex space-x-3">
          <div>
            <span className="flex size-8 items-center justify-center rounded-full bg-gray-300 animate-pulse ring-8 ring-white">
            </span>
          </div>
          <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
            <div className="flex-1">
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-1 animate-pulse"></div>
              <div className="h-4 bg-gray-300 rounded w-1/2 animate-pulse"></div>
            </div>
            <div className="text-right">
              <div className="h-4 bg-gray-300 rounded w-16 animate-pulse"></div>
            </div>
          </div>
        </div>
      </div>
    </li>
  );
}

export default function RecentActivity({ activities = defaultActivities, isLoading = false }: RecentActivityProps) {
  if (isLoading) {
    return (
      <div className="bg-white shadow-sm rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Recent Activity
          </h3>
          <div className="flow-root">
            <ul role="list" className="-mb-8">
              {[1, 2, 3, 4, 5].map((i) => (
                <ActivitySkeleton key={i} />
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white shadow-sm rounded-lg border border-gray-200">
      <div className="px-4 py-5 sm:p-6">
        <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
          Recent Activity
        </h3>
        <div className="flow-root">
          <ul role="list" className="-mb-8">
            {activities.map((activity, activityIdx) => (
              <li key={activity.id}>
                <div className="relative pb-8">
                  {activityIdx !== activities.length - 1 ? (
                    <span aria-hidden="true" className="absolute top-4 left-4 -ml-px h-full w-0.5 bg-gray-200" />
                  ) : null}
                  <div className="relative flex space-x-3">
                    <div>
                      <span
                        className={classNames(
                          activity.iconBackground,
                          'flex size-8 items-center justify-center rounded-full ring-8 ring-white',
                        )}
                      >
                        <activity.icon aria-hidden="true" className="size-5 text-white" />
                      </span>
                    </div>
                    <div className="flex min-w-0 flex-1 justify-between space-x-4 pt-1.5">
                      <div>
                        <p className="text-sm text-gray-500">
                          {activity.content}{' '}
                          {activity.href ? (
                            <a href={activity.href} className="font-medium text-gray-900 hover:text-indigo-600 transition-colors duration-200">
                              {activity.target}
                            </a>
                          ) : (
                            <span className="font-medium text-gray-900">{activity.target}</span>
                          )}
                        </p>
                      </div>
                      <div className="text-right text-sm whitespace-nowrap text-gray-500">
                        <time dateTime={activity.datetime}>{activity.date}</time>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}