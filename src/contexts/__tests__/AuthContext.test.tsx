import React from 'react';
import { render, waitFor } from '@testing-library/react-native';
import { AuthProvider, useAuth } from '../AuthContext';
import { Text } from 'react-native';

// Mock AsyncStorage and SecureStore
jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

jest.mock('@react-native-async-storage/async-storage', () => ({
  setItem: jest.fn(),
  getItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
}));

// Mock auth service
jest.mock('../../services/authService', () => ({
  __esModule: true,
  default: {
    login: jest.fn(),
    signup: jest.fn(),
    logout: jest.fn(),
    isAuthenticated: jest.fn(() => Promise.resolve(false)),
    getCurrentUser: jest.fn(() => Promise.resolve(null)),
  },
}));

describe('AuthContext', () => {
  it('provides auth context to children', async () => {
    const TestComponent = () => {
      const { isAuthenticated, isLoading } = useAuth();
      return (
        <>
          <Text>Auth: {isAuthenticated.toString()}</Text>
          <Text>Loading: {isLoading.toString()}</Text>
        </>
      );
    };

    const { getByText } = render(
      <AuthProvider>
        <TestComponent />
      </AuthProvider>
    );

    await waitFor(() => {
      expect(getByText('Loading: false')).toBeTruthy();
    });
  });

  it('throws error when useAuth is used outside AuthProvider', () => {
    const TestComponent = () => {
      try {
        useAuth();
        return <Text>Should not render</Text>;
      } catch (error: any) {
        return <Text>{error.message}</Text>;
      }
    };

    const { getByText } = render(<TestComponent />);
    expect(getByText('useAuth must be used within an AuthProvider')).toBeTruthy();
  });
});
