'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AuthService, User as AuthUser } from '@/lib/auth';
import { ApiService, User } from '@/lib/api';

interface DashboardData {
  basicHealth?: Record<string, unknown>;
  pineconeHealth?: Record<string, unknown>;
  namespaceStats?: Record<string, unknown>;
  recordsList?: Record<string, unknown>;
  users?: Record<string, unknown>;
}
import { auth, UserRole } from '@/lib/authorization';
import AuthGuard from '@/components/ui/AuthGuard';
import PineconeIndexCard from '@/components/dashboard/PineconeIndexCard';
import StatsWithIcons, { StatItem } from '@/components/dashboard/StatsWithIcons';
import QuickAccessCards, { QuickAccessItem } from '@/components/dashboard/QuickAccessCards';
import RecentActivity from '@/components/dashboard/RecentActivity';
import UpsertRecordsForm from '@/components/forms/UpsertRecordsForm';
import VectorSearchForm, { SearchResults } from '@/components/forms/VectorSearchForm';
import VectorListDisplay from '@/components/search/VectorListDisplay';
import HealthCheckDisplay from '@/components/health/HealthCheckDisplay';
import UserListDisplay from '@/components/users/UserListDisplay';
import UserDetailsModal from '@/components/users/UserDetailsModal';
import UserEditForm from '@/components/users/UserEditForm';
import UserAddForm from '@/components/users/UserAddForm';
import ActivityDashboard from '@/components/activity/ActivityDashboard';
import SettingsLayout from '@/components/settings/SettingsLayout';
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
  ClipboardDocumentListIcon,
  Cog6ToothIcon,
  AcademicCapIcon,
} from '@heroicons/react/24/outline';

// Navigation items will be defined inside the component to access setCurrentView


