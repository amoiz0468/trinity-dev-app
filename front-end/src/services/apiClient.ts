import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG, STORAGE_KEYS, ERROR_MESSAGES } from '../constants';
import StorageService from '../utils/storage';

/**
 * API Client with JWT authentication
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    // Helps verify at runtime which backend URL the app is actually using.
    console.log(`[API] Base URL: ${API_CONFIG.BASE_URL}`);

    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private extractBackendMessage(data: any): string | null {
    if (!data) return null;

    if (typeof data === 'string') {
      return data;
    }

    const directMessage = data?.detail || data?.message || data?.error;
    if (typeof directMessage === 'string' && directMessage.trim()) {
      return directMessage;
    }

    if (Array.isArray(data) && data.length > 0) {
      const first = data[0];
      return typeof first === 'string' ? first : JSON.stringify(first);
    }

    if (typeof data === 'object') {
      for (const [field, value] of Object.entries(data)) {
        if (Array.isArray(value) && value.length > 0) {
          const first = value[0];
          if (typeof first === 'string') {
            return `${field}: ${first}`;
          }
          return `${field}: ${JSON.stringify(first)}`;
        }

        if (typeof value === 'string' && value.trim()) {
          return `${field}: ${value}`;
        }
      }
    }

    return null;
  }

  /**
   * Setup request and response interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor - Add JWT token to headers
    this.client.interceptors.request.use(
      async (config) => {
        const token = await StorageService.getSecure(STORAGE_KEYS.AUTH_TOKEN);
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor - Handle errors
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const baseURL = error.config?.baseURL || this.client.defaults.baseURL || '';
        const path = error.config?.url || '';
        const requestUrl = `${baseURL}${path}`;

        if (error.response) {
          // Server responded with error status
          const status = error.response.status;

          if (status === 401) {
            // Unauthorized - clear token and redirect to login
            await StorageService.deleteSecure(STORAGE_KEYS.AUTH_TOKEN);
            await StorageService.delete(STORAGE_KEYS.USER_DATA);
            throw new Error(ERROR_MESSAGES.SESSION_EXPIRED);
          } else if (status === 404) {
            throw new Error('Resource not found');
          } else if (status >= 500) {
            throw new Error(ERROR_MESSAGES.SERVER_ERROR);
          }
          
          const backendMessage = this.extractBackendMessage(error.response.data);
          throw new Error(backendMessage || `Request failed (${requestUrl})`);
        } else if (error.request) {
          // Request made but no response
          throw new Error(`${ERROR_MESSAGES.NETWORK_ERROR} (${requestUrl})`);
        } else {
          throw new Error(error.message || 'Unknown request error');
        }
      }
    );
  }

  /**
   * Generic GET request
   */
  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.get(url, config);
    return response.data;
  }

  /**
   * Generic POST request
   */
  async post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.post(url, data, config);
    return response.data;
  }

  /**
   * Generic PUT request
   */
  async put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.put(url, data, config);
    return response.data;
  }

  /**
   * Generic DELETE request
   */
  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.delete(url, config);
    return response.data;
  }

  /**
   * Generic PATCH request
   */
  async patch<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    const response: AxiosResponse<T> = await this.client.patch(url, data, config);
    return response.data;
  }
}

export default new ApiClient();
