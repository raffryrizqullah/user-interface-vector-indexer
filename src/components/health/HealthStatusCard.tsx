'use client';

import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ExclamationTriangleIcon,
  ClockIcon,
  ServerIcon,
  CubeIcon,
  WifiIcon
} from '@heroicons/react/24/outline';

export interface HealthStatus {
  service: string;
  status: 'healthy' | 'error' | 'warning' | 'unknown';
  message?: string;
  responseTime?: number;
  lastCheck?: string;
  details?: Record<string, unknown>;
}

interface HealthStatusCardProps {
  healthStatus: HealthStatus;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  isLoading?: boolean;
}

function getStatusColor(status: string) {
  switch (status) {
    case 'healthy':
      return {
        bg: 'bg-green-50',
        text: 'text-green-800',
        icon: 'text-green-600',
        border: 'border-green-200',
        badge: 'bg-green-100 text-green-800',
      };
    case 'error':
      return {
        bg: 'bg-red-50',
        text: 'text-red-800',
        icon: 'text-red-600',
        border: 'border-red-200',
        badge: 'bg-red-100 text-red-800',
      };
    case 'warning':
      return {
        bg: 'bg-yellow-50',
        text: 'text-yellow-800',
        icon: 'text-yellow-600',
        border: 'border-yellow-200',
        badge: 'bg-yellow-100 text-yellow-800',
      };
    default:
      return {
        bg: 'bg-gray-50',
        text: 'text-gray-800',
        icon: 'text-gray-600',
        border: 'border-gray-200',
        badge: 'bg-gray-100 text-gray-800',
      };
  }
}

function getStatusIcon(status: string) {
  switch (status) {
    case 'healthy':
      return CheckCircleIcon;
    case 'error':
      return XCircleIcon;
    case 'warning':
      return ExclamationTriangleIcon;
    default:
      return ClockIcon;
  }
}

function getDefaultIcon(service: string) {
  switch (service.toLowerCase()) {
    case 'api':
    case 'basic':
      return ServerIcon;
    case 'pinecone':
    case 'database':
      return CubeIcon;
    case 'network':
      return WifiIcon;
    default:
      return ServerIcon;
  }
}

export default function HealthStatusCard({ healthStatus, icon, isLoading }: HealthStatusCardProps) {
  const colors = getStatusColor(healthStatus.status);
  const StatusIcon = getStatusIcon(healthStatus.status);
  const ServiceIcon = icon || getDefaultIcon(healthStatus.service);

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <div className="flex items-center">
            <div className="h-12 w-12 rounded-full bg-gray-200"></div>
            <div className="ml-4 flex-1">
              <div className="h-4 bg-gray-200 rounded w-24 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-16"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`rounded-lg border ${colors.border} ${colors.bg} p-6 transition-colors duration-200`}>
      <div className="flex items-center">
        <div className="flex-shrink-0">
          <div className={`flex h-12 w-12 items-center justify-center rounded-full ${colors.bg} border-2 ${colors.border}`}>
            <ServiceIcon className={`h-6 w-6 ${colors.icon}`} />
          </div>
        </div>
        <div className="ml-4 flex-1">
          <div className="flex items-center justify-between">
            <h3 className={`text-lg font-semibold ${colors.text}`}>
              {healthStatus.service}
            </h3>
            <div className="flex items-center">
              <StatusIcon className={`h-5 w-5 ${colors.icon} mr-2`} />
              <span className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${colors.badge} capitalize`}>
                {healthStatus.status}
              </span>
            </div>
          </div>
          
          <div className="mt-2 space-y-1">
            {healthStatus.message && (
              <p className={`text-sm ${colors.text}`}>
                {healthStatus.message}
              </p>
            )}
            
            <div className="flex items-center space-x-4 text-xs text-gray-600">
              {healthStatus.responseTime && (
                <span className="flex items-center">
                  <ClockIcon className="h-3 w-3 mr-1" />
                  {healthStatus.responseTime}ms
                </span>
              )}
              {healthStatus.lastCheck && (
                <span>
                  Last check: {new Date(healthStatus.lastCheck).toLocaleTimeString()}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Details Section */}
      {healthStatus.details && Object.keys(healthStatus.details).length > 0 && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            {Object.entries(healthStatus.details).map(([key, value]) => (
              <div key={key} className="flex justify-between">
                <span className="font-medium text-gray-700">{key}:</span>
                <span className="text-gray-600 truncate ml-2">
                  {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}