function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ');
}

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [previousDashboardData, setPreviousDashboardData] = useState<DashboardData | null>(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [stats, setStats] = useState<StatItem[]>([]);
  const [currentView, setCurrentView] = useState<'dashboard' | 'upsert-records' | 'vector-search' | 'health-check' | 'users' | 'activity-logs' | 'settings'>('dashboard');
  const [searchResults, setSearchResults] = useState<SearchResults | null>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  
  // Users management state
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [usersError, setUsersError] = useState<string | null>(null);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showUserEdit, setShowUserEdit] = useState(false);
  const [showUserAdd, setShowUserAdd] = useState(false);

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
      case 'users':
        return [
          { name: 'Dashboard', current: false, onClick: () => setCurrentView('dashboard') },
          { name: 'Admin', current: false, onClick: () => setCurrentView('users') },
          { name: 'User Management', current: true }
        ];
      case 'activity-logs':
        return [
          { name: 'Dashboard', current: false, onClick: () => setCurrentView('dashboard') },
          { name: 'Admin', current: false, onClick: () => setCurrentView('activity-logs') },
          { name: 'Activity Logs', current: true }
        ];
      case 'settings':
        return [
          { name: 'Dashboard', current: false, onClick: () => setCurrentView('dashboard') },
          { name: 'Settings', current: true }
        ];
      default:
        return [];
    }
  };

  // Navigation items with role-based access control
  const allNavigationItems = [
    { 
      name: 'Dashboard', 
      view: 'dashboard' as const, 
      icon: HomeIcon, 
      current: currentView === 'dashboard',
      onClick: () => setCurrentView('dashboard'),
      requiredRole: 'admin' as UserRole, // All authenticated users can access dashboard
    },
    { 
      name: 'Documents', 
      view: 'upsert-records' as const, 
      icon: DocumentDuplicateIcon, 
      current: currentView === 'upsert-records',
      onClick: () => setCurrentView('upsert-records'),
      requiredRole: 'admin' as UserRole, // Admin and super_admin can manage documents
    },
    { 
      name: 'Vector Search', 
      view: 'vector-search' as const, 
      icon: MagnifyingGlassIcon, 
      current: currentView === 'vector-search',
      onClick: () => setCurrentView('vector-search'),
      requiredRole: 'admin' as UserRole, // Admin and super_admin can search vectors
    },
    { 
      name: 'Health Check', 
      view: 'health-check' as const, 
      icon: HeartIcon, 
      current: currentView === 'health-check',
      onClick: () => setCurrentView('health-check'),
      requiredRole: 'admin' as UserRole, // Admin and super_admin can check health
    },
    { 
      name: 'Users', 
      view: 'users' as const, 
      icon: UsersIcon, 
      current: currentView === 'users',
      onClick: () => setCurrentView('users'),
      requiredRole: 'super_admin' as UserRole, // Only super_admin can manage users
    },
    { 
      name: 'Activity Logs', 
      view: 'activity-logs' as const, 
      icon: ClipboardDocumentListIcon, 
      current: currentView === 'activity-logs',
      onClick: () => setCurrentView('activity-logs'),
      requiredRole: 'admin' as UserRole, // Admin and super_admin can view activity logs
    },
    { 
      name: 'Settings', 
      view: 'settings' as const, 
      icon: Cog6ToothIcon, 
      current: currentView === 'settings',
      onClick: () => setCurrentView('settings'),
      requiredRole: 'super_admin' as UserRole, // Only super_admin can access settings
    },
  ];

  // Filter navigation based on user role
  const navigation = allNavigationItems.filter(item => 
    auth.hasMinimumRole(item.requiredRole)
  );

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

  useEffect(() => {
    // Fetch users when view changes to users
    if (currentView === 'users') {
      fetchUsers();
    }
  }, [currentView]);

  useEffect(() => {
    // Auto-redirect if user doesn't have access to current view
    const currentNavItem = allNavigationItems.find(item => item.view === currentView);
    if (currentNavItem && !auth.hasMinimumRole(currentNavItem.requiredRole)) {
      console.log(`🔒 User doesn't have access to ${currentView}, redirecting to dashboard`);
      setCurrentView('dashboard');
    }
  }, [currentView, user]);

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

  const fetchUsers = async () => {
    try {
      console.log('🔄 Fetching users...');
      setUsersLoading(true);
      setUsersError(null);
      
      const usersData = await ApiService.getUsers();
      setUsers(usersData);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      setUsersError(error instanceof Error ? error.message : 'Failed to fetch users');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleUserSelect = (user: User): void => {
    setSelectedUser(user);
    setShowUserDetails(true);
  };

  const handleUserEdit = (user: User): void => {
    setEditingUser(user);
    setShowUserEdit(true);
  };

  const handleUserSave = (updatedUser: User) => {
    setUsers(prevUsers => 
      prevUsers.map(user => user.id === updatedUser.id ? updatedUser : user)
    );
    setShowUserEdit(false);
    setEditingUser(null);
  };

  const handleUserAdd = () => {
    setShowUserAdd(true);
  };

  const handleUserCreateSuccess = (newUser: User) => {
    setUsers(prevUsers => [newUser, ...prevUsers]);
    setShowUserAdd(false);
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
      iconBgColor: 'bg-blue-university-600',
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
        secondary: { label: 'View Documents', onClick: () => setCurrentView('upsert-records') }
      }
    },
    {
      id: 2,
      name: 'Search Records',
      icon: MagnifyingGlassIcon,
      iconBgColor: 'bg-gold-university-600',
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
        secondary: { label: 'Search Page', onClick: () => setCurrentView('vector-search') }
      }
    },
    {
      id: 3,
      name: 'System Health',
      icon: HeartIcon,
      iconBgColor: 'bg-blue-university-500',
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
        secondary: { label: 'Health Details', onClick: () => setCurrentView('health-check') }
      }
    }
  ];

  // Legacy activity data removed - now using real API data in RecentActivity component

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-university-200 border-t-blue-university-600 mx-auto"></div>
          <p className="mt-4 text-blue-university-600 font-medium">Loading Dashboard...</p>
        </div>
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
            <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-blue-university-600 px-6 pb-4">
              <div className="flex h-16 shrink-0 items-center">
                <div className="rounded-full bg-gold-university-600 p-2">
                  <AcademicCapIcon className="h-8 w-8 text-blue-university-800" />
                </div>
                <span className="ml-3 text-lg font-semibold text-white">Vector Indexer</span>
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
                                ? 'bg-blue-university-700 text-white border-l-4 border-gold-university-500'
                                : 'text-blue-university-200 hover:bg-blue-university-700 hover:text-white hover:border-l-4 hover:border-gold-university-400',
                              'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold w-full text-left transition-all',
                            )}
                          >
                            <item.icon
                              aria-hidden="true"
                              className={classNames(
                                item.current ? 'text-gold-university-400' : 'text-blue-university-200 group-hover:text-gold-university-300',
                                'size-6 shrink-0',
                              )}
                            />
                            {item.name}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </li>
                  <li className="-mx-6 mt-auto">
                    <a
                      href="#"
                      onClick={handleLogout}
                      className="flex items-center gap-x-4 px-6 py-3 text-sm/6 font-semibold text-white hover:bg-blue-university-700 transition-colors"
                    >
                      <div className="size-8 rounded-full bg-gold-university-600 flex items-center justify-center">
                        <span className="text-sm font-medium text-blue-university-800">
                          {user?.username.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="flex flex-col">
                        <span className="text-sm font-semibold">{user?.username}</span>
                        <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-gold-university-100 text-gold-university-800 ring-1 ring-inset ring-gold-university-300">
                          {auth.getRoleDisplayName()}
                        </span>
                      </div>
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
        <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-blue-university-600 px-6 pb-4">
          <div className="flex h-16 shrink-0 items-center">
            <div className="rounded-full bg-gold-university-600 p-2">
              <AcademicCapIcon className="h-8 w-8 text-blue-university-800" />
            </div>
            <span className="ml-3 text-lg font-semibold text-white">Vector Indexer</span>
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
                            ? 'bg-blue-university-700 text-white border-l-4 border-gold-university-500'
                            : 'text-blue-university-200 hover:bg-blue-university-700 hover:text-white hover:border-l-4 hover:border-gold-university-400',
                          'group flex gap-x-3 rounded-md p-2 text-sm/6 font-semibold w-full text-left transition-all',
                        )}
                      >
                        <item.icon
                          aria-hidden="true"
                          className={classNames(
                            item.current ? 'text-gold-university-400' : 'text-blue-university-200 group-hover:text-gold-university-300',
                            'size-6 shrink-0',
                          )}
                        />
                        {item.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
              <li className="-mx-6 mt-auto">
                <a
                  href="#"
                  onClick={handleLogout}
                  className="flex items-center gap-x-4 px-6 py-3 text-sm/6 font-semibold text-white hover:bg-blue-university-700 transition-colors"
                >
                  <div className="size-8 rounded-full bg-gold-university-600 flex items-center justify-center">
                    <span className="text-sm font-medium text-blue-university-800">
                      {user?.username.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-semibold">{user?.username}</span>
                    <span className="inline-flex items-center rounded-md px-2 py-1 text-xs font-medium bg-gold-university-100 text-gold-university-800 ring-1 ring-inset ring-gold-university-300">
                      {auth.getRoleDisplayName()}
                    </span>
                  </div>
                </a>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      <div className="sticky top-0 z-40 flex items-center gap-x-6 bg-blue-university-600 px-4 py-4 shadow-lg sm:px-6 lg:hidden">
        <button type="button" onClick={() => setSidebarOpen(true)} className="-m-2.5 p-2.5 text-blue-university-200 lg:hidden hover:text-gold-university-300 transition-colors">
          <span className="sr-only">Open sidebar</span>
          <Bars3Icon aria-hidden="true" className="size-6" />
        </button>
        <div className="flex-1 text-sm/6 font-semibold text-white">
          {currentView === 'dashboard' ? 'Dashboard' : 
           currentView === 'upsert-records' ? 'Upload Documents' : 
           currentView === 'vector-search' ? 'Vector Search' :
           currentView === 'health-check' ? 'Health Check' :
           currentView === 'users' ? 'User Management' :
           currentView === 'activity-logs' ? 'Activity Logs' :
           'Settings'}
        </div>
        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <div className="text-xs font-medium text-white">{user?.username}</div>
            <div className="inline-flex items-center rounded-md px-1.5 py-0.5 text-xs font-medium bg-gold-university-100 text-gold-university-800 ring-1 ring-inset ring-gold-university-300">
              {auth.getRoleDisplayName()}
            </div>
          </div>
          <div className="size-8 rounded-full bg-gold-university-600 flex items-center justify-center">
            <span className="text-sm font-medium text-blue-university-800">
              {user?.username.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
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
                <RecentActivity 
                  useRealData={true}
                  isLoading={dataLoading} 
                  onNavigate={setCurrentView}
                  refreshInterval={30000}
                  maxItems={5}
                />
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

          {currentView === 'users' && (
            <AuthGuard requiredRole="super_admin">
              {/* Page Header */}
              <PageHeader
                title="User Management"
                description="Manage user accounts, roles, and permissions"
                icon={<UsersIcon className="size-5 sm:size-6 text-indigo-600" />}
                className="mb-8"
              />

              {/* User Management Display */}
              <ContentContainer>
                <UserListDisplay
                  users={users}
                  loading={usersLoading}
                  error={usersError}
                  currentUser={user}
                  onRefresh={fetchUsers}
                  onUserSelect={handleUserSelect}
                  onUserEdit={handleUserEdit}
                  onUserAdd={handleUserAdd}
                />
              </ContentContainer>

              {/* User Details Modal */}
              <UserDetailsModal
                user={selectedUser}
                isOpen={showUserDetails}
                onClose={() => {
                  setShowUserDetails(false);
                  setSelectedUser(null);
                }}
                onEdit={(user) => {
                  setShowUserDetails(false);
                  handleUserEdit(user);
                }}
              />

              {/* User Edit Form */}
              <UserEditForm
                user={editingUser}
                isOpen={showUserEdit}
                onClose={() => {
                  setShowUserEdit(false);
                  setEditingUser(null);
                }}
                onSave={handleUserSave}
              />

              {/* User Add Form */}
              <UserAddForm
                isOpen={showUserAdd}
                onClose={() => setShowUserAdd(false)}
                onSuccess={handleUserCreateSuccess}
              />
            </AuthGuard>
          )}

          {currentView === 'activity-logs' && (
            <>
              {/* Page Header */}
              <PageHeader
                title="Activity Logs"
                description="Monitor system activities and user actions across the platform"
                icon={<ClipboardDocumentListIcon className="size-5 sm:size-6 text-indigo-600" />}
                className="mb-8"
              />

              {/* Activity Dashboard */}
              <ContentContainer>
                <ActivityDashboard />
              </ContentContainer>
            </>
          )}

          {currentView === 'settings' && (
            <AuthGuard requiredRole="super_admin">
              {/* Page Header */}
              <PageHeader
                title="Settings"
                description="Manage your account settings, preferences, and privacy controls"
                icon={<Cog6ToothIcon className="size-5 sm:size-6 text-indigo-600" />}
                className="mb-8"
              />

              {/* Settings Layout */}
              <SettingsLayout />
            </AuthGuard>
          )}
        </ContentContainer>
      </main>
    </div>
  );
}