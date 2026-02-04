import apiClient from './apiClient';
import StorageService from '../utils/storage';
import { STORAGE_KEYS } from '../constants';
import {
  User,
  LoginCredentials,
  SignupData,
  AuthResponse,
  ApiResponse,
} from '../types';

/**
 * Authentication Service
 * Handles user authentication and token management
 */
class AuthService {
  /**
   * Login user with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>(
        '/auth/login',
        credentials
      );

      if (response.success && response.data) {
        // Store token securely
        await StorageService.saveSecure(
          STORAGE_KEYS.AUTH_TOKEN,
          response.data.token
        );
        
        // Store user data
        await StorageService.save(STORAGE_KEYS.USER_DATA, response.data.user);

        return response.data;
      }

      throw new Error(response.message || 'Login failed');
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  }

  /**
   * Sign up new user
   */
  async signup(signupData: SignupData): Promise<AuthResponse> {
    try {
      const response = await apiClient.post<ApiResponse<AuthResponse>>(
        '/auth/signup',
        signupData
      );

      if (response.success && response.data) {
        // Store token securely
        await StorageService.saveSecure(
          STORAGE_KEYS.AUTH_TOKEN,
          response.data.token
        );
        
        // Store user data
        await StorageService.save(STORAGE_KEYS.USER_DATA, response.data.user);

        return response.data;
      }

      throw new Error(response.message || 'Signup failed');
    } catch (error: any) {
      throw new Error(error.message || 'Signup failed');
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // Call logout endpoint (optional)
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout API error:', error);
    } finally {
      // Clear local data
      await StorageService.deleteSecure(STORAGE_KEYS.AUTH_TOKEN);
      await StorageService.delete(STORAGE_KEYS.USER_DATA);
      await StorageService.delete(STORAGE_KEYS.CART);
    }
  }

  /**
   * Get current user data
   */
  async getCurrentUser(): Promise<User | null> {
    return await StorageService.get<User>(STORAGE_KEYS.USER_DATA);
  }

  /**
   * Check if user is authenticated
   */
  async isAuthenticated(): Promise<boolean> {
    const token = await StorageService.getSecure(STORAGE_KEYS.AUTH_TOKEN);
    return token !== null;
  }

  /**
   * Get authentication token
   */
  async getToken(): Promise<string | null> {
    return await StorageService.getSecure(STORAGE_KEYS.AUTH_TOKEN);
  }

  /**
   * Refresh user data from server
   */
  async refreshUserData(): Promise<User> {
    try {
      const response = await apiClient.get<ApiResponse<User>>('/auth/me');
      
      if (response.success && response.data) {
        await StorageService.save(STORAGE_KEYS.USER_DATA, response.data);
        return response.data;
      }

      throw new Error('Failed to refresh user data');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to refresh user data');
    }
  }

  /**
   * Update user profile
   */
  async updateProfile(userData: Partial<User>): Promise<User> {
    try {
      const response = await apiClient.put<ApiResponse<User>>(
        '/auth/profile',
        userData
      );

      if (response.success && response.data) {
        await StorageService.save(STORAGE_KEYS.USER_DATA, response.data);
        return response.data;
      }

      throw new Error('Failed to update profile');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update profile');
    }
  }
}

export default new AuthService();
