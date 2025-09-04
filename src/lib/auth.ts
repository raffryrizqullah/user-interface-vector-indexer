interface LoginCredentials {
  email: string;
  password: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'super_admin';
  is_active: boolean;
  is_verified: boolean;
  created_at: string;
  last_login: string | null;
}

interface LoginResponse {
  success: boolean;
  message: string;
  user: User;
  tokens: {
    access_token: string;
    refresh_token: string;
    token_type: string;
    expires_in: number;
  };
}

interface AuthError {
  detail: string;
}

// Direct backend API calls - CORS is now configured on backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:8000';

export class AuthService {
  private static readonly ACCESS_TOKEN_KEY = 'access_token';
  private static readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private static readonly USER_KEY = 'user_data';

  static async login(credentials: LoginCredentials): Promise<LoginResponse> {
    try {
      console.log('🌐 Making API call to:', `${API_BASE_URL}/auth/login`);
      
      const response = await fetch(`${API_BASE_URL}/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      console.log('📡 API Response status:', response.status);
      
      const data = await response.json();
      console.log('📋 API Response data:', data);

      if (!response.ok) {
        console.log('❌ Login failed with error:', data);
        throw new Error((data as AuthError).detail || 'Login failed');
      }

      const loginResponse = data as LoginResponse;

      // Store tokens and user data
      if (typeof window !== 'undefined') {
        console.log('💾 Storing tokens and user data...');
        localStorage.setItem(this.ACCESS_TOKEN_KEY, loginResponse.tokens.access_token);
        localStorage.setItem(this.REFRESH_TOKEN_KEY, loginResponse.tokens.refresh_token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(loginResponse.user));
        console.log('✅ Tokens stored successfully');
      }

      return loginResponse;
    } catch (error) {
      console.error('🚨 AuthService.login error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error occurred');
    }
  }

  static async logout(): Promise<void> {
    try {
      const token = this.getAccessToken();
      
      if (token) {
        // Call logout API endpoint
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      // Ignore logout API errors, still clear local storage
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear local storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem(this.ACCESS_TOKEN_KEY);
        localStorage.removeItem(this.REFRESH_TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
      }
    }
  }

  static getAccessToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.ACCESS_TOKEN_KEY);
  }

  static getRefreshToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  static getCurrentUser(): User | null {
    if (typeof window === 'undefined') return null;
    
    const userData = localStorage.getItem(this.USER_KEY);
    if (!userData) return null;

    try {
      return JSON.parse(userData) as User;
    } catch {
      return null;
    }
  }

  static isAuthenticated(): boolean {
    const token = this.getAccessToken();
    const user = this.getCurrentUser();
    return !!(token && user);
  }

  static async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) return false;

      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      
      if (typeof window !== 'undefined') {
        localStorage.setItem(this.ACCESS_TOKEN_KEY, data.tokens.access_token);
        localStorage.setItem(this.REFRESH_TOKEN_KEY, data.tokens.refresh_token);
      }

      return true;
    } catch {
      return false;
    }
  }

  static async makeAuthenticatedRequest(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const token = this.getAccessToken();
    
    if (!token) {
      throw new Error('No access token available');
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Authorization': `Bearer ${token}`,
      },
    });

    // If unauthorized, try to refresh token
    if (response.status === 401) {
      const refreshed = await this.refreshToken();
      
      if (refreshed) {
        // Retry request with new token
        const newToken = this.getAccessToken();
        return fetch(url, {
          ...options,
          headers: {
            ...options.headers,
            'Authorization': `Bearer ${newToken}`,
          },
        });
      } else {
        // Refresh failed, logout user
        this.logout();
        throw new Error('Authentication expired');
      }
    }

    return response;
  }
}

export type { User, LoginCredentials, LoginResponse };