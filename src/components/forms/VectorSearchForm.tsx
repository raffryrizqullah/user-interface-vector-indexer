'use client';

import { useState, useCallback } from 'react';
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  ArrowPathIcon,
  DocumentTextIcon,
  CubeIcon
} from '@heroicons/react/24/outline';
import { 
  MagnifyingGlassIcon as MagnifyingGlassIconSolid
} from '@heroicons/react/24/solid';
import { Switch, Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { ChevronDownIcon } from '@heroicons/react/20/solid';
import { ApiService, PrefixSearchResponse, VectorFetchResponse, VectorListResponse } from '@/lib/api';

export interface SearchFilters {
  namespace: string;
  limit: number;
  includeMetadata: boolean;
  searchType: 'search-by-id' | 'list-records';
  specificIds: string;
  pageSize: number;
  currentPage: number;
}

export interface SearchResults {
  type: 'search-by-id' | 'list-records';
  data: PrefixSearchResponse | VectorFetchResponse | VectorListResponse;
  timestamp: string;
  query: SearchFilters;
}

interface VectorSearchFormProps {
  onSearchResults: (results: SearchResults | null) => void;
  onLoading: (loading: boolean) => void;
  onError: (error: string | null) => void;
}

const namespaceOptions = [
  { value: 'default', label: 'Default', description: 'Main production namespace' },
  { value: 'production', label: 'Production', description: 'Production environment' },
  { value: 'testing', label: 'Testing', description: 'Testing and development' },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function VectorSearchForm({ onSearchResults, onLoading, onError }: VectorSearchFormProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    namespace: 'default',
    limit: 50,
    includeMetadata: true,
    searchType: 'search-by-id',
    specificIds: '',
    pageSize: 25,
    currentPage: 1,
  });
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(async () => {
    if (filters.searchType === 'search-by-id' && !filters.specificIds.trim()) {
      onError('Please enter specific vector IDs to search');
      return;
    }

    setIsSearching(true);
    onLoading(true);
    onError(null);

    try {
      let results: SearchResults;

      if (filters.searchType === 'search-by-id') {
        const ids = filters.specificIds.split(',').map(id => id.trim()).filter(Boolean);
        if (ids.length === 0) {
          onError('Please enter valid vector IDs separated by commas');
          return;
        }
        
        const response = await ApiService.fetchVectorRecords(
          ids,
          filters.namespace,
          filters.includeMetadata,
          false
        );
        results = {
          type: 'search-by-id',
          data: response,
          timestamp: new Date().toISOString(),
          query: filters,
        };
      } else {
        // List all records with pagination
        const response = await ApiService.listVectorRecordsWithPagination(
          filters.namespace,
          undefined,
          filters.pageSize,
          undefined,
          false
        );
        results = {
          type: 'list-records',
          data: response,
          timestamp: new Date().toISOString(),
          query: filters,
        };
      }

      onSearchResults(results);
    } catch (error) {
      console.error('Search error:', error);
      onError(error instanceof Error ? error.message : 'Search failed');
    } finally {
      setIsSearching(false);
      onLoading(false);
    }
  }, [filters, onSearchResults, onLoading, onError]);

  const handleClear = () => {
    setFilters({
      namespace: 'default',
      limit: 50,
      includeMetadata: true,
      searchType: 'search-by-id',
      specificIds: '',
      pageSize: 25,
      currentPage: 1,
    });
    onSearchResults(null);
    onError(null);
  };

  return (
    <div className="space-y-6">
      {/* Search Type Selection */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <button
          type="button"
          onClick={() => setFilters(prev => ({ ...prev, searchType: 'search-by-id' }))}
          className={classNames(
            'relative flex items-center p-4 rounded-lg border-2 text-left transition-all duration-200',
            filters.searchType === 'search-by-id'
              ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
              : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300 hover:bg-gray-50'
          )}
        >
          <div className="flex items-center">
            <MagnifyingGlassIcon className="h-6 w-6 mr-3" />
            <div>
              <div className="font-semibold">Search by ID</div>
              <div className="text-sm text-gray-600">Search by specific vector IDs</div>
            </div>
          </div>
          {filters.searchType === 'search-by-id' && (
            <div className="absolute top-2 right-2">
              <MagnifyingGlassIconSolid className="h-5 w-5 text-indigo-600" />
            </div>
          )}
        </button>

        <button
          type="button"
          onClick={() => setFilters(prev => ({ ...prev, searchType: 'list-records' }))}
          className={classNames(
            'relative flex items-center p-4 rounded-lg border-2 text-left transition-all duration-200',
            filters.searchType === 'list-records'
              ? 'border-indigo-600 bg-indigo-50 text-indigo-900'
              : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300 hover:bg-gray-50'
          )}
        >
          <div className="flex items-center">
            <DocumentTextIcon className="h-6 w-6 mr-3" />
            <div>
              <div className="font-semibold">List Records</div>
              <div className="text-sm text-gray-600">List all records with pagination</div>
            </div>
          </div>
          {filters.searchType === 'list-records' && (
            <div className="absolute top-2 right-2">
              <CubeIcon className="h-5 w-5 text-indigo-600" />
            </div>
          )}
        </button>
      </div>

      {/* Search Input */}
      <div className="space-y-4">
        {filters.searchType === 'search-by-id' ? (
          <div>
            <label htmlFor="specificIds" className="block text-sm font-medium text-gray-900 mb-2">
              Vector IDs (comma-separated)
            </label>
            <textarea
              id="specificIds"
              name="specificIds"
              rows={3}
              value={filters.specificIds}
              onChange={(e) => setFilters(prev => ({ ...prev, specificIds: e.target.value }))}
              placeholder="Enter specific vector IDs, separated by commas&#10;Example: doc_123_chunk_0, doc_123_chunk_1, doc_456_chunk_0"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
        ) : (
          <div>
            <label htmlFor="pageSize" className="block text-sm font-medium text-gray-900 mb-2">
              Records per page
            </label>
            <select
              id="pageSize"
              name="pageSize"
              value={filters.pageSize}
              onChange={(e) => setFilters(prev => ({ ...prev, pageSize: parseInt(e.target.value) }))}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            >
              <option value={10}>10 records</option>
              <option value={25}>25 records</option>
              <option value={50}>50 records</option>
              <option value={100}>100 records</option>
            </select>
          </div>
        )}

        {/* Namespace Selection */}
        <div>
          <label htmlFor="namespace" className="block text-sm font-medium text-gray-900 mb-2">
            Namespace
          </label>
          <select
            id="namespace"
            name="namespace"
            value={filters.namespace}
            onChange={(e) => setFilters(prev => ({ ...prev, namespace: e.target.value }))}
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          >
            {namespaceOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label} - {option.description}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Advanced Filters */}
      <Disclosure>
        <DisclosureButton className="flex w-full justify-between rounded-lg bg-gray-50 px-4 py-2 text-left text-sm font-medium text-gray-900 hover:bg-gray-100 focus:outline-none focus-visible:ring focus-visible:ring-indigo-500/75">
          <span className="flex items-center">
            <FunnelIcon className="h-5 w-5 mr-2" />
            Advanced Options
          </span>
          <ChevronDownIcon className="h-5 w-5 text-gray-500 group-data-open:rotate-180 transition-transform duration-200" />
        </DisclosureButton>
        <DisclosurePanel className="px-4 pb-2 pt-4 text-sm text-gray-500">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="flex flex-col">
                <span className="text-sm font-medium text-gray-900">Include Metadata</span>
                <span className="text-sm text-gray-500">Fetch vector metadata in results</span>
              </span>
              <Switch
                checked={filters.includeMetadata}
                onChange={(checked) => setFilters(prev => ({ ...prev, includeMetadata: checked }))}
                className="group relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent bg-gray-200 transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2 data-checked:bg-indigo-600"
              >
                <span
                  aria-hidden="true"
                  className="pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-sm ring-0 transition duration-200 ease-in-out group-data-checked:translate-x-5"
                />
              </Switch>
            </div>
          </div>
        </DisclosurePanel>
      </Disclosure>

      {/* Action Buttons */}
      <div className="flex items-center justify-between gap-4 pt-4 border-t border-gray-200">
        <button
          type="button"
          onClick={handleClear}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition-colors duration-200"
        >
          Clear
        </button>
        
        <button
          type="button"
          onClick={handleSearch}
          disabled={isSearching || (filters.searchType === 'search-by-id' && !filters.specificIds.trim())}
          className="px-6 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {isSearching ? (
            <>
              <ArrowPathIcon className="h-4 w-4 mr-2 animate-spin" />
              {filters.searchType === 'search-by-id' ? 'Searching...' : 'Loading...'}
            </>
          ) : (
            <>
              <MagnifyingGlassIcon className="h-4 w-4 mr-2" />
              {filters.searchType === 'search-by-id' ? 'Search Vectors' : 'Load Records'}
            </>
          )}
        </button>
      </div>
    </div>
  );
}