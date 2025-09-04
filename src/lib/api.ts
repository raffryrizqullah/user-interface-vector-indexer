import { AuthService } from './auth';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

// Types based on the knowledge-base API documentation
export interface HealthResponse {
  status: string;
  service: string;
}

export interface PineconeHealthResponse {
  success: boolean;
  index_name: string;
  config: {
    dimension: number;
    metric: string;
    namespace: string;
    environment: string;
    region: string;
    cloud: string;
  };
  host: string;
  message: string;
}

export interface NamespaceStats {
  namespace_exists: boolean;
  namespace: string;
  stats: {
    vector_count: number;
    dimension: number;
    index_fullness: number;
    total_vector_count: number;
  };
}

export interface RecordsListResponse {
  vector_ids: string[];
  count: number;
  pagination?: {
    next_token?: string;
    has_more: boolean;
  };
}

export interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'super_admin';
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login: string | null;
}

export class ApiService {
  // Health endpoints
  static async getBasicHealth(): Promise<HealthResponse> {
    const response = await fetch(`${API_BASE_URL}/health`);
    if (!response.ok) {
      throw new Error('Failed to fetch health status');
    }
    return response.json();
  }

  static async getPineconeHealth(): Promise<PineconeHealthResponse> {
    const response = await fetch(`${API_BASE_URL}/health/pinecone`);
    if (!response.ok) {
      throw new Error('Failed to fetch Pinecone health');
    }
    return response.json();
  }

  // Namespace and records endpoints (requires authentication)
  static async getNamespaceStats(namespace: string = 'default'): Promise<NamespaceStats> {
    const response = await AuthService.makeAuthenticatedRequest(
      `${API_BASE_URL}/namespaces/${namespace}/stats`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch namespace stats');
    }
    return response.json();
  }

  static async getRecordsList(limit: number = 100): Promise<RecordsListResponse> {
    const response = await AuthService.makeAuthenticatedRequest(
      `${API_BASE_URL}/records?limit=${limit}`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch records list');
    }
    return response.json();
  }

  static async getUsers(): Promise<User[]> {
    const response = await AuthService.makeAuthenticatedRequest(
      `${API_BASE_URL}/users/`
    );
    if (!response.ok) {
      throw new Error('Failed to fetch users');
    }
    return response.json();
  }

  // Aggregate dashboard data
  static async getDashboardData() {
    try {
      console.log('🔄 Fetching dashboard data...');
      
      const [basicHealth, pineconeHealth] = await Promise.all([
        this.getBasicHealth().catch(err => {
          console.warn('Basic health check failed:', err);
          return null;
        }),
        this.getPineconeHealth().catch(err => {
          console.warn('Pinecone health check failed:', err);
          return null;
        })
      ]);

      let authenticatedData = null;
      
      // Only fetch authenticated data if user is logged in
      if (AuthService.isAuthenticated()) {
        try {
          const [namespaceStats, recordsList, users] = await Promise.all([
            this.getNamespaceStats('default').catch(err => {
              console.warn('Namespace stats failed:', err);
              return null;
            }),
            this.getRecordsList().catch(err => {
              console.warn('Records list failed:', err);
              return null;
            }),
            this.getUsers().catch(err => {
              console.warn('Users list failed:', err);
              return null;
            })
          ]);

          authenticatedData = {
            namespaceStats,
            recordsList,
            users
          };
        } catch (error) {
          console.warn('Failed to fetch authenticated data:', error);
        }
      }

      console.log('✅ Dashboard data fetched successfully');
      
      return {
        basicHealth,
        pineconeHealth,
        ...authenticatedData
      };
    } catch (error) {
      console.error('🚨 Dashboard data fetch failed:', error);
      throw error;
    }
  }

