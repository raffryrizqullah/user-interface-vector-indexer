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
  static calculateStats(data: any) {
    const stats = {
      totalDocuments: 0,
      vectorRecords: 0,
      activeNamespaces: 0,
      activeUsers: 0,
      changes: {
        totalDocuments: { value: 0, type: 'increase' as const },
        vectorRecords: { value: 0, type: 'increase' as const },
        activeNamespaces: { value: 0, type: 'increase' as const },
        activeUsers: { value: 0, type: 'increase' as const }
      }
    };

    if (data.namespaceStats?.stats) {
      stats.vectorRecords = data.namespaceStats.stats.vector_count || 0;
      stats.changes.vectorRecords = {
        value: Math.floor(stats.vectorRecords * 0.1), // Simulate 10% growth
        type: 'increase'
      };
    }

    if (data.recordsList) {
      // Estimate documents from unique prefixes in vector IDs
      const uniquePrefixes = new Set(
        data.recordsList.vector_ids?.map((id: string) => 
          id.split('_')[0]
        ) || []
      );
      stats.totalDocuments = uniquePrefixes.size;
      stats.changes.totalDocuments = {
        value: Math.floor(stats.totalDocuments * 0.05), // Simulate 5% growth
        type: 'increase'
      };
    }

    if (data.users) {
      stats.activeUsers = data.users.filter((user: User) => user.is_active).length;
      stats.changes.activeUsers = {
        value: Math.floor(stats.activeUsers * 0.1),
        type: 'increase'
      };
    }

    // Static namespace count for now
    stats.activeNamespaces = 3;
    stats.changes.activeNamespaces = {
      value: 1,
      type: 'increase'
    };

    return stats;
  }
}