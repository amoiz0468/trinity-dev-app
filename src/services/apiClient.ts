import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { API_CONFIG, STORAGE_KEYS, ERROR_MESSAGES } from '../constants';
import StorageService from '../utils/storage';

/**
 * API Client with JWT authentication
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_CONFIG.BASE_URL,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
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
          
          throw new Error(error.response.data?.message || 'Request failed');
        } else if (error.request) {
          // Request made but no response
          throw new Error(ERROR_MESSAGES.NETWORK_ERROR);
        } else {
          // Error in request setup
          throw new Error(error.message);
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