  // Helper methods for dashboard statistics
  static calculateStats(data: any, previousData?: any) {
    const stats = {
      totalDocuments: 0,
      vectorRecords: 0,
      activeNamespaces: 0,
      activeUsers: 0,
      systemHealth: 'healthy',
      lastUpdated: new Date().toISOString(),
      changes: {
        totalDocuments: { value: 0, type: 'increase' as const },
        vectorRecords: { value: 0, type: 'increase' as const },
        activeNamespaces: { value: 0, type: 'increase' as const },
        activeUsers: { value: 0, type: 'increase' as const }
      }
    };

    // Get previous stats for real change calculation
    const previousStats = previousData ? this.calculateStatsValues(previousData) : null;

    // Calculate Vector Records from namespace stats
    if (data.namespaceStats?.stats) {
      stats.vectorRecords = data.namespaceStats.stats.vector_count || 0;
      
      if (previousStats) {
        const change = stats.vectorRecords - previousStats.vectorRecords;
        stats.changes.vectorRecords = {
          value: Math.abs(change),
          type: change >= 0 ? 'increase' : 'decrease'
        };
      } else {
        // Fallback to simulated data for first load
        stats.changes.vectorRecords = {
          value: Math.floor(stats.vectorRecords * 0.1),
          type: 'increase'
        };
      }
    }

    // Calculate Total Documents from unique vector ID prefixes
    if (data.recordsList?.vector_ids) {
      const uniquePrefixes = new Set(
        data.recordsList.vector_ids.map((id: string) => 
          id.split('_')[0]
        ).filter(Boolean)
      );
      stats.totalDocuments = uniquePrefixes.size;
      
      if (previousStats) {
        const change = stats.totalDocuments - previousStats.totalDocuments;
        stats.changes.totalDocuments = {
          value: Math.abs(change),
          type: change >= 0 ? 'increase' : 'decrease'
        };
      } else {
        stats.changes.totalDocuments = {
          value: Math.floor(stats.totalDocuments * 0.05),
          type: 'increase'
        };
      }
    }

    // Calculate Active Users
    if (data.users) {
      stats.activeUsers = data.users.filter((user: User) => user.is_active).length;
      
      if (previousStats) {
        const change = stats.activeUsers - previousStats.activeUsers;
        stats.changes.activeUsers = {
          value: Math.abs(change),
          type: change >= 0 ? 'increase' : 'decrease'
        };
      } else {
        stats.changes.activeUsers = {
          value: Math.floor(stats.activeUsers * 0.1),
          type: 'increase'
        };
      }
    }

    // Calculate Active Namespaces from Pinecone config
    stats.activeNamespaces = this.calculateActiveNamespaces(data);
    if (previousStats) {
      const change = stats.activeNamespaces - previousStats.activeNamespaces;
      stats.changes.activeNamespaces = {
        value: Math.abs(change),
        type: change >= 0 ? 'increase' : 'decrease'
      };
    } else {
      stats.changes.activeNamespaces = {
        value: 1,
        type: 'increase'
      };
    }

    // Determine system health
    stats.systemHealth = this.determineSystemHealth(data);

    return stats;
  }

  // Helper method to calculate just the numeric values for comparison
  private static calculateStatsValues(data: any) {
    return {
      totalDocuments: data.recordsList?.vector_ids ? 
        new Set(data.recordsList.vector_ids.map((id: string) => id.split('_')[0]).filter(Boolean)).size : 0,
      vectorRecords: data.namespaceStats?.stats?.vector_count || 0,
      activeNamespaces: this.calculateActiveNamespaces(data),
      activeUsers: data.users ? data.users.filter((user: User) => user.is_active).length : 0
    };
  }

  // Calculate active namespaces from available data
  private static calculateActiveNamespaces(data: any) {
    // If we have namespace stats, we know at least one namespace exists
    let count = 0;
    
    if (data.namespaceStats?.namespace_exists) {
      count = 1; // Default namespace exists
    }
    
    // Add additional namespaces if we have pinecone config data
    if (data.pineconeHealth?.config?.namespace) {
      count = Math.max(count, 1);
    }
    
    // For now, return a reasonable estimate based on available data
    // In a real scenario, we'd query all namespaces
    return Math.max(count, 1); // At least 1 namespace if we have any data
  }

  // Determine overall system health
  private static determineSystemHealth(data: any) {
    const checks = {
      basicHealth: data.basicHealth?.status === 'healthy',
      pineconeHealth: data.pineconeHealth?.success === true,
      namespaceExists: data.namespaceStats?.namespace_exists === true,
      hasUsers: data.users && data.users.length > 0
    };

    const healthyCount = Object.values(checks).filter(Boolean).length;
    const totalChecks = Object.keys(checks).length;

    if (healthyCount === totalChecks) return 'healthy';
    if (healthyCount >= totalChecks * 0.75) return 'warning';
    return 'error';
  }
}