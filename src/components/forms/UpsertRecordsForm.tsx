'use client';

import { useState, useCallback, useEffect } from 'react';
import { Switch } from '@headlessui/react';
import {
  DocumentPlusIcon,
  LinkIcon,
  PlusIcon,
  TrashIcon,
  CloudArrowUpIcon,
  ExclamationCircleIcon,
  CheckCircleIcon
} from '@heroicons/react/24/outline';
import { UploadedFile, SourceLink, AdditionalField, UpsertFormState } from '@/types/upsert';
import { AuthService } from '@/lib/auth';

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function UpsertRecordsForm() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

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
            type: file.type
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

      // Add metadata and source links as JSON strings (as required by API)
      formData.append('source_links', JSON.stringify(formState.sourceLinks));
      formData.append('custom_metadata', JSON.stringify(customMetadata));

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
        
        if (response.status === 403) {
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
    <div className="max-w-4xl mx-auto">
      <form onSubmit={handleSubmit}>
        <div className="space-y-12">
          {/* Header */}
          <div className="border-b border-gray-900/10 pb-12">
            <h2 className="text-base/7 font-semibold text-gray-900">Upsert Records</h2>
            <p className="mt-1 max-w-2xl text-sm/6 text-gray-600">
              Upload PDF documents and configure their metadata for vector indexing.
            </p>
            
            {/* Authentication Status */}
            <div className="mt-4">
              {isAuthenticated ? (
                <div className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                  <CheckCircleIcon className="size-3 mr-1" />
                  Authenticated
                </div>
              ) : (
                <div className="inline-flex items-center rounded-md bg-red-50 px-2 py-1 text-xs font-medium text-red-700 ring-1 ring-inset ring-red-600/20">
                  <ExclamationCircleIcon className="size-3 mr-1" />
                  Please login to upload files
                </div>
              )}
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
                        {formState.files.map((file) => (
                          <li key={file.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-md">
                            <div className="flex items-center space-x-2">
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
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Source Links Section */}
          {formState.files.length > 0 && (
            <div className="border-b border-gray-900/10 pb-12">
              <h3 className="text-base/7 font-semibold text-gray-900 mb-4">Source Links</h3>
              <p className="text-sm text-gray-600 mb-6">Provide source URLs for each uploaded document.</p>
              
              <div className="space-y-8 sm:space-y-0 sm:divide-y sm:divide-gray-900/10">
                {formState.files.map((file) => (
                  <div key={file.id} className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                    <label htmlFor={`source-${file.id}`} className="block text-sm/6 font-medium text-gray-900 sm:pt-1.5">
                      {file.name}
                    </label>
                    <div className="mt-2 sm:col-span-2 sm:mt-0">
                      <div className="flex items-center rounded-md bg-white outline-1 -outline-offset-1 outline-gray-300 focus-within:outline-2 focus-within:-outline-offset-2 focus-within:outline-indigo-600">
                        <div className="shrink-0 text-base text-gray-500 pl-3">
                          <LinkIcon className="size-4" />
                        </div>
                        <input
                          id={`source-${file.id}`}
                          type="url"
                          placeholder="https://example.com/document-source"
                          value={formState.sourceLinks[file.name] || ''}
                          onChange={(e) => updateSourceLink(file.name, e.target.value)}
                          className="block min-w-0 grow py-1.5 pr-3 pl-2 text-base text-gray-900 placeholder:text-gray-400 focus:outline-none sm:text-sm/6"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Custom Metadata Section */}
          <div className="border-b border-gray-900/10 pb-12">
            <h3 className="text-base/7 font-semibold text-gray-900 mb-4">Custom Metadata</h3>
            <p className="text-sm text-gray-600 mb-6">Configure metadata for the uploaded documents.</p>
            
            <div className="space-y-8 sm:space-y-0 sm:divide-y sm:divide-gray-900/10">
              {/* Sensitivity Toggle */}
              <div className="sm:grid sm:grid-cols-3 sm:items-center sm:gap-4 sm:py-6">
                <label htmlFor="sensitivity" className="block text-sm/6 font-medium text-gray-900">
                  Sensitivity
                </label>
                <div className="mt-2 sm:col-span-2 sm:mt-0">
                  <div className="flex items-center space-x-4">
                    <span className={classNames(
                      "text-sm",
                      formState.customMetadata.sensitivity === 'internal' ? 'text-gray-900 font-medium' : 'text-gray-500'
                    )}>Internal</span>
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
                        formState.customMetadata.sensitivity === 'external' ? 'bg-indigo-600' : 'bg-gray-200',
                        'relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden focus:ring-2 focus:ring-indigo-600 focus:ring-offset-2'
                      )}
                    >
                      <span
                        aria-hidden="true"
                        className={classNames(
                          formState.customMetadata.sensitivity === 'external' ? 'translate-x-5' : 'translate-x-0',
                          'pointer-events-none inline-block size-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out'
                        )}
                      />
                    </Switch>
                    <span className={classNames(
                      "text-sm",
                      formState.customMetadata.sensitivity === 'external' ? 'text-gray-900 font-medium' : 'text-gray-500'
                    )}>External</span>
                  </div>
                </div>
              </div>

              {/* Source Type (Read-only) */}
              <div className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                <label className="block text-sm/6 font-medium text-gray-900 sm:pt-1.5">
                  Source Type
                </label>
                <div className="mt-2 sm:col-span-2 sm:mt-0">
                  <div className="bg-gray-50 rounded-md px-3 py-2 text-sm text-gray-700">
                    {formState.customMetadata.source_type.join(', ') || 'No files uploaded'}
                  </div>
                  <p className="mt-1 text-xs text-gray-500">Automatically detected from uploaded files</p>
                </div>
              </div>

              {/* Additional Fields */}
              {formState.additionalFields.map((field) => (
                <div key={field.id} className="sm:grid sm:grid-cols-3 sm:items-start sm:gap-4 sm:py-6">
                  <div className="sm:pt-1.5">
                    <input
                      type="text"
                      placeholder="Field name"
                      value={field.key}
                      onChange={(e) => updateAdditionalField(field.id, 'key', e.target.value)}
                      className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                    />
                  </div>
                  <div className="mt-2 sm:col-span-2 sm:mt-0">
                    <div className="flex space-x-2">
                      <input
                        type="text"
                        placeholder="Field value"
                        value={field.value}
                        onChange={(e) => updateAdditionalField(field.id, 'value', e.target.value)}
                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-indigo-600 sm:text-sm/6"
                      />
                      <button
                        type="button"
                        onClick={() => removeAdditionalField(field.id)}
                        className="inline-flex items-center rounded-md bg-red-600 px-2.5 py-1.5 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
                      >
                        <TrashIcon className="size-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}

              {/* Add Field Button */}
              <div className="sm:grid sm:grid-cols-3 sm:gap-4 sm:py-6">
                <div></div>
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={addAdditionalField}
                    className="inline-flex items-center rounded-md bg-white px-3 py-2 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
                  >
                    <PlusIcon className="size-4 mr-2" />
                    Add Custom Field
                  </button>
                </div>
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
        <div className="mt-6 flex items-center justify-end gap-x-6">
          <button type="button" className="text-sm/6 font-semibold text-gray-900">
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || formState.files.length === 0 || !isAuthenticated}
            className={classNames(
              "inline-flex items-center justify-center rounded-md px-3 py-2 text-sm font-semibold shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2",
              isSubmitting || formState.files.length === 0 || !isAuthenticated
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : "bg-indigo-600 text-white hover:bg-indigo-500 focus-visible:outline-indigo-600"
            )}
            title={!isAuthenticated ? 'Please login to upload files' : ''}
          >
            {isSubmitting ? (
              <>
                <CloudArrowUpIcon className="size-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : !isAuthenticated ? (
              'Login Required'
            ) : formState.files.length === 0 ? (
              'Upload Files First'
            ) : (
              'Create Records'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}