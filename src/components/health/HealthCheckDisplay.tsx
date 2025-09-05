'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  ArrowPathIcon,
  PlayIcon,
  PauseIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
  ServerIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import { Switch } from '@headlessui/react';
import HealthStatusCard, { HealthStatus } from './HealthStatusCard';
import { ApiService } from '@/lib/api';

interface HealthCheckDisplayProps {
  onRefresh?: () => void;
}

interface OverallHealth {
  status: 'healthy' | 'warning' | 'error';
  services: number;
  healthyCount: number;
  lastUpdate: string;
}

export default function HealthCheckDisplay({ onRefresh }: HealthCheckDisplayProps) {
  const [healthStatuses, setHealthStatuses] = useState<HealthStatus[]>([]);
  const [overallHealth, setOverallHealth] = useState<OverallHealth>({
    status: 'healthy',
    services: 0,
    healthyCount: 0,
    lastUpdate: new Date().toISOString(),
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30); // seconds
  const [intervalId, setIntervalId] = useState<NodeJS.Timeout | null>(null);

  const fetchHealthData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    const startTime = Date.now();
    
    try {
      // Fetch both health endpoints
      const [basicHealthPromise, pineconeHealthPromise] = [
        ApiService.getBasicHealth().catch(err => ({ error: err.message })),
        ApiService.getPineconeHealth().catch(err => ({ error: err.message }))
      ];

      const [basicHealth, pineconeHealth] = await Promise.all([
        basicHealthPromise,
        pineconeHealthPromise
      ]);

      const responseTime = Date.now() - startTime;
      const currentTime = new Date().toISOString();

      // Process basic health
      const basicStatus: HealthStatus = {
        service: 'API Server',
        status: 'error' in basicHealth ? 'error' : 'healthy',
        message: 'error' in basicHealth ? basicHealth.error : basicHealth.service || 'Service operational',
        responseTime: Math.round(responseTime / 2), // Approximate individual response time
        lastCheck: currentTime,
        details: 'error' in basicHealth ? undefined : basicHealth,
      };

      // Process Pinecone health
      const pineconeStatus: HealthStatus = {
        service: 'Pinecone Database',
        status: 'error' in pineconeHealth ? 'error' : 
                (pineconeHealth.success ? 'healthy' : 'warning'),
        message: 'error' in pineconeHealth ? pineconeHealth.error : 
                (pineconeHealth.message || 'Database connection established'),
        responseTime: Math.round(responseTime / 2),
        lastCheck: currentTime,
        details: 'error' in pineconeHealth ? undefined : {
          'Index Name': pineconeHealth.index_name,
          'Dimension': pineconeHealth.config?.dimension,
          'Metric': pineconeHealth.config?.metric,
          'Cloud': pineconeHealth.config?.cloud,
          'Region': pineconeHealth.config?.region,
        },
      };

      const statuses = [basicStatus, pineconeStatus];
      setHealthStatuses(statuses);

      // Calculate overall health
      const healthyCount = statuses.filter(s => s.status === 'healthy').length;
      const hasErrors = statuses.some(s => s.status === 'error');
      const hasWarnings = statuses.some(s => s.status === 'warning');

      setOverallHealth({
        status: hasErrors ? 'error' : hasWarnings ? 'warning' : 'healthy',
        services: statuses.length,
        healthyCount,
        lastUpdate: currentTime,
      });

      if (onRefresh) {
        onRefresh();
      }
    } catch (err) {
      console.error('Health check failed:', err);
      setError(err instanceof Error ? err.message : 'Health check failed');
    } finally {
      setIsLoading(false);
    }
  }, [onRefresh]);

  // Auto-refresh functionality
  useEffect(() => {
    if (autoRefresh && refreshInterval > 0) {
      const id = setInterval(fetchHealthData, refreshInterval * 1000);
      setIntervalId(id);
      return () => clearInterval(id);
    } else if (intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  }, [autoRefresh, refreshInterval, fetchHealthData]);

  // Initial load
  useEffect(() => {
    fetchHealthData();
  }, [fetchHealthData]);

  const handleManualRefresh = () => {
    fetchHealthData();
  };

  const handleAutoRefreshToggle = (enabled: boolean) => {
    setAutoRefresh(enabled);
    if (!enabled && intervalId) {
      clearInterval(intervalId);
      setIntervalId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="flex items-center">
            {overallHealth.status === 'healthy' && (
              <CheckCircleIcon className="h-6 w-6 text-green-600 mr-2" />
            )}
            {overallHealth.status === 'warning' && (
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-600 mr-2" />
            )}
            {overallHealth.status === 'error' && (
              <ExclamationTriangleIcon className="h-6 w-6 text-red-600 mr-2" />
            )}
            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                System Health Status
              </h2>
              <p className="text-sm text-gray-600">
                {overallHealth.healthyCount} of {overallHealth.services} services healthy
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          {/* Auto-refresh Controls */}
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <Switch
                checked={autoRefresh}
                onChange={handleAutoRefreshToggle}
                className="group relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 data-checked:bg-indigo-600"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out group-data-checked:translate-x-5"
                />
              </Switch>
              <div className="flex items-center text-sm text-gray-600">
                {autoRefresh ? (
                  <PlayIcon className="h-4 w-4 mr-1 text-green-600" />
                ) : (
                  <PauseIcon className="h-4 w-4 mr-1 text-gray-400" />
                )}
                Auto-refresh
              </div>
            </div>

            {autoRefresh && (
              <select
                value={refreshInterval}
                onChange={(e) => setRefreshInterval(Number(e.target.value))}
                className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value={10}>10s</option>
                <option value={30}>30s</option>
                <option value={60}>1m</option>
                <option value={300}>5m</option>
              </select>
            )}
          </div>

          {/* Manual Refresh */}
          <button
            onClick={handleManualRefresh}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          >
            <ArrowPathIcon className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Last Update Info */}
      <div className="flex items-center text-sm text-gray-500">
        <ClockIcon className="h-4 w-4 mr-1" />
        Last updated: {new Date(overallHealth.lastUpdate).toLocaleString()}
        {autoRefresh && (
          <span className="ml-2 text-green-600">
            (Auto-refreshing every {refreshInterval}s)
          </span>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="rounded-md bg-red-50 p-4">
          <div className="flex">
            <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Health Check Error
              </h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Health Status Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {isLoading && healthStatuses.length === 0 ? (
          <>
            <HealthStatusCard 
              healthStatus={{ service: 'Loading...', status: 'unknown' }} 
              isLoading={true} 
            />
            <HealthStatusCard 
              healthStatus={{ service: 'Loading...', status: 'unknown' }} 
              isLoading={true} 
            />
          </>
        ) : (
          healthStatuses.map((status, index) => (
            <HealthStatusCard
              key={`${status.service}-${index}`}
              healthStatus={status}
              icon={status.service.includes('Pinecone') ? CubeIcon : ServerIcon}
              isLoading={isLoading && !status.lastCheck}
            />
          ))
        )}
      </div>

      {/* Overall Stats Summary */}
      <div className="bg-gray-50 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <ChartBarIcon className="h-6 w-6 text-gray-600" />
            <h3 className="text-lg font-medium text-gray-900">Health Summary</h3>
          </div>
          <div className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${
            overallHealth.status === 'healthy' ? 'bg-green-100 text-green-800' :
            overallHealth.status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
            'bg-red-100 text-red-800'
          }`}>
            Overall: {overallHealth.status}
          </div>
        </div>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
          <div>
            <span className="font-medium text-gray-700">Total Services:</span>
            <span className="ml-2 text-gray-900">{overallHealth.services}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Healthy:</span>
            <span className="ml-2 text-green-600 font-semibold">{overallHealth.healthyCount}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Issues:</span>
            <span className="ml-2 text-red-600 font-semibold">
              {overallHealth.services - overallHealth.healthyCount}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}