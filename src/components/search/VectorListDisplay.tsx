'use client';

import { useState, useLayoutEffect, useRef, useMemo } from 'react';
import { 
  ClockIcon, 
  CubeIcon,
  TrashIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';
import { Dialog, DialogBackdrop, DialogPanel } from '@headlessui/react';
import { SearchResults } from '@/components/forms/VectorSearchForm';
import { VectorFetchResponse, VectorListResponse, ApiService } from '@/lib/api';

interface VectorListDisplayProps {
  results: SearchResults | null;
  loading: boolean;
  error: string | null;
  onRefresh?: () => void;
}

interface VectorRecordWithMetadata {
  id: string;
  namespace: string;
}

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function VectorListDisplay({ results, loading, error, onRefresh }: VectorListDisplayProps) {
  const checkbox = useRef<HTMLInputElement>(null);
  const [checked, setChecked] = useState(false);
  const [indeterminate, setIndeterminate] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState<VectorRecordWithMetadata[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Extract records from results
  const records = useMemo((): VectorRecordWithMetadata[] => {
    if (!results) return [];
    
    console.log('🔍 Processing results:', results.type, results.data);
    
    if (results.type === 'search-by-id') {
      const fetchData = results.data as VectorFetchResponse;
      const namespace = results.query.namespace;
      const searchRecords = Object.values(fetchData.vectors || {}).map(record => ({
        id: record.id,
        namespace: namespace,
      }));
      console.log('📋 Search by ID records:', searchRecords.length, 'namespace:', namespace);
      return searchRecords;
    } else if (results.type === 'list-records') {
      const listData = results.data as VectorListResponse;
      const namespace = listData.namespace;
      const listRecords = (listData.vector_ids || []).map(id => ({
        id,
        namespace: namespace,
      }));
      console.log('📋 List records:', listRecords.length, 'namespace:', namespace, 'IDs:', listData.vector_ids?.slice(0, 5));
      return listRecords;
    }
    
    return [];
  }, [results]);

  useLayoutEffect(() => {
    const isIndeterminate = selectedRecords.length > 0 && selectedRecords.length < records.length;
    setChecked(selectedRecords.length === records.length && records.length > 0);
    setIndeterminate(isIndeterminate);
    if (checkbox.current) {
      checkbox.current.indeterminate = isIndeterminate;
    }
  }, [selectedRecords, records]);

  function toggleAll() {
    setSelectedRecords(checked || indeterminate ? [] : records);
    setChecked(!checked && !indeterminate);
    setIndeterminate(false);
  }

  const handleDelete = async () => {
    if (selectedRecords.length === 0) return;

    setIsDeleting(true);
    setDeleteError(null);

    try {
      const ids = selectedRecords.map(record => record.id);
      const namespace = results?.query.namespace || 'default';
      
      await ApiService.deleteVectorsByIds(ids, namespace, false, true);
      
      // Refresh the data after successful deletion
      setSelectedRecords([]);
      setShowDeleteDialog(false);
      if (onRefresh) {
        onRefresh();
      }
    } catch (error) {
      console.error('Delete error:', error);
      setDeleteError(error instanceof Error ? error.message : 'Delete failed');
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="flex items-center space-x-3">
              <div className="h-4 w-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded flex-1"></div>
              <div className="h-4 bg-gray-200 rounded w-32"></div>
              <div className="h-4 bg-gray-200 rounded w-20"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4">
        <div className="flex">
          <ExclamationTriangleIcon className="h-5 w-5 text-red-400" />
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">
              Error Loading Records
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
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No data loaded</h3>
        <p className="mt-1 text-sm text-gray-500">
          Use the form above to search for vectors or list records.
        </p>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div className="text-center py-12">
        <CubeIcon className="mx-auto h-8 w-8 text-gray-400" />
        <h3 className="mt-2 text-sm font-semibold text-gray-900">No vectors found</h3>
        <p className="mt-1 text-sm text-gray-500">
          No records match your search criteria.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="sm:flex sm:items-center">
        <div className="sm:flex-auto">
          <h1 className="text-base font-semibold text-gray-900">Vector Records</h1>
          <p className="mt-2 text-sm text-gray-700">
            {results.type === 'search-by-id' ? 
              `Found ${records.length} records by specific IDs` :
              `Showing ${records.length} records from ${results.query.namespace} namespace`
            }
          </p>
        </div>
        <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
          <div className="text-sm text-gray-500">
            <ClockIcon className="inline h-4 w-4 mr-1" />
            {new Date(results.timestamp).toLocaleString()}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="flow-root">
        <div className="-mx-4 -my-2 overflow-x-auto sm:-mx-6 lg:-mx-8">
          <div className="inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8">
            <div className="relative">
              {selectedRecords.length > 0 && (
                <div className="absolute top-0 left-14 flex h-12 items-center space-x-3 bg-white sm:left-12">
                  <button
                    type="button"
                    onClick={() => setShowDeleteDialog(true)}
                    className="inline-flex items-center rounded-sm bg-white px-2 py-1 text-sm font-semibold text-red-700 ring-1 shadow-xs ring-red-300 ring-inset hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-white"
                  >
                    <TrashIcon className="h-4 w-4 mr-1" />
                    Delete {selectedRecords.length} record{selectedRecords.length > 1 ? 's' : ''}
                  </button>
                </div>
              )}
              <table className="min-w-full table-fixed divide-y divide-gray-300">
                <thead>
                  <tr>
                    <th scope="col" className="relative px-7 sm:w-12 sm:px-6">
                      <div className="group absolute top-1/2 left-4 -mt-2 grid size-4 grid-cols-1">
                        <input
                          type="checkbox"
                          className="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 indeterminate:border-indigo-600 indeterminate:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
                          ref={checkbox}
                          checked={checked}
                          onChange={toggleAll}
                        />
                        <svg
                          className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25"
                          viewBox="0 0 14 14"
                          fill="none"
                        >
                          <path
                            className="opacity-0 group-has-checked:opacity-100"
                            d="M3 8L6 11L11 3.5"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                          <path
                            className="opacity-0 group-has-indeterminate:opacity-100"
                            d="M3 7H11"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </div>
                    </th>
                    <th scope="col" className="min-w-[12rem] py-3.5 pr-3 text-left text-sm font-semibold text-gray-900">
                      Vector ID
                    </th>
                    <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">
                      Namespace
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 bg-white">
                  {records.map((record) => (
                    <tr key={record.id} className={selectedRecords.includes(record) ? 'bg-gray-50' : undefined}>
                      <td className="relative px-7 sm:w-12 sm:px-6">
                        {selectedRecords.includes(record) && (
                          <div className="absolute inset-y-0 left-0 w-0.5 bg-indigo-600" />
                        )}
                        <div className="group absolute top-1/2 left-4 -mt-2 grid size-4 grid-cols-1">
                          <input
                            type="checkbox"
                            className="col-start-1 row-start-1 appearance-none rounded-sm border border-gray-300 bg-white checked:border-indigo-600 checked:bg-indigo-600 indeterminate:border-indigo-600 indeterminate:bg-indigo-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:border-gray-300 disabled:bg-gray-100 disabled:checked:bg-gray-100 forced-colors:appearance-auto"
                            value={record.id}
                            checked={selectedRecords.includes(record)}
                            onChange={(e) =>
                              setSelectedRecords(
                                e.target.checked
                                  ? [...selectedRecords, record]
                                  : selectedRecords.filter((r) => r !== record),
                              )
                            }
                          />
                          <svg
                            className="pointer-events-none col-start-1 row-start-1 size-3.5 self-center justify-self-center stroke-white group-has-disabled:stroke-gray-950/25"
                            viewBox="0 0 14 14"
                            fill="none"
                          >
                            <path
                              className="opacity-0 group-has-checked:opacity-100"
                              d="M3 8L6 11L11 3.5"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                            <path
                              className="opacity-0 group-has-indeterminate:opacity-100"
                              d="M3 7H11"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                      </td>
                      <td
                        className={classNames(
                          'py-4 pr-3 text-sm font-medium whitespace-nowrap',
                          selectedRecords.includes(record) ? 'text-indigo-600' : 'text-gray-900',
                        )}
                      >
                        <div className="flex items-center">
                          <CubeIcon className="h-4 w-4 mr-2 text-gray-400" />
                          {record.id}
                        </div>
                      </td>
                      <td className="px-3 py-4 text-sm whitespace-nowrap text-gray-500">
                        <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                          {record.namespace}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onClose={setShowDeleteDialog} className="relative z-10">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in"
        />

        <div className="fixed inset-0 z-10 w-screen overflow-y-auto">
          <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
            <DialogPanel
              transition
              className="relative transform overflow-hidden rounded-lg bg-white text-left shadow-xl transition-all data-closed:translate-y-4 data-closed:opacity-0 data-enter:duration-300 data-enter:ease-out data-leave:duration-200 data-leave:ease-in sm:my-8 sm:w-full sm:max-w-lg data-closed:sm:translate-y-0 data-closed:sm:scale-95"
            >
              <div className="bg-white px-4 pb-4 pt-5 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <ExclamationTriangleIcon aria-hidden="true" className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:ml-4 sm:mt-0 sm:text-left">
                    <h3 className="text-base font-semibold text-gray-900">
                      Delete Vector Records
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-gray-500">
                        Are you sure you want to delete {selectedRecords.length} vector record{selectedRecords.length > 1 ? 's' : ''}? 
                        This action cannot be undone.
                      </p>
                      {deleteError && (
                        <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
                          {deleteError}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-gray-50 px-4 py-3 sm:flex sm:flex-row-reverse sm:px-6">
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="inline-flex w-full justify-center rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-xs hover:bg-red-500 disabled:bg-red-400 sm:ml-3 sm:w-auto"
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  type="button"
                  data-autofocus
                  onClick={() => setShowDeleteDialog(false)}
                  className="mt-3 inline-flex w-full justify-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-xs ring-1 ring-inset ring-gray-300 hover:bg-gray-50 sm:mt-0 sm:w-auto"
                >
                  Cancel
                </button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </div>
  );
}