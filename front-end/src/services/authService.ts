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
      // SimpleJWT expects `username`
      const payload = {
        username: (credentials as any).email || (credentials as any).username || '',
        password: credentials.password,
      };

      const response = await apiClient.post<any>(
        '/auth/token/',
        payload
      );

      if (response.access) {
        // Store token securely
        await StorageService.saveSecure(
          STORAGE_KEYS.AUTH_TOKEN,
          response.access
        );

        // Fetch user data
        const userResp = await apiClient.get<any>('/auth/me/');
        const sourceData = userResp?.customer || userResp?.user || userResp;
        const isStaff = userResp?.user?.is_staff || sourceData.is_staff;

        const userData = {
          ...sourceData,
          role: isStaff ? 'admin' : 'user',
          firstName: sourceData.first_name || sourceData.firstName,
          lastName: sourceData.last_name || sourceData.lastName,
          phone: sourceData.phone_number || sourceData.phone,
          address: sourceData.address,
          city: sourceData.city,
          zip_code: sourceData.zip_code,
          country: sourceData.country,
          createdAt: sourceData.created_at || sourceData.createdAt,
          updatedAt: sourceData.updated_at || sourceData.updatedAt,
        };

        // Store user data
        await StorageService.save(STORAGE_KEYS.USER_DATA, userData);

        return { token: response.access, user: userData } as AuthResponse;
      }

      throw new Error(response.detail || 'Login failed');
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  }

  /**
   * Sign up new user
   */
  async signup(signupData: SignupData): Promise<AuthResponse> {
    try {
      const payload = {
        email: signupData.email,
        password: signupData.password,
        first_name: signupData.firstName || 'User',
        last_name: signupData.lastName || 'Name',
        phone_number: signupData.phone || '0000000000',
        address: 'N/A', // Default values as frontend doesn't collect these on signup yet
        zip_code: '00000',
        city: 'N/A',
        country: 'N/A'
      };

      const response = await apiClient.post<any>(
        '/auth/register/',
        payload
      );

      if (response) {
        // Auto-login after successful registration to retrieve the token
        return await this.login({
          ...signupData,
          email: signupData.email
        } as LoginCredentials);
      }

      throw new Error(response.detail || 'Signup failed');
    } catch (error: any) {
      throw new Error(error.message || 'Signup failed');
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // No need for a logout endpoint call with simplejwt unless blacklisting

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
      const response = await apiClient.get<any>('/auth/me/');

      if (response) {
        const sourceData = response.customer || response.user || response;
        const isStaff = response.user?.is_staff || sourceData.is_staff;

        const userData = {
          ...sourceData,
          role: isStaff ? 'admin' : 'user',
          firstName: sourceData.first_name || sourceData.firstName,
          lastName: sourceData.last_name || sourceData.lastName,
          phone: sourceData.phone_number || sourceData.phone,
          address: sourceData.address,
          city: sourceData.city,
          zip_code: sourceData.zip_code,
          country: sourceData.country,
          createdAt: sourceData.created_at || sourceData.createdAt,
          updatedAt: sourceData.updated_at || sourceData.updatedAt,
        };

        await StorageService.save(STORAGE_KEYS.USER_DATA, userData);
        return userData as User;
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
      const payload: any = { ...userData };
      if (userData.firstName) payload.first_name = userData.firstName;
      if (userData.lastName) payload.last_name = userData.lastName;
      if (userData.phone) payload.phone_number = userData.phone;

      const response = await apiClient.patch<any>(
        '/auth/me/',
        payload
      );

      if (response) {
        const sourceData = response.customer || response.user || response;
        const isStaff = response.user?.is_staff || sourceData.is_staff;

        const updatedUser = {
          ...sourceData,
          role: isStaff ? 'admin' : 'user',
          firstName: sourceData.first_name || sourceData.firstName,
          lastName: sourceData.last_name || sourceData.lastName,
          phone: sourceData.phone_number || sourceData.phone,
          address: sourceData.address,
          city: sourceData.city,
          zip_code: sourceData.zip_code,
          country: sourceData.country,
          createdAt: sourceData.created_at || sourceData.createdAt,
          updatedAt: sourceData.updated_at || sourceData.updatedAt,
        };

        await StorageService.save(STORAGE_KEYS.USER_DATA, updatedUser);
        return updatedUser as User;
      }

      throw new Error('Failed to update profile');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update profile');
    }
  }
}

export default new AuthService();
