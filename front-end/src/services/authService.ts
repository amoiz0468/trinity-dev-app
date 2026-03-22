import apiClient from './apiClient';
import StorageService from '../utils/storage';
import { STORAGE_KEYS } from '../constants';
import {
  User,
  LoginCredentials,
  SignupData,
  AuthResponse,
} from '../types';

/**
 * Authentication Service
 * Handles user authentication and token management
 */
class AuthService {
  private resolveIsStaff(response: any): boolean {
    return (
      response?.user?.is_staff === true ||
      response?.customer?.user?.is_staff === true ||
      response?.customer?.is_staff === true ||
      response?.is_staff === true ||
      response?.role === 'admin'
    );
  }

  private mapUserFromResponse(response: any): User {
    const source = response?.customer || response?.user || response || {};
    const role: User['role'] = this.resolveIsStaff(response) ? 'admin' : 'user';

    return {
      ...source,
      id: String(source.id ?? response?.user?.id ?? ''),
      email:
        source.email ||
        source?.user?.email ||
        response?.user?.email ||
        source.username ||
        response?.user?.username ||
        '',
      role,
      firstName:
        source.first_name ||
        source.firstName ||
        source?.user?.first_name ||
        source?.user?.firstName ||
        response?.user?.first_name ||
        response?.user?.firstName ||
        '',
      lastName:
        source.last_name ||
        source.lastName ||
        source?.user?.last_name ||
        source?.user?.lastName ||
        response?.user?.last_name ||
        response?.user?.lastName ||
        '',
      phone: source.phone_number || source.phone,
      createdAt:
        source.created_at ||
        source.createdAt ||
        new Date().toISOString(),
      updatedAt:
        source.updated_at ||
        source.updatedAt ||
        new Date().toISOString(),
    } as User;
  }

  /**
   * Login user with email and password
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const payload = {
        username: credentials.email,
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

        const meResponse = await apiClient.get<any>('/auth/me/');
        const userData = this.mapUserFromResponse(meResponse);

        await StorageService.save(STORAGE_KEYS.USER_DATA, userData);
        return { token: response.access, user: userData };
      }

      throw new Error(response?.detail || 'Login failed');
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
        first_name: signupData.firstName,
        last_name: signupData.lastName,
        phone_number: signupData.phone || '0000000000',
        address: 'N/A',
        zip_code: '00000',
        city: 'N/A',
        country: 'N/A',
      };

      await apiClient.post<any>(
        '/auth/register/',
        payload
      );

      return await this.login({
        email: signupData.email,
        password: signupData.password,
      });
    } catch (error: any) {
      throw new Error(error.message || 'Signup failed');
    }
  }

  /**
   * Logout user
   */
  async logout(): Promise<void> {
    try {
      // No backend logout endpoint required for JWT in this app.
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
        const userData = this.mapUserFromResponse(response);
        await StorageService.save(STORAGE_KEYS.USER_DATA, userData);
        return userData;
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
      if (payload.firstName) payload.first_name = payload.firstName;
      if (payload.lastName) payload.last_name = payload.lastName;
      if (payload.phone) payload.phone_number = payload.phone;

      const response = await apiClient.patch<any>(
        '/auth/me/',
        payload
      );

      if (response) {
        const updatedUser = this.mapUserFromResponse(response);
        await StorageService.save(STORAGE_KEYS.USER_DATA, updatedUser);
        return updatedUser;
      }

      throw new Error('Failed to update profile');
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update profile');
    }
  }
}

export default new AuthService();
