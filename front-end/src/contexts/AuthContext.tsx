import React, { createContext, useState, useContext, useEffect, ReactNode } from 'react';
import { User, LoginCredentials, SignupData } from '../types';
import AuthService from '../services/authService';
import { API_CONFIG } from '../constants';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  signup: (signupData: SignupData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      if (!API_CONFIG.USE_MOCK_DATA) {
        const authenticated = await AuthService.isAuthenticated();
        if (authenticated) {
          try {
            // Always refresh from backend to avoid stale role data in local storage.
            const userData = await AuthService.refreshUserData();
            setUser(userData);
            setIsAuthenticated(true);
          } catch {
            await AuthService.logout();
            setUser(null);
            setIsAuthenticated(false);
          }
        }
      } else {
        // In mock mode, we could still check storage if we wanted persistence, 
        // but for now let's just stay as is or handle mock persistence
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials) => {
    try {
      if (!API_CONFIG.USE_MOCK_DATA) {
        const response = await AuthService.login(credentials);
        setUser(response.user);
        setIsAuthenticated(true);
        return;
      }

      // Strict Admin Login Logic for Mock
      const isAdmin = credentials.email === 'admin@admin.com' && credentials.password === 'admin123';

      const mockUser: User = {
        id: isAdmin ? 'admin-id' : 'user-id',
        email: credentials.email,
        firstName: isAdmin ? 'Admin' : 'Test',
        lastName: isAdmin ? 'User' : 'User',
        phone: '1234567890',
        role: isAdmin ? 'admin' : 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      setUser(mockUser);
      setIsAuthenticated(true);
    } catch (error) {
      throw error;
    }
  };

  const signup = async (signupData: SignupData) => {
    try {
      if (!API_CONFIG.USE_MOCK_DATA) {
        const response = await AuthService.signup(signupData);
        setUser(response.user);
        setIsAuthenticated(true);
        return;
      }

      // Mock user for development
      const mockUser: User = {
        id: 'temp-user-id',
        email: signupData.email,
        firstName: signupData.firstName,
        lastName: signupData.lastName,
        phone: signupData.phone,
        role: 'user',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUser(mockUser);
      setIsAuthenticated(true);
    } catch (error) {
      throw error;
    }
  };

  const logout = async () => {
    try {
      await AuthService.logout();
      setUser(null);
      setIsAuthenticated(false);
    } catch (error) {
      console.error('Error logging out:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const userData = await AuthService.refreshUserData();
      setUser(userData);
    } catch (error) {
      console.error('Error refreshing user:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        signup,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
