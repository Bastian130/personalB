const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export interface User {
  id: string;
  email: string;
  name: string;
  cvId?: string;
  photoFilename?: string;
  photoUrl?: string;
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

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    
    // Essayer de récupérer depuis localStorage
    const tokenFromStorage = localStorage.getItem('authToken');
    if (tokenFromStorage) return tokenFromStorage;
    
    // Fallback: essayer de récupérer depuis les cookies
    const tokenFromCookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('authToken='))
      ?.split('=')[1];
    
    return tokenFromCookie || null;
  }

  private setAuthToken(token: string): void {
    if (typeof window === 'undefined') return;
    
    // Stocker dans localStorage
    localStorage.setItem('authToken', token);
    
    // Stocker également dans un cookie pour le middleware
    const maxAge = 60 * 60 * 24; // 24 heures en secondes
    document.cookie = `authToken=${token}; path=/; max-age=${maxAge}; SameSite=Strict`;
  }

  private removeAuthToken(): void {
    if (typeof window === 'undefined') return;
    
    // Supprimer du localStorage
    localStorage.removeItem('authToken');
    
    // Supprimer le cookie
    document.cookie = 'authToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Strict';
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const token = this.getAuthToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      ...options,
      headers,
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

  async uploadPhoto(file: File): Promise<{ message: string; user: User }> {
    const formData = new FormData();
    formData.append('photo', file);

    const token = this.getAuthToken();
    const headers: Record<string, string> = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}/api/auth/upload-photo`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw data as ApiError;
    }

    return data;
  }

  logout(): void {
    this.removeAuthToken();
  }

  isAuthenticated(): boolean {
    return this.getAuthToken() !== null;
  }

  async getMyCV(): Promise<CVResponse> {
    return this.request<CVResponse>('/api/cv/me');
  }

  async uploadCV(file: File): Promise<{ message: string; cv: CVResponse; extracted: boolean }> {
    const formData = new FormData();
    formData.append('cv', file);

    const token = this.getAuthToken();
    const headers: Record<string, string> = {};
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}/api/cv/upload`, {
      method: 'POST',
      headers,
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw data as ApiError;
    }

    return data;
  }

  async saveManualCV(cvData: CVData): Promise<{ message: string; cv: CVResponse }> {
    return this.request<{ message: string; cv: CVResponse }>('/api/cv/manual', {
      method: 'POST',
      body: JSON.stringify(cvData),
    });
  }

  async extractTextToCV(text: string): Promise<{ message: string; data: CVData }> {
    return this.request<{ message: string; data: CVData }>('/api/cv/extract-text', {
      method: 'POST',
      body: JSON.stringify({ text }),
    });
  }

  async deleteCV(): Promise<{ message: string }> {
    return this.request<{ message: string }>('/api/cv', {
      method: 'DELETE',
    });
  }

  async downloadCV(): Promise<Blob> {
    const token = this.getAuthToken();
    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}/api/cv/download`, {
      method: 'GET',
      headers,
    });

    if (!response.ok) {
      const data = await response.json();
      throw data as ApiError;
    }

    return response.blob();
  }

  async generatePDF(): Promise<Blob> {
    const token = this.getAuthToken();
    const headers: Record<string, string> = {};

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${this.baseUrl}/api/cv/generate-pdf`, {
      method: 'POST',
      headers,
    });

    if (!response.ok) {
      const data = await response.json();
      throw data as ApiError;
    }

    return response.blob();
  }
}

export const apiClient = new ApiClient(API_URL);
