'use client';

import { 
  CloudIcon, 
  ServerIcon, 
  CpuChipIcon,
  GlobeAltIcon,
  CubeIcon,
  TagIcon 
} from '@heroicons/react/24/outline';

interface PineconeIndexInfo {
  success: boolean;
  index_name: string;
  metric: string;
  dimensions: number;
  host: string;
  cloud: string;
  region: string;
  type: string;
  capacityMode: string;
  recordCount: number;
  message: string;
}

interface PineconeIndexCardProps {
  indexInfo?: PineconeIndexInfo;
  isLoading?: boolean;
}

const defaultIndexInfo: PineconeIndexInfo = {
  success: true,
  index_name: 'vector-indexer-index',
  metric: 'cosine',
  dimensions: 3072,
  host: 'standard-dense-py-rjoj9sl.svc.gcp-europe-west4-de1d.pinecone.io',
  cloud: 'GCP',
  region: 'europe-west4',
  type: 'Dense',
  capacityMode: 'Serverless',
  recordCount: 39,
  message: 'Index is healthy and operational'
};

export default function PineconeIndexCard({ 
  indexInfo = defaultIndexInfo, 
  isLoading = false 
}: PineconeIndexCardProps) {
  if (isLoading) {
    return (
      <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:p-6">
          <div className="animate-pulse">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gray-300 rounded mr-3"></div>
                <div>
                  <div className="h-5 bg-gray-300 rounded w-48 mb-2"></div>
                  <div className="h-4 bg-gray-300 rounded w-64"></div>
                </div>
              </div>
              <div className="text-right">
                <div className="h-4 bg-gray-300 rounded w-20 mb-1"></div>
                <div className="h-6 bg-gray-300 rounded w-16"></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="space-y-2">
                  <div className="h-4 bg-gray-300 rounded w-20"></div>
                  <div className="h-5 bg-gray-300 rounded w-32"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Handle case when no data is available
  if (!indexInfo) {
    return (
      <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
        <div className="px-4 py-5 sm:p-6">
          <div className="text-center py-8">
            <ServerIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">Unable to load Pinecone data</h3>
            <p className="mt-1 text-sm text-gray-500">
              Could not connect to Pinecone API. Please check your connection and try again.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="rounded-md bg-indigo-500 p-2 mr-3">
              <ServerIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="text-lg font-semibold text-gray-900">Pinecone Index Configuration</h3>
                <div className={`w-3 h-3 rounded-full ${indexInfo.success ? 'bg-green-500' : 'bg-red-500'}`}></div>
              </div>
              <p className="text-sm text-gray-500">
                {indexInfo.index_name} • {indexInfo.message}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-sm text-gray-500">Record Count</div>
            <div className="text-2xl font-bold text-indigo-600">{indexInfo.recordCount}</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Metric & Dimensions */}
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <CpuChipIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Metric</div>
              <div className="font-medium text-gray-900">{indexInfo.metric}</div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <CubeIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Dimensions</div>
              <div className="font-medium text-gray-900">{indexInfo.dimensions.toLocaleString()}</div>
            </div>
          </div>

          {/* Cloud & Region */}
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <CloudIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Cloud</div>
              <div className="font-medium text-gray-900">{indexInfo.cloud}</div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <GlobeAltIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Region</div>
              <div className="font-medium text-gray-900">{indexInfo.region}</div>
            </div>
          </div>

          {/* Type & Capacity */}
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <ServerIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Type</div>
              <div className="font-medium text-gray-900">{indexInfo.type}</div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <TagIcon className="h-5 w-5 text-gray-400" />
            </div>
            <div>
              <div className="text-sm text-gray-500">Capacity Mode</div>
              <div className="font-medium text-gray-900">{indexInfo.capacityMode}</div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}