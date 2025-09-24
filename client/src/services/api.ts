import axios from 'axios';
import { auth } from '../config/firebase';

// API configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

// Create axios instance
const apiClient: any = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  async (config: any) => {
    try {
      const user = auth.currentUser;
      if (user) {
        const token = await user.getIdToken();
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.warn('Failed to get auth token:', error);
    }
    return config;
  },
  (error: any) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response: any) => response,
  (error: any) => {
    if (error.response?.status === 401) {
      // Handle unauthorized - could redirect to login
      console.warn('Unauthorized request - user may need to re-authenticate');
    }
    
    // Transform error for consistent handling
    const apiError = {
      message: error.response?.data?.message || error.message || 'An error occurred',
      status: error.response?.status,
      details: error.response?.data?.details,
    };
    
    return Promise.reject(apiError);
  }
);

// API service class
class ApiService {
  // Auth endpoints
  async validateToken() {
    const response = await apiClient.post('/auth/token');
    return response.data;
  }

  async getProfile() {
    const response = await apiClient.get('/auth/profile');
    return response.data;
  }

  async updateProfile(data: { displayName?: string; avatarURL?: string }) {
    const response = await apiClient.put('/auth/profile', data);
    return response.data;
  }

  async registerUser(displayName?: string) {
    console.log('API: Registering user with displayName:', displayName);
    const requestBody = { displayName };
    console.log('API: Request body:', requestBody);
    const response = await apiClient.post('/auth/register', requestBody);
    console.log('API: Registration response:', response.data);
    return response.data;
  }

  async deleteAccount() {
    const response = await apiClient.delete('/auth/account');
    return response.data;
  }

  // Posts endpoints
  async getPosts(params: {
    mode?: 'date' | 'attraction' | 'controversy';
    timeWindow?: '24h' | '7d' | '30d' | 'all';
    tags?: string[];
    limit?: number;
    pageToken?: string;
    sortOrder?: 'asc' | 'desc';
  } = {}) {
    const response = await apiClient.get('/posts', { params });
    return response.data;
  }


  async createPost(data: {
    title: string;
    body?: string;
    tags: string[];
    isAnonymous?: boolean;
  }) {
    const response = await apiClient.post('/posts', data);
    return response.data;
  }

  async voteOnPost(postId: string, vote: 'yes' | 'no') {
    const response = await apiClient.post(`/posts/${postId}/vote`, { vote });
    return response.data;
  }

  async deletePost(postId: string) {
    const response = await apiClient.delete(`/posts/${postId}`);
    return response.data;
  }

  async getPostStats(postId: string) {
    const response = await apiClient.get(`/posts/${postId}/stats`);
    return response.data;
  }

  // Categories endpoints
  async getCategories() {
    const response = await apiClient.get('/posts/categories');
    return response.data;
  }

  async getCategoryStats(categoryId: string) {
    const response = await apiClient.get(`/posts/categories/${categoryId}/stats`);
    return response.data;
  }

  // Reports endpoints
  async submitReport(data: {
    type: 'post' | 'user';
    targetId: string;
    reason: 'spam' | 'harassment' | 'inappropriate' | 'misinformation' | 'other';
    description?: string;
  }) {
    const response = await apiClient.post('/report', data);
    return response.data;
  }

  async getMyReports(params: { limit?: number; pageToken?: string } = {}) {
    const response = await apiClient.get('/report/my-reports', { params });
    return response.data;
  }

  async cancelReport(reportId: string) {
    const response = await apiClient.delete(`/report/${reportId}`);
    return response.data;
  }

  async getReportReasons() {
    const response = await apiClient.get('/report/reasons');
    return response.data;
  }

  // Admin endpoints
  async getAdminStats() {
    const response = await apiClient.get('/admin/stats');
    return response.data;
  }

  async getUsers(params: { limit?: number; pageToken?: string } = {}) {
    const response = await apiClient.get('/admin/users', { params });
    return response.data;
  }

  async getUser(uid: string) {
    const response = await apiClient.get(`/admin/users/${uid}`);
    return response.data;
  }

  async banUser(uid: string, reason: string) {
    const response = await apiClient.post(`/admin/users/${uid}/ban`, { reason });
    return response.data;
  }

  async unbanUser(uid: string) {
    const response = await apiClient.post(`/admin/users/${uid}/unban`);
    return response.data;
  }

  async updateUserRole(uid: string, role: 'user' | 'admin') {
    const response = await apiClient.put(`/admin/users/${uid}/role`, { role });
    return response.data;
  }

  async adminDeletePost(postId: string, reason?: string) {
    const response = await apiClient.delete(`/admin/posts/${postId}`, {
      data: { reason }
    });
    return response.data;
  }

  async getReports(params: {
    status?: 'pending' | 'resolved' | 'dismissed';
    limit?: number;
    pageToken?: string;
  } = {}) {
    const response = await apiClient.get('/admin/reports', { params });
    return response.data;
  }

  async updateReportStatus(reportId: string, status: 'pending' | 'resolved' | 'dismissed', resolution?: string) {
    const response = await apiClient.put(`/admin/reports/${reportId}/status`, {
      status,
      resolution
    });
    return response.data;
  }

  async createCategory(data: { name: string; description?: string; color?: string }) {
    const response = await apiClient.post('/admin/categories', data);
    return response.data;
  }

  async updateCategory(categoryId: string, data: { name?: string; description?: string; color?: string }) {
    const response = await apiClient.put(`/admin/categories/${categoryId}`, data);
    return response.data;
  }

  async deleteCategory(categoryId: string) {
    const response = await apiClient.delete(`/admin/categories/${categoryId}`);
    return response.data;
  }

  // Health check
  async healthCheck() {
    const response = await apiClient.get('/health');
    return response.data;
  }
}

// Export singleton instance
export const apiService = new ApiService();
export default apiService;

// Export types
export interface ApiError {
  message: string;
  status?: number;
  details?: any;
}

export interface User {
  uid: string;
  email: string;
  displayName: string;
  avatarURL?: string;
  role: 'user' | 'admin';
  isBanned: boolean;
  createdAt: Date;
  postCount?: number;
  voteCount?: number;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  color: string;
  postCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Post {
  id: string;
  title: string;
  body?: string;
  categoryId?: string; // Made optional since we're removing categories
  authorUid: string;
  authorDisplayName?: string; // Added author display name
  authorAvatarURL?: string; // Added author avatar URL
  tags?: string[]; // Keep tags for display purposes
  createdAt: Date;
  updatedAt: Date;
  voteCount: number;
  yesCount: number;
  noCount: number;
  reportCount: number;
  isDeleted: boolean;
  userVote?: 'yes' | 'no' | null;
  yesPercentage?: number;
  noPercentage?: number;
  controversyScore?: number;
  isAnonymous?: boolean;
}

export interface Vote {
  id: string;
  postId: string;
  userUid: string;
  vote: 'yes' | 'no';
  createdAt: Date;
}

export interface Report {
  id: string;
  type: 'post' | 'user';
  targetId: string;
  reason: 'spam' | 'harassment' | 'inappropriate' | 'misinformation' | 'other';
  description?: string;
  reporterUid: string;
  status: 'pending' | 'resolved' | 'dismissed';
  createdAt: Date;
  targetInfo?: any;
}
