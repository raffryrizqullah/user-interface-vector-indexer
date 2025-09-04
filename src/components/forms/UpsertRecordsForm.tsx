'use client';

import { useState, useCallback, useEffect } from 'react';
import { Switch, Disclosure } from '@headlessui/react';
import {
  DocumentPlusIcon,
  DocumentTextIcon,
  LinkIcon,
  GlobeAltIcon,
  PlusIcon,
  TrashIcon,
  CloudArrowUpIcon,
  ExclamationCircleIcon,
  CheckCircleIcon,
  Cog6ToothIcon,
  ChevronDownIcon,
  EyeIcon,
  EyeSlashIcon
} from '@heroicons/react/24/outline';
import { UploadedFile, SourceLink, AdditionalField, UpsertFormState } from '@/types/upsert';
import { AuthService } from '@/lib/auth';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function UpsertRecordsForm() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [uploadCounter, setUploadCounter] = useState(0);

  // Check authentication status on component mount
  useEffect(() => {
    setIsAuthenticated(AuthService.isAuthenticated());
  }, []);
  const [formState, setFormState] = useState<UpsertFormState>({
    files: [],
    sourceLinks: {},
    customMetadata: {
      sensitivity: 'internal',
      source_type: []
    },
    additionalFields: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [dragActive, setDragActive] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);

  // Handle file upload
  const handleFileUpload = useCallback((files: FileList) => {
    const validFiles: UploadedFile[] = [];
    const errors: string[] = [];

    Array.from(files).forEach((file) => {
      if (file.type === 'application/pdf') {
        if (file.size <= 10 * 1024 * 1024) { // 10MB limit
          validFiles.push({
            file,
            id: Math.random().toString(36).substr(2, 9),
            name: file.name,
            size: file.size,
            type: file.type,
            uploadIndex: uploadCounter + validFiles.length
          });
        } else {
          errors.push(`${file.name} exceeds 10MB limit`);
        }
      } else {
        errors.push(`${file.name} is not a PDF file`);
      }
    });

    if (validFiles.length > 0) {
      setFormState(prev => {
        const newFiles = [...prev.files, ...validFiles];
        const newSourceLinks = { ...prev.sourceLinks };
        const sourceTypes = [...new Set(newFiles.map(f => 'pdf'))];

        // Initialize source links for new files
        validFiles.forEach(file => {
          if (!newSourceLinks[file.name]) {
            newSourceLinks[file.name] = '';
          }
        });

        return {
          ...prev,
          files: newFiles,
          sourceLinks: newSourceLinks,
          customMetadata: {
            ...prev.customMetadata,
            source_type: sourceTypes
          }
        };
      });
      
      // Update upload counter
      setUploadCounter(prev => prev + validFiles.length);
    }

    if (errors.length > 0) {
      console.warn('File upload errors:', errors);
    }
  }, []);

  // Handle file input change
  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileUpload(e.target.files);
    }
  };

  // Handle drag events with improved detection
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => prev + 1);
    
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragCounter(prev => {
      const newCounter = prev - 1;
      if (newCounter === 0) {
        setDragActive(false);
      }
      return newCounter;
    });
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (e.dataTransfer) {
      e.dataTransfer.dropEffect = "copy";
    }
  }, []);

  // Handle drop event
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    setDragCounter(0);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files);
    }
  }, [handleFileUpload]);

  // Remove file
  const removeFile = (fileId: string) => {
    setFormState(prev => {
      const fileToRemove = prev.files.find(f => f.id === fileId);
      const newFiles = prev.files.filter(f => f.id !== fileId);
      const newSourceLinks = { ...prev.sourceLinks };
      
      if (fileToRemove) {
        delete newSourceLinks[fileToRemove.name];
      }
      
      const sourceTypes = [...new Set(newFiles.map(f => 'pdf'))];

      return {
        ...prev,
        files: newFiles,
        sourceLinks: newSourceLinks,
        customMetadata: {
          ...prev.customMetadata,
          source_type: sourceTypes.length > 0 ? sourceTypes : []
        }
      };
    });
  };

  // Update source link
  const updateSourceLink = (filename: string, url: string) => {
    setFormState(prev => ({
      ...prev,
      sourceLinks: {
        ...prev.sourceLinks,
        [filename]: url
      }
    }));
  };

  // Add additional field
  const addAdditionalField = () => {
    const newField: AdditionalField = {
      id: Math.random().toString(36).substr(2, 9),
      key: '',
      value: ''
    };
    setFormState(prev => ({
      ...prev,
      additionalFields: [...prev.additionalFields, newField]
    }));
  };

  // Update additional field
  const updateAdditionalField = (id: string, field: 'key' | 'value', value: string) => {
    setFormState(prev => ({
      ...prev,
      additionalFields: prev.additionalFields.map(f => 
        f.id === id ? { ...f, [field]: value } : f
      )
    }));
  };

  // Remove additional field
  const removeAdditionalField = (id: string) => {
    setFormState(prev => ({
      ...prev,
      additionalFields: prev.additionalFields.filter(f => f.id !== id)
    }));
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    setErrorMessage('');

    try {
      // Check if user is authenticated
      if (!AuthService.isAuthenticated()) {
        throw new Error('You must be logged in to upload files. Please login and try again.');
      }

      // Prepare form data
      const formData = new FormData();
      
      // Add files (API expects array of files under 'files' key)
      formState.files.forEach((file) => {
        formData.append('files', file.file);
      });

      // Prepare custom metadata
      const customMetadata = {
        ...formState.customMetadata,
        // Convert sensitivity string to proper format as expected by API
        sensitivity: formState.customMetadata.sensitivity
      };

      // Add additional fields to metadata
      formState.additionalFields.forEach(field => {
        if (field.key && field.value) {
          customMetadata[field.key] = field.value;
        }
      });

      // Prepare source links as array with consistent ordering based on uploadIndex
      const sourceLinksArray = formState.files
        .sort((a, b) => a.uploadIndex - b.uploadIndex) // Ensure consistent order based on upload sequence
        .map(file => formState.sourceLinks[file.name] || '');

      // Validation: Check if all files have corresponding source links
      const missingSourceLinks = formState.files
        .filter(file => !formState.sourceLinks[file.name] || formState.sourceLinks[file.name].trim() === '')
        .map(file => file.name);

      if (missingSourceLinks.length > 0) {
        console.warn('⚠️ Files without source links:', missingSourceLinks);
        // Could show warning but allow submission with empty source links
      }

      // Add metadata and source links as JSON strings (as required by API)
      formData.append('source_links', JSON.stringify(sourceLinksArray));
      formData.append('custom_metadata', JSON.stringify(customMetadata));

      // Debug logging with enhanced details
      console.log('🔍 Form submission details:');
      console.log('📄 Files count:', formState.files.length);
      console.log('📄 Files order:', formState.files.sort((a, b) => a.uploadIndex - b.uploadIndex).map(f => `${f.uploadIndex}: ${f.name}`));
      console.log('🔗 Source links array:', sourceLinksArray);
      console.log('🔗 Source links mapping:', formState.sourceLinks);
      console.log('📊 Custom metadata:', customMetadata);
      if (missingSourceLinks.length > 0) {
        console.log('⚠️ Missing source links:', missingSourceLinks);
      }

      // Submit to API using authenticated request
      const response = await AuthService.makeAuthenticatedRequest(
        'http://127.0.0.1:8000/create-records',
        {
          method: 'POST',
          body: formData,
        }
      );

      if (response.ok) {
        const result = await response.json();
        console.log('Upload successful:', result);
        setSubmitStatus('success');
        
        // Reset form
        setFormState({
          files: [],
          sourceLinks: {},
          customMetadata: {
            sensitivity: 'internal',
            source_type: []
          },
          additionalFields: []
        });
      } else {
        const errorData = await response.json().catch(() => null);
        let errorMsg = 'Upload failed. Please try again.';
        
        console.log('❌ Upload failed:', {
          status: response.status,
          statusText: response.statusText,
          errorData
        });
        
        if (response.status === 400) {
          errorMsg = errorData?.detail || 'Bad request. Please check your file format and metadata.';
        } else if (response.status === 403) {
          errorMsg = 'Access denied. Please check your permissions.';
        } else if (response.status === 401) {
          errorMsg = 'Authentication expired. Please login again.';
        } else if (response.status === 422) {
          errorMsg = errorData?.detail || 'Invalid request. Please check your files and try again.';
        } else if (response.status >= 500) {
          errorMsg = 'Server error. Please try again later.';
        }
        
        setErrorMessage(errorMsg);
        setSubmitStatus('error');
      }
    } catch (error) {
      console.error('Submit error:', error);
      
      let errorMsg = 'An unexpected error occurred. Please try again.';
      if (error instanceof Error) {
        errorMsg = error.message;
      }
      
      setErrorMessage(errorMsg);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-8 lg:space-y-12">
          {/* Header */}
          <div className="border-b border-gray-900/10 pb-8 lg:pb-12">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">Upsert Records</h2>
                <p className="mt-2 text-sm text-gray-600 max-w-2xl">
                  Upload PDF documents and configure their metadata for vector indexing.
                </p>
              </div>
              
              {/* Authentication Status */}
              <div className="shrink-0">
                {isAuthenticated ? (
                  <div className="inline-flex items-center rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700 border border-green-200">
                    <CheckCircleIcon className="size-4 mr-2" />
                    Authenticated
                  </div>
                ) : (
                  <div className="inline-flex items-center rounded-lg bg-red-50 px-3 py-2 text-sm font-medium text-red-700 border border-red-200">
                    <ExclamationCircleIcon className="size-4 mr-2" />
                    Please login to upload files
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* File Upload Section */}
          <div className="border-b border-gray-900/10 pb-12">
            <h3 className="text-base/7 font-semibold text-gray-900 mb-4">Upload PDF Files</h3>
            
            <div className="mt-10 space-y-8 sm:space-y-0 sm:divide-y sm:divide-gray-900/10">
              <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                <label htmlFor="file-upload" className="block text-sm/6 font-medium text-gray-900 sm:pt-1.5">
                  PDF Documents
                </label>
                <div className="mt-2 sm:col-span-2 sm:mt-0">
                  <div 
                    className={classNames(
                      "flex max-w-2xl justify-center rounded-lg border border-dashed px-6 py-10 transition-all duration-200 ease-in-out",
                      dragActive 
                        ? "border-indigo-600 bg-indigo-50 border-2 ring-2 ring-indigo-200 ring-offset-2 transform scale-105" 
                        : "border-gray-900/25 hover:border-gray-400"
                    )}
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                  >
                    <div className="text-center">
                      <div className={classNames(
                        "mx-auto size-12 transition-all duration-200",
                        dragActive ? "animate-bounce" : ""
                      )}>
                        <DocumentPlusIcon 
                          aria-hidden="true" 
                          className={classNames(
                            "size-12",
                            dragActive ? "text-indigo-600" : "text-gray-300"
                          )}
                        />
                      </div>
                      <div className="mt-4 flex text-sm/6 text-gray-600">
                        <label
                          htmlFor="file-upload"
                          className={classNames(
                            "relative cursor-pointer rounded-md font-semibold focus-within:outline-hidden focus-within:ring-2 focus-within:ring-indigo-600 focus-within:ring-offset-2",
                            dragActive 
                              ? "bg-indigo-50 text-indigo-700 hover:text-indigo-800"
                              : "bg-white text-indigo-600 hover:text-indigo-500"
                          )}
                        >
                          <span>{dragActive ? "Drop PDF files here" : "Upload PDF files"}</span>
                          <input 
                            id="file-upload" 
                            name="file-upload" 
                            type="file" 
                            className="sr-only"
                            multiple
                            accept="application/pdf"
                            onChange={handleFileInputChange}
                          />
                        </label>
                        {!dragActive && <p className="pl-1">or drag and drop</p>}
                      </div>
                      <p className={classNames(
                        "text-xs/5 transition-colors duration-200",
                        dragActive ? "text-indigo-600 font-medium" : "text-gray-600"
                      )}>
                        {dragActive ? "Release to upload PDF files" : "PDF files up to 10MB each"}
                      </p>
                    </div>
                  </div>

                  {/* File List */}
                  {formState.files.length > 0 && (
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Uploaded Files:</h4>
                      <ul className="space-y-2">
                        {formState.files
                          .sort((a, b) => a.uploadIndex - b.uploadIndex) // Show files in upload order
                          .map((file, index) => (
                          <li key={file.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                            <div className="flex items-center space-x-2">
                              {/* Upload order indicator */}
                              <div className="flex items-center justify-center size-5 rounded-full bg-indigo-100 text-indigo-600 text-xs font-medium">
                                {index + 1}
                              </div>
                              <DocumentPlusIcon className="size-4 text-gray-400" />
                              <span className="text-sm text-gray-900">{file.name}</span>
                              <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(file.id)}
                              className="text-red-600 hover:text-red-800 p-1"
                            >
                              <TrashIcon className="size-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                      <p className="mt-2 text-xs text-gray-500">
                        Numbers indicate upload order. Source links will be mapped to files in this sequence.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Source Links Section */}
          {formState.files.length > 0 && (
            <div className="border-b border-gray-900/10 pb-12">
              <div className="flex items-center space-x-3 mb-6">
                <div className="flex items-center justify-center size-8 rounded-lg bg-indigo-100">
                  <GlobeAltIcon className="size-4 text-indigo-600" />
                </div>
                <div>
                  <h3 className="text-base/7 font-semibold text-gray-900">Source Links</h3>
                  <p className="text-sm text-gray-600">Provide source URLs for each uploaded document</p>
                </div>
              </div>
              
              <div className="grid gap-4 sm:gap-6">
                {formState.files
                  .sort((a, b) => a.uploadIndex - b.uploadIndex) // Show source links in upload order
                  .map((file, index) => {
                    const hasSourceLink = formState.sourceLinks[file.name] && formState.sourceLinks[file.name].trim() !== '';
                    
                    return (
                      <div key={file.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow duration-200">
                        {/* File Header */}
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="flex items-center justify-center size-8 rounded-lg bg-indigo-50">
                              <span className="text-sm font-semibold text-indigo-600">
                                {index + 1}
                              </span>
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center space-x-2">
                                <DocumentTextIcon className="size-4 text-gray-400 shrink-0" />
                                <h4 className="text-sm font-medium text-gray-900 truncate">
                                  {file.name}
                                </h4>
                              </div>
                              <p className="text-xs text-gray-500 mt-0.5">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                          
                          {/* Status Badge */}
                          <div className={classNames(
                            "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                            hasSourceLink 
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-600"
                          )}>
                            {hasSourceLink ? (
                              <>
                                <CheckCircleIcon className="size-3 mr-1" />
                                Linked
                              </>
                            ) : (
                              <>
                                <ExclamationCircleIcon className="size-3 mr-1" />
                                Optional
                              </>
                            )}
                          </div>
                        </div>

                        {/* Source Link Input */}
                        <div className="relative">
                          <label htmlFor={`source-${file.id}`} className="sr-only">
                            Source URL for {file.name}
                          </label>
                          <div className="relative flex items-center">
                            <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                              <LinkIcon className={classNames(
                                "size-4",
                                hasSourceLink ? "text-indigo-500" : "text-gray-400"
                              )} />
                            </div>
                            <input
                              id={`source-${file.id}`}
                              type="url"
                              placeholder="https://example.com/document-source"
                              value={formState.sourceLinks[file.name] || ''}
                              onChange={(e) => updateSourceLink(file.name, e.target.value)}
                              className={classNames(
                                "block w-full rounded-lg pl-10 pr-3 py-2.5 text-sm transition-colors duration-200 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500",
                                hasSourceLink 
                                  ? "bg-white border border-gray-300 text-gray-900"
                                  : "bg-yellow-50 border border-yellow-200 text-gray-900"
                              )}
                            />
                          </div>
                          {!hasSourceLink && (
                            <p className="mt-2 text-xs text-gray-500">
                              Source link is optional but recommended for better document tracking
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
              
              {/* Source Links Summary */}
              {(() => {
                const missingCount = formState.files.filter(file => 
                  !formState.sourceLinks[file.name] || formState.sourceLinks[file.name].trim() === ''
                ).length;
                const totalCount = formState.files.length;
                const completionRate = Math.round(((totalCount - missingCount) / totalCount) * 100);
                
                return (
                  <div className="mt-6 bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={classNames(
                          "flex items-center justify-center size-8 rounded-lg",
                          completionRate === 100 ? "bg-green-100" : "bg-yellow-100"
                        )}>
                          {completionRate === 100 ? (
                            <CheckCircleIcon className="size-4 text-green-600" />
                          ) : (
                            <ExclamationCircleIcon className="size-4 text-yellow-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Source Links Progress
                          </p>
                          <p className="text-xs text-gray-600">
                            {totalCount - missingCount} of {totalCount} files configured ({completionRate}%)
                          </p>
                        </div>
                      </div>
                      
                      {/* Progress Bar */}
                      <div className="flex items-center space-x-3">
                        <div className="w-24 bg-gray-200 rounded-full h-2">
                          <div 
                            className={classNames(
                              "h-2 rounded-full transition-all duration-300",
                              completionRate === 100 ? "bg-green-500" : "bg-yellow-500"
                            )}
                            style={{ width: `${completionRate}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-gray-600 min-w-[3rem] text-right">
                          {completionRate}%
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Custom Metadata Section */}
          <div className="border-b border-gray-900/10 pb-12">
            <div className="flex items-center space-x-3 mb-6">
              <div className="flex items-center justify-center size-8 rounded-lg bg-emerald-100">
                <Cog6ToothIcon className="size-4 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-base/7 font-semibold text-gray-900">Custom Metadata</h3>
                <p className="text-sm text-gray-600">Configure metadata for the uploaded documents</p>
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Sensitivity Settings - Enhanced Card */}
              <Disclosure defaultOpen>
                {({ open }) => (
                  <div className="bg-white border border-gray-200 rounded-xl shadow-sm">
                    <Disclosure.Button className="flex w-full items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors duration-200 rounded-t-xl">
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center justify-center size-8 rounded-lg bg-blue-100">
                          <EyeIcon className="size-4 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="text-sm font-semibold text-gray-900">
                            Sensitivity Level
                          </h4>
                          <p className="text-xs text-gray-600">
                            Current: {formState.customMetadata.sensitivity === 'external' ? 'External' : 'Internal'}
                          </p>
                        </div>
                      </div>
                      <ChevronDownIcon className={classNames(
                        'size-4 text-gray-400 transition-transform duration-200',
                        open ? 'rotate-180' : ''
                      )} />
                    </Disclosure.Button>
                    
                    <Disclosure.Panel className="px-6 pb-6">
                      <div className="flex items-center justify-between bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center space-x-4">
                          <span className={classNames(
                            "text-sm font-medium transition-colors duration-200",
                            formState.customMetadata.sensitivity === 'internal' ? 'text-gray-900' : 'text-gray-500'
                          )}>
                            Internal
                          </span>
                          <Switch
                            checked={formState.customMetadata.sensitivity === 'external'}
                            onChange={(checked) => 
                              setFormState(prev => ({
                                ...prev,
                                customMetadata: {
                                  ...prev.customMetadata,
                                  sensitivity: checked ? 'external' : 'internal'
                                }
                              }))
                            }
                            className={classNames(
                              formState.customMetadata.sensitivity === 'external' ? 'bg-indigo-600' : 'bg-gray-300',
                              'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
                            )}
                          >
                            <span
                              aria-hidden="true"
                              className={classNames(
                                formState.customMetadata.sensitivity === 'external' ? 'translate-x-5' : 'translate-x-0',
                                'pointer-events-none inline-block size-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out'
                              )}
                            />
                          </Switch>
                          <span className={classNames(
                            "text-sm font-medium transition-colors duration-200",
                            formState.customMetadata.sensitivity === 'external' ? 'text-gray-900' : 'text-gray-500'
                          )}>
                            External
                          </span>
                        </div>
                        
                        <div className="text-right">
                          <div className={classNames(
                            "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                            formState.customMetadata.sensitivity === 'external' 
                              ? "bg-orange-100 text-orange-700"
                              : "bg-green-100 text-green-700"
                          )}>
                            {formState.customMetadata.sensitivity === 'external' ? (
                              <>
                                <EyeIcon className="size-3 mr-1" />
                                Public Access
                              </>
                            ) : (
                              <>
                                <EyeSlashIcon className="size-3 mr-1" />
                                Restricted Access
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-3 text-xs text-gray-600 bg-blue-50 rounded-md p-3">
                        <p>
                          <strong>{formState.customMetadata.sensitivity === 'external' ? 'External:' : 'Internal:'}</strong>{' '}
                          {formState.customMetadata.sensitivity === 'external' 
                            ? 'Document can be accessed by external users and systems.'
                            : 'Document is restricted to internal organization access only.'
                          }
                        </p>
                      </div>
                    </Disclosure.Panel>
                  </div>
                )}
              </Disclosure>

              {/* Source Type - Enhanced Display */}
              <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="flex items-center justify-center size-8 rounded-lg bg-purple-100">
                    <DocumentTextIcon className="size-4 text-purple-600" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">Source Type</h4>
                    <p className="text-xs text-gray-600">Automatically detected file types</p>
                  </div>
                </div>
                
                <div className="bg-gray-50 rounded-lg px-4 py-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-700 font-medium">
                      {formState.customMetadata.source_type.join(', ').toUpperCase() || 'No files uploaded'}
                    </span>
                    <div className="inline-flex items-center rounded-full bg-gray-200 px-2 py-1 text-xs font-medium text-gray-600">
                      Auto-detected
                    </div>
                  </div>
                </div>
              </div>

              {/* Additional Custom Fields */}
              {formState.additionalFields.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="flex items-center justify-center size-6 rounded-lg bg-amber-100">
                      <PlusIcon className="size-3 text-amber-600" />
                    </div>
                    <h4 className="text-sm font-semibold text-gray-900">Additional Fields</h4>
                  </div>
                  
                  {formState.additionalFields.map((field, index) => (
                    <div key={field.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-sm">
                      <div className="flex items-start space-x-4">
                        <div className="flex items-center justify-center size-8 rounded-lg bg-amber-50 shrink-0">
                          <span className="text-sm font-semibold text-amber-600">
                            {index + 1}
                          </span>
                        </div>
                        
                        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-2">
                              Field Name
                            </label>
                            <input
                              type="text"
                              placeholder="e.g., department, category"
                              value={field.key}
                              onChange={(e) => updateAdditionalField(field.id, 'key', e.target.value)}
                              className="block w-full rounded-lg border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500 transition-colors duration-200"
                            />
                          </div>
                          
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-2">
                              Field Value
                            </label>
                            <input
                              type="text"
                              placeholder="e.g., Engineering, Public"
                              value={field.value}
                              onChange={(e) => updateAdditionalField(field.id, 'value', e.target.value)}
                              className="block w-full rounded-lg border-gray-300 px-3 py-2 text-sm placeholder:text-gray-400 focus:border-indigo-500 focus:ring-indigo-500 transition-colors duration-200"
                            />
                          </div>
                        </div>
                        
                        <button
                          type="button"
                          onClick={() => removeAdditionalField(field.id)}
                          className="flex items-center justify-center size-8 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 transition-colors duration-200 shrink-0"
                          title="Remove field"
                        >
                          <TrashIcon className="size-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Field Button - Enhanced */}
              <div className="flex justify-center pt-4">
                <button
                  type="button"
                  onClick={addAdditionalField}
                  className="inline-flex items-center space-x-3 rounded-xl bg-white border-2 border-dashed border-gray-300 px-6 py-4 text-sm font-medium text-gray-600 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-colors duration-200"
                >
                  <PlusIcon className="size-5" />
                  <span>Add Custom Field</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Submit Status */}
        {submitStatus === 'success' && (
          <div className="rounded-md bg-green-50 p-4 mb-6">
            <div className="flex">
              <div className="shrink-0">
                <CheckCircleIcon aria-hidden="true" className="size-5 text-green-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-green-800">Records created successfully!</p>
              </div>
            </div>
          </div>
        )}

        {submitStatus === 'error' && (
          <div className="rounded-md bg-red-50 p-4 mb-6">
            <div className="flex">
              <div className="shrink-0">
                <ExclamationCircleIcon aria-hidden="true" className="size-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-red-800">
                  {errorMessage || 'Failed to create records. Please try again.'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Submit Buttons */}
        <div className="bg-white border-t border-gray-200 px-6 py-6 sm:px-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <DocumentPlusIcon className="size-4" />
                <span>{formState.files.length} files selected</span>
              </div>
              {formState.files.length > 0 && (
                <div className="flex items-center space-x-2">
                  <GlobeAltIcon className="size-4" />
                  <span>
                    {formState.files.filter(f => formState.sourceLinks[f.name]).length} linked
                  </span>
                </div>
              )}
            </div>
            
            <div className="flex flex-col-reverse sm:flex-row sm:items-center gap-3 sm:gap-4">
              <button 
                type="button" 
                className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting || formState.files.length === 0 || !isAuthenticated}
                className={classNames(
                  "inline-flex items-center justify-center rounded-xl px-6 py-3 text-sm font-semibold shadow-sm transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 min-w-[140px]",
                  isSubmitting || formState.files.length === 0 || !isAuthenticated
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-indigo-600 text-white hover:bg-indigo-700 hover:shadow-md focus-visible:outline-indigo-600"
                )}
                title={!isAuthenticated ? 'Please login to upload files' : ''}
              >
                {isSubmitting ? (
                  <>
                    <CloudArrowUpIcon className="size-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : !isAuthenticated ? (
                  <>
                    <ExclamationCircleIcon className="size-4 mr-2" />
                    Login Required
                  </>
                ) : formState.files.length === 0 ? (
                  <>
                    <DocumentPlusIcon className="size-4 mr-2" />
                    Upload Files First
                  </>
                ) : (
                  <>
                    <CloudArrowUpIcon className="size-4 mr-2" />
                    Create Records
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}