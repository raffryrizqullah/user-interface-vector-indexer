'use client';

import { 
  ChevronDownIcon, 
  ClockIcon, 
  CubeIcon,
  DocumentTextIcon,
  EyeIcon,
  ArrowDownTrayIcon,
  InformationCircleIcon
} from '@heroicons/react/24/outline';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { SearchResults } from '@/components/forms/VectorSearchForm';
import { VectorRecord, PrefixSearchResponse, VectorFetchResponse } from '@/lib/api';

interface SearchResultsDisplayProps {
  results: SearchResults | null;
  loading: boolean;
  error: string | null;
}


function formatTimestamp(timestamp: string): string {
  return new Date(timestamp).toLocaleString();
}

function exportResults(results: SearchResults) {
  const dataStr = JSON.stringify(results, null, 2);
  const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
  
  const exportFileDefaultName = `vector-search-${results.type}-${new Date().toISOString().slice(0, 19)}.json`;
  
  const linkElement = document.createElement('a');
  linkElement.setAttribute('href', dataUri);
  linkElement.setAttribute('download', exportFileDefaultName);
  linkElement.click();
}

function VectorMetadataDisplay({ metadata }: { metadata?: Record<string, unknown> }) {
  if (!metadata || Object.keys(metadata).length === 0) {
    return (
      <div className="text-sm text-gray-500 italic">No metadata available</div>
    );
  }

  return (
    <div className="space-y-2">
      {Object.entries(metadata).map(([key, value]) => (
        <div key={key} className="flex flex-col sm:flex-row sm:items-start gap-1 sm:gap-3">
          <span className="text-sm font-medium text-gray-900 min-w-0 sm:w-32 flex-shrink-0">
            {key}:
          </span>
          <span className="text-sm text-gray-700 break-words min-w-0 flex-1">
            {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
          </span>
        </div>
      ))}
    </div>
  );
}

function VectorRecordCard({ record, index }: { record: VectorRecord; index: number }) {
  const hasValues = record.values && record.values.length > 0;
  const hasMetadata = record.metadata && Object.keys(record.metadata).length > 0;

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors duration-200">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
              <span className="text-sm font-semibold text-indigo-600">#{index + 1}</span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm font-medium text-gray-900 truncate">
              {record.id}
            </h3>
            <div className="flex items-center text-xs text-gray-500 space-x-4">
              {hasMetadata && (
                <span className="flex items-center">
                  <InformationCircleIcon className="w-3 h-3 mr-1" />
                  Metadata
                </span>
              )}
              {hasValues && (
                <span className="flex items-center">
                  <CubeIcon className="w-3 h-3 mr-1" />
                  {record.values?.length} dimensions
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {hasMetadata && (
        <Disclosure>
          <DisclosureButton className="flex w-full justify-between rounded-lg bg-gray-50 px-3 py-2 text-left text-sm font-medium text-gray-900 hover:bg-gray-100 focus:outline-none focus-visible:ring focus-visible:ring-indigo-500/75">
            <span className="flex items-center">
              <EyeIcon className="h-4 w-4 mr-2" />
              View Metadata
            </span>
            <ChevronDownIcon className="h-4 w-4 text-gray-500 group-data-open:rotate-180 transition-transform duration-200" />
          </DisclosureButton>
          <DisclosurePanel className="px-3 py-3 text-sm">
            <VectorMetadataDisplay metadata={record.metadata} />
          </DisclosurePanel>
        </Disclosure>
      )}

      {hasValues && (
        <Disclosure>
          <DisclosureButton className="flex w-full justify-between rounded-lg bg-gray-50 px-3 py-2 text-left text-sm font-medium text-gray-900 hover:bg-gray-100 focus:outline-none focus-visible:ring focus-visible:ring-indigo-500/75 mt-2">
            <span className="flex items-center">
              <CubeIcon className="h-4 w-4 mr-2" />
              View Vector Values ({record.values?.length} dimensions)
            </span>
            <ChevronDownIcon className="h-4 w-4 text-gray-500 group-data-open:rotate-180 transition-transform duration-200" />
          </DisclosureButton>
          <DisclosurePanel className="px-3 py-3 text-sm">
            <div className="bg-gray-100 rounded p-3 max-h-32 overflow-y-auto">
              <pre className="text-xs text-gray-700 whitespace-pre-wrap break-words">
                {JSON.stringify(record.values, null, 2)}
              </pre>
            </div>
          </DisclosurePanel>
        </Disclosure>
      )}
    </div>
  );
}

export default function SearchResultsDisplay({ results, loading, error }: SearchResultsDisplayProps) {
  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Search Error
            </h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!results) {
    return (
      <div className="text-center py-12">
        <CubeIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No search performed</h3>
        <p className="mt-1 text-sm text-gray-500">
          Use the search form above to find vectors in your database.
        </p>
      </div>
    );
  }

  // Extract records based on result type
  let records: VectorRecord[] = [];
  let totalCount = 0;

  if (results.type === 'prefix') {
    const prefixData = results.data as PrefixSearchResponse;
    records = prefixData.matches || [];
    totalCount = records.length;
  } else {
    const fetchData = results.data as VectorFetchResponse;
    records = Object.values(fetchData.vectors || {});
    totalCount = records.length;
  }

  return (
    <div className="space-y-6">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            {results.type === 'prefix' ? (
              <DocumentTextIcon className="h-5 w-5 text-indigo-600" />
            ) : (
              <CubeIcon className="h-5 w-5 text-indigo-600" />
            )}
            <h3 className="text-lg font-medium text-gray-900">
              Search Results
            </h3>
          </div>
          <div className="flex items-center text-sm text-gray-500">
            <ClockIcon className="h-4 w-4 mr-1" />
            {formatTimestamp(results.timestamp)}
          </div>
        </div>
        
        <button
          onClick={() => exportResults(results)}
          className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <ArrowDownTrayIcon className="h-4 w-4 mr-2" />
          Export
        </button>
      </div>

      {/* Search Query Info */}
      <div className="bg-gray-50 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">Search Query</h4>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 text-sm">
          <div>
            <span className="font-medium text-gray-700">Type:</span>
            <span className="ml-2 capitalize text-gray-900">{results.type}</span>
          </div>
          <div>
            <span className="font-medium text-gray-700">Namespace:</span>
            <span className="ml-2 text-gray-900">{results.query.namespace}</span>
          </div>
          {results.query.prefix && (
            <div>
              <span className="font-medium text-gray-700">Prefix:</span>
              <span className="ml-2 text-gray-900">{results.query.prefix}</span>
            </div>
          )}
          <div>
            <span className="font-medium text-gray-700">Limit:</span>
            <span className="ml-2 text-gray-900">{results.query.limit}</span>
          </div>
        </div>
      </div>

      {/* Results Count */}
      <div className="border-b border-gray-200 pb-4">
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-700">
            Found <span className="font-semibold text-gray-900">{totalCount}</span> 
            {totalCount === 1 ? ' vector' : ' vectors'}
            {results.query.limit && totalCount === results.query.limit && (
              <span className="text-gray-500"> (limited to {results.query.limit})</span>
            )}
          </p>
        </div>
      </div>

      {/* Results Grid */}
      {records.length > 0 ? (
        <div className="space-y-4">
          {records.map((record, index) => (
            <VectorRecordCard key={record.id} record={record} index={index} />
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <CubeIcon className="mx-auto h-8 w-8 text-gray-400" />
          <h3 className="mt-2 text-sm font-semibold text-gray-900">No vectors found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Try adjusting your search criteria or checking a different namespace.
          </p>
        </div>
      )}
    </div>
  );
}