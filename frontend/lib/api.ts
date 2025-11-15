const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface User {
  id: string;
  email: string;
  name: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface ApiError {
  error: string;
  details?: any;
}

export interface CVData {
  name?: string;
  email?: string;
  phone?: string;
  experiences?: Array<{
    title: string;
    company: string;
    startDate: string;
    endDate?: string;
    description: string;
    current?: boolean;
  }>;
  skills?: string[];
  passions?: string[];
  education?: Array<{
    degree: string;
    school: string;
    startDate: string;
    endDate?: string;
    description?: string;
  }>;
  projects?: Array<{
    name: string;
    description: string;
    technologies?: string[];
    link?: string;
  }>;
  summary?: string;
}

export interface CVResponse {
  id: string;
  userId: string;
  type: 'uploaded' | 'manual';
  filename?: string;
  originalName?: string;
  mimeType?: string;
  size?: number;
  uploadDate?: Date;
  data?: CVData;
  createdAt: Date;
  updatedAt: Date;
}

export interface CVCreateResponse {
  message: string;
  cv: CVResponse;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
  }

  private setAuthToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('authToken', token);
  }

  private removeAuthToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('authToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getAuthToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      throw data as ApiError;
    }

    return data as T;
  }

  async register(email: string, password: string, name: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });

    this.setAuthToken(response.token);
    return response;
  }

  async login(email: string, password: string): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });

    this.setAuthToken(response.token);
    return response;
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/api/auth/me');
  }

  async createManualCV(cvData: CVData): Promise<CVCreateResponse> {
    return this.request<CVCreateResponse>('/api/cv/manual', {
      method: 'POST',
      body: JSON.stringify(cvData),
    });
  }

  async getMyCV(): Promise<CVResponse> {
    return this.request<CVResponse>('/api/cv/me');
  }

  async deleteCV(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/cv', {
      method: 'DELETE',
    });
  }

  logout(): void {
    this.removeAuthToken();
  }

  isAuthenticated(): boolean {
    return this.getAuthToken() !== null;
  }
}

export const apiClient = new ApiClient(API_URL);
