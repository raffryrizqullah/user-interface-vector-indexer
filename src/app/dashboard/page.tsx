'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService, User } from '@/lib/auth';
import { ApiService } from '@/lib/api';
import PineconeIndexCard from '@/components/dashboard/PineconeIndexCard';
import StatsWithIcons, { StatItem } from '@/components/dashboard/StatsWithIcons';
import QuickAccessCards, { QuickAccessItem } from '@/components/dashboard/QuickAccessCards';
import RecentActivity from '@/components/dashboard/RecentActivity';
import UpsertRecordsForm from '@/components/forms/UpsertRecordsForm';
import VectorSearchForm, { SearchResults } from '@/components/forms/VectorSearchForm';
import VectorListDisplay from '@/components/search/VectorListDisplay';
import HealthCheckDisplay from '@/components/health/HealthCheckDisplay';
import Breadcrumbs, { BreadcrumbItem } from '@/components/ui/Breadcrumbs';
import PageHeader from '@/components/ui/PageHeader';
import ContentContainer from '@/components/ui/ContentContainer';
import {
  Dialog,
  DialogBackdrop,
  DialogPanel,
  TransitionChild,
} from '@headlessui/react';
import {
  Bars3Icon,
  DocumentDuplicateIcon,
  FolderIcon,
  HomeIcon,
  UsersIcon,
  XMarkIcon,
  MagnifyingGlassIcon,
  DocumentTextIcon,
  UserGroupIcon,
  CubeIcon,
  DocumentPlusIcon,
  HeartIcon,
} from '@heroicons/react/24/outline';

// Navigation items will be defined inside the component to access setCurrentView

