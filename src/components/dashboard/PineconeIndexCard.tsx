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
  metric: string;
  dimensions: number;
  host: string;
  cloud: string;
  region: string;
  type: string;
  capacityMode: string;
  recordCount: number;
  environment: string;
  project: string;
}

interface PineconeIndexCardProps {
  indexInfo?: PineconeIndexInfo;
  isLoading?: boolean;
}

const defaultIndexInfo: PineconeIndexInfo = {
  metric: 'cosine',
  dimensions: 3072,
  host: 'standard-dense-py-rjoj9sl.svc.gcp-europe-west4-de1d.pinecone.io',
  cloud: 'GCP',
  region: 'europe-west4',
  type: 'Dense',
  capacityMode: 'Serverless',
  recordCount: 39,
  environment: 'development',
  project: 'vector-indexer'
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
            <div className="flex items-center mb-4">
              <div className="h-6 w-6 bg-gray-300 rounded mr-2"></div>
              <div className="h-6 bg-gray-300 rounded w-48"></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
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

  return (
    <div className="bg-white overflow-hidden shadow-sm rounded-lg border border-gray-200">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <div className="rounded-md bg-indigo-500 p-2 mr-3">
              <ServerIcon className="h-6 w-6 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Pinecone Index Configuration</h3>
              <p className="text-sm text-gray-500">Current vector database settings and status</p>
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