const namespaces = [
  { id: 1, name: 'Default', href: '#', initial: 'D', current: false },
  { id: 2, name: 'Production', href: '#', initial: 'P', current: false },
  { id: 3, name: 'Testing', href: '#', initial: 'T', current: false },
];

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [previousDashboardData, setPreviousDashboardData] = useState<any>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [currentView, setCurrentView] = useState<'dashboard' | 'upsert-records' | 'vector-search' | 'health-check'>('dashboard');
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  // Breadcrumb configuration
  const getBreadcrumbs = (): BreadcrumbItem[] => {
    switch (currentView) {
      case 'dashboard':
        return [
          { name: 'Dashboard', current: true, onClick: () => setCurrentView('dashboard') }
        ];
      case 'upsert-records':
        return [
          { name: 'Dashboard', current: false, onClick: () => setCurrentView('dashboard') },
          { name: 'Documents', current: false, onClick: () => setCurrentView('upsert-records') },
          { name: 'Upload', current: true }
        ];
      case 'vector-search':
        return [
          { name: 'Dashboard', current: false, onClick: () => setCurrentView('dashboard') },
          { name: 'Search', current: false, onClick: () => setCurrentView('vector-search') },
          { name: 'Vector Search', current: true }
        ];
      case 'health-check':
        return [
          { name: 'Dashboard', current: false, onClick: () => setCurrentView('dashboard') },
          { name: 'System', current: false, onClick: () => setCurrentView('health-check') },
          { name: 'Health Check', current: true }
        ];
      default:
        return [];
    }
  };

  // Navigation items with onClick handlers
  const navigation = [
    { 
      name: 'Dashboard', 
      view: 'dashboard' as const, 
      icon: HomeIcon, 
      current: currentView === 'dashboard',
      onClick: () => setCurrentView('dashboard')
    },
    { 
      name: 'Documents', 
      view: 'upsert-records' as const, 
      icon: DocumentDuplicateIcon, 
      current: currentView === 'upsert-records',
      onClick: () => setCurrentView('upsert-records')
    },
    { 
      name: 'Vector Search', 
      view: 'vector-search' as const, 
      icon: MagnifyingGlassIcon, 
      current: currentView === 'vector-search',
      onClick: () => setCurrentView('vector-search')
    },
    { 
      name: 'Health Check', 
      view: 'health-check' as const, 
      icon: HeartIcon, 
      current: currentView === 'health-check',
      onClick: () => setCurrentView('health-check')
    },
    { 
      name: 'Users', 
      view: null, 
      icon: UsersIcon, 
      current: false,
      onClick: () => console.log('Users - Coming soon')
    },
  ];

  useEffect(() => {
    // Check authentication status
    if (!AuthService.isAuthenticated()) {
      router.replace('/login');
      return;
    }

    // Get current user data
    const currentUser = AuthService.getCurrentUser();
    setUser(currentUser);
    setIsLoading(false);

    // Fetch dashboard data
    fetchDashboardData();
  }, [router]);

  const fetchDashboardData = async () => {
    try {
      console.log('🔄 Fetching dashboard data...');
      setDataLoading(true);
      
      // Store previous data before fetching new data
      if (dashboardData) {
        setPreviousDashboardData(dashboardData);
        // Also persist to localStorage for cross-session comparison
        localStorage.setItem('previousDashboardData', JSON.stringify(dashboardData));
      } else {
        // Try to load previous data from localStorage on first load
        const storedPreviousData = localStorage.getItem('previousDashboardData');
        if (storedPreviousData) {
          setPreviousDashboardData(JSON.parse(storedPreviousData));
        }
      }
      
      const data = await ApiService.getDashboardData();
      setDashboardData(data);
      
      // Calculate and set stats with previous data for real changes
      const calculatedStats = ApiService.calculateStats(data, previousDashboardData);
      const statsItems: StatItem[] = [
        {
          id: 1,
          name: 'Total Documents',
          stat: calculatedStats.totalDocuments.toString(),
          icon: DocumentTextIcon,
          change: calculatedStats.changes.totalDocuments.value.toString(),
          changeType: calculatedStats.changes.totalDocuments.type,
          href: '#documents',
          healthStatus: data.recordsList ? 'healthy' : 'warning',
          lastUpdated: calculatedStats.lastUpdated
        },
        {
          id: 2,
          name: 'Vector Records',
          stat: calculatedStats.vectorRecords.toLocaleString(),
          icon: CubeIcon,
          change: calculatedStats.changes.vectorRecords.value.toString(),
          changeType: calculatedStats.changes.vectorRecords.type,
          href: '#vectors',
          healthStatus: data.namespaceStats?.namespace_exists ? 'healthy' : 'error',
          lastUpdated: calculatedStats.lastUpdated
        },
        {
          id: 3,
          name: 'Active Namespaces',
          stat: calculatedStats.activeNamespaces.toString(),
          icon: FolderIcon,
          change: calculatedStats.changes.activeNamespaces.value.toString(),
          changeType: calculatedStats.changes.activeNamespaces.type,
          href: '#namespaces',
          healthStatus: data.pineconeHealth?.success ? 'healthy' : 'error',
          lastUpdated: calculatedStats.lastUpdated
        },
        {
          id: 4,
          name: 'Active Users',
          stat: calculatedStats.activeUsers.toString(),
          icon: UserGroupIcon,
          change: calculatedStats.changes.activeUsers.value.toString(),
          changeType: calculatedStats.changes.activeUsers.type,
          href: '#users',
          healthStatus: data.users && data.users.length > 0 ? 'healthy' : 'warning',
          lastUpdated: calculatedStats.lastUpdated
        },
      ];
      
      setStats(statsItems);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setDataLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      router.replace('/login');
    } catch (error) {
      console.error('Logout error:', error);
      // Force redirect even if logout API fails
      router.replace('/login');
    }
  };


  // Create Pinecone index info from API data
  const pineconeIndexInfo = dashboardData?.pineconeHealth ? {
    success: dashboardData.pineconeHealth.success || false,
    index_name: dashboardData.pineconeHealth.index_name || 'vector-indexer-index',
    metric: dashboardData.pineconeHealth.config?.metric || 'cosine',
    dimensions: dashboardData.pineconeHealth.config?.dimension || 3072,
    host: dashboardData.pineconeHealth.host?.replace('https://', '') || 'standard-dense-py-rjoj9sl.svc.gcp-europe-west4-de1d.pinecone.io',
    cloud: dashboardData.pineconeHealth.config?.cloud || 'GCP',
    region: dashboardData.pineconeHealth.config?.region || 'europe-west4',
    type: 'Dense',
    capacityMode: 'Serverless',
    recordCount: dashboardData.namespaceStats?.stats?.vector_count || 39,
    message: dashboardData.pineconeHealth.message || 'Index is healthy and operational'
  } : undefined;

  // Create quick access items with real data
  const quickAccessItems: QuickAccessItem[] = [
    {
      id: 1,
      name: 'Create Records',
      icon: DocumentPlusIcon,
      iconBgColor: 'bg-blue-500',
      description: 'Upload and process PDF documents into vector embeddings',
      lastActivity: {
        label: 'Last upload',
        value: '2 hours ago',
        dateTime: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
      },
      status: {
        label: 'Status',
        value: dashboardData?.basicHealth?.status === 'healthy' ? 'Active' : 'Error',
        type: dashboardData?.basicHealth?.status === 'healthy' ? 'Active' : 'Error'
      },
      metrics: {
        label: 'Files processed',
        value: `${stats.find(s => s.name === 'Total Documents')?.stat || '0'} total`
      },
      actions: {
        primary: { label: 'Upload Files', onClick: () => setCurrentView('upsert-records') },
        secondary: { label: 'View History', href: '/documents/history' }
      }
    },
    {
      id: 2,
      name: 'Search Records',
      icon: MagnifyingGlassIcon,
      iconBgColor: 'bg-purple-500',
      description: 'Search through vector embeddings and find similar content',
      lastActivity: {
        label: 'Last search',
        value: '1 hour ago',
        dateTime: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
      },
      status: {
        label: 'Query type',
        value: 'Semantic',
        type: 'Active'
      },
      metrics: {
        label: 'Records available',
        value: `${stats.find(s => s.name === 'Vector Records')?.stat || '0'}`
      },
      actions: {
        primary: { label: 'New Search', onClick: () => setCurrentView('vector-search') },
        secondary: { label: 'Recent Searches', href: '/search/history' }
      }
    },
    {
      id: 3,
      name: 'System Health',
      icon: HeartIcon,
      iconBgColor: 'bg-green-500',
      description: 'Monitor Pinecone connectivity and system performance',
      lastActivity: {
        label: 'Last check',
        value: 'Just now',
        dateTime: new Date().toISOString()
      },
      status: {
        label: 'Pinecone status',
        value: dashboardData?.pineconeHealth?.success ? 'Connected' : 'Disconnected',
        type: dashboardData?.pineconeHealth?.success ? 'Connected' : 'Disconnected'
      },
      metrics: {
        label: 'Response time',
        value: '45ms avg'
      },
      actions: {
        primary: { label: 'Run Health Check', href: '#', onClick: fetchDashboardData },
        secondary: { label: 'View Logs', href: '/health/logs' }
      }
    }
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div>
      <Dialog open={sidebarOpen} onClose={setSidebarOpen} className="relative z-50 lg:hidden">
        <DialogBackdrop
          transition
          className="fixed inset-0 bg-gray-900/80 transition-opacity duration-300 ease-linear data-closed:opacity-0"
        />

        <div className="fixed inset-0 flex">
          <DialogPanel
            transition
            className="relative mr-16 flex w-full max-w-xs flex-1 transform transition duration-300 ease-in-out data-closed:-translate-x-full"
          >
            <TransitionChild>
              <div className="absolute top-0 left-full flex w-16 justify-center pt-5 duration-300 ease-in-out data-closed:opacity-0">
                <button type="button" onClick={() => setSidebarOpen(false)} className="-m-2.5 p-2.5">
                  <span className="sr-only">Close sidebar</span>
                  <XMarkIcon aria-hidden="true" className="size-6 text-white" />
                </button>
              </div>
            </TransitionChild>
            {/* Mobile sidebar */}
            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-indigo-600 px-6 pb-4">
              <div className="flex h-16 shrink-0 items-center">
                <img
                  alt="Vector Indexer"
                  src="https://tailwindui.com/plus-assets/img/logos/mark.svg?color=white"
                  className="h-8 w-auto"
                />
                <span className="ml-2 text-lg font-semibold text-white">Vector Indexer</span>
              </div>
              <nav className="flex flex-1 flex-col">
                <ul role="list" className="flex flex-1 flex-col gap-y-7">
                  <li>
                    <ul role="list" className="-mx-2 space-y-1">
                      {navigation.map((item) => (
                        <li key={item.name}>
                          <button
                            onClick={item.onClick}
                            className={classNames(
                              item.current
                                ? 'bg-indigo-700 text-white'
                                : 'text-indigo-200 hover:bg-indigo-700 hover:text-white',
                              'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold w-full text-left',
                            )}
                          >
                            <item.icon
                              aria-hidden="true"
                              className={classNames(
                                item.current ? 'text-white' : 'text-indigo-200 group-hover:text-white',
                                'size-6 shrink-0',
                              )}
                            />
                            {item.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </li>
                  <li>
                    <div className="text-xs/6 font-semibold text-indigo-200">Namespaces</div>
                    <ul role="list" className="-mx-2 mt-2 space-y-1">
                      {namespaces.map((namespace) => (
                        <li key={namespace.name}>
                          <a
                            href={namespace.href}
                            className={classNames(
                              namespace.current
                                ? 'bg-indigo-700 text-white'
                                : 'text-indigo-200 hover:bg-indigo-700 hover:text-white',
                              'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                            )}
                          >
                            <span className="flex size-6 shrink-0 items-center justify-center rounded-lg border border-indigo-400 bg-indigo-500 text-[0.625rem] font-medium text-white">
                              {namespace.initial}
                            </span>
                            <span className="truncate">{namespace.name}</span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </li>
                  <li className="-mx-6 mt-auto">
                    <a
                      href="#"
                      onClick={handleLogout}
                      className="flex items-center gap-x-4 px-6 py-3 text-sm/6 font-semibold text-white hover:bg-indigo-700"
                    >
                      <div className="size-8 rounded-full bg-indigo-700 flex items-center justify-center">
                        <span className="text-sm font-medium text-white">
                          {user?.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <span className="sr-only">Your profile</span>
                      <span aria-hidden="true">{user?.username}</span>
                    </a>
                  </li>
                </ul>
              </nav>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Static sidebar for desktop */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-indigo-600 px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <img
              alt="Vector Indexer"
              src="https://tailwindui.com/plus-assets/img/logos/mark.svg?color=white"
              className="h-8 w-auto"
            />
            <span className="ml-2 text-lg font-semibold text-white">Vector Indexer</span>
          </div>
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => (
                    <li key={item.name}>
                      <button
                        onClick={item.onClick}
                        className={classNames(
                          item.current
                            ? 'bg-indigo-700 text-white'
                            : 'text-indigo-200 hover:bg-indigo-700 hover:text-white',
                          'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold w-full text-left',
                        )}
                      >
                        <item.icon
                          aria-hidden="true"
                          className={classNames(
                            item.current ? 'text-white' : 'text-indigo-200 group-hover:text-white',
                            'size-6 shrink-0',
                          )}
                        />
                        {item.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
              <li>
                <div className="text-xs/6 font-semibold text-indigo-200">Namespaces</div>
                <ul role="list" className="-mx-2 mt-2 space-y-1">
                  {namespaces.map((namespace) => (
                    <li key={namespace.name}>
                      <a
                        href={namespace.href}
                        className={classNames(
                          namespace.current
                            ? 'bg-indigo-700 text-white'
                            : 'text-indigo-200 hover:bg-indigo-700 hover:text-white',
                          'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold',
                        )}
                      >
                        <span className="flex size-6 shrink-0 items-center justify-center rounded-lg border border-indigo-400 bg-indigo-500 text-[0.625rem] font-medium text-white">
                          {namespace.initial}
                        </span>
                        <span className="truncate">{namespace.name}</span>
                      </a>
                    </li>
                  ))}
                </ul>
              </li>
              <li className="-mx-6 mt-auto">
                <a
                  href="#"
                  onClick={handleLogout}
                  className="flex items-center gap-x-4 px-6 py-3 text-sm/6 font-semibold text-white hover:bg-indigo-700"
                >
                  <div className="size-8 rounded-full bg-indigo-700 flex items-center justify-center">
                    <span className="text-sm font-medium text-white">
                      {user?.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="sr-only">Your profile</span>
                  <span aria-hidden="true">{user?.username}</span>
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-indigo-600 px-4 py-4 shadow-xs sm:px-6 lg:hidden">
        <button type="button" onClick={() => setSidebarOpen(true)} className="-m-2.5 p-2.5 text-indigo-200 lg:hidden">
          <span className="sr-only">Open sidebar</span>
          <Bars3Icon aria-hidden="true" className="size-6" />
        </button>
        <div className="flex-1 text-sm/6 font-semibold text-white">
          {currentView === 'dashboard' ? 'Dashboard' : 
           currentView === 'upsert-records' ? 'Upload Documents' : 
           currentView === 'vector-search' ? 'Vector Search' :
           'Health Check'}
        </div>
        <a href="#">
          <span className="sr-only">Your profile</span>
          <div className="size-8 rounded-full bg-indigo-700 flex items-center justify-center">
            <span className="text-sm font-medium text-white">
              {user?.username.charAt(0).toUpperCase()}
            </span>
          </div>
        </a>
      </div>

      <main className="py-6 lg:py-10 lg:pl-72">
        <ContentContainer size="lg">
          {/* Breadcrumbs */}
          <div className="mb-6">
            <Breadcrumbs items={getBreadcrumbs()} />
          </div>

          {currentView === 'dashboard' && (
            <>
              {/* Page Header */}
              <PageHeader
                title={`Welcome back, ${user?.username}!`}
                description="Here's what's happening with your vector database today."
                icon={<HeartIcon className="size-5 sm:size-6 text-indigo-600" />}
                className="mb-8"
              />

              {/* Dashboard Content */}
              <div className="space-y-8">
                {/* Pinecone Index Information */}
                <PineconeIndexCard 
                  indexInfo={pineconeIndexInfo}
                  isLoading={dataLoading && !dashboardData}
                />

                {/* Enhanced Stats cards */}
                <StatsWithIcons 
                  stats={stats} 
                  isLoading={dataLoading}
                />

                {/* Quick Access Cards */}
                <QuickAccessCards 
                  items={quickAccessItems}
                  isLoading={dataLoading}
                />

                {/* Recent Activity */}
                <RecentActivity isLoading={dataLoading} />
              </div>
            </>
          )}

          {currentView === 'upsert-records' && (
            <>
              {/* Page Header */}
              <PageHeader
                title="Upload Documents"
                description="Upload PDF documents and create vector embeddings with custom metadata"
                icon={<DocumentPlusIcon className="size-5 sm:size-6 text-indigo-600" />}
                className="mb-8"
              />

              {/* Upsert form */}
              <ContentContainer variant="card">
                <div className="p-6 sm:p-8">
                  <UpsertRecordsForm />
                </div>
              </ContentContainer>
            </>
          )}

          {currentView === 'vector-search' && (
            <>
              {/* Page Header */}
              <PageHeader
                title="Vector Search"
                description="Search and explore your vector database with advanced filtering options"
                icon={<MagnifyingGlassIcon className="size-5 sm:size-6 text-indigo-600" />}
                className="mb-8"
              />

              {/* Search Form */}
              <ContentContainer variant="card" className="mb-8">
                <div className="p-6 sm:p-8">
                  <VectorSearchForm
                    onSearchResults={setSearchResults}
                    onLoading={setSearchLoading}
                    onError={setSearchError}
                  />
                </div>
              </ContentContainer>

              {/* Search Results */}
              <ContentContainer>
                <VectorListDisplay
                  results={searchResults}
                  loading={searchLoading}
                  error={searchError}
                  onRefresh={() => {
                    // Re-execute the last search
                    if (searchResults) {
                      setSearchLoading(true);
                      // Trigger the search form to re-execute the search
                      // This will be handled by the form component
                    }
                  }}
                />
              </ContentContainer>
            </>
          )}

          {currentView === 'health-check' && (
            <>
              {/* Page Header */}
              <PageHeader
                title="Health Check"
                description="Monitor system health and Pinecone database connectivity"
                icon={<HeartIcon className="size-5 sm:size-6 text-indigo-600" />}
                className="mb-8"
              />

              {/* Health Check Dashboard */}
              <ContentContainer>
                <HealthCheckDisplay />
              </ContentContainer>
            </>
          )}
        </ContentContainer>
      </main>
    </div>
  );
}